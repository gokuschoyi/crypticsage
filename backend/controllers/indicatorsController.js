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
            res.status(200).json({ message, finalRs: [], job_id: job.id });
        } else {
            model_worker.run()
            const message = "Model Training started"
            res.status(200).json({ message, finalRs: [], job_id: job.id });
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
    const { training_size, time_step, look_ahead, epochs: epochCount, hidden_layers, learning_rate, to_predict } = model_training_parameters
    console.log('Model parameters : ', model_training_parameters)

    log.info('----> Step 1 : Fetching the ticker data from db') // oldest first 
    const tickerHistory = await fetchEntireHistDataFromDb(asset_type, ticker_name, period)
    const tickerHistoryLength = tickerHistory.length
    console.log('Initial Total Length : ', tickerHistoryLength)
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
    let [stdData, label_mean, label_variance] = TFMUtil.standardizeData(features, to_predict)
    console.log(label_mean, label_variance)
    TF_Model.eventEmitter.emit('notify', { message: `----> Data standardized...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Creating the training data..." })
    log.info('----> Step 6 : Transformig and creating the training data')
    const [trainSplit, xTrain, yTrain, xTrainTest, yTrainTest] = await TFMUtil.createTrainingData({ stdData, timeStep: time_step, lookAhead: look_ahead, e_key: to_predict, training_size })
    TF_Model.eventEmitter.emit('notify', { message: `----> Training data created...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Creating the model..." })
    log.info('----> Step 7 : Creating the model')
    const input_layer_shape = time_step;
    const input_layer_neurons = 64;
    const rnn_output_neurons = 16;
    const output_layer_neurons = 1;
    const feature_count = xTrain[0][0].length;
    const n_layers = hidden_layers;

    const model_parama = {
        input_layer_shape,
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
    const trained_model_ = await TF_Model.trainModel(model_, xTrain, yTrain, epochs, batchSize)
    TF_Model.eventEmitter.emit('notify', { message: `----> TF Model trained...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Making the predictions on test data..." })
    log.info('----> Step 9 : Making the predictions on test data')
    let predictedPrice = await TF_Model.makePredictions(trained_model_, xTrainTest)
    console.log('Predicted length', predictedPrice.length, predictedPrice[0], predictedPrice[predictedPrice.length - 1][0])
    TF_Model.eventEmitter.emit('notify', { message: `----> TF Model predictions completed...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Combining and finalizing the data for plotting..." })
    log.info('----> Step 10 : Combining and finalizing the data for plotting')
    await TFMUtil.formatPredictedOutput({ tickerHist, time_step, trainSplit, yTrainTest, predictedPrice, id: model_id, label_mean, label_variance })
    TF_Model.eventEmitter.emit('notify', { message: `----> TF Model predictions formatted, sending result...` })


    TF_Model.disposeModel(model_)

    return 'Model Training Completed'
}

module.exports = {
    getIndicatorDesc,
    executeTalibFunction,
    procssModelTraining,
    startModelTraining,
}