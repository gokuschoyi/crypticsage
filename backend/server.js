const express = require('express');
var cors = require('cors')
const bodyParser = require('body-parser');
const logger = require('./middleware/logger/Logger');
const config = require('./config');
const verify = require('./middleware/auth/verifyToken');

const app = express();

const authentication = require('./middleware/auth/authRouter');

app.use(express.json())
app.use(cors(
    { origin: 'https://localhost:3000' }
))
app.use(bodyParser.json());
app.use(logger)

app.use('/auth', authentication);

app.post('/', verify, (req, res) => {
    console.log('Verify request received');
    var data = res.locals.data;
    res.json({ message: "POST request received", code: 200, status: 'success', data });
    console.log('Verify request sent');
})

app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
});