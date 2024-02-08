const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))
const config = require('../config')
// @ts-ignore
var talib = require('talib/build/Release/talib')
const ss = require('simple-statistics');
const jstat = require('jstat')
const tf = require('@tensorflow/tfjs-node');
const { sqrt } = require('@tensorflow/tfjs-core');

const IUtil = require('./indicatorUtil');
const RedisUtil = require('./redis_util')
const { createTimer } = require('../utils/timer');
const Redis = require("ioredis");
// @ts-ignore
const redisPublisher = new Redis();


const displayDataInTable = (data, name) => {
    // Convert each sub-array into an object with named properties
    const objectifiedData = data.map(subArray => {
        const obj = {};
        subArray.forEach((value, index) => {
            obj['col' + (index + 1)] = value;
        });
        return obj;
    });

    // Display the data using console.table
    console.log(name)
    console.table(objectifiedData);
}

const calculateOriginalPrice = (value, variance, mean) => {
    if (value === null) return null;
    return (value * Math.sqrt(variance)) + mean;
};

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

/**
 * Calcuates the final talib result for the selected functions
 * @param {Object} param
 * @param {Array} param.selectedFunctions
 * @param {Array} param.tickerHistory 
 * @returns 
 */
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
        var talResult;
        if (config.debug_flag === 'true') {
            t.startTimer()
            log.info(`Executing talib function : ${func_query.name}`)
        }
        try {
            talResult = talib.execute(finalFuncQuery)
            const keys = Object.keys(func_param_output_keys)
            keys.forEach((key) => {
                let result = talResult.result[func_param_output_keys[key]]
                finalTalibResult[`${func_query.name}_${key}`] = result
            })
        } catch (e) {
            log.error(e)
        }
        if (config.debug_flag === 'true') {
            t.stopTimer(__filename.slice(__dirname.length + 1))
        }

    })
    return finalTalibResult
}

/**
 * Trims the ticker history and function data based on the smallest length of the talib result
 * @param {Object} param
 * @param {Object} param.finalTalibResult
 * @param {Array} param.tickerHistory 
 * @returns {Promise<{ tickerHist: Array, finalTalibResult: Object }>}
 */
const trimDataBasedOnTalibSmallestLength = async ({ finalTalibResult, tickerHistory }) => {
    const smallestLength = findSmallestArrayLength(finalTalibResult)
    const diff = tickerHistory.length - smallestLength
    let tickerHist = tickerHistory.slice(diff, tickerHistory.length)
    if (config.debug_flag === 'true') {
        console.log('Functions and history length after adjustment : ', smallestLength)
        console.log('Smallest length : ', smallestLength)
        console.log('Ticker history length after adjustment : ', tickerHist.length)
        console.log("Max difference : ", diff)
        console.log('Oldest : ', tickerHist[0], 'Latest', tickerHist[tickerHist.length - 1])
    }
    const resultKeys = Object.keys(finalTalibResult)
    resultKeys.forEach((key) => {
        let funcResLength = finalTalibResult[key].length
        let lenDiff = funcResLength - smallestLength
        // console.log('Function resut length before adjustment', key, lenDiff, funcResLength)
        finalTalibResult[key] = finalTalibResult[key].slice(lenDiff, funcResLength + 1)
        // console.log('Function resut length after adjustment', key, lenDiff, finalTalibResult[key].length)
    })
    return { tickerHist, finalTalibResult }
}

/**
 * This function calculates and returns the correlation matrix for the given data.
 * Each element in the matrix is an object with the following properties:
 * - r: The Pearson correlation coefficient.
 * - p: The p-value for a hypothesis test whose null hypothesis is that the population correlation coefficient is 0.
 * - cov: The covariance.
 * - stat: The statistic value.
 *
 * @param {Object} param - The transposed data for which to calculate the correlation matrix.
 * @param {Array} param.features - The transposed data for which to calculate the correlation matrix.
 * @returns {Promise<Array<Array<{r: number, p: number, cov: number, stat: number}>>>} The correlation matrix. Each element in the matrix is an object with properties r, p, cov, and stat.
 */
const calculateFeatureMetrics = async ({ features }) => {
    function transpose(array) {
        return array[0].map((_, colIndex) => array.map(row => row[colIndex]));
    }

    const transposedData = transpose(features);
    const data_length = features.length
    const fData = []

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
            const df = features.length - 2;
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
    return fData
}

/**
 * Transforms the OHLCV and function data to required shape for model training
 * @param {Object} param
 * @param {Array} param.tickerHist
 * @param {Object} param.finalTalibResult
 * @param {Array} param.transformation_order
 * @param {string} [param.uid]
 * @returns {Promise<array>}
 */
