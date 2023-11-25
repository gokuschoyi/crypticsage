const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))

const Redis = require("ioredis");
// @ts-ignore
const redisPublisher = new Redis();
// @ts-ignore
const redisStep = new Redis();

const { fetchEntireHistDataFromDb } = require('../services/mongoDBServices')
const TF_Model = require('../utils/tf_model')
const TFMUtil = require('../utils/tf_modelUtil')

const model_training_order = [
    {
        function: fetchEntireHistDataFromDb,
        message: '----> Step 1 : Fetching the ticker data from db'
    },
    {
        function: TFMUtil.processSelectedFunctionsForModelTraining,
        message: '----> Step 2 : Executing the talib functions'
    },
    {
        function: TFMUtil.trimDataBasedOnTalibSmallestLength,
        message: '----> Step 3 : Finding smallest array to adjust ticker hist and function data'
    },
    {
        function: TFMUtil.transformDataToRequiredShape,
        message: '----> Step 4 : Transforming and combining the data to required format for model training'
    },
    {
        function: TFMUtil.standardizeData,
        message: '----> Step 5 : Standardizing the data'
    },
    {
        function: TFMUtil.createTrainingData,
        message: '----> Step 6 : Transforming and creating the training data'
    },
    {
        function: TFMUtil.getDateRangeForTestSet,
        message: '----> Step 7 : Getting dates and verifying correctness'
    },
    {
        function: TF_Model.createModel,
        message: '----> Step 8 : Creating the model'
    },
    {
        function: TF_Model.trainModel,
        message: '----> Step 9 : Training the model'
    },
    {
        function: TF_Model.saveModel,
        message: '----> Step 10 : Saving the model information'
    },
    {
        function: TF_Model.evaluateModelOnTestSet,
        message: '----> Step 11 : Evaluating the model on test set'
    },
    {
        function: TF_Model.disposeModel,
        message: '----> Step 12 : Disposing the model and cleaning up'
    }
]

/**
 * @typedef {Object} DBQuery
 * @property {string} asset_type crypto | stock
 * @property {string} ticker_name the ticker name
 * @property {string} period 1m | 1h | 4h | 6h | 8h | 12h | 1d | 3d | 1w
 */

/**
 * 
 * @param {Object} job
 * @param {Object} job.data
 * @param {Array} job.data.fTalibExecuteQuery
 * @param {Object} job.data.model_training_parameters
 * @param {string} job.data.model_id
 * @param {string} job.data.uid 
 * @returns 
 */
