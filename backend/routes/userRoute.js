/**
 * Route for authentication related endpoints.
 * @module route/user
 */

const express = require('express')
const router = express.Router()
const { upload } = require('../services/multer-storage')

const UserController = require('../controllers/userController')


/**
 * Endpoint to verify the user password before changing it to a new one
 * @name /verifyPassword
 * @auth This route requires JWT Authentication with a valid access token.
 * @path {POST} /user/verify_password
 * @body {string} password - The current password of the user
 * @code {200} Password verified successfully
 * @code {400} Error response
 * @response {string} message - Password verified successfully
 * @response {string} validPassword - True if password is valid else false
 */
router.post('/verify_password', UserController.verifyPassword)

/**
 * Endpoint to update the user password to a new one
 * @name /updatePassword
 * @auth This route requires with a valid access token.
 * @path {POST} /user/update_password
 * @body {string} password - The new password of the user
 * @code {200} Password verified successfully
 * @code {400} Error response
 * @response {string} message - Password verified successfully
 * @response {string} status - True if password is valid else false
 */
router.post('/update_password', UserController.updatePassword)

/**
 * Endpoint to update the user password to a new one
 * @name /updateProfilePicture
 * @auth This route requires with a valid access token.
 * @path {POST} /user/update_profileimage
 * @body {string} profileImage - The base 64 encoded image string
 * @code {200} Profile image updated successfully
 * @code {400} Error response
 * @response {string} message - Profile image updated successfully
 * @response {string} status - True if password is valid else false
 */
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