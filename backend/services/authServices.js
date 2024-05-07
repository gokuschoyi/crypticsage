const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const bcrypt = require('bcrypt');
const types = require('../typedefs')

const MDBServices = require('../services/mongoDBServices');
const authUtil = require('../utils/authUtil');
const { verifyGoogleCredentials } = require('../utils/googleAuthenticator')
const getWordOfTheDay = require('../data/wodData')
/**
 * @namespace authServices
 * @description Controller for handling all authentication related requests
 */


// < --------------------- Login User --------------------- >

/**
 * Handles email and password login and returns the user object and recent lesson and quiz
 * @function handleEmailPasswordLogin
 * @memberof authServices
 * @name EmailPasswordLogin
 * @param {string} email Email of the user
 * @param {string} password Password of the user
 * @returns {Promise<{ userData: types.UserLoginPayload, recentLessonQuiz: types.RecentLessonQuiz, word:types.Word }>}
 * @see {@link authController.loginUser}
 */
const handleEmailPasswordLogin = async (email, password) => {
    try {
        const user = await MDBServices.getUserByEmail(email)
        const sectionIDs = await MDBServices.getSectionIDs()
        if (user.length === 0) {
            throw new Error("There is no account associated with your email. Register first. (Username/Password)")
        } else {
            const { email, user_name, uid } = user[0]
            const hashedPassword = user[0].password;
            const decryptedPassword = await bcrypt.compare(password, hashedPassword);
            if (!decryptedPassword) {
                throw new Error("Password is incorrect")
            } else {
                let adminStatus = authUtil.checkIsAdmin(email)
                const token = await authUtil.generateJWTToken(email, user_name, uid)
                let lesson_status = user[0].lesson_status
                let quiz_status = user[0].quiz_status
                let recent_lesson_quiz = await authUtil.getRecentLessonAndQuiz(lesson_status, quiz_status, sectionIDs)

                let userData = await authUtil.generateUserObjectForLogin(user, adminStatus, token)
                const wod = getWordOfTheDay()
                return {
                    userData: userData,
                    recentLessonQuiz: recent_lesson_quiz,
                    word: wod
                };
            }
        }
    } catch (error) {
        log.error(error.stack)
        throw new Error(error.message)
    }
}

/**
 * Handles the login via google and returns the user object and recent lesson and quiz
 * @memberof authServices
 * @function handleGoogleLogin
 * @name GoogleLogin
 * @param {string} credential The gmail credential of the user from google auth
 * @returns {Promise<{ userData: types.UserLoginPayload, recentLessonQuiz: types.RecentLessonQuiz, word:types.Word }>}
 * @see {@link authController.loginUser}
 */
const handleGoogleLogin = async (credential) => {
    try {
        const payload = await verifyGoogleCredentials(credential)
        if (Object.keys(payload).length === 0) {
            throw new Error("Could not verify your google credentials")
        } else {
            let email = payload.email;
            const user = await MDBServices.getUserByEmail(email)
            const sectionIDs = await MDBServices.getSectionIDs()
            if (user.length === 0) {
                throw new Error("There is no account associated with your email. Register first. (Google Login)")
            } else {
                let user_name = payload.given_name
                let adminStatus = authUtil.checkIsAdmin(email)
                let uid = user[0].uid
                const token = await authUtil.generateJWTToken(email, user_name, uid)
                let lesson_status = user[0].lesson_status
                let quiz_status = user[0].quiz_status
                let recent_lesson_quiz = await authUtil.getRecentLessonAndQuiz(lesson_status, quiz_status, sectionIDs)

                let userData = await authUtil.generateUserObjectForLogin(user, adminStatus, token)

                const wod = getWordOfTheDay()
                return {
                    userData: userData,
                    recentLessonQuiz: recent_lesson_quiz,
                    word: wod
                };
            }
        }
    } catch (error) {
        log.error(error.stack)
        throw new Error(error.message)
    }
}

/**
 * Handles the login via facebook and returns the user object and recent lesson and quiz
 * @memberof authServices
 * @function handleFacebookLogin
 * @name FacebookLogin
 * @param {string} facebook_email Email of the user from facebook
 * @returns {Promise<{ userData: types.UserLoginPayload, recentLessonQuiz: types.RecentLessonQuiz, word:types.Word }>}
 * @see {@link authController.loginUser}
 */
