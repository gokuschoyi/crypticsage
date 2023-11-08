const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))
const EventEmitter = require('events');
const tf = require('@tensorflow/tfjs-node');
const { sqrt, square } = require('@tensorflow/tfjs-core');

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

    switch (model_type) {
        case 'multi_input_single_output_no_step':
        case 'multi_input_multi_output_no_step':
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
            break;
        case 'multi_input_single_output_step':
            model.add(tf.layers.lstm({ units: 50, activation: 'relu', inputShape: [input_layer_shape, feature_count] }));
            model.add(tf.layers.repeatVector({ n: look_ahead }));
            model.add(tf.layers.lstm({ units: 50, activation: 'relu', returnSequences: true }));
            model.add(tf.layers.timeDistributed({ layer: tf.layers.dense({ units: 1 }), inputShape: [look_ahead, 50] }));
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

const batchEndCallback = (batch, log) => {
    // console.log(batch)
    eventEmitter.emit('batchEnd', batch, log)
}

const onTrainEndCallback = () => {
    // console.log('Training finished')
    eventEmitter.emit('trainingEnd')
}

const trainModel = async (model, model_type, xTrain, yTrain, epochs, batch_size) => {
    const xTrainTensor = tf.tensor(xTrain)
    const yTrainTensor = tf.tensor(yTrain)
    /* const feature_count = xTrain[0][0].length;
    let yTrainData = tf.tensor(yTrain)
    let yTrainTensor = null
    if (model_type === 'multi_input_single_output_step') {
        yTrainTensor = tf.reshape(yTrainData.shape[0], yTrainData.shape[1], 2)
    } else {
        yTrainTensor = yTrainData
    } */
    log.info(`xTrain tensor shape: ${xTrainTensor.shape}, yTrain tensor shape : ${yTrainTensor.shape}`)

    model.compile({
        optimizer: tf.train.adam(),
        loss: 'meanSquaredError',
        metrics: ['mse', 'mae'],
    });

    console.log(model.summary())

    await model.fit(xTrainTensor, yTrainTensor,
        {
            batchSize: batch_size,
            epochs: epochs,
            verbose: 1,
            callbacks: {
                onEpochBegin: async (epoch) => {
                    epochBeginCallback(epoch);
                },
                onEpochEnd: async (epoch, log) => {
                    epochEndCallback(epoch, log);
                },
                onBatchEnd: async (batch, log) => {
                    batchEndCallback(batch, log)
                },
                onTrainEnd: async () => {
                    onTrainEndCallback()
                }
            }
        });

    eventEmitter.removeListener('batchEnd', batchEndCallback)
    return model
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
        console.log('Model saved')
        model.dispose()
    });
}

const disposeModel = (model) => {
    model.dispose()
}

module.exports = {
    createModel,
    trainModel,
    makePredictions,
    saveModel,
    disposeModel,
    eventEmitter
}