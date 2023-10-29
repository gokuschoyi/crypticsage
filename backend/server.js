// @ts-nocheck
const fs = require('fs');
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
const https = require('https');
const app = express();

const CMServices = require('./services/contentManagerServices')
const CSUtil = require('./utils/cryptoStocksUtil');
const schedule = require('node-schedule');

const binance_ticker_fetch_rule = new schedule.RecurrenceRule();
binance_ticker_fetch_rule.hour = 7;
binance_ticker_fetch_rule.minute = 0;
binance_ticker_fetch_rule.second = 0;

const yf_metadata_update_rule = new schedule.RecurrenceRule();
yf_metadata_update_rule.hour = 7;
yf_metadata_update_rule.minute = 5;
yf_metadata_update_rule.second = 0;

const log = (req, res, next) => {
    logs.info(`_________REQUEST RECEIVED_________ ${req.originalUrl}`);
    next();
}

logs.info('Starting server...');

if (config.schedulerFlag === 'true') {
    logs.info('Starting scheduled Crypto update...')
    const job = schedule.scheduleJob(binance_ticker_fetch_rule, async function () {
        logs.info(`Updating binance ticker. (Daily CRON), ${new Date()}`)
        let processIds = await CMServices.serviceUpdateAllBinanceTickers();
        logs.info(processIds);
    });

    schedule.scheduleJob(yf_metadata_update_rule, async function () {
        logs.info(`Updating yfinance metadata. (Daily CRON), ${new Date()}`)
        await CSUtil.yFinance_metaData_updater()
    })

} else {
    logs.info('Scheduler flag set to false, Change in env to enable scheduler');
}

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({ origin: ['https://crypticsage.netlify.app', 'https://crypticsagev.netlify.app', 'https://localhost:3001'], credentials: true }))
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

if (config.https_flag === 'true') {
    https
        .createServer({
            key: fs.readFileSync('./ssl/localhost-key.pem'),
            cert: fs.readFileSync('./ssl/localhost.pem')
        }, app)
        .listen(config.port, () => {
            logs.info(`Express server listening on port : ${config.port}, HTTPS`);
        })
} else {
    app.listen(config.port, () => {
        logs.info(`Express server listening on port : ${config.port}, HTTP`);
    });
}

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
