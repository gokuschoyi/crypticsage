const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const config = require('../config');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const types = require('../typedefs')

const MDBServices = require('../services/mongoDBServices');
const authUtil = require('../utils/authUtil');
const { verifyGoogleCredentials } = require('../utils/googleAuthenticator')

/**
 * @namespace authServices
 * @description Controller for handling all authentication related requests
 */

// < --------------------- Login User --------------------- >

/**
 * Generates a JWT Token for the user
 * @ignore
 * @param {string} email Email of the user 
 * @param {string} user_name Name of the user 
 * @param {string} uid Unique ID of the user 
 * @returns {Promise<string>}
 */
const generateJWTToken = async (email, user_name, uid) => {
    try {
        const token = jwt.sign(
            {
                email: email,
                user_name: user_name,
                uid: uid
            },
            config.tokenKey ?? '',
            {
                expiresIn: config.tokenExpirationTime
            }
        );
        return token
    } catch (error) {
        log.error(error.stack)
        throw new Error("Error generating JWT Token")
    }
}

/**
 * Checks if the user is admin or not
 * @ignore
 * @param {string} email Email of the user to check if admin or not
 * @returns {boolean}
 */
const checkIsAdmin = (email) => {
    const adminList = ['goku@gmail.com', 'gokulsangamitrachoyi@gmail.com']
    let admin_status = adminList.includes(email);
    return admin_status
}

/**
 * Generates the user object for login
 * @ignore
 * @param {array} user User array object from the database
 * @param {boolean} adminStatus Admin status of the user
 * @param {string} token Access token of the user
 * @returns {Promise<types.UserLoginPayload>}
 */
const generateUserObjectForLogin = async (user, adminStatus, token) => {
    let userData = {}

    userData.accessToken = token;
    userData.admin_status = adminStatus;
    userData.email = user[0].email;
    userData.displayName = user[0].displayName;
    userData.emailVerified = user[0].emailVerified;
    userData.uid = user[0].uid;
    userData.preferences = user[0].preferences;
    userData.mobile_number = user[0].mobile_number;
    userData.signup_type = user[0].signup_type;
    userData.lesson_status = user[0].lesson_status;
    userData.passwordEmptyFlag = user[0].password === '' ? true : false;
    userData.profile_image = user[0].profile_image;

    return userData
}

/**
 * Handles email and password login and returns the user object and recent lesson and quiz
 * @ignore
 * @param {string} email Email of the user
 * @param {string} password Password of the user
 * @returns {Promise<{ userData: types.UserLoginPayload, recentLessonQuiz: types.RecentLessonQuiz }>}
 */
