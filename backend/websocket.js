const { WebSocketServer } = require('ws');

// Start the WebSocket server instance
const wsServer = new WebSocketServer({ noServer: true });

wsServer.on('connection', function connection(ws) {
    console.log('Connection established', wsServer.clients.size)
    ws.send('connection established');
    ws.on('error', console.error);

    ws.on('message', function message(data) {
        console.log('received: %s', data);
    });

});

module.exports = { wsServer }