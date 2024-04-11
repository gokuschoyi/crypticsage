const log = require('../middleware/logger/Logger').create(__filename.slice(__dirname.length + 1))
const { redisClient } = require('../services/redis')
const HDUtil = require('../utils/historicalDataUtil')

// Converts the period to milliseconds
// INPUT : period
// OUTPUT : milliseconds
const periodToMilliseconds = (period) => {
    switch (period) {
        case '1m':
            return 1000 * 60;
        case '3m':
            return 1000 * 60 * 3;
        case '5m':
            return 1000 * 60 * 5;
        case '15m':
            return 1000 * 60 * 15;
        case '30m':
            return 1000 * 60 * 30;
        case '1h':
            return 1000 * 60 * 60;
        case '2h':
            return 1000 * 60 * 60 * 2;
        case '4h':
            return 1000 * 60 * 60 * 4;
        case '6h':
            return 1000 * 60 * 60 * 6;
        case '8h':
            return 1000 * 60 * 60 * 8;
        case '12h':
            return 1000 * 60 * 60 * 12;
        case '1d':
            return 1000 * 60 * 60 * 24;
        case '3d':
            return 1000 * 60 * 60 * 24 * 3;
        case '1w':
            return 1000 * 60 * 60 * 24 * 7;
        default:
            return 1000 * 60 * 60 * 24;
    }
}

const checkIfNewTickerFetchIsRequired = ({ openTime, selectedTokenPeriod }) => {
    const periodInMilli = periodToMilliseconds(selectedTokenPeriod)
    const currentTime = new Date().getTime()

    let fetchLength = Math.floor((currentTime - openTime) / periodInMilli)

    let end
    switch (selectedTokenPeriod) {
        case '1m':
            end = new Date()
            end.setMinutes(end.getMinutes() - 1)
            end.setSeconds(59)
            break;
        default:
            let endAdded = new Date(openTime).getTime() + (fetchLength * periodInMilli) - 1000
            end = new Date(endAdded)
            break;
    }

    // console.log(new Date(openTime).toLocaleString(), new Date(end).toLocaleString())
    let finalDate = end.getTime()
    fetchLength = fetchLength - 1 // to avoid fetching the last ticker
    return [fetchLength, finalDate]
}

const pruneData = (new_data) => {
    return new_data.map((d) => ({
        openTime: d.openTime,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
    }))
}

const set_cached_historical_data = async (cache_key, data, period) => {
    log.info(`Setting cache for key: ${cache_key}`)
    log.info(`DB Data length : ${data.length}`)

    const latestOpenTime = data[data.length - 1].openTime
    const [fetchLength, end] = checkIfNewTickerFetchIsRequired({
        openTime: latestOpenTime,
        selectedTokenPeriod: period
    })

    // console.log('Last date DB : ', new Date(latestOpenTime).toLocaleString())
    // console.log('Fetch length : ', fetchLength)
    // console.log('End :', new Date(end).toLocaleString())

    let prunedData = []

    if (fetchLength > 0) {
        log.info('New Data available, fetching new tickers from binance')
        const ticker_name = cache_key.split('_')[2]
        const updateQueries = {
            ticker_name,
            period,
            start: latestOpenTime,
            end
        }

        const newVals = await HDUtil.fetchBinanceHistoricalBetweenPeriods({ ...updateQueries })
        prunedData = pruneData(newVals)
        // console.log('New tickers fetched (pruned):', prunedData)
        data.push(...prunedData)
        log.info(`Updated fetched data length :  ${data.length}`)
    } else {
        log.info(`Up to date, fetched data length :  ${data.length}`)
    }

    const lastDate = end + periodToMilliseconds(period) // time at which the next ticker will be fetched
    // console.log('Last date :', new Date(lastDate).toLocaleString())

    const expires_in = Math.round((lastDate - new Date().getTime()) / 1000)
    log.warn(`Data expires in ${expires_in} seconds`)

    await redisClient.set(cache_key, JSON.stringify(data));
    await redisClient.expire(cache_key, expires_in);
    return prunedData;
}

const get_cached_data = async (cache_key, from_msg) => {
    log.info(`Checking cache for ${from_msg}. Key : ${cache_key}`)
    const isDataPresent = await redisClient.exists(cache_key);
    if (isDataPresent) {
        log.info(`Data found in cache for ${from_msg}`)
        const data = await redisClient.get(cache_key);
        return JSON.parse(data);
    } else {
        log.info(`Data not found in cache for ${from_msg}`)
        return null;
    }
}

const set_cached_ohlcv_data = async (cache_key, data) => {
    log.info(`Setting cache (OHLCV) for key: ${cache_key}`)
    const latestOpenTime = data.ticker_data[data.ticker_data.length - 1].openTime

    const [fetchLength, end] = checkIfNewTickerFetchIsRequired({
        openTime: latestOpenTime,
        selectedTokenPeriod: data.period
    })

    let prunedData = []

    if (fetchLength > 0) {
        log.info('New Data available, fetching new tickers from binance')
        const ticker_name = cache_key.split('_')[2]
        const updateQueries = {
            ticker_name,
            period: data.period,
            start: latestOpenTime,
            end
        }

        const newVals = await HDUtil.fetchBinanceHistoricalBetweenPeriods({ ...updateQueries })
        prunedData = pruneData(newVals)

        prunedData = prunedData.map((d) => {
            return {
                ...d,
                date: new Date(d.openTime).toLocaleString(),
            }
        })

        data.ticker_data.push(...prunedData)
        console.log(data.items_per_page)
        data.ticker_data = data.ticker_data.slice(-data.items_per_page)
        data.start_date = data.ticker_data.slice(-1)[0].date
        data.end_date = data.ticker_data[0].date
        log.info(`Updated fetched data length :  ${data.ticker_data.length}`)
    } else {
        log.info(`Up to date, fetched data length :  ${data.ticker_data.length}`)
    }

    const lastDate = end + periodToMilliseconds(data.period) // time at which the next ticker will be fetched

    const expires_in = Math.round((lastDate - new Date().getTime()) / 1000)
    log.warn(`Data expires in ${expires_in} seconds`)

    data.expires_at = lastDate
    await redisClient.set(cache_key, JSON.stringify(data));
    await redisClient.expire(cache_key, expires_in);

    return prunedData
}

const update_cached_ohlcv_data = async (cache_key, data) => {
    log.info(`Updating cache (OHLCV) for key: ${cache_key}`)
    const expires_in = Math.round((data.expires_at - new Date().getTime()) / 1000)
    log.warn(`Update expires in ${expires_in} seconds`)
    await redisClient.set(cache_key, JSON.stringify(data));
    await redisClient.expire(cache_key, expires_in);
}

module.exports = {
    get_cached_data
    , set_cached_historical_data
    , set_cached_ohlcv_data
    , update_cached_ohlcv_data
}