const transformDataToRequiredShape = async ({ tickerHist, finalTalibResult, transformation_order, uid }) => {
    const features = tickerHist.map((item, i) => {
        return transformation_order.map(order => {
            if (order.value in item) {
                // Fetching OHLCV data
                return parseFloat(item[order.value]);
            } else if (order.value in finalTalibResult) {
                // Fetching technical indicator data
                return finalTalibResult[order.value][i];
            }
            return null; // Or a default value if the feature is not found
        });
    });

    if (config.debug_flag === 'true') {
        console.log('Combined with features Length : ', features.length)
        console.log('Final talib keys : ', Object.keys(finalTalibResult))
        console.log('Last transformed data : ', features[features.length - 1])
    }

    const metrics = await calculateFeatureMetrics({ features })
    // console.log("New metrics : ", metrics)
    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'feature_relations', uid, metrics }))

    return features
}

/**
 * 
 * @param {Object} param
 * @param {string} param.model_type
 * @param {array} param.features
 * @returns {Promise<{ stdData: Array, mean: Array, variance: Array}>}
 */
const standardizeData = ({ model_type, features }) => {
    const { mean, variance } = tf.moments(tf.tensor(features), 0);
    const standardizedFeatures = tf.div(tf.sub(tf.tensor(features), mean), tf.sqrt(variance));
    const stdData = standardizedFeatures.arraySync();

    // let e;
    let feature_mean, feature_variance
    // console.log(model_type)
    switch (model_type) {
        case 'multi_input_single_output_step':
            feature_mean = mean.arraySync();
            feature_variance = variance.arraySync();
            break;
        default:
            break;
    }

    if (config.debug_flag === 'true') {
        // @ts-ignore
        console.log('Standardized Data Length : ', stdData.length)
        // @ts-ignore
        console.log('Last data: ', stdData[stdData.length - 1])
        console.log('Mean : ', feature_mean, 'Variance : ', feature_variance)
    }

    // @ts-ignore
    return { stdData, mean: feature_mean, variance: feature_variance };
}

// remove later
/**
 * Normalizes the data to the range (-1, 1)
 * @param {Object} param
 * @param {array} param.features
 * @returns {Promise<{normalized_data: Array, mins_array: Array, maxs_array: Array}>}
 */
const normalizeData = async ({ features }) => {
    // Initialize arrays to hold the min and max for each column
    let mins_array = new Array(features[0].length).fill(Infinity);
    let maxs_array = new Array(features[0].length).fill(-Infinity);

    // Find the min and max values for each column
    features.forEach(row => {
        row.forEach((value, index) => {
            if (value < mins_array[index]) mins_array[index] = value;
            if (value > maxs_array[index]) maxs_array[index] = value;
        });
    });

    // Scale the features to the range (-1, 1)
    let normalized_data = features.map(row => {
        return row.map((value, index) => {
            return (-1 + 2 * (value - mins_array[index]) / (maxs_array[index] - mins_array[index]))
        });
    });

    if (config.debug_flag === 'true') {
        // @ts-ignore
        console.log('Normalized Data Length : ', normalized_data.length)
        // @ts-ignore
        console.log('First data: ', normalized_data[0])
        console.log('Last data: ', normalized_data[normalized_data.length - 1])
        console.log('Mins : ', mins_array)
        console.log('Maxes : ', maxs_array)
    }

    return { normalized_data, mins_array, maxs_array };
}

/**
 * 
 * @param {Object} param
 * @param {array} param.normalized_data
 * @param {array} param.mins_array
 * @param {array} param.maxs_array
 * @returns {Promise<array>}
 */
const inverseNormalizeData = async ({ normalized_data, mins_array, maxs_array }) => {
    let originalData = normalized_data.map(row => {
        return row.map((scaledValue, index) => {
            return mins_array[index] + ((scaledValue + 1) / 2) * (maxs_array[index] - mins_array[index]);
        });
    });

    return originalData;
}

/**
 * 
 * @param {Object} param
 * @param {string} param.model_type
 * @param {array} param.stdData
 * @param {number} param.timeStep
 * @param {number} param.lookAhead
 * @param {string} param.e_key
 * @returns {Promise<{  xTrain:array, yTrain:array  }>}
 */
