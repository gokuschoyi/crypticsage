const express = require('express');
var cors = require('cors')
const bodyParser = require('body-parser');
const logger = require('./middleware/logger/Logger');
const config = require('./config');
const verify = require('./routes/auth/verifyToken');

const app = express();

const authentication = require('./routes/auth/authRoute')
const fetchCryptoData = require('./utils/crypto/fetchCryptoData');

app.use(express.json())
app.use(cors({ origin: 'https://localhost:3001', credentials: true }))
app.use(bodyParser.json());
app.use(logger)

app.use('/auth', authentication);

app.use('/crypto', fetchCryptoData);

app.post('/', verify, (req, res) => {
    console.log('Verify request received');
    res.status(200).json({ message: "Verified" });
})

app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
});