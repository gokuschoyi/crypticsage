const express = require('express')
const router = express.Router()
const { handleTokenRedisStorage } = require('../utils/redis_util')
const IController = require('../controllers/indicatorsController')

router.post('/get_talib_desc', IController.getIndicatorDesc)
router.post('/get-sma', handleTokenRedisStorage, IController.calculateSMA)

module.exports = router