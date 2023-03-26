const express = require('express')
const verifyToken = require('../../routes/auth/verifyToken')
const router = express.Router()
const axios = require('axios');

router.post('/getCryptoData', verifyToken, async (req, res) => {
    console.log("Get Crypto Data request received");
    try {
        const cryptoData = await axios.get('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=ethereum,bitcoin,tether,wbnb,wrapped-usdc,binance-peg-xrp,binance-peg-cardano,binance-peg-dogecoin,wmatic,solana&per_page=100&page=1&sparkline=false')
        var filteredCryptoData = cryptoData.data.map((crypto) => {
            return {
                id: crypto.id,
                symbol: crypto.symbol,
                name: crypto.name,
                image_url: crypto.image,
                current_price: crypto.current_price,
                market_cap_rank: crypto.market_cap_rank,
                price_change_24h: crypto.price_change_24h,
                price_change_percentage_24h: crypto.price_change_percentage_24h,
                last_updated: crypto.last_updated,
                high_24h: crypto.high_24h,
                low_24h: crypto.low_24h,
            }
        })
        res.status(200).json({ message: "Get Crypto Data request success", cryptoData: filteredCryptoData });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: "Get Crypto Data request error" })
    }
})

module.exports = router