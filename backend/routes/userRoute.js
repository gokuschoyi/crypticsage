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
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
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
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
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
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /user/update_profileimage
 * @body {string} profileImage - The base 64 encoded image string
 * @code {200} Profile image updated successfully
 * @code {400} Error response
 * @response {string} message - Profile image updated successfully
 * @response {string} status - True if password is valid else false
 */
router.post('/update_profileimage', UserController.updateProfilePicture)

/**
 * Endpoint to update the users display name and mobile number
 * @name /updateUserData
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /user/update_userdata
 * @body {Object} userData - The user data object. {displayName: string, mobile_number: string}
 * @code {200} User data updated successfully
 * @code {400} Error response
 * @response {string} message - User data updated successfully
 * @response {string} status - True if update is successful else false
 */
router.post('/update_userdata', UserController.updateUserData)

/**
 * Endpoint to update the users preferences, Sidebar collapsed, Dashboard hover, Theme
 * @name /updatePreferences
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /user/update_preferences
 * @body {Object} preferences - The preference data object. {theme: boolean, dashboardHover: boolean, collapsedSidebar: boolean}
 * @code {200} User preferences updated successfully
 * @code {400} Error response
 * @response {string} message - User preferences updated successfully
 * @response {string} status - True if update is successful else false
 */
router.post('/update_preferences', UserController.updateUserPreference)

/**
 * Endpoint to update the users preferences, Sidebar collapsed, Dashboard hover, Theme
 * @name /updateUserLessonStatus
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /user/update_userLessonStatus
 * @body {Object} lesson_status - The lesson status data object. {
 * section_id: string,
 * lesson_id: string,
 * lesson_name: string,
 * next_chapter_id: string,
 * prev_chapter_id: string,
 * parent_section_id: string,
 * lesson_start: boolean,
 * lesson_progress: integer,
 * lesson_completed: boolean,
 * lesson_completed_date: string
 * }
 * @code {200} User lesson status updated successfully
 * @code {400} Error response
 * @response {string} message - User lesson status updated successfully
 * @response {string} status - True if update is successful else false
 */
router.post('/update_userLessonStatus', UserController.updateUserLessonStatus)

/**
 * Endpoint to get the initial quiz data for the user
 * @name /getInitialQuizDataForUser
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /user/get_initial_quiz_data_for_user
 * @code {200} Quiz data fetched successfully
 * @code {400} Error response
 * @response {string} message - Quiz data fetched successfully
 * @response {Array} transformedQuizData - The transformed quiz data
 */
router.post('/get_initial_quiz_data_for_user', UserController.getInitialQuizDataForUser)

/**
 * Endpoint to fetch single quiz data for the user
 * @name /getQuiz
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /user/getQuiz
 * @body {string} quizId - The quiz id to fetch
 * @code {200} Quiz fetched successfully
 * @code {400} Error response
 * @response {string} message - Quiz fetched successfully
 * @response {Array} selectedQuiz - The transformed quiz data
 */
router.post('/getQuiz', UserController.getQuiz)

/**
 * Endpoint to submit the quiz and calculae the score
 * @name /submitQuiz
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /user/submitQuiz
 * @body {string} sectionId - The section id.
 * @body {string} lessonId - The lession id.
 * @body {string} quizId - The quiz id.
 * @body {object} quizData - The user selection payload object for the quiz.
 * @body {array} quizData.userSelections - The user selections for the quiz.
 * @code {200} Quiz submitted successfully
 * @code {400} Error response
 * @response {string} message - Quiz submitted successfully
 * @response {string} status - boolean status of the quiz submission
 * @response {Object} data - The result object of the quiz submission
 */
router.post('/submitQuiz', UserController.submitQuiz)

/**
 * Endpoint to get the recent lesson and quiz status for the user along with next lesson and quiz
 * @name /getRecentLessonAndQuiz
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /user/get_recent_lesson_and_quiz
 * @code {200} Recent lesson and quiz status fetched successfully
 * @code {400} Error response
 * @response {string} message - Recent lesson and quiz status fetched successfully
 * @response {Object} recentLessonQuizStatus - The recent lesson and quiz status object
 */
router.post('/get_recent_lesson_and_quiz', UserController.getRecentLessonAndQuizStatus)

/**
 * Endpoint to get the word of the day
 * @name /wordOfTheDay
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /user/wordOfTheDay
 * @code {200} Word of the day request success
 * @code {400} Error response
 * @response {string} message - Word of the day request success
 * @response {Object} word - The word of the day object
 */
router.post('/wordOfTheDay', UserController.wordOfTheDay)

/**
 * Endpoint to upload log files
 * @name /uploadLogFiles
 * @auth This route requires JWT Authentication with a valid access token (Bearer Token).
 * @path {POST} /user/upload_log_files
 * @code {200} File uploaded successfully
 * @code {400} Error response
 * @body {string} uid:(formData) - The uid of the user
 * @body {file} file:(formData) - The file to upload
 * @response {string} message - File uploaded successfully
 * @response {Object} finalResult - The final result object
 */
router.post('/upload_log_files', upload.array('file', 3), UserController.fileUpload)

module.exports = router