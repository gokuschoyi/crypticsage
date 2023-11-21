const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))
const IUtil = require('../utils/indicatorUtil');
const TFMUtil = require('../utils/tf_modelUtil');
// @ts-ignore
var talib = require('talib/build/Release/talib')
const { v4: uuidv4 } = require('uuid');
const { Queue, Worker } = require('bullmq');
const { redisClient } = require('../services/redis')
const connection = redisClient // Create a Redis connection

const { createTimer } = require('../utils/timer')

const { getValuesFromRedis } = require('../utils/redis_util');
const { fetchEntireHistDataFromDb } = require('../services/mongoDBServices')
const TF_Model = require('../utils/tf_model')
const fs = require('fs')
const MDBServices = require('../services/mongoDBServices')

const tf = require('@tensorflow/tfjs-node');
const path = require('path');


const e_type = {
    "open": 0,
    "high": 1,
    "low": 2,
    "close": 3,
}

const getIndicatorDesc = async (req, res) => {
    log.info("TALib Version: " + talib.version);
    var functions = talib.functions;
    var totalFunctionCount = 0;
    var funcDesc = talib.explain("ADX");
    const excludeList = ["AVGDEV", "IMI"]
    const functionsWithSplitPane = [
        "BETA"
        , "CORREL"
        , "LINEARREG_ANGLE"
        , "LINEARREG_SLOPE"
        , "STDDEV"
        , "VAR"
        , "AD"
        , "ADOSC"
        , "OBV"
        , "HT_DCPERIOD"
        , "HT_DCPHASE"
        , "HT_PHASOR"
        , "HT_SINE"
        , "HT_TRENDMODE"
        , "ADX"
        , "ADXR"
        , "APO"
        , "AROON"
        , "AROONOSC"
        , "BOP"
        , "CCI"
        , "CMO"
        , "DX"
        , "MACD"
        , "MACDEXT"
        , "MACDFIX"
        , "MFI"
        , "MINUS_DI"
        , "MINUS_DM"
        , "MOM"
        , "PLUS_DI"
        , "PLUS_DI"
        , "PPO"
        , "ROC"
        , "ROCP"
        , "ROCR"
        , "ROCR100"
        , "RSI"
        , "STOCH"
        , "STOCHF"
        , "STOCHRSI"
        , "TRIX"
        , "ULTOSC"
        , "WILLR"
        , "ATR"
        , "NATR"
        , "TRANGE"
    ]

    let desc = []
    functions.forEach((func) => {
        if (!excludeList.includes(func.name)) {
            totalFunctionCount++;
            desc.push(func);
        }
    });

    const updatedDesc = desc.map((func) => {
        if (functionsWithSplitPane.includes(func.name)) {
            return {
                ...func,
                splitPane: true
            }
        } else {
            return {
                ...func,
                splitPane: false
            }
        }
    })

    desc = updatedDesc.map((func) => {
        const { inputs, optInputs } = func
        const modifiedInputs = inputs.map((input) => {
            if (!input.flags) {
                return {
                    value: '',
                    errorFlag: false,
                    helperText: '',
                    ...input,
                };
            } else {
                const converted = {};
                Object.keys(input.flags).forEach((key) => {
                    // console.log(input.flags[key]);
                    converted[input.flags[key]] = 'data key';
                });

                // Merge the converted properties with the original input
                return {
                    ...input,
                    ...converted,
                };
            }
        });

        const modifiedOptionalInputs = optInputs.map((input) => {
            return {
                ...input,
                errorFlag: false,
                helperText: '',
            }
        })

        return {
            ...func,
            inputs: modifiedInputs,
            optInputs: modifiedOptionalInputs,
            function_selected_flag: false,
        }
    })

    const grouped = desc.reduce((result, func) => {
        if (!result[func.group]) {
            result[func.group] = { group_name: func.group, functions: [func] }
        } else {
            result[func.group].functions.push(func)
        }
        return result
    }, {})
    desc = Object.values(grouped)
    // log.info({ totalFunctionCount, funcDesc })
    res.status(200).json({ message: 'talib desc', desc })
}