module.exports = async (job) => {
    const { fTalibExecuteQuery, model_training_parameters, model_id, uid } = job.data
    const { db_query } = fTalibExecuteQuery[0].payload;
    /** @type {DBQuery} */
    const { asset_type, ticker_name, period } = db_query;
    // Model parameters
    const {
        training_size,
        time_step,
        look_ahead,
        epochs: epochCount,
        batchSize,
        hidden_layers,
        learning_rate,
        to_predict,
        model_type
    } = model_training_parameters
    console.log('Model parameters : ', model_training_parameters)

    const modelCheckpointName = `model_training_checkpoint_${model_id}`
    console.log('Model step name : ', modelCheckpointName)

    try {
        const checkpoint = await redisStep.hget(modelCheckpointName, 'step')

        if (checkpoint) {
            console.log('Checkpoint found', checkpoint)
        } else {
            console.log('No checkpoint found')
        }

        let start_step = parseInt(checkpoint) || 1;
        let parameters;
        let result;
        let model_;
        let trained_model_;

        for (let i = start_step; i <= model_training_order.length; i++) {
            const teststr = model_training_order[i - 1].message;
            const arrowIndex = teststr.indexOf('---->');
            const arrow = teststr.substring(0, arrowIndex + 5); // +5 because the length of '---->' is 5
            const message = teststr.substring(arrowIndex + 5).trim(); // .trim() to remove any leading/trailing whitespace

            const modifiedMessage = `${arrow} (${uid}) (${model_id}) ${message}`
            log.alert(modifiedMessage)
            const step = model_training_order[i - 1].function
            switch (i) {
                case 1: // Fetching the ticker data from db // setting step, tickerHistory
                    parameters = {
                        type: asset_type,
                        ticker_name,
                        period,
                    }
                    // console.log(Object.keys(parameters))

                    try {
                        // @ts-ignore
                        result = await step(parameters)
                        await redisStep.hset(modelCheckpointName, {
                            step: i + 1,
                            tickerHistory: JSON.stringify(result)
                        })
                    } catch (error) {
                        const newErrorMessage = { func_error: error.message, message: 'Error fetching data from db', step: i }
                        throw new Error(JSON.stringify(newErrorMessage));
                    }
                    // @ts-ignore
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `----> Fetched ${result.length} tickers from db...` }))
                    break;
                case 2: // Executing the talib functions // setting step, finalTalibResult
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `----> Executing selected functions...` }))
                    parameters = {
                        selectedFunctions: fTalibExecuteQuery,
                        tickerHistory: JSON.parse(await redisStep.hget(modelCheckpointName, 'tickerHistory')),
                    }
                    // console.log(Object.keys(parameters))

                    try {
                        // @ts-ignore
                        result = await step(parameters)
                        await redisStep.hset(modelCheckpointName, {
                            step: i + 1,
                            finalTalibResult: JSON.stringify(result)
                        })
                    } catch (error) {
                        const newErrorMessage = { func_error: error.message, message: 'Error in executing selected functions', step: i }
                        throw new Error(JSON.stringify(newErrorMessage));
                    }
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `----> Function execution completed...` }))
                    break;
                case 3: // Finding smallest array to adjust ticker hist and function data // setting step, tickerHistory, finalTalibResult
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `----> Finding smallest array to adjust ticker hist and function data...` }))
                    parameters = {
                        finalTalibResult: JSON.parse(await redisStep.hget(modelCheckpointName, 'finalTalibResult')),
                        tickerHistory: JSON.parse(await redisStep.hget(modelCheckpointName, 'tickerHistory'))
                    }
                    // console.log(Object.keys(parameters))

                    try {
                        // @ts-ignore
                        result = await step(parameters)
                        await redisStep.hset(modelCheckpointName, {
                            step: i + 1,
                            // @ts-ignore
                            tickerHistory: JSON.stringify(result.tickerHist),
                            // @ts-ignore
                            finalTalibResult: JSON.stringify(result.finalTalibResult)
                        })
                    } catch (error) {
                        const newErrorMessage = { func_error: error.message, message: 'Error adjusting the ticker and talib result length', step: i }
                        throw new Error(JSON.stringify(newErrorMessage));
                    }
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `----> Trimmed data based on talib smallest length...` }))
                    break;
                case 4: // Transforming and combining the data to required format for model training // setting step, features
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `----> Transforming and combining the OHLCV and function data for model training...` }))
                    parameters = {
                        tickerHist: JSON.parse(await redisStep.hget(modelCheckpointName, 'tickerHistory')),
                        finalTalibResult: JSON.parse(await redisStep.hget(modelCheckpointName, 'finalTalibResult'))
                    }
                    // console.log(Object.keys(parameters))

                    try {
                        // @ts-ignore
                        result = await step(parameters)
                        await redisStep.hset(modelCheckpointName, {
                            step: i + 1,
                            // @ts-ignore
                            features: JSON.stringify(result)
                        })
                    } catch (error) {
                        const newErrorMessage = { func_error: error.message, message: 'Error in combining OHLCV and selected function data', step: i }
                        throw new Error(JSON.stringify(newErrorMessage));
                    }
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `----> Transformed data to required shape...` }))
                    break;
                case 5: // Standardizing the data // setting step, stdData, label_mean, label_variance
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `----> Standardizing the data...` }))
                    parameters = {
                        model_type,
                        features: JSON.parse(await redisStep.hget(modelCheckpointName, 'features')),
                        to_predict,
                    }
                    // console.log(Object.keys(parameters))

                    try {
                        // @ts-ignore
                        result = await step(parameters)
                        await redisStep.hset(modelCheckpointName, {
                            step: i + 1,
                            // @ts-ignore
                            stdData: JSON.stringify(result.stdData),
                            // @ts-ignore
                            label_mean: result.label_mean,
                            // @ts-ignore
                            label_variance: result.label_variance
                        })
                    } catch (error) {
                        const newErrorMessage = { func_error: error.message, message: 'Error during standardization of data', step: i }
                        throw new Error(JSON.stringify(newErrorMessage));
                    }
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `----> Data standardized...` }))
                    break;
                case 6: // Transforming and creating the training data // setting step, trainSplit, xTrain, xHistory,  yTrain, xTrainTest, lastSets, yTrainTest, output_layer_neurons, feature_count
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `----> Creating the training data...` }))
                    parameters = {
                        model_type,
                        stdData: JSON.parse(await redisStep.hget(modelCheckpointName, 'stdData')),
                        timeStep: time_step,
                        lookAhead: look_ahead,
                        e_key: to_predict,
                        training_size,
                    }
                    // console.log(Object.keys(parameters))

                    try {
                        // @ts-ignore
                        result = await step(parameters)
                        await redisStep.hset(modelCheckpointName, {
                            step: i + 1,
                            // @ts-ignore
                            trainSplit: result.trainSplit,
                            // @ts-ignore
                            xTrain: JSON.stringify(result.xTrain),
                            // @ts-ignore
                            xHistory: JSON.stringify(result.xTrain.slice(-1)),
                            // @ts-ignore
                            yTrain: JSON.stringify(result.yTrain),
                            // @ts-ignore
                            xTrainTest: JSON.stringify(result.xTrainTest),
                            // @ts-ignore
                            lastSets: JSON.stringify(result.lastSets),
                            // @ts-ignore
                            yTrainTest: JSON.stringify(result.yTrainTest),
                            // @ts-ignore
                            output_layer_neurons: result.yTrain[0].length,
                            // @ts-ignore
                            feature_count: result.xTrain[0][0].length,
                        })
                    } catch (error) {
                        const newErrorMessage = { func_error: error.message, message: 'Error in transforming and creating data', step: i }
                        throw new Error(JSON.stringify(newErrorMessage));
                    }
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `----> Training data created...` }))
                    break;
                case 7: // Getting dates and verifying correctness // setting step, dates
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `----> Generating dates for test set data...` }))
                    parameters = {
                        ticker_history: JSON.parse(await redisStep.hget(modelCheckpointName, 'tickerHistory')),
                        train_split: JSON.parse(await redisStep.hget(modelCheckpointName, 'trainSplit')),
                        time_step,
                        look_ahead,
                        yTrainTest: JSON.parse(await redisStep.hget(modelCheckpointName, 'yTrainTest')),
                        label_mean: JSON.parse(await redisStep.hget(modelCheckpointName, 'label_mean')),
                        label_variance: JSON.parse(await redisStep.hget(modelCheckpointName, 'label_variance')),
                    }
                    // console.log(Object.keys(parameters))

                    try {
                        // @ts-ignore
                        result = step(parameters)
                        await redisStep.hset(modelCheckpointName, {
                            step: i + 1,
                            // @ts-ignore
                            dates: JSON.stringify(result)
                        })
                    } catch (error) {
                        const newErrorMessage = { func_error: error.message, message: 'Error generating dates for plotting', step: i }
                        throw new Error(JSON.stringify(newErrorMessage));
                    }
                    break;
                case 8: // Creating the model // setting step
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `----> Creating the model...` }))
                    const input_layer_neurons = 64;
                    const rnn_output_neurons = 16;
                    parameters = {
                        model_type,
                        input_layer_shape: time_step,
                        look_ahead,
                        feature_count: JSON.parse(await redisStep.hget(modelCheckpointName, 'feature_count')),
                        input_layer_neurons,
                        rnn_output_neurons,
                        output_layer_neurons: JSON.parse(await redisStep.hget(modelCheckpointName, 'output_layer_neurons')),
                        n_layers: hidden_layers,
                    }
                    // console.log(Object.keys(parameters))

                    try {
                        // @ts-ignore
                        model_ = await step(parameters)
                        await redisStep.hset(modelCheckpointName, {
                            step: i + 1,
                        })
                    } catch (error) {
                        const newErrorMessage = { func_error: error.message, message: 'Error creating model', step: i }
                        throw new Error(JSON.stringify(newErrorMessage));
                    }
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `----> TF Model created...` }))
                    break;
                case 9: // Training the model // setting step
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `----> Training the model...` }))
                    parameters = {
                        model: model_,
                        learning_rate,
                        xTrain: JSON.parse(await redisStep.hget(modelCheckpointName, 'xTrain')),
                        yTrain: JSON.parse(await redisStep.hget(modelCheckpointName, 'yTrain')),
                        epochs: epochCount,
                        batch_size: batchSize,
                        uid
                    }
                    console.log(Object.keys(parameters))

                    const testFlag = false;

                    try {
                        if (testFlag) {
                            const newErrorMessage = { func_error: 'No function', message: 'custom test error', step: i }
                            throw new Error(JSON.stringify(newErrorMessage));
                        }
                        // @ts-ignore
                        result = await step(parameters)
                        await redisStep.hset(modelCheckpointName, {
                            step: i + 1,
                        })
                    } catch (error) {
                        await redisStep.hset(modelCheckpointName, {
                            step: 8,
                        })
                        const newErrorMessage = { func_error: error.message, message: 'Error during training the model', step: i }
                        throw new Error(JSON.stringify(newErrorMessage));
                    }
                    // @ts-ignore
                    trained_model_ = result.model
                    console.log('Optimizer : ', trained_model_.optimizer_.learningRate, trained_model_.optimizer_.beta1, trained_model_.optimizer_.beta2, trained_model_.optimizer_.epsilon)
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `----> TF Model trained...` }))
                    break;
                case 10: // Saving the model, weights  and cleaning up // setting step
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `----> Saving the model...` }))
                    try {
                        await step(trained_model_, model_id)
                        await redisStep.hset(modelCheckpointName, {
                            step: i + 1,
                        })
                    } catch (error) {
                        const newErrorMessage = { func_error: error.message, message: 'Error during saving the model', step: i }
                        throw new Error(JSON.stringify(newErrorMessage));
                    }
                    break;
                case 11: // Evaluating the model on test set // setting step
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `----> Evaluating the model on test set...` }))
                    trained_model_ = null
                    let modelForEvaluation = trained_model_ || await TF_Model.loadModel(model_id)
                    trained_model_ = modelForEvaluation
                    const xHistory = JSON.parse(await redisStep.hget(modelCheckpointName, 'xHistory'))
                    const xTrainTest = JSON.parse(await redisStep.hget(modelCheckpointName, 'xTrainTest'))
                    const lastSets = JSON.parse(await redisStep.hget(modelCheckpointName, 'lastSets'))
                    const evaluationData = [...xHistory, ...xTrainTest, ...lastSets]
                    parameters = {
                        trained_model_,
                        model_id,
                        xTrainTest: evaluationData,
                        yTrainTest: JSON.parse(await redisStep.hget(modelCheckpointName, 'yTrainTest')),
                        dates: JSON.parse(await redisStep.hget(modelCheckpointName, 'dates')),
                        label_mean: JSON.parse(await redisStep.hget(modelCheckpointName, 'label_mean')),
                        label_variance: JSON.parse(await redisStep.hget(modelCheckpointName, 'label_variance')),
                        uid
                    }
                    // console.log(Object.keys(parameters))

                    try {
                        // @ts-ignore
                        await step(parameters)
                        await redisStep.hset(modelCheckpointName, {
                            step: i + 1,
                        })
                    } catch (error) {
                        const newErrorMessage = { func_error: error.message, message: 'Error during evaluation', step: i }
                        throw new Error(JSON.stringify(newErrorMessage));
                    }
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'notify', uid, message: `----> TF Model evaluation completed...` }))
                    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'prediction_completed', uid, id: model_id }))

                    const allData = await redisStep.hgetall(modelCheckpointName)
                    console.log(Object.keys(allData))
                    break;
                case 12: // Disposing the model and cleaning up // setting step
                    try {
                        await step(trained_model_)
                        await redisStep.del(modelCheckpointName)
                    } catch (error) {
                        const newErrorMessage = { func_error: error.message, message: 'Error during disposing the model', step: i }
                        throw new Error(JSON.stringify(newErrorMessage));
                    }
                    break;
                default:
                    break;
            }
        }

    } catch (error) {
        throw error;
    }

    return 'Model Training Completed'
}