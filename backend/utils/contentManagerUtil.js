const axios = require('axios');

const fetchSymbolsFromBinanceAPI = async () => {
    try {
        const binanceURL = "https://api.binance.com/api/v3/exchangeInfo"
        const result = await axios.get(binanceURL)
        return result.data.symbols
    } catch (error) {
        console.log(error)
        throw new Error(error)
    }
}

module.exports = {
    fetchSymbolsFromBinanceAPI
}