const executeTalibFunction = async (req, res) => {
    const { db_query, func_query, func_param_input_keys, func_param_optional_input_keys, func_param_output_keys } = req.body.payload;
    const { asset_type, ticker_name, period, fetch_count } = db_query;

    const cacheKey = `${asset_type}-${ticker_name}-${period}`;
    const tokenDataFromRedisObj = await getValuesFromRedis(cacheKey);
    // log.info(tokenDataFromRedisObj)
    const tokenDataFromRedis = tokenDataFromRedisObj.data

    if (tokenDataFromRedis.ticker_data.length > fetch_count) {
        log.info('Slicing the ticker data as request length is less that redis length')
        tokenDataFromRedis.ticker_data = tokenDataFromRedis.ticker_data.slice(tokenDataFromRedis.ticker_data.length - 1 - fetch_count, tokenDataFromRedis.ticker_data.length)
    }

    // validates the optional input data
    let validatedInputData = IUtil.validateOptionalInputData({ func_query, opt_input_keys: func_param_optional_input_keys })

    // all data requreid for the function
    let processed = IUtil.processInputData({ ticker_data: tokenDataFromRedis.ticker_data, func_input_keys: func_param_input_keys })

    // final query to be executed
    let finalFuncQuery = IUtil.addDataToFuncQuery({ func_query: validatedInputData, processed_data: processed })

    // execute the talib function
    const t = createTimer("Talib Function Execution")
    t.startTimer()
    var talResult;
    try {
        log.info('Executing talib function')
        talResult = talib.execute(finalFuncQuery)
    } catch (e) {
        log.error(e)
        res.status(400).json({ message: "Execute Talib Function request error" })
    }

    // format the output data
    const { final_res, diff } = IUtil.formatOutputs({
        ticker_data: tokenDataFromRedis.ticker_data,
        talib_result: talResult,
        output_keys: func_param_output_keys
    })

    t.stopTimer(__filename.slice(__dirname.length + 1))

    const info = {
        func_name: func_query.name,
        diff: diff,
        output_keys: func_param_output_keys,
    }

    res.status(200).json({ message: "Execute Talib Function request success", result: final_res, info })
}

