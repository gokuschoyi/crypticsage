const { WebSocketServer } = require('ws');
const Redis = require("ioredis");
const logger = require('./middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))

// Initialize a Map to track user connections
const userConnections = new Map();

// Start the WebSocket server instance
const wsServer = new WebSocketServer({ noServer: true });
const RedisUtil = require('./utils/redis_util')

// Create a single global Redis subscriber
// @ts-ignore
const redisSubscriber = new Redis();
redisSubscriber.subscribe('model_training_channel', (err) => {
    if (err) {
        console.error('Error subscribing to model_training_channel', err)
    } else {
        log.emerg('Subscribed to model_training_channel for updates.')
    }
});

redisSubscriber.on('message', async (channel, message) => {
    // console.log(`Received message from channel : ${channel}`)
    const messageData = JSON.parse(message)
    const userWS = userConnections.get(messageData.uid)
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
                console.log(messageData.id)
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
    // console.log(`Message : ${message}`)
})

wsServer.on('connection', function connection(ws, req) {
    // @ts-ignore
    const params = new URLSearchParams(req.url.replace('/?', ''));
    let user_id = params.get('user_id')
    log.emerg(`Connection request from : ${user_id}`)

    const existingConnection = userConnections.get(user_id);
    if (existingConnection && existingConnection !== ws) {
        log.emerg('Existing WS connection found for user. Closing it.')
        existingConnection.close()
    }

    userConnections.set(user_id, ws);
    ws.send(JSON.stringify({ action: 'connected' }));
    log.emerg(`WS connection established for : ${user_id}`)

    console.log('Websocket : ', userConnections.size)

    ws.on('message', async function incoming(message) {
        // @ts-ignore
        const data = JSON.parse(message);
        log.emerg(`Received from client : ${JSON.stringify(data)}`);
    });

    ws.on('close', function close() {
        log.emerg(`WS connection closed for : ${user_id}`)
    });
});

module.exports = { wsServer }