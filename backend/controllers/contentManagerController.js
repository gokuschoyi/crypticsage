const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const yahooFinance = require('yahoo-finance2').default;
const { v4: uuidv4 } = require('uuid');
const Validator = require('../utils/validator')
const CMServices = require('../services/contentManagerServices')
const MDBServices = require('../services/mongoDBServices')
const HDServices = require('../services/historicalDataServices')

// <--- Admin Stats ---> //

// Entry point to fetch and save the latest ticker meta data to DB
const FASLatestTickerMetaData = async (req, res) => {
    const { length } = req.body
    try {
        let result = await CMServices.serviceFetchAndSaveLatestTickerMetaData({ length })
        res.status(200).json({ message: "Get Crypto Data request success", result });
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: "Get Crypto Data request error", error: error.message })
    }
}

const deleteTickerMeta = async (req, res) => {
    try {
        const { symbol } = req.body
        const deletedTickerMeta = await MDBServices.deleteOneMetaData({ symbol })
        res.status(200).json({ message: "Delete Ticker Meta request success", deletedTickerMeta });
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: "Get Crypto Data request error", error: error.message })
    }
}

const findYFTicker = async (req, res) => {
    try {
        const { symbols } = req.body
        // let result = []
        const promises = symbols.map(async (symbol) => {
            const ticker = await yahooFinance.search(symbol, {}, { validateResult: false });
            // log.info(ticker)
            try {
                if (!ticker || ticker.count === 0) {
                    return (
                        {
                            available: false,
                            message: "Ticker does not exist in Yahoo Finance. Check for Typo"
                        }
                    );
                } else {
                    // log.info(ticker)
                    return (
                        {
                            symbol: symbol,
                            available: true,
                            name: ticker.quotes.length !== 0 ? ticker.quotes[0].shortname : null,
                            count: ticker.count,
                            quotes: ticker.quotes
                        }
                    );
                }
            } catch (error) {
                let formattedError = JSON.stringify(logger.formatError(error))
                log.error(`ERROR:${symbol} : ${formattedError}`);
                return (
                    {
                        available: false,
                        message: error.message
                    }
                );
            }
        });
        const result = await Promise.all(promises);

        res.status(200).json({ message: "YF Ticker search success", result });
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: "Get YF Data request error", error: error.message })
    }
}

