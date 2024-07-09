/**
 * Route for model related operations
 * @module route/model
 */

const express = require('express')
const router = express.Router()

const ModelController = require('../controllers/modelController')

/**
 * Endpoint start the model training process (LSTM & WGAN).
 * @name /startModelTraining
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /model/start_model_training
 * @body {array} fTalibExecuteQuery - The array of the talib query to be executed
 * @body {object} model_training_parameters - The model training parameters
 * @code {200} Model training started
 * @code {400} Error response
 * @response {string} message - Model training started
 * @response {string} info - Info message if any
 * @response {string} jobId - The job id of the model training process
 * @response {array} finalRs - The final result of the model training process if any
 * @see [fTalibExecuteQuery]{@link FTalibExecuteQueries}
 * @see [model_training_parameters]{@link ModelTrainingParameters}
 */
router.post('/start_model_training', ModelController.procssModelTraining)

/**
 * Endpoint to retrain a model (WGAN).
 * @name /retrainModel
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /model/retrain_model
 * @body {array} fTalibExecuteQuery - The array of the talib query to be executed
 * @body {object} fullRetrainParams - The model re-training parameters
 * @body {object} additional_data - The additional data for the model re-training
 * @code {200} Model re-training started
 * @code {400} Error response
 * @response {string} message - Model re-training started
 * @response {string} info - Info message if any
 * @response {string} jobId - The job id of the model training process
 * @see [fTalibExecuteQuery]{@link FTalibExecuteQueries}
 * @see [fullRetrainParams]{@link ModelTrainingParameters}
 * @see [additional_data]{@link AdditionalData}
 */
router.post('/retrain_model', ModelController.retrainModel)

/**
 * Endpoint to calculate the correlation matrix.
 * @name /calculateCoRelationMatrix
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /model/get_corelation_matrix
 * @body {array} transformation_order - The order of transformations to apply.
 * @body {array} fTalibExecuteQuery - The array of the talib query to be executed
 * @code {200} Correlation matrix calculated successfully
 * @code {400} Error response
 * @response {string} message - Correlation matrix calculated successfully
 * @response {array} corelation_matrix - The correlation matrix
 * @see [fTalibExecuteQuery]{@link FTalibExecuteQueries}
 * @see [transformation_order]{@link TransformationOrder}
 */
router.post('/get_corelation_matrix', ModelController.calculateCoRelationMatrix)

/**
 * Endpoint to get the model list for a specific user.
 * @name /getModel
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /model/get_model
 * @code {200} Model fetched successfully
 * @code {400} Error response
 * @response {string} message - Model fetched successfully
 * @response {array} model - The model list
 */
router.post('/get_model', ModelController.getModel)

/**
 * Endpoint to save the model.
 * @name /saveModelRuns
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /model/save_model
 * @body {object} payload - The model save payload
 * @code {200} Model saved successfully
 * @code {400} Error response
 * @response {string} message - Model saved successfully
 * @response {boolean} model_save_status - The model save status
 * @response {object} modelSaveResult - The model save result
 * @response {string} user_id - The user id
 * @see [payload]{@link SavePayload}
 */
router.post('/save_model_runs', ModelController.saveModelRuns)

/**
 * Endpoint to delete the model from local directory and redis if not being saved.
 * @name /deleteModel
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /model/delete_model
 * @body {string} model_id - The ID of the model
 * @body {string} model_type - The type of the model
 * @body {string} asset_type - The asset type
 * @body {string} ticker_name - The ticker name
 * @body {string} period - The period
 * @code {200} Model deleted successfully
 * @code {400} Error response
 * @response {string} message - Model deleted successfully
 */
router.post('/delete_model', ModelController.deleteModel)

/**
 * Endpoint to delete the user model from local storage as well as DB.
 * @name /deleteUserModel
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /model/delete_user_model
 * @body {string} model_id - The ID of the model
 * @body {string} model_type - The type of the model
 * @code {200} Model deleted successfully
 * @code {400} Error response
 * @response {string} message - Model deleted successfully
 */
router.post('/delete_user_model', ModelController.deleteUserModel)

/**
 * Endpoint to update the training results of WGAN model.
 * @name /updateNewPredictions
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /model/update_new_predictions
 * @body {object} payload - The model update payload
 * @code {200} Model updated successfully
 * @code {400} Error response
 * @response {string} message - Model updated successfully
 * @see [payload]{@link UpdatePredictionPayload}
 */
