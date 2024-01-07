const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))
const tf = require('@tensorflow/tfjs-node');
const RedisUtil = require('./redis_util')
const config = require('../config')
const Redis = require("ioredis");
const { sqrt } = require('@tensorflow/tfjs-core');
// @ts-ignore
const redisPublisher = new Redis();

/* // Evaluate the model on the test data using `evaluate`
console.log('Evaluate on test data');
const testResult = model.evaluate(xTest, yTest, { batch_size: 128 });
testResult.print(); */

function displayDataInTable(data, name) {
    // Convert each sub-array into an object with named properties
    const objectifiedData = data.map(subArray => {
        const obj = {};
        subArray.forEach((value, index) => {
            obj['col' + (index + 1)] = value;
        });
        return obj;
    });

    // Display the data using console.table
    console.log(name)
    console.table(objectifiedData);
}

const type = config.single_step_type_two

/**
 * Creates a model with the given parameters
 * @param {Object} model_parama
 * @param {String} model_parama.model_type
 * @param {Number} model_parama.input_layer_shape
 * @param {Number} model_parama.look_ahead
 * @param {Number} model_parama.feature_count
 * @returns {tf.Sequential} model - A tensorflow model of type {@link tf.Sequential}
 */
const createModel = (model_parama) => {
    const {
        model_type,
        input_layer_shape: time_step,
        look_ahead,
        feature_count,
    } = model_parama

    const model = tf.sequential();

    switch (model_type) {
        case 'multi_input_single_output_step':
            let lstm_units = 100;
            if (look_ahead === 1) {
                switch (type) {
                    // @ts-ignore
                    case 'CNN_One_Step':
                        model.add(tf.layers.conv1d({
                            filters: 64,
                            kernelSize: 2,
                            activation: 'relu',
                            inputShape: [time_step, feature_count]
                        }));

                        // Add a MaxPooling1D layer
                        model.add(tf.layers.maxPooling1d({
                            poolSize: 2
                        }));

                        // Add a Flatten layer
                        model.add(tf.layers.flatten());

                        // Add a dense layer with 50 units and ReLU activation
                        model.add(tf.layers.dense({
                            units: 50,
                            activation: 'relu'
                        }));

                        // Adding a dropout layer
                        model.add(tf.layers.dropout({
                            rate: 0.1 // Adjust the dropout rate as needed
                        }));

                        // Add a dense layer with n_features units (no activation specified, defaults to linear)
                        model.add(tf.layers.dense({
                            units: 1,
                            kernelRegularizer: tf.regularizers.l1()  // Adjust the regularization rate as needed
                        }));
                        break;
                    // @ts-ignore
                    case 'CNN_MultiChannel':
                        model.add(tf.layers.conv1d({
                            filters: 32,
                            kernelSize: 3,
                            activation: 'relu',
                            inputShape: [time_step, feature_count]
                        }));

                        model.add(tf.layers.conv1d({
                            filters: 32,
                            kernelSize: 3,
                            activation: 'relu'
                        }));

                        model.add(tf.layers.maxPooling1d({
                            poolSize: 2
                        }));

                        model.add(tf.layers.conv1d({
                            filters: 16,
                            kernelSize: 3,
                            activation: 'relu'
                        }));

                        model.add(tf.layers.maxPooling1d({
                            poolSize: 2
                        }));

                        model.add(tf.layers.flatten());

                        model.add(tf.layers.dense({
                            units: 100,
                            activation: 'relu'
                        }));

                        model.add(tf.layers.dropout({
                            rate: 0.1
                        }));

                        model.add(tf.layers.dense({
                            units: 1
                        }));
                        break;
                    default:
                        let n_input = time_step * feature_count
                        let n_output = 1
                        model.add(tf.layers.dense({
                            units: 100,
                            inputShape: [n_input],
                            activation: 'relu',
                        }));
                        model.add(tf.layers.dense({
                            units: n_output
                        }));
                        break;
                }
            } else {
                model.add(tf.layers.lstm({ units: lstm_units, activation: 'relu', inputShape: [time_step, feature_count] }));
                model.add(tf.layers.repeatVector({ n: look_ahead }));
                model.add(tf.layers.dropout({ rate: 0.1 }));
                model.add(tf.layers.lstm({ units: lstm_units, activation: 'relu', returnSequences: true }));
                model.add(tf.layers.timeDistributed({ layer: tf.layers.dense({ units: 1 }), inputShape: [look_ahead, lstm_units] }));
            }
            break;
        default:
            break;
    }

    return model
}