const handleEmailPasswordLogin = async (email, password) => {
    try {
        const user = await MDBServices.getUserByEmail(email)
        if (user.length === 0) {
            throw new Error("There is no account associated with your email. Register first. (Username/Password)")
        } else {
            const { email, user_name, uid } = user[0]
            const hashedPassword = user[0].password;
            const decryptedPassword = await bcrypt.compare(password, hashedPassword);
            if (!decryptedPassword) {
                throw new Error("Password is incorrect")
            } else {
                let adminStatus = checkIsAdmin(email)
                const token = await generateJWTToken(email, user_name, uid)
                let lesson_status = user[0].lesson_status
                let quiz_status = user[0].quiz_status
                let recent_lesson_quiz = await authUtil.getRecentLessonAndQuiz(lesson_status, quiz_status)

                let userData = await generateUserObjectForLogin(user, adminStatus, token)

                return {
                    userData: userData,
                    recentLessonQuiz: recent_lesson_quiz
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
 * @ignore
 * @param {string} credential The gmail credential of the user from google auth
 * @returns {Promise<{ userData: types.UserLoginPayload, recentLessonQuiz: types.RecentLessonQuiz }>}
 */
const handleGoogleLogin = async (credential) => {
    try {
        const payload = await verifyGoogleCredentials(credential)
        if (Object.keys(payload).length === 0) {
            throw new Error("Could not verify your google credentials")
        } else {
            let email = payload.email;
            const user = await MDBServices.getUserByEmail(email)
            if (user.length === 0) {
                throw new Error("There is no account associated with your email. Register first. (Google Login)")
            } else {
                let user_name = payload.given_name
                let adminStatus = checkIsAdmin(email)
                let uid = user[0].uid
                const token = await generateJWTToken(email, user_name, uid)
                let lesson_status = user[0].lesson_status
                let quiz_status = user[0].quiz_status
                let recent_lesson_quiz = await authUtil.getRecentLessonAndQuiz(lesson_status, quiz_status)

                let userData = await generateUserObjectForLogin(user, adminStatus, token)

                return {
                    userData: userData,
                    recentLessonQuiz: recent_lesson_quiz
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
 * @ignore
 * @param {string} facebook_email Email of the user from facebook
 * @returns {Promise<{ userData: types.UserLoginPayload, recentLessonQuiz: types.RecentLessonQuiz }>}
 */
const handleFacebookLogin = async (facebook_email) => {
    try {
        const user = await MDBServices.getUserByEmail(facebook_email)
        if (user.length === 0) {
            throw new Error("There is no account associated with your email. Register first. (Facebook Login)")
        } else {
            const { email, user_name, uid } = user[0]
            let adminStatus = checkIsAdmin(email)
            const token = await generateJWTToken(email, user_name, uid)
            let lesson_status = user[0].lesson_status
            let quiz_status = user[0].quiz_status
            let recent_lesson_quiz = await authUtil.getRecentLessonAndQuiz(lesson_status, quiz_status)

            let userData = await generateUserObjectForLogin(user, adminStatus, token)

            return {
                userData: userData,
                recentLessonQuiz: recent_lesson_quiz
            };
        }
    } catch (error) {
        log.error(error.stack)
        throw new Error(error.message)
    }
}

/**
 * @memberof authServices
 * @function loginUser
 * @name loginUser
 * @description Main function to handle all login types and returns the user object and recent lesson and quiz
 * @param {string} login_type The type of login `emailpassword` | `google` | `facebook`
 * @param {object} params The params object containing the login credentials
 * @returns {Promise<{ userData: types.UserLoginPayload, recentLessonQuiz: types.RecentLessonQuiz }>}
 */
const processUserLogin = async (login_type, params) => {
    let userData
    let recent_lesson_quiz
    let processed = {}
    switch (login_type) {
        case 'emailpassword':
            const email = params.email
            const password = params.password
            processed = await handleEmailPasswordLogin(email, password)
            // [userData, recent_lesson_quiz] = await handleEmailPasswordLogin(email, password)
            break;
        case 'google':
            const credential = params.credential
            processed = await handleGoogleLogin(credential)
            break;
        case 'facebook':
            const facebook_email = params.facebook_email
            processed = await handleFacebookLogin(facebook_email)
            break;
        default:
            throw new Error("Invalid login type")
    }
    userData = processed.userData
    recent_lesson_quiz = processed.recentLessonQuiz
    return {
        userData: userData,
        recentLessonQuiz: recent_lesson_quiz
    };
}

// < --------------------- Login User --------------------- >

// < --------------------- Signup User --------------------- >

/**
 * Generates the user object for signup
 * @ignore
 * @param {string} type The type of signup `registration` | `google` | `facebook`
 * @param {object} payload The payload object containing the signup credentials
 * @returns {Promise<types.User>}
 */
const generateUserObjectForSignup = async (type, payload) => {
    /**
     * @type {types.User}
     */
    let userData = {}
    let userName, email, hashedPassword, mobile_number, lessonStatus, quizStatus, profile_image, emailVerified
    switch (type) {
        case 'registration':
            ({ userName, email, hashedPassword, mobile_number, lessonStatus, quizStatus } = payload)
            userData.displayName = userName;
            userData.email = email;
            userData.password = hashedPassword;
            userData.mobile_number = mobile_number;
            userData.profile_image = '';
            userData.emailVerified = false;
            userData.date = new Date().toLocaleString('au');
            userData.uid = uuidv4();
            userData.preferences = {
                theme: true,
                dashboardHover: true,
                collapsedSidebar: true,
            };
            userData.signup_type = 'registration';
            userData.lesson_status = lessonStatus;
            userData.quiz_status = quizStatus;
            break;
        case 'google':
            ({ userName, email, profile_image, emailVerified, lessonStatus, quizStatus } = payload)
            userData.displayName = userName;
            userData.email = email;
            userData.password = '';
            userData.mobile_number = '';
            userData.profile_image = profile_image;
            userData.emailVerified = emailVerified;
            userData.date = new Date().toLocaleString('au');
            userData.uid = uuidv4();
            userData.preferences = {
                theme: true,
                dashboardHover: true,
                collapsedSidebar: true,
            };
            userData.signup_type = 'google';
            userData.lesson_status = lessonStatus;
            userData.quiz_status = quizStatus;
            break;
        case 'facebook':
            ({ userName, email, profile_image, lessonStatus, quizStatus } = payload)
            userData.displayName = userName;
            userData.email = email;
            userData.password = '';
            userData.mobile_number = '';
            userData.profile_image = profile_image;
            userData.emailVerified = false;
            userData.date = new Date().toLocaleString('au');
            userData.uid = uuidv4();
            userData.preferences = {
                theme: true,
                dashboardHover: true,
                collapsedSidebar: true,
            };
            userData.signup_type = 'facebook';
            userData.lesson_status = lessonStatus;
            userData.quiz_status = quizStatus;
            break;
        default:
            throw new Error("Invalid signup type")
    }
    return userData
}

/**
 * Handles registration via email and password and returns the registered status
 * @ignore
 * @param {string} userName User name of the user
 * @param {string} email Email of the user
 * @param {string} password Password of the user
 * @param {string} mobile_number Mobile number of the user
 * @returns {Promise<boolean>}
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
            let userData = await generateUserObjectForSignup(type, payload)
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
 * @ignore
 * @param {string} credential The gmail credential of the user from google auth
 * @returns {Promise<boolean>}
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
                let userData = await generateUserObjectForSignup(type, payload)
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
 * @ignore
 * @param {object} userInfo The user info object from facebook 
 * @returns {Promise<boolean>}
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
            let userData = await generateUserObjectForSignup(type, payload)
            let registered = await MDBServices.insertNewUser(userData)
            return registered.acknowledged
        }
    } catch (error) {
        log.error(error.stack)
        throw new Error(error.message)
    }
}



/**
 * @memberof authServices
 * @function signupUser
 * @description Handles all type of signup and returns the registered status
 * @param {string} signup_type The type of signup `registration` | `google` | `facebook`
 * @param {object} params The params object containing the signup credentials
 * @returns {Promise<boolean>}
 */
const processUserSignup = async (signup_type, params) => {
    let result
    switch (signup_type) {
        case 'registration':
            const { userName, email, password, mobile_number } = params
            result = await handleEmailPasswordSignup(userName, email, password, mobile_number)
            break;
        case 'google':
            const { credentials } = params
            result = await handleGoogleSignup(credentials)
            break;
        case 'facebook':
            const { userInfo } = params
            result = await handleFacebookSignup(userInfo)
            break;
        default:
            throw new Error("Invalid signup type")
    }
    return result
}

// < --------------------- Signup User --------------------- >


module.exports = {
    processUserLogin,
    processUserSignup
}