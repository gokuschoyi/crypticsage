/**
 * Route for talib functions related endpoints.
 * @module route/indicators
 */

const express = require('express')
const router = express.Router()
const IController = require('../controllers/indicatorsController')
const MDBServices = require('../services/mongoDBServices')

const tf = require('@tensorflow/tfjs-node');

/**
 * Endpoint to fetch the talib indicator descriptions for each function.
 * @name /getTalibDescription
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /indicators/get_talib_desc
 * @code {200} Talib description fetched successfully
 * @code {400} Error response
 * @response {string} message - Talib description fetched successfully
 * @response {array} desc - Array of talib indicator descriptions by group.
 */
router.post('/get_talib_desc', IController.getIndicatorDesc)

/**
 * Endpoint to execute the talib function.
 * @name /executeTalibFunction
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @body {object} payload - The payload object. { db_query, func_query, func_param_input_keys, func_param_optional_input_keys, func_param_output_keys}
 * @body {object} payload.db_query - The db query object. { asset_type: string, ticker_name: string, period: string, fetch_count: number }
 * @body {object} payload.func_query - The function query object. { endIdx: number, inReal: string, name: string, optInTimePeriod: number, startIdx: number }
 * @body {object} payload.func_param_input_keys - The function param input keys.
 * @body {object} payload.func_param_optional_input_keys - The function param optional input keys.
 * @body {object} payload.func_param_output_keys - The function param output keys.
 * @path {POST} /indicators/execute_talib_function
 * @code {200} Execute Talib Function request success
 * @code {400} Error response
 * @response {string} message - Execute Talib Function request success
 * @response {string} info - The talib function info.
 * @response {string} result - The talib function result.
 */
router.post('/execute_talib_function', IController.executeTalibFunction)



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

    // mean: mean.arraySync(), sub: tfSub.arraySync(), variance: variance.arraySync(), stdData, originalData 
    // console.log('From Main', res.locals.data)
    const uid = res.locals.data.uid
    const entire_hist_data = await MDBServices.fetchEntireHistDataFromDb({ type: 'crypto', ticker_name: 'BTCUSDT', period: '4h', return_result_: true })

    const type = 'crypto'
    const ticker_name = 'BTCUSDT'
    const period = '4h'
    const { page_no } = req.body
    // const data = await MDBServices.fetchTickerHistDataFromDb(uid, type, ticker_name, period, page_no, 10, 0)
    // console.log('I route length', data.ticker_data.length)
    // const data_count = await MDBServices.fetchTickerHistDataBasedOnCount(type, ticker_name, period, 100)

    // const lstm_model = TF_Model.createModel({ model_type: 'lstm', input_layer_shape: 14, look_ahead: 3, feature_count: 5 })
    // console.log(lstm_model.summary())
    res.status(200).json({ message: 'testing tf', entire_hist_data })
}
router.post('/tf_test', tfTEst)

module.exports = router