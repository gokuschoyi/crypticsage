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

const { fetchEntireHistDataFromDb } = require('../services/mongoDBServices')
const { getValuesFromRedis } = require('../utils/redis_util');
const fs = require('fs')
const MDBServices = require('../services/mongoDBServices')

const Redis = require("ioredis");
// @ts-ignore
const redisPublisher = new Redis();

// @ts-ignore
const wganpgDataRedis = new Redis()

const tf = require('@tensorflow/tfjs-node');
const path = require('path');
const celery = require('celery-node');

const pyClient = celery.createClient(
    `redis://${config.redis_host}:${config.redis_port}`,
    `redis://${config.redis_host}:${config.redis_port}`,
    'wgan_gp_training'
);

const TFMUtil = require('../utils/tf_modelUtil')
const GAN_Model = require('../utils/tf_model_GAN')

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

    try {
        const isModelGAN = model_training_parameters.model_type === 'GAN' ? true : false // GAN or multi_input_single_output_step

        if (isModelGAN) {
            console.log(`Statring ${model_training_parameters.model_type} Initialization`)
            console.log('Model parameters : ', model_training_parameters)
            const { db_query } = fTalibExecuteQuery[0].payload;
            const { asset_type, ticker_name, period } = db_query
            const redis_key_for_hist_data = `${asset_type}-${ticker_name}-${period}_historical_data`

            console.log('GAN redis data key name : ', redis_key_for_hist_data)

            // Model parameters
            const {
                model_type,
                to_predict,
                training_size,
                time_step,
                look_ahead,
                epochs,
                batchSize,
                learning_rate,
                hidden_layers,
                transformation_order,
                do_validation,
                early_stopping_flag
            } = model_training_parameters

            // check if the historical data is present in redis or not
            const isHistoricalDataPresent = await wganpgDataRedis.exists(redis_key_for_hist_data)
            if (isHistoricalDataPresent === 1) {
                console.log('historical data is present in redis, calling celery worker : ', isHistoricalDataPresent)
                // set the modified features in the redis store
                const features = JSON.parse(await wganpgDataRedis.hget(redis_key_for_hist_data, 'features'))
                const metrics = await TFMUtil.calculateFeatureMetrics({ features })
                // console.log("New metrics : ", metrics)
                redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'feature_relations', uid, metrics }))

                await wganpgDataRedis.hset(redis_key_for_hist_data, {
                    training_parameters: JSON.stringify({
                        to_predict,
                        training_size,
                        time_step,
                        look_ahead,
                        epochs,
                        batchSize,
                        transformation_order,
                        do_validation,
                        early_stopping_flag
                    })
                })

                redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `Features present in redis, Celery worker called...` }))

                // call the celery python worker
                const task = pyClient.createTask("celeryTasks.trainModel");
                task.delay({
                    message: 'Request from node to start WGAN_GP model training',
                    uid,
                    m_id: model_id,
                    model_proces_id: redis_key_for_hist_data
                });

                res.status(200).json({ message: 'Gan model training started', finalRs: [], job_id: model_id });
            } else {
                const model_training_order = [
                    {
                        function: fetchEntireHistDataFromDb,
                        message: '----> Step 1 : Fetching the ticker data from db'
                    },
                    {
                        function: TFMUtil.processSelectedFunctionsForModelTraining,
                        message: '----> Step 2 : Executing the talib functions'
                    },
                    {
                        function: TFMUtil.trimDataBasedOnTalibSmallestLength,
                        message: '----> Step 3 : Finding smallest array to adjust ticker hist and function data'
                    },
                    {
                        function: TFMUtil.transformDataToRequiredShape,
                        message: '----> Step 4 : Transforming and combining the data to required format for model training'
                    },
                    {
                        function: null,
                        message: '----> Step 5 : Saving features to redis and calling Celery Worker'
                    }
                ]

                let ticker_history, talib_results, trimmed, features
                // fetch and [rocess] the data and store the result in the redis cache
                for (let i = 1; i <= model_training_order.length; i++) {
                    const teststr = model_training_order[i - 1].message;
                    const arrowIndex = teststr.indexOf('---->');
                    const arrow = teststr.substring(0, arrowIndex + 5); // +5 because the length of '---->' is 5
                    const message = teststr.substring(arrowIndex + 5).trim(); // .trim() to remove any leading/trailing whitespace

                    const modifiedMessage = `${arrow} (${uid}) (${model_id}) ${message}`
                    log.alert(modifiedMessage)
                    const step_function = model_training_order[i - 1].function

                    switch (i) {
                        case 1:  // Fetching the ticker data from db
                            const history_payload = {
                                type: asset_type,
                                ticker_name,
                                period
                            }
                            try {
                                // @ts-ignore
                                ticker_history = await step_function(history_payload)
                            } catch (error) {
                                const newErrorMessage = { func_error: error.message, message: 'Error fetching data from db', step: i }
                                throw new Error(JSON.stringify(newErrorMessage));
                            }
                            redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `(1) : Fetched ${ticker_history.length} tickers from db...` }))
                            break;
                        case 2: // Calculate the talib functions for the ticker history
                            const talib_payload = {
                                selectedFunctions: fTalibExecuteQuery,
                                tickerHistory: ticker_history,
                            }
                            try {
                                // @ts-ignore
                                talib_results = await step_function(talib_payload)
                            } catch (error) {
                                const newErrorMessage = { func_error: error.message, message: 'Error in executing selected functions', step: i }
                                throw new Error(JSON.stringify(newErrorMessage));
                            }
                            redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `(2) : Talib functions executed...` }))
                            break;
                        case 3: // Trim the ticker history and talib results based on the smallest length
                            const trim_payload = {
                                finalTalibResult: talib_results,
                                tickerHistory: ticker_history,
                            }
                            try {
                                // @ts-ignore
                                trimmed = await step_function(trim_payload)
                            } catch (error) {
                                const newErrorMessage = { func_error: error.message, message: 'Error adjusting the ticker and talib result length', step: i }
                                throw new Error(JSON.stringify(newErrorMessage));
                            }
                            redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `(3) : Data trimmed based on talib smallest length...` }))
                            break;
                        case 4: // Transforming and combining the data to required format for model training
                            // @ts-ignore
                            const { tickerHist, finalTalibResult } = trimmed
                            const transform_payload = {
                                tickerHist,
                                finalTalibResult,
                                transformation_order,
                                uid
                            }
                            try {
                                // @ts-ignore
                                features = await step_function(transform_payload)
                            } catch (error) {
                                const newErrorMessage = { func_error: error.message, message: 'Error in combining OHLCV and selected function data', step: i }
                                throw new Error(JSON.stringify(newErrorMessage));
                            }
                            redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `(4) : Transformed and combined the OHLCV and talib function data...` }))
                            break;
                        case 5: // Call the celery python worker
                            await wganpgDataRedis.hset(redis_key_for_hist_data, {
                                // @ts-ignore
                                features: JSON.stringify(features.slice(-1000)), // remove slice after testing
                                training_parameters: JSON.stringify({
                                    to_predict,
                                    training_size,
                                    time_step,
                                    look_ahead,
                                    epochs,
                                    batchSize,
                                    transformation_order,
                                    do_validation,
                                    early_stopping_flag
                                })
                            })

                            const task = pyClient.createTask("celeryTasks.trainModel");
                            task.delay({
                                message: 'Request from node to start WGAN_GP model training',
                                uid,
                                m_id: model_id,
                                model_proces_id: redis_key_for_hist_data
                            });
                            redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `(5) : Features saved to redis and Celery worker called...` }))
                            break;
                        default:
                            break;
                    }
                }

                res.status(200).json({ message: 'Gan model training started', finalRs: [], job_id: model_id });

            }

        } else { // for non GAN models
            console.log(`Statring ${model_training_parameters.model_type} Initialization`)

            const model_training_queue = "MODEL_TRAINING_QUEUE"
            const job_name = "MODEL_TRAINING_JOB_" + model_id
            const model_queue = new Queue(model_training_queue, { connection });

            const modelTrainingProcessorFile = path.join(__dirname, '../worker_bullmq/modelTrainer')
            console.log('modelTrainingProcessorFile : ', modelTrainingProcessorFile)

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
    const {
        scores,
        model_id,
        model_name,
        ticker_name,
        ticker_period,
        epoch_results,
        train_duration,
        correlation_data,
        predicted_result,
        training_parameters,
        talibExecuteQueries,
    } = req.body.payload
    try {
        const uid = res.locals.data.uid;
        const model_data = {
            scores,
            epoch_results,
            train_duration,
            correlation_data,
            predicted_result,
            training_parameters,
            talibExecuteQueries,
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
        const tickerDataForProcessing = await MDBServices.fetchTickerHistDataFromDb(asset_type, ticker_name, period, 1, 1500, 0)

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

// @ts-ignore




// @ts-ignore


const testNewModel = async (req, res) => {
    const { fTalibExecuteQuery, model_training_parameters, data } = req.body.payload
    const {
        model_type,
        to_predict,
        training_size,
        time_step,
        look_ahead,
        epochs: epochCount,
        batchSize,
        learning_rate,
        hidden_layers,
        transformation_order,
        do_validation,
        early_stopping_flag
    } = model_training_parameters
    try {
        console.log('Model start time', performance.now())
        console.log('Initial num of Tensors ' + tf.memory().numTensors);
        log.info(`Initial data length : ${data.length}`)
        const features = data.map((item, i) => {
            return transformation_order.map(order => {
                if (order.value in item) {
                    // Fetching OHLCV data
                    return parseFloat(item[order.value]);
                }
                // return null; // Or a default value if the feature is not found
            })
                .filter(value => value !== undefined);;
        });
        log.info(`Features length : ${features.length}`)
        console.log('First Feature : ', features[0])
        console.log('last Feature : ', features[features.length - 1])


        const { normalized_data, mins_array, maxs_array } = await TFMUtil.normalizeData({ features })
        log.info(`Normalized data length : ${normalized_data.length}`)
        const { xTrain, yTrain, yTrainPast } = await TFMUtil.generateModelTrainigData(
            {
                normalizedData: normalized_data,
                timeStep: time_step,
                lookAhead: look_ahead,
                e_key: transformation_order.findIndex(item => item.value === to_predict)
            })
        const feature_size = xTrain[0][0].length
        const model_proces_id = uuidv4()

        await wganpgDataRedis.hset(model_proces_id, {
            mins_array: JSON.stringify(mins_array),
            maxs_array: JSON.stringify(maxs_array),
        })

        const task = pyClient.createTask("celeryTasks.testLogging");
        task.delay({ message: 'testing', id: 123456787, feature_size, model_proces_id });


        // const [trainHist, preds, Generated_price] = await GAN_Model.train(xTrain, yTrain, yTrainPast, epochCount, time_step, look_ahead, feature_size, batchSize)
        console.log('Final num of Tensors ' + tf.memory().numTensors);
        console.log('Total bytes ' + tf.memory().numBytes);
        res.status(200).json({ message: 'new Model trainign' })
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Model training failed' })
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
    /* const model = tf.sequential();
    model.add(tf.layers.lstm({ units: 75, activation: 'relu', inputShape: [14, 5] })); // 14, 8
    model.add(tf.layers.repeatVector({ n: 5 })); // 5
    model.add(tf.layers.dropout({ rate: 0.1 }));
    model.add(tf.layers.lstm({ units: 75, activation: 'relu', returnSequences: true }));
    model.add(tf.layers.timeDistributed({ layer: tf.layers.dense({ units: 1 }), inputShape: [5, 75] }));
    model.add(tf.layers.reshape({targetShape:[5]}))
    model.summary() */

    const weight_initializers = tf.initializers.randomNormal({ mean: 0.0, stddev: 0.02 });
    // console.log(input_dimension, output_dimension, feature_size, weight_initializers)

    const generator_model = tf.sequential();

    generator_model.add(tf.layers.conv1d({
        filters: 32,
        kernelSize: 2,
        strides: 1,
        padding: 'same',
        kernelInitializer: weight_initializers,
        batchInputShape: [null, 14, 5],
    }))

    generator_model.add(tf.layers.leakyReLU({ alpha: 0.1 }))

    generator_model.add(tf.layers.bidirectional({
        layer: tf.layers.lstm({
            units: 80,
            activation: 'relu',
            kernelInitializer: weight_initializers,
            returnSequences: false,
            dropout: 0.3,
            recurrentDropout: 0.0
        })
    }))

    // ERROR: Error: Input 0 is incompatible with layer flatten_Flatten1: expected min_ndim=3, found ndim=2.
    // The reason for this error is that you are trying to flatten an already flat layer. from bidirectional
    // model.add(tf.layers.flatten())

    generator_model.add(tf.layers.dense({ units: 64, activation: 'linear' }))
    generator_model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
    generator_model.add(tf.layers.dropout({ rate: 0.2 }))

    generator_model.add(tf.layers.dense({ units: 32, activation: 'linear' }))
    generator_model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
    generator_model.add(tf.layers.dropout({ rate: 0.2 }))

    generator_model.add(tf.layers.dense({ units: 5 }))
    console.log(generator_model.summary())

    const input = tf.input({ shape: [14, 5] })
    // console.log(input)
    const output = generator_model.apply(input)
    console.log(output.shape)
    // console.log(output)
    const predictions = tf.layers.dense({ units: 5, inputShape: output.shape[1] }).apply(output)
    // console.log(predictions)

    const final = tf.model({ inputs: input, outputs: predictions })

    console.log(final.summary())

    const dt = tf.ones([1, 14, 5])
    console.log(dt.shape)

    const result = final.apply(dt)

    const resultWT = final.apply(dt, { training: true })
    const resultWF = final.apply(dt, { training: false })
    const pred = final.predict(dt)
    console.log(result.shape)
    console.log(result.arraySync())
    // console.log(resultWT.arraySync())
    // console.log(resultWF.arraySync())
    // console.log(pred.arraySync())

    const eps = tf.randomUniform([82, 19, 1], -1.0, 1.0)
    console.log(eps.arraySync()[0])

    const eps2 = tf.randomStandardNormal([82, 19, 1], 'float32')
    console.log(eps2.arraySync()[0])



    /* const data = tf.tensor([
        [
            [0.0001328508515143767],
            [0.00009782375127542764],
            [-0.0008963076397776604],
            [0.0004017833562102169],
            [0.000012839038390666246],
            [0.0007723102462477982],
            [0.00025670218747109175],
            [0.00024178772582672536],
            [0.0009538659360259771],
            [0.0003660211805254221],
            [0.00018731615273281932],
            [-0.0008398985955864191],
            [-0.000011556971003301442],
            [0.0003482191823422909],
            [-0.0001776097487891093],
            [0.0007150094024837017],
            [-0.00011951666965615004],
            [-0.0010030386038124561],
            [0.0006570029072463512]
        ],
        [
            [-0.0003606318205129355],
            [0.001308008679188788],
            [0.00013122377276886255],
            [0.0002781917864922434],
            [-0.0012376485392451286],
            [-0.0023580784909427166],
            [0.00026319053722545505],
            [0.0009982612682506442],
            [0.0008057521772570908],
            [0.0011556555982679129],
            [0.00005961134593235329],
            [0.0014554434455931187],
            [-0.001035070396028459],
            [-0.001772983348928392],
            [-0.002082324121147394],
            [-0.002064791973680258],
            [-0.0019586090929806232],
            [-0.0015365128638222814],
            [-0.0026596931274980307]
        ]
    ])
 
    const data2 = tf.tensor([
        [[-0.0003606318205129355]],
        [[-0.0003606318205129355]]
    ])
 
    console.log(data.shape)
    console.log(data2.shape)
    const concat = data.concat(data2, 1)
    console.log(concat.shape)
 
 
 
    const model = tf.sequential()
    const weight_initializers = tf.initializers.randomNormal({ mean: 0.0, stddev: 0.02 })
    const dOptimizer = tf.train.adam(0.0004, 0.5, 0.9);
    // console.log(dOptimizer)
 
    model.add(tf.layers.lstm({ units: 50, activation: 'relu', inputShape: [19, 1] }));
    model.add(tf.layers.repeatVector({ n: 5 }));
    model.add(tf.layers.dropout({ rate: 0.1 }));
    model.add(tf.layers.lstm({ units: 50, activation: 'relu', returnSequences: true }));
    model.add(tf.layers.timeDistributed({ layer: tf.layers.dense({ units: 1 }), inputShape: [5, 50] }));
 
    model.add(tf.layers.conv1d({
        filters: 32,
        kernelSize: 2,
        strides: 1,
        padding: 'same',
        kernelInitializer: weight_initializers,
        batchInputShape: [null, 5, 1]
    }))
 
    model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
 
    model.add(tf.layers.bidirectional({
        layer: tf.layers.lstm({
            units: 64,
            activation: 'relu',
            kernelInitializer: weight_initializers,
            returnSequences: false,
            dropout: 0.3,
            recurrentDropout: 0.0
        })
    }))
 
    model.add(tf.layers.dense({ units: 64, activation: 'linear' }))
    model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
    model.add(tf.layers.dropout({ rate: 0.2 }))
 
    model.add(tf.layers.dense({ units: 32, activation: 'linear' }))
    model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
    model.add(tf.layers.dropout({ rate: 0.2 }))
 
    model.add(tf.layers.dense({ units: 5 }))
    model.add(tf.layers.reshape({ targetShape: [5, 1] }))
 
    const result_pred = await model.predict(data)
    const result_apply_f = model.apply(data, { training: false })
    const result_apply_t = model.apply(data, { training: true })
    console.log('result ', result_pred.arraySync())
    console.log('result apply', result_apply_f.arraySync())
    console.log('result apply', result_apply_t.arraySync()) */

    /* model.add(tf.layers.lstm({ units: 50, activation: 'relu', inputShape: [14, 5] }));
    model.add(tf.layers.repeatVector({ n: 5 }));
    model.add(tf.layers.dropout({ rate: 0.1 }));
    model.add(tf.layers.lstm({ units: 50, activation: 'relu', returnSequences: true }));
    model.add(tf.layers.timeDistributed({ layer: tf.layers.dense({ units: 1 }), inputShape: [5, 50] })); */

    // console.log(model.summary())

    /* const x = tf.tensor([[
        [0.032575394958257675],
        [0.0890781506896019],
        [-0.0004112944006919861],
        [-0.013574089854955673],
        [0.111392080783844],
        [0.2740894556045532],
        [0.12742707133293152],
        [-0.03399523347616196],
        [-0.06803381443023682],
        [0.05581254884600639],
        [0.0010944008827209473],
        [-0.3425717353820801],
        [-0.16037702560424805],
        [0.9127311706542969],
        [2.1757612228393555],
        [2.479887008666992],
        [2.6789770126342773],
        [2.1039485931396484],
        [-2.3113415241241455]
    ]])
    console.log('shape', x.shape)
    // console.log(x.square().arraySync())
    console.log('sq sum ', x.square().sum([1, 2]).arraySync())
    console.log('sq sum sqt ', x.square().sum([1, 2]).sqrt().arraySync())
    console.log('GP ', x.square().sum([1, 2]).sqrt().sub(tf.scalar(1)).square().mean().arraySync())
 
    const grad = x.square().sum([1, 2]).sqrt()
    console.log('slopes :', grad.arraySync())
    console.log('GP test ', tf.clipByValue(grad.sub(tf.scalar(1)), -1, 1).square().mean().arraySync())
 
    console.log('new GP', tf.square(grad).sub(1).mean().arraySync()) */
    /* const weight_initializers = tf.initializers.randomNormal({ mean: 0.00, stddev: 0.02 });
    const discriminator_model = tf.sequential();
 
    discriminator_model.add(tf.layers.conv1d({
        filters: 32,
        kernelSize: 2,
        strides: 1,
        padding: 'same',
        kernelInitializer: weight_initializers,
        inputShape: [14 + 5, 1]
    }))
 
    discriminator_model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
 
    discriminator_model.add(tf.layers.conv1d({
        filters: 64,
        kernelSize: 2,
        strides: 1,
        padding: 'same',
        kernelInitializer: weight_initializers,
    }))
 
    discriminator_model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
    discriminator_model.add(tf.layers.flatten())
 
    discriminator_model.add(tf.layers.dense({ units: 64, activation: 'linear', useBias: true }))
    discriminator_model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
    discriminator_model.add(tf.layers.dropout({ rate: 0.2 }))
 
    discriminator_model.add(tf.layers.dense({ units: 32, activation: 'linear', useBias: true }))
    discriminator_model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
    discriminator_model.add(tf.layers.dropout({ rate: 0.2 }))
 
    discriminator_model.add(tf.layers.dense({ units: 1, activation: 'linear' }))
 
    discriminator_model.add(tf.layers.layerNormalization({ axis: 1, center: true, scale: true }))
 
    console.log(discriminator_model.summary()) */
    res.status(200).json({ message: 'Test data generation started', })


    // let { timeStep: time_step, lookAhead: look_ahead } = req.body
    // console.log('TS : ', time_step, 'LA : ', look_ahead)
    // let feature_count = 8
    // const params = req.body.params
    // console.log(params)
    // const result = await HDUtil.getHistoricalYFinanceData(params)
    // console.log('Result length :', result.length)
    /* let t1 = tf.tensor([[[1, 2, -3, -4], [-1, -2, 3, 4]]])
    let t2 = tf.tensor([[[-1, 2, -3, 4], [1, -2, 3, -4]]])
    console.log(tf.sign(t1).dataSync())
    console.log(tf.sign(t2).dataSync())
    console.log(tf.abs(tf.sign(t1).sub(tf.sign(t2))).dataSync())
    console.log(tf.abs(tf.sign(t1).sub(tf.sign(t2))).mean().dataSync()) */
    /*
 
    const fake = tf.tensor([
        [0.0001328508515143767],
        [0.00009782375127542764],
        [-0.0008963076397776604],
        [0.0004017833562102169],
        [0.000012839038390666246],
        [0.0007723102462477982],
        [0.00025670218747109175],
        [0.00024178772582672536],
        [0.0009538659360259771],
        [0.0003660211805254221],
        [0.00018731615273281932],
        [-0.0008398985955864191],
        [-0.000011556971003301442],
        [0.0003482191823422909],
        [-0.0001776097487891093],
        [0.0007150094024837017],
        [-0.00011951666965615004],
        [-0.0010030386038124561],
        [0.0006570029072463512]
    ])
 
    const real = tf.tensor([
        [-0.0003606318205129355],
        [0.001308008679188788],
        [0.00013122377276886255],
        [0.0002781917864922434],
        [-0.0012376485392451286],
        [-0.0023580784909427166],
        [0.00026319053722545505],
        [0.0009982612682506442],
        [0.0008057521772570908],
        [0.0011556555982679129],
        [0.00005961134593235329],
        [0.0014554434455931187],
        [-0.001035070396028459],
        [-0.001772983348928392],
        [-0.002082324121147394],
        [-0.002064791973680258],
        [-0.0019586090929806232],
        [-0.0015365128638222814],
        [-0.0026596931274980307]
    ]) */

    // console.log('fake shape', fake.shape)
    // console.log('real shape', real.shape)
    // const gp = tf.scalar(0.9998788)
    // console.log(fake.mean().arraySync(), real.mean().arraySync())
    // console.log(fake.mean().sub(real.mean()).arraySync())
    // console.log(fake.mean().sub(real.mean()).add(gp.mul(10.0)).arraySync())
    /* const x = tf.tensor(data[0])
    const y = tf.tensor(data[1])
    console.log(tf.sign(x).dataSync())
    console.log(tf.sign(y).dataSync())
    console.log((tf.sign(x).sub(tf.sign(y))).arraySync())
    console.log(tf.abs(tf.sign(x).sub(tf.sign(y))).arraySync())
    console.log(tf.abs(tf.sign(x).sub(tf.sign(y))).mean().arraySync())
    res.status(200).json({ message: 'Test data generation started', })
 */

    /*    const dt = tf.tensor(
           [[0.0001328508515143767],
           [0.00009782375127542764],
           [-0.0008963076397776604],
           [0.0004017833562102169],
           [0.000012839038390666246],
           [0.0007723102462477982],
           [0.00025670218747109175],
           [0.00024178772582672536],
           [0.0009538659360259771],
           [0.0003660211805254221],
           [0.00018731615273281932],
           [-0.0008398985955864191],
           [-0.000011556971003301442],
           [0.0003482191823422909],
           [-0.0001776097487891093],
           [0.0007150094024837017],
           [-0.00011951666965615004],
           [-0.0010030386038124561],
           [0.0006570029072463512]
           ])
       console.log('mean :', dt.mean().mul(-1).dataSync())
 
       let ss = 0
       data[0].forEach(ele => {
           let elm = ele[0]
           ss += elm
       })
       console.log(ss / data[0].length)
 
       let sum = 0
       data[0].forEach(ele => {
           let elm = ele[0]
           sum += Math.pow(elm, 2)
       })
       console.log('sum :', Math.sqrt(sum))
       console.log(Math.sqrt(sum) - 1)
       console.log(Math.pow((Math.sqrt(sum) - 1), 2))
       console.log('---------------------------------------')
 
       const dataTensor = tf.tensor(data)
       console.log(dataTensor.shape)
       const gn = dataTensor.square().sum([1, 2]).sqrt()
       console.log('GN: ', gn.arraySync())
 
       const gp = gn.sub(tf.scalar(1)).square().mean()
       console.log('GP: ', gp.arraySync()) */
    /* const dt = tf.tensor([
        [[0.0001328508515143767],
        [0.00009782375127542764],
        [-0.0008963076397776604],
        [0.0004017833562102169],
        [0.000012839038390666246],
        ]])
 
    const dc = tf.tensor([[
        [0.0007723102462477982],
        [0.00025670218747109175],
        [0.00024178772582672536],
        [0.0009538659360259771],
        [0.0003660211805254221],
        [0.00018731615273281932],
        [-0.0008398985955864191],
        [-0.000011556971003301442],
        [0.0003482191823422909],
        [-0.0001776097487891093],
        [0.0007150094024837017],
        [-0.00011951666965615004],
        [-0.0010030386038124561],
        [0.0006570029072463512]
    ]])
 
    const final = dc.concat(dt, 1)
 
        console.log(dt.shape)
    console.log(dc.shape)
    console.log(final.shape)
    console.log(final.arraySync()) */

    /* const data = [
        [
            [0.0001328508515143767],
            [0.00009782375127542764],
            [-0.0008963076397776604],
            [0.0004017833562102169],
            [0.000012839038390666246],
            [0.0007723102462477982],
            [0.00025670218747109175],
            [0.00024178772582672536],
            [0.0009538659360259771],
            [0.0003660211805254221],
            [0.00018731615273281932],
            [-0.0008398985955864191],
            [-0.000011556971003301442],
            [0.0003482191823422909],
            [-0.0001776097487891093],
            [0.0007150094024837017],
            [-0.00011951666965615004],
            [-0.0010030386038124561],
            [0.0006570029072463512]
        ],
        [
            [-0.0003606318205129355],
            [0.001308008679188788],
            [0.00013122377276886255],
            [0.0002781917864922434],
            [-0.0012376485392451286],
            [-0.0023580784909427166],
            [0.00026319053722545505],
            [0.0009982612682506442],
            [0.0008057521772570908],
            [0.0011556555982679129],
            [0.00005961134593235329],
            [0.0014554434455931187],
            [-0.001035070396028459],
            [-0.001772983348928392],
            [-0.002082324121147394],
            [-0.002064791973680258],
            [-0.0019586090929806232],
            [-0.0015365128638222814],
            [-0.0026596931274980307]
        ]
    ]
 
 
    console.log('E Norm : ', tf.euclideanNorm(x, 1).arraySync())
    console.log('E Norm - 1 : ', tf.euclideanNorm(x, 1).sub(tf.scalar(1)).arraySync())
    console.log('E Norm - 1 square : ', tf.euclideanNorm(x, 1).sub(tf.scalar(1)).square().arraySync())
    console.log('E Norm - 1 square mean : ', tf.euclideanNorm(x, 1).sub(tf.scalar(1)).square().mean().arraySync())
 
    console.log('E Norm gp : ', tf.euclideanNorm(x, 0).arraySync())
    console.log('E Norm gp -1 : ', tf.euclideanNorm(x, 0).sub(tf.scalar(1)).arraySync())
    console.log('E Norm gp -1 square: ', tf.euclideanNorm(x, 0).sub(tf.scalar(1)).square().arraySync())
    console.log('E Norm gp -1 square mean: ', tf.euclideanNorm(x, 0).sub(tf.scalar(1)).square().mean().arraySync())
 
    const newData = tf.tensor([
        [0.0001328508515143767],
        [0.00009782375127542764],
        [-0.0008963076397776604],
        [0.0004017833562102169],
        [0.000012839038390666246],
        [0.0007723102462477982],
        [0.00025670218747109175],
        [0.00024178772582672536],
        [0.0009538659360259771],
        [0.0003660211805254221],
        [0.00018731615273281932],
        [-0.0008398985955864191],
        [-0.000011556971003301442],
        [0.0003482191823422909],
        [-0.0001776097487891093],
        [0.0007150094024837017],
        [-0.00011951666965615004],
        [-0.0010030386038124561],
        [0.0006570029072463512]
    ])
 
    console.log(newData.shape)
    console.log(newData.mean().arraySync())
    console.log(newData.mean(1).dataSync())
    console.log(tf.tensor(data).mean(1).arraySync()) */
    // console.log(x.square().sum([1, 2]).sqrt().sub(tf.scalar(1)).arraySync())
    // console.log(x.square().sum([1, 2]).sqrt().sub(tf.scalar(1)).square().arraySync())
    // console.log(x.square().sum([1, 2]).sqrt().sub(tf.scalar(1)).square().mean().arraySync())



    try {
        /*  const data = tf.tensor([
             [
                 [0.0001328508515143767],
                 [0.00009782375127542764],
                 [-0.0008963076397776604],
                 [0.0004017833562102169],
                 [0.000012839038390666246],
                 [0.0007723102462477982],
                 [0.00025670218747109175],
                 [0.00024178772582672536],
                 [0.0009538659360259771],
                 [0.0003660211805254221],
                 [0.00018731615273281932],
                 [-0.0008398985955864191],
                 [-0.000011556971003301442],
                 [0.0003482191823422909],
                 [-0.0001776097487891093],
                 [0.0007150094024837017],
                 [-0.00011951666965615004],
                 [-0.0010030386038124561],
                 [0.0006570029072463512]
             ],
             [
                 [-0.0003606318205129355],
                 [0.001308008679188788],
                 [0.00013122377276886255],
                 [0.0002781917864922434],
                 [-0.0012376485392451286],
                 [-0.0023580784909427166],
                 [0.00026319053722545505],
                 [0.0009982612682506442],
                 [0.0008057521772570908],
                 [0.0011556555982679129],
                 [0.00005961134593235329],
                 [0.0014554434455931187],
                 [-0.001035070396028459],
                 [-0.001772983348928392],
                 [-0.002082324121147394],
                 [-0.002064791973680258],
                 [-0.0019586090929806232],
                 [-0.0015365128638222814],
                 [-0.0026596931274980307]
             ]
         ])
 
         console.log(data.shape)
         const model = tf.sequential()
         const weight_initializers = tf.initializers.randomNormal({ mean: 0.0, stddev: 0.02 })
         const dOptimizer = tf.train.adam(0.0004, 0.5, 0.9);
         // console.log(dOptimizer)
 
         model.add(tf.layers.conv1d({
             filters: 32,
             kernelSize: 2,
             strides: 1,
             padding: 'same',
             kernelInitializer: weight_initializers,
             batchInputShape: [null, 19, 5]
         }))
 
         model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
 
         model.add(tf.layers.bidirectional({
             layer: tf.layers.lstm({
                 units: 64,
                 activation: 'relu',
                 kernelInitializer: weight_initializers,
                 returnSequences: false,
                 dropout: 0.3,
                 recurrentDropout: 0.0
             })
         }))
 
         model.add(tf.layers.dense({ units: 64, activation: 'linear' }))
         model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
         model.add(tf.layers.dropout({ rate: 0.2 }))
 
         model.add(tf.layers.dense({ units: 32, activation: 'linear' }))
         model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
         model.add(tf.layers.dropout({ rate: 0.2 }))
 
         model.add(tf.layers.dense({ units: 1 }))
         // model.add(tf.layers.reshape({ targetShape: [19, 1] }));
 
         // model.add(tf.layers.lstm({ units: 50, activation: 'relu', inputShape: [19, 1] }));
         // model.add(tf.layers.repeatVector({ n: 5 }));
         // model.add(tf.layers.dropout({ rate: 0.1 }));
         // model.add(tf.layers.lstm({ units: 50, activation: 'relu', returnSequences: true }));
         // model.add(tf.layers.timeDistributed({ layer: tf.layers.dense({ units: 1 }), inputShape: [5, 50] }));
 
         console.log(model.getWeights().length)
         console.log(model.summary())
         console.log(model.resetStates()) */

        // let predict = model.predict(data)
        // console.log(predict.arraySync())

        // console.log(model.trainable)

        /* let xT = tf.tensor([[[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]]])
        let predict = model.predict(xT)
        // @ts-ignore
        console.log('Prediction : ', predict.dataSync())
 
        const x = tf.tensor1d([1.234567890, 2.5, 3]);
        tf.cast(x, 'float32').print(); */

        /* const model = tf.sequential()
        const weight_initializers = tf.initializers.randomNormal({ mean: 0.0, stddev: 0.02 })
        model.add(tf.layers.conv1d({
            filters: 32,
            kernelSize: 2,
            strides: 1,
            padding: 'same',
            kernelInitializer: weight_initializers,
            inputShape: [19, 1]
        }))
 
        model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
 
        model.add(tf.layers.conv1d({
            filters: 64,
            kernelSize: 2,
            strides: 1,
            padding: 'same',
            kernelInitializer: weight_initializers,
        }))
 
        model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
 
        model.add(tf.layers.flatten())
 
        model.add(tf.layers.dense({ units: 64, activation: 'linear', useBias: true }))
        model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
        model.add(tf.layers.dropout({ rate: 0.2 }))
 
        model.add(tf.layers.dense({ units: 32, activation: 'linear', useBias: true }))
        model.add(tf.layers.leakyReLU({ alpha: 0.1 }))
        model.add(tf.layers.dropout({ rate: 0.2 }))
 
        model.add(tf.layers.dense({ units: 1 }))
        // model.summary()
 
        const data = tf.tensor([
            [
                [0.0001328508515143767],
                [0.00009782375127542764],
                [-0.0008963076397776604],
                [0.0004017833562102169],
                [0.000012839038390666246],
                [0.0007723102462477982],
                [0.00025670218747109175],
                [0.00024178772582672536],
                [0.0009538659360259771],
                [0.0003660211805254221],
                [0.00018731615273281932],
                [-0.0008398985955864191],
                [-0.000011556971003301442],
                [0.0003482191823422909],
                [-0.0001776097487891093],
                [0.0007150094024837017],
                [-0.00011951666965615004],
                [-0.0010030386038124561],
                [0.0006570029072463512]
            ],
            [
                [-0.0003606318205129355],
                [0.001308008679188788],
                [0.00013122377276886255],
                [0.0002781917864922434],
                [-0.0012376485392451286],
                [-0.0023580784909427166],
                [0.00026319053722545505],
                [0.0009982612682506442],
                [0.0008057521772570908],
                [0.0011556555982679129],
                [0.00005961134593235329],
                [0.0014554434455931187],
                [-0.001035070396028459],
                [-0.001772983348928392],
                [-0.002082324121147394],
                [-0.002064791973680258],
                [-0.0019586090929806232],
                [-0.0015365128638222814],
                [-0.0026596931274980307]
            ]
        ])
 
        console.log(data.shape) */

        // let test = tf.tensor([[[1], [0.001], [0.03], [0.04], [-0.05], [-0.0006], [0.0007], [-0.08], [0.09], [0.10], [0.2], [0.4], [0.6], [0.11]]])
        // console.log(test.shape)
        /* let pred = model.apply(data, { training: true })
        console.log(pred.shape)
        console.log(pred.arraySync()) */



        /* model.compile({
            optimizer: tf.train.adam(),
            loss: 'meanSquaredError',
            metrics: ['mse', 'mae'],
        });
        let xT = tf.tensor([[[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]]])
        let yT = tf.tensor([[[1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4], [1, 2, 3, 4]]])
        model.fit(xT, yT)
 
        // console.log(model.summary())
 
        /* const inputShape = [time_step, feature_count]; // replace timeSteps and features with actual numbers
 
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
    */
        /* // Reshape the output to [null, 7, lstmUnits3]
        model.add(tf.layers.reshape({ targetShape: [look_ahead, lstmUnits[lstmUnits.length - 1]] })); */

        // Fully connected layer to map each [null, 7, 150] to [null, 7, 7]
        /* model.add(tf.layers.timeDistributed({
            layer: tf.layers.dense({ units: look_ahead, activation: 'relu' })
        })); */

        // Output layer: TimeDistributed dense layer to map [null, 7, 7] to [null, 7, 1]
        /* model.add(tf.layers.timeDistributed({
            layer: tf.layers.dense({ units: 1, activation: 'linear', inputShape: [look_ahead, lstmUnits[lstmUnits.length - 1]] }) // Outputs [null, 7, 1]
        }));
        model.add(tf.layers.reshape({ targetShape: [look_ahead, 1] })); */



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



    } catch (err) {
        log.error(err.stack)
        res.status(400).json({ message: 'Test data generation failed' })
    }
}

const calculateCoRelationMatrix = async (req, res) => {
    try {
        const data = [
            [1, 5, 2, 20],  // Row 1 with features for observation 1
            [2, 4, 2, 42],  // Row 2 with features for observation 2
            [3, 3, 3, 22],  // Row 3 with features for observation 3
            [4, 2, 3, 89],  // Row 4 with features for observation 4
            [5, 1, 4, 64],  // Row 5 with features for observation 5
        ];

        const result = await TFMUtil.normalizeData({ features: data })
        const minMaxed = result.normalized_data
        const min = result.mins_array
        const max = result.maxs_array
        console.log('minmax', minMaxed)


        const inversedTransformed = await TFMUtil.inverseNormalizeData({ normalized_data: minMaxed, mins_array: min, maxs_array: max })

        console.log('reversed ', inversedTransformed)


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
            // console.log(fData)
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
    testNewModel,
    generateTestData
}