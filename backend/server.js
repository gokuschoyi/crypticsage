const express = require('express');
var cors = require('cors')
const bodyParser = require('body-parser');
const logger = require('./middleware/logger/Logger');
const config = require('./config');
const verify = require('./routes/auth/verifyToken');
const contentManager = require('./routes/content/contentManager');
const user = require('./routes/user/user');

const app = express();

const authentication = require('./routes/auth/authRoute')
const fetchCryptoData = require('./utils/crypto/fetchCryptoData');

const log = (req, res, next) => {
    console.log('_____________________________________________________');
    next();
}

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cors({ origin: ['https://crypticsage.netlify.app', 'https://localhost:3001'], credentials: true }))
app.use(bodyParser.json());
app.use(logger)
app.use(log);

app.post('/', verify, (req, res) => {
    console.log('Verify request received');
    res.status(200).json({ message: "Verified" });
})

app.use('/auth', authentication);

app.use('/crypto', fetchCryptoData);

app.use('/content', contentManager);

app.use('/user', user);

app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
});