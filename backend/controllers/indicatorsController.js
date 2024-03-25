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

const checkIfValidationIsPossible = (
    ticker_hist_length
    , time_step
    , look_ahead
    , training_size
    , batchSize
    , do_validation
) => {
    const messages = {
        train_possible: {
            status: true,
            message: '',
            train_fraction: 0,
            samples: 0,
            total_train_batches: 0,
        },
        test_possible: {
            status: true,
            message: '',
            test_fraction: 0,
            samples: 0,
        },
        recommendation: [],
    };

    // @ts-ignore
    const training_fraction = Math.floor((ticker_hist_length * training_size) / 100); // eg. 80% of the data
    const test_fraction = ticker_hist_length - training_fraction; // eg. 20% of the data

    messages.train_possible.train_fraction = training_fraction;
    messages.test_possible.test_fraction = test_fraction;

    const train_features = training_fraction - time_step - look_ahead + 1 // Train features calculated based on timestep and lookahead
    if (train_features > 0) {
        messages.train_possible.samples = train_features;
        const train_batches = Math.ceil(train_features / batchSize);
        if (train_batches < 1) {
            const required_slice_index = Math.ceil((batchSize + time_step + look_ahead - 1) / (training_size / 100));
            messages.train_possible.status = false;
            messages.train_possible.message = `Reduce the batch size to ${train_features} or less, or increase the slice index to ${required_slice_index}`
        } else {
            messages.train_possible.total_train_batches = train_batches
        }
    } else {
        messages.train_possible.status = false;
        messages.train_possible.message = `Increase the training size to ${training_fraction + time_step + look_ahead - 1} or more`
    }

    const test_features = test_fraction - time_step - look_ahead + 1
    if (test_features > 0) {
        messages.test_possible.samples = test_features;

        if (time_step + look_ahead > test_fraction && do_validation) {
            const required_train_percentage = (training_fraction - time_step - look_ahead) / ticker_hist_length;
            const required_slice_index = Math.ceil((time_step + look_ahead) / ((100 - training_size) / 100));
            messages.test_possible.status = false;
            messages.test_possible.message = `Decrease the train size to below ${parseFloat((required_train_percentage * 100).toFixed(2))}% or increase the slice index to ${required_slice_index}`;
        }
    } else {
        const required = -test_features + test_fraction + 1
        const required_sliceIndex = Math.ceil(required / ((100 - training_size) / 100));
        const required_percentage = required / ticker_hist_length
        console.log(required, required_sliceIndex, required_percentage)
        messages.test_possible.status = false;
        messages.test_possible.message = `Increase the slice index to ${required_sliceIndex} or more or decrease the training size below ${((1 - required_percentage) * 100).toFixed(2)}%`;
    }

    return messages
}

// if this func is called before wgan training,
// the redis key used here will be used for all further trainig to fetch data from redis.
const calculateCoRelationMatrix = async (req, res) => {
    const { transformation_order, talibExecuteQueries } = req.body.payload
    const { db_query: { asset_type, ticker_name, period } } = talibExecuteQueries[0].payload;
    // const uid = res.locals.data.uid;
    // const redis_key_for_hist_data = `${uid}_${asset_type}-${ticker_name}-${period}_historical_data`

    // log.info(`Redis key for re train : ${redis_key_for_hist_data}`)
    try {
        const historicalData = await fetchEntireHistDataFromDb({ type: asset_type, ticker_name, period })
        const talibResult = await TFMUtil.processSelectedFunctionsForModelTraining({ selectedFunctions: talibExecuteQueries, tickerHistory: historicalData })
        const { tickerHist, finalTalibResult } = await TFMUtil.trimDataBasedOnTalibSmallestLength({ finalTalibResult: talibResult, tickerHistory: historicalData })
        const { features, metrics } = await TFMUtil.transformDataToRequiredShape({ tickerHist, finalTalibResult, transformation_order })
        res.status(200).json({ message: 'Correlation matrix calculated successfully', corelation_matrix: metrics })
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Model training failed' })
    }
}

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
        training_size,
        time_step,
        look_ahead,
        epochs,
        batchSize,
        transformation_order,
        do_validation,
        early_stopping_flag,
        n_critic,
        slice_index,
        d_learning_rate,
        g_learning_rate,
        intermediate_result_step,
        model_save_checkpoint
    } = model_training_parameters

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
                await wganpgDataRedis.hset(redis_key_for_hist_data, {
                    // @ts-ignore
                    features: JSON.stringify(features.slice(-slice_index)), // remove slice after testing
                    dates: JSON.stringify(datesAndActual),
                    training_parameters: JSON.stringify({
                        to_predict,
                        training_size,
                        time_step,
                        look_ahead,
                        epochs,
                        batchSize,
                        transformation_order,
                        do_validation,
                        early_stopping_flag,
                        n_critic,
                        slice_index,
                        d_learning_rate,
                        g_learning_rate,
                        intermediate_result_step,
                        model_save_checkpoint
                    })
                })

                redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `(5) : Features saved to redis and Celery worker called...` }))
                break;
            default:
                break;
        }
    }
}

