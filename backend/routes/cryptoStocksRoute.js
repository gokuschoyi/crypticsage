/**
 * Route for Crypto & Stocks related endpoints.
 * @module route/crypto
 */

const express = require('express')
const router = express.Router()

const MDBServices = require('../services/mongoDBServices')
const CMServices = require('../services/contentManagerServices')
const HDUtil = require('../utils/historicalDataUtil')
const HDServices = require('../services/historicalDataServices')
const CSUtil = require('../utils/cryptoStocksUtil')

const CSController = require('../controllers/cryptoStocksController')

/**
 * Endpoint to fetch the crypto ticker meta from the DB.
 * @name /getCryptoData
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /crypto/getCryptoData
 * @code {200} Get Binance Ticker Meta Data request success
 * @code {400} Error response
 * @response {string} message - Get Binance Ticker Meta Data request success
 * @response {array} cryptoData - List of available tickers with some metadata from the DB.
 */
router.post('/getCryptoData', CSController.getBinanceTicker_meta)

/**
 * Endpoint to to fetch the latest crypto ticker chart data from cryptocompare api
 * @name /getHistoricalData
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /crypto/getHistoricalData
 * @body {string} tokenName - The ticker name of the token
 * @body {string} timeFrame - The time frame of the data to be fetched
 * @code {200} Get Historical Data request success
 * @code {400} Error response
 * @response {string} message - Get Historical Data request success
 * @response {object} historicalData - List of available tickers with some metadata from the DB.
 * @response {string} url - The url from where the data was fetched.
 */
router.post('/getHistoricalData', CSController.getLatestTickerData) //change name to getRecentChartData

/**
 * Endpoint to fetch the crypto ticker metadata from the DB for table info.
 * @name /getLatestCryptoData
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /crypto/get-latest-crypto-data
 * @code {200} Get Latest Token Data request success
 * @code {400} Error response
 * @response {string} message - Get Latest Token Data request success
 * @response {string} formattedTime - Time taken to fetch the data.
 * @response {array} cryptoData - List of available crypto tickers with metadata from the DB.
 */
router.post('/get-latest-crypto-data', CSController.getLatestCryptoData)

/**
 * Endpoint to fetch the stock ticker metadata from the DB for table info.
 * @name /getLatestStocksData
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /crypto/get-latest-stocks-data
 * @code {200} Get Latest Stocks Data request success
 * @code {400} Error response
 * @response {string} message - Get Latest Stocks Data request success
 * @response {array} yFData - List of available stock tickers with metadata from the DB.
 */
router.post('/get-latest-stocks-data', CSController.getLatestStocksData)

/**
 * Endpoint to fetch the individual stock summary for a YF Ticker.
 * @name /getStockSummaryDetails
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /crypto/get-stock-summary-details
 * @body {string} symbol - The ticker name of the stock
 * @code {200} Get Stock Summary Details request success
 * @code {400} Error response
 * @response {string} message - Get Stock Summary Details request success
 * @response {object} stockSummaryDetails - Various keys with the stock summary results.
 */
router.post('/get-stock-summary-details', CSController.getStockSummaryDetails)

/**
 * Endpoint to fetch the individual stock summary for a YF Ticker.
 * @name /fetchSingleTickerInfo
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /crypto/fetch_single_ticker_info
 * @body {string} symbol - The ticker name of the crypto
 * @code {200} Single Ticker Info fetched successfully
 * @code {400} Error response
 * @response {string} message - Single Ticker Info fetched successfully
 * @response {object} data - Various keys with the crypto summary results.
 */
router.post('/fetch_single_ticker_info', CSController.fetchSingleTickerInfo)


const ticker_hist_middleware = async (req, res, next) => {
    const { asset_type, ticker_name, period } = req.body
    try {
        await MDBServices.fetchEntireHistDataFromDb({ type: asset_type, ticker_name, period, return_result_: false })
    } catch (error) {
        console.log(error.stack)
        throw error
    }
    next()
}

/**
 * Endpoint to fetch the ohlcv data to be plotted on chart.
 * @name /fetchTokenData
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /crypto/fetch_token_data
 * @body {string} asset_type - The type of asset (crypto/stock)
 * @body {number} items_per_page - The number of items per page
 * @body {number} page_no - The page number 
 * @body {string} period - The period of the data to be fetched 
 * @body {string} ticker_name - The ticker name of the crypto 
 * @code {200} Token Data fetched successfully
 * @code {400} Error response
 * @response {string} message - Token Data fetched successfully
 * @response {object} fetchedResults - Object containing the fetched data.
 */
router.post('/fetch_token_data', ticker_hist_middleware, CSController.fetchTickerDataFromDB) // converted

router.post('/fetch_bin_from_yf', CSController.fetchSingleInfoFromYFianance) // testing

const process = async (req, res) => {
    try {
        const { openTime, period } = req.body
        // let test = await HDServices.processUpdateHistoricalYFinanceData({ symbol: ticker_name })
        // let periods = ["1m", "4h", "6h", "8h", "12h", "1d", "3d", "1w"]
        // let token_count = 10
        // let test = await HDUtil.generateUpdateQueriesForBinanceTickers()
        // let test = await CSUtil.fetchTopTickerByMarketCap({ length: 5 })
        /* 

        const tickersList = ["AAPL", "TSLA", "AMZN", "GOOGL"]
        let tickers = tickersList.filter((ticker) => {
            return !fObjs.some((obj) => obj.ticker_name === ticker)
        }) */
        // let test = HDUtil.calculateUpdateTickerEndDate({ openTime, period })
        let test = await CSUtil.yFinance_metaData_updater()
        res.status(200).json({ message: "Get Latest Stocks Data request success", test });
    } catch (error) {
        console.log(error.stack)
        res.status(400).json({ message: "Get Latest Stocks Data request error" })
    }
}

router.post('/testing', process)

module.exports = router