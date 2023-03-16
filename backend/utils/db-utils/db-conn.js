const { MongoClient } = require('mongodb');
const config = require('../../config');
const client = new MongoClient(config.mongoUri);

const connect = async () => {
    try {
        let db;
        let conn;
        conn = await client.connect();
        console.log('Connected to MongoDB');
        db = conn.db("crypticsage");
        return db;
    } catch (e) {
        console.log('Error connecting to MongoDB')
        console.error(e);
    }
}

const close = async () => {
    try {
        await client.close();
        console.log('Disconnected from MongoDB');
    } catch (e) {
        console.log('Error disconnecting from MongoDB')
        console.error(e);
    }
}

module.exports = { connect, close };

