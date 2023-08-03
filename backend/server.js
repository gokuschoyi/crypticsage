const express = require('express');
var cors = require('cors')
const { wsServer } = require('./websocket')
const bodyParser = require('body-parser');
const logger = require('./middleware/logger/Logger');
const config = require('./config');
const { verifyToken } = require('./middleware/verify-token')

const authentication = require('./routes/authRoute')
const user = require('./routes/userRoute');
const contentManager = require('./routes/contentManagerRoute');
const historicalData = require('./routes/historicalDataRoute')
const fetchCryptoData = require('./routes/cryptoStocksRoute');
// const indicators = require('./routes/indicators/indicatorsRoute');

const http = require('http');
const app = express();

// const schedule = require('node-schedule');
// const job = schedule.scheduleJob('*/10 * * * * *', function () {
//     console.log('The answer to life, the universe, and everything!');
// });


/* var talib = require('talib/build/Release/talib')
console.log("TALib Version: " + talib.version);

var functions = talib.functions;
var totalFunctionCount = 0;
for (i in functions) {
    totalFunctionCount++;
    
}
var funcDesc = talib.explain("ADX");
console.log(totalFunctionCount, funcDesc) */

const log = (req, res, next) => {
    const date = new Date().toLocaleString();
    console.log('_________________________REQUEST RECEIVED____________________________', req.originalUrl, " - ", date);
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
    res.status(200).json({ message: "Verified" });
})

app.use('/auth', authentication);

app.use('/user', verifyToken, user);

app.use('/content', verifyToken, contentManager);

app.use('/historicalData', verifyToken, historicalData)

app.use('/crypto', verifyToken, fetchCryptoData)

// app.use('/indicators', verifyToken, indicators); // remove later

app.listen(config.port, () => {
    console.log(`Express server listening on port ${config.port}`);
});

// Attach the WebSocket server to a separate HTTP server
const wsHttpServer = http.createServer(wsServer);
wsHttpServer.listen(config.wsPort, () => {
    console.log(`WebSocket server running on port ${config.wsPort}`);
});

// Upgrade HTTP requests to WebSocket
wsHttpServer.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, (ws) => {
        wsServer.emit('connection', ws, request);
    });
});
