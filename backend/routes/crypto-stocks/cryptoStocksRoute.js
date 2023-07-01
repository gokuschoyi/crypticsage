const express = require('express')
const router = express.Router()
const verify = require('../auth/verifyToken')

const {
    getCryptoData,
    getHistoricalData,
    getLatestCryptoData,
    getLatestStocksData,
    wordOfTheDay,
} = require('../../utils/crypto/fetchCryptoData')

const {
    initialSaveHistoricalDataYFinance,
    updateHistoricalDataYFinance,
} = require('../../utils/crypto/yFinanceHistoricalData')

const {
    initialSaveHistoricalDataBinance,
    checkJobCompletition,
} = require('../../utils/crypto/binanceHistoricalData')

const {
    fetchTokenData,
} = require('../../utils/crypto/indicatorDataPrep')

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

router.post('/get-latest-crypto-data', verify, async (req, res) => {
    console.log("Get latest token data request received");
    try {
        getLatestCryptoData(req, res)
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" })
    }
})

router.post('/get-latest-stocks-data', verify, async (req, res) => {
    console.log("Get latest token data request received");
    try {
        getLatestStocksData(req, res)
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

router.post('/check-job-completition', verify, async (req, res) => {
    console.log("Check job completition request received");
    try {
        checkJobCompletition(req, res)
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

//data prep and processing
router.post('/fetchTokenData', verify, async (req, res) => {
    console.log("Fetch token data request received");
    const { dataSource, tokenName, period } = req.body
    try {
        let result = await fetchTokenData(dataSource, tokenName, period)
        // console.log(result)
        let resLength = result.length
        res.status(200).json({ message: "Token data fetched successfully", result, resLength })
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Internal server error" })
    }
})

module.exports = router