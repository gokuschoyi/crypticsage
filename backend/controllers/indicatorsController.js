const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))
// @ts-ignore
var talib = require('talib/build/Release/talib')
const { createTimer } = require('../utils/timer')

const { getValuesFromRedis } = require('../utils/redis_util');


const getIndicatorDesc = async (req, res) => {
    log.info("TALib Version: " + talib.version);
    var functions = talib.functions;
    var totalFunctionCount = 0;
    var funcDesc = talib.explain("ADX");
    let desc = []
    for (let i in functions) {
        totalFunctionCount++;
        desc.push(functions[i])
    }

    desc = desc.map((func) => {
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
    const emptyArrayWithNull = [...new Array(diff)].map((d) => null)

    let input_data_copy = [...ticker_data]; // Make a copy of the ticker_data

    keys.forEach((key) => {
        const talibResultForKey = talib_result.result[output_keys[key]];
        const combined = [...emptyArrayWithNull, ...talibResultForKey];
        input_data_copy = input_data_copy.map((item, index) => {
            return {
                time: item.openTime / 1000,
                [key]: combined[index],
            };
        });
    });

    return { final_res: input_data_copy, diff: diff }
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

    log.info('Executing talib function')
    // execute the talib function
    var talResult = talib.execute(finalFuncQuery)
    const t = createTimer("Talib Function Execution")
    t.startTimer()

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

    try {
        res.status(200).json({ message: "Execute Talib Function request success", result: final_res, info })
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: "Execute Talib Function request error" })
    }
}

const calculateSMA = async (req, res) => {
    const { asset_type, ticker_name, period, page_no, items_per_page } = req.body.db_query;
    try {
        const cacheKey = `${asset_type}-${ticker_name}-${period}-${page_no}-${items_per_page}`;
        const tokendataFromRedis = await getValuesFromRedis(cacheKey);
        let requiredTokenData = [];
        requiredTokenData = tokendataFromRedis.ticker_data;
        const d1 = requiredTokenData.map((item) => item.close)
        log.info('Executing talib function')
        var result = talib.execute({
            name: "EMA",
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
    calculateSMA
}