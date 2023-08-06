const express = require('express')
const router = express.Router()

const CMController = require('../controllers/contentManagerController')

router.post('/get_tickers', CMController.getTickersIndb)

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