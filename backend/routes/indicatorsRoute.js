const express = require('express')
const router = express.Router()
const { handleTokenRedisStorage } = require('../utils/redis_util')
const IController = require('../controllers/indicatorsController')

router.post('/get_talib_desc', IController.getIndicatorDesc)
router.post('/execute_talib_function', handleTokenRedisStorage, IController.executeTalibFunction)
router.post('/get-sma', handleTokenRedisStorage, IController.calculateSMA)

router.post('/start_model_training', IController.startModelTraining)

module.exports = router