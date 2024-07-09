const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const { MongoClient } = require('mongodb');
const config = require('../config');

const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

// Create a connection pool for "crypticsage" database
const mongoUri = config.mongoUri ?? '';
let client;

// ssh -L 27017:localhost:27017 yadu@10.0.0.116 
// to link remote mongo to local instead of ssh

const connectToDatabase = async () => {
    if (!client) {
        try {
            client = await MongoClient.connect(mongoUri);
            log.crit(`Connected to Mongo database : 27017 (DB-CONN)`);
        } catch (error) {
            log.error(error.stack);
            throw error;
        }
    }
    return client;
};

module.exports = { connectToDatabase };