router.post('/update_new_predictions', ModelController.updateNewTrainingResults)

/**
 * Endpoint to rename the model name
 * @name /renameModel
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /model/rename_model
 * @body {string} model_id - The ID of the model
 * @body {string} model_name - The name of the model
 * @code {200} Model renamed successfully
 * @code {400} Error response
 * @response {string} message - Model renamed successfully
 */
router.post('/rename_model', ModelController.renameModel)

/**
 * Endpoint to get the model checkpoints.
 * @name /getModelCheckpoints
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {GET} /model/get_model_checkpoints?model_id=
 * @params {string} model_id - The ID of the model
 * @code {200} Model checkpoints fetched successfully
 * @code {400} Error response
 * @response {string} message - Model checkpoints fetched successfully
 */
router.get('/get_model_checkpoints', ModelController.getModelCheckpoints)

/**
 * Endpoint to make a new LSTM Forecast
 * @name /makeNewForecast
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /model/make_new_prediction
 * @body {object} payload - The model forecast payload
 * @code {200} LSTM Model forecast completed
 * @code {400} LSTM Model forecasting failed
 * @response {string} message - LSTM Model forcast completed
 * @response {boolean} status - The status of the forecast
 * @response {array} result - The forecast result
 * @response {string} error - The error message if any
 * @see [payload]{@link LSTMForecastPayload}
 */
router.post('/make_new_prediction', ModelController.makeNewForecast)

/**
 * Endpoint to make a new WGAN Forecast
 * @name /makeWganForecast
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /model/make_wgan_prediction
 * @body {object} payload - The model forecast payload
 * @code {200} WGAN Model forecast completed
 * @code {400} WGAN Model forecasting failed
 * @response {string} message - WGAN Model forcast completed
 * @response {boolean} status - The status of the forecast
 * @response {array} result - The forecast result
 * @response {string} error - The error message if any
 * @see [payload]{@link WGANForecastPayload}
 */
router.post('/make_wgan_prediction', ModelController.makeWgangpForecast)

/**
 * Endpoint to generate the ACF/PACF plot values
 * @name /getPartialAutoCorrelation
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /model/get_partial_auto_correlation
 * @body {string} asset_type - The asset type
 * @body {string} ticker_name - The ticker name
 * @body {string} period - The period
 * @body {number} maxKag - The maximum lag
 * @body {string} seriesName - The series name
 * @body {number} confidenceLevel - The confidence level
 * @code {200} Partial Autocorrelation calculated successfully
 * @code {400} Error response
 * @response {string} message - Partial Autocorrelation calculated successfully
 * @response {array} pacf_final - The partial autocorrelation values
 */
router.post('/get_partial_auto_correlation', ModelController.partialAutoCorrelation)

/**
 * Endpoint to forecast the data using Chronos/Prophet models
 * @name /quickForecasting
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /model/quick_forecasting
 * @body {string} module - The module name
 * @body {string} symbol - The symbol name
 * @body {string} period - The period
 * @body {object} model_data - The data object for forecasting
 * @code {200} Quick forecasting completed
 * @code {400} Quick forecasting failed
 * @response {string} message - Quick forecasting completed
 * @response {array} forecast - The forecast result
 * @see [model_data]{@link QFData}
 */
router.post('/quick_forecasting', ModelController.quickForecasting)


router.post('/get_cached_training_result', ModelController.getCachedTrainignResultsFromDB)
router.post('/model_training_status', ModelController.getTrainingStatusForModel)



router.post('/get_model_result', ModelController.getModelResult)  // Can be converted to fetch further details of the model
router.post('/generate_test_data', ModelController.testNewModel)

// celery test route
const tempsetrmse = async (req, res) => {
    const { model_id, rmse } = req.body;
    // const result = await MDBServices.temp_setLSTMRmse(model_id, rmse)
    // const testDtate = new Date().toLocaleString()

    // const uTime = new Date(testDtate).getTime()
    // const testRes = await ModelController.migrateLSTM_Data()
    // const testRes = await ModelController.migrateWGAN_Data()
    res.status(200).json({ message: 'RMSE set successfully', testRes: 'no func to call'})
}

router.put('/set_lstm_rmse', tempsetrmse)

module.exports = router