/**
 * @namespace authController
 * @description Controller for handling all authentication related requests
 */

const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1));
const { redisClient } = require('../services/redis')
const Validator = require('../utils/validator');
const authServices = require('../services/authServices')


/**
 * Handles Login for Email&Password, Google and Facebook
 * @memberof authController
 * @function loginUser
 * @name loginUser
 * @param {object} req 
 * @param {object} res
 * @returns {Promise<object>} res
 * @see [login]{@link module:route/auth~/login} <br/>
 * @see [EmailPasswordLogin]{@link authServices.EmailPasswordLogin} <br/>
 * @see [GoogleLogin]{@link authServices.GoogleLogin} <br/>
 * @see [FacebookLogin]{@link authServices.FacebookLogin} <br/>
 */
const loginUser = async (req, res) => {
    try {
        const params = req.body;
        const { login_type } = params;
        let isInputValid = Validator.validateLoginInput({ login_type, params });
        if (isInputValid) {
            let userData
            let recent_lesson_quiz
            let processed = {}
            let word
            switch (login_type) {
                case 'emailpassword':
                    const email = params.email
                    const password = params.password
                    processed = await authServices.handleEmailPasswordLogin(email, password)
                    // [userData, recent_lesson_quiz] = await handleEmailPasswordLogin(email, password)
                    break;
                case 'google':
                    const credential = params.credential
                    processed = await authServices.handleGoogleLogin(credential)
                    break;
                case 'facebook':
                    const facebook_email = params.facebook_email
                    processed = await authServices.handleFacebookLogin(facebook_email)
                    break;
                default:
                    throw new Error("Invalid login type")
            }
            userData = processed.userData
            recent_lesson_quiz = processed.recentLessonQuiz
            word = processed.word
            res.status(200).json({ message: "User login successful", data: userData, recent_lesson_quiz: recent_lesson_quiz, word: word });
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

/**
 * Handles Signup for Email&Password, Google and Facebook
 * @memberof authController
 * @function signupUser
 * @name signupUser
 * @param {object} req 
 * @param {object} res 
 * @returns {Promise<object>} res
 * @see [signup]{@link module:route/auth~/signup} <br/>
 * @see [EmailPasswordSignup]{@link authServices.EmailPasswordSignup}
 * @see [GoogleSignup]{@link authServices.GoogleSignup}
 * @see [FacebookSignup]{@link authServices.FacebookSignup}
 */

const signupUser = async (req, res) => {
    try {
        const params = req.body;
        const { signup_type } = params;
        let isInputValid = Validator.validateSignupInput({ signup_type, params })
        if (isInputValid) {
            let result
            switch (signup_type) {
                case 'registration':
                    const { userName, email, password, mobile_number } = params
                    result = await authServices.handleEmailPasswordSignup(userName, email, password, mobile_number)
                    break;
                case 'google':
                    const { credentials } = params
                    result = await authServices.handleGoogleSignup(credentials)
                    break;
                case 'facebook':
                    const { userInfo } = params
                    result = await authServices.handleFacebookSignup(userInfo)
                    break;
                default:
                    throw new Error("Invalid signup type")
            }
            log.info(result)
            res.status(200).json({ message: "Account created successfully", result });
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

/**
 * Handles Signup for Email&Password, Google and Facebook
 * @memberof authController
 * @function logoutUser
 * @name logoutUser
 * @param {object} req 
 * @param {object} res 
 * @returns {Promise<object>} res
 */
const logoutUser = async (req, res) => {
    const uid = req.body.uid;
    const pattern = uid + '*'; // Construct pattern to match keys with the specified UID prefix

    redisClient.scan('0', 'MATCH', pattern, 'COUNT', '100', (err, reply) => {
        if (err) {
            console.error('Error scanning keys:', err);
            return;
        }
        const keys = reply[1]; // Extract keys from reply
        if (keys.length > 0) {
            console.log('Keys found:', keys)
            redisClient.del(keys, (err, reply) => {
                if (err) {
                    console.error('Error deleting keys:', err);
                } else {
                    console.log('Keys deleted:', keys);
                }
            });
            res.status(200).json({ message: "User logout successful" });
        } else {
            console.log('No keys found matching the pattern:', pattern);
            res.status(200).json({ message: "User logout successful" });
        }
    });
}

module.exports = {
    loginUser,
    signupUser,
    logoutUser
}