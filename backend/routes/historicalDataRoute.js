const express = require('express')
const router = express.Router()

const HDController = require('../controllers/historicalDataController')
const BUtil = require('../utils/historicalDataUtil')

router.post('/save_initial_yfinance_data', HDController.initialSaveHistoricalDataYFinance)
router.post('/update_historical_yFinance_data', HDController.updateHistoricalYFinanceData)

router.post('/save_binance_data', HDController.initialSaveHistoricalDataBinance)
router.post('/update_historical_binance_data', HDController.updateBinanceData)

router.post('/save_binance_data_one_min', HDController.initialSaveHistoricalDataBinanceOneM)
router.post('/update_historical_binance_data_one_min', HDController.updateBinanceOneMData)

router.post('/get_completition_status', HDController.checkJobCompletition)

router.post('/get_duration', BUtil.fetchDeatilsForBinanceTokens)

module.exports = router