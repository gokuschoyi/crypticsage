const yahooFinance = require('yahoo-finance2').default;
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const MDBServices = require('../services/mongoDBServices')

// ------------------------------------Y-FINANCE-----------------------------------------//

// new Date 10/07/2023, 12:19:38 pm to yyyy-mm-dd
const formatDateForYFinance = (param) => {
    // console.log(" Date param", param)
    const [date, tz] = param.split(', ');
    const [d, m, y] = date.split('/')
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
        console.log("Fetching historical data for ", ticker_name, " from ", from, " to ", to, " with period ", period);
        result = await yahooFinance.historical(query, queryOptions)
        fResult = result.map((token) => {
            let unixTime = new Date(token.date).getTime();
            return {
                ...token,
                openTime: unixTime
            }
        })
        return fResult
    } catch (err) {
        console.log(err.message, err.code)
        throw new Error(err)
    }
}

const getFirstTradeDate = async ({ symbol }) => {
    try {
        const res = await yahooFinance.quote(symbol, {}, { validateResult: false })
        return res.firstTradeDateMilliseconds
    } catch (err) {
        console.log(err)
        throw new Error(err.message)
    }
}

// takes the last_updated and checks if that ticker needs update or not
// returns [daysElapsed, from, to]
const checkForUpdates = async ({ last_updated }) => {
    let currentDate = new Date().getTime()
    let lastUpdatedTickerDate = new Date(last_updated).getTime()
    let timeDiff = currentDate - lastUpdatedTickerDate // Calculate the time difference in milliseconds
    let daysElapsed = parseFloat((timeDiff / (1000 * 3600 * 24)).toFixed(2)) // Convert milliseconds to days

    // Get the current date adjusted for the desired time zone and convert to UTC
    // 2023-07-10T00:00:00.000+00:00 to 10/07/2023, 10:00:00 am
    /* const currentDate = new Date();
    const currentUTCDate = new Date(currentDate.toLocaleString('en-US', { timeZone: "UTC" }))

    const l_updated = new Date(last_updated); // Convert the GMT time to a Date object
    const lastUpdatedTickerDate = new Date(l_updated.toLocaleString("en-US", { timeZone: "Australia/Sydney" }));

    const timeDiff = currentUTCDate.getTime() - lastUpdatedTickerDate.getTime(); // Calculate the time difference in milliseconds
    let daysElapsed = parseFloat((timeDiff / (1000 * 3600 * 24)).toFixed(2)) // Convert milliseconds to days */

    if (daysElapsed > 0) {
        let from = formatDateForYFinance(new Date(last_updated).toLocaleString())
        let to = formatDateForYFinance(new Date(currentDate).toLocaleString())
        if (from === to) {
            return [daysElapsed = 0]
        }
        return [daysElapsed, from, to]
    } else {
        return [daysElapsed = 0]
    }

    // console.log("elapsed :", daysElapsed, currentUTCDate.toLocaleString(), "+", lastUpdatedTickerDate.toLocaleString())

}

// ------------------------------------Y-FINANCE-----------------------------------------//


// -------------------------------------BINANCE------------------------------------------//

