const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))
const { wsServer } = require('../websocket')
const tf = require('@tensorflow/tfjs-node');

/**
 * Creates a model with the given parameters
 * @param {Object} model_parama
 * @param {Number} model_parama.input_layer_shape
 * @param {Number} model_parama.feature_count
 * @param {Number} model_parama.input_layer_neurons
 * @param {Number} model_parama.rnn_output_neurons
 * @param {Number} model_parama.output_layer_neurons
 * @param {Number} model_parama.n_layers 
 * @returns {tf.Sequential} model - A tensorflow model of type {@link tf.Sequential}
 */
const createModel = (model_parama) => {
    const {
        input_layer_shape,
        feature_count,
        input_layer_neurons,
        rnn_output_neurons,
        output_layer_neurons,
        n_layers
    } = model_parama

    const model = tf.sequential();

    // Input layer
    model.add(tf.layers.dense({ inputShape: [input_layer_shape, feature_count], units: input_layer_neurons }));
    model.add(tf.layers.reshape({ targetShape: [input_layer_shape, input_layer_neurons] }))

    let lstm_cells = [];
    for (let index = 0; index < n_layers; index++) {
        lstm_cells.push(tf.layers.lstmCell({ units: rnn_output_neurons }));
    }

    model.add(tf.layers.rnn({
        cell: lstm_cells,
        inputShape: [input_layer_shape, input_layer_neurons],
        returnSequences: false
    }));

    model.add(tf.layers.dense({ inputShape: [rnn_output_neurons], units: output_layer_neurons }));

    return model
}

const trainModel = async (model, xTrain, yTrain, epochs, batch_size) => {
    const callback = (epoch, log) => {
        console.log('Epoch Loss', epoch, "loss: ", log.loss, "mse : ", log.mse, "mae : ", log.mae,);
    };

    const xTrainTensor = tf.tensor(xTrain)
    const yTrainTensor = tf.tensor(yTrain)
    console.log('xTrain tensor shape: ', xTrainTensor.shape, 'yTrain tensor shape', yTrainTensor.shape)

    model.compile({
        optimizer: tf.train.adam(),
        loss: 'meanSquaredError',
        metrics: ['mse', 'mae'],
    });

    console.log(model.summary())

    await model.fit(xTrainTensor, yTrainTensor,
        {
            batchSize: batch_size, epochs: epochs, callbacks: {
                onEpochEnd: async (epoch, log) => {
                    callback(epoch, log);
                },
                onBatchEnd: async (batch, log) => {
                    console.log('Loss: ' + log.loss.toFixed(5), batch)
                },
            }
        });

    return model
}

const makePredictions = async (model, xTest) => {
    const xTestTensor = tf.tensor(xTest)
    const predictions = await model.predict(xTestTensor);
    // @ts-ignore
    return predictions.arraySync()
}

const disposeModel = (model) => {
    model.dispose()
}

module.exports = {
    createModel,
    trainModel,
    makePredictions,
    disposeModel
}