const procssModelTraining = async (req, res) => {
    const { fTalibExecuteQuery, model_training_parameters } = req.body.payload
    const model_id = uuidv4();
    log.info(`Starting model training with id : ${model_id}`)
    const model_training_queue = "MODEL_TRAINING_QUEUE"
    const job_name = "MODEL_TRAINING_JOB_" + model_id
    try {
        const model_queue = new Queue(model_training_queue, { connection });

        const modelTrainingProcessorFile = path.join(__dirname, '../workers/modelTrainer')
        console.log('modelTrainingProcessorFile : ', modelTrainingProcessorFile)
        const model_worker = new Worker(model_training_queue, startModelTraining, { connection, maxStalledCount: 3 });

        const modelTrainingCompletedListener = (job) => {
            log.info(`Model Training Completed ${job.id}`)
            // model_queue.close()
            model_worker.close()
            model_worker.removeListener('completed', modelTrainingCompletedListener)
        }

        const modelTrainingFailedListener = (job) => {
            const redisCommand = `hgetall bull:${model_training_queue}:${job.id}`
            log.error(`Update task failed for : ", ${job.name}, " with id : ", ${job.id}`)
            log.warn(`Check Redis for more info : ", ${redisCommand}`)
            TF_Model.eventEmitter.emit('error', { message: "Error in training model." })
        }

        model_worker.on('completed', modelTrainingCompletedListener)
        model_worker.on('failed', modelTrainingFailedListener)

        model_worker.on('error', (error) => {
            log.error(error.stack)
        })

        await model_queue.add(
            job_name,
            { fTalibExecuteQuery, model_training_parameters, model_id },
            {
                removeOnComplete: {
                    age: 3600, // keep up to 1 min
                    count: 1000, // keep up to 1000 jobs
                },
                removeOnFail: {
                    age: 3600, // keep up to 1 min
                },
                jobId: model_id,
            }
        )

        const isActive = model_worker.isRunning();
        if (isActive) {
            const message = "Model Training started"
            res.status(200).json({ message, finalRs: [], job_id: model_id });
        } else {
            model_worker.run()
            const message = "Model Training started"
            res.status(200).json({ message, finalRs: [], job_id: model_id });
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }

}

const startModelTraining = async (job) => {
    const { fTalibExecuteQuery, model_training_parameters, model_id } = job.data
    const { db_query } = fTalibExecuteQuery[0].payload;
    const { asset_type, ticker_name, period } = db_query;
    // Model parameters
    const {
        training_size,
        time_step,
        look_ahead,
        epochs: epochCount,
        batchSize,
        hidden_layers,
        learning_rate,
        to_predict,
        model_type
    } = model_training_parameters
    console.log('Model parameters : ', model_training_parameters)

    log.alert('----> Step 1 : Fetching the ticker data from db') // oldest first 
    const tickerHistory = await fetchEntireHistDataFromDb(asset_type, ticker_name, period)
    const tickerHistoryLength = tickerHistory.length
    TF_Model.eventEmitter.emit('notify', { message: `----> Fetched ${tickerHistoryLength} tickers from db...`, latestData: tickerHistory[tickerHistoryLength - 1] })


    TF_Model.eventEmitter.emit('notify', { message: "----> Executing selected functions..." })
    log.alert('----> Step 2 : Executing the talib functions')
    let finalTalibRes = await TFMUtil.processSelectedFunctionsForModelTraining({ selectedFunctions: fTalibExecuteQuery, tickerHistory: tickerHistory })
    TF_Model.eventEmitter.emit('notify', { message: `----> Function execution completed...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Finding smallest array to adjust ticker hist and function data..." })
    log.alert('----> Step 3 : Finding smallest array to adjust ticker hist and function data')
    const [tickerHist, finalTalibResult] = await TFMUtil.trimDataBasedOnTalibSmallestLength({ finalTalibResult: finalTalibRes, tickerHistory })
    TF_Model.eventEmitter.emit('notify', { message: `----> Trimmed data based on talib smallest length...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Transforming and combining the OHLCV and function data for model training..." })
    log.alert('----> Step 4 : Transforming and combining the data to required format for model training')
    const features = await TFMUtil.transformDataToRequiredShape({ tickerHist, finalTalibResult })
    TF_Model.eventEmitter.emit('notify', { message: `----> Transformed data to required shape...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Standardizing the data..." })
    log.alert('----> Step 5 : Standardizing the data')
    let [stdData, label_mean, label_variance] = TFMUtil.standardizeData(model_type, features, to_predict)
    TF_Model.eventEmitter.emit('notify', { message: `----> Data standardized...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Creating the training data..." })
    log.alert('----> Step 6 : Transforming and creating the training data')
    const [trainSplit, xTrain, yTrain, xTrainTest, lastSets, yTrainTest] = await TFMUtil.createTrainingData(
        {
            model_type,
            stdData,
            timeStep: time_step,
            lookAhead: look_ahead,
            e_key: to_predict,
            training_size
        })
    TF_Model.eventEmitter.emit('notify', { message: `----> Training data created...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Generating dates for test set data..." })
    log.alert('----> Step 7 : Getting dates and verifying correctness')
    const dates = TFMUtil.getDateRangeForTestSet(tickerHist, trainSplit, time_step, look_ahead, yTrainTest, label_mean, label_variance)


    TF_Model.eventEmitter.emit('notify', { message: "----> Creating the model..." })
    log.alert('----> Step 8 : Creating the model')
    const input_layer_shape = time_step; // look back date
    const input_layer_neurons = 64;
    const rnn_output_neurons = 16;
    const output_layer_neurons = yTrain[0].length;
    const feature_count = xTrain[0][0].length;
    const n_layers = hidden_layers;

    const model_parama = {
        model_type,
        input_layer_shape,
        look_ahead,
        feature_count,
        input_layer_neurons,
        rnn_output_neurons,
        output_layer_neurons,
        n_layers
    }

    const model_ = TF_Model.createModel(model_parama)
    TF_Model.eventEmitter.emit('notify', { message: `----> TF Model created...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Training the model..." })
    log.alert('----> Step 9 : Training the model')
    const epochs = epochCount;
    const [trained_model_, history] = await TF_Model.trainModel(model_, learning_rate, xTrain, yTrain, epochs, batchSize)
    // console.log(history)
    TF_Model.eventEmitter.emit('notify', { message: `----> TF Model trained...` })


    log.alert('----> Step 10 : Evaluating the model on test set')
    TF_Model.eventEmitter.emit('notify', { message: "----> Evaluating the model on test set..." })
    // @ts-ignore
    let xHistory = xTrain.slice(-1)
    const evaluationData = [...xHistory, ...xTrainTest, ...lastSets]
    await TF_Model.evaluateModelOnTestSet(trained_model_, model_id, evaluationData, yTrainTest, dates, label_mean, label_variance)
    TF_Model.eventEmitter.emit('notify', { message: `----> TF Model evaluation completed...` })


    log.alert('----> Step 11 : Saving the model and weights  and disposing it ')
    await TF_Model.saveModel(trained_model_, model_id)

    return 'Model Training Completed'
}

const getModel = async (req, res) => {
    const { user_id } = req.body
    try {
        const models = await MDBServices.fetchUserModels(user_id)
        res.status(200).json({ message: 'Model fetched successfully', models })
    } catch (err) {
        log.error(err.stack)
        res.status(400).json({ message: 'Model fetching failed' })
    }
}

const saveModel = async (req, res) => {
    const { model_id, model_name, ticker_name, ticker_period, predicted_result, talibExecuteQueries, training_parameters } = req.body.payload
    try {
        const uid = res.locals.data.uid;
        const model_data = {
            training_parameters,
            talibExecuteQueries,
            predicted_result,
        }
        const [model_save_status, modelSaveResult] = await MDBServices.saveModelForUser(uid, ticker_name, ticker_period, model_id, model_name, model_data)
        res.status(200).json({ message: 'Model saved successfully', model_save_status, modelSaveResult, user_id: uid })
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Model saving failed' })
    }
}

const deleteModel = async (req, res) => {
    const { model_id } = req.body
    try {
        const deleted = await deleteModelFromLocalDirectory(model_id)
        if (deleted) {
            res.status(200).json({ message: 'Model deleted successfully' })
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Model deletion failed' })
    }
    //backend/models/0fb70a60-8a62-443f-bfb5-2090e5742957
}

const deleteUserModel = async (req, res) => {
    try {
        const { model_id } = req.body
        const uid = res.locals.data.uid;
        const user_model_deleted = await MDBServices.deleteUserModel(uid, model_id)
        const deleted = await deleteModelFromLocalDirectory(model_id)
        if (deleted && user_model_deleted) {
            res.status(200).json({ message: 'Model deleted successfully' })
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Model deletion failed' })

    }
}

const deleteModelFromLocalDirectory = async (model_id) => {
    try {
        const path = `./models/${model_id}` // delete a directory in models with the foldername as model_id us fs
        fs.rm(path, { recursive: true }, (err) => {
            if (err) {
                throw err;
            }
            log.info(`Removed model ${model_id}`)
        });
        return true
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}


function calculateRMSE(actual, predicted) {
    // Check if the dimensions of actual and predicted arrays match
    if (
        actual.length !== predicted.length ||
        actual[0].length !== predicted[0].length ||
        actual[0][0].length !== predicted[0][0].length
    ) {
        throw new Error("Array dimensions do not match.");
    }

    // Initialize variables for sum of squared differences and total count
    let squaredDifferencesSum = 0;
    let totalCount = 0;

    // Loop through the arrays to calculate the RMSE
    for (let i = 0; i < actual.length; i++) {
        for (let j = 0; j < actual[i].length; j++) {
            for (let k = 0; k < actual[i][j].length; k++) {
                const diff = actual[i][j][k] - predicted[i][j][k];
                squaredDifferencesSum += diff * diff;
                totalCount++;
            }
        }
    }

    // Calculate the mean squared difference and then the RMSE
    const meanSquaredDifference = squaredDifferencesSum / totalCount;
    const rmse = Math.sqrt(meanSquaredDifference);

    return rmse;
}

const generateTestData = async (req, res) => {
    let { timeStep, lookAhead } = req.body
    lookAhead = lookAhead
    try {

        const testArray =
            [[10, 15, 25],
            [20, 25, 45],
            [30, 35, 65],
            [40, 45, 85],
            [50, 55, 105],
            [60, 65, 125],
            [70, 75, 145],
            [80, 85, 165],
            [90, 95, 185],
            [100, 105, 205],
            [105, 110, 215],
            ]
        const trainX = []
        const trainY = []

        let simulatedData = [];
        for (let i = 0; i < 30; i++) {
            simulatedData.push({
                openTime: Date.now() + i * 3600000, // hourly timestamps
                open: Math.random() * 100,
                high: Math.random() * 100,
                low: Math.random() * 100,
                close: Math.random() * 100,
                volume: Math.random() * 1000
            });
        }

        let features = simulatedData.map(item => [item.open, item.high, item.low, item.close, item.volume]);
        console.log(features[features.length - (lookAhead + 1)])

        /* for (let i = 0; i <= testArray.length - timeStep - lookAhead; i++) {
            // Extracting features for X
            let x = testArray.slice(i, i + timeStep).map(step => step.slice(0, -1));
            
            // Extracting labels for Y
            let y = [];
            for (let j = i + timeStep; j < i + timeStep + lookAhead; j++) {
                y.push([testArray[j][testArray[j].length - 1]]);
            }
    
            trainX.push(x);
            trainY.push(y);
        } */

        /* for (let i = timeStep; i <= testArray.length - lookAhead + 1; i++) {
            trainX.push(testArray.slice(i - timeStep, i))
            trainY.push(testArray.slice(i, i + lookAhead - 1).map((row) => [row[2]]))
        } */

        // console.log(str)
        /* console.log(trainX)
        console.log(trainY) */

        /* let tensorX = tf.tensor(trainX)
        let tensorY = tf.tensor(trainY)

        console.log(testArray.length)
        console.log(testArray.length - timeStep - lookAhead + 1)
        console.log(tensorX.shape)
        console.log(tensorY.shape) */

        const [trainSplit, xTrain, yTrain, xTrainTest, lastSets, yTrainTest] = await TFMUtil.createTrainingData(
            {
                model_type: 'multi_input_single_output_step',
                stdData: features,
                timeStep: timeStep,
                lookAhead: lookAhead,
                e_key: 'low',
                training_size: 80
            })

        /* console.log(xTrain[0])
        console.log(yTrain[0])
        console.log(yTrainTest[0]) */

        // @ts-ignore
        // console.log(xTrainTest[xTrainTest.length - 1])
        // console.log(features)
        console.table(features)

        let lastSetStr = ''
        // @ts-ignore
        lastSets.forEach((element, index) => {
            element.forEach((row, ind) => {
                let rowStr = ''
                if (ind === element.length - 1) {
                    rowStr += row.join(', ') + '\n' + '\n'
                } else {
                    rowStr = row.join(', ') + '\n'
                }
                lastSetStr += rowStr
            })
        })

        console.log(lastSetStr)

        let strX = ''
        // @ts-ignore
        xTrain.forEach((element, index) => {
            element.forEach((row, ind) => {
                let rowStr = ''
                if (ind === element.length - 1) {
                    rowStr += row.join(', ') + ` - ${yTrain[index]}` + '\n' + '\n'
                } else {
                    rowStr = row.join(', ') + '\n'
                }
                strX += rowStr
            })
        })

        // console.log(strX)

        let strXT = ''
        // @ts-ignore
        xTrainTest.forEach((element, index) => {
            element.forEach((row, ind) => {
                let rowStr = ''
                if (ind === element.length - 1) {
                    rowStr += row.join(', ') + ` - ${yTrainTest[index]}` + '\n' + '\n'
                } else {
                    rowStr = row.join(', ') + '\n'
                }
                strXT += rowStr
            })
        })

        // console.log(strXT)


        const act = [
            [0.9313037991523743],
            [0.9217190742492676],
            [0.9200571179389954],
            [0.9195137023925781],
            [0.9114740490913391]
        ]

        const pred = [
            [0.7829376459121704],
            [0.9296842813491821],
            [0.9347333908081055],
            [0.920935869216919],
            [0.9096674919128418]
        ]

        /* const act =[
            [1],
            [2],
            [3]
            7/11 7PM : act : 34627.83, pred :  35219.68  -591.85
            7/11 11PM : act : 34721.23, pred : 35296.62  -575.39
            8/11 3AM : act : 35453.98, pred : 35347.19   106.79
            8/11 7AM : act : 35399.12, pred : 35341.42   57.7
            8/11 11AM : act : 35269.68, pred : 35314.25  -44.57
        ]

        const pred =[
            [0.499192],
            [1.99],
            [2.99]
        ] */

        const actual = [
            [
                [0.9350184202194214],
                [0.9322802424430847],
                [0.938884437084198],
                [0.9322348237037659],
                [0.957306981086731],
                [0.95747971534729],
                [1.0089547634124756]
            ],
            [
                [0.6027020215988159],
                [0.8523806929588318],
                [0.9281507134437561],
                [0.9427933096885681],
                [0.9405898451805115],
                [0.9360988736152649],
                [0.9328845739364624]
            ]
        ];
        const predicted = [
            [
                [0.6027020215988159],
                [0.8523806929588318],
                [0.9281507134437561],
                [0.9427933096885681],
                [0.9405898451805115],
                [0.9360988736152649],
                [0.9328845739364624]
            ],
            [
                [0.5892080068588257],
                [0.8353583812713623],
                [0.9115362763404846],
                [0.9267987608909607],
                [0.9250696301460266],
                [0.9208111763000488],
                [0.9176720976829529]
            ]
        ]


        /* const frmse = calculateRMSE(actual, predicted);
        console.log("FunctionRMSE:", frmse);

        let act_tensor = tf.tensor(actual)
        let pred_tensor = tf.tensor(predicted)


        console.log(act_tensor.shape)
        console.log(pred_tensor.shape)

        let mse = tf.losses.meanSquaredError(act_tensor, pred_tensor)

        console.log(mse.arraySync())

        let rmse = tf.sqrt(mse)

        console.log(rmse.arraySync())

        let lstm_cells = [];
        for (let index = 0; index < 4; index++) {
            lstm_cells.push(tf.layers.lstmCell({ units: 16 }));
        } */

        /* const model = tf.sequential();
        model.add(tf.layers.lstm({ units: 50, activation: 'relu', inputShape: [24, 10] }));
        model.add(tf.layers.repeatVector({ n: 7 }));
        model.add(tf.layers.lstm({ units: 50, activation: 'relu', returnSequences: true }));
        model.add(tf.layers.rnn({
            cell: lstm_cells,
            inputShape: [7, 50],
            returnSequences: true
        }));
        model.add(tf.layers.timeDistributed({ layer: tf.layers.dense({ units: 1 }), inputShape: [7, 50] }));


        model.compile({
            optimizer: tf.train.adam(),
            loss: 'meanSquaredError',
            metrics: ['mse', 'mae'],
        });

        console.log(model.summary()) */


        res.status(200).send({ message: 'Test data generated successfully', strX })

    } catch (err) {
        log.error(err.stack)
        res.status(400).json({ message: 'Test data generation failed' })
    }
}

module.exports = {
    getIndicatorDesc,
    executeTalibFunction,
    procssModelTraining,
    getModel,
    saveModel,
    deleteModel,
    deleteUserModel,
    generateTestData,
}