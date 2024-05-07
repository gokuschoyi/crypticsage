/**
 * Route for authentication related endpoints.
 * @module route/auth
 */

const express = require('express')
const router = express.Router()

const AuthController = require('../controllers/authController')

/**
 * Endpoint for user login
 * @name /login
 * @path {POST} /auth/login
 * @body {string} login_type - Type of login. Can be `emailpassword` | `google` | `facebook`
 * @body {string} email - Email of the user if "login_type" is emailpassword else leave empty
 * @body {string} password - Password of the user if "login_type" is emailpassword else leave empty
 * @body {string} credential - The google credential from google auth if "login_type" is google else leave empty
 * @body {string} facebook_email - The facebook email if `login_type` is facebook else leave empty
 * @code {200} User login successful
 * @code {400} Error response
 * @response {string} message - Login successful
 * @response {object} data - UserLoginPayload
 * @response {object} recent_lesson_quiz - RecentLessonQuiz
 * @response {object} word - Word
 * @see {@link authController.loginUser}
 * @example
 * const payload = {
 *  "email": "goku@gmail.com",
 *  "password": "1234567",
 *  "login_type": "emailpassword"
 * }
 * 
 * const response = {
 *     "message": "User login successful",
 *     "data": {
 *         "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.WBHk",
 *         "admin_status": true,
 *         "email": "goku@gmail.com",
 *         "displayName": "GOKU",
 *         "emailVerified": false,
 *         "uid": "f6951b4d-4976-4a0c-986f-61e24f849510",
 *         "preferences": {
 *             "theme": true,
 *             "dashboardHover": false,
 *             "collapsedSidebar": true
 *         },
 *         "mobile_number": "1234567890",
 *         "signup_type": "registration",
 *         "lesson_status": {
 *             "2ab70e1b-3676-4b79-bfb5-57fd448ec98e": [
 *                 {
 *                     "section_id": "2ab70e1b-3676-4b79-bfb5-57fd448ec98e",
 *                     "lesson_id": "8ed93f99-3c37-428c-af92-c322c79b4384",
 *                     "lesson_name": "qwe",
 *                     "next_chapter_id": null,
 *                     "prev_chapter_id": null,
 *                     "parent_section_id": null,
 *                     "lesson_start": false,
 *                     "lesson_progress": 1,
 *                     "lesson_completed": false,
 *                     "lesson_completed_date": ""
 *                 }
 *             ]
 *         },
 *         "passwordEmptyFlag": false,
 *         "profile_image": "data:image/jpeg;base64,"
 *     },
 *     "recent_lesson_quiz": {
 *         "mostRecentLesson": {
 *             "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
 *             "lesson_id": "4aa08919-369c-4ab4-93db-bf6e41b5b4fc",
 *             "lesson_name": "Crypto",
 *             "next_chapter_id": null,
 *             "prev_chapter_id": null,
 *             "parent_section_id": null,
 *             "lesson_start": true,
 *             "lesson_progress": 1,
 *             "lesson_completed": true,
 *             "lesson_completed_date": "8/2/2023, 1:06:58 PM"
 *         },
 *         "nextLesson": {
 *             "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
 *             "lesson_id": "1aa80733-d0fb-41e8-a975-4d6a7fc95ed6",
 *             "lesson_name": "Stock Exchanges",
 *             "next_chapter_id": null,
 *             "prev_chapter_id": null,
 *             "parent_section_id": null,
 *             "lesson_start": false,
 *             "lesson_progress": 1,
 *             "lesson_completed": false,
 *             "lesson_completed_date": ""
 *         },
 *         "mostRecentQuiz": {
 *             "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
 *             "lesson_id": "a4d32182-98ba-4968-90c3-aa0c27751d55",
 *             "quiz_id": "b993e24e-2900-453a-8e4e-69ecd55e29e6",
 *             "quiz_name": "Candle Stick question id test",
 *             "quiz_completed_date": "12/10/2023, 1:20:11 PM",
 *             "quiz_score": 2,
 *             "quiz_completed": true,
 *             "quiz_total": 3
 *         },
 *         "nextQuiz": {
 *             "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
 *             "lesson_id": "4aa08919-369c-4ab4-93db-bf6e41b5b4fc",
 *             "quiz_id": "f4ee6d77-a655-4d12-95a6-7f812b976205",
 *             "quiz_name": "Crypto Quiz 1",
 *             "quiz_completed_date": "",
 *             "quiz_score": "",
 *             "quiz_completed": false
 *         }
 *     },
 *     "word": {
 *         "word": "Gas",
 *         "meaning": "The unit of measure used to calculate the cost of a transaction or computational task on a blockchain network.",
 *         "url": "https://www.investopedia.com/terms/g/gas-ethereum.asp"
 *     }
 *  }
 */

router.post('/login', AuthController.loginUser)

/**
 * Express route for user signups
 * @name /signup
 * @path {POST} /auth/signup
 * @body {string} signup_type - Type of signup. Can be registration | google | facebook
 * @body {string} userName - Username of the user if "signup_type" is registration else leave empty
 * @body {string} password - Password of the user if "signup_type" is registration else leave empty
 * @body {string} email - Email of the user if "signup_type" is registration else leave empty
 * @body {string} mobile_number - Mobile number of the user if "signup_type" is registration else leave empty
 * @body {string} credential - The google credential from google auth if "signup_type" is google else leave empty
 * @body {object} userInfo - The facebook user info if "signup_type" is facebook else leave empty
 * @code {200} Account created successfully
 * @code {400} Error response
 * @response {string} message - Account created successfully
 * @response {boolean} registered - True if account was created successfully else false
 * @see {@link authController.signupUser}
 */
router.post('/signup', AuthController.signupUser)

/**
 * Express route for user logout
 * @name /logout
 * @path {POST} /auth/logout
 * @body {string} uid - User ID
 * @code {200} Logout successful
 * @code {400} Error response
 * @response {string} message - Logout successful
 * @see {@link authController.logoutUser}
 */
router.post('/logout', AuthController.logoutUser)


module.exports = router