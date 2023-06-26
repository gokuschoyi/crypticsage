const express = require('express');
var cors = require('cors')
const { wsServer } = require('./websocket')
const bodyParser = require('body-parser');
const logger = require('./middleware/logger/Logger');
const config = require('./config');

const verify = require('./routes/auth/verifyToken');
const authentication = require('./routes/auth/authRoute')
const contentManager = require('./routes/content/contentManagerRoute');
const fetchCryptoData = require('./routes/crypto-stocks/cryptoStocksRoute');
const fetchIndicators = require('./routes/indicators/indicatorsRoute');
const user = require('./routes/user/userRoute');

const http = require('http');
const app = express();

// const schedule = require('node-schedule');
// const job = schedule.scheduleJob('*/10 * * * * *', function () {
//     console.log('The answer to life, the universe, and everything!');
// });

const { makeAllStatusForUser } = require('./utils/helpers');

const log = (req, res, next) => {
    console.log('_________________________REQUEST RECEIVEDD____________________________');
    next();
}

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({ origin: ['https://crypticsage.netlify.app', 'https://localhost:3001'], credentials: true }))
app.use(bodyParser.json());
app.use(logger)
app.use(log);

app.post('/', verify, async (req, res) => {
    console.log('Verify request received');
    let dat = await makeAllStatusForUser();
    res.status(200).json({ message: "Verified", dat });
})

app.use('/auth', authentication);

app.use('/crypto', fetchCryptoData);

app.use('/indicators', fetchIndicators);

app.use('/content', contentManager);

app.use('/user', user);

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
