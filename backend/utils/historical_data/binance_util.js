const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { connect, close, binanceConnect, binanceClose } = require('../../services/db-conn');
// const { token } = require('morgan');

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
        throw error;
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

        /* let tokenList = []
        const today = new Date()
        console.log(today)
        cryptoData.map((token) => {
            const [y, m, d] = token.asset_launch_date.split("-")
            const launchDate = new Date(y, m, d)
            const diffTime = Math.abs(today - launchDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const diffYears = parseFloat((diffDays / 365).toFixed(2))
            let tenYearsAgo = today - 10 * 365 * 24 * 60 * 60 * 1000
            let obj = {
                token_rank: token.market_cap_rank,
                symbol: token.symbol,
                name: token.name,
                fetch_from: diffYears > 10 ? new Date(tenYearsAgo).toLocaleString() : launchDate.toLocaleString(),
                fetch_to: today.toLocaleString(),
                days: diffDays,
                years: diffYears,
                tickers_1m: diffYears > 10 ? 10 * 365 * 24 * 60 : diffDays * 24 * 60,
                ticker_30m: diffYears > 10 ? 10 * 365 * 24 * 2 : diffDays * 24 * 2,
            }
            tokenList.push(obj)
            console.log(token.symbol, " : ", diffDays + " days,", (diffDays / 365).toFixed(2), " years", diffDays * 24 * 60, "1m tickers", "10 ya : ", launchDate.toLocaleString());
        }) */

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
    } catch (err) {
        console.log(err)
        throw err
    }
}