const handleFacebookLogin = async (facebook_email) => {
    try {
        const user = await MDBServices.getUserByEmail(facebook_email)
        const sectionIDs = await MDBServices.getSectionIDs()
        if (user.length === 0) {
            throw new Error("There is no account associated with your email. Register first. (Facebook Login)")
        } else {
            const { email, user_name, uid } = user[0]
            let adminStatus = authUtil.checkIsAdmin(email)
            const token = await authUtil.generateJWTToken(email, user_name, uid)
            let lesson_status = user[0].lesson_status
            let quiz_status = user[0].quiz_status
            let recent_lesson_quiz = await authUtil.getRecentLessonAndQuiz(lesson_status, quiz_status, sectionIDs)

            let userData = await authUtil.generateUserObjectForLogin(user, adminStatus, token)

            const wod = getWordOfTheDay()
            return {
                userData: userData,
                recentLessonQuiz: recent_lesson_quiz,
                word: wod
            };
        }
    } catch (error) {
        log.error(error.stack)
        throw new Error(error.message)
    }
}

// < --------------------- Login User --------------------- >


// < --------------------- Signup User --------------------- >

/**
 * Handles registration via email and password and returns the registered status
 * @memberof authServices
 * @function handleEmailPasswordSignup
 * @name EmailPasswordSignup
 * @param {string} userName User name of the user
 * @param {string} email Email of the user
 * @param {string} password Password of the user
 * @param {string} mobile_number Mobile number of the user
 * @returns {Promise<boolean>}
 * @see {@link authController.signupUser}
 */
const handleEmailPasswordSignup = async (userName, email, password, mobile_number) => {
    try {
        const doesUserExist = await MDBServices.checkUserExists(email)
        if (doesUserExist) {
            throw new Error("Email already in use, try logging in")
        } else {
            log.info("email not in use");
            const hashedPassword = await bcrypt.hash(password, 10);
            let lessonStatus = await MDBServices.makeUserLessonStatus()
            let quizStatus = await MDBServices.makeUserQuizStatus()
            let payload = {
                userName,
                email,
                mobile_number,
                hashedPassword,
                lessonStatus,
                quizStatus
            }
            const type = 'registration'
            let userData = await authUtil.generateUserObjectForSignup(type, payload)
            let registered = await MDBServices.insertNewUser(userData)
            return registered.acknowledged
        }
    } catch (error) {
        log.error(error.stack)
        throw new Error(error.message)
    }
}

/**
 * Handles registration via google and returns the registered status
 * @memberof authServices
 * @function handleGoogleSignup
 * @name GoogleSignup
 * @param {string} credential The gmail credential of the user from google auth
 * @returns {Promise<boolean>}
 * @see {@link authController.signupUser}
 */
const handleGoogleSignup = async (credential) => {
    try {
        const googlePayload = await verifyGoogleCredentials(credential)
        if (Object.keys(googlePayload).length === 0) {
            throw new Error("Could not verify your google credentials")
        } else {
            const { email } = googlePayload
            const doesUserExist = await MDBServices.checkUserExists(email)
            if (doesUserExist) {
                throw new Error("Account already exists, Signin with your google account")
            } else {
                let lessonStatus = await MDBServices.makeUserLessonStatus()
                let quizStatus = await MDBServices.makeUserQuizStatus()
                let payload = {
                    userName: googlePayload.given_name,
                    email: googlePayload.email,
                    profile_image: googlePayload.picture,
                    emailVerified: googlePayload.email_verified,
                    lessonStatus,
                    quizStatus
                }
                const type = 'google'
                let userData = await authUtil.generateUserObjectForSignup(type, payload)
                let registered = await MDBServices.insertNewUser(userData)
                return registered.acknowledged
            }
        }
    } catch (error) {
        log.error(error.stack)
        throw new Error(error.message)
    }
}

/**
 * Handles registration via facebook and returns the registered status
 * @memberof authServices
 * @function handleFacebookSignup
 * @name FacebookSignup
 * @param {object} userInfo The user info object from facebook 
 * @returns {Promise<boolean>}
 * @see {@link authController.signupUser}
 */
const handleFacebookSignup = async (userInfo) => {
    try {
        const { email } = userInfo
        const doesUserExist = await MDBServices.checkUserExists(email)
        if (doesUserExist) {
            throw new Error("User already exists, Signin with your google account")
        } else {
            let lessonStatus = await MDBServices.makeUserLessonStatus()
            let quizStatus = await MDBServices.makeUserQuizStatus()
            let payload = {
                userName: userInfo.first_name,
                email: userInfo.email,
                profile_image: userInfo.picture.data.url,
                lessonStatus,
                quizStatus
            }
            const type = 'facebook'
            let userData = await authUtil.generateUserObjectForSignup(type, payload)
            let registered = await MDBServices.insertNewUser(userData)
            return registered.acknowledged
        }
    } catch (error) {
        log.error(error.stack)
        throw new Error(error.message)
    }
}

// < --------------------- Signup User --------------------- >


module.exports = {
    handleEmailPasswordLogin
    , handleGoogleLogin
    , handleFacebookLogin
    , handleEmailPasswordSignup
    , handleGoogleSignup
    , handleFacebookSignup
}