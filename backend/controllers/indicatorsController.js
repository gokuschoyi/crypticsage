const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))
// @ts-ignore
var talib = require('talib/build/Release/talib')

const tf = require('@tensorflow/tfjs-node');

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

// converts the optional input data to required format for talib function
const validateOptionalInputData = ({ func_query, opt_input_keys }) => {
    for (const key in opt_input_keys) {
        const inputType = opt_input_keys[key];
        if (inputType === 'integer_range') {
            func_query[key] = parseInt(func_query[key]);
        } else if (inputType === 'real_range') {
            func_query[key] = parseFloat(func_query[key]);
        }
    }
    return func_query;
}

// converts the input data flags and generates the required data for talib function
const processInputData = ({ ticker_data, func_input_keys }) => {
    const processedInputData = {};
    for (const key in func_input_keys) {
        const requiredTokenData = ticker_data.map((item) => parseFloat(item[func_input_keys[key]]));
        processedInputData[key] = requiredTokenData;
    }
    return processedInputData;
}

// adds the processed data to the talib function query
const addDataToFuncQuery = ({ func_query, processed_data }) => {
    for (const key in processed_data) {
        func_query[key] = processed_data[key];
    }
    return func_query;
}

const formatOutputs = ({ ticker_data, talib_result, output_keys }) => {
    const keys = Object.keys(output_keys)
    const diff = talib_result.begIndex + 1
    let input_data_copy = ticker_data.slice(talib_result.begIndex, (ticker_data.length)); // Make a copy of the ticker_data
    const resultArray = [];
    keys.forEach((key) => {
        const talibResultForKey = talib_result.result[output_keys[key]];
        let data = input_data_copy.map((item, index) => {
            return {
                time: item.openTime / 1000,
                value: talibResultForKey[index],
            };
        });
        resultArray.push({ key, data });
    });

    return { final_res: resultArray, diff: diff }
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
    let validatedInputData = validateOptionalInputData({ func_query, opt_input_keys: func_param_optional_input_keys })

    // all data requreid for the function
    let processed = processInputData({ ticker_data: tokenDataFromRedis.ticker_data, func_input_keys: func_param_input_keys })

    // final query to be executed
    let finalFuncQuery = addDataToFuncQuery({ func_query: validatedInputData, processed_data: processed })

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
    const { final_res, diff } = formatOutputs({
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

const processSelectedFunctionsForModelTraining = async ({ selectedFunctions, tickerHistory }) => {
    let finalTalibResult = {}
    selectedFunctions.forEach((query) => {
        const functionQueryPayload = query.payload;
        const { db_query, func_query, func_param_input_keys, func_param_optional_input_keys, func_param_output_keys } = functionQueryPayload;

        // validates the optional input data
        let validatedInputData = validateOptionalInputData({ func_query, opt_input_keys: func_param_optional_input_keys })

        // all data requreid for the function
        let processed = processInputData({ ticker_data: tickerHistory, func_input_keys: func_param_input_keys })

        // final query to be executed
        let finalFuncQuery = addDataToFuncQuery({ func_query: validatedInputData, processed_data: processed })
        finalFuncQuery.endIdx = tickerHistory.length - 1

        // execute the talib function
        const t = createTimer("Talib Function Execution")
        t.startTimer()
        var talResult;
        try {
            log.info(`Executing talib function : ${func_query.name}`)
            talResult = talib.execute(finalFuncQuery)
            const keys = Object.keys(func_param_output_keys)
            keys.forEach((key) => {
                let result = talResult.result[func_param_output_keys[key]]
                finalTalibResult[`${func_query.name}_${key}`] = result
            })
        } catch (e) {
            log.error(e)
        }
        t.stopTimer(__filename.slice(__dirname.length + 1))

    })
    return finalTalibResult
}

function findSmallestArrayLength(obj) {
    let smallestLength = Infinity; // Initialize with a very large value

    for (const key in obj) {
        if (Array.isArray(obj[key])) {
            const arrayLength = obj[key].length;
            if (arrayLength < smallestLength) {
                smallestLength = arrayLength;
            }
        }
    }

    return smallestLength === Infinity ? 0 : smallestLength; // Return 0 if no arrays were found
}

const trimDataBasedOnTalibSmallestLength = async ({ finalTalibResult, tickerHistory }) => {
    const smallestLength = findSmallestArrayLength(finalTalibResult)
    console.log('Smallest length : ', smallestLength)
    const diff = tickerHistory.length - smallestLength
    console.log("Max difference : ", diff)

    let tickerHist = tickerHistory.slice(diff, tickerHistory.length + 1)
    console.log('Ticker history length after adjustment : ', tickerHist.length, tickerHist[0], tickerHist[tickerHist.length - 1])

    const resultKeys = Object.keys(finalTalibResult)
    resultKeys.forEach((key) => {
        let funcResLength = finalTalibResult[key].length
        let lenDiff = funcResLength - smallestLength
        console.log('Function resut length before adjustment', key, lenDiff, funcResLength)
        finalTalibResult[key] = finalTalibResult[key].slice(lenDiff, funcResLength + 1)
        console.log('Function resut length after adjustment', key, lenDiff, finalTalibResult[key].length)
    })
    return [tickerHist, finalTalibResult]
}

const transformDataToRequiredShape = async ({ tickerHist, finalTalibResult }) => {
    // Extract OHLCV and technical indicator data
    const ohlcvData = tickerHist.map((item) => [parseFloat(item.open), parseFloat(item.high), parseFloat(item.low), parseFloat(item.close), parseFloat(item.volume)])
    console.log('Transformed OHLCV Length : ', ohlcvData.length, 'Sample data : ', ohlcvData[0], ohlcvData[ohlcvData.length - 1])

    // Combine OHLCV data with technical indicator data
    const features = ohlcvData.map((ohlcv, i) => {
        const additionalData = Object.values(finalTalibResult).map((result) => result[i]);
        return [...ohlcv, ...additionalData];
    });

    console.log('Combined features Length : ', features.length, 'Sample data : ', features[0], features[features.length - 1])

    return features
}

function standardizeData(features) {
    const { mean, variance } = tf.moments(tf.tensor(features), 0);
    const standardizedFeatures = tf.div(tf.sub(tf.tensor(features), mean), tf.sqrt(variance));
    const stdData = standardizedFeatures.arraySync();
    // @ts-ignore
    console.log('Standardized Data Length : ', stdData.length, 'Sample data : ', stdData[0], stdData[stdData.length - 1])
    return stdData;
}

const createTrainingData = async ({ stdData, timeStep, lookAhead, e_key, training_size }) => {
    const e_type = {
        "open": 0,
        "high": 1,
        "low": 2,
        "close": 3,
    }
    const e = e_type[e_key]
    var standardized_features = []
    var standardized_labels = []

    // @ts-ignore first timeStep values are not inclded 
    for (let i = timeStep; i < stdData.length - lookAhead + 1; i++) {
        // @ts-ignore
        const trainXRow = stdData.slice(i - timeStep, i);
        standardized_features.push(trainXRow);

        const trainYRow = stdData[i + lookAhead - 1][e];
        standardized_labels.push([trainYRow]);
    }

    console.log('Standardized_features : ', standardized_features.length, 'standardized_labels : ', standardized_labels.length)

    const trainSplitRatio = training_size / 100
    const trainSplit = Math.floor(standardized_features.length * trainSplitRatio)
    console.log('Split Index: ', trainSplit)

    const xTrain = standardized_features.slice(0, trainSplit)
    const yTrain = standardized_labels.slice(0, trainSplit)
    const xTrainTest = standardized_features.slice(trainSplit, standardized_features.length)
    const yTrainTest = standardized_labels.slice(trainSplit, standardized_labels.length)

    console.log('xTrain : ', xTrain.length, 'xTrain test : ', xTrainTest.length)
    console.log('yTrain : ', yTrain.length, 'yTrain test : ', yTrainTest.length, yTrainTest[0], yTrainTest[yTrainTest.length - 1][0])
    return [trainSplit, xTrain, yTrain, xTrainTest, yTrainTest]
}

const formatPredictedOutput = ({ tickerHist, time_step, trainSplit, yTrainTest, predictedPrice }) => {
    let tickerHistCopy = tickerHist.slice(time_step, tickerHist.length + 1)
    console.log('Before combining', tickerHistCopy.length, tickerHistCopy[0], tickerHistCopy[tickerHistCopy.length - 1])
    let tickerDates = tickerHistCopy.slice(trainSplit, tickerHistCopy.length + 1).map((item, index) => {
        return {
            openTime: new Date(item.openTime).toLocaleString(),
            open: new Date(new Date(item.openTime).toLocaleString()).getTime() / 1000,
            actual: yTrainTest[index][0],
            predicted: predictedPrice[index][0]
        }
    })
    console.log('Final result length', tickerDates.length, tickerDates[0], tickerDates[tickerDates.length - 1])
    return tickerDates
}

const startModelTraining = async (req, res) => {
    const { fTalibExecuteQuery, model_training_parameters } = req.body.payload
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


    log.info('----> Step 2 : Executing the talib functions')
    // processing and executing talib functions
    let finalTalibRes = await processSelectedFunctionsForModelTraining({ selectedFunctions: fTalibExecuteQuery, tickerHistory: tickerHistory })


    log.info('----> Step 3 : Finding smallest array to adjust ticker hist and function data')
    const [tickerHist, finalTalibResult] = await trimDataBasedOnTalibSmallestLength({ finalTalibResult: finalTalibRes, tickerHistory })


    log.info('----> Step 4 : Transforming and combining the data to required format for model training')
    const features = await transformDataToRequiredShape({ tickerHist, finalTalibResult })


    log.info('----> Step 5 : Standardizing the data')
    let stdData = standardizeData(features)


    log.info('----> Step 6 : Transformig and creating the training data')
    const [trainSplit, xTrain, yTrain, xTrainTest, yTrainTest] = await createTrainingData({ stdData, timeStep: time_step, lookAhead: look_ahead, e_key: to_predict, training_size })


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


    log.info('----> Step 8 : Training the model')
    const epochs = epochCount;
    const batchSize = 32;
    const trained_model_ = await TF_Model.trainModel(model_, xTrain, yTrain, epochs, batchSize)

    log.info('----> Step 9 : Making the predictions on test data')
    let predictedPrice = await TF_Model.makePredictions(trained_model_, xTrainTest)
    console.log('Predicted length', predictedPrice.length, predictedPrice[0], predictedPrice[predictedPrice.length - 1][0])


    log.info('----> Step 10 : Combining and finalizing the data for plotting')
    let finalRs = formatPredictedOutput({ tickerHist, time_step, trainSplit, yTrainTest, predictedPrice })


    TF_Model.disposeModel(model_)

    res.status(200).json({ message: "Model Training Started", finalTalibResult, features, finalRs })
}


const calculateSMA = async (req, res) => {
    const { asset_type, ticker_name, period, page_no, items_per_page } = req.body.payload.db_query;
    try {
        var funcDesc = talib.explain("AVGDEV");
        console.log(funcDesc)
        const cacheKey = `${asset_type}-${ticker_name}-${period}`;
        const tokendataFromRedis = await getValuesFromRedis(cacheKey);
        // console.log(tokendataFromRedis)
        let requiredTokenData = [];
        requiredTokenData = tokendataFromRedis.data.ticker_data;
        const d1 = requiredTokenData.map((item) => item.close)
        log.info('Executing talib function')
        var result = talib.execute({
            name: "AVGDEV",
            startIdx: 0,
            endIdx: d1.length - 1,
            inReal: d1,
            optInTimePeriod: 10
        })
        log.info('Talib function executed')
        const fResult = result.result.outReal
        const diff = requiredTokenData.length - fResult.length;
        const emptyArr = [...new Array(diff)].map((d) => null)
        const d3 = [...emptyArr, ...fResult]
        requiredTokenData = requiredTokenData.map((item, index) => {
            return {
                openTime: new Date(item.openTime).toLocaleString(),
                open: item.open,
                close: item.close,
                sma: d3[index]
            }
        })
        res.status(200).json({ message: "Get Latest Token Data request success", requiredTokenData });
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: "Get Latest Token Data request error" })
    }
}

module.exports = {
    getIndicatorDesc,
    executeTalibFunction,
    startModelTraining,
    calculateSMA
}