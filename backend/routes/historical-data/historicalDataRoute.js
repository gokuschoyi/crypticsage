const express = require('express')
const router = express.Router()

const HDYFController = require('../../controllers/historical-yf-controller')
const HDBController = require('../../controllers/historical-binance-controller')

const BUtil = require('../../utils/historical_data/binance_util')

router.post('/save_initial_yfinance_data', HDYFController.initialSaveHistoricalDataYFinance)
router.post('/update_historical_yFinance_data', HDYFController.updateHistoricalYFinanceData)

router.post('/save_binance_data', HDBController.initialSaveHistoricalDataBinance)
router.post('/update_historical_binance_data', HDBController.updateBinanceData)

router.post('/save_binance_data_one_min', HDBController.initialSaveHistoricalDataBinanceOneM)
router.post('/update_historical_binance_data_one_min', HDBController.updateBinanceOneMData)

router.post('/get_completition_status', HDBController.checkJobCompletition)

router.post('/test_B_fetch', BUtil.getData)
router.post('/get_duration', BUtil.fetchDeatilsForBinanceTokens)

module.exports = router