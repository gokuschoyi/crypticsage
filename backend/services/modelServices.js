const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))

const tf = require('@tensorflow/tfjs-node');
const config = require('../config');
const { fetchEntireHistDataFromDb, fetchTickerHistDataBasedOnCount } = require('../services/mongoDBServices')
const TFMUtil = require('../utils/tf_modelUtil')
const HDUtil = require('../utils/historicalDataUtil')
const path = require('path');
const { Queue, Worker } = require('bullmq');
const { redisClient } = require('../services/redis')
const connection = redisClient // Create a Redis connection

const {
    checkOrder
    , checkIfValidationIsPossible
    , getDifferentKeys
    , calcuteTotalTickerCountForForecast
} = require('../utils/modelUtil')

const Redis = require("ioredis");
// @ts-ignore
const redisPublisher = new Redis();
// @ts-ignore
const wganpgDataRedis = new Redis()
const celery = require('celery-node');
const pyClient = celery.createClient(
    `redis://${config.redis_host}:${config.redis_port}`,
    `redis://${config.redis_host}:${config.redis_port}`,
    'wgan_gp_training'
);

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

const process_data_request = async ({
    uid
    , model_id
    , asset_type
    , ticker_name
    , period
    , fTalibExecuteQuery
    , model_training_parameters
    , redis_key_for_hist_data
    , samples
}) => {
    // Model parameters
    const {
        to_predict,
        look_ahead,
        transformation_order,
        slice_index,
    } = model_training_parameters

    let ticker_history, talib_results, trimmed, features, datesAndActual
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
                    period,
                    uid
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
                    datesAndActual = trimmed.tickerHist
                        .slice(-(samples + look_ahead - 1))
                        .map((ticker_point) =>
                        ({
                            date: new Date(ticker_point.openTime).toLocaleString(),
                            actual: ticker_point[to_predict]
                        })
                        )
                    // console.log(messages)
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
                }
                try {
                    // @ts-ignore
                    const { features: fs_, metrics } = await step_function(transform_payload)
                    features = fs_
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'feature_relations', uid, metrics }))
                } catch (error) {
                    const newErrorMessage = { func_error: error.message, message: 'Error in combining OHLCV and selected function data', step: i }
                    throw new Error(JSON.stringify(newErrorMessage));
                }
                redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `(4) : Transformed and combined the OHLCV and talib function data...` }))
                break;
            case 5: // Call the celery python worker
                const { model_type, ...rest } = model_training_parameters
                await wganpgDataRedis.hset(redis_key_for_hist_data, {
                    // @ts-ignore
                    features: JSON.stringify(features.slice(-slice_index)), // remove slice after testing
                    dates: JSON.stringify(datesAndActual),
                    training_parameters: JSON.stringify({ ...rest })
                })

                redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `(5) : Features saved to redis and Celery worker called...` }))
                break;
            default:
                break;
        }
    }
}

