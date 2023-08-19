const { WebSocketServer } = require('ws');

const CMServices = require('./services/contentManagerServices')

// Start the WebSocket server instance
const wsServer = new WebSocketServer({ noServer: true });

wsServer.on('connection', function connection(ws) {
    console.log('WS : UPDATE 1 BINANCE TICKER : CONNECTION ESTABLISHED', wsServer.clients.size)

    ws.on('message', async (message) => {
        const parsedMessage = JSON.parse(message);
        console.log("WS ACTION : ",parsedMessage.action)

        if (parsedMessage.action === 'startCheckJobStatus') {
            const { jobIds, type } = parsedMessage.data;
            console.time('serviceCheckOneBinanceTickerJobCompletition')
            const statusUpdates = await CMServices.serviceCheckOneBinanceTickerJobCompletition({ jobIds, type })
            console.timeEnd('serviceCheckOneBinanceTickerJobCompletition')
            // Send status updates to the client
            ws.send(JSON.stringify(statusUpdates));
        }
    });
});

/* wsServer.on('connection', function connection(ws) {
    console.log('WS : UPDATE 1 BINANCE TICKER : CONNECTION ESTABLISHED', wsServer.clients.size)
 
    ws.on('message', async (message) => {
        const parsedMessage = JSON.parse(message);
 
        if (parsedMessage.action === 'startCheckJobStatus') {
 
            const interval = setInterval(async () => {
                const { jobIds, type } = parsedMessage.data;
                const statusUpdates = await CMServices.serviceCheckOneBinanceTickerJobCompletition({ jobIds, type })
 
                const jobstatus = statusUpdates.data
 
                // Send status updates to the client
                ws.send(JSON.stringify(statusUpdates));
 
 
                // console.log('jobstatus', jobstatus)
                // Check if all jobs are completed
                const allJobsCompleted = jobstatus.every(update => update.completed);
                if (allJobsCompleted) {
                    clearInterval(interval); // Stop sending updates
                }
            }, 1000); // Adjust the interval as needed
        }
    });
}); */

/* wsServer.on('connection', function connection(ws) {
    console.log('WS CONNECTION ESTABLISHED', wsServer.clients.size)
 
    ws.on('message', async function message(data) {
        async function processMessage() {
            let parsedData = JSON.parse(data);
            let status = await CMServices.serviceCheckOneBinanceTickerJobCompletition({ jobIds: parsedData.jobIds, type: parsedData.type });
            ws.send(JSON.stringify(status));
        }
 
        await processMessage();
    });
 
    ws.on('error', console.error);
}); */

module.exports = { wsServer }