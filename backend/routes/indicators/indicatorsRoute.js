const express = require('express')
const router = express.Router()
const { handleTokenRedisStorage } = require('../../utils/redis_util')
const IController = require('../../controllers/indicator-controller')

router.post('/fetchTokenData', IController.getTokenData)
router.post('/get-sma', handleTokenRedisStorage, IController.calculateSMA)
router.post('/get-new-sma', handleTokenRedisStorage, IController.calculateNewSMA)


/* router.post('/get-ema', IController.handleTokenRedisStorage, IController.calculateEMA)
router.post('/get-bollinger-bands', IController.handleTokenRedisStorage, IController.calculateBollingerBands)
router.post('/get-ichimoku-cloud', IController.handleTokenRedisStorage, IController.calculateIchimokuCloud)
router.post('/get-rsi', IController.handleTokenRedisStorage, IController.calculateRSI)
router.post('/get-macd', IController.handleTokenRedisStorage, IController.calculateMACD)
router.post('/get-atr', IController.handleTokenRedisStorage, IController.calculateATR)
 */

module.exports = router