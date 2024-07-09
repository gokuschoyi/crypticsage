const log = require('../middleware/logger/Logger').create(__filename.slice(__dirname.length + 1))
const { redisClient } = require('../services/redis')
const axios = require('axios').default;

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

const formatPrintDate = (date) => {
    const formattedDate = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).format(new Date(date));
    return formattedDate;
}

const divideTimePeriod = (startTime, endTime, period, limit) => {
    const duration = endTime - startTime; // in milliseconds
    const periodInMilliseconds = periodToMilliseconds(period);
    const numberOfDivisions = Math.ceil(duration / (limit * periodInMilliseconds));
    const divisions = [];

    for (let i = 0; i < numberOfDivisions; i++) {
        const start = startTime + i * limit * periodInMilliseconds;
        const end = Math.min(start + limit * periodInMilliseconds, endTime);
        divisions.push({ start, end });
    }

    return divisions;
}

const fetchData = async ({ ticker_name, period, start, end, type }) => {
    let response = [];
    let url = `https://api.binance.com/api/v3/klines?symbol=${ticker_name}&interval=${period}&startTime=${start}&endTime=${end}&limit=1000`;
    // log.info(`Binance ${period} URL : ${url}`)
    let lapsedTime, responseLength
    try {
        const responseFromBinance = await axios.get(url);

        response = responseFromBinance.data;
        responseLength = response.length

        let sDate = formatPrintDate(start)
        let eDate = formatPrintDate(end)

        log.info(`Fetch type : (${type}) [${ticker_name} with period ${period} from ${sDate} to ${eDate}], Fetch count : ${responseLength}`)
        return response
    } catch (error) {
        console.log(error)
        throw error
    }
};

const convertData = (data) => {
    let transformedResult = data.map((item) => {
        return {
            openTime: item[0],
            open: item[1],
            high: item[2],
            low: item[3],
            close: item[4],
            volume: item[5],
            closeTime: item[6],
            quoteAssetVolume: item[7],
            trades: item[8],
            takerBaseAssetVolume: item[9],
            takerQuoteAssetVolume: item[10],
        };
    });
    return transformedResult
};
// Added here because of circular dependecy with HDUtil
const fetchBinanceHistoricalBetweenPeriods = async ({ ticker_name, period, start, end }) => {
    try {
        const limit = 1000;
        const divisions = divideTimePeriod(start, end, period, limit);
        let data = []
        let type = `Update ${period}`
        for (let i = 0; i < divisions.length; i++) {
            let start = divisions[i].start
            let end = divisions[i].end
            let response = await fetchData({ ticker_name, period, start, end, type });
            data = [...data, ...response]
        }
        let convertedData = convertData(data)
        convertedData = convertedData.slice(1)
        return convertedData
    } catch (error) {
        log.error(error.stack)
        throw error
    }
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

    let newVals = []

    if (fetchLength > 0) {
        log.info('New Data available, fetching new tickers from binance')
        const ticker_name = cache_key.split('_')[1]
        const updateQueries = {
            ticker_name,
            period,
            start: latestOpenTime,
            end
        }

        try {
            newVals = await fetchBinanceHistoricalBetweenPeriods({ ...updateQueries })
        } catch (err) {
            log.error(err)
            return
        }
        let prunedData = pruneData(newVals)
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
    return newVals;
}

const get_cached_data = async (cache_key, from_msg, should_return_ = true) => {
    log.info(`Checking cache for ${from_msg}. Key : ${cache_key}`)
    const isDataPresent = await redisClient.exists(cache_key);
    if (isDataPresent) {
        log.info(`Data found in cache for ${from_msg}`)
        const data = await redisClient.get(cache_key);
        return should_return_ ? JSON.parse(data) : [];
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

    let newVals = []

    if (fetchLength > 0) {
        log.info('New Data available, fetching new tickers from binance')
        const ticker_name = cache_key.split('_')[2]
        const updateQueries = {
            ticker_name,
            period: data.period,
            start: latestOpenTime,
            end
        }

        newVals = await fetchBinanceHistoricalBetweenPeriods({ ...updateQueries })
        let prunedData = pruneData(newVals)

        prunedData = prunedData.map((d) => {
            return {
                ...d,
                date: new Date(d.openTime).toLocaleString(),
            }
        })

        data.ticker_data.push(...prunedData)
        // console.log(data.items_per_page)
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

    return newVals
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