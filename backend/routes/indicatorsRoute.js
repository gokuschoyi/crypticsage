const express = require('express')
const router = express.Router()
const { handleTokenRedisStorage } = require('../utils/redis_util')
const IController = require('../controllers/indicatorsController')
const MDBServices = require('../services/mongoDBServices')

const tf = require('@tensorflow/tfjs-node');

router.post('/get_talib_desc', IController.getIndicatorDesc)
router.post('/execute_talib_function', handleTokenRedisStorage, IController.executeTalibFunction)

// Test routes
const checkDuplicates = async (req, res, next) => {
    const { ticker_name, period } = req.body;
    const [deleteduplicateResult, updatedResult, latestDocumentCount] = await MDBServices.checkForDuplicateDocumentsInHistory(ticker_name, period)
    if (deleteduplicateResult) {
        // @ts-ignore
        let length = deleteduplicateResult.length
        let prevLength = length + latestDocumentCount
        res.status(200).json({ message: 'Duplicate data found', length, latestDocumentCount, updatedResult, prevLength, data: deleteduplicateResult })
    } else {
        res.status(200).json({ message: 'No duplicate data found', data: deleteduplicateResult })
    }
}

// Test route 2
const tfTEst = async (req, res, next) => {
    const input = [
        [13, 22, 3, 42, 5],
        [6, 17, 8, 39, 10],
        [11, 712, 413, 164, 15],
        [106, 17, 218, 19, 20]
    ]

    const { mean, variance } = tf.moments(tf.tensor(input), 0);
    const tfSub = tf.sub(tf.tensor(input), mean);
    const standardizedFeatures = tf.div(tfSub, tf.sqrt(variance));
    const stdData = standardizedFeatures.arraySync();


    // @ts-ignore
    const originalData = stdData.map(standardizedRow => {
        const originalRow = standardizedRow.map((val, index) => {
            const meanValue = mean.arraySync()[index];
            const stdDeviation = Math.sqrt(variance.arraySync()[index]);
            const originalValue = val * stdDeviation + meanValue;
            return originalValue;
        });
        return originalRow;
    });

    res.status(200).json({ message: 'testing tf', mean: mean.arraySync(), sub: tfSub.arraySync(), variance: variance.arraySync(), stdData, originalData })
}

router.post('/check_duplicates', checkDuplicates)
router.post('/tf_test', tfTEst)

module.exports = router