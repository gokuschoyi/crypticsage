/**
 * @namespace authController
 * @description Controller for handling all authentication related requests
 */

const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1));
const { redisClient } = require('../services/redis')
const Validator = require('../utils/validator');
const authServices = require('../services/authServices')
const MDBS = require('../services/mongoDBServices')


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
            const { uid } = userData
            const in_progress_models = await MDBS.get_userInProgressModels(uid)
            res.status(200).json({ message: "User login successful", data: userData, recent_lesson_quiz: recent_lesson_quiz, word: word, in_progress_models });
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
 * Handles Logout for User
 * @memberof authController
 * @function logoutUser
 * @name logoutUser
 * @param {object} req 
 * @param {object} res 
 * @returns {Promise<object>} res
 */
const logoutUser = async (req, res) => {
    const { uid, model_type, training_in_progress, in_training, training_parameters, ...rest } = req.body
    if (model_type === 'WGAN-GP' && training_in_progress) {
        console.log('Save model checkpoint and training progress to database')
        const logout_time = new Date().getTime()

        // MDBS.update_inProgressModel(uid, model_id, logout_time)

        await MDBS.add_inProgressModel({
            uid
            , model_type
            , ...rest
            , logout_time
            , training_completed: false
            , saved_to_db: false
            , cached_data: {
                training_parameters
            }
        })
    } else {
        console.log('No new model checkpoint and training progress to save')
    }

    const scanAndDeleteKeys = async (pattern, filterFunc = () => true) => {
        return new Promise((resolve, reject) => {
            redisClient.scan('0', 'MATCH', pattern, 'COUNT', '100', (err, reply) => {
                if (err) {
                    console.error(`Error scanning keys for pattern ${pattern}:`, err);
                    return reject(err);
                }

                const keys = reply[1];
                if (keys.length > 0) {
                    const keysToRemove = keys.filter(filterFunc);
                    if (keysToRemove.length > 0) {
                        redisClient.del(keysToRemove, (err, reply) => {
                            if (err) {
                                console.error(`Error deleting keys for pattern ${pattern}:`, err);
                                return reject(err);
                            } else {
                                console.log(`Keys deleted for pattern ${pattern}:`, keysToRemove);
                                return resolve(reply);
                            }
                        });
                    } else {
                        console.log(`No keys to remove for pattern ${pattern}`);
                        return resolve(true);
                    }
                } else {
                    console.log(`No keys found matching the pattern ${pattern}`);
                    return resolve(false);
                }
            });
        });
    };

    const training_data_pattern = uid + "_*_*-*-*_" + "historical_data";
    const ohlcv_pattern = uid + '_crypto' + '*';
    try {
        await Promise.all([
            in_training.length > 0
                ? scanAndDeleteKeys(training_data_pattern, (key) => {
                    const model_id = key.split('_')[1];
                    return !in_training.includes(model_id);
                })
                : scanAndDeleteKeys(training_data_pattern),
            scanAndDeleteKeys(ohlcv_pattern)
        ]);
    } catch (error) {
        console.error('Error during logout process:', error);
    }
    res.status(200).json({ message: "User logout successful" });
}

module.exports = {
    loginUser,
    signupUser,
    logoutUser
}