const epochBeginCallback = (uid, epoch) => {
    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'epochBegin', uid, epoch: epoch }))
}

const epochEndCallback = (uid, epoch, log) => {
    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'epochEnd', uid, epoch: epoch, log: log }))
};

const batchEndCallback = (uid, batch, log, totalNoOfBatch) => {
    let newLog = {
        ...log,
        totalNoOfBatch
    }
    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'batchEnd', uid, batch: batch, log: newLog }))
}

const onTrainEndCallback = (uid) => {
    redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'trainingEnd', uid }))
}

const trainModel = async (
    {
        uid,
        model,
        epochs,
        batch_size,
        look_ahead,
        do_validation,
        early_stopping_flag,
        xTrain,
        yTrain,
        xTrainTest,
        yTrainTest,
        learning_rate,
    }
) => {
    const totalNoOfBatch = Math.round(xTrain.length / batch_size)
    let xTrainTensor, xTTensor
    let yTrainTensor, yTTesnor
    let xTrainTestTensor, yTrainTestTensor
    // const xTrainTensor = tf.tensor(xTrain)
    let reshapedYTensor

    if (look_ahead === 1) {
        log.info('Train : Look ahead is 1, reshaping y-train')
        switch (type) {
            // @ts-ignore
            case 'CNN_One_Step':
            // @ts-ignore
            case 'CNN_MultiChannel':
                yTTesnor = tf.tensor(yTrain)
                // @ts-ignore
                reshapedYTensor = yTTesnor.reshape([yTTesnor.shape[0], yTTesnor.shape[1]])

                const yTtestTensor = tf.tensor(yTrainTest)
                // @ts-ignore
                let reshapedYTestTensor = yTtestTensor.reshape([yTtestTensor.shape[0], yTtestTensor.shape[1]])

                xTrainTensor = tf.tensor(xTrain)
                yTrainTensor = reshapedYTensor

                xTrainTestTensor = tf.tensor(xTrainTest.slice(0, -look_ahead))
                yTrainTestTensor = reshapedYTestTensor

                if (config.debug_flag === 'true') {
                    console.log('Step 9 : model type', type)
                }
                break;
            default:
                xTTensor = tf.tensor(xTrain)
                yTTesnor = tf.tensor(yTrain)

                // @ts-ignore
                let n_input = xTTensor.shape[1] * xTTensor.shape[2]

                xTrainTensor = xTTensor.reshape([xTTensor.shape[0], n_input])
                yTrainTensor = yTTesnor.reshape([yTTesnor.shape[0], 1])
                break;
        }
    } else {
        log.info('Train : Look ahead is > 1')
        xTrainTensor = tf.tensor(xTrain)
        yTrainTensor = tf.tensor(yTrain)

        xTrainTestTensor = tf.tensor(xTrainTest.slice(0, -look_ahead))
        yTrainTestTensor = tf.tensor(yTrainTest)
    }

    if (config.debug_flag === 'true') {
        // @ts-ignore
        log.info(`xTrain tensor shape: ${xTrainTensor.shape}, yTrain tensor shape : ${yTrainTensor.shape}`)
        // @ts-ignore
        log.info(`xTrainTest tensor shape: ${xTrainTestTensor.shape}, yTrainTest tensor shape : ${yTrainTestTensor.shape}`)
    }

    // Define your early stopping callback
    const earlyStopping = tf.callbacks.earlyStopping({
        monitor: do_validation ? 'val_mse' : 'mse',
        patience: 0,
        verbose: 2
    });

    const custom_callbacks = [
        ...(early_stopping_flag ? [earlyStopping] : []),
        new tf.CustomCallback({
            onEpochBegin: async (epoch) => {
                epochBeginCallback(uid, epoch);
            },
            onEpochEnd: async (epoch, log) => {
                epochEndCallback(uid, epoch, log);
            },
            onBatchEnd: async (batch, log) => {
                batchEndCallback(uid, batch, log, totalNoOfBatch)
            },
            onTrainEnd: async () => {
                onTrainEndCallback(uid)
            }
        })
    ]

    model.compile({
        optimizer: tf.train.adam(learning_rate),
        loss: 'meanSquaredError',
        metrics: ['mse', 'mae'],
    });

    console.log(model.summary())

    const history = await model.fit(xTrainTensor, yTrainTensor,
        {
            batchSize: batch_size,
            epochs: epochs,
            verbose: 1,
            validationData: do_validation ? [xTrainTestTensor, yTrainTestTensor] : null,
            callbacks: custom_callbacks
        });


    console.log('History : ', history)
    return { model }
}

