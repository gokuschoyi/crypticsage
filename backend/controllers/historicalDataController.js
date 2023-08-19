const logger = require('../middleware/logger/Logger')
const log = logger.create((__filename.slice(__dirname.length + 1)))
const Validator = require('../utils/validator');
const HDServices = require('../services/historicalDataServices')


// <--------------------------------------------Y_Finance--------------------------------------------> //


// YFinance tickers to fetch AAPL, TSLA, AMZN, GOOGL, MSFT
// Available periods: "1d", "1wk", "1mo" (d - daily, w - weekly, m - monthly)

const initialSaveHistoricalDataYFinance = async (req, res) => {
    try {
        const tickersList = ["AAPL", "TSLA", "AMZN", "GOOGL"]
        const periods = ["1d", "1wk", "1mo"]
        const [uploadStatus, availableTickers, tickers] = await HDServices.processInitialSaveHistoricalDataYFinance({ tickersList, periods })
        res.status(200).json({ message: "Yfinance tickers added", uploadStatus, availableTickers, tickers });
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error(formattedError)
        res.status(400).json({ message: error.message });
    }
}

const updateHistoricalYFinanceData = async (req, res) => {
    try {
        const { symbol } = req.body
        const diffArray = await HDServices.processUpdateHistoricalYFinanceData({ symbol })
        res.status(200).json({ message: 'YF tokens updated', diffArray })
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error(formattedError)
        res.status(400).json({ message: error.message });
    }
}


// <--------------------------------------------Y_Finance--------------------------------------------> //



// <--------------------------------------------BINANCE--------------------------------------------> //


const initialSaveHistoricalDataBinance = async (req, res) => {
    try {
        const { token_count } = req.body
        const result = await HDServices.processInitialSaveHistoricalDataBinance({ token_count })
        res.status(200).json({ message: result.message, finalResult: result.finalResult });
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error(formattedError)
        res.status(400).json({ message: error.message });
    }
}

const updateBinanceData = async (req, res) => {
    try {
        const result = await HDServices.processUpdateBinanceData()
        res.status(200).json({ message: result.message, finalResult: result.finalResult });
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error(formattedError)
        res.status(400).json({ message: error.message });
    }
}

const initialSaveHistoricalDataBinanceOneM = async (req, res) => {
    try {
        const result = await HDServices.processInitialSaveHistoricalDataBinanceOneM()
        res.status(200).json({ message: result.message, finalResult: result.finalResult });
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error(formattedError)
        res.status(400).json({ message: error.message });
    }
}

const updateBinanceOneMData = async (req, res) => {
    try {
        const result = await HDServices.processUpdateBinanceOneMData()
        res.status(200).json({ message: result.message, finalResult: result.finalResult });
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error(formattedError)
        res.status(400).json({ message: error.message });
    }
}

const checkJobCompletition = async (req, res) => {
    const { jobIds, type } = req.body
    try {
        const result = await HDServices.serviceCheckJobCompletition({ jobIds, type })
        res.status(200).json({ message: result.message, data: result.data });
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error(formattedError)
        res.status(400).json({ message: error.message });
    }
}

// <--------------------------------------------BINANCE--------------------------------------------> //

module.exports = {
    initialSaveHistoricalDataYFinance
    , updateHistoricalYFinanceData
    , initialSaveHistoricalDataBinance
    , updateBinanceData
    , initialSaveHistoricalDataBinanceOneM
    , updateBinanceOneMData
    , checkJobCompletition
}