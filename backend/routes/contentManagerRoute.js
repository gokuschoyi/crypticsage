/**
 * Route for Content management & historical data related fetch & update (Crypto  & Stocks).
 * @module route/content
 */

const express = require('express')
const router = express.Router()

const CMController = require('../controllers/contentManagerController')
const CMServices = require('../services/contentManagerServices')

/**
 * Endpoint to check and update the binance ticker meta data. 
 * @name /updateTickerMeta
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/update_ticker_meta
 * @body {number} length - The length of the ticker to update
 * @code {200} Get Crypto Data request success
 * @code {400} Error response
 * @response {string} message - Get Crypto Data request success
 * @response {array} result - The result array of the update request
 */
router.post('/update_ticker_meta', CMController.FASLatestTickerMetaData) // admin dashboard - update ticker meta data - completed

/**
 * Endpoint to delete the binance ticker meta data.
 * @name /deleteTickerMeta
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/delete_ticker_meta
 * @body {string} symbol - The symbol of the ticker to delete
 * @code {200} Delete Ticker Meta request success
 * @code {400} Error response
 * @response {string} message - Delete Ticker Meta request success
 * @response {object} deletedTickerMeta - The result of the delete request
 */
router.post('/delete_ticker_meta', CMController.deleteTickerMeta) // admin dashboard - delete ticker meta data - completed

/**
 * Endpoint to find a specific yFinance ticker/tickers.
 * @name /findYFTicker
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/find_yf_ticker
 * @body {array} symbols - The symbol/symbols of the ticker to check.
 * @code {200} YF Ticker search success
 * @code {400} Error response
 * @response {string} message - YF Ticker search success
 * @response {array} result - The result array containing the various quotes and exchanges of the requested symbols.
 */
router.post('/find_yf_ticker', CMController.findYFTicker) // admin dashboard - find yfinance ticker - completed

/**
 * Endpoint to fetch new binance tickers who's metadata is not in the database
 * @name /fetchNewTickersToAdd
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/fetch_new_tickers_to_add
 * @code {200} Get new tickers success
 * @code {400} Error response
 * @response {string} message - Get new tickers success
 * @response {array} new_tickers - The result array containing the new tickers not in DB.
 */
router.post('/fetch_new_tickers_to_add', CMController.getNewTickersToAdd)

/**
 * Endpoint to add new binance ticker metadata to the database
 * @name /addNewTickerMeta
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/add_new_ticker_meta
 * @code {200}Add new ticker meta success
 * @code {400} Error response
 * @response {string} message -Add new ticker meta success
 * @response {array} result - The result of the update or insert operation
 * @response {array} tickersWithNoDataInBinance - Tickers with no data in Binance
 * @response {array} tickersWithNoHistData - Tickers with no historical data
 */
router.post('/add_new_ticker_meta', CMController.addNewBinanceTickerMeta)

/**
 * Endpoint to fetch the existing binance tickers in the database
 * @name /getBinanceTickersIndb
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/get_binance_tickers
 * @code {200} Tickers fetched successfully
 * @code {400} Error response
 * @response {string} message - Tickers fetched successfully
 * @response {array} tickerWithNoDataInBinance - Tickers with no data in Binance
 * @response {array} tickersWithHistData - Tickers with data in DB
 * @response {array} tickersWithNoHistData - Tickers with no data in DB
 * @response {number} tickersWithHistDataLength - Length of tickers with data in DB
 * @response {number} tickersWithNoHistDataLength - Length of tickers with no data in DB
 * @response {number} totalTickerCountInDb - Total number of tickers in DB
 * @response {number} totalTickersWithDataToFetch - Total number of tickers with data to fetch
 */
router.post('/get_binance_tickers', CMController.getBinanceTickersIndb) // admin dashboard - dashborad binance info - completed

/**
 * Endpoint to fetch the existing yFinance tickers in the database
 * @name /getYfinanceTickersIndb
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/get_yfinance_tickers
 * @code {200} Yfinance Tickers fetched successfully
 * @code {400} Error response
 * @response {string} message - Yfinance Tickers fetched successfully
 * @response {array} yFTickerInfo - The result array containing the Y-Finance ticker info
 */
router.post('/get_yfinance_tickers', CMController.getYfinanceTickersIndb) // admin dashboard -  yfinance info -completed

/**
 * Endpoint to add the historical data for a single binance ticker.
 * @name /fetchOneBinanceTicker
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/fetch_one_binance_ticker
 * @body {array} fetchQuries - The fetch queries for the ticker [{ticker_name, period, meta:{market_cap_rank, symbol, name, asset_launch_date}},{}]
 * @code {200} Processing one ticker fetch request
 * @code {400} Error response
 * @response {string} message - Processing one ticker fetch request
 * @response {object} finalResult - The result of the fetch request
 */
router.post('/fetch_one_binance_ticker', CMController.fetchOneBinanceTicker) // fetching ticker data for a single ticker periods - 4h, 6h, 8h, 12h ,1d, 3, 1w - completed

