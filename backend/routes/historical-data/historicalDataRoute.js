const express = require('express')
const router = express.Router()

const HDYFController = require('../../controllers/historical-yf-controller')
const HDBController = require('../../controllers/historical-binance-controller')

router.post('/save_initial_yfinance_data', HDYFController.initialSaveHistoricalDataYFinance)
router.post('/update_historical_yFinance_data', HDYFController.updateHistoricalYFinanceData)

router.post('/save_binance_data', HDBController.initialSaveHistoricalDataBinance)
router.post('/get_completition_status', HDBController.checkJobCompletition)

module.exports = router