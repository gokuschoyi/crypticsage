const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const { createTimer } = require('../utils/timer')
const yahooFinance = require('yahoo-finance2').default;
const axios = require('axios').default;
const { v4: uuidv4 } = require('uuid');

const MDBServices = require('../services/mongoDBServices')

// ------------------------------------Y-FINANCE-----------------------------------------//

// new date 12/13/1980, 1:30:00 AM to 1980-12-13 (mm/dd/yyy to yyyy-mm-dd) 
const formatDateForProcessInitialSaveHistoricalDataYFinance = (param) => {
    log.info(`Date param : ${param}`)
    const [date, tz] = param.split(', ');
    const [m, d, y] = date.split('/')
    const formattedDate = `${y}-${m}-${d}`;
    return formattedDate;
}

// new Date 10/07/2023, 12:19:38 pm to yyyy-mm-dd
const formatDateForYFinance = (param) => {
    log.info(`Date param yf fetch : ${param}`)
    const newDt = new Date(param)
    const d = newDt.getDate()
    const m = newDt.getMonth() + 1
    const y = newDt.getFullYear()
    const formattedDate = `${y}-${m}-${d}`;
    return formattedDate;
}

/* {
    "ticker_name": "AAPL",
    "from": "2012-01-01", // YYYY-MM-DD
    "to": "2012-06-30", // YYYY-MM-DD
    "period": "" // '1d' (daily), '1wk' (weekly), '1mo' (monthly), "1d", "1wk", "1mo"
    Valid intervals: [1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo] but only 1 week data per request
} */
const getHistoricalYFinanceData = async (params) => {
    const { ticker_name, from, to, period } = params;
    const query = ticker_name;
    const queryOptions = {
        period1: from,
        period2: to,
        interval: period
    }
    let result;
    let fResult;
    try {
        log.info(`Fetching historical data for ${ticker_name} from ${from} to ${to}, with period ${period}`);
        result = await yahooFinance.historical(query, queryOptions)
        fResult = result.map((token) => {
            let unixTime = new Date(token.date).getTime();
            return {
                ...token,
                openTime: unixTime
            }
        })
        return fResult
    } catch (error) {
        log.error({ error: error.message, code: error.code })
        throw new Error(error)
    }
}

