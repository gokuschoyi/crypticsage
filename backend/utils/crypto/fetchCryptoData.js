const express = require('express')
const verifyToken = require('../../routes/auth/verifyToken')
const router = express.Router()
const axios = require('axios');
const wodData = require('./wodData')
router.post('/getCryptoData', verifyToken, async (req, res) => {
    console.log("Get Crypto Data request received");
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
})

router.post('/getHistoricalData', verifyToken, async (req, res) => {
    const { tokenName, timePeriod, timeFrame } = req.body;
    let limit = 500;
    console.log("Get Historical Data request received");
    try {
        let url = `https://min-api.cryptocompare.com/data/v2/histo${timeFrame}?fsym=${tokenName}&tsym=USD&limit=${limit}&aggregate=${timePeriod}`
        const historicalData = await axios.get(url)
        res.status(200).json({ message: "Get Historical Data request success", url, historicalData: historicalData.data });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: "Get Historical Data request error" })
    }
})

router.post('/wordOfTheDay', verifyToken, async (req, res) => {
    console.log("Word of the day request received");
    let wordData = wodData[Math.floor(Math.random() * wodData.length)];
    let objectkey = Object.keys(wordData)[0];
    let word = wordData[objectkey];
    res.status(200).json({ message: "Word of the day request success", word });
})

module.exports = router