const trainWganModel = async (training_data, uid, model_id) => {
    const { model_training_parameters, fTalibExecuteQuery } = training_data
    log.error(`Starting ${model_training_parameters.model_type} Initialization`)

    const { db_query } = fTalibExecuteQuery[0].payload;
    const { asset_type, ticker_name, period } = db_query
    const redis_key_for_hist_data = `${uid}_${model_id}_${asset_type}-${ticker_name}-${period}_historical_data`

    // console.log('GAN redis data key name : ', redis_key_for_hist_data)

    // Model parameters
    const {
        training_size,
        time_step,
        look_ahead,
        batchSize,
        transformation_order,
        do_validation,
        slice_index,
    } = model_training_parameters

    // check if the historical data is present in redis or not
    const isHistoricalDataPresent = await wganpgDataRedis.exists(redis_key_for_hist_data)
    if (isHistoricalDataPresent === 1) {
        log.warn(`Historical data is present in redis, checking parameters: ${isHistoricalDataPresent}...`)

        const training_params = JSON.parse(await wganpgDataRedis.hget(redis_key_for_hist_data, 'training_parameters'))
        const {
            transformation_order: to,
            slice_index: si,
            time_step: ts,
            look_ahead: la,
            batchSize: bs,
            training_size: train_s,
            do_validation: d_v
        } = training_params

        const orderChanged = checkOrder(to, transformation_order)
        console.log('TRANSFOR ORFDER', orderChanged)

        // checking if transformation_order or slice_index has changed, if so fetch and process the new data
        if (
            orderChanged &&
            si === slice_index &&
            train_s === training_size &&
            ts === time_step &&
            la === look_ahead &&
            bs === batchSize &&
            d_v === do_validation
        ) {
            log.warn('Parameters have not changed, calling celery worker with existing data...')
            redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `Features present in redis, Celery worker called...` }))

            // set the modified features in the redis store
            const features = JSON.parse(await wganpgDataRedis.hget(redis_key_for_hist_data, 'features'))
            const metrics = await TFMUtil.calculateFeatureMetrics({ features })
            // console.log("New metrics : ", metrics)
            // redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'feature_relations', uid, metrics }))

            const { model_type, ...rest } = model_training_parameters
            await wganpgDataRedis.hset(redis_key_for_hist_data, {
                training_parameters: JSON.stringify({ ...rest }),
                feature_metrics: JSON.stringify(metrics)
            })

            // call the celery python worker
            const task = pyClient.createTask("celeryTasks.trainModel");
            task.delay({
                message: 'Request from node to start WGAN_GP model training',
                uid,
                m_id: model_id,
                model_proces_id: redis_key_for_hist_data,
                existing_data: true
            });

            return ({
                status: true
                , message: 'Gan model training started'
                , info: 'Parameters have not changed.'
                , finalRs: []
                , job_id: model_id
            });
        } else {
            log.warn('Parameters have changed, processing data...')
            log.warn('transformation_order or slice_index has changed, fetching the required data')
            let { train_possible, test_possible } = checkIfValidationIsPossible(slice_index, time_step, look_ahead, training_size, batchSize, do_validation)
            if (train_possible.status && test_possible.status) {
                let samples = test_possible.samples
                await process_data_request({
                    uid,
                    model_id,
                    asset_type,
                    ticker_name,
                    period,
                    fTalibExecuteQuery,
                    model_training_parameters,
                    redis_key_for_hist_data,
                    samples
                })

                const task = pyClient.createTask("celeryTasks.trainModel");
                task.delay({
                    message: 'Request from node to start WGAN_GP model training',
                    uid,
                    m_id: model_id,
                    model_proces_id: redis_key_for_hist_data,
                    existing_data: false
                });

                return ({
                    status: true
                    , message: 'Gan model training started'
                    , info: 'Parameters have changed'
                    , finalRs: []
                    , job_id: model_id
                });
            } else {
                return ({
                    status: false,
                    message: 'Incorrect training, parameters. Adjust them and start training again',
                    train_possible,
                    test_possible
                })
            }
        }
    } else {
        log.warn('Historical data not present in redis, fetching the required data')
        let { train_possible, test_possible } = checkIfValidationIsPossible(slice_index, time_step, look_ahead, training_size, batchSize, do_validation)

        if (train_possible.status && test_possible.status) {
            let samples = test_possible.samples
            await process_data_request({
                uid,
                model_id,
                asset_type,
                ticker_name,
                period,
                fTalibExecuteQuery,
                model_training_parameters,
                redis_key_for_hist_data,
                samples
            })

            const task = pyClient.createTask("celeryTasks.trainModel");
            task.delay({
                message: 'Request from node to start WGAN_GP model training',
                uid,
                m_id: model_id,
                model_proces_id: redis_key_for_hist_data,
                existing_data: false
            });
            return ({
                status: true
                , message: 'Gan model training started'
                , info: 'Historical data not present in redis, fetching the required data'
                , finalRs: []
                , job_id: model_id
            });
        } else {
            return ({
                status: false,
                message: 'Incorrect training, parameters. Adjust them and start training again',
                train_possible,
                test_possible
            })
        }
    }
}

