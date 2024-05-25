const { WebSocketServer } = require('ws');
const Redis = require("ioredis");
const logger = require('./middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))
const MDBS = require('./services/mongoDBServices')

// Initialize a Map to track user connections (TRAINING & UPDATES)
const userConnections = new Map();
const userUpdateConnections = new Map();

// Start the WebSocket server instance
const wsServer = new WebSocketServer({ noServer: true });
const RedisUtil = require('./utils/redis_util')

// Create a single global Redis subscriber (Training)
// @ts-ignore
const redisSubscriberTraining = new Redis();
redisSubscriberTraining.subscribe('model_training_channel', (err) => {
    if (err) {
        console.error('Error subscribing to model_training_channel (TRAINING)', err)
    } else {
        log.crit('Subscribed to model_training_channel (TRAINING).')
    }
});

redisSubscriberTraining.on('message', async (channel, message) => {
    // console.log(`Received message from channel : ${channel}`)
    const messageData = JSON.parse(message)
    const userWS = userConnections.get(messageData.training_model_id)
    if (!userWS) {
        // console.log(`No WS connection found for user : ${messageData.uid}`)
        return
    }
    switch (messageData.event) {
        case 'feature_relations':
            userWS.send(JSON.stringify({ action: 'feature_relations', relations: messageData.metrics }));
            break;
        case 'notify':
            userWS.send(JSON.stringify({ action: 'notify', message: messageData.message }));
            break;
        case 'epochBegin':
            userWS.send(JSON.stringify({ action: 'epochBegin', epoch: messageData.epoch }));
            break;
        case 'epochEnd':
            userWS.send(JSON.stringify({ action: 'epochEnd', epoch: messageData.epoch, log: messageData.log }));
            break;
        case 'batchEnd':
            userWS.send(JSON.stringify({ action: 'batchEnd', batch: messageData.batch, log: messageData.log }));
            break;
        case 'trainingEnd':
            userWS.send(JSON.stringify({ action: 'trainingEnd' }));
            break;
        case 'evaluating':
            userWS.send(JSON.stringify({ action: 'evaluating', log: messageData.log }));
            break;
        case 'eval_complete':
            userWS.send(JSON.stringify({ action: 'eval_complete', scores: messageData.scores }));
            break
        case 'intermediate_forecast':
            userWS.send(JSON.stringify({ action: 'intermediate_forecast', forecast: messageData.intermediate_forecast, rmse: messageData.rmse, epoch: messageData.epoch }));
            break;
        case 'prediction_completed':
            if (messageData.model === 'WGAN-GP') {
                // console.log(messageData.id)
                const [uid, model_id] = messageData.id.split('_')
                const prediction_completed_time = new Date().getTime()

                const cache_result = await RedisUtil.getWGANTrainingResult(messageData.id)
                let f_result = {};
                if (cache_result !== null) {
                    const keys = Object.keys(cache_result)
                    // console.log('Keys : ', keys)
                    keys.forEach(key => {
                        f_result[key] = JSON.parse(cache_result[key])
                    })
                    delete f_result.features
                    delete f_result.dates
                    delete f_result.training_parameters
                    await MDBS.update_inProgressModel(uid, model_id, prediction_completed_time, f_result)
                }

                const type = messageData.model
                const predictions_data = await RedisUtil.getTestPredictions(messageData.id, type);
                userWS.send(JSON.stringify({ action: 'prediction_completed', id: messageData.id, model_type: "WGAN-GP", predictions: predictions_data.predictions, rmse: predictions_data.rmse }));
            } else {
                const type = 'LSTM'
                const predictions = await RedisUtil.getTestPredictions(messageData.id, type);
                userWS.send(JSON.stringify({ action: 'prediction_completed', id: messageData.id, model_type: "LSTM", predictions: predictions }));
            }
            break;
        case 'error':
            userWS.send(JSON.stringify({ action: 'error', message: messageData.message }));
            break;
        default: break;
    }
})

// Create a single global Redis subscriber (Updates)
// @ts-ignore
const redisSubscriberUpdate = new Redis();
redisSubscriberUpdate.subscribe('model_update_channel', (err) => {
    if (err) {
        console.error('Error subscribing to model_update_channel (UPDATES)', err)
    } else {
        log.crit('Subscribed to model_update_channel (UPDATES).')
    }
});

redisSubscriberUpdate.on('message', async (channel, message) => {
    // console.log(`Received message from channel : ${channel}`)
    const messageData = JSON.parse(message)
    const updateWS = userUpdateConnections.get(messageData.update_model_id)
    if (!updateWS) {
        // console.log(`No WS connection found for user : ${messageData.uid}`)
        return
    }
    switch (messageData.event) {
        case 'epochBegin':
            updateWS.send(JSON.stringify({ action: 'epochBegin', epoch: messageData.epoch, epochs: messageData.epochs }));
            break;
        case 'epochEnd':
            updateWS.send(JSON.stringify({ action: 'epochEnd', epoch: messageData.epoch, log: messageData.log }));
            break;
        case 'batchEnd':
            updateWS.send(JSON.stringify({ action: 'batchEnd', batch: messageData.batch, log: messageData.log }));
            break;
        case 'trainingEnd':
            updateWS.send(JSON.stringify({ action: 'trainingEnd' }));
            break;
        case 'prediction_completed':
            const prediction_completed_time = new Date().getTime()
            updateWS.send(JSON.stringify({ action: 'prediction_completed', model_train_end_time: prediction_completed_time }));
            break;
        case 'error':
            updateWS.send(JSON.stringify({ action: 'error', message: messageData.message }));
            break;
        default: break;
    }
})

wsServer.on('connection', function connection(ws, req) {
    // @ts-ignore
    const params = new URLSearchParams(req.url.replace('/?', ''));
    const model_id = params.get('model_id')
    const type = params.get('type')
    log.emerg(`(${type}) Connection request for model. ID : ${model_id}`)

    if (type === 'training') {
        const existingConnection = userConnections.get(model_id);
        if (existingConnection && existingConnection !== ws) {
            existingConnection.close()
        }
        userConnections.set(model_id, ws);

        ws.send(JSON.stringify({ message: 'Connected to model training channel' }));
    } else if (type === 'update') {
        const existingUpdateConnection = userUpdateConnections.get(model_id);
        if (existingUpdateConnection && existingUpdateConnection !== ws) {
            existingUpdateConnection.close()
        }
        userUpdateConnections.set(model_id, ws);

        ws.send(JSON.stringify({ message: 'Connected to model update channel' }));
    }

    log.emerg(`(${type}) WS connection established for model. ID : ${model_id}`)

    ws.on('message', async function incoming(message) {
        // @ts-ignore
        const data = JSON.parse(message);
        log.emerg(`(${type}) Received from client : ${data.message}`);
    });

    ws.on('close', function close() {
        log.emerg(`(${type}) WS connection closed for model. ID : ${model_id}`)
    });
});

module.exports = { wsServer }