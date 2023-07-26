const { MongoClient } = require('mongodb');
const config = require('../config');

const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

// Create a connection pool for "crypticsage" database
const client = new MongoClient(config.mongoUri, mongoOptions);

// ssh -L 27017:localhost:27017 yadu@10.0.0.116 
// to link remote mongo to local instead of ssh

// Function to connect to the "crypticsage" database
const connect = async (EPMessage) => {
    try {
        await client.connect();
        const db = client.db("crypticsage");
        console.log(`Connected to MongoDB - request from ${EPMessage}`);
        return db;
    } catch (e) {
        console.log('Error connecting to MongoDB');
        console.error(e);
        throw e; // Throw the error for better error handling at the calling code
    }
}

// Function to close the connection to "crypticsage" database
const close = async (EPMessage) => {
    try {
        await client.close();
        console.log(`Disconnected from MongoDB - request from ${EPMessage}`);
    } catch (e) {
        console.log('Error disconnecting from MongoDB');
        console.error(e);
        throw e; // Throw the error for better error handling at the calling code
    }
};

// Function to connect to the "binance_historical" database
const binanceConnect = async (EPMessage) => {
    try {
        await client.connect();
        const db = client.db("binance_historical");
        console.log(`Connected to MongoDB - request from ${EPMessage}`);
        return db;
    } catch (e) {
        console.log('Error connecting to MongoDB');
        console.error(e);
        throw e; // Throw the error for better error handling at the calling code
    }
};

// Function to close the connection to the "binance_historical" database
const binanceClose = async (EPMessage) => {
    try {
        await client.close();
        console.log(`Disconnected from MongoDB - request from ${EPMessage}`);
    } catch (e) {
        console.log('Error disconnecting from MongoDB');
        console.error(e);
        throw e; // Throw the error for better error handling at the calling code
    }
};

module.exports = { connect, close, binanceConnect, binanceClose };