/**
 * Endpoint to update the historical data for a single binance ticker.
 * @name /updateOneBinanceTicker
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/update_one_binance_ticker
 * @body {array} updateQueries - The update queries for the ticker [{ticker_name, period, start, end},{}]
 * @code {200} Processing one ticker update request
 * @code {400} Error response
 * @response {string} message - Processing one ticker update request
 * @response {object} finalResult - The result of the update request
 */
router.post('/update_one_binance_ticker', CMController.updateOneBinanceTicker) // admin dashboard - update one binance ticker - completed

/**
 * Endpoint to update the historical data for all binance ticker.
 * @name /updateAllBinanceTickers
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/update_all_binance_tickers
 * @body {array} updateQueries - The update queries for the ticker [{ticker_name, period, start, end},{}]
 * @code {200} Processing update request
 * @code {400} Error response
 * @response {string} message - Processing update request
 * @response {object} finalResult - The result of the update request
 */
router.post('/update_all_tickers', CMController.updateAllBinanceTickers) // admin dashboard - update all binance tickers - completed

/**
 * Endpoint to update the historical data for a specific ticker or all tickers from Y-Finance
 * @name /updateHistoricalYFinanceData
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/update_historical_yFinance_data
 * @body {string} symbol - The symbol of the ticker to update | 'all' to update all ticker in DB
 * @code {200} YF tokens updated
 * @code {400} Error response
 * @response {string} message - YF tokens updated
 * @response {object} diffArray - The result of the update process
 */
router.post('/update_historical_yFinance_data', CMController.updateHistoricalYFinanceData)

/**
 * Endpoint to add the historical data for a single YF ticker.
 * @name /fetchOneYFinanceTicker
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/fetch_one_yfinance_ticker
 * @body {array} symbol - The symbol of the ticker to fetch.
 * @code {200} Yfinance tickers added.
 * @code {400} Error response.
 * @response {string} message - Yfinance tickers added.
 * @response {array} uploadStatus - The result of the upload process.
 * @response {array} availableTickers - The available tickers in the database.
 * @response {array} tickers - The tickers that was updated.
 */
router.post('/fetch_one_yfinance_ticker', CMController.fetchOneYfinanceTicker)// fetching stock data for a single ticker periods - 1d, 1wk, 1mo - completed

/**
 * Endpoint to delete the historical data for a single YF ticker.
 * @name /deleteOneYfinanceTicker
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/delete_one_yfinance_ticker
 * @body {string} symbol - The symbol of the ticker to delete.
 * @code {200} Yfinance tickers deleted.
 * @code {400} Error response.
 * @response {string} message - Yfinance tickers deleted.
 * @response {object} deleteStatus - The result of the delete process.
 */
router.post('/delete_one_yfinace_ticker', CMController.deleteOneYfinanceTicker)// delete one yfinance ticker - completed

/**
 * Endpoint to check the status of the bull worker process.
 * @name /getProcessStatus
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/get_process_status
 * @body {array} jobIds - The jobIds of the process to check.
 * @code {200} Job status for update-one-ticker_.
 * @code {400} Error response.
 * @response {string} message - Job status for update-one-ticker_.
 * @response {array} status - An array containing the staus of each job.
 */
router.post('/get_process_status', CMController.getProcessStatus)

router.post('/get_latest_ticker_data_for_user', CMController.getLatestTickerDataForUser) // not used
router.post('/save_one_ticker_data_for_user', CMController.saveOneTickerDataForUser)

/**
 * Endpoint to fetch the sections in the database.
 * @name /getSections
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/get_sections
 * @code {200} Sections fetched successfully.
 * @code {400} Error response.
 * @response {string} message - Sections fetched successfully.
 * @response {array} sections - An array containing the sections in the database.
 */
router.post('/get_sections', CMController.getSections)

/**
 * Endpoint to add a section to the database.
 * @name /addSection
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/add_section
 * @body {string} title - The title of the section to add.
 * @body {string} content - The content of the section to add.
 * @body {string} url - The url of the section to add.
 * @code {200} Section added successfully.
 * @code {400} Error response.
 * @response {string} message - Section added successfully.
 * @response {string} createdSectionId - The id of the created section.
 * @response {boolean} update - Wheather the section was inserted or updated. (True = updated, False = inserted)
 * @response {array} insertedResult - The result of the insert operation.
 */
router.post('/add_section', CMController.addSection)

/**
 * Endpoint to update a section to the database.
 * @name /updateSection
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/update_section
 * @body {string} title - The title of the section to update.
 * @body {string} content - The content of the section to update.
 * @body {string} url - The url of the section to update.
 * @body {string} sectionId - The id of the section to update
 * @code {200} Section updated successfully.
 * @code {400} Error response.
 * @response {string} message - Section updated successfully.
 * @response {string} createdSectionId - The id of the created section.
 * @response {boolean} update - The update status.
 */
router.post('/update_section', CMController.updateSection)

