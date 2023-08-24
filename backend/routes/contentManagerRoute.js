const express = require('express')
const router = express.Router()

const CMController = require('../controllers/contentManagerController')
const CMServices = require('../services/contentManagerServices')
console.log('contentManagerRoute.js')

router.post('/update_ticker_meta', CMController.FASLatestTickerMetaData)
router.post('/delete_ticker_meta', CMController.deleteTickerMeta)

router.post('/find_yf_ticker', CMController.findYFTicker)

router.post('/get_binance_tickers', CMController.getBinanceTickersIndb)
router.post('/get_yfinance_tickers', CMController.getYfinanceTickersIndb)

router.post('/update_one_binance_ticker', CMController.updateOneBinanceTicker)
router.post('/update_all_tickers', CMController.updateAllBinanceTickers)

router.post('/fetch_one_binance_ticker', CMController.fetchOneBinanceTicker)
router.post('/fetch_one_yfinance_ticker', CMController.fetchOneYfinanceTicker)
router.post('/delete_one_yfinace_ticker', CMController.deleteOneYfinanceTicker)

router.post('/get_process_status', CMController.getProcessStatus)

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