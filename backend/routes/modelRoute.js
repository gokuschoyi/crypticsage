const express = require('express')
const router = express.Router()

const ModelController = require('../controllers/modelController')

router.post('/start_model_training', ModelController.procssModelTraining)
router.post('/retrain_model', ModelController.retrainModel)
router.post('/get_corelation_matrix', ModelController.calculateCoRelationMatrix)

router.post('/get_model', ModelController.getModel)
router.post('/save_model', ModelController.saveModel)
router.post('/delete_model', ModelController.deleteModel)
router.post('/delete_user_model', ModelController.deleteUserModel)
router.post('/update_new_predictions', ModelController.updateNewTrainingResults)

router.post('/rename_model', ModelController.renameModel)
router.get('/get_model_checkpoints', ModelController.getModelCheckpoints)

router.post('/make_new_prediction', ModelController.makeNewForecast)
router.post('/make_wgan_prediction', ModelController.makeWgangpForecast)

router.post('/get_model_result', ModelController.getModelResult)  // Can be converted to fetch further details of the model

router.post('/generate_test_data', ModelController.testNewModel)

// celery test route
const tempsetrmse = async (req, res) => {
    const { model_id, rmse } = req.body;
    // const result = await MDBServices.temp_setLSTMRmse(model_id, rmse)
    // const testDtate = new Date().toLocaleString()

    // const uTime = new Date(testDtate).getTime()
    const testRes = await ModelController.testing(model_id)
    res.status(200).json({ message: 'RMSE set successfully', testRes })
}

router.put('/set_lstm_rmse', tempsetrmse)

module.exports = router