const formatMillisecond = (milliseconds) => {
    if (milliseconds < 1000) {
        return milliseconds.toFixed(3) + ' ms';
    } else if (milliseconds < 60000) {
        return (milliseconds / 1000).toFixed(3) + ' s';
    } else {
        const hours = Math.floor(milliseconds / 3600000);
        const minutes = Math.floor((milliseconds % 3600000) / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        const remainingMilliseconds = milliseconds % 1000;

        const formattedTime = [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0'),
            remainingMilliseconds.toString().padStart(3, '0')
        ].join(':');

        return formattedTime;
    }
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

const fetchData = async ({ ticker_name, period, start, end, type }) => {
    let response = [];
    let url = `https://api.binance.com/api/v3/klines?symbol=${ticker_name}&interval=${period}&startTime=${start}&endTime=${end}&limit=1000`;
    console.log(`Binance ${period} URL : `, url)
    let sTime, eTime, lapsedTime, responseLength
    try {
        sTime = performance.now()
        const responseFromBinance = await axios.get(url);
        eTime = performance.now()

        response = responseFromBinance.data;
        responseLength = response.length
        lapsedTime = formatMillisecond(eTime - sTime)

        let sDate = formatPrintDate(start)
        let eDate = formatPrintDate(end)

        console.log(`Fetch type : (${type}) [${ticker_name} with period ${period} from ${sDate} to ${eDate}], Fetch count : ${responseLength}, Time taken : ${lapsedTime}`)
        return response
    } catch (error) {
        console.error('Error fetching data:', error);
        throw new Error(error)
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

// <------------------------ 4h, 6h, 8h, 12h, 1d, 3d, 1w  (START) ------------------------> //

async function processHistoricalData(job) {
    const { ticker, period, meta } = job.data;
    console.log(`--------------------PROCESS HISTORICAL DATA START ${ticker} with period ${period}-------------------`)

    let params = {
        ticker_name: ticker,
        period: period
    }
    let historicalData = await fetchHistoricalDataBinance(params); // Fetch the historical data for the ticker and time period
    let ins
    if (historicalData.length > 0) {
        const allTickers = await MDBServices.getAvailableBinanceTickersInDb();
        ins = await MDBServices.insertBinanceDataToDb({ ticker_name: ticker, period: period, meta: meta, tokenData: historicalData, allTickersInDb: allTickers }); // save historical data to db
    } else {
        ins = ['No Data Found']
    }
    console.log(`--------------------PROCESS HISTORICAL DATA END ${ticker} with period ${period}-------------------`)
    return ins; // Return the result
}

// function for the initialFetchWorker to process initial fetches One Min data
async function processOneMHistoricalData(job) {
    const { ticker_name, period } = job.data;
    console.log(`--------------------PROCESS 1m HISTORICAL DATA START ${ticker_name} with period ${period}-------------------`)
    let params = {
        ticker_name: ticker_name,
        period: period
    }
    let fetchedData = await testGetHistoricalDataBinance(params);
    let ins
    if (fetchedData.length > 0) {
        ins = await MDBServices.insertOneMBinanceDataToDb({ ticker_name: ticker_name, token_data: fetchedData })
    } else {
        ins = ['No Data Found']
    }
    console.log(`--------------------PROCESS 1m HISTORICAL DATA END ${ticker_name} with period ${period}-------------------`)
    return ins
}

// Function for the updateWorker to process updates
const processUpdateHistoricalData = async (job) => {
    const { ticker_name, period, start, end } = job.data
    console.log(`--------------------UPDATE HISTORICAL DATA START ${ticker_name} WITH PERIOD ${period} from ${new Date(start).toLocaleString()} to ${new Date(end).toLocaleString()}-------------------`)

    let insertResult = []
    const updateResult = await fetchLatestTickerData({ ticker_name, period, start, end })
    if (updateResult.length > 0) {
        insertResult = await MDBServices.updateBinanceDataToDb({ ticker_name, period, tokenData: updateResult })
        console.log(`--------------------UPDATE HISTORICAL DATA END ${ticker_name} WITH PERIOD ${period} from ${new Date(start).toLocaleString()} to ${new Date(end).toLocaleString()}-------------------`)

        return insertResult
    } else {
        console.log("No new data to update")
        console.log(`--------------------UPDATE HISTORICAL DATA END ${ticker_name} WITH PERIOD ${period} from ${new Date(start).toLocaleString()} to ${new Date(end).toLocaleString()}-------------------`)
        return insertResult = ["No New Data"]
    }

}

// function for the oneMUpdateWorker to process and update One Min data
const processUpdateHistoricalOneMData = async (job) => {
    const { ticker_name, period, start, end } = job.data
    console.log(`--------------------UPDATE HISTORICAL DATA START ${ticker_name} WITH PERIOD ${period} from ${new Date(start).toLocaleString()} to ${new Date(end).toLocaleString()}-------------------`)
    let params = {
        ticker_name: ticker_name,
        period: period,
        start: start,
        end: end
    }
    const fetchedData = await fetchBinanceHistoricalBetweenPeriods(params)
    let ins
    if (fetchedData.length > 0) {
        ins = await MDBServices.insertOneMBinanceDataToDb({ ticker_name: ticker_name, token_data: fetchedData })
    } else {
        ins = ["No new Data"]
    }
    console.log(`--------------------UPDATE HISTORICAL DATA END ${ticker_name} WITH PERIOD ${period} from ${new Date(start).toLocaleString()} to ${new Date(end).toLocaleString()}-------------------`)
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
    // console.log("token_count", token_count)
    try {
        const mkt_full_url = `https://min-api.cryptocompare.com/data/top/mktcapfull?limit=${token_count}&tsym=USD`
        let latestTokenData = await axios.get(mkt_full_url)
        latestTokenData = latestTokenData.data.Data

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
        console.log(error)
        throw new Error(error.message)
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
const generateFetchQueriesForBinanceTickers = async ({ periods, token_count }) => {
    const fetchQuery = []
    try {
        console.time("Total duration to generate initial fetch queries")
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
        const availableTickerInDb = await MDBServices.getAvailableBinanceTickersInDb()

        for (const tickerInfo of allTickers) {
            const ticker = tickerInfo.token;
            const matchedTicker = availableTickerInDb.find(
                (ticker) => ticker.ticker_name === tickerInfo.token
            );

            if (matchedTicker) {
                // console.log("ticker level exists")
                for (const period of periods) {
                    if (!matchedTicker.data[period]?.historical) {
                        // console.log("hist data length for period = 0")
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
        console.timeEnd("Total duration to generate initial fetch queries")
        return [fetchQuery, totalNoOfRequiredFetches];
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
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
    let type = "Initial Fetch >=4h"
    // start is the older date and end is the latest date to fetch from
    let end = new Date().getTime() - dayOffset;
    let start = end - (1000 * toSubtract)
    let data = []

    let response
    console.time("Total time to fetch and convert data")
    do {
        response = await fetchData({ ticker_name, period, start, end, type });

        if (response.length > 0) {
            data = [...response, ...data]
            end = response[0][0]
            start = end - (1000 * toSubtract)
        }
    } while (response.length > 1);

    const finalData = convertData(data)
    console.timeEnd("Total time to fetch and convert data")
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
const generateUpdateQueriesForBinanceTickers = async () => {
    try {
        const latestBinanceTickerStatus = await MDBServices.getFirstObjectForEachPeriod({ collection_name: 'binance' })
        let result = latestBinanceTickerStatus.flatMap((obj) => {
            const ticker_name = obj.ticker_name
            return Object.entries(obj.data).map(([period, { lastHistorical }]) => ({
                ticker_name,
                period,
                start: lastHistorical,
                end: new Date().getTime(),
                id: uuidv4(),
                jobName: `updateHistoricalData_${ticker_name}_${period}`,
            }))
        })
        const totalNoOfRequiredUpdates = result.length
        return [result, totalNoOfRequiredUpdates]
    } catch (err) {
        console.log(err)
        throw err
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
        let type = "Update >=4h"
        let newData = []
        let response = await fetchData({ ticker_name, period, start, end, type })
        if (response.length > 0) {
            let convertedData = await convertData(response)
            newData = convertedData.filter((item) => item.openTime > start)
        }
        return newData
    } catch (err) {
        console.log(err)
        throw err
    }
}

// <------------------------ 4h, 6h, 8h, 12h, 1d, 3d, 1w (END) ------------------------> //



// <----------------------------------------1m-----------------------------------------> //

// Below functions conains 2 functions, one to get the token names that needs full fetch 
// and the other function returns the token names that needs updates.
// calculateTokensToFetch() 
// Input : none
// Output : [["", ""}], 2]
/* 
[
    [
        "SOLUSDT",
        "ETHUSDT",
        "APTUSDT",
        "XRPUSDT",
        "DOGEUSDT"
    ],
    5
]

// calculateTokensToUpdate()
// Input : none
// Output : [["", ""}], 2]
[
    [
        "BTCUSDT",
        "BNBUSDT",
        "ADAUSDT",
        "ARBUSDT",
        "USDCUSDT"
    ],
    5
]
*/
const getMinuteTokensToFetchAndUpdate = async () => {
    try {
        const tickerInDb = await MDBServices.getBinanceTickerNames()
        const collections = await MDBServices.getTickersInBinanceDbMinutes()

        const calculateTokensToFetch = () => {
            let tokensToFetch = []
            tokensToFetch = tickerInDb.filter((item) => !collections.includes(item));
            let totalCount = tokensToFetch.length
            return [tokensToFetch, totalCount]
        };

        const calculateTokensToUpdate = () => {
            if (collections.length === 0) {
                return [tokensToUpdate = [], totalCount = 0]
            } else {
                let tokensToUpdate = []
                tokensToUpdate = tickerInDb.filter((item) => collections.includes(item));
                let totalCount = tokensToUpdate.length
                return [tokensToUpdate, totalCount]
            }
        }

        return [calculateTokensToFetch, calculateTokensToUpdate]
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// generate fetch queries for tokens that need full fetch and
// update queries for tokens that need updates, DB - binance_historical
// generateFetchQueries()
// Input : array of token names : ["BTCUSDT", "BNBUSDT", "ADAUSDT", "ARBUSDT", "USDCUSDT"]
// Output : array of objects with fetch parameters
/* 
[
    {
        "ticker_name": "SOLUSDT",
        "period": "1m",
        "id": "411d3e55-acf2-443b-803f-140e6593dd4e",
        "jobName": "fetchHistoricalData_One_Min_SOLUSDT_1m"
    },
    {
        "ticker_name": "ETHUSDT",
        "period": "1m",
        "id": "801ad120-3b86-435e-ae4d-b94f6a8996a3",
        "jobName": "fetchHistoricalData_One_Min_ETHUSDT_1m"
    }
]

// generateUpdateQueries()
// Input : array of token names : ["BTCUSDT", "BNBUSDT", "ADAUSDT", "ARBUSDT", "USDCUSDT"]
// Output : array of objects with update parameters
[
    {
        "ticker_name": "BTCUSDT",
        "period": "1m",
        "start": 1690164780000,
        "end": 1690179094031,
        "id": "9e8aa18d-a93d-4850-a5db-c46ad18c0726",
        "jobName": "fetchHistoricalData_One_Min_BTCUSDT_1m"
    },
    {
        "ticker_name": "BNBUSDT",
        "period": "1m",
        "start": 1690164360000,
        "end": 1690179094039,
        "id": "cb5386b0-e47b-4093-b5af-8e97ff08a69c",
        "jobName": "fetchHistoricalData_One_Min_BNBUSDT_1m"
    }
]
*/
const generateFetchAndUpdateQueries = async () => {
    const generateFetchQueries = async ({ tokensToFetch }) => {
        const fetchQueries = []
        try {
            if (tokensToFetch.length > 0) {
                tokensToFetch.map((item) => {
                    fetchQueries.push({
                        ticker_name: item,
                        period: "1m",
                        id: uuidv4(),
                        jobName: `fetchHistoricalData_One_Min_${item}_1m`,
                    })
                })
            } else {
                console.log("No tokens to fetch")
            }
        } catch (err) {
            console.log(err)
            throw err
        }
        return fetchQueries
    }

    const generateUpdateQueries = async ({ tokensToUpdate }) => {
        const updateQueries = []
        try {
            if (tokensToUpdate.length > 0) {
                for (const index in tokensToUpdate) {
                    const ticker_name = tokensToUpdate[index]
                    const lastDocument = await MDBServices.getLatestOneMTickerDataFromDb({ ticker_name })
                    const latestDate = new Date(lastDocument.openTime).getTime()
                    const today = new Date().getTime()
                    // console.log("last document", lastDocument)
                    updateQueries.push({
                        ticker_name: tokensToUpdate[index],
                        period: "1m",
                        start: latestDate,
                        end: today,
                        id: uuidv4(),
                        jobName: `fetchHistoricalData_One_Min_${tokensToUpdate[index]}_1m`
                    })
                }
                return updateQueries
            } else {
                console.log("No tokens to update")
                return updateQueries
            }
        } catch (err) {
            console.log(err)
            throw err
        }
    }

    return [generateFetchQueries, generateUpdateQueries]
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
    } while (count < 3);

    const finalData = convertData(data)

    console.log("Fetched count", finalData.length);
    return finalData;
};

const fetchBinanceHistoricalBetweenPeriods = async ({ ticker_name, period, start, end }) => {
    try {
        const divisions = divideTimePeriod(start, end, period, limit = 1000);
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
        console.log(error)
        throw new Error(error.message)
    }
}

// <----------------------------------------1m-----------------------------------------> //

// -------------------------------------BINANCE------------------------------------------//


const fetchDeatilsForBinanceTokens = async (req, res) => {
    const { ticker_name, period, start, end } = req.body
    try {
        // let test = await MDBServices.checkDuplicateData({ ticker_name })
        // let tickerData = await MDBServices.getData({ ticker_name })
        let test = await MDBServices.getAvailableBinanceTickersInDb();
        res.status(200).json({ message: "success", test })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "failed", data: err })
    }
}

module.exports = {
    formatDateForYFinance
    , processHistoricalData
    , processOneMHistoricalData
    , processUpdateHistoricalData
    , processUpdateHistoricalOneMData
    , getHistoricalYFinanceData
    , getFirstTradeDate
    , checkForUpdates
    , generateFetchQueriesForBinanceTickers
    , fetchHistoricalDataBinance
    , generateUpdateQueriesForBinanceTickers
    , fetchLatestTickerData
    , getMinuteTokensToFetchAndUpdate
    , generateFetchAndUpdateQueries
    , testGetHistoricalDataBinance
    , fetchBinanceHistoricalBetweenPeriods
    , fetchDeatilsForBinanceTokens
}