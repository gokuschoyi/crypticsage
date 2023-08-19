const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const config = require('../config');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { close } = require('../services/db-conn')

const MDBServices = require('../services/mongoDBServices');
const authUtil = require('../utils/authUtil');
const { verifyGoogleCredentials } = require('../utils/googleAuthenticator')

// < --------------------- Login User --------------------- >

const generateJWTToken = async ({ email, user_name, uid }) => {
    try {
        const token = jwt.sign(
            {
                email: email,
                user_name: user_name,
                uid: uid
            },
            config.tokenKey,
            {
                expiresIn: config.tokenExpirationTime
            }
        );
        return token
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error(formattedError)
        throw new Error("Error generating JWT Token")
    }
}

const checkIsAdmin = ({ email }) => {
    const adminList = ['goku@gmail.com', 'gokulsangamitrachoyi@gmail.com']
    admin_status = adminList.includes(email);
    return admin_status
}

const generateUserObjectForLogin = async ({ user, adminStatus, token }) => {
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


// handles the login via email and password and returns the user object and recent lesson and quiz
// INPUT : email, password 
// OUTPUT : [user, recent_lesson_quiz] 
const handleEmailPasswordLogin = async ({ email, password }) => {
    const connectMessage = 'loginUser - emailpassword'
    try {
        const user = await MDBServices.getUserByEmail({ email, connectMessage })
        if (user.length === 0) {
            throw new Error("There is no account associated with your email. Register first. (Username/Password)")
        } else {
            const hashedPassword = user[0].password;
            const decryptedPassword = await bcrypt.compare(password, hashedPassword);
            if (!decryptedPassword) {
                throw new Error("Password is incorrect")
            } else {
                let adminStatus = checkIsAdmin({ email })
                const token = await generateJWTToken({ email: user[0].email, user_name: user[0].user_name, uid: user[0].uid })
                let lesson_status = user[0].lesson_status
                let quiz_status = user[0].quiz_status
                let recent_lesson_quiz = await authUtil.getRecentLessonAndQuiz(lesson_status, quiz_status)

                let userData = await generateUserObjectForLogin({ user, adminStatus, token })

                return [userData, recent_lesson_quiz]
            }
        }
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error(formattedError)
        throw new Error(error.message)
    } finally {
        close(connectMessage)
    }
}

// handles the login via google and returns the user object and recent lesson and quiz
// INPUT : credential
// OUTPUT : [user, recent_lesson_quiz]
const handleGoogleLogin = async ({ credential }) => {
    const connectMessage = 'loginUser - google'
    try {
        const payload = await verifyGoogleCredentials(credential)
        if (Object.keys(payload).length === 0) {
            throw new Error("Could not verify your google credentials")
        } else {
            let email = payload.email;
            const user = await MDBServices.getUserByEmail({ email, connectMessage })
            if (user.length === 0) {
                throw new Error("There is no account associated with your email. Register first. (Google Login)")
            } else {
                let adminStatus = checkIsAdmin({ email })
                const token = await generateJWTToken({ email: payload.email, user_name: payload.given_name, uid: user[0].uid })
                let lesson_status = user[0].lesson_status
                let quiz_status = user[0].quiz_status
                let recent_lesson_quiz = await authUtil.getRecentLessonAndQuiz(lesson_status, quiz_status)

                let userData = await generateUserObjectForLogin({ user, adminStatus, token })

                return [userData, recent_lesson_quiz]
            }
        }
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error(formattedError)
        throw new Error(error.message)
    } finally {
        close(connectMessage)
    }
}

// handles the login via facebook and returns the user object and recent lesson and quiz
// INPUT : facebook_email
// OUTPUT : [user, recent_lesson_quiz]
const handleFacebookLogin = async ({ facebook_email }) => {
    const connectMessage = 'loginUser - facebook'
    try {
        const user = await MDBServices.getUserByEmail({ email: facebook_email, connectMessage })
        if (user.length === 0) {
            throw new Error("There is no account associated with your email. Register first. (Facebook Login)")
        } else {
            let adminStatus = checkIsAdmin({ facebook_email })
            const token = await generateJWTToken({ email: user[0].email, user_name: user[0].user_name, uid: user[0].uid })
            let lesson_status = user[0].lesson_status
            let quiz_status = user[0].quiz_status
            let recent_lesson_quiz = await authUtil.getRecentLessonAndQuiz(lesson_status, quiz_status)

            let userData = await generateUserObjectForLogin({ user, adminStatus, token })

            return [userData, recent_lesson_quiz]
        }
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error(formattedError)
        throw new Error(error.message)
    } finally {
        close(connectMessage)
    }
}

// handles all login types and returns the user object and recent lesson and quiz
// INPUT : login_type, params
// OUTPUT : [user, recent_lesson_quiz]
const processUserLogin = async ({ login_type, params }) => {
    switch (login_type) {
        case 'emailpassword':
            [userData, recent_lesson_quiz] = await handleEmailPasswordLogin({ email: params.email, password: params.password })
            break;
        case 'google':
            [userData, recent_lesson_quiz] = await handleGoogleLogin({ credential: params.credential })
            break;
        case 'facebook':
            [userData, recent_lesson_quiz] = await handleFacebookLogin({ facebook_email: params.facebook_email })
            break;
        default:
            throw new Error("Invalid login type")
    }
    return [userData, recent_lesson_quiz]
}

// < --------------------- Login User --------------------- >

// < --------------------- Signup User --------------------- >


const generateUserObjectForSignup = async ({ type, payload }) => {
    let userData = {}
    switch (type) {
        case 'registration':
            ({ userName, email, hashedPassword, mobile_number, lessonStatus, quizStatus } = payload)
            userData = {
                displayName: userName,
                email: email,
                password: hashedPassword,
                mobile_number: mobile_number,
                profile_image: '',
                emailVerified: false,
                date: new Date().toLocaleString('au'),
                uid: uuidv4(),
                preferences: {
                    theme: true,
                    dashboardHover: true,
                    collapsedSidebar: true,
                },
                signup_type: 'registration',
                lesson_status: lessonStatus,
                quiz_status: quizStatus,
            }
            break;
        case 'google':
            ({ userName, email, profile_image, emailVerified, lessonStatus, quizStatus } = payload)
            userData = {
                displayName: userName,
                email: email,
                password: '',
                mobile_number: '',
                profile_image: profile_image,
                emailVerified: emailVerified,
                date: new Date().toLocaleString('au'),
                uid: uuidv4(),
                preferences: {
                    theme: true,
                    dashboardHover: true,
                    collapsedSidebar: true,
                },
                signup_type: 'google',
                lesson_status: lessonStatus,
                quiz_status: quizStatus,
            }
            break;
        case 'facebook':
            ({ userName, email, profile_image, lessonStatus, quizStatus } = payload)
            userData = {
                displayName: userName,
                email: email,
                password: '',
                mobile_number: '',
                profile_image: profile_image,
                emailVerified: false,
                date: new Date().toLocaleString('au'),
                uid: uuidv4(),
                preferences: {
                    theme: true,
                    dashboardHover: true,
                    collapsedSidebar: true,
                },
                signup_type: 'facebook',
                lesson_status: lessonStatus,
                quiz_status: quizStatus,
            }
            break;
        default:
            throw new Error("Invalid signup type")
    }
    return userData
}

// handles registration via email and password
// INPUT - { userName, email, password, mobile_number }
// OUTPUT - registered status
const handleEmailPasswordSignup = async ({ userName, email, password, mobile_number }) => {
    const connectMessage = 'createNewUser - registration'
    try {
        const doesUserExist = await MDBServices.checkUserExists({ email, connectMessage })
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
            let userData = await generateUserObjectForSignup({ type: 'registration', payload })
            let registered = await MDBServices.insertNewUser({ userData })
            return registered
        }
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error(formattedError)
        throw new Error(error.message)
    } finally {
        await close(connectMessage)
    }
}