const trainLstmModel = async (training_data, uid, model_id) => {
    const { model_training_parameters, fTalibExecuteQuery } = training_data
    log.error(`Starting ${model_training_parameters.model_type} Initialization`)

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
        return ({ message, finalRs: [], job_id: model_id });
    } else {
        model_worker.run()
        const message = "Model Training started"
        return ({ message, finalRs: [], job_id: model_id });
    }
}

const retrainWganModel = async (retraining_data, uid) => {
    const { additional_data, fTalibExecuteQuery, fullRetrainParams } = retraining_data
    const { model_id, checkpoint } = additional_data
    const { db_query: { asset_type, ticker_name, period } } = fTalibExecuteQuery[0].payload;

    const redis_key_for_hist_data = `${uid}_${model_id}_${asset_type}-${ticker_name}-${period}_historical_data`

    log.error(`Starting WGAN-GP Re-Train Initialization`)

    const isHistoricalDataPresent = await wganpgDataRedis.exists(redis_key_for_hist_data)
    if (isHistoricalDataPresent === 1) {
        log.warn('Similar training data exists, checking training parameters...')
        const training_params_redis = JSON.parse(await wganpgDataRedis.hget(redis_key_for_hist_data, 'training_parameters'))

        // Check for keys that have changes, exclude transformation_order
        const { transformation_order: retrain_transformation_order, model_type: retrainModelType, ...restRetrainParams } = fullRetrainParams
        const { transformation_order: redis_transformation_order, model_type: redisModelType, ...restParamsRedis } = training_params_redis

        const diff_keys = getDifferentKeys(restRetrainParams, restParamsRedis)
        if (diff_keys.length === 0) {
            log.info('parameters are same, retraining the model...')
            // call the celery python worker
            const task = pyClient.createTask("celeryTasks.retrainModel");
            task.delay({
                message: 'Request from node to retrain model.',
                uid,
                m_id: model_id,
                model_proces_id: redis_key_for_hist_data,
                existing_data: false, // check this stuff later
                checkpoint
            });
            return ({
                status: true
                , message: 'Model re-training started'
                , info: 'Similar training data : Parameters are same, retraining the model...'
                , job_id: model_id
            });
        } else {
            log.warn('Parameters are different, updating them in redis...')
            console.log('Parameters with different values', diff_keys)

            await wganpgDataRedis.hset(redis_key_for_hist_data, {
                training_parameters: JSON.stringify({
                    ...restRetrainParams,
                    transformation_order: retrain_transformation_order
                })
            })

            // call the celery python worker
            const task = pyClient.createTask("celeryTasks.retrainModel");
            task.delay({
                message: 'Request from node to retrain model.',
                uid,
                m_id: model_id,
                model_proces_id: redis_key_for_hist_data,
                existing_data: false, // check this stuff later
                checkpoint
            });
            return ({
                status: true
                , message: 'Model re-training started'
                , info: 'Similar training data : Parameters are differnt, retraining the model...'
                , job_id: model_id
            });
        }

    } else {
        log.warn('No data exists for the parameters. Will require Full data fetch')
        const {
            training_size,
            time_step,
            look_ahead,
            batchSize,
            do_validation,
            slice_index,
        } = fullRetrainParams

        let { train_possible, test_possible } = checkIfValidationIsPossible(slice_index, time_step, look_ahead, training_size, batchSize, do_validation)
        if (train_possible.status && test_possible.status) {
            let samples = test_possible.samples
            await process_data_request({
                uid,
                model_id,
                asset_type,
                ticker_name,
                period,
                fTalibExecuteQuery,
                model_training_parameters: fullRetrainParams,
                redis_key_for_hist_data,
                samples
            })

            // call the celery python worker
            const task = pyClient.createTask("celeryTasks.retrainModel");
            task.delay({
                message: 'Request from node to retrain model.',
                uid,
                m_id: model_id,
                model_proces_id: redis_key_for_hist_data,
                existing_data: false,
                checkpoint
            });
            return ({
                status: true
                , message: 'No data exists for the parameters. Will require Full data fetch'
                , info: 'Full fetch for retrain'
                , train_possible
                , test_possible
                , job_id: model_id
            })
        } else {
            return ({
                status: false,
                message: 'Incorrect training, parameters. Adjust them and start training again',
                info: '',
                train_possible,
                test_possible
            })
        }
    }
}

