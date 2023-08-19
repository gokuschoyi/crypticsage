const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const axios = require('axios');

const fetchSymbolsFromBinanceAPI = async () => {
    try {
        const binanceURL = "https://api.binance.com/api/v3/exchangeInfo"
        const result = await axios.get(binanceURL)
        return result.data.symbols
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error(formattedError)
        throw error
    }
}

module.exports = {
    fetchSymbolsFromBinanceAPI
}