const getFirstTradeDate = async ({ symbol }) => {
    try {
        const res = await yahooFinance.quote(symbol, {}, { validateResult: false })
        return res.firstTradeDateMilliseconds
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// takes the last_updated and checks if that ticker needs update or not
// returns [daysElapsed, from, to]
/**
 * 
 * @param {*} param0 
 * @returns {Promise<[number, string, string]>}
 */
const checkForUpdates = async ({ last_updated }) => {
    let currentDate = new Date().getTime()
    let lastUpdatedTickerDate = new Date(last_updated).getTime()
    let timeDiff = currentDate - lastUpdatedTickerDate // Calculate the time difference in milliseconds
    let daysElapsed = parseFloat((timeDiff / (1000 * 3600 * 24)).toFixed(2)) // Convert milliseconds to days

    if (daysElapsed > 0) {
        let from = formatDateForYFinance(new Date(last_updated).toLocaleString())
        let to = formatDateForYFinance(new Date(currentDate).toLocaleString())
        if (from === to) {
            return [0, '', '']
        }
        return [daysElapsed, from, to]
    } else {
        return [0, '', '']
    }

    // console.log("elapsed :", daysElapsed, currentUTCDate.toLocaleString(), "+", lastUpdatedTickerDate.toLocaleString())

}

// ------------------------------------Y-FINANCE-----------------------------------------//


// -------------------------------------BINANCE------------------------------------------//

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

const fetchData = async ({ ticker_name, period, start, end, type }) => {
    let response = [];
    let url = `https://api.binance.com/api/v3/klines?symbol=${ticker_name}&interval=${period}&startTime=${start}&endTime=${end}&limit=1000`;
    // log.info(`Binance ${period} URL : ${url}`)
    let lapsedTime, responseLength
    try {
        const t = createTimer('fetchData')
        t.startTimer()
        const responseFromBinance = await axios.get(url);

        response = responseFromBinance.data;
        responseLength = response.length
        lapsedTime = t.calculateTime()

        let sDate = formatPrintDate(start)
        let eDate = formatPrintDate(end)

        log.info(`Fetch type : (${type}) [${ticker_name} with period ${period} from ${sDate} to ${eDate}], Fetch count : ${responseLength}, Time taken : ${lapsedTime}`)
        return response
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error({ message: 'Error fetching data', error: formattedError })
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

// <------------------------ 1m, 4h, 6h, 8h, 12h, 1d, 3d, 1w  (START) ------------------------> //

const calculateUpdateTickerEndDate = ({ openTime, period }) => {
    const periodInMilli = periodToMilliseconds(period)
    const currentTime = new Date().getTime()
    let fetchLength = Math.floor((currentTime - openTime) / periodInMilli)
    log.info()

    let end
    switch (period) {
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

    log.info(`Fetch length for ${period} : ${fetchLength} : ${new Date(openTime).toLocaleString()}, ${new Date(end).toLocaleString()}`)
    let finalDate = end.getTime()
    return finalDate
}

async function processHistoricalData(job) {
    const { ticker, period, meta } = job.data;
    log.info(`----PROCESS HISTORICAL DATA START ${ticker} with period ${period}----`)

    let params = {
        ticker_name: ticker,
        period: period
    }

    let historicalData = []
    if (period === '1m') {
        historicalData = await testGetHistoricalDataBinance(params); // Fetch the historical data for 1m period
    } else {
        historicalData = await fetchHistoricalDataBinance(params); // Fetch the historical data for the ticker and time period
    }

    let ins
    if (historicalData.length > 0) {
        const type = 'crypto'
        let newIns = await MDBServices.insertHistoricalDataToDb(type, ticker, period, historicalData)
        let metadata = {
            oldest: historicalData[0],
            latest: historicalData[historicalData.length - 1],
            updatedCount: historicalData.length,
            metaData: meta
        }
        let updateMetaRes = await MDBServices.updateTickerMetaData(type, ticker, period, metadata)
        ins = [newIns, updateMetaRes]
    } else {
        ins = ['No Data Found']
        log.info("No new data to update")
    }
    log.info(`----PROCESS HISTORICAL DATA END ${ticker} with period ${period}----`)
    return ins; // Return the result
}

// Function for the updateWorker to process updates
const processUpdateHistoricalData = async (job) => {
    const { ticker_name, period, start, end } = job.data
    log.info(`----UPDATE HISTORICAL DATA START ${ticker_name} WITH PERIOD ${period} from ${new Date(start).toLocaleString()} to ${new Date(end).toLocaleString()}----`)

    let params = {
        ticker_name: ticker_name,
        period: period,
        start: start,
        end: end
    }

    let updateResult = []
    if (period === '1m') {
        updateResult = await fetchBinanceHistoricalBetweenPeriods(params)
    } else {
        updateResult = await fetchLatestTickerData(params)
    }

    let ins
    if (updateResult.length > 0) {
        const type = 'crypto'
        let newIns = await MDBServices.insertHistoricalDataToDb(type, ticker_name, period, updateResult)
        let metadata = {
            latest: updateResult[updateResult.length - 1],
            updatedCount: updateResult.length,
        }
        let updateMetaRes = await MDBServices.updateTickerMetaData(type, ticker_name, period, metadata)
        ins = [newIns, updateMetaRes]
        return ins
    } else {
        ins = ["No new data to update"]
        log.info("No new data to update")
    }
    log.info(`----UPDATE HISTORICAL DATA END ${ticker_name} WITH PERIOD ${period} from ${new Date(start).toLocaleString()} to ${new Date(end).toLocaleString()}----`)
    return ins
}

// Takes a token count and returns the top tokens by market cap
// Input : token_count (number)
// Output : array of objects with token details
/* [
    {
        "market_cap_rank": 1,
        "id": "1182",
        "symbol": "BTC",
        "name": "Bitcoin",
        "asset_launch_date": "2009-01-03",
        "token": "BTCUSDT"
    },
    {
        "market_cap_rank": 2,
        "id": "7605",
        "symbol": "ETH",
        "name": "Ethereum",
        "asset_launch_date": "2015-07-30",
        "token": "ETHUSDT"
    },
] */
const getTotalDurationInMarket = async ({ token_count }) => {
    if (token_count === 0 || token_count === "" || token_count === null) {
        token_count = 5
    }
    console.log("token_count", token_count)
    try {
        const mkt_full_url = `https://min-api.cryptocompare.com/data/top/mktcapfull?limit=${token_count}&tsym=USD`
        let latestTokenData = await axios.get(mkt_full_url)
            .then((response) => {
                return response.data.Data
            })

        const binance_symbol_url = "https://api.binance.com/api/v3/exchangeInfo"
        const binanceResult = await axios.get(binance_symbol_url)
        const binanceSymbols = binanceResult.data.symbols

        let cryptoData = latestTokenData.map((token, index) => {
            return {
                market_cap_rank: index + 1,
                id: token.CoinInfo.Id,
                symbol: token.CoinInfo.Name,
                name: token.CoinInfo.FullName,
                asset_launch_date: token.CoinInfo.AssetLaunchDate,
            }
        })

        let finalResult = cryptoData.map((item) => {
            const matched = binanceSymbols.find(
                (symbol) => symbol.baseAsset === item.symbol && symbol.quoteAsset === "USDT"
            );
            return {
                ...item,
                token: matched ? matched.symbol : null,
            }
        })

        return finalResult
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// Generates the required fetch parameters based on latest tokens and data available in the db:crypticsage/binance
// Input : periods (array of periods), token_count (number) : { periods, token_count }
// Output : array of objects with fetch parameters
/* 
[
    {
        "jobName": "fetchHistoricalData_DOGEUSDT_4h",
        "id": "88009102-c04f-4207-a173-8882f10fe394",
        "ticker": "DOGEUSDT",
        "period": "4h",
        "meta": {
            "market_cap_rank": 12,
            "symbol": "DOGE",
            "name": "Dogecoin",
            "asset_launch_date": "2013-12-06"
        }
    },
    {
        "jobName": "fetchHistoricalData_DOGEUSDT_6h",
        "id": "b0bd6769-e58c-4700-bee3-eba7dcfde7df",
        "ticker": "DOGEUSDT",
        "period": "6h",
        "meta": {
            "market_cap_rank": 12,
            "symbol": "DOGE",
            "name": "Dogecoin",
            "asset_launch_date": "2013-12-06"
        }
    }
] 
*/

/**
 * @returns {Promise<[Array, number]>}
 */
const generateFetchQueriesForBinanceTickers = async ({ periods, token_count }) => {
    const fetchQuery = []
    try {
        const t = createTimer("Total duration to generate initial fetch queries")
        t.startTimer()
        const fetchDetailsForBinanceTokens = await getTotalDurationInMarket({ token_count })
        var allTickers = fetchDetailsForBinanceTokens
            .filter((token) => token.token !== null)
            .map((token) => {
                return {
                    token: token.token,
                    symbol: token.symbol,
                    name: token.name,
                    market_cap_rank: token.market_cap_rank,
                    asset_launch_date: token.asset_launch_date,
                }
            })

        const totalNoOfRequiredFetches = allTickers.length * periods.length
        const collection_name = 'binance_metadata'
        const tickersIndb = await MDBServices.getFirstObjectForEachPeriod(collection_name)

        let availableTickerInDb = tickersIndb.map(ticker => {
            const tickerName = ticker.ticker_name
            const data = ticker.data

            // const periods = Object.keys(data)
            const transformedData = {}

            periods.forEach(period => {
                transformedData[period] = {
                    historical: data.hasOwnProperty(period)
                };
            });

            return {
                ticker_name: tickerName,
                data: transformedData
            }
        })

        for (const tickerInfo of allTickers) {
            const ticker = tickerInfo.token;
            const matchedTicker = availableTickerInDb.find((ticker) => ticker.ticker_name === tickerInfo.token);

            if (matchedTicker) {
                log.info('Ticker level exists')
                for (const period of periods) {
                    if (!matchedTicker.data[period]?.historical) {
                        log.info('hist data length for period = 0')
                        const id = uuidv4();
                        const jobName = `fetchHistoricalData_${ticker}_${period}`;
                        fetchQuery.push({
                            jobName: jobName,
                            id: id,
                            ticker: ticker,
                            period: period,
                            meta: {
                                market_cap_rank: tickerInfo.market_cap_rank,
                                symbol: tickerInfo.symbol,
                                name: tickerInfo.name,
                                asset_launch_date: tickerInfo.asset_launch_date,
                            }
                        });
                    }
                }
            } else {
                // console.log("ticker level does not exist")
                for (const period of periods) {
                    const id = uuidv4();
                    const jobName = `fetchHistoricalData_${ticker}_${period}`;
                    fetchQuery.push({
                        jobName: jobName,
                        id: id,
                        ticker: ticker,
                        period: period,
                        meta: {
                            market_cap_rank: tickerInfo.market_cap_rank,
                            symbol: tickerInfo.symbol,
                            name: tickerInfo.name,
                            asset_launch_date: tickerInfo.asset_launch_date,
                        }
                    });
                }
            }
        }
        // console.timeEnd("Total duration to generate initial fetch queries")
        t.stopTimer(__filename.slice(__dirname.length + 1))
        return [fetchQuery, totalNoOfRequiredFetches];
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// Fetchs the historical data for the given ticker and period (Full Fetch)
// Input : ticker_name (string), period (string) : { "ticker": "BTCUSDT", "period": "4h"}
// Output : array of objects with historical data
/* 
[
    {
        "openTime": 1689741300000,
        "open": "30186.23000000",
        "high": "30186.24000000",
        "low": "30163.19000000",
        "close": "30163.19000000",
        "volume": "27.60104000",
        "closeTime": 1689741359999,
        "quoteAssetVolume": "832896.89712490",
        "trades": 519,
        "takerBaseAssetVolume": "2.88502000",
        "takerQuoteAssetVolume": "87062.93771370"
    }
]
 */
const fetchHistoricalDataBinance = async ({ ticker_name, period }) => {
    const dayOffset = (3 * 24 * 60 * 60 * 1000) // 3 days, remove after testing
    let toSubtract = periodToMilliseconds(period)
    let type = "Initial Fetch"
    // start is the older date and end is the latest date to fetch from
    let end = new Date().getTime() - dayOffset;
    let start = end - (1000 * toSubtract)
    let data = []

    let response
    const t = createTimer("Total time to fetch and convert data")
    t.startTimer()
    // console.time("Total time to fetch and convert data")
    do {
        response = await fetchData({ ticker_name, period, start, end, type });

        if (response.length > 0) {
            data = [...response, ...data]
            end = response[0][0]
            start = end - (1000 * toSubtract)
        }
    } while (response.length > 1);

    const finalData = convertData(data)
    // console.timeEnd("Total time to fetch and convert data")
    t.stopTimer(__filename.slice(__dirname.length + 1))
    return finalData;
};

// Generates the required update parameters based on latest tokens and data available in the db:crypticsage/binance
// Input : none
// Output : array of objects with update parameters and total no of updates required : [[{},{}], 56]
/*
[
    [
        {
            "ticker_name": "BTCUSDT",
            "period": "4h",
            "start": 1690156800000,
            "end": 1690170852143,
            "id": "936d33d4-bbf6-4694-b7e1-1fb2ef1e6596",
            "jobName": "updateHistoricalData_BTCUSDT_4h"
        },
        {
            "ticker_name": "BTCUSDT",
            "period": "6h",
            "start": 1690156800000,
            "end": 1690170852143,
            "id": "f6e77d40-ba71-494c-8a95-39a7d3b0d078",
            "jobName": "updateHistoricalData_BTCUSDT_6h"
        },
    ],
    56
]
*/

/**
 * 
 * @returns {Promise<[Array, number]>}
 */
const generateUpdateQueriesForBinanceTickers = async () => {
    try {
        const collection_name = 'binance_metadata'
        const latestBinanceTickerStatus = await MDBServices.getFirstObjectForEachPeriod(collection_name)
        let result = latestBinanceTickerStatus.flatMap((obj) => {
            const ticker_name = obj.ticker_name
            return Object.entries(obj.data).map(([period, { lastHistorical }]) => ({
                ticker_name,
                period,
                start: lastHistorical,
                end: calculateUpdateTickerEndDate({ openTime: lastHistorical, period: period }),
                id: uuidv4(),
                jobName: `updateHistoricalData_${ticker_name}_${period}`,
            }))
        })
        const totalNoOfRequiredUpdates = result.length
        return [result, totalNoOfRequiredUpdates]
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// Fetchs the historical data for the given ticker and period from start to end. (Updating data)
// Input : ticker_name (string), period (string), start (number), end (number) : { ticker_name, period, start, end }
// Output : array of objects with historical data
/* 
[
    {
        "openTime": 1689741300000,
        "open": "30186.23000000",
        "high": "30186.24000000",
        "low": "30163.19000000",
        "close": "30163.19000000",
        "volume": "27.60104000",
        "closeTime": 1689741359999,
        "quoteAssetVolume": "832896.89712490",
        "trades": 519,
        "takerBaseAssetVolume": "2.88502000",
        "takerQuoteAssetVolume": "87062.93771370"
    }
]
 */
const fetchLatestTickerData = async ({ ticker_name, period, start, end }) => {
    try {
        let type = "Update"
        let newData = []
        let response = await fetchData({ ticker_name, period, start, end, type })
        if (response.length > 0) {
            let convertedData = await convertData(response)
            newData = convertedData.filter((item) => item.openTime > start)
        }
        return newData
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// Fetchs the historical data for the given ticker and period = 1m, 3 loops only for testing
// Input : ticker_name (string), period (string) : { "ticker": "BTCUSDT", "period": "1m"}
// Output : array of objects with historical data
/* 
[
    {
        "openTime": 1689741300000,
        "open": "30186.23000000",
        "high": "30186.24000000",
        "low": "30163.19000000",
        "close": "30163.19000000",
        "volume": "27.60104000",
        "closeTime": 1689741359999,
        "quoteAssetVolume": "832896.89712490",
        "trades": 519,
        "takerBaseAssetVolume": "2.88502000",
        "takerQuoteAssetVolume": "87062.93771370"
    }
] 
 */
const testGetHistoricalDataBinance = async ({ ticker_name, period }) => {
    const dayOffset = (3 * 24 * 60 * 60 * 1000) // 3 days, remove after testing
    let toSubtract = periodToMilliseconds(period)
    let type = "Initial Fetch 1m"
    // start is the older date and end is the latest date to fetch from
    let end = new Date().getTime() - dayOffset;
    let start = end - (1000 * toSubtract)

    let data = []
    let count = 0
    do {
        let response = await fetchData({ ticker_name, period, start, end, type });
        if (response.length > 0) {
            data = [...response, ...data]
            end = response[0][0]
            start = end - (1000 * toSubtract)
        }
        count++
    } while (count < 15);

    const finalData = convertData(data)

    log.info(`Fetched count", ${finalData.length}`);
    return finalData;
};

const fetchBinanceHistoricalBetweenPeriods = async ({ ticker_name, period, start, end }) => {
    try {
        const limit = 1000;
        const divisions = divideTimePeriod(start, end, period, limit);
        let data = []
        let type = "Update 1m"
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


// <------------------------ 1m, 4h, 6h, 8h, 12h, 1d, 3d, 1w (END) ------------------------> //


// -------------------------------------BINANCE------------------------------------------//

module.exports = {
    formatDateForProcessInitialSaveHistoricalDataYFinance
    , formatDateForYFinance
    , processHistoricalData
    , calculateUpdateTickerEndDate
    , processUpdateHistoricalData
    , getHistoricalYFinanceData
    , getFirstTradeDate
    , checkForUpdates
    , generateFetchQueriesForBinanceTickers
    , fetchHistoricalDataBinance
    , generateUpdateQueriesForBinanceTickers
    , fetchLatestTickerData
    , testGetHistoricalDataBinance
    , fetchBinanceHistoricalBetweenPeriods
    , fetchData
    , convertData
}