const Redis = require("ioredis");
// Create a Redis connection
const connectionOptions = {
    host: 'localhost',
    port: 6379,
    maxRetriesPerRequest: null,
};

// Create a Redis client
const client = new Redis(connectionOptions);

module.exports = { client }