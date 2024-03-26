const log = require('../middleware/logger/Logger').create(__filename.slice(__dirname.length + 1))
const { redisClient } = require('../services/redis')
const config = require('../config')
const { fetchTickerHistDataBasedOnCount } = require('../services/mongoDBServices')


// handles caching of data from mongodb for tokens, if Exists in redis store no fetch from db, else fetch
const handleTokenRedisStorage = async (req, res, next) => {
    const { asset_type, ticker_name, period, fetch_count } = req.body.payload.db_query;
    const cacheKey = `${asset_type}-${ticker_name}-${period}`;
    let isTokenDataAvailableInRedis = false;
    await redisClient.get(cacheKey, (error, result) => {
        if (error) {
            log.error(`Error retrieving value from Redis: ${error.stack}`);
        } else if (result) {
            let perviousFetch_count = JSON.parse(result).ticker_meta.fetch_count;
            if (perviousFetch_count < fetch_count) {
                log.info(`Additional fetch required. Old count : ${perviousFetch_count}, New count count : ${fetch_count} (Redis Handler)`)
                fetchTickerHistDataBasedOnCount(asset_type, ticker_name, period, fetch_count)
                    .then((data) => {
                        let finalData = {
                            data: data,
                            ticker_meta: { asset_type, ticker_name, period, fetch_count }
                        }
                        log.info(`Updating Redis store with count : ${fetch_count}`);
                        redisClient.set(cacheKey, JSON.stringify(finalData));
                        redisClient.expire(cacheKey, 1800);
                        isTokenDataAvailableInRedis = true;
                    })
            } else {
                isTokenDataAvailableInRedis = true;
                log.info(`Data exists in Redis store with count : ${perviousFetch_count}`);
            }
        } else {
            isTokenDataAvailableInRedis = false;
        }
    })
    if (!isTokenDataAvailableInRedis) {
        log.info("Fetching data from MongoDB (Redis Handler)")
        let data = await fetchTickerHistDataBasedOnCount(asset_type, ticker_name, period, fetch_count);
        let finalData = {
            data: data,
            ticker_meta: { asset_type, ticker_name, period, fetch_count }
        }
        await redisClient.set(cacheKey, JSON.stringify(finalData));
        redisClient.expire(cacheKey, 1800);
    } else {
        log.info("Skipping MongoDB fetch or additional fetch (Redis Handler)")
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
                log.info(`Fetching from Redis store`);
                resolve(data)
            } else {
                log.warn('Data does not exist in Redis store');
                resolve(null)
            }
        })
    })
}

const saveTestPredictions = (id, finalData) => {
    return new Promise((resolve, reject) => {
        redisClient.set(id, JSON.stringify(finalData));
        redisClient.expire(id, 4 * 1800);
    })
}

const getTestPredictions = (id, type) => {
    if (type === 'LSTM') { // fetch from redis bassed on model type
        return new Promise((resolve, reject) => {
            redisClient.get(id, (error, result) => {
                if (error) {
                    log.error('Error retrieving predictions from Redis')
                    log.error(error.stack);
                    reject(error)
                } else if (result) {
                    if (config.debug_flag === 'true') {
                        log.info(`Fetching predictions from Redis store`);
                    }
                    let data = JSON.parse(result);
                    resolve(data)
                } else {
                    log.warn('Predictions does not exist in Redis store');
                    resolve(null)
                }
            })
        })
    } else {
        return new Promise((resolve, reject) => {
            redisClient.hmget(id, 'predictions', 'forecast_rmse', (error, result) => {
                if (error) {
                    log.error('Error retrieving predictions from Redis')
                    log.error(error.stack);
                    reject(error)
                } else if (result) {
                    if (config.debug_flag === 'true') {
                        log.info(`Fetching predictions from Redis store`);
                    }
                    let data = {
                        predictions: result[0] ? JSON.parse(result[0]) : null,
                        rmse: result[1] ? JSON.parse(result[1]) : null,
                    };
                    resolve(data)
                } else {
                    log.warn('Predictions does not exist in Redis store');
                    resolve(null)
                }
            })
        })
    }
}

module.exports = {
    handleTokenRedisStorage,
    getValuesFromRedis,
    saveTestPredictions,
    getTestPredictions
}