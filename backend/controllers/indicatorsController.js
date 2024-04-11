const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))
const IUtil = require('../utils/indicatorUtil');
const { createTimer } = require('../utils/timer')
// @ts-ignore
var talib = require('talib/build/Release/talib')
const CacheUtil = require('../utils/cacheUtil')

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
    const uid = res.locals.data?.uid || req.body.uid;
    const ohlcv_cache_key = `${uid}_${asset_type}_${ticker_name}_${period}_ohlcv_data`

    const from_msg = "Talib - OHLCV Data"
    const tokenDataFromRedis = await CacheUtil.get_cached_data(ohlcv_cache_key, from_msg)

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

module.exports = {
    getIndicatorDesc
    , executeTalibFunction
}