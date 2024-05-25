const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))

const { v4: uuidv4 } = require('uuid');
const { fetchEntireHistDataFromDb } = require('../services/mongoDBServices')
const MDBServices = require('../services/mongoDBServices')
const IUtil = require('../utils/indicatorUtil');
const CSUtil = require('../utils/cryptoStocksUtil')
const CacheUtil = require('../utils/cacheUtil')

const tf = require('@tensorflow/tfjs-node');

const fs = require('fs')

const Redis = require("ioredis");
// @ts-ignore
const wganpgDataRedis = new Redis()

const config = require('../config');
const TFMUtil = require('../utils/tf_modelUtil')
const celery = require('celery-node');
const {
    deleteWGANModelAndLogs
    , deleteModelFromLocalDirectory
    , getSavedModelCheckPoint
    , calculatACF
    , calculatePACF
    , calculate_confidence_interval
    , deleteIntermediateCheckpoints
} = require('../utils/modelUtil')

const {
    trainWganModel
    , trainLstmModel
    , retrainWganModel
    , makeLstmForecast
    , makeWganForecast
} = require('../services/modelServices')

const pyClient = celery.createClient(
    `redis://${config.redis_host}:${config.redis_port}`,
    `redis://${config.redis_host}:${config.redis_port}`,
    'wgan_gp_training'
);

const procssModelTraining = async (req, res) => {
    const { model_training_parameters: { model_type }, model_id } = req.body
    const uid = res.locals.data.uid;
    // const model_id = uuidv4();
    const training_data = req.body

    log.info(`Starting model training with id : ${model_id}`)

    try {
        const isModelGAN = model_type === 'GAN' ? true : false // GAN or multi_input_single_output_step

        if (isModelGAN) {
            const { status, ...rest } = await trainWganModel(training_data, uid, model_id)
            if (status) {
                res.status(200).json({ ...rest });
            } else {
                res.status(400).json({ ...rest })
            }
        } else { // for non GAN models
            const lstmTrainingResult = await trainLstmModel(training_data, uid, model_id)
            if (lstmTrainingResult) {
                res.status(200).json({ ...lstmTrainingResult });
            }
        }

    } catch (error) {
        log.error(error.message)
        res.status(500).json({ message: 'Model training failed, Try again later' })
    }
}

const retrainModel = async (req, res) => {
    const { additional_data, fTalibExecuteQuery } = req.body
    const { model_id, checkpoint } = additional_data
    const { db_query: { asset_type, ticker_name, period } } = fTalibExecuteQuery[0].payload;

    log.info(`Re-Training model : ${model_id}`) // add asset type, tickername and period from FE
    const uid = res.locals.data.uid;
    const redis_key_for_hist_data = `${uid}_${model_id}_${asset_type}-${ticker_name}-${period}_historical_data`
    // log.info(`Redis key for re train : ${redis_key_for_hist_data}`)

    const retraining_data = req.body
    try {
        const { status, ...rest } = await retrainWganModel(retraining_data, uid)
        if (status) {
            res.status(200).json({ ...rest });
        } else {
            res.status(400).json({ ...rest })
        }
    } catch (error) {
        log.error(error.stack)
        res.status(500).json({ message: 'Model re-training failed, Try again later' })
    }
}

// if this func is called before wgan training, (not implemented yet)
// the redis key used here will be used for all further trainig to fetch data from redis.
const calculateCoRelationMatrix = async (req, res) => {
    const { transformation_order, talibExecuteQueries } = req.body
    const { db_query: { asset_type, ticker_name, period } } = talibExecuteQueries[0].payload;
    // const uid = res.locals.data.uid;
    // const redis_key_for_hist_data = `${uid}_${asset_type}-${ticker_name}-${period}_historical_data`

    // log.info(`Redis key for re train : ${redis_key_for_hist_data}`)
    try {
        const historicalData = await fetchEntireHistDataFromDb({ type: asset_type, ticker_name, period, return_result_: true })
        const talibResult = await TFMUtil.processSelectedFunctionsForModelTraining({ selectedFunctions: talibExecuteQueries, tickerHistory: historicalData })
        const { tickerHist, finalTalibResult } = await TFMUtil.trimDataBasedOnTalibSmallestLength({ finalTalibResult: talibResult, tickerHistory: historicalData })
        const { features, metrics } = await TFMUtil.transformDataToRequiredShape({ tickerHist, finalTalibResult, transformation_order })
        res.status(200).json({ message: 'Correlation matrix calculated successfully', corelation_matrix: metrics })
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Correlation matrix calculation failed' })
    }
}

