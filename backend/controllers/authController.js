const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1));
const { redisClient } = require('../services/redis')
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
            res.status(200).json({ message: "User login successful", data: loginData.userData, recent_lesson_quiz: loginData.recentLessonQuiz, word: loginData.word});
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
        }
    });
}

module.exports = {
    loginUser,
    signupUser,
    logoutUser
}