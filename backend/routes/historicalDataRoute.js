const express = require('express')
const router = express.Router()

const HDController = require('../controllers/historicalDataController')
const BUtil = require('../utils/historicalDataUtil')

router.post('/save_initial_yfinance_data', HDController.initialSaveHistoricalDataYFinance)
router.post('/update_historical_yFinance_data', HDController.updateHistoricalYFinanceData) // converted

router.post('/save_binance_data', HDController.initialSaveHistoricalDataBinance) // converted
router.post('/update_historical_binance_data', HDController.updateBinanceData) // converted

router.post('/get_completition_status', HDController.checkJobCompletition)

module.exports = router