const getModel = async (req, res) => {
    const uid = res.locals.data.uid
    try {
        const models = await MDBServices.fetchUserModels(uid)
        res.status(200).json({ message: 'Model fetched successfully', models })
    } catch (err) {
        log.error(err.stack)
        res.status(400).json({ message: 'Model fetching failed' })
    }
}

const saveModel = async (req, res) => {
    const payload = req.body.payload
    const {
        model_type,
        model_id,
        model_name,
        ticker_name,
        ticker_period,
        talibExecuteQueries,
        epoch_results,
        train_duration,
        correlation_data,
        training_parameters
    } = payload
    let model_data
    if (model_type === 'LSTM') {
        let {
            scores,
            predicted_result,
        } = payload

        const { dates, predictions_array, label_mean, label_variance } = predicted_result
        const rmse = IUtil.calculateScaledRMSE(dates, predictions_array, label_variance, label_mean, ticker_period)
        predicted_result['rmse'] = rmse

        model_data = {
            scores,
            epoch_results,
            train_duration,
            correlation_data,
            predicted_result,
            training_parameters,
            talibExecuteQueries,
        }
    } else {
        const {
            wgan_intermediate_forecast,
            wgan_final_forecast
        } = payload
        model_data = {
            epoch_results,
            train_duration,
            correlation_data,
            training_parameters,
            talibExecuteQueries,
            wgan_intermediate_forecast,
            wgan_final_forecast
        }
    }

    try {
        const uid = res.locals.data.uid;
        const [model_save_status, modelSaveResult] = await MDBServices.saveModelForUser(
            uid,
            ticker_name,
            ticker_period,
            model_id,
            model_name,
            model_type,
            model_data
        )
        const saveType = payload?.save_type || ''
        let intermediate_delete_result
        if (saveType === 'intermediate') {
            console.log('Removing intermediate file from db (SAVE)')
            intermediate_delete_result = await MDBServices.delete_inProgressModel(uid, model_id)
        }
        res.status(200).json({ message: 'Model saved successfully', model_save_status, modelSaveResult, user_id: uid, intermediate_delete_result })
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Model saving failed' })
    }
}

