const express = require('express')
const router = express.Router()
const { handleTokenRedisStorage } = require('../utils/redis_util')
const IController = require('../controllers/indicatorsController')
const MDBServices = require('../services/mongoDBServices')

const tf = require('@tensorflow/tfjs-node');

router.post('/get_talib_desc', IController.getIndicatorDesc)
router.post('/execute_talib_function', handleTokenRedisStorage, IController.executeTalibFunction)

router.post('/start_model_training', IController.procssModelTraining)
router.post('/retrain_model', IController.retrainModel)
router.post('/get_corelation_matrix', IController.calculateCoRelationMatrix)

router.post('/get_model', IController.getModel)
router.post('/save_model', IController.saveModel)
router.post('/delete_model', IController.deleteModel)
router.post('/delete_user_model', IController.deleteUserModel)

router.post('/check_for_model', IController.checkIfModelExists)
router.post('/get_model_result', IController.getModelResult)
router.post('/rename_model', IController.renameModel)

router.get('/get_model_checkpoints', IController.getModelCheckpoints)

router.post('/make_new_prediction', IController.makeNewForecast)
router.post('/make_wgan_prediction', IController.makeWgangpForecast)

router.post('/generate_test_data', IController.testNewModel)
// router.post('/generate_test_data_two', IController.generateTestData)


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

router.post('/check_duplicates', checkDuplicates)

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

router.post('/tf_test', tfTEst)

module.exports = router