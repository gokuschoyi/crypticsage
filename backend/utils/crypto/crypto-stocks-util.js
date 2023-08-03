// const yahooFinance = require('yahoo-finance2').default; // summary quotes not working
const axios = require('axios');
const { connect, close, binanceConnect, binanceClose } = require('../../services/db-conn')

// < - - - - - - - - - - Helper Functions - - - - - - - - - - >

// Fetches the top tickers by market cap from CryptoCompare
// INPUT : length - number of tickers to fetch : { length: 10 }
// OUTPUT : Array of tickers
/* 
[
    {
        "id": "1182",
        "symbol": "BTC",
        "name": "Bitcoin",
        "max_supply": 20999999.9769,
        "asset_launch_date": "2009-01-03",
        "image_url": "https://www.cryptocompare.com/media/37746251/btc.png",
        "current_price": 29432.56,
        "market_cap_rank": 1,
        "price_change_24h": 191.1700000000019,
        "price_change_percentage_24h": 0.6537650911943718,
        "last_updated": 1690429029,
        "high_24h": 29685.09,
        "low_24h": 29159.16
    }
]
*/
const fetchTopTickerByMarketCap = async ({ length }) => {
    try {
        let cryptoData = await axios.get(`https://min-api.cryptocompare.com/data/top/mktcapfull?limit=${length}&tsym=USD`)
        var filteredCryptoData = cryptoData.data.Data.map((crypto, index) => {
            return {
                id: crypto.CoinInfo.Id,
                symbol: crypto.CoinInfo.Name,
                name: crypto.CoinInfo.FullName,
                max_supply: crypto.CoinInfo.MaxSupply,
                asset_launch_date: crypto.CoinInfo.AssetLaunchDate,
                image_url: `https://www.cryptocompare.com${crypto.CoinInfo.ImageUrl}`,
                current_price: crypto.RAW.USD.PRICE,
                market_cap_rank: index + 1,
                price_change_24h: crypto.RAW.USD.CHANGE24HOUR,
                price_change_percentage_24h: crypto.RAW.USD.CHANGEPCT24HOUR,
                last_updated: crypto.RAW.USD.LASTUPDATE,
                high_24h: crypto.RAW.USD.HIGH24HOUR,
                low_24h: crypto.RAW.USD.LOW24HOUR,
            }
        })
        return cryptoData = filteredCryptoData
    } catch (err) {
        console.log("Error CryptoCompare", err);
        throw err
    }
}

// Fetches the top tickers from CryptoCompare and saves it to the DB : crypticsage/binance-ticker-meta
// INPUT : length - number of tickers to fetch : { length: 10 }
// OUTPUT : Array of status based on the operation, insert or update 
/*
Update existing tickers : 
[
    {
        "acknowledged": true,
        "modifiedCount": 1,
        "upsertedId": null,
        "upsertedCount": 0,
        "matchedCount": 1
    },
    {
        "acknowledged": true,
        "modifiedCount": 1,
        "upsertedId": null,
        "upsertedCount": 0,
        "matchedCount": 1
    }
]

Insert new tickers :
[
{
        "acknowledged": true,
        "insertedId": "64c1e773829fa7a8bd04288e"
    },
    {
        "acknowledged": true,
        "insertedId": "64c1e773829fa7a8bd04288f"
    }
]
*/
const fetchAndSaveLatestTickerMetaDataToDb = async ({ length }) => {
    try {
        const db = await connect("Ticker meta fetch and save")
        console.time('find')
        const ticker_meta_collection = db.collection("binance_ticker_meta")
        const collection = await ticker_meta_collection.find().toArray()
        console.timeEnd('find')
        if (collection.length > 0) {
            let cryptoData = await fetchTopTickerByMarketCap({ length })
            // Update existing tickers and insert new tickers
            let status = []
            for (const tickerData of cryptoData) {
                const existingTicker = collection.find(
                    (ticker) => ticker.symbol === tickerData.symbol
                );

                if (existingTicker) {
                    // Update existing ticker
                    let update = await ticker_meta_collection.updateOne(
                        { symbol: tickerData.symbol },
                        { $set: tickerData }
                    );
                    status.push(update)
                } else {
                    // Check if the market_cap_rank exists in the collection
                    const existingTickerByRank = collection.find(
                        (ticker) => ticker.market_cap_rank === tickerData.market_cap_rank
                    );

                    if (existingTickerByRank) {
                        // Replace the document with the same market_cap_rank
                        let replace = await ticker_meta_collection.replaceOne(
                            { market_cap_rank: tickerData.market_cap_rank },
                            tickerData
                        );
                        status.push(replace);
                    } else {
                        // Insert new ticker
                        let insert = await ticker_meta_collection.insertOne(tickerData);
                        status.push(insert);
                    }
                }
            }
            return status
        } else {
            console.time("market fullcap")
            let cryptoData = await fetchTopTickerByMarketCap({ length })
            console.timeEnd("market fullcap")

            const insertedResult = await ticker_meta_collection.insertMany(cryptoData)
            return insertedResult
        }
    } catch (err) {
        console.log("Err : ", err)
        throw err
    }
}