const deleteModel = async (req, res) => { // Deleting model from local directory and redis if not being saved
    const uid = res.locals.data.uid;
    const {
        model_id
        , model_type
        , asset_type
        , ticker_name
        , period
        , delete_type
        , last_checkpoint
    } = req.body
    try {
        let deleted, intermediateModelDeleted
        if (model_type === 'LSTM') {
            deleted = await deleteModelFromLocalDirectory(model_id)
        } else if (model_type === 'WGAN-GP') {
            if (delete_type === 'intermediate') {
                intermediateModelDeleted = await MDBServices.delete_inProgressModel(uid, model_id)
            }

            if (last_checkpoint === undefined || last_checkpoint === '') {
                deleted = await deleteWGANModelAndLogs(model_id)
            } else {
                deleted = await deleteIntermediateCheckpoints(model_id, last_checkpoint)
            }
        }

        const redis_key_for_hist_data = `${uid}_${model_id}_${asset_type}-${ticker_name}-${period}_historical_data`
        console.log('REDIS KEY TO REMOVE : ', redis_key_for_hist_data)
        const dataPresent = await wganpgDataRedis.exists(redis_key_for_hist_data)
        if (dataPresent) {
            await wganpgDataRedis.del(redis_key_for_hist_data)
            log.info('Data from redis cleared')
        } else {
            log.info('No data for that key present')
        }
        if (deleted) {
            res.status(200).json({ message: 'Model deleted successfully' })
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Model deletion failed' })
    }
    //backend/models/0fb70a60-8a62-443f-bfb5-2090e5742957
}

const deleteUserModel = async (req, res) => { // If file has already been deleted then the delete fro mlocal returns false. Check
    try {
        const { model_id, model_type } = req.body
        const uid = res.locals.data.uid;
        const user_model_deleted = await MDBServices.deleteUserModel(uid, model_id)
        let model_deleted
        if (model_type === 'LSTM') {
            model_deleted = await deleteModelFromLocalDirectory(model_id)
        } else if (model_type === 'WGAN-GP') {
            model_deleted = await deleteWGANModelAndLogs(model_id)
        }
        if (model_deleted && user_model_deleted) {
            res.status(200).json({ message: 'Model deleted successfully' })
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Model deletion failed' })

    }
}

const updateNewTrainingResults = async (req, res) => {
    const uid = res.locals.data.uid;
    const { update_type, ...rest } = req.body.payload
    const data = { ...rest, uid }

    try {
        let intermediate_delete_result
        if (update_type === 'intermediate') {
            console.log('Removing intermediate file from db (UPDATE)')
            const model_id = rest.model_id
            intermediate_delete_result = await MDBServices.delete_inProgressModel(uid, model_id)
        }
        const wgan_new_prediction_update = await MDBServices.addNewWganTrainingResults(data)
        res.status(200).json({ message: 'Model updated successfully', wgan_new_prediction_update, user_id: uid, intermediate_delete_result })
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Model update failed' })
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

const getModelCheckpoints = async (req, res) => {
    const { model_id } = req.query
    try {
        const checkpoints = getSavedModelCheckPoint(model_id)
        res.status(200).json({ message: 'Model checkpoints fetched successfully', checkpoints })
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Model checkpoints fetching failed' })
    }
}

const makeNewForecast = async (req, res) => {
    const forecastData = req.body.payload
    try {
        const { status, ...rest } = await makeLstmForecast(forecastData)
        if (status) {
            res.status(200).json({ ...rest });
        } else {
            res.status(400).json({ ...rest })
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'LSTM Model forecasting failed', error: error.message })
    }
}

const makeWgangpForecast = async (req, res) => {
    const uid = res.locals.data.uid;
    const wganForecastData = req.body.payload
    try {
        const { status, ...rest } = await makeWganForecast(wganForecastData, uid)
        if (status) {
            res.status(200).json({ ...rest });
        } else {
            res.status(400).json({ ...rest })
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Node Model forecasting failed', error: error.message })
    }
}

const partialAutoCorrelation = async (req, res) => {
    const { asset_type, ticker_name, period, maxLag, seriesName, confidenceLevel } = req.body
    const uid = res.locals.data.uid;
    const historical_data = await MDBServices.fetchEntireHistDataFromDb({ type: asset_type, ticker_name, period, return_result_: true })
    const data = historical_data.map(item => parseFloat(item[seriesName]))

    const acf = calculatACF(data, maxLag)
    const pacf = calculatePACF(acf, maxLag);

    // console.log('Auto correlation coefficients:', acf)
    // console.log("Partial autocorrelation coefficients:", pacf);

    const ci = calculate_confidence_interval(pacf, confidenceLevel, data.length)

    let pacf_final = []
    for (let i = 0; i < pacf.length; i++) {
        pacf_final.push({ lag: i, acf: acf[i], pacf: pacf[i], lower_bound: ci[i][0] - pacf[i], upper_bound: ci[i][1] - pacf[i] })
    }
    res.status(200).json({
        message: 'Partial Autocorrelation calculated successfully',
        pacf_final,
    })
}

const quickForecasting = async (req, res) => {
    try {
        const { module, symbol, period, model_data } = req.body
        const uid = res.locals.data.uid;
        console.log('Quick forecasting', uid, module, symbol, period, model_data.forecasting_model)
        // Fetch data and save to redis
        const redis_ticker_hist_key = `${module}_${symbol}_${period}_full_historical_data`
        console.log('Redis key for quick forecasting : ', redis_ticker_hist_key)

        const is_hist_data_present = await CacheUtil.get_cached_data(redis_ticker_hist_key, 'quick forecasting', false)

        if (!is_hist_data_present) {
            log.warn('Data not present in cache for QF')
            await MDBServices.fetchEntireHistDataFromDb({ type: module, ticker_name: symbol, period, return_result_: false })
        } else {
            log.info(`Data present in cache : ${is_hist_data_present.length}`)
        }


        // Call the celery task and return status
        const task = pyClient.createTask("celeryTasks.quick_forecasting");
        const result = task.applyAsync([{
            message: 'Request from node to test quick forecasting.',
            redis_key: redis_ticker_hist_key,
            model_data: model_data,
        }])

        result.get()
            .then(data => {
                // console.log(data)
                const last_date = data.last_date
                const forecast = data.result
                const period_to_ms = CSUtil.periodToMilliseconds(period)
                const forecasted_data = forecast.map((item, i) => {
                    return {
                        date: new Date(last_date + (period_to_ms * (i + 1))).toLocaleString(),
                        openTime: last_date + (period_to_ms * (i + 1)),
                        ...item
                    }
                })
                res.status(200).json({ message: 'Quick forecasting completed', forecast: forecasted_data })
            })
            .catch(err => console.log(err))
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Quick forecasting failed' })
    }
}

const getCachedTrainignResultsFromDB = async (req, res) => {
    try {
        const { uid, model_id } = req.body
        const cached_result = await MDBServices.getCachedTrainingResults(uid, model_id)
        cached_result.cached_data.epoch_results = cached_result.cached_data.epoch_results.map(item => ({ ...item.log, epoch: item.epoch }))
        if (cached_result.cached_data.intermediate_forecast !== undefined) {
            cached_result.cached_data.intermediate_forecast = cached_result.cached_data.intermediate_forecast.map(item => {
                const { data, ...rest } = item
                return {
                    forecast: data,
                    ...rest
                }
            })
        }
        res.status(200).json({ message: 'Model training fetched.', f_result: cached_result })
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Model training results fetching failed' })
    }
}

const getTrainingStatusForModel = async (req, res) => {
    try {
        const { model_id } = req.body
        const uid = res.locals.data.uid;
        const [training_completed, model_train_end_time] = await MDBServices.getModelTrainingStatus(uid, model_id)
        res.status(200).json({ message: 'Model data fetched successfully', training_completed, model_train_end_time })
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Model training results fetching failed' })
    }
}


const getModelResult = async (req, res) => { // Only LSTM Models
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

const testing = async (model_id) => { // celery test endpoint
    // call the celery python worker
    // const task = pyClient.createTask("celeryTasks.testing");
    // const taskName = "celeryTasks.testing"
    // const args = [{
    //     message: 'Request from node to test testing.',
    //     model_id: model_id,
    //     checkpoint: 'checkpoint_340'
    // }]
    // const kwargs = {}
    // const taskId = `testing_${uuidv4()}`
    // const result_ = pyClient.sendTask(taskName, args, kwargs, taskId)
    // // const result = task.applyAsync([{
    // //     message: 'Request from node to test testing.',
    // //     model_id: model_id,
    // //     checkpoint: 'checkpoint_340'
    // // }])

    // result_.get(5000)
    //     .then(data => {
    //         console.log('test data', data)
    //         return data
    //     })
    //     .catch(err => console.log(err))


    // const result = await MDBServices.get_userInProgressModels('f6951b4d-4976-4a0c-986f-61e24f849510')
    // await clear_wgan_models()
    const last_checkpoint = 'checkpoint_5'
    const deleteModelCheckpoints = await deleteIntermediateCheckpoints(model_id, last_checkpoint)
    return deleteModelCheckpoints
}

// Clearing unsaved wgan-gp models
const clear_wgan_models = async () => {
    try {
        const model_path = `./worker_celery/saved_models`
        let model_names = []
        if (fs.existsSync(model_path)) {
            // console.log('Model data present')
            model_names = fs.readdirSync(model_path, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name)
        }

        const saved_models = await MDBServices.getSavedWGANGPModelIds()

        const to_remove = model_names.filter(item => !saved_models.includes(item))

        to_remove.forEach((model) => {
            const m_path = `./worker_celery/saved_models/${model}`
            if (fs.existsSync(m_path)) {
                fs.rm(m_path, { recursive: true }, (err) => {
                    if (err) {
                        throw err
                    }
                    log.info(`Removed model files : ${model}`)
                });
                return true
            } else {
                log.info(`Model file not found for : ${model}`)
            }
        })
        return [model_names, saved_models, to_remove]
    } catch (error) {
        log.error(error.stack)
    }
}

module.exports = {
    procssModelTraining
    , retrainModel
    , calculateCoRelationMatrix
    , getModel
    , saveModel
    , deleteModel
    , deleteUserModel
    , updateNewTrainingResults
    , renameModel
    , getModelCheckpoints
    , makeNewForecast
    , makeWgangpForecast
    , partialAutoCorrelation
    , quickForecasting
    , getCachedTrainignResultsFromDB
    , getTrainingStatusForModel
    , getModelResult
    , testNewModel
    , testing
}