const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1));

const Validator = require('../utils/validator');
const authServices = require('../services/authServices')

/**
 * Login controller
 * @param {object} req 
 * @param {object} res
 * @returns {Promise<object>} res
 */
const loginUser = async (req, res) => {
    try {
        const params = req.body;
        const { login_type } = params;
        let isInputValid = Validator.validateLoginInput({ login_type, params });
        if (isInputValid) {
            const loginData = await authServices.processUserLogin(login_type, params);
            res.status(200).json({ message: "User login successful", data: loginData.userData, recent_lesson_quiz: loginData.recentLessonQuiz });
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

/**
 * Signup controller
 * @param {object} req 
 * @param {object} res 
 * @returns {Promise<object>} res
 */

const signupUser = async (req, res) => {
    try {
        const params = req.body;
        const { signup_type } = params;
        let isInputValid = Validator.validateSignupInput({ signup_type, params })
        if (isInputValid) {
            let registered = await authServices.processUserSignup(signup_type, params);
            log.info(registered)
            res.status(200).json({ message: "Account created successfully", registered });
        }
    } catch (error) {
        log.error(error.stack)
        res.status(400).json({ message: error.message });
    }
}

module.exports = {
    loginUser,
    signupUser,
}