// Gets all the tickers saved in the db:crypticsage/binance
// Input : none
// Output : array of objects from the db formatted accordingly
/* [
    {
        "_id": "64b7737936811988c24f2a32",
        "ticker_name": "BTCUSDT",
        "data": {
            "4h": {
                "historical": true
            },
            "6h": {
                "historical": true
            },
            "8h": {
                "historical": true
            },
            "12h": {
                "historical": true
            },
            "1d": {
                "historical": true
            },
            "3d": {
                "historical": true
            },
            "1w": {
                "historical": true
            }
        }
    }
] */
const getAvailableBinanceTickersInDb = async () => {
    try {
        const db = await connect("get available binance tickers in db")
        const binanceCollection = db.collection('binance')
        const tickersNew = await binanceCollection.aggregate([
            {
                $project: {
                    _id: 1,
                    ticker_name: 1,
                    data: {
                        $objectToArray: "$data"
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    ticker_name: 1,
                    data: {
                        $arrayToObject: {
                            $map: {
                                input: "$data",
                                as: "period",
                                in: {
                                    k: "$$period.k",
                                    v: {
                                        historical: { $cond: [{ $isArray: "$$period.v.historical" }, true, false] }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ]).toArray()
        // console.log(tickersNew[0].data)
        return tickersNew
    } catch (err) {
        console.log(err)
        throw err
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
        const availableTickerInDb = await getAvailableBinanceTickersInDb()

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
    } catch (err) {
        console.log(err)
        throw err
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

// Insert the initial fetched data to the db:crypticsage/binance
// Input : ticker_name (string), period (string), meta (object), tokenData (array of ticker object) : { ticker_name, period, meta, tokenData }
// Output : object with the result of the insert query or messageif no data to insert
const insertBinanceDataToDb = async ({ ticker_name, period, meta, tokenData }) => {
    const db = await connect("insertBinanceData");
    const binanceCollection = db.collection("binance");

    try {
        let sTime = performance.now()
        const allTickersInDb = await getAvailableBinanceTickersInDb()
        let existingTickerInDb = allTickersInDb.filter((item) => item.ticker_name === ticker_name)[0]

        if (existingTickerInDb) {
            console.log("Ticker exists in DB");
            const historicalDataExists = period in existingTickerInDb.data;

            if (historicalDataExists) {
                console.log("Period for token exists");
                return { message: "No historical update needed" };
            } else {
                let pushDataToDb;
                if (tokenData.length > 0) {
                    const latestDateInData = tokenData[tokenData.length - 1].openTime;
                    const updateQuery = {
                        $push: { [`data.${period}.historical`]: { $each: tokenData } },
                        $set: { [`data.${period}.last_updated`]: new Date(latestDateInData).toLocaleString() },
                    };
                    pushDataToDb = await binanceCollection.updateOne({ ticker_name }, updateQuery);
                    let eTime = performance.now()
                    let lapsedTime = formatMillisecond(eTime - sTime)
                    console.log(`Inserted ${ticker_name}, ${period}, with ${tokenData.length} items, Time taken : ${lapsedTime}`)
                    return pushDataToDb;
                }
                else {
                    console.log(`No data for ${ticker_name}_${period}`, tokenData.length);
                    return pushDataToDb = ["No data to push"]
                }
            }
        } else {
            console.log(`Ticker ${ticker_name} does not exist. Adding to db`);
            const latestDateInData = tokenData[tokenData.length - 1].openTime;
            const newDocument = {
                ticker_name,
                meta,
                data: {
                    [period]: {
                        historical: tokenData,
                        last_updated: new Date(latestDateInData).toLocaleString(),
                    },
                },
            };
            const insertNewObj = await binanceCollection.insertOne(newDocument);
            let eTime = performance.now()
            let lapsedTime = formatMillisecond(eTime - sTime)
            console.log(`Inserted ${ticker_name}, ${period}, with ${tokenData.length} items, Time taken : ${lapsedTime}`)
            return insertNewObj;
        }
    } catch (err) {
        console.log(err);
        throw err; // Propagate the error to the caller
    }
};

// Generates an array of objects with latest and oldest date based on latest tokens and data available in the db:crypticsage/binance
// Input : none
// Output : array of objects with update parameters for generateUpdateQueriesForBinanceTickers()
/* 
[
    {
        "ticker_name": "BTCUSDT",
        "data": {
            "4h": {
                "historical": 12993,
                "firstHistorical": 1502942400000,
                "lastHistorical": 1690156800000,
                "oldestDate": "8/17/2017, 2:00:00 PM",
                "latestDate": "7/24/2023, 10:00:00 AM"
            }
        }
    },
    {
        "ticker_name": "XRPUSDT",
        "data": {
            "4h": {
                "historical": 11409,
                "firstHistorical": 1525420800000,
                "lastHistorical": 1689739200000,
                "oldestDate": "5/4/2018, 6:00:00 PM",
                "latestDate": "7/19/2023, 2:00:00 PM"
            },
        }
    }
] 
*/
const getFirstObjectForEachPeriod = async () => {
    try {
        const db = await connect("get first objs")
        const collection = db.collection('binance');
        const result = await collection.aggregate([
            {
                $project: {
                    _id: 0,
                    ticker_name: 1,
                    data: {
                        $objectToArray: "$data"
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    ticker_name: 1,
                    data: {
                        $arrayToObject: {
                            $map: {
                                input: "$data",
                                as: "period",
                                in: {
                                    k: "$$period.k",
                                    v: {
                                        $let: {
                                            vars: {
                                                historicalArray: "$$period.v.historical",
                                                firstHistorical: { $arrayElemAt: ["$$period.v.historical", 0] },
                                                lastHistorical: { $arrayElemAt: ["$$period.v.historical", -1] }
                                            },
                                            in: {
                                                $mergeObjects: [
                                                    { historical: { $size: "$$historicalArray" } },
                                                    { firstHistorical: "$$firstHistorical.openTime" },
                                                    { lastHistorical: "$$lastHistorical.openTime" }
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ]).toArray();

        const objectsWithConvertedDate = result.map((obj) => {
            const dataWithConvertedDate = Object.entries(obj.data).reduce((acc, [key, value]) => {
                // console.log(value)
                const oldestDate = new Date(value.firstHistorical).toLocaleString();
                const latestDate = new Date(value.lastHistorical).toLocaleString();

                return { ...acc, [key]: { ...value, oldestDate, latestDate } };
            }, {});

            return { ...obj, data: dataWithConvertedDate };
        });

        return objectsWithConvertedDate;
    } catch (error) {
        console.error('Error retrieving data:', error);
        throw error;
    } finally {
        close("get first objs");
    }
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
        const latestBinanceTickerStatus = await getFirstObjectForEachPeriod()
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

// Updates the Ticker with the latest data
// Input : ticker_name (string), period (string), tokenData (array of ticker object) : { ticker_name, period, tokenData }
// Output : return modified count
const updateBinanceDataToDb = async ({ ticker_name, period, tokenData }) => {
    let updatedReuslt;
    try {
        const db = await connect("Updating data (>= 4h)")
        const binanceCollection = db.collection("binance")
        const filter = {
            "ticker_name": ticker_name
        }
        let latestDate = new Date(tokenData[tokenData.length - 1].openTime).toLocaleString()
        const updateQuery = {
            $push: {
                [`data.${period}.historical`]: { $each: tokenData }
            },
            $set: {
                [`data.${period}.last_updated`]: latestDate
            }
        }
        let sTime = performance.now()
        updatedReuslt = await binanceCollection.updateOne(filter, updateQuery)
        let eTime = performance.now()
        let lapsedTime = formatMillisecond(eTime - sTime)
        console.log(`Updated ${ticker_name} with ${tokenData.length} items, Time taken : ${lapsedTime}`)
    } catch (err) {
        console.log(err)
        throw err
    }
    return updatedReuslt.modifiedCount
}

// <------------------------ 4h, 6h, 8h, 12h, 1d, 3d, 1w (END) ------------------------> //



// <------------------------ 1m ------------------------> //

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
    } catch (err) {
        console.log(err)
        throw err
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
    } while (count < 3);

    const finalData = convertData(data)

    console.log("Fetched count", finalData.length);
    return finalData;
};

// get all the token names collection from db: Crypticsage/binance
// Input : none
// Output : array of token names
/* 
[
    "BTCUSDT",
    "BNBUSDT",
    "ADAUSDT",
    "SOLUSDT", 
    "ETHUSDT",
    "XRPUSDT",
    "APTUSDT",
    "ARBUSDT",
    "USDCUSDT",
    "DOGEUSDT"
]
*/
const getBinanceTickerNames = async () => {
    try {
        const db = await connect("Get Binance ticker names from db crypticsage/binance")
        const binanceCollection = db.collection("binance")
        const result = await binanceCollection.aggregate([
            {
                $group: {
                    _id: null,
                    ticker_names: { $addToSet: "$ticker_name" }
                }
            },
            {
                $project: {
                    _id: 0,
                    ticker_names: 1
                }
            }
        ]).toArray()
        return result[0].ticker_names
    } catch (err) {
        console.log(err)
        throw err
    }
}

// get all collection names from db: binance_historical
// Input : none
// Output : array of token names
/* 
[
    "BTCUSDT",
    "USDCUSDT",
    "ARBUSDT",
    "BNBUSDT",
    "ADAUSDT"
]
*/
const getTickersInBinanceDbMinutes = async () => {
    try {
        const db = await binanceConnect("Get all collection names from db binance_historical")
        const collectionsList = await db.listCollections().toArray()
        let collectionNames = []
        if (collectionsList.length > 0) {
            collectionsList.map((item) => { collectionNames.push(item.name) })
            return collectionNames
        } else {
            return []
        }
    } catch (err) {
        console.log(err)
        throw err
    }
}


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
        const tickerInDb = await getBinanceTickerNames()
        const collections = await getTickersInBinanceDbMinutes()

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
    } catch (err) {
        console.log(err)
        throw err
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
            const db = await binanceConnect("Get last document from collection - binance_historical")
            if (tokensToUpdate.length > 0) {
                for (const index in tokensToUpdate) {
                    const collection = db.collection(`${tokensToUpdate[index]}`)
                    const lastDocument = await collection.findOne({}, { sort: { $natural: -1 } })
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

// Insert the fetched ticker data to the db:binance_historical in batches
// Input : ticker_name (string), token_data (array of ticker object) : { ticker_name, token_data }
// Output : object with the result of the mongo insert query
const insertOneMBinanceDataToDb = async ({ ticker_name, token_data }) => {
    try {
        const db = await binanceConnect("saving oneM binance token data")
        const collection = db.collection(`${ticker_name}`)
        const batchSize = 1000;
        let noOfBatches = Math.ceil(token_data.length / batchSize)
        let inserted = []
        for (let i = 0; i < token_data.length; i += batchSize) {
            const batch = token_data.slice(i, i + batchSize);

            // Insert the batch of documents into the collection
            let sTime = performance.now()
            let ins = await collection.insertMany(batch);
            let eTime = performance.now()
            let lapsedTime = formatMillisecond(eTime - sTime)
            let batchNo = i > 0 ? Math.ceil(i / 1000) : 1
            inserted.push({ batch_no: batchNo, inserted: ins.insertedCount, acknowledged: ins.acknowledged })
            console.log(`Inserted batch ${batchNo} of ${noOfBatches}, Time taken : ${lapsedTime}`)

            // console.log(`Inserted batch ${i} of ${noOfBatches}`);
        }
        console.log('Data insertion complete.');
        return inserted
    } catch (err) {
        console.log(err)
        throw err
    }
}



const getData = async (req, res) => {
    const { ticker_name } = req.body
    try {
        const db = await binanceConnect("Fetching binance token data")
        const collection = db.collection(`${ticker_name}`)
        const tokenData = await collection.find({}).toArray()
        let finalResult = []
        if (tokenData) {
            tokenData.map((data) => {
                let obj = {
                    openTime: new Date(data.openTime).toLocaleString(),
                    open: data.open,
                    high: data.high,
                    low: data.low,
                    close: data.close,
                }
                finalResult.push(obj)
            })
            res.status(200).json({ message: "success", data: finalResult })
        } else {
            res.status(500).json({ message: "failed", data: "No data found" })
        }
    } catch (err) {
        res.status(500).json({ message: "failed", data: err })
    }
}

const checkDuplicateData = async ({ ticker_name }) => {
    try {
        const db = await binanceConnect("checking duplicate data")
        const testColl = await db.listCollections().toArray()
        const collection = db.collection(`${ticker_name}`)
        const pipeline = [
            {
                $group: {
                    _id: "$openTime",
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ];

        const duplicateGroups = await collection.aggregate(pipeline).toArray();
        if (duplicateGroups.length > 0) {
            console.log("Duplicate documents found!");
            console.log("Duplicate groups:", duplicateGroups);
            return [duplicateGroups, testColl]
        } else {
            console.log("No duplicate documents based on the openTime key.");
            return []
        }
    } catch (err) {
        console.log(err)
        throw err
    } finally {
        binanceClose("checking duplicate data")
    }
}


const fetchDeatilsForBinanceTokens = async (req, res) => {
    const { ticker_name, period, start, end } = req.body
    try {
        let test = await checkDuplicateData({ ticker_name })
        res.status(200).json({ message: "success", test })
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "failed", data: err })
    }
}

module.exports = {
    generateFetchQueriesForBinanceTickers,
    fetchHistoricalDataBinance,
    insertBinanceDataToDb,
    generateUpdateQueriesForBinanceTickers,
    fetchLatestTickerData,
    updateBinanceDataToDb,
    fetchBinanceHistoricalBetweenPeriods,
    testGetHistoricalDataBinance,
    getMinuteTokensToFetchAndUpdate,
    generateFetchAndUpdateQueries,
    insertOneMBinanceDataToDb,
    getData,
    fetchDeatilsForBinanceTokens
}