// handles registration via google
// INPUT - { credential }
// OUTPUT - registered status
const handleGoogleSignup = async ({ credential }) => {
    const connectMessage = 'createNewUser - google'
    try {
        const googlePayload = await verifyGoogleCredentials(credential)
        if (Object.keys(googlePayload).length === 0) {
            throw new Error("Could not verify your google credentials")
        } else {
            const { email } = googlePayload
            const doesUserExist = await MDBServices.checkUserExists({ email, connectMessage })
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
                let userData = await generateUserObjectForSignup({ type: 'google', payload })
                let registered = await MDBServices.insertNewUser({ userData })
                return registered
            }
        }
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error(formattedError)
        throw new Error(error.message)
    } finally {
        await close(connectMessage)
    }
}

// handles registration via facebook
// INPUT - { userInfo }
// OUTPUT - registered status
const handleFacebookSignup = async ({ userInfo }) => {
    const connectMessage = 'createNewUser - facebook'
    try {
        const { email } = userInfo
        const doesUserExist = await MDBServices.checkUserExists({ email, connectMessage })
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
            let userData = await generateUserObjectForSignup({ type: 'facebook', payload })
            let registered = await MDBServices.insertNewUser({ userData })
            return registered
        }
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error(formattedError)
        throw new Error(error.message)
    } finally {
        await close(connectMessage)
    }
}

// handles all type of signup
// INPUT - { signup_type, params }
// OUTPUT - registered status
const processUserSignup = async ({ signup_type, params }) => {
    switch (signup_type) {
        case 'registration':
            result = await handleEmailPasswordSignup({ userName: params.userName, email: params.email, password: params.password, mobile_number: params.mobile_number })
            break;
        case 'google':
            result = await handleGoogleSignup({ credential: params.credentials })
            break;
        case 'facebook':
            result = await handleFacebookSignup({ userInfo: params.userInfo })
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