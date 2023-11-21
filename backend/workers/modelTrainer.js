const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))

const { fetchEntireHistDataFromDb } = require('../services/mongoDBServices')
const TF_Model = require('../utils/tf_model')
const TFMUtil = require('../utils/tf_modelUtil')

module.exports = async (job) => {
    const { fTalibExecuteQuery, model_training_parameters, model_id } = job.data
    const { db_query } = fTalibExecuteQuery[0].payload;
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

    log.alert('----> Step 1 : Fetching the ticker data from db') // oldest first 
    const tickerHistory = await fetchEntireHistDataFromDb(asset_type, ticker_name, period)
    const tickerHistoryLength = tickerHistory.length
    TF_Model.eventEmitter.emit('notify', { message: `----> Fetched ${tickerHistoryLength} tickers from db...`, latestData: tickerHistory[tickerHistoryLength - 1] })


    TF_Model.eventEmitter.emit('notify', { message: "----> Executing selected functions..." })
    log.alert('----> Step 2 : Executing the talib functions')
    let finalTalibRes = await TFMUtil.processSelectedFunctionsForModelTraining({ selectedFunctions: fTalibExecuteQuery, tickerHistory: tickerHistory })
    TF_Model.eventEmitter.emit('notify', { message: `----> Function execution completed...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Finding smallest array to adjust ticker hist and function data..." })
    log.alert('----> Step 3 : Finding smallest array to adjust ticker hist and function data')
    const [tickerHist, finalTalibResult] = await TFMUtil.trimDataBasedOnTalibSmallestLength({ finalTalibResult: finalTalibRes, tickerHistory })
    TF_Model.eventEmitter.emit('notify', { message: `----> Trimmed data based on talib smallest length...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Transforming and combining the OHLCV and function data for model training..." })
    log.alert('----> Step 4 : Transforming and combining the data to required format for model training')
    const features = await TFMUtil.transformDataToRequiredShape({ tickerHist, finalTalibResult })
    TF_Model.eventEmitter.emit('notify', { message: `----> Transformed data to required shape...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Standardizing the data..." })
    log.alert('----> Step 5 : Standardizing the data')
    let [stdData, label_mean, label_variance] = TFMUtil.standardizeData(model_type, features, to_predict)
    TF_Model.eventEmitter.emit('notify', { message: `----> Data standardized...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Creating the training data..." })
    log.alert('----> Step 6 : Transforming and creating the training data')
    const [trainSplit, xTrain, yTrain, xTrainTest, lastSets, yTrainTest] = await TFMUtil.createTrainingData(
        {
            model_type,
            stdData,
            timeStep: time_step,
            lookAhead: look_ahead,
            e_key: to_predict,
            training_size
        })
    TF_Model.eventEmitter.emit('notify', { message: `----> Training data created...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Generating dates for test set data..." })
    log.alert('----> Step 7 : Getting dates and verifying correctness')
    const dates = TFMUtil.getDateRangeForTestSet(tickerHist, trainSplit, time_step, look_ahead, yTrainTest, label_mean, label_variance)


    TF_Model.eventEmitter.emit('notify', { message: "----> Creating the model..." })
    log.alert('----> Step 8 : Creating the model')
    const input_layer_shape = time_step; // look back date
    const input_layer_neurons = 64;
    const rnn_output_neurons = 16;
    const output_layer_neurons = yTrain[0].length;
    const feature_count = xTrain[0][0].length;
    const n_layers = hidden_layers;

    const model_parama = {
        model_type,
        input_layer_shape,
        look_ahead,
        feature_count,
        input_layer_neurons,
        rnn_output_neurons,
        output_layer_neurons,
        n_layers
    }

    const model_ = TF_Model.createModel(model_parama)
    TF_Model.eventEmitter.emit('notify', { message: `----> TF Model created...` })


    TF_Model.eventEmitter.emit('notify', { message: "----> Training the model..." })
    log.alert('----> Step 9 : Training the model')
    const epochs = epochCount;
    const [trained_model_, history] = await TF_Model.trainModel(model_, learning_rate, xTrain, yTrain, epochs, batchSize)
    // console.log(history)
    TF_Model.eventEmitter.emit('notify', { message: `----> TF Model trained...` })


    log.alert('----> Step 10 : Evaluating the model on test set')
    TF_Model.eventEmitter.emit('notify', { message: "----> Evaluating the model on test set..." })
    // @ts-ignore
    let xHistory = xTrain.slice(-1)
    const evaluationData = [...xHistory, ...xTrainTest, ...lastSets]
    await TF_Model.evaluateModelOnTestSet(trained_model_, model_id, evaluationData, yTrainTest, dates, label_mean, label_variance)
    TF_Model.eventEmitter.emit('notify', { message: `----> TF Model evaluation completed...` })


    log.alert('----> Step 11 : Saving the model and weights  and disposing it ')
    await TF_Model.saveModel(trained_model_, model_id)

    return 'Model Training Completed'
}

