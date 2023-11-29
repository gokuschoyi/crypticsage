const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))
const tf = require('@tensorflow/tfjs-node');
const cliProgress = require('cli-progress');
const RedisUtil = require('./redis_util')
const config = require('../config')
const Redis = require("ioredis");
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

const type = 'CNN_One_Step'

/**
 * Creates a model with the given parameters
 * @param {Object} model_parama
 * @param {String} model_parama.model_type
 * @param {Number} model_parama.input_layer_shape
 * @param {Number} model_parama.look_ahead
 * @param {Number} model_parama.feature_count
 * @param {Number} model_parama.input_layer_neurons
 * @param {Number} model_parama.rnn_output_neurons
 * @param {Number} model_parama.output_layer_neurons
 * @param {Number} model_parama.n_layers 
 * @returns {tf.Sequential} model - A tensorflow model of type {@link tf.Sequential}
 */
const createModel = (model_parama) => {
    const {
        model_type,
        input_layer_shape,
        look_ahead,
        feature_count,
        input_layer_neurons,
        rnn_output_neurons,
        output_layer_neurons,
        n_layers
    } = model_parama

    const model = tf.sequential();
    let lstm_cells = [];

    switch (model_type) {
        case 'multi_input_single_output_no_step':
        case 'multi_input_multi_output_no_step':
            // Input layer
            model.add(tf.layers.dense({ inputShape: [input_layer_shape, feature_count], units: input_layer_neurons }));
            model.add(tf.layers.reshape({ targetShape: [input_layer_shape, input_layer_neurons] }))

            for (let index = 0; index < n_layers; index++) {
                lstm_cells.push(tf.layers.lstmCell({ units: rnn_output_neurons }));
            }

            model.add(tf.layers.rnn({
                cell: lstm_cells,
                inputShape: [input_layer_shape, input_layer_neurons],
                returnSequences: false
            }));

            model.add(tf.layers.dense({ inputShape: [rnn_output_neurons], units: output_layer_neurons }));
            break;
        case 'multi_input_single_output_step':
            let lstm_units = 100;
            if (look_ahead === 1) {
                switch (type) {
                    case 'CNN_One_Step':
                        model.add(tf.layers.conv1d({
                            filters: 64,
                            kernelSize: 2,
                            activation: 'relu',
                            inputShape: [input_layer_shape, feature_count]
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

                        // Add a dense layer with n_features units (no activation specified, defaults to linear)
                        model.add(tf.layers.dense({
                            units: 1
                        }));
                        break;
                    default:
                        let n_input = input_layer_shape * feature_count
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
                /* for (let index = 0; index < n_layers; index++) {
                    lstm_cells.push(tf.layers.lstmCell({ units: rnn_output_neurons }));
                } */

                model.add(tf.layers.lstm({ units: lstm_units, activation: 'relu', inputShape: [input_layer_shape, feature_count] }));
                model.add(tf.layers.repeatVector({ n: look_ahead }));
                // model.add(tf.layers.dropout({ rate: 0.1 }));
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

// Define your early stopping callback
const earlyStopping = tf.callbacks.earlyStopping({
    monitor: 'loss',
    patience: 2,
    verbose: 2
});

const reshapeArray = (yTrain) => {
    const yTrainTensor = tf.tensor(yTrain)
    const newOuter = yTrainTensor.shape[0]
    const newMiddle = 2
    const newInner = yTrainTensor.shape[2]
    const reshapedArray = []

    console.log(newOuter, newMiddle, newInner)

    for (let i = 0; i < newOuter; i++) {
        const middleArray = [];
        for (let j = 0; j < newMiddle; j++) {
            // Duplicating the original element for each new middle element
            const innerArray = [];
            // @ts-ignore
            for (let k = 0; k < newInner; k++) {
                innerArray.push(yTrain[i][0][0]);
            }
            middleArray.push(innerArray);
        }
        reshapedArray.push(middleArray);
    }

    return reshapedArray
}

const trainModel = async ({ model, learning_rate, look_ahead, xTrain, yTrain, epochs, batch_size, uid }) => {
    const totalNoOfBatch = Math.round(xTrain.length / batch_size)
    let xTrainTensor, xTTensor
    let yTrainTensor, yTTesnor
    // const xTrainTensor = tf.tensor(xTrain)

    if (look_ahead === 1) {
        console.log('Look ahead is 1, reshaping x-train and y-train')
        switch (type) {
            case 'CNN_One_Step':
                yTTesnor = tf.tensor(yTrain)

                // @ts-ignore
                const reshapedYTensor = yTTesnor.reshape([yTTesnor.shape[0], yTTesnor.shape[1]])

                xTrainTensor = tf.tensor(xTrain)
                yTrainTensor = reshapedYTensor
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
        console.log('Look ahead is > 1')
        xTrainTensor = tf.tensor(xTrain)
        yTrainTensor = tf.tensor(yTrain)
    }

    if (config.debug_flag === 'true') {
        // @ts-ignore
        log.info(`xTrain tensor shape: ${xTrainTensor.shape}, yTrain tensor shape : ${yTrainTensor.shape}`)
    }

    model.compile({
        optimizer: tf.train.adam(),
        loss: 'meanSquaredError',
        metrics: ['mse', 'mae'],
    });

    console.log(model.summary())

    const history = await model.fit(xTrainTensor, yTrainTensor,
        {
            batchSize: batch_size,
            epochs: epochs,
            verbose: 2,
            // validationSplit: 0.1,
            callbacks: {
                earlyStopping,
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
            }
        });

    return { model, history }
}

const evaluateModelOnTestSet = async ({ trained_model_, model_id, look_ahead, xTrainTest: xTTest, yTrainTest, dates, label_mean, label_variance, uid }) => {
    let xTrainTest = []
    if (look_ahead === 1) {
        console.log('Look ahead is 1, reshaping x-train')
        let reshaped
        switch (type) {
            case 'CNN_One_Step':
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
        for (let i = 1; i < xTrainTest.length - 1; i++) {
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

        const lastInputHist = xTrainTest.slice(-1)
        lastPrediction = await forecast(trained_model_, lastInputHist)

        if (look_ahead === 1) {
            // console.log('Last prediction', lastPrediction)
            let predTensor = tf.tensor(predictions)
            let lastPredTensor = tf.tensor(lastPrediction)
            // @ts-ignore
            let transformedPredictions = predTensor.reshape([predTensor.shape[0], predTensor.shape[1], 1])
            console.log('Transformed Predictions shape : ' + transformedPredictions.shape)
            // @ts-ignore
            let transforemdLastPrediction = lastPredTensor.reshape([lastPredTensor.shape[0], 1, 1])
            console.log('Transformed Last Prediction shape : ' + transforemdLastPrediction.shape)
            // @ts-ignore
            predictions = transformedPredictions.arraySync()
            // @ts-ignore
            lastPrediction = transforemdLastPrediction.arraySync()
        }


        // console.log('Predictions : ', predictions.slice(-10))
        // console.log('Ytrain test : ', yTrainTest.slice(-10))

        let [score, scores] = evaluateForecast(yTrainTest, predictions)
        redisPublisher.publish('model_training_channel', JSON.stringify({ event: 'eval_complete', uid, scores: { rmse: score, scores: scores } }))

        if (config.debug_flag === 'true') {
            log.notice(`xTrain test length : ${xTrainTest.length}, yTrain test length : ${yTrainTest.length}`)
            if (look_ahead !== 1) {
                displayDataInTable(xTrainTest[xTrainTest.length - 1], 'xTrainTest last element')
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
            label_mean,
            label_variance,
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