const express = require('express')
const router = express.Router()

const CSController = require('../controllers/cryptoStocksController')

router.post('/update_ticker_meta', CSController.FASLatestTickerMetaData)
router.post('/delete_ticker_meta', CSController.deleteTickerMeta)

router.post('/getCryptoData', CSController.getCryptoDataByMarketCap)
router.post('/getHistoricalData', CSController.getLatestTickerData) //change name to getRecentChartData
router.post('/get-latest-crypto-data', CSController.getLatestCryptoData)
router.post('/get-latest-stocks-data', CSController.getLatestStocksData)

router.post('/fetch_token_data', CSController.fetchTickerDataFromDB)

router.post('/testing', CSController.test)

module.exports = router