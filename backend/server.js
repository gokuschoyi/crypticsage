const express = require('express');
var cors = require('cors')
const { wsServer } = require('./websocket')
const bodyParser = require('body-parser');
const logger = require('./middleware/logger/Logger');
const logs = logger.create(__filename.slice(__dirname.length + 1))
const config = require('./config');
const { verifyToken } = require('./middleware/verify-token')

const authentication = require('./routes/authRoute')
const user = require('./routes/userRoute');
const contentManager = require('./routes/contentManagerRoute');
const historicalData = require('./routes/historicalDataRoute')
const fetchCryptoData = require('./routes/cryptoStocksRoute');
const indicator = require('./routes/indicatorsRoute')
// const indicators = require('./routes/indicators/indicatorsRoute');

const http = require('http');
const app = express();

const CMServices = require('./services/contentManagerServices')
const schedule = require('node-schedule');
const job = schedule.scheduleJob('30 10 * * *', async function () {
    logs.info(`Updating binance ticker. (Daily CRON), ${new Date()}`)
    let processIds = await CMServices.serviceUpdateAllBinanceTickers();
    logs.info(processIds);
});

const log = (req, res, next) => {
    logs.info(`_________REQUEST RECEIVED_________ ${req.originalUrl}`);
    next();
}

logs.info('Starting server...');

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({ origin: ['https://crypticsage.netlify.app', 'https://localhost:3001'], credentials: true }))
app.use(bodyParser.json());
// app.use(logger)

logger.setupAccessLog(app);
app.use(log);

const MDBServices = require('./services/mongoDBServices');
const Users = require('./services/userServices');
app.post('/test_ep', verifyToken, async (req, res) => {
    logs.info('Verify request received');
    const testRes = await Users.processGetInitialQuizDataForUser({ email: res.locals.data.email })
    res.status(200).json({ message: "Verified", data: testRes });
})

app.use('/auth', authentication);

app.use('/user', verifyToken, user);

app.use('/content', verifyToken, contentManager);

app.use('/historicalData', verifyToken, historicalData)

app.use('/crypto', verifyToken, fetchCryptoData)

app.use('/indicators', verifyToken, indicator)

// app.use('/indicators', verifyToken, indicators); // remove later

app.listen(config.port, () => {
    logs.info(`Express server listening on port ${config.port}`);
});

if (config.websocketFlag === 'true') {
    // Attach the WebSocket server to a separate HTTP server
    // @ts-ignore
    const wsHttpServer = http.createServer(wsServer);
    wsHttpServer.listen(config.wsPort, () => {
        logs.info(`WebSocket server running on port ${config.wsPort}`);
    });

    // Upgrade HTTP requests to WebSocket
    wsHttpServer.on('upgrade', (request, socket, head) => {
        // @ts-ignore
        wsServer.handleUpgrade(request, socket, head, (ws) => {
            wsServer.emit('connection', ws, request);
        });
    });
} else {
    logs.info('WebSocket flag set to false');
}
