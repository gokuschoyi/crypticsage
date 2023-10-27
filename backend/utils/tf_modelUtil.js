const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))
// @ts-ignore
var talib = require('talib/build/Release/talib')
const tf = require('@tensorflow/tfjs-node');

const TF_Model = require('./tf_model');
const IUtil = require('./indicatorUtil');
const RedisUtil = require('./redis_util')
const { createTimer } = require('../utils/timer')

const e_type = {
    "open": 0,
    "high": 1,
    "low": 2,
    "close": 3,
}

const processSelectedFunctionsForModelTraining = async ({ selectedFunctions, tickerHistory }) => {
    let finalTalibResult = {}
    selectedFunctions.forEach((query) => {
        const functionQueryPayload = query.payload;
        const { db_query, func_query, func_param_input_keys, func_param_optional_input_keys, func_param_output_keys } = functionQueryPayload;

        // validates the optional input data
        let validatedInputData = IUtil.validateOptionalInputData({ func_query, opt_input_keys: func_param_optional_input_keys })

        // all data requreid for the function
        let processed = IUtil.processInputData({ ticker_data: tickerHistory, func_input_keys: func_param_input_keys })

        // final query to be executed
        let finalFuncQuery = IUtil.addDataToFuncQuery({ func_query: validatedInputData, processed_data: processed })
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

function standardizeData(features, to_predict) {
    const e = e_type[to_predict]

    const { mean, variance } = tf.moments(tf.tensor(features), 0);
    const standardizedFeatures = tf.div(tf.sub(tf.tensor(features), mean), tf.sqrt(variance));
    const stdData = standardizedFeatures.arraySync();

    const label_mean = mean.arraySync()[e];
    const label_variance = variance.arraySync()[e];

    // console.log('mean',mean.arraySync())
    // console.log('variance',variance.arraySync())

    // @ts-ignore
    console.log('Standardized Data Length : ', stdData.length, 'Sample data : ', stdData[0], stdData[stdData.length - 1])
    return [stdData, label_mean, label_variance];
}

const createTrainingData = async ({ stdData, timeStep, lookAhead, e_key, training_size }) => {
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

const formatPredictedOutput = async ({ tickerHist, time_step, trainSplit, yTrainTest, predictedPrice, id, label_mean, label_variance }) => {
    let tickerHistCopy = tickerHist.slice(time_step, tickerHist.length + 1)
    console.log('Before combining', tickerHistCopy.length, tickerHistCopy[0], tickerHistCopy[tickerHistCopy.length - 1])
    const slicedTickerHistCopy = tickerHistCopy.slice(trainSplit, tickerHistCopy.length)

    let predictionsPlusActual = slicedTickerHistCopy.map((item, index) => {
        const strDate = new Date(item.openTime).toLocaleString()
        return {
            openTime: strDate,
            open: item.openTime / 1000,
            actual: yTrainTest[index][0],
            predicted: predictedPrice[index][0]
        }
    })

    const originalData = predictionsPlusActual.map(standardizedRow => {
        const originalPrice = (standardizedRow.actual * Math.sqrt(label_variance)) + label_mean;
        const scaled_predictedPrice = (standardizedRow.predicted * Math.sqrt(label_variance)) + label_mean;
        return {
            ...standardizedRow,
            actual: originalPrice,
            predicted: scaled_predictedPrice
        }
    })

    const finalData = {
        standardized: predictionsPlusActual,
        scaled: originalData
    }


    console.log('Final result length', predictionsPlusActual.length, predictionsPlusActual[0], predictionsPlusActual[predictionsPlusActual.length - 1])
    RedisUtil.saveTestPredictions(id, finalData)
    TF_Model.eventEmitter.emit('prediction_completed', id)
    // return tickerDates
}


module.exports = {
    processSelectedFunctionsForModelTraining,
    trimDataBasedOnTalibSmallestLength,
    transformDataToRequiredShape,
    standardizeData,
    createTrainingData,
    formatPredictedOutput
}