const createTrainingData = async ({ model_type, stdData, timeStep, lookAhead, e_key }) => {
    const features = []
    const labels = []
    // const lastSets = []

    let subsetf, subsetl, str, e
    switch (model_type) {
        case 'multi_input_single_output_step':
            for (let i = 0; i <= stdData.length - timeStep - lookAhead; i++) {
                let featureSlice = stdData.slice(i, i + timeStep).map(row => {
                    let filteredRow = row.filter((_, index) => index !== e_key);
                    return filteredRow;
                });
                features.push(featureSlice);
                labels.push(stdData.slice(i + timeStep, i + timeStep + lookAhead).map((row) => [row[e_key]]));
            }

            if (config.debug_flag === 'true') {
                subsetf = features.slice(-1)
                subsetl = labels.slice(-1)

                str = ''
                subsetf.forEach((element, index) => {
                    element.forEach((row, ind) => {
                        let rowStr = ''
                        if (ind === element.length - 1) {
                            rowStr += row.join(', ') + ` - ${subsetl[index].join(', ')}` + '\n' + '\n'
                        } else {
                            rowStr = row.join(', ') + '\n'
                        }
                        str += rowStr
                    })
                })
                // console.log(subsetf)
                // console.log(subsetl)
                console.log('Total training features length', stdData.length)
                console.log('Offset length  : ', stdData.length - timeStep - lookAhead + 1)
                console.log('E_ key : ', e_key)
                console.log('Training_features/xTrain : ', features.length, 'Training_labels/yTrain : ', labels.length)
                displayDataInTable(stdData.slice(-lookAhead).map((row) => [row[e_key]]), 'Last train set labels')
                console.log(str)
            }
            break;
        default:
            break;
    }
    return { xTrain: features, yTrain: labels }
}
// remove later
/**
 * @param {Object} param
 * @param {array} param.normalizedData
 * @param {number} param.timeStep
 * @param {number} param.lookAhead
 * @param {number} param.e_key
 * @returns {Promise<{  xTrain:array, yTrain:array, yTrainPast: array  }>}
 */
const generateModelTrainigData = async ({ normalizedData, timeStep, lookAhead, e_key }) => {
    let features = []
    let labels = []
    let yPast = []

    for (let i = 0; i <= normalizedData.length - timeStep - lookAhead; i++) {
        // xtrain features
        /* let featureSlice = normalizedData.slice(i, i + timeStep).map(row => {
            let filteredRow = row.filter((_, index) => index !== e_key);
            return filteredRow;
        }) */;
        let featureSlice = normalizedData.slice(i, i + timeStep)
        features.push(featureSlice);

        //past y lables
        let pastYSlice = normalizedData.slice(i, i + timeStep).map(row => {
            let filteredRow = row.filter((_, index) => index === e_key);
            return filteredRow;
        });
        yPast.push(pastYSlice)

        // to predict y labels
        labels.push(normalizedData.slice(i + timeStep, i + timeStep + lookAhead).map((row) => row[e_key]));
    }

    if (config.debug_flag === 'true') {
        let subsetf = features.slice(-1)
        let subsetl = labels.slice(-1)
        let subsetYpast = yPast.slice(-1)

        let str = ''
        subsetf.forEach((element, index) => {
            element.forEach((row, ind) => {
                let rowStr = ''
                if (ind === element.length - 1) {
                    rowStr += row.join(', ') + ` - ${subsetl[index].join(', ')}` + '\n' + '\n'
                } else {
                    rowStr = row.join(', ') + '\n'
                }
                str += rowStr
            })
        })
        // console.log(subsetf)
        // console.log(subsetl)
        console.log('Total training features length', normalizedData.length)
        console.log('Offset length  : ', normalizedData.length - timeStep - lookAhead + 1)
        console.log('E_ key : ', e_key)
        console.log('Training_features/xTrain : ', features.length, 'Training_labels/yTrain : ', labels.length)
        // displayDataInTable(normalizedData.slice(-lookAhead).map((row) => [row[e_key]]), 'Last train set labels')
        // console.log(str)
        // console.log('yPast last vals : ', subsetYpast)
    }

    return { xTrain: features, yTrain: labels, yTrainPast: yPast }
}

/**
 * @typedef {Object} DatesObj
 * @property {string} openTime - The time when the store opens.
 * @property {number} actual - Indicates whether the status is the actual/current status.
 * @property {number} open - Indicates whether the store is open or closed.
 */

/**
 * 
 * @param {Object} param
 * @param {array} param.ticker_history 
 * @param {number} param.train_split 
 * @param {number} param.time_step 
 * @param {number} param.look_ahead 
 * @param {array} param.yTrainTest 
 * @param {number} param.label_mean 
 * @param {number} param.label_variance 
 * @returns {DatesObj[]}
 */
