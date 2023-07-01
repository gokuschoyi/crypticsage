const axios = require('axios');
const wodData = require('./wodData')
const { getYfinanceQuotes } = require('./cryptoHelper')

const getCryptoData = async (req, res) => {
    try {
        const cryptoData = await axios.get('https://min-api.cryptocompare.com/data/top/mktcapfull?limit=20&tsym=USD')
        var filteredCryptoData = cryptoData.data.Data.map((crypto, index) => {
            return {
                id: crypto.CoinInfo.Id,
                symbol: crypto.CoinInfo.Name,
                name: crypto.CoinInfo.FullName,
                image_url: `https://www.cryptocompare.com${crypto.CoinInfo.ImageUrl}`,
                current_price: crypto.RAW.USD.PRICE,
                market_cap_rank: index + 1,
                price_change_24h: crypto.RAW.USD.CHANGE24HOUR,
                price_change_percentage_24h: crypto.RAW.USD.CHANGEPCT24HOUR,
                last_updated: crypto.RAW.USD.LASTUPDATE,
                high_24h: crypto.RAW.USD.HIGH24HOUR,
                low_24h: crypto.RAW.USD.LOW24HOUR,
            }
        })
        res.status(200).json({ message: "Get Crypto Data request success", cryptoData: filteredCryptoData });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: "Get Crypto Data request error" })
    }
}

const getHistoricalData = async (req, res) => {
    const { tokenName, timePeriod, timeFrame } = req.body;
    let limit = 700;
    try {
        let url = `https://min-api.cryptocompare.com/data/v2/histo${timeFrame}?fsym=${tokenName}&tsym=USD&limit=${limit}`
        const historicalData = await axios.get(url)
        res.status(200).json({ message: "Get Historical Data request success", url, historicalData: historicalData.data });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: "Get Historical Data request error" })
    }
}

const getLatestCryptoData = async (req, res) => {
    try {
        const url = "https://min-api.cryptocompare.com/data/top/mktcapfull?limit=20&tsym=USD"
        let latestTokenData = await axios.get(url)
        latestTokenData = latestTokenData.data

        let cryptoData = latestTokenData.Data.map((token, index) => {
            let fdMKCap = token.CoinInfo.MaxSupply * token.RAW.USD.PRICE
            return {
                market_cap_rank: index + 1,
                id: token.CoinInfo.Id,
                symbol: token.CoinInfo.Name,
                name: token.CoinInfo.FullName,
                image_url: `https://www.cryptocompare.com${token.CoinInfo.ImageUrl}`,
                market_cap: token.RAW.USD.MKTCAP,
                fd_market_cap: fdMKCap > 0 ? fdMKCap : token.RAW.USD.MKTCAP,
                current_price: token.RAW.USD.PRICE,
                supply: token.RAW.USD.SUPPLY,
                max_supply: token.CoinInfo.MaxSupply,
                last_updated: token.RAW.USD.LASTUPDATE,
                median: token.RAW.USD.MEDIAN,
                change_24_hrs: token.RAW.USD.CHANGE24HOUR,
                change_percentage_24_hrs: token.RAW.USD.CHANGEPCT24HOUR,
                change_day: token.RAW.USD.CHANGEDAY,
                change_percentage_day: token.RAW.USD.CHANGEPCTDAY,
                high_24h: token.RAW.USD.HIGH24HOUR,
                low_24h: token.RAW.USD.LOW24HOUR,
            }
        })
        res.status(200).json({ message: "Get Latest Token Data request success", cryptoData });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: "Get Latest Token Data request error" })
    }
}

const getLatestStocksData = async (req, res) => {
    try {
        // 'AAPL','GOOG','MSFT','IBM','AMZN','ORCL','INTC','QCOM','CSCO','SAP','TSM','BIDU','EMC','HPQ','TXN','ERIC','ASML','YHOO'
        const yFSymbols = ['AAPL','GOOG','MSFT','IBM','AMZN']
        let yFData = await getYfinanceQuotes(yFSymbols)
        res.status(200).json({ message: "Get Latest Stocks Data request success", yFData });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: "Get Latest Stocks Data request error" })
    }
}

const wordOfTheDay = async (req, res) => {
    let wordData = wodData[Math.floor(Math.random() * wodData.length)];
    let objectkey = Object.keys(wordData)[0];
    let word = wordData[objectkey];
    res.status(200).json({ message: "Word of the day request success", word });
}

module.exports = {
    getCryptoData,
    getHistoricalData,
    getLatestCryptoData,
    getLatestStocksData,
    wordOfTheDay,
}