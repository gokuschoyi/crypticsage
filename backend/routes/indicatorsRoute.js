const express = require('express')
const router = express.Router()
const { handleTokenRedisStorage } = require('../utils/redis_util')
const IController = require('../controllers/indicatorsController')
const MDBServices = require('../services/mongoDBServices')

router.post('/get_talib_desc', IController.getIndicatorDesc)
router.post('/execute_talib_function', handleTokenRedisStorage, IController.executeTalibFunction)

router.post('/start_model_training', IController.procssModelTraining)

const checkDuplicates = async (req, res, next) => {
    const { ticker_name, period } = req.body;
    const [deleteduplicateResult, updatedResult, latestDocumentCount] = await MDBServices.checkForDuplicateDocumentsInHistory(ticker_name, period)
    if (deleteduplicateResult) {
        // @ts-ignore
        let length = deleteduplicateResult.length
        res.status(200).json({ message: 'Duplicate data found', length, data: deleteduplicateResult, updatedResult, latestDocumentCount })
    } else {
        res.status(200).json({ message: 'No duplicate data found', data: deleteduplicateResult })
    }
}

router.post('/check_duplicates', checkDuplicates)


module.exports = router