const getDateRangeForTestSet = ({ ticker_history, train_split, time_step, look_ahead, yTrainTest, label_mean, label_variance }) => {
    const sliced = ticker_history.slice(train_split + time_step, ticker_history.length - (look_ahead))
    let lastOriginal = yTrainTest[yTrainTest.length - 1]
    yTrainTest = yTrainTest.slice(0, -1)


    const fHistClose = parseFloat(sliced[0].close).toFixed(2)
    const lHistClose = parseFloat(sliced[sliced.length - 1].close).toFixed(2)
    const yTrainFClose = calculateOriginalPrice(yTrainTest[0][0][0], label_variance, label_mean)
    const yTrainLClose = calculateOriginalPrice(yTrainTest[yTrainTest.length - 1][0][0], label_variance, label_mean)

    const firstHistStatus = fHistClose == yTrainFClose.toFixed(2) ? 'Same' : 'Different'
    const lastHistStatus = lHistClose == yTrainLClose.toFixed(2) ? 'Same' : 'Different'

    let dates = []
    sliced.forEach((item, index) => {
        const strDate = new Date(item.openTime).toLocaleString();
        const actualValue = yTrainTest[index][0][0];

        dates.push({
            openTime: strDate,
            open: item.openTime / 1000,
            actual: actualValue,
        })
    })

    let latestTime = dates[dates.length - 1].open * 1000 // look_ahead no of ticker behind
    let tickerPeriodInMilliSecond = (dates[1].open - dates[0].open) * 1000

    for (let i = 1; i <= lastOriginal.length; i++) {
        dates.push({
            openTime: new Date(latestTime + (tickerPeriodInMilliSecond * (i))).toLocaleString(),
            open: (latestTime + (tickerPeriodInMilliSecond * (i))) / 1000,
            actual: lastOriginal[i - 1][0],
        })
    }

    if (config.debug_flag === 'true') {
        console.log('Hist dataset length after trimming timestep, split and lookahead', sliced.length) // excludes last look_ahead values
        console.log('Total no in tests (yTrainTest) : ', yTrainTest.length)

        console.log('First date in hist : ', new Date(sliced[0].openTime).toLocaleString(), 'Close : ', fHistClose)
        console.log('Original first from test (yTrainTest): ', yTrainFClose)

        console.log('Last date in hist : ', new Date(sliced[sliced.length - 1].openTime).toLocaleString(), 'Close : ', lHistClose)
        console.log('Original last from test (yTrainTest): ', yTrainLClose)

        console.log('Dates length', dates.length)

        log.notice(`First hist status : ${firstHistStatus}`)
        log.notice(`Last hist status : ${lastHistStatus}`)
    }
    return dates
}

/**
 * generates the test data for evaluation
 * @param {Object} param
 * @param {string} param.model_type
 * @param {array} param.mean
 * @param {array} param.variance
 * @param {number} param.e_key
 * @param {array} param.ticker_history
 * @param {array} param.test_features
 * @param {number} param.train_split
 * @param {number} param.time_step
 * @param {number} param.look_ahead
 * @returns {Promise<{ xTrainTest: array, yTrainTest: array, dates: DatesObj[] }>} 
 */
const generateEvaluationData = async (
    {
        model_type,
        mean,
        variance,
        e_key,
        ticker_history,
        test_features,
        train_split,
        time_step,
        look_ahead
    }
) => {
    const meanTensor = tf.tensor(mean)
    const varianceTensor = tf.tensor(variance)
    const stdData = tf.div(tf.sub(tf.tensor(test_features), meanTensor), tf.sqrt(varianceTensor)).arraySync();

    // @ts-ignore
    let { xTrain: xTrainTest, yTrain: yTrainTest } = await createTrainingData({ model_type, stdData: stdData, timeStep: time_step, lookAhead: look_ahead, e_key: e_key })

    // look ahead no of prediction for forecasting
    const lastSets = []
    // @ts-ignore
    const lastFeatureSetsToPredict = stdData.slice(stdData.length - (time_step + look_ahead - 1))

    for (let i = 0; i <= lastFeatureSetsToPredict.length - time_step; i++) {
        let featureSlice = lastFeatureSetsToPredict.slice(i, i + time_step).map(row => {
            let filteredRow = row.filter((_, index) => index !== e_key);
            return filteredRow;
        });
        lastSets.push(featureSlice)
    }

    const lastTestTensor = tf.tensor(lastSets)

    console.log('lastSets prediction shape', lastTestTensor.shape, '\n')
    xTrainTest = [...xTrainTest, ...lastSets]

    // setting test set dates for plotting
    const lastDates = ticker_history.slice(train_split + time_step, ticker_history.length - (look_ahead - 1))
    let dates = []
    lastDates.forEach((item, index) => {
        const strDate = new Date(item.openTime).toLocaleString();
        const actualValue = yTrainTest[index][0][0];

        dates.push({
            openTime: strDate,
            open: item.openTime / 1000,
            actual: actualValue,
        })
    })

    console.log('Original dates length : ', dates.length, new Date(dates[dates.length - 1].open * 1000).toLocaleString())

    let lastOriginal = yTrainTest[yTrainTest.length - 1]
    let latestTime = dates[dates.length - 1].open * 1000 // look_ahead no of ticker behind
    let tickerPeriodInMilliSecond = (dates[1].open - dates[0].open) * 1000

    for (let i = 1; i < look_ahead; i++) {
        dates.push({
            openTime: new Date(latestTime + (tickerPeriodInMilliSecond * (i))).toLocaleString(),
            open: (latestTime + (tickerPeriodInMilliSecond * (i))) / 1000,
            actual: lastOriginal[i][0],
        })
    }

    console.log('Dates length after addition: ', dates.length, new Date(dates[dates.length - 1].open * 1000).toLocaleString(), '\n')


    const fHistClose = parseFloat(lastDates[0].close).toFixed(2)
    const yTrainFClose = calculateOriginalPrice(yTrainTest[0][0][0], variance[e_key], mean[e_key])
    const lHistClose = parseFloat(lastDates[lastDates.length - 1].close).toFixed(2)
    const yTrainLClose = calculateOriginalPrice(yTrainTest[yTrainTest.length - 1][0][0], variance[e_key], mean[e_key])

    const firstHistStatus = fHistClose == yTrainFClose.toFixed(2) ? 'Same' : 'Different'
    const lastHistStatus = lHistClose == yTrainLClose.toFixed(2) ? 'Same' : 'Different'

    if (config.debug_flag === 'true') {
        console.log('Last actual history close :', ticker_history[ticker_history.length - 1].close)
        console.log('Last dates : ', lastDates.length, lastDates[0].close, lastDates[lastDates.length - 1].close)
        console.log('Last close price, lastdates', lHistClose, new Date(lastDates[lastDates.length - 1].openTime).toLocaleString())
        console.log('Last original close price', yTrainLClose, new Date(lastDates[lastDates.length - 1].openTime).toLocaleString())

        console.log(xTrainTest.length, yTrainTest.length)
        log.notice(`First hist status : ${firstHistStatus}`)
        log.notice(`Last hist status : ${lastHistStatus}`)
        log.info(`Final dates length :  ${dates.length}, ${new Date(dates[dates.length - 1].open * 1000).toLocaleString()}`)
        log.info(`Final trainset length :  ${xTrainTest.length}`)
    }

    return { xTrainTest, yTrainTest, dates }
}