/**
 * Endpoint to delete a sections from the database.
 * @name /deleteSection
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/delete_section
 * @body {string} sectionId - The id of the section to delete.
 * @code {200} Section deleted successfully.
 * @code {400} Error response.
 * @response {string} message - Section deleted successfully.
 * @response {array} deleted - An array containing the deleted status.
 */
router.post('/delete_section', CMController.deleteSection)

/**
 * Endpoint to fetch the lessons for a section in the database.
 * @name /getLessons
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/get_lessons
 * @body {string} sectionId - The id of the section to fetch lessons for.
 * @code {200} Lessons fetched successfully.
 * @code {400} Error response.
 * @response {string} message - Lessons fetched successfully.
 * @response {array} sections - An array containing the lessons for the section.
 */
router.post('/get_lessons', CMController.getLessons)

/**
 * Endpoint to add a lesson to the database.
 * @name /addLesson
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/add_lesson
 * @body {string} chapter_title - The title of the lesson to add.
 * @body {string} sectionId - The id of the section to add the lesson to.
 * @body {object} lessonData - The data of the lesson to add.
 * @code {200} Lesson added successfully.
 * @code {400} Error response.
 * @response {string} message - Lesson added successfully.
 * @response {string} lessonId - The id of the created lesson.
 * @response {array} insertedResult - The result of the update operation.
 */
router.post('/add_lesson', CMController.addLesson)

/**
 * Endpoint to update a lesson in the database.
 * @name /updateLesson
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/update_lesson
 * @body {string} chapter_title - The title of the lesson to add.
 * @body {object} lessonData - The data of the lesson to add.
 * @body {string} lessonId - The id of the lesson to update.
 * @body {string} sectionId - The id of the section to which the lesson belongs.
 * @code {200} Lesson updated successfully.
 * @code {400} Error response.
 * @response {string} message - Lesson updated successfully.
 * @response {array} update - The result of the update operation.
 */
router.post('/update_lesson', CMController.updateLesson)

/**
 * Endpoint to delete a lesson from the database.
 * @name /deleteLesson
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/delete_section
 * @body {string} sectionId - The id of the section to which the lesson belongs to.
 * @body {string} lessonId - The id of the lesson to delete.
 * @code {200} Lesson deleted successfully.
 * @code {400} Error response.
 * @response {string} message - Lesson deleted successfully.
 * @response {array} deleted - An array containing the deleted status.
 */
router.post('/delete_lesson', CMController.deleteLesson)

/**
 * Endpoint to fetch the quizzes for a lesson in the database.
 * @name /getQuizzes
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/get_quizQuestions
 * @body {string} lessonId - The id of the lesson to fetch quizzes for.
 * @code {200} Quiz fetched successfully.
 * @code {400} Error response.
 * @response {string} message - Quiz fetched successfully.
 * @response {string} status - The status of the request.
 * @response {array} sections - An array containing the lessons for the section.
 */
router.post('/get_quizQuestions', CMController.getQuizQuestions)

/**
 * Endpoint to add a quiz to the database.
 * @name /addQuizQuestion
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/add_quizQuestion
 * @body {string} sectionId - The id of the section to add the lesson to.
 * @body {string} sectionName - The title of the section.
 * @body {string} lessonId - The id of the lesson to add the quiz to.
 * @body {string} lessonName - The title of the lesson.
 * @body {string} quizTitle - The title of the lesson to add.
 * @body {string} quizDescription - The quiz description.
 * @body {array} questions - The questions for the quiz.
 * @code {200} Quiz question added successfully.
 * @code {400} Error response.
 * @response {string} message - Quiz question added successfully.
 * @response {string} quizId - The id of the created quiz.
 * @response {array} insertedResult - The result of the insert operation.
 */
router.post('/add_quizquestion', CMController.addQuizQuestions)

/**
 * Endpoint to update a quiz in the database.
 * @name /updateQuizQuestion
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/update_quizQuestion
 * @body {string} quizId - The id of the quiz to update.
 * @body {string} quizTitle - The title of the lesson to update.
 * @body {string} quizDescription - The quiz description.
 * @body {array} questions - The questions for the quiz.
 * @code {200} Quiz question updated successfully.
 * @code {400} Error response.
 * @response {string} message - Quiz question updated successfully.
 * @response {array} update - The result of the update operation.
 */
router.post('/update_quizquestion', CMController.updateQuizQuestions)

/**
 * Endpoint to delete a quiz from the database.
 * @name /deleteQuizQuestion
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /content/delete_quizQuestion
 * @body {string} sectionId - The id of the section to which the quiz belongs to.
 * @body {string} sectionId - The id of the lesson to which the quiz belongs to.
 * @body {string} sectionId - The id of the quiz to delete.
 * @code {200} Quiz question deleted successfully.
 * @code {400} Error response.
 * @response {string} message - Quiz question deleted successfully.
 * @response {array} deleted - An array containing the deleted status.
 */
router.post('/delete_quizquestion', CMController.deleteQuizQuestion)

module.exports = router