const getBinanceTickersIndb = async (req, res) => {
    try {
        const [totalTickerCountInDb, totalTickersWithDataToFetch, tickersWithHistData, tickersWithNoHistData, tickerWithNoDataInBinance] = await CMServices.serviceGetBinanceTickerStatsFromDb()
        let tickersWithHistDataLength = tickersWithHistData.length
        let tickersWithNoHistDataLength = tickersWithNoHistData.length
        res.status(200).json({
            message: "Tickers fetched successfully",
            totalTickerCountInDb,
            totalTickersWithDataToFetch,
            tickersWithHistDataLength,
            tickersWithNoHistDataLength,
            tickersWithHistData,
            tickersWithNoHistData,
            tickerWithNoDataInBinance,
        });
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

const getYfinanceTickersIndb = async (req, res) => {
    try {
        const yfTickers = await CMServices.serviceGetYfinanceTickerStatsFromDb()
        res.status(200).json({ message: "Yfinance Tickers fetched successfully", yFTickerInfo: yfTickers });
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

const fetchOneBinanceTicker = async (req, res) => {
    try {
        const { fetchQueries } = req.body
        let fetchedQueries = await CMServices.serviceFetchOneBinanceTicker({ fetchQueries })
        res.status(200).json({ message: fetchedQueries.message, finalResult: fetchedQueries.finalResult });
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

const updateOneBinanceTicker = async (req, res) => {
    try {
        const { updateQueries } = req.body
        let updatedQueries = await CMServices.serviceUpdateOneBinanceTicker({ updateQueries })
        res.status(200).json({ message: updatedQueries.message, finalResult: updatedQueries.finalResult });
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

const getLatestTickerDataForUser = async (req, res) => {
    try {
        const { updateQueries } = req.body
        const newTickers = await CMServices.serviceGetLatestTickerDataForUser({ updateQueries })
        res.status(200).json({ message: "Get Latest Ticker Data request success", newTickers });
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

const saveOneTickerDataForUser = async (req, res) => {
    try {
        const { fetchQuery } = req.body
        const updateTickerWithOneDataPoint = await CMServices.serviceUpdateTickerWithOneDataPoint({ fetchQuery })
        res.status(200).json({ message: "Save One Ticker Data request success", updateTickerWithOneDataPoint });
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

const updateAllBinanceTickers = async (req, res) => {
    try {
        const finalProcessIds = await CMServices.serviceUpdateAllBinanceTickers()
        res.status(200).json({ message: "Update All Binance Tickers request success", finalProcessIds });
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

const fetchOneYfinanceTicker = async (req, res) => {
    try {
        const { symbol } = req.body
        const periods = ["1d", "1wk", "1mo"]
        const [uploadStatus, availableTickers, tickers] = await HDServices.processInitialSaveHistoricalDataYFinance({ tickersList: symbol, periods })
        res.status(200).json({ message: "Yfinance tickers added", uploadStatus, availableTickers, tickers });
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error({ message: error.message, reason: error.failReason, error: formattedError });
        if (error.failReason === 'No start date') {
            res.status(200).json({ message: error.message, failReason: error.failReason });
        } else {
            res.status(400).json({ message: error.message });
        }
    }
}

const deleteOneYfinanceTicker = async (req, res) => {
    try {
        const { symbol } = req.body
        const type = 'stock'
        const deleteStatus = await MDBServices.deleteTickerHistDataFromDb({ ticker_name: symbol, type })
        res.status(200).json({ message: "Yfinance tickers deleted", deleteStatus });
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

const getProcessStatus = async (req, res) => {
    try {
        const { jobIds, type } = req.body
        const processStatus = await CMServices.serviceCheckOneBinanceTickerJobCompletition({ jobIds, type })
        res.status(200).json({ message: processStatus.message, status: processStatus.data });
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}


// <--- Admin Stats ---> //

// <--- Sections ---> //

// Returns all sections from the database
const getSections = async (req, res) => {
    try {
        const collectionName = 'sections'
        const filter = {}
        const sections = await CMServices.serviceGetDocuments({ collectionName, filter })
        res.status(200).json({ message: "Sections fetched successfully", sections });
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

// add section to the database
const addSection = async (req, res) => {
    try {
        const params = req.body
        const isInputValid = Validator.validateAddSectionInputs({ params })
        if (isInputValid) {
            const collectionName = 'sections'
            const { title, content, url } = params
            const sectionId = uuidv4();
            const document = {
                title,
                content,
                url,
                sectionId: sectionId,
            }
            let insertedResult = await CMServices.serviceAddDocuments({ collectionName, document })
            res.status(200).json({ message: "Section added successfully", createdSectionId: sectionId, update: false, insertedResult });
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

// update section in the database
const updateSection = async (req, res) => {
    try {
        const params = req.body
        const isInputValid = Validator.validateUpdateSectionInputs({ params })
        if (isInputValid) {
            const { title, content, url, sectionId } = params
            const update = await CMServices.serviceUdpateSectionInDb({ title, content, url, sectionId })
            res.status(200).json({ message: "Section updated successfully", update: true, update });
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

// delete section from the database
const deleteSection = async (req, res) => {
    try {
        const params = req.body
        const isInputValid = Validator.validateUpdateSectionInputs({ params })
        if (isInputValid) {
            const { sectionId } = params
            let deleted = await CMServices.serviceDeleteSectionFromDb({ sectionId })
            res.status(200).json({ message: "Section deleted successfully", deleted });
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

// <--- Sections ---> //


// <--- Lessons ---> //

// Returns all lessons from the database
const getLessons = async (req, res) => {
    try {
        const params = req.body
        const isInputValid = Validator.validateUpdateSectionInputs({ params })
        if (isInputValid) {
            const collectionName = 'lessons'
            const filter = { 'sectionId': params.sectionId }
            const lessons = await CMServices.serviceGetDocuments({ collectionName, filter })
            if (lessons.length === 0) {
                res.status(200).json({ message: "No lessons found" });
            } else {
                res.status(200).json({ message: "Lessons fetched successfully", lessons });
            }
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

// add lesson to the database
const addLesson = async (req, res) => {
    try {
        const params = req.body
        const isInputValid = Validator.validateAddLessonInputs({ params })
        if (isInputValid) {
            const collectionName = 'lessons'
            const { chapter_title, sectionId, lessonData } = params
            const lessonId = uuidv4();
            const document = {
                chapter_title,
                sectionId,
                lessonData,
                lessonId: lessonId,
            }
            let insertedResult = await CMServices.serviceAddDocuments({ collectionName, document })

            res.status(200).json({ message: "Lesson added successfully", lessonId, insertedResult });
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

// update lesson in the database
const updateLesson = async (req, res) => {
    try {
        const params = req.body
        const isInputValid = Validator.validateAddLessonInputs({ params })
        if (isInputValid) {
            const { chapter_title, lessonData, lessonId, sectionId } = params
            const update = await CMServices.serviceUpdateLessonInDb({ chapter_title, lessonData, lessonId, sectionId })
            res.status(200).json({ message: "Lesson updated successfully", update });
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

// delete lesson in the database
const deleteLesson = async (req, res) => {
    try {
        const params = req.body
        const isInputValid = Validator.validateDeleteLessonInputs({ params })
        if (isInputValid) {
            const { lessonId, sectionId } = params
            let deleted = await CMServices.serviceDeleteLessonFromDb({ lessonId, sectionId })
            res.status(200).json({ message: "Lesson deleted successfully", deleted });
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

// <--- Lessons ---> //


// <--- Quiz ---> //

// Returns all quiz from the database
const getQuizQuestions = async (req, res) => {
    try {
        const params = req.body
        const isInputValid = Validator.validateDeleteLessonInputs({ params })
        if (isInputValid) {
            const collectionName = 'quiz'
            const filter = { 'lessonId': params.lessonId }
            const quizQuestions = await CMServices.serviceGetDocuments({ collectionName, filter })
            if (quizQuestions.length === 0) {
                res.status(200).json({ message: "No quiz found" });
            } else {
                res.status(200).json({ message: "Quiz fetched successfully", quizQuestions, status: true });
            }
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

// add quiz to the database
const addQuizQuestions = async (req, res) => {
    try {
        const params = req.body
        const isInputValid = Validator.validateAddQuizInputs({ params })
        if (isInputValid) {
            const collectionName = 'quiz'
            const { quizData } = params
            const quizId = uuidv4();
            quizData.quizId = quizId;
            quizData.questions.map((question) => {
                question.question_id = uuidv4();
            })
            let insertedResult = await CMServices.serviceAddDocuments({ collectionName, document: quizData })
            res.status(200).json({ message: "Quiz question added successfully", quizId, insertedResult });
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

// update quiz in the database
const updateQuizQuestions = async (req, res) => {
    try {
        const params = req.body
        const isInputValid = Validator.validateUpdateQuizDataInputs({ params })
        if (isInputValid) {
            const { quizId, quizTitle, quizDescription, questions } = params
            const update = await CMServices.serviceUpdateQuizInDb({ quizId, quizTitle, quizDescription, questions })
            res.status(200).json({ message: "Quiz question updated successfully", update });
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

// delete quiz in the database
const deleteQuizQuestion = async (req, res) => {
    try {
        const params = req.body
        const isInputValid = Validator.validateDeleteQuizInputs({ params })
        if (isInputValid) {
            const { quizId, sectionId, lessonId } = params
            let deleted = await CMServices.serviceDeleteQuizFromDb({ quizId, sectionId, lessonId })
            res.status(200).json({ message: "Quiz question deleted successfully", deleted });
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

// <--- Quiz ---> //

module.exports = {
    FASLatestTickerMetaData
    , deleteTickerMeta
    , findYFTicker
    , getBinanceTickersIndb
    , getYfinanceTickersIndb
    , fetchOneBinanceTicker
    , updateOneBinanceTicker
    , getLatestTickerDataForUser
    , saveOneTickerDataForUser
    , updateAllBinanceTickers
    , fetchOneYfinanceTicker
    , deleteOneYfinanceTicker
    , getProcessStatus
    , getSections
    , addSection
    , updateSection
    , deleteSection
    , getLessons
    , addLesson
    , updateLesson
    , deleteLesson
    , getQuizQuestions
    , addQuizQuestions
    , updateQuizQuestions
    , deleteQuizQuestion
}