const evaluateForecast = async (actual, predicted) => {
    const overAllRMSE = sqrt(tf.losses.meanSquaredError(actual, predicted)).arraySync()

    const scores = [];
    let act = actual.arraySync()
    let pred = predicted.arraySync()

    for (let i = 0; i < act.length; i++) {
        let act_tensor = tf.tensor(act[i])
        let pred_tensor = tf.tensor(pred[i])
        let mse = tf.losses.meanSquaredError(act_tensor, pred_tensor)
        let rmse = sqrt(mse).arraySync()
        scores.push(rmse)
    }

    return [overAllRMSE, scores]
}

const formatPredictedOutput = async ({ dates, model_type, look_ahead, tickerHist, time_step, trainSplit, yTrainTest, predictedPrice, forecast, id, label_mean, label_variance }) => {
    let finalData = {}
    let splitPoint
    let slicedTickerHistCopy
    let slicedTickerHistCopyLength
    let tickerPeriodInMilliSecond
    let latestTime
    let originalData
    let emptyObjects
    let emptyArrayForYTrainTest
    switch (model_type) {
        case 'multi_input_single_output_no_step':
            splitPoint = tickerHist.length - time_step - trainSplit + 1
            console.log('Split point for getting time', splitPoint)

            slicedTickerHistCopy = tickerHist.slice(-splitPoint) // slicing the histCopy to get the test data openTime
            console.log('Train dataset length before padding', slicedTickerHistCopy.length, slicedTickerHistCopy[0], slicedTickerHistCopy[slicedTickerHistCopy.length - 1])
            console.log('yTrainTest before padding', yTrainTest.length, yTrainTest[0], yTrainTest[yTrainTest.length - 1])

            slicedTickerHistCopyLength = slicedTickerHistCopy.length
            latestTime = slicedTickerHistCopy[slicedTickerHistCopyLength - 1].openTime
            tickerPeriodInMilliSecond = slicedTickerHistCopy[1].openTime - slicedTickerHistCopy[0].openTime

            //create look_ahead empty objects
            emptyObjects = []
            emptyArrayForYTrainTest = []
            for (let i = 0; i < look_ahead; i++) {
                emptyObjects.push({
                    openTime: latestTime + (tickerPeriodInMilliSecond * (i + 1)),
                })
                emptyArrayForYTrainTest.push([null])
            }
            console.log(emptyObjects, emptyArrayForYTrainTest)

            slicedTickerHistCopy = [...slicedTickerHistCopy, ...emptyObjects] //used to get the time only from slicedTickerHistCopy
            yTrainTest = [...yTrainTest, ...emptyArrayForYTrainTest]

            console.log('Combined with empty length', slicedTickerHistCopy.length, slicedTickerHistCopy[slicedTickerHistCopy.length - 1])
            console.log('ytrain last', yTrainTest[slicedTickerHistCopy.length - 1])

            let predictionsPlusActual = slicedTickerHistCopy.map((item, index) => {
                const strDate = new Date(item.openTime).toLocaleString()
                return {
                    openTime: strDate,
                    open: item.openTime / 1000,
                    actual: index <= slicedTickerHistCopyLength ? yTrainTest[index][0] : null,
                    predicted: index > look_ahead - 1 ? predictedPrice[index - look_ahead][0] : null
                }
            })

            originalData = predictionsPlusActual.map((standardizedRow) => ({
                ...standardizedRow,
                actual: calculateOriginalPrice(standardizedRow.actual, label_variance, label_mean),
                predicted: calculateOriginalPrice(standardizedRow.predicted, label_variance, label_mean),
            }));

            finalData = {
                standardized: predictionsPlusActual,
                scaled: originalData
            }

            console.log('Final result length', predictionsPlusActual.length, predictionsPlusActual[0], predictionsPlusActual[predictionsPlusActual.length - 1])
            RedisUtil.saveTestPredictions(id, finalData)
            // TF_Model.eventEmitter.emit('prediction_completed', id)
            break;
        case 'multi_input_multi_output_no_step':
            splitPoint = tickerHist.length - time_step - trainSplit - look_ahead + 1
            console.log('Split point for getting time', splitPoint)

            slicedTickerHistCopy = tickerHist.slice(-splitPoint) // slicing the histCopy to get the test data openTime
            const original = slicedTickerHistCopy
            console.log('Train dataset length before padding', slicedTickerHistCopy.length, slicedTickerHistCopy[0], slicedTickerHistCopy[slicedTickerHistCopy.length - 1])
            console.log('yTrainTest before padding', yTrainTest.length, yTrainTest[0], yTrainTest[yTrainTest.length - 1])

            slicedTickerHistCopyLength = slicedTickerHistCopy.length
            latestTime = slicedTickerHistCopy[slicedTickerHistCopyLength - 1].openTime
            tickerPeriodInMilliSecond = slicedTickerHistCopy[1].openTime - slicedTickerHistCopy[0].openTime

            console.log('Latest time', latestTime, tickerPeriodInMilliSecond)

            let transformePredictedPrice = predictedPrice.map(standardizedRow => {
                const originalRow = standardizedRow.map((val, index) => {
                    const meanValue = label_mean[index];
                    const stdDeviation = Math.sqrt(label_variance[index]);
                    const originalValue = val * stdDeviation + meanValue;
                    return originalValue;
                });
                return originalRow;
            });

            console.log(transformePredictedPrice[0], transformePredictedPrice[transformePredictedPrice.length - 1])

            let latestPrediction = {
                openTime: new Date(latestTime + tickerPeriodInMilliSecond).toLocaleString(),
                time: (latestTime + tickerPeriodInMilliSecond) / 1000,
                open: transformePredictedPrice[transformePredictedPrice.length - 1][0],
                high: transformePredictedPrice[transformePredictedPrice.length - 1][1],
                low: transformePredictedPrice[transformePredictedPrice.length - 1][2],
                close: transformePredictedPrice[transformePredictedPrice.length - 1][3],
                volume: transformePredictedPrice[transformePredictedPrice.length - 1][4]
            }

            //create look_ahead empty objects
            emptyObjects = []
            emptyArrayForYTrainTest = []
            for (let i = 0; i < look_ahead; i++) {
                emptyObjects.push({
                    openTime: latestTime + (tickerPeriodInMilliSecond * (i + 1)),
                    high: null,
                    low: null,
                    close: null,
                    volume: null
                })
                emptyArrayForYTrainTest.push([null])
            }
            console.log(emptyObjects, emptyArrayForYTrainTest)

            slicedTickerHistCopy = [...slicedTickerHistCopy, ...emptyObjects] //used to get the time only from slicedTickerHistCopy
            yTrainTest = [...yTrainTest, ...emptyArrayForYTrainTest]

            console.log('Combined with empty length', slicedTickerHistCopy.length, slicedTickerHistCopy[slicedTickerHistCopy.length - 1])
            console.log('ytrain last', yTrainTest[slicedTickerHistCopy.length - 1])

            let finalResult = slicedTickerHistCopy.map((item, index) => {
                const strDate = new Date(item.openTime).toLocaleString()
                return {
                    openTime: strDate,
                    time: item.openTime / 1000,
                    open: index > look_ahead - 1 ? transformePredictedPrice[index - look_ahead][0] : null,
                    high: index > look_ahead - 1 ? transformePredictedPrice[index - look_ahead][1] : null,
                    low: index > look_ahead - 1 ? transformePredictedPrice[index - look_ahead][2] : null,
                    close: index > look_ahead - 1 ? transformePredictedPrice[index - look_ahead][3] : null,
                    volume: index > look_ahead - 1 ? transformePredictedPrice[index - look_ahead][4] : null,
                }
            })

            const originalPlusPredictedMapped = original.map((item, index) => {
                const strDate = new Date(item.openTime).toLocaleString()
                return {
                    openTime: strDate,
                    time: item.openTime / 1000,
                    open: parseFloat(item.open),
                    high: parseFloat(item.high),
                    low: parseFloat(item.low),
                    close: parseFloat(item.close),
                    volume: parseFloat(item.volume),
                }
            })

            const originalPlusPredicted = [...originalPlusPredictedMapped, latestPrediction]


            console.log('Final Result  : ', finalResult[0], finalResult[finalResult.length - 1])

            finalData = {
                standardized: originalPlusPredicted,
                scaled: finalResult,
            }
            RedisUtil.saveTestPredictions(id, finalData)
            // TF_Model.eventEmitter.emit('prediction_completed', id)
            break;
        case 'multi_input_single_output_step':
            const predictions = tf.tensor(predictedPrice.slice(0, predictedPrice.length - (look_ahead - 1)))
            const actual = tf.tensor(yTrainTest)
            const [overAllRMSE, scores] = await evaluateForecast(actual, predictions);
            // TF_Model.eventEmitter.emit('eval_complete', overAllRMSE)

            console.log('Predicted first from prediction (predictedPrice): ', calculateOriginalPrice(predictedPrice[0][0][0], label_variance, label_mean))
            console.log('Predicted last from prediction (predictedPrice): ', calculateOriginalPrice(predictedPrice[predictedPrice.length - 1][0][0], label_variance, label_mean))

            console.log('Actual first date : ', new Date(dates[0].open * 1000).toLocaleString())
            console.log('Actual last date : ', new Date(dates[dates.length - 1].open * 1000).toLocaleString())

            /* const lastDateAfterLAAddition = dates[dates.length - 1].open * 1000
            tickerPeriodInMilliSecond = (dates[1].open - dates[0].open) * 1000
            console.log('Last date after look ahead addition : ', new Date(lastDateAfterLAAddition).toLocaleString()) */

            // let forecastResult = []
            /* for (let j = 1; j <= forecast.length; j++) {
                forecastResult.push({
                    openTime: new Date(lastDateAfterLAAddition + (tickerPeriodInMilliSecond * (j))).toLocaleString(),
                    open: (lastDateAfterLAAddition + (tickerPeriodInMilliSecond * (j))) / 1000,
                    actual: null,
                    predicted: forecast[j - 1][0]
                })
            }
 */

            finalData = {
                dates: dates,
                predictions_array: predictedPrice,
                forecast,
                label_mean,
                label_variance,
            }

            // console.log('Final result length', predPlusActual.length, predPlusActual[0], predPlusActual[predPlusActual.length - 1])
            // console.log('Final result scaled', originalData.length, originalData[0], originalData[originalData.length - 1])
            RedisUtil.saveTestPredictions(id, finalData)
        // TF_Model.eventEmitter.emit('prediction_completed', id)

        //adjusting for the look-ahead missing values which are present in the last prediction
        // const lastOriginal = yTrainTest[yTrainTest.length - 1]
        // const lastPrediction = predictedPrice[predictedPrice.length - 1]

        // displayDataInTable(lastOriginal, 'Last original vals')
        // displayDataInTable(lastPrediction, 'Last predicted vals')
        // console.log('Last original vals : ', lastOriginal)
        // console.log('Last predicted vals : ', lastPrediction)

        // latestTime = dates[dates.length - 1].open * 1000 // look_ahead no of ticker behind
        // tickerPeriodInMilliSecond = (dates[1].open - dates[0].open) * 1000

        /* let lastLookAheadPredictions = []
        for (let i = 1; i <= lastOriginal.length; i++) {
            lastLookAheadPredictions.push({
                openTime: new Date(latestTime + (tickerPeriodInMilliSecond * (i))).toLocaleString(),
                open: (latestTime + (tickerPeriodInMilliSecond * (i))) / 1000,
                actual: lastOriginal[i - 1][0],
                predicted: lastPrediction[i - 1][0]
            })
        }

        console.log('Last look ahead predictions ')
        console.table(lastLookAheadPredictions) */
        // predPlusActual = [...predPlusActual, ...lastLookAheadPredictions]



        // console.log('Over All RMSE on test set: ', overAllRMSE)
        // @ts-ignore
        // console.log('Total predicted values : ', scores.length)
        // @ts-ignore
        // console.log('RMSE for last 7 ticks : ', scores.slice(-7))

        // splitPoint = tickerHist.length - trainSplit - time_step - look_ahead + 2
        // console.log('Split point for getting time', splitPoint)

        // console.log(tickerHist[trainSplit + time_step - 1], tickerHist[tickerHist.length - 1])
        // let dates = []
        // slicedTickerHistCopy = tickerHist.slice(trainSplit + time_step, tickerHist.length - (look_ahead - 1))
        // console.log('Hist dataset length after trimming timestep, split and lookahead', slicedTickerHistCopy.length)
        // console.log('Total no in tests (yTrainTest) : ', yTrainTest.length)
        // displayDataInTable(yTrainTest[0], 'Samples of test set first (yTrainTest)')
        // displayDataInTable(yTrainTest[yTrainTest.length - 1], 'Samples of test set last (yTrainTest)')
        // console.log('Samples of test set (yTrainTest)', yTrainTest[0], yTrainTest[yTrainTest.length - 1])
        // console.log('Total no of predictions : ', predictedPrice.length)

        // console.log('First date in hist : ', new Date(slicedTickerHistCopy[0].openTime).toLocaleString(), 'Close : ', slicedTickerHistCopy[0].close)
        // console.log('Original first from test (yTrainTest): ', calculateOriginalPrice(yTrainTest[0][0][0], label_variance, label_mean))

        // console.log('Last date in hist : ', new Date(slicedTickerHistCopy[slicedTickerHistCopy.length - 1].openTime).toLocaleString(), 'Close : ', slicedTickerHistCopy[slicedTickerHistCopy.length - 1].close)
        // console.log('Original last from test (yTrainTest): ', calculateOriginalPrice(yTrainTest[yTrainTest.length - 1][0][0], label_variance, label_mean))

        // slicedTickerHistCopy = tickerHist.slice(-splitPoint) // slicing the histCopy to get the test data openTimek

        /* slicedTickerHistCopyLength = slicedTickerHistCopy.length
        latestTime = slicedTickerHistCopy[slicedTickerHistCopyLength - 1].openTime // look_ahead no of ticker behind
        tickerPeriodInMilliSecond = slicedTickerHistCopy[1].openTime - slicedTickerHistCopy[0].openTime */

        /* let predPlusActual = slicedTickerHistCopy.map((item, index) => {
            const strDate = new Date(item.openTime).toLocaleString()
            return {
                openTime: strDate,
                open: item.openTime / 1000,
                actual: yTrainTest[index][0][0],
                predicted: predictedPrice[index][0][0]
            }
        }) */
        /* slicedTickerHistCopy.forEach((item, index) => {
            const strDate = new Date(item.openTime).toLocaleString();
            const actualValue = yTrainTest[index][0][0];

            dates.push({
                openTime: strDate,
                open: item.openTime / 1000,
                actual: actualValue,
            })
        }) */

        /* const prediction_key = 0
        let predPlusActual = slicedTickerHistCopy.map((item, index) => {
            const strDate = new Date(item.openTime).toLocaleString();
            const actualValue = yTrainTest[index][0][0];


            let predictedValue = null;

            if (index >= prediction_key) {
                const shiftedIndex = index - prediction_key;
                if (shiftedIndex < predictedPrice.length) {
                    predictedValue = predictedPrice[shiftedIndex][prediction_key][0];
                }
            }


             return {
                 openTime: strDate,
                 open: item.openTime / 1000,
                 actual: actualValue,
                 predicted: predictedValue
             };
        }); */



        /* 
        let predPlusActual = slicedTickerHistCopy.map((item, index) => {
            const strDate = new Date(item.openTime).toLocaleString()
            return {
                openTime: strDate,
                open: item.openTime / 1000,
                actual: yTrainTest[index][0][0],
                predicted: index >= prediction_key ? predictedPrice[index - prediction_key][prediction_key][0] : null
            }
        }) */

        /* let predPlusActual = slicedTickerHistCopy.map((item, index) => {
            const strDate = new Date(item.openTime).toLocaleString()
            return {
                openTime: index >= prediction_key ? strDate : null,
                open: index >= prediction_key ? item.openTime / 1000 : null,
                actual: index >= prediction_key ? yTrainTest[index - prediction_key][prediction_key][0] : null,
                predicted: index >= prediction_key ? predictedPrice[index - prediction_key][prediction_key][0] : null
            }
        }) */



        // predPlusActual = [...predPlusActual, ...forecastResult]

        /* originalData = predPlusActual.map((standardizedRow) => ({
            ...standardizedRow,
            actual: calculateOriginalPrice(standardizedRow.actual, label_variance, label_mean),
            predicted: calculateOriginalPrice(standardizedRow.predicted, label_variance, label_mean),
        })); */


        default:
            break;
    }

    // return tickerDates
}


module.exports = {
    processSelectedFunctionsForModelTraining,
    trimDataBasedOnTalibSmallestLength,
    transformDataToRequiredShape,
    standardizeData,
    normalizeData,
    inverseNormalizeData,
    createTrainingData,
    generateModelTrainigData,
    formatPredictedOutput,
    generateEvaluationData,
    calculateFeatureMetrics
}