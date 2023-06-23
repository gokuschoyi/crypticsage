const { MongoClient } = require('mongodb');
const config = require('../config');
const client = new MongoClient(config.mongoUri);

// ssh -L 27017:localhost:27017 yadu@10.0.0.121 
// to link remote mongo to local instead of ssh

const connect = async (EPMessage) => {
    try {
        let db;
        let conn;
        conn = await client.connect();
        console.log(`Connected to MongoDB - request from ${EPMessage}` );
        db = conn.db("crypticsage");
        return db;
    } catch (e) {
        console.log('Error connecting to MongoDB')
        console.error(e);
    }
}

const close = async (EPMessage) => {
    try {
        await client.close();
        console.log(`Disconnected from MongoDB - request from ${EPMessage}`);
    } catch (e) {
        console.log('Error disconnecting from MongoDB')
        console.error(e);
    }
}

module.exports = { connect, close };