const evaluateModelOnTestSet = async (
    {
        trained_model_,
        model_id,
        look_ahead,
        e_key,
        xTrainTest: xTTest,
        yTrainTest,
        dates,
        label_mean,
        label_variance,
        uid
    }
) => {
    let xTrainTest = []
    if (look_ahead === 1) {
        // console.log('Look ahead is 1, reshaping x-train')
        let reshaped
        switch (type) {
            // @ts-ignore
            case 'CNN_One_Step':
            // @ts-ignore
            case 'CNN_MultiChannel':
                xTrainTest = xTTest
                break;
            default:
                const xTTensor = tf.tensor(xTTest)
                // @ts-ignore
                let n_input = xTTensor.shape[1] * xTTensor.shape[2]
                reshaped = xTTensor.reshape([xTTensor.shape[0], n_input])
                console.log('Eval reshaped : ', reshaped.shape)
                // @ts-ignore
                xTrainTest = reshaped.arraySync()
                break;
        }
    } else {
        xTrainTest = xTTest
    }

    let history = [xTrainTest[0]]
    let predictions = []
    let lastPrediction = []
    const updateFreq = 10 // Number of predictions to make before sending an update to the client
    try {
        for (let i = 1; i < xTrainTest.length; i++) {
            if (i % updateFreq === 0) {
                let log = {
                    batch: i,
                    totalNoOfBatch: xTrainTest.length - 1
                }
                redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'evaluating', uid, log }))
            }
            let inputHist = history.slice(-1)
            let historySequence = await forecast(trained_model_, inputHist)
            predictions.push(historySequence)
            history.push(xTrainTest[i])
        }
        console.log('predictions length : ', predictions.length)
        const lastInputHist = xTrainTest.slice(-1)
        lastPrediction = await forecast(trained_model_, lastInputHist)

        if (look_ahead === 1) {
            switch (type) {
                // @ts-ignore
                case 'CNN_One_Step':
                // @ts-ignore
                case 'CNN_MultiChannel':
                    // console.log('Last prediction', lastPrediction)
                    let yTensor = tf.tensor(yTrainTest)
                    let predTensor = tf.tensor(predictions)
                    let lastPredTensor = tf.tensor(lastPrediction)

                    // @ts-ignore
                    let transformedPredictions = predTensor.reshape([predTensor.shape[0], predTensor.shape[1], 1])

                    const overAllRMSE = sqrt(tf.losses.meanSquaredError(yTensor, transformedPredictions)).arraySync()

                    // @ts-ignore
                    let transforemdLastPrediction = lastPredTensor.reshape([lastPredTensor.shape[0], 1, 1])

                    if (config.debug_flag === 'true') {
                        console.log('Y Tensor shape : ' + yTensor.shape)
                        console.log('Predictions shape : ' + predTensor.shape)
                        console.log('New RMSE : ', overAllRMSE)
                        console.log('Last Prediction shape : ' + lastPredTensor.shape)
                        console.log('Transformed Predictions shape : ' + transformedPredictions.shape)
                        console.log('Transformed Last Prediction shape : ' + transforemdLastPrediction.shape)
                    }

                    // @ts-ignore
                    predictions = transformedPredictions.arraySync()
                    // @ts-ignore
                    lastPrediction = transforemdLastPrediction.arraySync()
                    break;
                default:
                    break;
            }
        } else {
            // let trimmedYTrainTest = yTrainTest.slice(0, -1)
            let trimmedPredictions = predictions.slice(0, -(look_ahead - 1))

            let yTensor = tf.tensor(yTrainTest)
            let predTensor = tf.tensor(trimmedPredictions)

            const overAllRMSE = sqrt(tf.losses.meanSquaredError(yTensor, predTensor)).arraySync()

            if (config.debug_flag === 'true') {
                console.log('Lookahead > 1 : ', yTensor.shape, predTensor.shape)
                console.log('New RMSE : ', overAllRMSE)
            }
        }


        // console.log('Predictions : ', predictions.slice(-10))
        // console.log('Ytrain test : ', yTrainTest.slice(-10))

        let [score, scores] = evaluateForecast(yTrainTest, predictions)
        redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'eval_complete', uid, scores: { rmse: score, scores: scores } }))

        if (config.debug_flag === 'true') {
            log.notice(`xTrain test length : ${xTrainTest.length}, yTrain test length : ${yTrainTest.length}`)
            if (look_ahead !== 1) {
                displayDataInTable(xTrainTest[xTrainTest.length - 1], 'xTrainTest last element')
            } else {
                console.log('xTrainTest last element', xTrainTest[xTrainTest.length - 1][0])
            }
            console.log(yTrainTest.length, predictions.length)
            console.log('RMSE: ', score)
            // @ts-ignore
            console.log('MSE: ', (score * score))
            summarizeScores('LSTM', score, scores)
        }

        let finalData = {
            dates: dates,
            predictions_array: predictions,
            forecast: lastPrediction,
            label_mean: label_mean[e_key],
            label_variance: label_variance[e_key],
            mean_array: label_mean,
            variance_array: label_variance,
        }

        RedisUtil.saveTestPredictions(model_id, finalData)
        // redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'prediction_completed', uid, id: model_id }))
    } catch (error) {
        console.log(error)
    }
}