const checkOrder = (old, new_) => {
    if (old.length !== new_.length) return false;
    for (let i = 0; i < old.length; i++) {
        if (old[i].id !== new_[i].id) {
            // console.log(old[i].id, new_[i].id)
            return false;
        }
    }
    return true;
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
            const redis_key_for_hist_data = `${uid}_${model_id}_${asset_type}-${ticker_name}-${period}_historical_data`

            console.log('GAN redis data key name : ', redis_key_for_hist_data)

            // Model parameters
            const {
                to_predict,
                training_size,
                time_step,
                look_ahead,
                epochs,
                batchSize,
                transformation_order,
                do_validation,
                early_stopping_flag,
                n_critic,
                slice_index,
                d_learning_rate,
                g_learning_rate,
                intermediate_result_step,
                model_save_checkpoint
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
                            early_stopping_flag,
                            n_critic,
                            slice_index,
                            d_learning_rate,
                            g_learning_rate,
                            intermediate_result_step,
                            model_save_checkpoint
                        }),
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
                    res.status(200).json({ message: 'Gan model training started', finalRs: [], job_id: model_id });
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

                        res.status(200).json({ message: 'Gan model training started', finalRs: [], job_id: model_id });
                    } else {
                        res.status(400).json({
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
                    res.status(200).json({ message: 'Gan model training started', finalRs: [], job_id: model_id });
                } else {
                    res.status(400).json({
                        message: 'Incorrect training, parameters. Adjust them and start training again',
                        train_possible,
                        test_possible
                    })
                }
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
        log.error(error.message)
        throw error
    }
}

const getDifferentKeys = (obj1, obj2) => {
    const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    const differentKeys = [];

    keys.forEach(key => {
        if (obj1[key] !== obj2[key]) {
            differentKeys.push(key);
        }
    });

    return differentKeys;
}

const retrainModel = async (req, res) => {
    const { additional_data, fTalibExecuteQuery, fullRetrainParams } = req.body.payload
    const { model_id, checkpoint } = additional_data
    const { db_query: { asset_type, ticker_name, period } } = fTalibExecuteQuery[0].payload;

    log.info(`Re-Training model : ${model_id}`) // add asset type, tickername and period from FE
    const uid = res.locals.data.uid;
    const redis_key_for_hist_data = `${uid}_${model_id}_${asset_type}-${ticker_name}-${period}_historical_data`
    log.info(`Redis key for re train : ${redis_key_for_hist_data}`)
    try {
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
                res.status(200).json({ message: 'Model re-training started', job_id: model_id });
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
                res.status(200).json({ message: 'Model re-training started', job_id: model_id });
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
                res.status(200).json({ message: 'No data exists for the parameters. Will require Full data fetch', train_possible, test_possible })
            } else {
                res.status(400).json({
                    message: 'Incorrect training, parameters. Adjust them and start training again',
                    train_possible,
                    test_possible
                })
            }
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Model retraining failed' })
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
        res.status(200).json({ message: 'Model saved successfully', model_save_status, modelSaveResult, user_id: uid })
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Model saving failed' })
    }
}

const updateNewTrainingResults = async (req, res) => {
    const uid = res.locals.data.uid;
    const data = { ...req.body.payload, uid }

    try {
        const wgan_new_prediction_update = await MDBServices.addNewWganTrainingResults(data)
        res.status(200).json({ message: 'Model updated successfully', wgan_new_prediction_update, user_id: uid })
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Model update failed' })
    }
}

