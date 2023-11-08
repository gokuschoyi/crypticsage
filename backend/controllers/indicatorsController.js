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
const TF_ModelUtil = require('../utils/tf_modelUtil')
const fs = require('fs')
const MDBServices = require('../services/mongoDBServices')

const tf = require('@tensorflow/tfjs-node');


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
        const model_worker = new Worker(model_training_queue, startModelTraining, { connection });

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
        }

        model_worker.on('completed', modelTrainingCompletedListener)
        model_worker.on('failed', modelTrainingFailedListener)

        model_worker.on('error', (error) => {
            log.error(error.stack)
        })

        const job = await model_queue.add(
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
        hidden_layers,
        learning_rate,
        to_predict,
        model_type
    } = model_training_parameters
    console.log('Model parameters : ', model_training_parameters)

    log.info('----> Step 1 : Fetching the ticker data from db') // oldest first 
    const tickerHistory = await fetchEntireHistDataFromDb(asset_type, ticker_name, period)
    const tickerHistoryLength = tickerHistory.length
    log.info(`Initial Total Length : ${tickerHistoryLength}`)
    console.log('Latest Data : ', tickerHistory[tickerHistoryLength - 1])
    TF_Model.eventEmitter.emit('notify', { message: `----> Fetched ${tickerHistoryLength} tickers from db...`, latestData: tickerHistory[tickerHistoryLength - 1] })


    TF_Model.eventEmitter.emit('notify', { message: "----> Executing selected functions..." })
    log.info('----> Step 2 : Executing the talib functions')
    // processing and executing talib functions
    let finalTalibRes = await TFMUtil.processSelectedFunctionsForModelTraining({ selectedFunctions: fTalibExecuteQuery, tickerHistory: tickerHistory })
    TF_Model.eventEmitter.emit('notify', { message: `----> Function execution completed...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Finding smallest array to adjust ticker hist and function data..." })
    log.info('----> Step 3 : Finding smallest array to adjust ticker hist and function data')
    const [tickerHist, finalTalibResult] = await TFMUtil.trimDataBasedOnTalibSmallestLength({ finalTalibResult: finalTalibRes, tickerHistory })
    TF_Model.eventEmitter.emit('notify', { message: `----> Trimmed data based on talib smallest length...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Transforming and combining the OHLCV and function data for model training..." })
    log.info('----> Step 4 : Transforming and combining the data to required format for model training')
    const features = await TFMUtil.transformDataToRequiredShape({ tickerHist, finalTalibResult })
    TF_Model.eventEmitter.emit('notify', { message: `----> Transformed data to required shape...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Standardizing the data..." })
    log.info('----> Step 5 : Standardizing the data')
    let [stdData, label_mean, label_variance] = TFMUtil.standardizeData(model_type, features, to_predict)
    log.info({ label_mean, label_variance })
    TF_Model.eventEmitter.emit('notify', { message: `----> Data standardized...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Creating the training data..." })
    log.info('----> Step 6 : Transformig and creating the training data')
    const [trainSplit, xTrain, yTrain, xTrainTest, yTrainTest] = await TFMUtil.createTrainingData(
        {
            model_type,
            stdData,
            timeStep: time_step,
            lookAhead: look_ahead,
            e_key: to_predict,
            training_size
        })
    TF_Model.eventEmitter.emit('notify', { message: `----> Training data created...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Creating the model..." })
    log.info('----> Step 7 : Creating the model')
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
    log.info('----> Step 8 : Training the model')
    const epochs = epochCount;
    const batchSize = 32;
    const trained_model_ = await TF_Model.trainModel(model_, model_type, xTrain, yTrain, epochs, batchSize)
    TF_Model.eventEmitter.emit('notify', { message: `----> TF Model trained...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Making the predictions on test data..." })
    log.info('----> Step 9 : Making the predictions on test data')
    const forecastDataSlice = stdData.slice(-time_step)
    const forecastData = [forecastDataSlice]
    let [predictedPrice, forecast] = await TF_Model.makePredictions(trained_model_, xTrainTest, forecastData)
    log.info(`Predicted length : ${predictedPrice.length}, ${predictedPrice[0]}, ${predictedPrice[predictedPrice.length - 1]}`)
    TF_Model.eventEmitter.emit('notify', { message: `----> TF Model predictions completed...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Combining and finalizing the data for plotting..." })
    log.info('----> Step 10 : Combining and finalizing the data for plotting')
    await TFMUtil.formatPredictedOutput(
        {
            model_type,
            look_ahead,
            tickerHist,
            time_step,
            trainSplit,
            yTrainTest,
            predictedPrice,
            forecast,
            id: model_id,
            label_mean,
            label_variance
        })
    TF_Model.eventEmitter.emit('notify', { message: `----> TF Model predictions formatted, sending result...` })


    log.info('----> Step 11 : Saving the model and weights  and disposing it ')
    await TF_Model.saveModel(trained_model_, model_id)


    /* log.info('----> Step 12 : Disposing the model')
    TF_Model.disposeModel(model_) */

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



const generateTestData = async (req, res) => {
    const { timeStep, lookAhead } = req.body
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
        for (let i = timeStep; i <= testArray.length - lookAhead + 1; i++) {
            trainX.push(testArray.slice(i - timeStep, i))
            trainY.push(testArray.slice(i - 1, i + lookAhead - 1).map((row) => [row[2]]))
        }

        let str = ''
        trainX.forEach((element, index) => {
            element.forEach((row, ind) => {
                let rowStr = ''
                if (ind === element.length - 1) {
                    rowStr += row.join(', ') + ` - ${trainY[index]}` + '\n' + '\n'
                } else {
                    rowStr = row.join(', ') + '\n'
                }
                str += rowStr
            })
        })

        // console.log(str)
        /* console.log(trainX)
        console.log(trainY) */

        let tensorX = tf.tensor(trainX)
        let tensorY = tf.tensor(trainY)

        console.log(testArray.length)
        console.log(testArray.length - timeStep - lookAhead + 2)
        console.log(tensorX.shape)
        console.log(tensorY.shape)

        /* const [trainSplit, xTrain, yTrain, xTrainTest, yTrainTest] = await TFMUtil.createTrainingData(
            {
                model_type: 'multi_input_single_output_step',
                stdData: testArray,
                timeStep: timeStep,
                lookAhead: lookAhead,
                e_key: 'low',
                training_size: 80
            })

        console.log(xTrain)
        console.log(yTrain)
        console.log(xTrainTest)
        console.log(yTrainTest) */

        const act = [
            [ 0.9313037991523743 ],
            [ 0.9217190742492676 ],
            [ 0.9200571179389954 ],
            [ 0.9195137023925781 ],
            [ 0.9114740490913391 ]
        ]

        const pred = [
            [ 0.7829376459121704 ],
            [ 0.9296842813491821 ],
            [ 0.9347333908081055 ],
            [ 0.920935869216919 ],
            [ 0.9096674919128418 ]
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

        let act_tensor = tf.tensor(act)
        let pred_tensor = tf.tensor(pred)

        let mse = tf.losses.meanSquaredError(act_tensor, pred_tensor)

        console.log(mse.arraySync())

        let rmse = tf.sqrt(mse)

        console.log(rmse.arraySync())


        res.status(200).send({ message: 'Test data generated successfully', str })

    } catch (err) {
        log.error(err.stack)
        res.status(400).json({ message: 'Test data generation failed' })
    }
}

module.exports = {
    getIndicatorDesc,
    executeTalibFunction,
    procssModelTraining,
    startModelTraining,
    getModel,
    saveModel,
    deleteModel,
    deleteUserModel,
    generateTestData,
}