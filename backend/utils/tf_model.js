const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))
const EventEmitter = require('events');
const tf = require('@tensorflow/tfjs-node');
const cliProgress = require('cli-progress');
const RedisUtil = require('./redis_util')
const config = require('../config')
const { sqrt, square } = require('@tensorflow/tfjs-core');

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
            let lstm_units = 50;

            for (let index = 0; index < n_layers; index++) {
                lstm_cells.push(tf.layers.lstmCell({ units: rnn_output_neurons }));
            }

            model.add(tf.layers.lstm({ units: lstm_units, activation: 'relu', inputShape: [input_layer_shape, feature_count] }));
            model.add(tf.layers.repeatVector({ n: look_ahead }));
            // model.add(tf.layers.dropout({ rate: 0.1 }));
            model.add(tf.layers.lstm({ units: lstm_units, activation: 'relu', returnSequences: true }));
            /* model.add(tf.layers.rnn({
                cell: lstm_cells,
                inputShape: [look_ahead, lstm_units],
                returnSequences: true
            })); */
            model.add(tf.layers.timeDistributed({ layer: tf.layers.dense({ units: 1 }), inputShape: [look_ahead, lstm_units] }));
            break;
        default:
            break;
    }

    return model
}

const eventEmitter = new EventEmitter();

const epochBeginCallback = (epoch) => {
    // console.log('Epoch Start', epoch);
    eventEmitter.emit('epochBegin', epoch)
}

const epochEndCallback = (epoch, log) => {
    // console.log('Epoch Loss', epoch, "loss: ", log.loss, "mse : ", log.mse, "mae : ", log.mae, log);
    eventEmitter.emit('epochEnd', epoch, log)
};

const batchEndCallback = (batch, log, totalNoOfBatch) => {
    // console.log(batch)
    let newLog = {
        ...log,
        totalNoOfBatch
    }
    eventEmitter.emit('batchEnd', batch, newLog)
}

const onTrainEndCallback = () => {
    // console.log('Training finished')
    eventEmitter.emit('trainingEnd')
}

// Define your early stopping callback
const earlyStopping = tf.callbacks.earlyStopping({
    monitor: 'loss',
    patience: 2,
    verbose: 2
});

const trainModel = async (model, learning_rate, xTrain, yTrain, epochs, batch_size) => {
    const totalNoOfBatch = Math.round(xTrain.length / batch_size)
    const xTrainTensor = tf.tensor(xTrain)
    const yTrainTensor = tf.tensor(yTrain)

    if (config.debug_flag === 'true') {
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
                    epochBeginCallback(epoch);
                },
                onEpochEnd: async (epoch, log) => {
                    epochEndCallback(epoch, log);
                },
                onBatchEnd: async (batch, log) => {
                    batchEndCallback(batch, log, totalNoOfBatch)
                },
                onTrainEnd: async () => {
                    onTrainEndCallback()
                }
            }
        });

    eventEmitter.removeListener('batchEnd', batchEndCallback)
    return [model, history]
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

const evaluateModelOnTestSet = async (trained_model_, model_id, xTrainTest, yTrainTest, dates, label_mean, label_variance) => {
    const bar1 = new cliProgress.SingleBar({}, cliProgress.Presets.legacy);
    let history = [xTrainTest[0]]
    let predictions = []
    let lastPrediction = []
    const updateFreq = 20 // Number of predictions to make before sending an update to the client
    try {
        bar1.start(xTrainTest.length - 1, 0);
        for (let i = 1; i < xTrainTest.length - 1; i++) {
            if (i % updateFreq === 0) {
                let log = {
                    batch: i,
                    totalNoOfBatch: xTrainTest.length - 1
                }
                eventEmitter.emit('evaluating', log)
            }
            bar1.update(i + 1);
            let inputHist = history.slice(-1)
            let historySequence = await forecast(trained_model_, inputHist)
            predictions.push(historySequence)
            history.push(xTrainTest[i])
        }
        bar1.stop();
        const lastInputHist = xTrainTest.slice(-1)

        lastPrediction = await forecast(trained_model_, lastInputHist)

        let [score, scores] = evaluateForecast(yTrainTest, predictions)
        eventEmitter.emit('eval_complete', { rmse: score, scores: scores })

        if (config.debug_flag === 'true') {
            log.notice(`xTrain test length : ${xTrainTest.length}, yTrain test length : ${yTrainTest.length}`)
            displayDataInTable(xTrainTest[xTrainTest.length - 1], 'xTrainTest last element')
            console.log(yTrainTest.length, predictions.length)
            console.log('RMSE: ', score, predictions.length)
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
        eventEmitter.emit('prediction_completed', model_id)
    } catch (error) {
        console.log(error)
    }
}

const summarizeScores = (name, score, scores) => {
    let s = scores.map(x => x.toFixed(2)).join(',');
    console.log(`${name}: [${score.toFixed(2)}] ${s}`);
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

const saveModel = async (model, model_id) => {
    await model.save(`file://./models/${model_id}`).then((res) => {
        model.dispose()
    });
}

const disposeModel = (model) => {
    model.dispose()
}

module.exports = {
    createModel,
    trainModel,
    evaluateModelOnTestSet,
    summarizeScores,
    makePredictions,
    saveModel,
    disposeModel,
    eventEmitter
}