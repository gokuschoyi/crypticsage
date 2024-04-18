const express = require('express')
const router = express.Router()

const CMController = require('../controllers/contentManagerController')
const CMServices = require('../services/contentManagerServices')

router.post('/update_ticker_meta', CMController.FASLatestTickerMetaData) // admin dashboard - update ticker meta data - completed
router.post('/delete_ticker_meta', CMController.deleteTickerMeta) // admin dashboard - delete ticker meta data - completed

router.post('/find_yf_ticker', CMController.findYFTicker) // admin dashboard - find yfinance ticker - completed

router.post('/get_binance_tickers', CMController.getBinanceTickersIndb) // admin dashboard - dashborad binance info - completed
router.post('/get_yfinance_tickers', CMController.getYfinanceTickersIndb) // admin dashboard -  yfinance info -completed

router.post('/fetch_new_tickers_to_add', CMController.getNewTickersToAdd)
router.post('/add_new_ticker_meta', CMController.addNewBinanceTickerMeta)

router.post('/update_one_binance_ticker', CMController.updateOneBinanceTicker) // admin dashboard - update one binance ticker - completed
router.post('/update_all_tickers', CMController.updateAllBinanceTickers) // admin dashboard - update all binance tickers - completed

router.post('/fetch_one_binance_ticker', CMController.fetchOneBinanceTicker) // fetching ticker data for a single ticker periods - 4h, 6h, 8h, 12h ,1d, 3, 1w - completed
router.post('/fetch_one_yfinance_ticker', CMController.fetchOneYfinanceTicker)// fetching stock data for a single ticker periods - 1d, 1wk, 1mo - completed
router.post('/delete_one_yfinace_ticker', CMController.deleteOneYfinanceTicker)// delete one yfinance ticker - completed

router.post('/get_process_status', CMController.getProcessStatus)

router.post('/get_latest_ticker_data_for_user', CMController.getLatestTickerDataForUser)
router.post('/save_one_ticker_data_for_user', CMController.saveOneTickerDataForUser)

router.post('/get_sections', CMController.getSections)
router.post('/add_section', CMController.addSection)
router.post('/update_section', CMController.updateSection)
router.post('/delete_section', CMController.deleteSection)

router.post('/get_lessons', CMController.getLessons)
router.post('/add_lesson', CMController.addLesson)
router.post('/update_lesson', CMController.updateLesson)
router.post('/delete_lesson', CMController.deleteLesson)

router.post('/get_quizQuestions', CMController.getQuizQuestions)
router.post('/add_quizquestion', CMController.addQuizQuestions)
router.post('/update_quizquestion', CMController.updateQuizQuestions)
router.post('/delete_quizquestion', CMController.deleteQuizQuestion)

module.exports = router