/**
 * 
 * @param {Object} forecastData 
 * @returns {Promise<{status: boolean,message: String, result: any, error: any}>}
 */
const makeLstmForecast = async (forecastData) => {
    const { training_parameters, talibExecuteQueries, model_id, model_first_prediction_date, model_train_period, mean_array, variance_array } = forecastData
    const { transformation_order, timeStep, lookAhead, multiSelectValue } = training_parameters
    log.info(`Starting forcast for model : ${model_id}`)

    const totalTickerCount = calcuteTotalTickerCountForForecast(model_train_period, model_first_prediction_date) // 461 total no of ticker since initial model prediction
    const lastDate = model_first_prediction_date + (totalTickerCount * HDUtil.periodToMilliseconds(model_train_period))
    log.notice(`First prediction date : ${new Date(model_first_prediction_date).toLocaleString()}`)
    log.notice(`Total ticker count since initial forecast : ${totalTickerCount}`)
    log.notice(`New forecast start date : ${new Date(lastDate).toLocaleString()}`)

    // Step 1
    // fetching the ticker data from db, fetching the last 100 data points as it is difficult ot figure out the exact length to fetch
    // as the talin execute queries have varying offset values for calculation
    const { payload: { db_query: { asset_type, period, ticker_name } } } = talibExecuteQueries[0];
    const tickerDataForProcessing = await fetchTickerHistDataBasedOnCount(asset_type, ticker_name, period, 1500)

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
    const { features: features_, metrics } = await TFMUtil.transformDataToRequiredShape({ tickerHist, finalTalibResult, transformation_order })
    log.notice(`featuresX length : ${features_.length}`)

    // Step 5
    // Standardize the array of features
    const mean_tensor = tf.tensor(mean_array)
    const variance_tensor = tf.tensor(variance_array)
    const standardized_features = tf.div(tf.sub(tf.tensor(features_), mean_tensor), tf.sqrt(variance_tensor));
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
    log.notice(`Features length : ${features.length}`) // 1367

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
        log.notice(`Final forecast length : ${forecast.length}`) //1367

        // getting dates to plot

        const slicedTickerHist = tickerHist.slice(-(forecast.length - 1)) // removing the first date to align with the predictions
        log.notice(`Sliced ticker hist length : ${slicedTickerHist.length}`) // 1366
        log.notice(`Last prediction date : ${slicedTickerHist[slicedTickerHist.length - 1].date}`)

        slicedTickerHist.forEach((item, index) => {
            const strDate = new Date(item.openTime).toLocaleString();
            const actualValue = parseFloat(item[multiSelectValue])
            // const predictedValue = calculateOriginalPrice(forecast[index][0][0], variance_array[e_key], mean_array[e_key])

            dates.push({
                date: strDate,
                actual: actualValue,
            })
        })

        log.notice(`Dates length : ${dates.length}`) // 1366

        let filtered_dates = dates.filter((item) => item.open * 1000 >= model_first_prediction_date)
        if (filtered_dates.length !== 0) {
            dates = filtered_dates
        } else {
            dates = dates
        }
        log.notice(`Dates length after slice : ${dates.length}`) // 461
        log.notice(`Model Lookahead : ${lookAhead}`)
    } catch (error) {
        log.error(error.stack)
        throw error
    }

    const fcst = forecast.slice((forecast.length - dates.length - 1), forecast.length)
    const forecastTensor = tf.tensor(fcst)
    console.log('Shape of forecast', forecastTensor.shape)

    // @ts-ignore
    const reshapedForecast = tf.squeeze(forecastTensor, axis = -1)
    console.log('reshaped', reshapedForecast.shape)

    // call the celery python worker
    const task = pyClient.createTask("celeryTasks.convertPredictionToCorrectFormat");
    const data = {
        message: 'Request from node to transform prediction data',
        dates: JSON.stringify(dates),
        forecast: JSON.stringify(reshapedForecast.arraySync()),
        lookAhead,
        period,
        totalTickerCount,
        mean: JSON.stringify(mean_array),
        variance: JSON.stringify(variance_array)
    }

    let celeryResult = {
        status: false,
        message: '',
        result: [],
        error: ''
    }

    const result = task.applyAsync([data]);
    await result.get(5000)
        .then(data => {
            console.log('Data from celery');
            celeryResult.status = true
            celeryResult.message = 'LSTM Model forcast completed'
            celeryResult.result = JSON.parse(data.transformed)
            celeryResult.error = ''
        })
        .catch(err => {
            console.log('Error from celery', err);
            celeryResult.status = false
            celeryResult.message = 'LSTM Model forecasting failed'
            celeryResult.result = []
            celeryResult.error = err.message
        })

    return celeryResult
}

