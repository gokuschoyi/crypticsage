const log = require('../middleware/logger/Logger').create(__filename.slice(__dirname.length + 1))
const config = require('../config');
const Redis = require("ioredis");
// Create a Redis connection
const connectionOptions = {
    host: config.redis_host,
    port: config.redis_port,
    maxRetriesPerRequest: null,
    reconnectOnError: null,
    retryStrategy: function () {
        return 'stop'
    }
};

// Create a Redis client
let redisClient

try {
    redisClient = new Redis(connectionOptions);

    redisClient.on('error', (err) => {
        log.info('Something went wrong, Redis server not running ' + err);
    });

    redisClient.once('ready', () => {
        log.info('Redis server running on port ' + config.redis_port);
    });

} catch (err) {
    log.error("Error creating Redis client: ", err.message)
    throw new Error("Error creating Redis client: ", err.message)
}


// const redisClient = new Redis(connectionOptions);

module.exports = { redisClient }