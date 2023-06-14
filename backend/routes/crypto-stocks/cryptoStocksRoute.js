const express = require('express')
const router = express.Router()
const verify = require('../auth/verifyToken')

const {
    getCryptoData,
    getHistoricalData,
    wordOfTheDay,
} = require('../../utils/crypto/fetchCryptoData')

const {
    initialSaveHistoricalDataYFinance,
    updateHistoricalDataYFinance,
    initialSaveHistoricalDataBinance
} = require('../../utils/crypto/historicalData')

router.post('/getCryptoData', verify, async (req, res) => {
    console.log("Get crypto data request received");
    try {
        getCryptoData(req, res)
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" })
    }
})

router.post('/getHistoricalData', verify, async (req, res) => {
    console.log("Get historical data request received");
    try {
        getHistoricalData(req, res)
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" })
    }
})

router.post('/wordOfTheDay', verify, async (req, res) => {
    console.log("Word of the day request received");
    try {
        wordOfTheDay(req, res)
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" })
    }
})

// Binance historical data
router.post('/initialSaveHistoricalDataBinance', verify, async (req, res) => {
    console.log("Initial save for historical data  (Binance) received");
    try {
        initialSaveHistoricalDataBinance(req, res)
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" })
    }
})

// yFinance historical data
router.post('/initialSaveHistoricalDataYFinance', verify, async (req, res) => {
    console.log("Initial save for historical data (YFinance)");
    try {
        initialSaveHistoricalDataYFinance(req, res)
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" })
    }
})

router.post('/updateHistoricalDataYFinance', verify, async (req, res) => {
    console.log("Update historical data (YFinance) request received");
    try {
        updateHistoricalDataYFinance(req, res)
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" })
    }
})

module.exports = router