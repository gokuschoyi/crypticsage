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
 * @body {string} login_type - Type of login. Can be emailpassword | google | facebook
 * @body {string} email - Email of the user if "login_type" is emailpassword else leave empty
 * @body {string} password - Password of the user if "login_type" is emailpassword else leave empty
 * @body {string} credential - The google credential from google auth if "login_type" is google else leave empty
 * @body {string} facebook_email - The facebook email if `login_type` is facebook else leave empty
 * @code {200} User login successful
 * @code {400} Error response
 * @response {string} message - Login successful
 * @response {object} data - UserLoginPayload
 * @response {object} recent_lesson_quiz - RecentLessonQuiz
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
 */
router.post('/signup', AuthController.signupUser)


module.exports = router