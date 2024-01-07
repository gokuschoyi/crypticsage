const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))
const config = require('../config');
const IUtil = require('../utils/indicatorUtil');
const HDUtil = require('../utils/historicalDataUtil')
const ss = require('simple-statistics');
const jstat = require('jstat')
// @ts-ignore
var talib = require('talib/build/Release/talib')
const { v4: uuidv4 } = require('uuid');
const { Queue, Worker } = require('bullmq');
const { redisClient } = require('../services/redis')
const connection = redisClient // Create a Redis connection

const { createTimer } = require('../utils/timer')

const { getValuesFromRedis } = require('../utils/redis_util');
const fs = require('fs')
const MDBServices = require('../services/mongoDBServices')

const Redis = require("ioredis");
// @ts-ignore
const redisPublisher = new Redis();

const tf = require('@tensorflow/tfjs-node');
const path = require('path');

const TFMUtil = require('../utils/tf_modelUtil')

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
    const uid = res.locals.data.uid;
    const model_id = uuidv4();
    log.info(`Starting model training with id : ${model_id}`)
    const model_training_queue = "MODEL_TRAINING_QUEUE"
    const job_name = "MODEL_TRAINING_JOB_" + model_id
    try {
        const model_queue = new Queue(model_training_queue, { connection });

        const modelTrainingProcessorFile = path.join(__dirname, '../workers/modelTrainer')
        // console.log('modelTrainingProcessorFile : ', modelTrainingProcessorFile)
        const model_worker = new Worker(model_training_queue, modelTrainingProcessorFile, { connection, useWorkerThreads: true });

        const modelTrainingCompletedListener = (job) => {
            log.info(`Model Training Completed ${job.id}`)
            // model_queue.close()
            model_worker.close()
            model_worker.removeListener('completed', modelTrainingCompletedListener)
        }

        const modelTrainingFailedListener = (job, error) => {
            console.log('Job Data', job.failedReason)
            console.log('Model Training Failed : ', error.stack)
            console.log('Model Training Failed : ', error.message)

            const redisCommand = `hgetall bull:${model_training_queue}:${job.id}`
            log.error(`Model training failed for : ${job.name}, " with id : ${job.id}`)
            log.warn(`Check Redis for more info : ${redisCommand}`)
            if (job.failedReason !== 'job stalled more than allowable limit') {
                redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'error', uid, message: error.message }))
            }
        }

        model_worker.on('completed', modelTrainingCompletedListener)
        model_worker.on('failed', modelTrainingFailedListener)

        model_worker.on('error', (error) => {
            console.log('Model Training Error : ', error)
        })

        await model_queue.add(
            job_name,
            { fTalibExecuteQuery, model_training_parameters, model_id, uid },
            {
                attempts: 1,
                backoff: {
                    type: 'exponential',
                    delay: 2000,
                },
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
    const { model_id, model_name, ticker_name, ticker_period, predicted_result, talibExecuteQueries, training_parameters, scores, epoch_results, train_duration } = req.body.payload
    try {
        const uid = res.locals.data.uid;
        const model_data = {
            training_parameters,
            talibExecuteQueries,
            predicted_result,
            scores,
            epoch_results,
            train_duration,
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
        if (fs.existsSync(path)) {
            fs.rm(path, { recursive: true }, (err) => {
                if (err) {
                    throw err;
                }
                log.info(`Removed model : ${model_id}`)
            });
            return true
        } else {
            log.info(`Model file not found for : ${model_id}`)
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const checkIfModelExists = async (req, res) => {
    const { model_id } = req.body
    try {
        const path = `./models/${model_id}`
        if (fs.existsSync(path)) {
            res.status(200).json({ message: 'Model data present', status: true })
        } else {
            res.status(200).json({ message: 'Model data not present', status: false })
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const getModelResult = async (req, res) => {
    const { model_id } = req.body
    const uid = res.locals.data.uid;
    try {
        const model_data = await MDBServices.getModelResult(uid, model_id)
        res.status(200).json({ message: 'Model data fetched successfully', model_data })
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// calculate the no of ticker data to fetch based on the model_first_prediction_date
const calcuteTotalTickerCountForForecast = (train_period, first_date) => {
    const periofInMs = HDUtil.periodToMilliseconds(train_period)
    const dateNow = Date.now()
    const diff = dateNow - first_date
    const totalTickerCount = Math.floor(diff / periofInMs)
    return totalTickerCount
}

const makeNewForecast = async (req, res) => {
    const { training_parameters, talibExecuteQueries, model_id, model_first_prediction_date, model_train_period, mean_array, variance_array } = req.body.payload
    const uid = res.locals.data.uid;
    log.info(`Starting forcast for model : ${model_id}`)

    try {
        const { transformation_order, timeStep, lookAhead, multiSelectValue } = training_parameters
        // console.log('Training parameters : ', model_train_period, model_first_prediction_date, timeStep, lookAhead, multiSelectValue)

        const totalTickerCount = calcuteTotalTickerCountForForecast(model_train_period, model_first_prediction_date) // total no of ticker since initial model prediction
        const lastDate = model_first_prediction_date + (totalTickerCount * HDUtil.periodToMilliseconds(model_train_period))
        log.notice(`Total ticker count since initial forecast : ${totalTickerCount}`)
        log.notice(`New forecast start date : ${new Date(lastDate).toLocaleString()}`)

        // Step 1
        // fetching the ticker data from db, fetching the last 100 data points as it is difficult ot figure out the exact length to fetch 
        // as the talin execute queries have varying offset values for calculation
        const { payload: { db_query: { asset_type, period, ticker_name } } } = talibExecuteQueries[0];
        const tickerDataForProcessing = await MDBServices.fetchTickerHistDataFromDb(asset_type, ticker_name, period, 1, 300, 0)

        // Step 2
        // Calculating the taib functions for the ticker data
        const talibResult = await TFMUtil.processSelectedFunctionsForModelTraining({
            selectedFunctions: talibExecuteQueries,
            tickerHistory: tickerDataForProcessing.ticker_data,
        })

        // Step 3
        // Trim the tricker and talib result data based on smalles length
        // @ts-ignore
        const { tickerHist, finalTalibResult } = await TFMUtil.trimDataBasedOnTalibSmallestLength({
            tickerHistory: tickerDataForProcessing.ticker_data,
            finalTalibResult: talibResult,
        })

        // Step 4
        // Transforiming the data to required shape before tranforming to tensor/2D array
        const featuresX = await TFMUtil.transformDataToRequiredShape({ tickerHist, finalTalibResult, transformation_order })
        log.notice(`featuresX length : ${featuresX.length}`)

        // Step 5
        // Standardize the array of features
        const mean_tensor = tf.tensor(mean_array)
        const variance_tensor = tf.tensor(variance_array)
        const standardized_features = tf.div(tf.sub(tf.tensor(featuresX), mean_tensor), tf.sqrt(variance_tensor));
        const standardizedData = standardized_features.arraySync();
        // @ts-ignore
        log.notice(`Standardized data length : ${standardizedData.length}`)

        // Step 6
        // Reshape the standardized data for model prediction/create forecast data 3D array
        const features = []
        const e_key = transformation_order.findIndex(item => item.value === multiSelectValue)
        // @ts-ignore
        for (let i = 0; i <= standardizedData.length - timeStep; i++) {
            // @ts-ignore
            let featureSlice = standardizedData.slice(i, i + timeStep).map(row => {
                let filteredRow = row.filter((_, index) => index !== e_key);
                return filteredRow;
            });
            features.push(featureSlice);
        }

        // @ts-ignore
        log.notice(`E_ key : ${e_key}`)
        log.notice(`Features length : ${features.length}`)

        // Step 7
        // Load the saved model from local directory
        let forecast = []
        let model = null;
        let dates = []
        const model_path = `file://./models/${model_id}/model.json`
        try {
            model = await tf.loadLayersModel(model_path);
            // @ts-ignore
            let predictions = await model.predict(tf.tensor(features)).arraySync();
            model.dispose();
            const oneStepModelType = config.single_step_type_two
            // console.log('One step model type : ', oneStepModelType)

            if (lookAhead === 1) {
                switch (oneStepModelType) {
                    // @ts-ignore
                    case 'CNN_One_Step':
                    // @ts-ignore
                    case 'CNN_MultiChannel':
                        let predTensor = tf.tensor(predictions)
                        // @ts-ignore
                        let transformedPredictions = predTensor.reshape([predTensor.shape[0], predTensor.shape[1], 1])
                        // @ts-ignore
                        forecast = transformedPredictions.arraySync()
                        break;
                    default:
                        break;
                }
            } else {
                // @ts-ignore
                forecast = predictions
            }
            log.notice(`Final forecast length : ${forecast.length}`)

            // getting dates to plot

            const slicedTickerHist = tickerHist.slice(-(forecast.length - 1))
            log.notice(`Sliced ticker hist length : ${slicedTickerHist.length}`)
            log.notice(`Last prediction date : ${slicedTickerHist[slicedTickerHist.length - 1].date}`)

            slicedTickerHist.forEach((item, index) => {
                const strDate = new Date(item.openTime).toLocaleString();
                const actualValue = parseFloat(item[multiSelectValue])
                // const predictedValue = calculateOriginalPrice(forecast[index][0][0], variance_array[e_key], mean_array[e_key])

                dates.push({
                    openTime: strDate,
                    open: item.openTime / 1000,
                    actual: actualValue,
                })
            })

            log.notice(`Dates length : ${dates.length}`)

            let filtered_dates = dates.filter((item) => item.open * 1000 >= model_first_prediction_date)
            if (filtered_dates.length !== 0) {
                dates = filtered_dates
            } else {
                dates = dates
            }
            log.notice(`Dates length after slice : ${dates.length}`)
            log.notice(`Model Lookahead : ${lookAhead}`)
        } catch (error) {
            log.error(error.stack)
            throw error
        }

        const final_result_obj = {
            new_forecast_dates: dates,
            new_forecast: forecast.slice((forecast.length - dates.length - lookAhead - 1), (forecast.length - 1)),
            lastPrediction: forecast.slice(-1)[0]
        }

        log.notice(`Final forecast length : ${final_result_obj.new_forecast.length}`)

        // @ts-ignore
        res.status(200).json({ message: 'Model forcast started', final_result_obj });
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Model training failed', error: error.message })
    }
}

const renameModel = async (req, res) => {
    const { model_id, model_name } = req.body
    try {
        const uid = res.locals.data.uid;
        const model_name_save_status = await MDBServices.renameModelForUser(uid, model_id, model_name)
        res.status(200).json({ message: 'Model renamed successfully', status: model_name_save_status ? true : false })
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Model renaming failed' })
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
    let { timeStep: time_step, lookAhead: look_ahead } = req.body
    console.log('TS : ', time_step, 'LA : ', look_ahead)
    let feature_count = 8
    try {
        const model = tf.sequential()
        const inputShape = [time_step, feature_count]; // replace timeSteps and features with actual numbers

        // Bi-directional GRU layer
        model.add(tf.layers.bidirectional({
            layer: tf.layers.gru({ units: look_ahead, returnSequences: true }), inputShape: inputShape,
        }));

        // Dropout layer after BiGRU
        // model.add(tf.layers.dropout({ rate: 0.2 })); // Adjust dropout rate as needed

        // Three LSTM layers with dropout after each
        const lstmUnits = [40, 80, 40]; // replace with actual numbers
        for (let i = 0; i < lstmUnits.length; i++) {
            model.add(tf.layers.lstm({
                units: lstmUnits[i], returnSequences: true
            }));
            // model.add(tf.layers.dropout({ rate: 0.2 })); // Adjust dropout rate as needed
        }

        /* // Reshape the output to [null, 7, lstmUnits3]
        model.add(tf.layers.reshape({ targetShape: [look_ahead, lstmUnits[lstmUnits.length - 1]] })); */

        // Fully connected layer to map each [null, 7, 150] to [null, 7, 7]
        /* model.add(tf.layers.timeDistributed({
            layer: tf.layers.dense({ units: look_ahead, activation: 'relu' })
        })); */

        // Output layer: TimeDistributed dense layer to map [null, 7, 7] to [null, 7, 1]
        model.add(tf.layers.timeDistributed({
            layer: tf.layers.dense({ units: 1, activation: 'linear', inputShape: [look_ahead, lstmUnits[lstmUnits.length - 1]] }) // Outputs [null, 7, 1]
        }));
        model.add(tf.layers.reshape({ targetShape: [look_ahead, 1] }));

        model.compile({
            optimizer: tf.train.adam(),
            loss: 'meanSquaredError',
            metrics: ['mse', 'mae'],
        });

        console.log(model.summary())

        /* let lstm_cells = [];
        for (let index = 0; index < 4; index++) {
            lstm_cells.push(tf.layers.lstmCell({ units: 16 }));
        }

        const model = tf.sequential();
        model.add(tf.layers.lstm({ units: 50, activation: 'relu', inputShape: [14, 8] }));
        model.add(tf.layers.repeatVector({ n: 7 }));
        model.add(tf.layers.lstm({ units: 50, activation: 'relu', returnSequences: true }));       
        model.add(tf.layers.timeDistributed({ layer: tf.layers.dense({ units: 1 }), inputShape: [7, 50] }));


        model.compile({
            optimizer: tf.train.adam(),
            loss: 'meanSquaredError',
            metrics: ['mse', 'mae'],
        });

        console.log(model.summary()) */

        // const allData = await redisStep.hgetall('model_training_checkpoint_b288539f-a863-48ff-a830-c8418a8e9028')
        /* const tickerHistory = await fetchEntireHistDataFromDb({ type: 'crypto', ticker_name: 'BTCUSDT', period: '4h' }) */

        res.status(200).json({ message: 'Test data generation started' })

    } catch (err) {
        log.error(err.stack)
        res.status(400).json({ message: 'Test data generation failed' })
    }
}

const calculateCoRelationMatrix = (req, res) => {
    try {
        const data = [
            [1, 5, 2, 20],  // Row 1 with features for observation 1
            [2, 4, 2, 42],  // Row 2 with features for observation 2
            [3, 3, 3, 22],  // Row 3 with features for observation 3
            [4, 2, 3, 89],  // Row 4 with features for observation 4
            [5, 1, 4, 64],  // Row 5 with features for observation 5
        ];

        /* const data = [
            [1500, 33, 80],
            [1200, 33, 82.5],
            [2200, 34, 100.8],
            [2100, 42, 90],
            [1500, 29, 67],
            [1700, 19, 60],
            [3000, 50, 77],
            [3000, 55, 77],
            [2800, 31, 87],
            [2900, 46, 70],
            [2780, 36, 57],
            [2550, 48, 64]
        ] */

        /* function calcMean(data) {
            return data.reduce((sum, value) => sum + value, 0) / data.length;
        } */

        /* function standardDeviation(data) {
            const dataMean = calcMean(data);
            return Math.sqrt(data.reduce((sq, n) => sq + (n - dataMean) ** 2, 0) / data.length);
        }

        function covariance(data1, data2) {
            const data1Mean = calcMean(data1);
            const data2Mean = calcMean(data2);
            const dataLength = data1.length;
            let cov = 0;

            for (let i = 0; i < dataLength; i++) {
                cov += (data1[i] - data1Mean) * (data2[i] - data2Mean);
            }

            return cov / dataLength;
        } */

        /* function pearsonCorrelation(data1, data2) {
            if (data1.length !== data2.length) {
                throw new Error('Arrays have different lengths!');
            }
            const data1StandardDeviation = standardDeviation(data1);
            const data2StandardDeviation = standardDeviation(data2);

            if (data1StandardDeviation === 0 || data2StandardDeviation === 0) {
                return 0; // If no variation, correlation is 0
            }

            return covariance(data1, data2) / (data1StandardDeviation * data2StandardDeviation);
        } */

        /* function calculateCorrelationMatrix(data) {
            // First, transpose the data to column-wise format
            const transposedData = transpose(data);
            console.log('Transposed data', transposedData)

            const matrix = [];
            for (let i = 0; i < transposedData.length; i++) {
                matrix[i] = [];
                for (let j = 0; j < transposedData.length; j++) {
                    if (i === j) {
                        // @ts-ignore
                        matrix[i][j] = 1; // Correlation with itself is always 1
                    } else {
                        // @ts-ignore
                        matrix[i][j] = pearsonCorrelation(transposedData[i], transposedData[j]);
                    }
                }
            }
            return matrix;
        } */

        function transpose(array) {
            return array[0].map((_, colIndex) => array.map(row => row[colIndex]));
        }

        const fData = []
        const calcCorrelationMatri = (data) => {
            const transposedData = transpose(data);
            // console.log('Transposed data', transposedData)

            const data_length = data.length
            for (let i = 0; i < transposedData.length; i++) {
                let temp = []
                for (let j = 0; j < transposedData.length; j++) {
                    // calculating Pearson Correlation
                    const r = ss.sampleCorrelation(transposedData[i], transposedData[j]);

                    // calculating Statistic value
                    const S = Math.sqrt((1 - (r * r)) / (data_length - 2))
                    const stat = ((r - 0) / S)

                    // calculating Covariance
                    const cov = ss.sampleCovariance(transposedData[i], transposedData[j]);

                    // calculating p Value
                    const t = r * (Math.sqrt((data_length - 2) / (1 - r * r)));
                    const df = data.length - 2;
                    // @ts-ignore
                    const pValue = 2 * (1 - jstat.studentt.cdf(Math.abs(t), df));

                    const res_obj = {
                        r: r,
                        p: pValue,
                        cov: cov,
                        stat: stat
                    }
                    temp.push(res_obj)
                }
                fData.push(temp)
            }
            console.log(fData)
            return fData
        }

        const final_data = calcCorrelationMatri(data);

        res.status(200).json({ message: 'Test data generation started', final_data })

    } catch (err) {
        log.error(err.stack)
        res.status(400).json({ message: 'calculate co-relation matrix failed' })
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
    checkIfModelExists,
    getModelResult,
    makeNewForecast,
    renameModel,
    generateTestData,
    calculateCoRelationMatrix
}