// Fetches the top tickers from DB based on length: crypticsage/binance-ticker-meta
// INPUT : length - number of tickers to fetch : { length: 10 } or { length: "max" }
// OUTPUT : Array of tickers
/* 
[
    {
        "id": "1182",
        "symbol": "BTC",
        "name": "Bitcoin",
        "max_supply": 20999999.9769,
        "asset_launch_date": "2009-01-03",
        "image_url": "https://www.cryptocompare.com/media/37746251/btc.png",
        "market_cap_rank": 1
    },
    {
        "id": "7605",
        "symbol": "ETH",
        "name": "Ethereum",
        "max_supply": -1,
        "asset_launch_date": "2015-07-30",
        "image_url": "https://www.cryptocompare.com/media/37746238/eth.png",
        "market_cap_rank": 2
    }
]
*/
const fetchTickerMetaFromDb = async ({ length }) => {
    try {
        if (length === undefined || length === null || length === 'max' || length === 0 || length === '') {
            length = 1000
        }
        const db = await connect("Ticker meta fetch and save")
        const projectionFields = {
            _id: 0,
            market_cap_rank: 1,
            id: 1,
            symbol: 1,
            name: 1,
            image_url: 1,
            max_supply: 1,
            asset_launch_date: 1,
        };
        const ticker_meta_collection = db.collection("binance_ticker_meta")
        const tickerMeta = await ticker_meta_collection.aggregate([
            { $project: projectionFields },
            { $limit: length },
        ]).toArray()
        return tickerMeta
    } catch (err) {
        console.log("Err : ", err)
        throw err
    }
}

