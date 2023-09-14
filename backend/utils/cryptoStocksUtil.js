const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
// const yahooFinance = require('yahoo-finance2').default; // summary quotes not working
const axios = require('axios');
const { connect, close } = require('../services/db-conn')

// < - - - - - - - - - - Helper Functions - - - - - - - - - - >

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
        .catch((error) => {
            let formattedError = JSON.stringify(logger.formatError(error))
            log.error({ message: 'Error in Fetching', error: formattedError })
            throw error
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

        const undefinedRemoved = cryptoData.data.Data.filter((ticker) => {
            // console.log(ticker.RAW?.USD.PRICE)
            return ticker.RAW !== undefined;
        })

        const filteredCryptoData = undefinedRemoved.map((crypto, index) => {
            const { CoinInfo, RAW } = crypto;
            return {
                id: CoinInfo.Id,
                symbol: CoinInfo.Name,
                name: CoinInfo.FullName,
                max_supply: CoinInfo.MaxSupply,
                asset_launch_date: CoinInfo.AssetLaunchDate,
                image_url: `https://www.cryptocompare.com${CoinInfo.ImageUrl}`,
                current_price: RAW.USD.PRICE,
                market_cap_rank: index + 1,
                price_change_24h: RAW.USD.CHANGE24HOUR,
                price_change_percentage_24h: RAW.USD.CHANGEPCT24HOUR,
                last_updated: RAW.USD.LASTUPDATE,
                high_24h: RAW.USD.HIGH24HOUR,
                low_24h: RAW.USD.LOW24HOUR,
            };
        });
        return cryptoData = filteredCryptoData
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error({ message: 'Error CryptoCompare', error: formattedError })
        throw error
    }
}

// Fetches the latest OHLC data for the specified tokenName and timeperiod with limit
const getLatestOHLCForTicker = async ({ timeFrame, tokenName, limit }) => {
    try {
        let url = `https://min-api.cryptocompare.com/data/v2/histo${timeFrame}?fsym=${tokenName}&tsym=USD&limit=${limit}`
        const historicalData = await axios.get(url)
        let data = historicalData.data
        return [data, url]
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// Fetches the quotes for the given symbols
// INPUT : symbols - array of symbols
// OUTPUT : finalData - array of objects containing the quotes for the given symbols
const getYfinanceQuotes = async (symbols) => {
    log.info(`Fetching quotes for : ${symbols}`)
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
        } catch (error) {
            log.error(error.stack)
            throw error
        }
    }
    return finalData
}

// < - - - - - - - - - - Helper Functions - - - - - - - - - - >

module.exports = {
    fetchDataFromUrls
    , formatMillisecond
    , periodToMilliseconds
    , fetchTopTickerByMarketCap
    , getLatestOHLCForTicker
    , getYfinanceQuotes
}
