const { WebSocketServer } = require('ws');
const TF_Model = require('./utils/tf_model');

// Initialize a Map to track user connections
const userConnections = new Map();

// Start the WebSocket server instance
const wsServer = new WebSocketServer({ noServer: true });
const RedisUtil = require('./utils/redis_util')

// Event handlers
const onNotify = (ws, message) => {
    if (ws) {
        ws.send(JSON.stringify({ action: 'notify', message: message }));
    }
};

const onEpochBegin = (ws, epoch) => {
    if (ws) {
        ws.send(JSON.stringify({ action: 'epochBegin', epoch: epoch }));
    }
};

const onEpochEnd = (ws, epoch, log) => {
    if (ws) {
        ws.send(JSON.stringify({ action: 'epochEnd', epoch: epoch, log: log }));
    }
};

const onBatchEnd = (ws, batch, log) => {
    if (ws) {
        ws.send(JSON.stringify({ action: 'batchEnd', batch: batch, log: log }));
    }
};

const onTrainingEnd = (ws) => {
    if (ws) {
        ws.send(JSON.stringify({ action: 'trainingEnd' }));
    }
};

const onPredictionCompleted = async (ws, id) => {
    if (ws) {
        const predictions = await RedisUtil.getTestPredictions(id);
        TF_Model.eventEmitter.removeAllListeners();
        ws.send(JSON.stringify({ action: 'prediction_completed', id: id, predictions: predictions }));
    }
};

wsServer.on('connection', function connection(ws, req) {
    ws.send(JSON.stringify({ action: 'connected' }));

    // @ts-ignore
    const params = new URLSearchParams(req.url.replace('/?', ''));
    let user_id = params.get('user_id')
    console.log('Connection received', user_id)

    const existingConnection = userConnections.get(user_id);
    if (existingConnection && existingConnection !== ws) {
        console.log('Existing user connection found. Closing it.')
        existingConnection.close()
    }

    userConnections.set(user_id, ws);

    ws.on('message', async function incoming(message) {
        // @ts-ignore
        const data = JSON.parse(message);
        console.log('Received:', data);
    });

    TF_Model.eventEmitter.on('notify', (message) => onNotify(ws, message));
    TF_Model.eventEmitter.on('epochBegin', (epoch) => onEpochBegin(ws, epoch));
    TF_Model.eventEmitter.on('epochEnd', (epoch, log) => onEpochEnd(ws, epoch, log));
    TF_Model.eventEmitter.on('batchEnd', (batch, log) => onBatchEnd(ws, batch, log));
    TF_Model.eventEmitter.on('trainingEnd', () => onTrainingEnd(ws));
    TF_Model.eventEmitter.once('prediction_completed', async (id) => onPredictionCompleted(ws, id));

    ws.on('close', function close() {
        // TF_Model.eventEmitter.removeAllListeners();
        console.log('disconnected');
    });
});

module.exports = { wsServer }