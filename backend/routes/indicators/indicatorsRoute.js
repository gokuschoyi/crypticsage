const express = require('express')
const router = express.Router()
const verify = require('../auth/verifyToken')

const {
    handleTokenRedisStorage,
    calculateSMA,
    calculateEMA,
    calculateBollingerBands,
    calculateIchimokuCloud,
    calculateRSI,
    calculateMACD,
    calculateATR,
} = require('../../utils/crypto/indicatorDataPrep')

router.post('/get-sma', verify, handleTokenRedisStorage, async (req, res) => {
    console.log("Get sma request received");
    try {
        const sma = await calculateSMA(req, res)
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Something went wrong." })
    }
})

router.post('/get-ema', verify, handleTokenRedisStorage, async (req, res) => {
    console.log("Get ema request received");
    try {
        const ema = await calculateEMA(req, res)
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Something went wrong." })
    }
})

router.post('/get-bollinger-bands', verify, handleTokenRedisStorage, async (req, res) => {
    console.log("Get bollinger bands request received");
    try {
        const bollingerBands = await calculateBollingerBands(req, res)
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Something went wrong." })
    }
})

router.post('/get-ichimoku-cloud', verify, handleTokenRedisStorage, async (req, res) => {
    console.log("Get ichimoku cloud request received");
    try {
        const ichimokuCloud = await calculateIchimokuCloud(req, res)
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Something went wrong." })
    }
})

router.post('/get-rsi', verify, handleTokenRedisStorage, async (req, res) => {
    console.log("Get rsi request received");
    try {
        const rsi = await calculateRSI(req, res)
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Something went wrong." })
    }
})

router.post('/get-macd', verify, handleTokenRedisStorage, async (req, res) => {	
    console.log("Get macd request received");	
    try {	
        const macd = await calculateMACD(req, res)	
    } catch (err) {	
        console.log(err);	
        res.status(500).json({ message: "Something went wrong." })	
    }
})

router.post('/get-atr', verify, handleTokenRedisStorage, async (req, res) => {
    console.log("Get atr request received");
    try {
        const atr = await calculateATR(req, res)
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Something went wrong." })
    }
})

module.exports = router