const makeWganForecast = async (wganForecastData, uid) => {
    const { training_parameters, talibExecuteQueries, model_id, model_first_prediction_date, model_train_period } = wganForecastData
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
    const tickerDataForProcessing = await fetchTickerHistDataBasedOnCount(asset_type, ticker_name, period, 1500)

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

    const dates = tickerHist.map((data) => ({ date: new Date(data.openTime).toLocaleString(), actual: data[multiSelectValue] }))

    console.log('ticker data : ', tickerHist[tickerHist.length - 1])

    // Step 4
    // Transforiming the data to required shape before tranforming to tensor/2D array
    const { features: features_, metrics } = await TFMUtil.transformDataToRequiredShape({ tickerHist, finalTalibResult, transformation_order })
    log.notice(`Fetched features length : ${features_.length}`)

    let to_predict_index = 0
    transformation_order.forEach((order, i) => {
        if (order.value === multiSelectValue) {
            to_predict_index = i
            return
        }
    })

    // call the celery python worker
    const task = pyClient.createTask("celeryTasks.makePrediction");
    const data = {
        message: 'Request from node to make prediction',
        uid,
        m_id: model_id,
        features: JSON.stringify(features_),
        dates: JSON.stringify(dates),
        to_predict_index: to_predict_index,
        lookAhead: timeStep,
        timeStep: lookAhead,
        period: period,
        totalTickerCount: totalTickerCount
    }

    let celeryResult = {
        status: false,
        message: '',
        result: [],
        error: ''
    }

    const result = task.applyAsync([data]);
    await result.get(5000) // timeoout added in case celery worker is not running
        .then(data => {
            console.log('Data from celery');
            celeryResult.status = true
            celeryResult.message = 'WGAN Model forcast completed'
            celeryResult.result = JSON.parse(data.predictions)
            celeryResult.error = ''
        })
        .catch(err => {
            console.log('Error from celery');
            celeryResult.status = false
            celeryResult.message = 'WGAN Model forecasting failed'
            celeryResult.result = []
            celeryResult.error = err.message
        });
    return celeryResult
}


module.exports = {
    trainWganModel
    , trainLstmModel
    , retrainWganModel
    , makeLstmForecast
    , makeWganForecast
}