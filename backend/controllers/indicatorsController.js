const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))
var talib = require('talib/build/Release/talib')

const { getValuesFromRedis } = require('../utils/redis_util')


const getIndicatorDesc = async (req, res) => {
    log.info("TALib Version: " + talib.version);
    var functions = talib.functions;
    var totalFunctionCount = 0;
    var funcDesc = talib.explain("ADX");
    let desc = []
    for (i in functions) {
        totalFunctionCount++;
        desc.push(functions[i])
    }
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

const calculateSMA = async (req, res) => {
    const { asset_type, ticker_name, period, page_no, items_per_page } = req.body;
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
    calculateSMA
}