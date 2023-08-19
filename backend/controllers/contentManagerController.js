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
    } catch (err) {
        console.log("ERROR : ", err);
        res.status(400).json({ message: "Get Crypto Data request error", error: err.message })
    }
}

const deleteTickerMeta = async (req, res) => {
    try {
        const { symbol } = req.body
        const deletedTickerMeta = await MDBServices.deleteOneMetaData({ symbol })
        res.status(200).json({ message: "Delete Ticker Meta request success", deletedTickerMeta });
    } catch (err) {
        console.log("ERROR : ", err);
        res.status(400).json({ message: "Get Crypto Data request error", error: err.message })
    }
}

const findYFTicker = async (req, res) => {
    try {
        const { symbols } = req.body
        // let result = []
        const promises = symbols.map(async (symbol) => {
            const ticker = await yahooFinance.search(symbol, {}, { validateResult: false });
            // console.log(ticker)
            try {
                if (!ticker || ticker.count === 0) {
                    return (
                        {
                            available: false,
                            message: "Ticker does not exist in Yahoo Finance. Check for Typo"
                        }
                    );
                } else {
                    // console.log(ticker)
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
            } catch (err) {
                console.log(`ERROR:${symbol}`, err);
                return (
                    {
                        available: false,
                        message: err.message
                    }
                );
            }
        });
        const result = await Promise.all(promises);

        res.status(200).json({ message: "YF Ticker search success", result });
    } catch (err) {
        console.log("ERROR : ", err);
        res.status(400).json({ message: "Get YF Data request error", error: err.message })
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
        res.status(400).json({ message: error.message });
    }
}

const getYfinanceTickersIndb = async (req, res) => {
    try {
        const yfTickers = await CMServices.serviceGetYfinanceTickerStatsFromDb()
        res.status(200).json({ message: "Yfinance Tickers fetched successfully", yFTickerInfo: yfTickers });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

const fetchOneBinanceTicker = async (req, res) => {
    try {
        const { fetchQueries } = req.body
        let fetchedQueries = await CMServices.serviceFetchOneBinanceTicker({ fetchQueries })
        res.status(200).json({ message: fetchedQueries.message, finalResult: fetchedQueries.finalResult });
    } catch (error) {
        console.log(error)
        res.status(400).json({ message: error.message });
    }
}

const updateOneBinanceTicker = async (req, res) => {
    try {
        const { updateQueries } = req.body
        let updatedQueries = await CMServices.serviceUpdateOneBinanceTicker({ updateQueries })
        res.status(200).json({ message: updatedQueries.message, finalResult: updatedQueries.finalResult });
    } catch (error) {
        console.log(error)
        res.status(400).json({ message: error.message });
    }
}

const updateAllBinanceTickers = async (req, res) => {
    try {
        const finalProcessIds = await CMServices.serviceUpdateAllBinanceTickers()
        res.status(200).json({ message: "Update All Binance Tickers request success", finalProcessIds });
    } catch (error) {
        console.log(error)
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
        console.log(error.message, error.failReason)
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
        const deleteStatus = await MDBServices.deleteOneYfinanceTickerDromDb({ symbol })
        res.status(200).json({ message: "Yfinance tickers deleted", deleteStatus });
    } catch (error) {
        console.log(error)
        res.status(400).json({ message: error.message });
    }
}

const getProcessStatus = async (req, res) => {
    try {
        const { jobIds, type } = req.body
        const processStatus = await CMServices.serviceCheckOneBinanceTickerJobCompletition({ jobIds, type })
        res.status(200).json({ message: processStatus.message, status: processStatus.data });
    } catch (error) {
        console.log(error)
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
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

// add section to the database
const addSection = async (req, res) => {
    try {
        const params = req.body
        const isInputValid = Validator.validateAddSectionInputs({ params })
        if (isInputValid) {
            const connectMessage = "Add Sections"
            const collectionName = 'sections'
            const { title, content, url } = params
            const sectionId = uuidv4();
            const document = {
                title,
                content,
                url,
                sectionId: sectionId,
            }
            let insertedResult = await CMServices.serviceAddDocuments({ connectMessage, collectionName, document })
            res.status(200).json({ message: "Section added successfully", createdSectionId: sectionId, update: false, insertedResult });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
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
    } catch (err) {
        res.status(400).json({ message: err.message });
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
    } catch (err) {
        res.status(400).json({ message: err.message });
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
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

// add lesson to the database
const addLesson = async (req, res) => {
    try {
        const params = req.body
        const isInputValid = Validator.validateAddLessonInputs({ params })
        if (isInputValid) {
            const connectMessage = "Add Lesson"
            const collectionName = 'lessons'
            const { chapter_title, sectionId, lessonData } = params
            const lessonId = uuidv4();
            const document = {
                chapter_title,
                sectionId,
                lessonData,
                lessonId: lessonId,
            }
            let insertedResult = await CMServices.serviceAddDocuments({ connectMessage, collectionName, document })

            res.status(200).json({ message: "Lesson added successfully", lessonId, insertedResult });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
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
    } catch (err) {
        console.log(err)
        res.status(400).json({ message: err.message });
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
    } catch (err) {
        res.status(400).json({ message: err.message });
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
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

// add quiz to the database
const addQuizQuestions = async (req, res) => {
    try {
        const params = req.body
        const isInputValid = Validator.validateAddQuizInputs({ params })
        if (isInputValid) {
            const connectMessage = "Add Quiz"
            const collectionName = 'quiz'
            const { quizData } = params
            const quizId = uuidv4();
            quizData.quizId = quizId;
            quizData.questions.map((question) => {
                question.question_id = uuidv4();
            })
            let insertedResult = await CMServices.serviceAddDocuments({ connectMessage, collectionName, document: quizData })
            res.status(200).json({ message: "Quiz question added successfully", quizId, insertedResult });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
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
    } catch (err) {
        res.status(400).json({ message: err.message });
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
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

// <--- Quiz ---> //

module.exports = {
    FASLatestTickerMetaData,
    deleteTickerMeta,
    findYFTicker,
    getBinanceTickersIndb,
    getYfinanceTickersIndb,
    fetchOneBinanceTicker,
    updateOneBinanceTicker,
    updateAllBinanceTickers,
    fetchOneYfinanceTicker,
    deleteOneYfinanceTicker,
    getProcessStatus,
    getSections,
    addSection,
    updateSection,
    deleteSection,
    getLessons,
    addLesson,
    updateLesson,
    deleteLesson,
    getQuizQuestions,
    addQuizQuestions,
    updateQuizQuestions,
    deleteQuizQuestion,
}