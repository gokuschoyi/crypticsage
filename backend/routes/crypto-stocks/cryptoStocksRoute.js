const express = require('express')
const router = express.Router()

const CSController = require('../../controllers/crypto-stocks-controller')

router.post('/getCryptoData', CSController.getCryptoData)
router.post('/getHistoricalData', CSController.getHistoricalData) //change name to getRecentChartData
router.post('/get-latest-crypto-data', CSController.getLatestCryptoData)
router.post('/get-latest-stocks-data', CSController.getLatestStocksData)

module.exports = router