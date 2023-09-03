const express = require('express')
const router = express.Router()

const MDBServices = require('../services/mongoDBServices')
const CMServices = require('../services/contentManagerServices')
const HDUtil = require('../utils/historicalDataUtil')
const HDServices = require('../services/historicalDataServices')
const CSUtil = require('../utils/cryptoStocksUtil')

const CSController = require('../controllers/cryptoStocksController')

router.post('/getCryptoData', CSController.getCryptoDataByMarketCap)
router.post('/getHistoricalData', CSController.getLatestTickerData) //change name to getRecentChartData
router.post('/get-latest-crypto-data', CSController.getLatestCryptoData)
router.post('/get-latest-stocks-data', CSController.getLatestStocksData)

router.post('/fetch_token_data', CSController.fetchTickerDataFromDB) // converted

const process = async (req, res) => {
    try {
        const { openTime, period } = req.body
        // let [inserted, updateMeta] = await MDBServices.insertHistoricalDataToDb({ type, ticker_name, period, token_data })
        // let fObjs = await MDBServices.getFirstObjectForEachPeriod({ collection_name: 'binance_metadata' })
        // let test = await HDServices.processUpdateHistoricalYFinanceData({ symbol: ticker_name })
        // let periods = ["1m", "4h", "6h", "8h", "12h", "1d", "3d", "1w"]
        // let token_count = 10
        // let test = await HDUtil.generateUpdateQueriesForBinanceTickers()
        // let insert = await MDBServices.saveOrUpdateTickerMeta({ cryptoData })
        // let test = await CSUtil.fetchTopTickerByMarketCap({ length: 5 })
        /* let fObjs = await MDBServices.getFirstObjectForEachPeriod({ collection_name: 'yfinance_metadata' })

        const tickersList = ["AAPL", "TSLA", "AMZN", "GOOGL"]
        let tickers = tickersList.filter((ticker) => {
            return !fObjs.some((obj) => obj.ticker_name === ticker)
        }) */
        let test = HDUtil.calculateUpdateTickerEndDate({openTime, period})
        res.status(200).json({ message: "Get Latest Stocks Data request success", test });
    } catch (error) {
        console.log(error.stack)
        res.status(400).json({ message: "Get Latest Stocks Data request error" })
    }
}

router.post('/testing', process)

module.exports = router