const axios = require('axios');
const CSUtil = require('../utils/crypto/crypto-stocks-util');

// < - - - - - - - - - - Route Functions - - - - - - - - - - >

// Entry point to fetch and save the latest ticker meta data to DB
const FASLatestTickerMetaData = async (req, res) => {
    const { length } = req.body
    try {
        let result = await CSUtil.fetchAndSaveLatestTickerMetaDataToDb({ length })
        res.status(200).json({ message: "Get Crypto Data request success", result });
    } catch (err) {
        console.log("ERROR : ", err);
        res.status(400).json({ message: "Get Crypto Data request error" })
    }
}

// Fetches the top tickers by market cap from DB : Slider box on the frontend
const getCryptoDataByMarketCap = async (req, res) => {
    try {
        var filteredCryptoData = await CSUtil.fetchTopTickerByMarketCap({ length: 20 })
        res.status(200).json({ message: "Get Crypto Data request success", cryptoData: filteredCryptoData });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: "Get Crypto Data request error" })
    }
}

// Fetches the historical data from CryptoCompare(OHLCV) : Ticker chart on the frontend
const getLatestTickerData = async (req, res) => {
    const { tokenName, timeFrame } = req.body;
    let limit = 700;
    try {
        let url = `https://min-api.cryptocompare.com/data/v2/histo${timeFrame}?fsym=${tokenName}&tsym=USD&limit=${limit}`
        const historicalData = await axios.get(url)
        res.status(200).json({ message: "Get Historical Data request success", url, historicalData: historicalData.data });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: "Get Historical Data request error" })
    }
}

// Fetches the latest price data from CryptoCompare and Binance : Ticker table on the frontend
const getLatestCryptoData = async (req, res) => {
    try {
        let sTime = performance.now()

        console.time("Fetching ticker meta from db")
        let cryptoData = await CSUtil.fetchTickerMetaFromDb({ length: "max" })
        console.timeEnd("Fetching ticker meta from db")

        console.time("Promise All")
        const symbolKeys = cryptoData.map(item => item.symbol)
        const fsym = symbolKeys.join(',')
        const tsyms = 'USD,AUD,NZD,CAD,EUR,JPY'
        const { finalPriceData, ress } = await CSUtil.fetchDataFromUrls({ fsym, tsyms })
        const combinedData = cryptoData.map(item => {
            const symbol = item.symbol;
            const prices = {}
            const priceDataForToken = finalPriceData[symbol]
            for (const [key, value] of Object.entries(priceDataForToken)) {
                let fdMKCap = item.max_supply * value.PRICE
                prices[key] = {
                    "market_cap": value.MKTCAP,
                    "fd_market_cap": fdMKCap > 0 ? fdMKCap : value.MKTCAP,
                    "current_price": value.PRICE,
                    "supply": value.SUPPLY,
                    "last_updated": value.LASTUPDATE,
                    "median": value.MEDIAN,
                    "change_24_hrs": value.CHANGE24HOUR,
                    "change_percentage_24_hrs": value.CHANGEPCT24HOUR,
                    "change_day": value.CHANGEDAY,
                    "change_percentage_day": value.CHANGEPCTDAY,
                    "high_24h": value.HIGH24HOUR,
                    "low_24h": value.LOW24HOUR,
                }
            }
            return {
                ...item,
                prices
            }
        })

        let finalResult = combinedData.map((item) => {
            const matchingSymbol = ress.find(
                (secondItem) => secondItem.baseAsset === item.symbol
            );
            return {
                ...item,
                matchedSymbol: matchingSymbol ? matchingSymbol.symbol : null,
            };
        })

        cryptoData = finalResult
        let eTime = performance.now()
        const formattedTime = CSUtil.formatMillisecond(eTime - sTime)
        console.timeEnd("Promise All")
        res.status(200).json({ message: "Get Latest Token Data request success", cryptoData, formattedTime });

    } catch (err) {
        console.log(err);
        res.status(400).json({ message: "Get Latest Token Data request error" })
    }
}

// Fetches the latest price data from Yahoo Finance : Stocks table on the frontend
const getLatestStocksData = async (req, res) => {
    try {
        // 'AAPL','GOOG','MSFT','IBM','AMZN','ORCL','INTC','QCOM','CSCO','SAP','TSM','BIDU','EMC','HPQ','TXN','ERIC','ASML','YHOO'
        const yFSymbols = ['AAPL', 'GOOG', 'MSFT']
        let yFData = await CSUtil.getYfinanceQuotes(yFSymbols)
        res.status(200).json({ message: "Get Latest Stocks Data request success", yFData });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: "Get Latest Stocks Data request error" })
    }
}

const fetchTickerDataFromDB = async (req, res) => {
    const { asset_type, ticker_name, period, page_no, items_per_page } = req.body
    let tResult
    try {
        tResult = await CSUtil.fetchTokenData({asset_type, ticker_name, period, page_no, items_per_page})
        res.status(200).json({ message: "Token Data fetched successfully, Test", tResult })
    } catch (err) {
        console.log(err.message)
        res.status(400).json({ message: "Something went wrong", error: err.message })
    }

}

// < - - - - - - - - - - Route Functions - - - - - - - - - - >



const test = async (req, res) => {
    const { ticker_name } = req.body
    const tsyms = 'USD,AUD,NZD,CAD,EUR,JPY'
    const fsym = 'BTC,ETH'
    // let result = await CSUtil.fetchDataFromUrls({ fsym, tsyms })
    // let result = await CSUtil.fetchAndSaveLatestTickerMetaDataToDb({ length: 28 })
    // let result = await CSUtil.fetchTopTickerByMarketCap({ length: 12 })
    // let cryptoData = await fetchTickerMetaFromDb({ length: 12 })
    const checkForDupli = await CSUtil.checkTickerMetaDuplicateData({ ticker_name })

    res.status(200).json({ message: "Get Latest Token Data request success", checkForDupli });
}

module.exports = {
    FASLatestTickerMetaData,
    getCryptoDataByMarketCap,
    getLatestTickerData,
    getLatestCryptoData,
    getLatestStocksData,
    fetchTickerDataFromDB,
    test
}