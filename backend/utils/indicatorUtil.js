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

module.exports = {
    validateOptionalInputData,
    processInputData,
    addDataToFuncQuery,
    formatOutputs
}