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
const client = new MongoClient(mongoUri);

// ssh -L 27017:localhost:27017 yadu@10.0.0.116 
// to link remote mongo to local instead of ssh

// Function to connect to the "crypticsage" database
const connect = async (EPMessage) => {
    try {
        await client.connect();
        const db = client.db("crypticsage");
        log.info(`Connected to MongoDB (crypticsage DB) - called from ${EPMessage}`);
        return db;
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error({ message: 'Error connection to MongoDB (crypticsage)', error: formattedError })
        throw error // Throw the error for better error handling at the calling code
    }
}

// Function to close the connection to "crypticsage" database
const close = async (EPMessage) => {
    try {
        await client.close();
        log.info(`Disconnected from MongoDB (crypticsage DB) - called from ${EPMessage}`);
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error({ message: 'Error disconnecting from MongoDB (crypticsage)', error: formattedError })
        throw error // Throw the error for better error handling at the calling code
    }
};

// Function to connect to the "binance_historical" database
const binanceConnect = async (EPMessage) => {
    try {
        await client.connect();
        const db = client.db("binance_historical");
        log.info(`Connected to MongoDB (binance_historical) - called from ${EPMessage}`);
        return db;
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error({ message: 'Error connecting to MongoDB (binance_historical)', error: formattedError })
        throw error // Throw the error for better error handling at the calling code
    }
};

// Function to close the connection to the "binance_historical" database
const binanceClose = async (EPMessage) => {
    try {
        await client.close();
        log.info(`Disconnected from MongoDB (binance_historical) - called from ${EPMessage}`);
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error({ message: 'Error disconnecting from MongoDB (binance_historical', error: formattedError })
        throw error // Throw the error for better error handling at the calling code
    }
};

module.exports = { connect, close, binanceConnect, binanceClose };