const deleteModel = async (req, res) => {
    const uid = res.locals.data.uid;
    const { model_id, model_type, asset_type, ticker_name, period } = req.body
    try {
        let deleted
        if (model_type === 'LSTM') {
            deleted = await deleteModelFromLocalDirectory(model_id)
        } else if (model_type === 'WGAN-GP') {
            deleted = await deleteWGANModelAndLogs(model_id)
        }

        const redis_key_for_hist_data = `${uid}_${model_id}_${asset_type}-${ticker_name}-${period}_historical_data`
        console.log('REDIS KEY TO REMOVE : ', redis_key_for_hist_data)
        const dataPresent = await wganpgDataRedis.exists(redis_key_for_hist_data)
        if (dataPresent) {
            await wganpgDataRedis.del(redis_key_for_hist_data)
            console.log('Data from redis cleared')
        } else {
            console.log('No data for that key present')
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

const deleteUserModel = async (req, res) => {
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

const deleteWGANModelAndLogs = async (model_id) => {
    try {
        const log_path = `./worker_celery/logs/${model_id}`
        const model_path = `./worker_celery/saved_models/${model_id}`

        if (fs.existsSync(log_path)) {
            fs.rm(log_path, { recursive: true }, (err) => {
                if (err) {
                    throw err;
                }
                log.info(`Removed log files : ${model_id}`)
            });
            // return true
        } else {
            log.info(`Log file not found for : ${model_id}`)
        }

        if (fs.existsSync(model_path)) {
            fs.rm(model_path, { recursive: true }, (err) => {
                if (err) {
                    throw err
                }
                log.info(`Removed model files : ${model_id}`)
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
    const { model_id, modelType } = req.body
    try {
        let path = ''
        if (modelType === 'LSTM') {
            path = `./models/${model_id}`
        } else {
            path = `./worker_celery/saved_models/${model_id}`
        }
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

        const totalTickerCount = calcuteTotalTickerCountForForecast(model_train_period, model_first_prediction_date) // 461 total no of ticker since initial model prediction
        const lastDate = model_first_prediction_date + (totalTickerCount * HDUtil.periodToMilliseconds(model_train_period))
        log.notice(`First prediction date : ${new Date(model_first_prediction_date).toLocaleString()}`)
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

        const final_result_obj = {
            new_forecast_dates: dates,
            new_forecast: forecast.slice((forecast.length - dates.length - lookAhead - 1), (forecast.length - 1)),
            lastPrediction: forecast.slice(-1)[0]
        }

        // log.notice(`Final forecast length : ${final_result_obj.new_forecast.length}`)

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

        const result = task.applyAsync([data]);
        result.get(5000)
            .then(data => {
                console.log('Data from celery');
                res.status(200).json({ message: 'Model forcast started', result: JSON.parse(data.transformed) });
            })
            .catch(err => {
                console.log('Error from celery', err);
                res.status(400).json({ message: 'Model forecasting failed', error: err.message })
            })

        // @ts-ignore
        // res.status(200).json({ message: 'Model forcast started', final_result_obj });
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Model training failed', error: error.message })
    }
}

const makeWgangpForecast = async (req, res) => {
    const { training_parameters, talibExecuteQueries, model_id, model_first_prediction_date, model_train_period } = req.body.payload
    const uid = res.locals.data.uid;
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

        const result = task.applyAsync([data]);
        result.get(5000) // timeoout added in case celery worker is not running
            .then(data => {
                console.log('Data from celery');
                res.status(200).json({ message: 'Forecasting completed', result: JSON.parse(data.predictions) })
            })
            .catch(err => {
                console.log('Error from celery');
                console.log(err.message);
                res.status(400).json({ message: 'Celery Model forecasting failed', error: err.message })
            });

    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: 'Node Model forecasting failed', error: error.message })
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

const getSavedModelCheckPoint = (model_id) => {
    const model_path = `./worker_celery/saved_models/${model_id}`
    let checkpoints = []
    if (fs.existsSync(model_path)) {
        // console.log('Model data present')
        checkpoints = fs.readdirSync(model_path, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)
            .filter(name => name.startsWith('checkpoint'));
    } else {
        console.log('Model data does not exist')
    }
    return checkpoints
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

// celery test endpoint
const testing = async (model_id) => {
    // call the celery python worker
    const task = pyClient.createTask("celeryTasks.testing");
    const result = task.applyAsync([{
        message: 'Request from node to test testing.',
        model_id: model_id,
        checkpoint: 'checkpoint_340'
    }])

    result.get(5000)
        .then(data => console.log(data))
        .catch(err => console.log(err))
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


module.exports = {
    getIndicatorDesc,
    executeTalibFunction,
    calculateCoRelationMatrix,
    procssModelTraining,
    retrainModel,
    getModel,
    saveModel,
    updateNewTrainingResults,
    deleteModel,
    deleteUserModel,
    checkIfModelExists,
    getModelResult,
    makeNewForecast,
    makeWgangpForecast,
    renameModel,
    testNewModel,
    getModelCheckpoints,
    checkIfValidationIsPossible,
    testing
}