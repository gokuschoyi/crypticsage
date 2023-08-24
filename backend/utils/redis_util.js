const log = require('../middleware/logger/Logger').create(__filename.slice(__dirname.length + 1))
const { redisClient } = require('../services/redis')

const { processFetchTickerDataFromDb } = require('../services/cryptoStocksServices')


// handles caching of data from mongodb for tokens, if Exists in redis store no fetch from db, else fetch
const handleTokenRedisStorage = async (req, res, next) => {
    const { asset_type, ticker_name, period, page_no, items_per_page } = req.body;
    const cacheKey = `${asset_type}-${ticker_name}-${period}-${page_no}-${items_per_page}`;
    let isTokenDataAvailableInRedis = false;
    await redisClient.get(cacheKey, (error, result) => {
        if (error) {
            log.error(`Error retrieving value from Redis: ${error.stack}`);
        } else if (result) {
            isTokenDataAvailableInRedis = true;
            // let data = JSON.parse(result);
            // log.info(`Value exists in Redis store : ${data}`);
        } else {
            isTokenDataAvailableInRedis = false;
        }
    })
    if (!isTokenDataAvailableInRedis) {
        log.info("Data not in redis Store. Fetching data from MongoDB (Redis Handler)")
        let data = await processFetchTickerDataFromDb({ asset_type, ticker_name, period, page_no, items_per_page });
        await redisClient.set(cacheKey, JSON.stringify(data));
        redisClient.expire(cacheKey, 1800);
    } else {
        log.info("Data available in Redis Store. Skipping MongoDB fetch (Redis Handler) ")
    }
    next();
}

const getValuesFromRedis = (cacheKey) => {
    return new Promise((resolve, reject) => {
        redisClient.get(cacheKey, (error, result) => {
            if (error) {
                log.error('Error retrieving value from Redis')
                log.error(error.stack);
                reject(error)
            } else if (result) {
                let data = JSON.parse(result);
                log.info(`Data exists in Redis store`);
                resolve(data)
            } else {
                log.warn('Data does not exist in Redis store');
                resolve(null)
            }
        })
    })
}

module.exports = {
    handleTokenRedisStorage,
    getValuesFromRedis
}