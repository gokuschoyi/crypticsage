const express = require('express');
var cors = require('cors')
const { wsServer } = require('./websocket')
const bodyParser = require('body-parser');
const logger = require('./middleware/logger/Logger');
const config = require('./config');
const { verifyToken } = require('./middleware/verify-token')

const authentication = require('./routes/auth/authRoute')
const user = require('./routes/user/userRoute');
const contentManager = require('./routes/content/contentManagerRoute');
const historicalData = require('./routes/historical-data/historicalDataRoute')
const fetchCryptoData = require('./routes/crypto-stocks/cryptoStocksRoute');
const indicators = require('./routes/indicators/indicatorsRoute');

const http = require('http');
const app = express();

// const schedule = require('node-schedule');
// const job = schedule.scheduleJob('*/10 * * * * *', function () {
//     console.log('The answer to life, the universe, and everything!');
// });

const { makeAllStatusForUser } = require('./utils/user/user-util');

const log = (req, res, next) => {
    console.log('_________________________REQUEST RECEIVED____________________________', req.originalUrl);
    next();
}

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({ origin: ['https://crypticsage.netlify.app', 'https://localhost:3001'], credentials: true }))
app.use(bodyParser.json());
app.use(logger)
app.use(log);

app.post('/', verifyToken, async (req, res) => {
    console.log('Verify request received');
    let dat = await makeAllStatusForUser();
    res.status(200).json({ message: "Verified", dat });
})

app.use('/auth', authentication);

app.use('/user', verifyToken, user);

app.use('/content', verifyToken, contentManager);

app.use('/historicalData', verifyToken, historicalData)

app.use('/crypto', verifyToken, fetchCryptoData)

app.use('/indicators', verifyToken, indicators);

app.listen(config.port, () => {
    console.log(`Express server listening on port ${config.port}`);
});

// Attach the WebSocket server to a separate HTTP server
const wsHttpServer = http.createServer(wsServer);
wsHttpServer.listen(config.wsPort, () => {
    console.log(`WebSocket server is running on port ${config.wsPort}`);
});

// Upgrade HTTP requests to WebSocket
wsHttpServer.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, (ws) => {
        wsServer.emit('connection', ws, request);
    });
});
