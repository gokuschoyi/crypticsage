const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))
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
    } catch (error) {
        log.error(error.stack)
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
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: "Get Historical Data request error" })
    }
}

// Fetches the latest price data from CryptoCompare and Binance : Ticker table on the frontend
const getLatestCryptoData = async (req, res) => {
    try {
        const [cryptoData, formattedTime] = await CSServices.processGetLatestCryptoData()
        res.status(200).json({ message: "Get Latest Token Data request success", cryptoData, formattedTime });
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: "Get Latest Token Data request error" })
    }
}

// Fetches the latest price data from Yahoo Finance : Stocks table on the frontend
const getLatestStocksData = async (req, res) => {
    try {
        // '','GOOG','MSFT','IBM','AMZN','ORCL','INTC','QCOM','CSCO','SAP','TSM','BIDU','EMC','HPQ','TXN','ERIC','ASML','YHOO'
        // '',GOOGL,MSFT,IBM,AMZN,ORCL,INTC,QCOM,CSCO,SAP,TSM,BIDU,EMC,HPQ,TXN,ERIC,ASML,YHOO
        // AAPL,TSLA,GOOGL,MSFT,TSMC,ORCL,AMZN
        const collection_name = 'yfinance_metadata'
        const symbolsInDb = await MDBServices.getFirstObjectForEachPeriod(collection_name)
        let yFSymbols = symbolsInDb.map((symbol) => symbol.ticker_name)
        /* const yFSymbols = ['AAPL', 'GOOG', 'MSFT']
         */
        let yFData = await CSUtil.getYFinanceShortSummary(yFSymbols)
        res.status(200).json({ message: "Get Latest Stocks Data request success", yFData });
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: "Get Latest Stocks Data request error" })
    }
}

const getStockSummaryDetails = async (req, res) => {
    const { symbol } = req.body
    try {
        const stockSummaryDetails = await CSUtil.getYFinanceFullSummary(symbol)
        res.status(200).json({ message: "Get Stock Summary Details request success", stockSummaryDetails });
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: "Get Stock Summary Details request error", error: error.message })
    }
}

const fetchTickerDataFromDB = async (req, res) => {
    try {
        const params = req.body
        const [isValidated, payload] = Validator.validateFetchTickerDataInput({ params })
        if (isValidated) {
            // @ts-ignore
            const { asset_type, ticker_name, period, page_no, items_per_page } = payload
            const new_fetch_offset = params.new_fetch_offset || undefined
            const uid = res.locals.data.uid
            const fetchedResults = await MDBServices.fetchTickerHistDataFromDb(uid, asset_type, ticker_name, period, page_no, items_per_page, new_fetch_offset)
            res.status(200).json({ message: "Token Data fetched successfully", fetchedResults })
        }
    }
    catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: "Something went wrong", error: error.message })
    }

}

// < - - - - - - - - - - Route Functions - - - - - - - - - - >


module.exports = {
    getCryptoDataByMarketCap,
    getLatestTickerData,
    getLatestCryptoData,
    getLatestStocksData,
    getStockSummaryDetails,
    fetchTickerDataFromDB,
}