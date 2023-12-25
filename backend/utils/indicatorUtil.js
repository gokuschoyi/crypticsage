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

const calculateOriginalPrice = ({ value, variance, mean }) => {
    if (value === null) return null;
    return parseFloat(((value * Math.sqrt(variance)) + mean).toFixed(2));
};

const generateMSESteps = (period) => {
    switch (period) {
        case '1m':
            return { value: 1, unit: 'm' };
        case '1h':
            return { value: 1, unit: 'h' };
        case '4h':
            return { value: 4, unit: 'h' };
        case '6h':
            return { value: 6, unit: 'h' };
        case '8h':
            return { value: 8, unit: 'h' };
        case '12h':
            return { value: 12, unit: 'h' };
        case '1d':
            return { value: 1, unit: 'd' };
        case '3d':
            return { value: 3, unit: 'd' };
        case '1w':
            return { value: 1, unit: 'w' };
        default:
            return { value: 24, unit: 'h' };
    }
};

const calculateRMSE = (actual, predicted) => {
    let sum = 0;
    for (let i = 0; i < actual.length; i++) {
        let diff = predicted[i] - actual[i];
        sum += diff * diff;
    }
    return Math.sqrt(sum / actual.length);
}

const calculateScaledRMSE = (dates, predictions_array, label_variance, label_mean, ticker_period) => {
    let actual = []
    dates.forEach((date) => {
        let actualScaled = calculateOriginalPrice({ value: date.actual, variance: label_variance, mean: label_mean })
        actual.push(actualScaled)
    })
    let predictionsObj = {}
    // console.log(predictions_array[0].length)
    for (let i = 0; i < predictions_array[0].length; i++) {
        let predictions = []
        predictions_array.forEach((prediction) => {
            let predictionScaled = calculateOriginalPrice({ value: prediction[i], variance: label_variance, mean: label_mean })
            predictions.push(predictionScaled)
        })
        predictionsObj[i] = predictions
    }
    // console.log(Object.keys(predictionsObj))

    let rmseArray = []
    Object.keys(predictionsObj).forEach((key, i) => {
        const { value, unit } = generateMSESteps(ticker_period)
        rmseArray.push({
            name: `+${value * (i + 1)}${unit}`,
            rmse: calculateRMSE(actual, predictionsObj[key])
        })
    })

    return rmseArray
}

module.exports = {
    validateOptionalInputData,
    processInputData,
    addDataToFuncQuery,
    formatOutputs,
    calculateScaledRMSE
}