const forecast = async (model, inputHistory) => {
    const inputHistoryTensor = tf.tensor(inputHistory)
    // console.log('Forecast Shape : ', inputHistoryTensor.shape)
    const forecast = await model.predict(inputHistoryTensor)
    return forecast.arraySync()[0]
}

const evaluateForecast = (actual, predicted) => {
    // console.log(actual[0], predicted[0])
    let scores = [];
    // Calculate an RMSE score for each day
    for (let i = 0; i < actual[0].length; i++) {
        let mse = actual.map((a, idx) => (a[i] - predicted[idx][i]) ** 2)
            .reduce((a, b) => a + b, 0) / actual.length;
        let rmse = Math.sqrt(mse);
        scores.push(rmse);
    }
    // Calculate overall RMSE
    let s = actual.flatMap((a, idx) => a.map((val, j) => (val - predicted[idx][j]) ** 2))
        .reduce((a, b) => a + b, 0);
    let score = Math.sqrt(s / (actual.length * actual[0].length));
    return [score, scores];
}

const summarizeScores = (name, score, scores) => {
    let s = scores.map(x => x.toFixed(2)).join(',');
    console.log(`${name}: [${score.toFixed(2)}] ${s}`);
}


const saveModel = async (model, model_id) => {
    await model.save(`file://./models/${model_id}`).then((res) => {
        log.info('Model saved successfully')
        // console.log(res)
    });
}

const loadModel = async (model_id) => {
    log.info('Loading model from saved file')
    let model = null;
    try {
        model = await tf.loadLayersModel(`file://./models/${model_id}/model.json`)
    } catch (error) {
        model = null
        throw error
    }
    return model
}

const disposeModel = (model) => {
    model.dispose()
}

const makePredictions = async (model, xTest, forecastData) => {
    const xTestTensor = tf.tensor(xTest)
    const predictions = await model.predict(xTestTensor);

    const forecastTensor = tf.tensor(forecastData)
    const forecast = await model.predict(forecastTensor)

    console.log(forecastTensor.shape)

    // @ts-ignore
    return [predictions.arraySync(), forecast.arraySync()]
}

module.exports = {
    createModel,
    trainModel,
    evaluateModelOnTestSet,
    summarizeScores,
    saveModel,
    loadModel,
    disposeModel,
    makePredictions,
}