const { redisClient } = require('../services/redis')

const { fetchTokenData } = require('../controllers/indicator-controller')


// handles caching of data from mongodb for tokens, if Exists in redis store no fetch from db, else fetch
const handleTokenRedisStorage = async (req, res, next) => {
    const { dataSource, tokenName, period } = req.body;
    const cacheKey = `${dataSource}-${tokenName}-${period}`;
    let isTokenDataAvailableInRedis = false;
    await redisClient.get(cacheKey, (error, result) => {
        if (error) {
            console.error("Error retrieving value from Redis:", error);
        } else if (result) {
            isTokenDataAvailableInRedis = true;
            // let data = JSON.parse(result);
            // console.log("Value exists in Redis store", data);
        } else {
            isTokenDataAvailableInRedis = false;
        }
    })
    if (!isTokenDataAvailableInRedis) {
        console.log("Data not in redis Store. Fetching data from MongoDB (Redis Handler)")
        let data = await fetchTokenData(dataSource, tokenName, period);
        await redisClient.set(cacheKey, JSON.stringify(data));
        redisClient.expire(cacheKey, 1800);
    } else {
        console.log("Data available in Redis Store. Skipping MongoDB fetch (Redis Handler) ")
    }
    next();
}

module.exports = {
    handleTokenRedisStorage
}