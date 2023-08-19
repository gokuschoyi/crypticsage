const CSServices = require('../services/cryptoStocksServices')
const CSUtil = require('../utils/cryptoStocksUtil');
const Validator = require('../utils/validator')
const MDBServices = require('../services/mongoDBServices')

// < - - - - - - - - - - Route Functions - - - - - - - - - - >

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
        let [data, url] = await CSUtil.getLatestOHLCForTicker({ timeFrame, tokenName, limit })
        res.status(200).json({ message: "Get Historical Data request success", url, historicalData: data });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: "Get Historical Data request error" })
    }
}

// Fetches the latest price data from CryptoCompare and Binance : Ticker table on the frontend
const getLatestCryptoData = async (req, res) => {
    try {
        const [cryptoData, formattedTime] = await CSServices.processGetLatestCryptoData()
        res.status(200).json({ message: "Get Latest Token Data request success", cryptoData, formattedTime });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: "Get Latest Token Data request error" })
    }
}

// Fetches the latest price data from Yahoo Finance : Stocks table on the frontend
const getLatestStocksData = async (req, res) => {
    try {
        // '','GOOG','MSFT','IBM','AMZN','ORCL','INTC','QCOM','CSCO','SAP','TSM','BIDU','EMC','HPQ','TXN','ERIC','ASML','YHOO'
        // '',GOOGL,MSFT,IBM,AMZN,ORCL,INTC,QCOM,CSCO,SAP,TSM,BIDU,EMC,HPQ,TXN,ERIC,ASML,YHOO
        // AAPL,TSLA,GOOGL,MSFT,TSMC,ORCL,AMZN
        const symbolsInDb = await MDBServices.getFirstObjectForEachPeriod({ collection_name: 'yFinance_new' })
        let yFSymbols = symbolsInDb.map((symbol) => symbol.ticker_name)
        /* const yFSymbols = ['AAPL', 'GOOG', 'MSFT']
         */
        let yFData = await CSUtil.getYfinanceQuotes(yFSymbols)
        res.status(200).json({ message: "Get Latest Stocks Data request success", yFData });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: "Get Latest Stocks Data request error" })
    }
}

const fetchTickerDataFromDB = async (req, res) => {
    try {
        const params = req.body
        const [isValidated, payload] = Validator.validateFetchTickerDataInput({ params })
        if (isValidated) {
            const { asset_type, ticker_name, period, page_no, items_per_page } = payload
            const fetchedResults = await CSServices.processFetchTickerDataFromDb({ asset_type, ticker_name, period, page_no, items_per_page })
            res.status(200).json({ message: "Token Data fetched successfully", fetchedResults })
        }
    }
    catch (err) {
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
    const checkForDupli = await MDBServices.checkDuplicateData({ ticker_name })

    res.status(200).json({ message: "Get Latest Token Data request success", checkForDupli });
}

module.exports = {
    getCryptoDataByMarketCap,
    getLatestTickerData,
    getLatestCryptoData,
    getLatestStocksData,
    fetchTickerDataFromDB,
    test
}