// Fetches the price data from CryptoCompare and Binance in parallel
// INPUT : fsym - from symbol : BTC,ETH : string 
//         tsyms - to symbols : USD,AUD,NZD,CAD,EUR,JPY : string
// OUTPUT : finalPriceData - price data from CryptoCompare
//          ress - exchange info Binance
const fetchDataFromUrls = async ({ fsym, tsyms }) => {
    const priceDataUrl = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${fsym}&tsyms=${tsyms}`
    const binanceURL = "https://api.binance.com/api/v3/exchangeInfo"

    // const promiseOne = axios.get(tokenDataURL)
    const promiseTwo = axios.get(priceDataUrl)
    const promiseThree = axios.get(binanceURL)

    return Promise.all([promiseTwo, promiseThree])
        .then((responses) => {
            const [priceDataResponse, binanceResponse] = responses
            const finalPriceData = priceDataResponse.data.RAW
            const ress = binanceResponse.data.symbols
            return { finalPriceData, ress }
        })
        .catch((err) => {
            console.log("Error in Fetching", err)
            throw err
        })
}

// formats the time in milliseconds to human readable format
// INPUT : milliseconds
// OUTPUT : formatted time
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

// generates the required object for the Stocks table data
// INPUT : symbol - symbol of the token : string
//         param - price data from CryptoCompare : object
// OUTPUT : tokenData - required object for the Stocks table data
const generateYFObject = (symbol, param) => {
    let tokenData = {}
    tokenData["symbol"] = symbol
    tokenData["open"] = param.summaryDetail?.open.raw || "N/A"
    tokenData["high"] = param.summaryDetail?.dayHigh.raw || "N/A"
    tokenData["low"] = param.summaryDetail?.dayLow.raw || "N/A"
    tokenData["divident_rate"] = param.summaryDetail?.dividendRate.raw || "N/A"
    tokenData["divident_yield"] = param.summaryDetail?.dividendYield.raw || "N/A"
    tokenData["five_year_avg_dividend_yield"] = param.summaryDetail?.fiveYearAvgDividendYield.raw || "N/A"
    tokenData["market_cap"] = param.summaryDetail?.marketCap.raw || "N/A"
    tokenData["fiftyTwoWeekLow"] = param.summaryDetail?.fiftyTwoWeekLow.raw || "N/A"
    tokenData["fiftyTwoWeekHigh"] = param.summaryDetail?.fiftyTwoWeekHigh.raw || "N/A"
    tokenData["enterpriseValue"] = param.defaultKeyStatistics?.enterpriseValue.raw || "N/A"
    tokenData["pegRatio"] = param.defaultKeyStatistics?.pegRatio.raw || "N/A"
    tokenData["currentQuarterEstimate"] = param.earnings?.earningsChart.currentQuarterEstimate.raw || "N/A"
    tokenData["financial_chart"] = param.earnings?.financialsChart.yearly || "N/A"
    tokenData["short_name"] = param.price?.shortName || "N/A"
    tokenData["total_cash"] = param.financialData?.totalCash.raw || "N/A"
    tokenData["ebitda"] = param.financialData?.ebitda.raw || "N/A"
    tokenData["total_debt"] = param.financialData?.totalDebt.raw || "N/A"
    tokenData["total_revenue"] = param.financialData?.totalRevenue.raw || "N/A"
    tokenData["debt_to_equity"] = param.financialData?.debtToEquity.raw || "N/A"
    tokenData["gross_profit"] = param.financialData?.grossProfits.raw || "N/A"
    tokenData["free_cashflow"] = param.financialData?.freeCashflow.raw || "N/A"
    tokenData["operating_cashflow"] = param.financialData?.operatingCashflow.raw || "N/A"
    tokenData["rev_growth"] = param.financialData?.revenueGrowth.raw || "N/A"
    return tokenData
}

// Fetches the quotes for the given symbols
// INPUT : symbols - array of symbols
// OUTPUT : finalData - array of objects containing the quotes for the given symbols
const getYfinanceQuotes = async (symbols) => {
    console.log("Fetching quotes for ", symbols)
    let summaryDetail
    const baseYFUrl = "https://query1.finance.yahoo.com/v6/finance/quoteSummary/"
    const modules = ['price', 'summaryDetail', 'earnings', 'defaultKeyStatistics', 'financialData']
    const key = modules.map(module => `modules=${module}`).join('&');
    let finalData = []
    for (const item in symbols) {
        let symbol = symbols[item]
        const finalUrl = `${baseYFUrl}${symbol}?${key}`
        try {
            const result = await axios.get(finalUrl)
            summaryDetail = result.data.quoteSummary.result[0]
            let transformedData = generateYFObject(symbol, summaryDetail)
            finalData.push(transformedData)
        } catch (err) {
            console.log(err)
            throw err
        }
    }
    return finalData
}

const checkTickerMetaDuplicateData = async ({ ticker_name }) => {
    try {
        const db = await connect("checking duplicate data")
        const testColl = await db.listCollections().toArray()
        const collection = db.collection(`binance_ticker_meta`)
        const pipeline = [
            {
                $group: {
                    _id: "$market_cap_rank",
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
        close("checking duplicate data")
    }
}

function validateParameters(params) {
    let { asset_type, ticker_name, period, page_no, items_per_page } = params
    // Check if any parameter is null or empty
    if (!asset_type || !ticker_name || !period || !page_no) {
        throw new Error("Invalid input. Check parameters and try again.");
    }

    // Check for valid asset_type
    if (asset_type !== "crypto" && asset_type !== "stocks") {
        throw new Error("Invalid asset type. Possible values: crypto, stocks");
    }

    // Check for valid period based on asset_type
    const cryptoPeriods = ["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w"];
    const stocksPeriods = ["1d", "1wk", "1mo"];

    if (asset_type === "crypto" && !cryptoPeriods.includes(period)) {
        throw new Error("Invalid period for crypto asset type.");
    }

    if (asset_type === "stocks" && !stocksPeriods.includes(period)) {
        throw new Error("Invalid period for stocks asset type.");
    }

    // Check for valid page_no (positive number)
    if (isNaN(page_no) || page_no <= 0) {
        throw new Error("Invalid page no. Page no must be a positive number.");
    }

    let default_pg_length = 80
    if (isNaN(items_per_page) || items_per_page < 80) {
        items_per_page = default_pg_length
    }

    let payload = {
        asset_type,
        ticker_name,
        period,
        page_no,
        items_per_page
    }

    // All parameters are valid, return true or perform further processing
    return [true, payload];
}

const fetchTokenData = async (params) => {
    const [isValidated, payload] = validateParameters(params);
    const { asset_type, ticker_name, period, page_no, items_per_page } = payload

    const asset_class_db = {
        "crypto": "binance",
        "stocks": "yFinance_new"
    }

    if (isValidated) {
        if (asset_type === "crypto" && (period === "2h" || period === "1h" || period === "30m" || period === "15m" || period === "5m" || period === "3m" || period === "1m")) {
            console.log(`Fetching data for ${ticker_name} with period ${period} from binance_historical`)
            try {
                const db = await binanceConnect("Fetching binance token data form binance_historical")
                const sortQuery = { openTime: -1 }
                const collection = db.collection(`${ticker_name}`)
                // Calculate the number of documents to skip based on the page number and items per page
                const skip = (page_no - 1) * items_per_page;
                console.time('fetching data from binance_historical')
                const tokenData = await collection.find({}).sort(sortQuery).skip(skip).limit(items_per_page).toArray();
                console.timeEnd('fetching data from binance_historical')
                let finalResult = []

                if (tokenData.length > 0) {
                    let output = {}
                    console.time('Adding date to token data - binance_historical')
                    tokenData.reverse()
                    tokenData.map((data) => {
                        let obj = {
                            date: new Date(data.openTime).toLocaleString(),
                            openTime: data.openTime,
                            open: data.open,
                            high: data.high,
                            low: data.low,
                            close: data.close,
                            volume: data.volume,
                        }
                        finalResult.push(obj)
                    })
                    console.timeEnd('Adding date to token data - binance_historical')

                    output['ticker_name'] = ticker_name
                    output['period'] = period
                    output['page_no'] = page_no
                    output['items_per_page'] = items_per_page
                    output['start_date'] = finalResult.slice(-1)[0].date
                    output['end_date'] = finalResult[0].date
                    output['total_count'] = finalResult.length
                    output['ticker_data'] = finalResult

                    return output
                } else {
                    return ["No data found in binance_historical"]
                }
            } catch (err) {
                console.log(err)
                throw err
            } finally {
                binanceClose("Fetching binance token data form binance_historical")
            }
        } else {
            const dataSource = asset_class_db[asset_type]
            console.log(`Fetching data for ${ticker_name} with period ${period} from crypticsage/${dataSource}`)
            try {
                const db = await connect("fetch token data");
                const tokenDataCollection = db.collection(`${dataSource}`);
                // Calculate the skip value based on the page number
                // const itemsPerPage = 10;
                const skip = (page_no - 1) * items_per_page;

                console.time('Fetch token data - crypticsage/binance')
                const tokenData = await tokenDataCollection.aggregate([
                    { $match: { ticker_name: ticker_name } },
                    { $project: { _id: 0, [`data.${period}.historical`]: 1 } },
                    { $unwind: `$data.${period}.historical` },
                    { $sort: { [`data.${period}.historical.openTime`]: -1 } },
                    { $skip: skip },
                    { $limit: items_per_page },
                    {
                        $project: {
                            openTime: `$data.${period}.historical.openTime`,
                            open: `$data.${period}.historical.open`,
                            high: `$data.${period}.historical.high`,
                            low: `$data.${period}.historical.low`,
                            close: `$data.${period}.historical.close`,
                            volume: `$data.${period}.historical.volume`,
                        },
                    },
                ]).toArray();
                console.timeEnd('Fetch token data - crypticsage/binance')

                if (tokenData.length > 0) {
                    let output = {}
                    console.time('Adding date - crypticsage/binance')
                    tokenData.reverse()
                    let converted = tokenData.map((item) => {
                        return {
                            date: new Date(item?.openTime).toLocaleString(),
                            ...item,
                        }
                    })
                    console.timeEnd('Adding date - crypticsage/binance')

                    output['ticker_name'] = ticker_name
                    output['period'] = period
                    output['page_no'] = page_no
                    output['items_per_page'] = items_per_page
                    output['start_date'] = converted.slice(-1)[0].date
                    output['end_date'] = converted[0].date
                    output['total_count'] = converted.length
                    output['ticker_data'] = converted

                    return output
                } else {
                    return ['No data found in crypticsage/binance']
                }
            } catch (err) {
                console.log(err)
                throw err
            } finally {
                close("fetch token data");
            }
        }
    }
}

// < - - - - - - - - - - Helper Functions - - - - - - - - - - >

module.exports = {
    fetchTopTickerByMarketCap,
    fetchAndSaveLatestTickerMetaDataToDb,
    fetchTickerMetaFromDb,
    fetchDataFromUrls,
    formatMillisecond,
    periodToMilliseconds,
    getYfinanceQuotes,
    checkTickerMetaDuplicateData,
    fetchTokenData
}
