const express = require('express')
const router = express.Router()
const { upload } = require('../services/multer-storage')

const UserController = require('../controllers/userController')

router.post('/verify_password', UserController.verifyPassword)
router.post('/update_password', UserController.updatePassword)
router.post('/update_profileimage', UserController.updateProfilePicture)
router.post('/update_userdata', UserController.updateUserData)
router.post('/update_preferences', UserController.updateUserPreference)
router.post('/update_userLessonStatus', UserController.updateUserLessonStatus)
router.post('/get_initial_quiz_data_for_user', UserController.getInitialQuizDataForUser)
router.post('/getQuiz', UserController.getQuiz)
router.post('/submitQuiz', UserController.submitQuiz)
router.post('/get_recent_lesson_and_quiz', UserController.getRecentLessonAndQuizStatus)
router.post('/wordOfTheDay', UserController.wordOfTheDay)
router.post('/upload_log_files', upload.array('file', 3), UserController.fileUpload)

module.exports = router