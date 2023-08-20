const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const axios = require('axios');

const fetchSymbolsFromBinanceAPI = async () => {
    try {
        const binanceURL = "https://api.binance.com/api/v3/exchangeInfo"
        const result = await axios.get(binanceURL)
        return result.data.symbols
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

module.exports = {
    fetchSymbolsFromBinanceAPI
}