const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const bcrypt = require('bcrypt');
const MDBServices = require('../services/mongoDBServices');
const AuthUtil = require('../utils/authUtil')
const types = require('../typedefs')

// < --------------------- Settings Page --------------------- >

/**
 * Verifies the user password before changing it if it exists for that user.
 * If the user has signed up with Google or Facebook, then no password is set.
 * 
 * @param {Object} input - An object containing email and password.
 * @param {string} input.email - The user's email.
 * @param {string} input.password - The user's password.
 * @returns {Promise<[message: string, validPassword: boolean]>}  output - An array containing a message and a validPassword flag.
 * @example
 * // On success
 * {
 *     "message": "Password verified successfully",
 *     "validPassword": true
 * }
 * 
 * @example
 * // On failure
 * {
 *     "message": "Error: Incorrect Password",
 *     "validPassword": false
 * }
 */
const processVerifyPassword = async ({ email, password }) => {
    try {
        const user = await MDBServices.getUserByEmail(email)
        const hashedPassword = user[0].password;
        let validPassword = false;
        if (hashedPassword === '' && (user[0].signup_type === 'google' || user[0].signup_type === 'facebook')) {
            validPassword = true
            let message = 'No password set, Signup type google or facebook'
            return [message, validPassword]
        } else {
            validPassword = await bcrypt.compare(password, hashedPassword);
            if (validPassword) {
                let message = 'Password verified successfully'
                return [message, validPassword]
            } else {
                throw new Error('Incorrect Password')
            }
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/**
 * Updates the user password to a new one.
 * @param {Object} input - An object containing email and password.
 * @param {string} input.email - The user's email.
 * @param {string} input.newPassword - The user's password.
 * @returns {Promise<[message: string, uStatus: boolean]>}  output - An array containing message and updated status flag.
 * @example
 * // On success
 * [
 *     "message": "Password updated successfully",
 *     "status": true
 * ]
 */
const processUpdatePassword = async ({ email, newPassword }) => {
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const result = await MDBServices.updateUserPasswordByEmail(email, hashedPassword)
        if (result.modifiedCount === 1) {
            let message = 'Password updated successfully'
            let uStatus = true
            return [message, uStatus]
        } else {
            throw new Error('Password update failed')
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/**
 * Updates the user profile picture to a new one.
 * @param {Object} input - An object containing email and base64 image.
 * @param {string} input.email - The user's email.
 * @param {string} input.profilePicture - Base 64 encoded image string.
 * @returns {Promise<[message: string, uStatus: boolean]>}  output - An array containing message and updated status flag.
 * @example
 * // On success
 * [
 *     "message": "Profile image updated successfully",
 *     "status": true
 * ]
 */
const processUpdateProfilePicture = async ({ email, profilePicture }) => {
    try {
        const updateResult = await MDBServices.updateUserProfilePicture(email, profilePicture)
        if (updateResult.modifiedCount === 1) {
            let message = "Profile image updated successfully"
            let uStatus = true
            return [message, uStatus]
        } else {
            throw new Error('Profile image update failed')
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/**
 * Updates the user DisplayName and mobile number.
 * @param {Object} input - An object containing email and base64 image.
 * @param {string} input.email - The user's email.
 * @param {object} input.userData - The user data object. {displayName: string, mobile_number: string}
 * @param {string} input.userData.displayName - The user's display name.
 * @param {string} input.userData.mobile_number - The user's mobile number.
 * @returns {Promise<[message: string, uStatus: boolean]>}  output - An array containing message and updated status flag.
 * @example
 * // On success
 * [
 *     "message": "User data updated successfull",
 *     "status": true
 * ]
 */
const processUpdateUserData = async ({ email, userData }) => {
    try {
        const updateResult = await MDBServices.updateUserData(email, userData)
        if (updateResult) {
            let message = "User data updated successfully"
            let uStatus = true
            return [message, uStatus]
        } else {
            throw new Error('User data update failed')
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/**
 * Updates the user preferences
 * @param {Object} input - An object containing email and base64 image.
 * @param {string} input.email - The user's email.
 * @param {object} input.preferences - The user preferences object.
 * @param {boolean} input.preferences.dashboardHover - The user's display name.
 * @param {boolean} input.preferences.theme - The user's mobile number.
 * @param {boolean} input.preferences.collapsedSidebar - The user's mobile number.
 * @returns {Promise<[message: string, uStatus: boolean]>}  output - An array containing message and updated status flag.
 * @example
 * // On success
 * [
 *     "message": "User preferences updated successfully",
 *     "status": true
 * ]
 */
const processUpdateUserPreferences = async ({ email, preferences }) => {
    try {
        const updatePreference = await MDBServices.updateUserPreferences(email, preferences)
        if (updatePreference) {
            let message = "User preferences updated successfully"
            let uStatus = true
            return [message, uStatus]
        } else {
            throw new Error('User preferences update failed')
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// < --------------------- Settings Page --------------------- >


// < --------------------- Dashboard Page --------------------- >

/**
 * Updates the lesson status for the user after completing a lesson. Sections/Slides pages in lessons.
 * @param {Object} input - An object containing email and base64 image.
 * @param {string} input.email - The user's email.
 * @param {types.LessonStatus} input.lesson_status - The user lesson status object.
 * @returns {Promise<[message: string, uStatus: boolean, userLessonStatus:object]>}  output - An array containing a message and a status flag and lesson status object.
 * @example
 * // On success
 * {
 *   "message": "User preferences updated successfully",
 *   "status": true,
 *   "lessonStatus": {
 *      "2ab70e1b-3676-4b79-bfb5-57fd448ec98e": [
 *          {
 *              "section_id": "2ab70e1b-3676-4b79-bfb5-57fd448ec98e",
 *              "lesson_id": "8ed93f99-3c37-428c-af92-c322c79b4384",
 *              "lesson_name": "qwe",
 *              "next_chapter_id": null,
 *              "prev_chapter_id": null,
 *              "parent_section_id": null,
 *              "lesson_start": false,
 *              "lesson_progress": 1,
 *              "lesson_completed": false,
 *              "lesson_completed_date": ""
 *          }
 *      ]
 * }   
 */
const processUpdateUserLessonStatus = async ({ email, lesson_status }) => {
    try {
        const updateLessonStatus = await MDBServices.updateUserLessonStatus(email, lesson_status)
        const [message, uStatus, userLessonStatus] = updateLessonStatus
        return [message, uStatus, userLessonStatus]
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/**
 * Gets all the quiz data for the user. Quiz page initial fetch.
 * @param {Object} input - An object containing email.
 * @param {string} input.email - The user's email. 
 * @returns {Promise<Array>}  output - An array containing all the quiz data.
 * @example
 * // On success
 * {
 *   "message": "Quiz data fetched successfully",
 *   "transformedQuizData": [
 *       {
 *           "sectionName": "Introduction to the market",
 *           "sectionId": "5119f37b-ef44-4272-a536-04af51ef4bbc",
 *           "lessons": [
 *               {
 *                   "lessonName": "Candle Stick",
 *                   "lessonID": "a4d32182-98ba-4968-90c3-aa0c27751d55",
 *                   "allQuizzes": [
 *                       {
 *                           "quizId": "2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1",
 *                           "quizTitle": "Candle Stick Quiz 1",
 *                           "quizCompleted": true,
 *                           "quizCompletedDate": "7/31/2023, 3:25:07 PM",
 *                           "quizScore": 2,
 *                           "quizTotal": 3
 *                       }
 *                   ]
 *               }
 *           ]
 *       }. . .
 *   ]
 * }
 */
const processGetInitialQuizDataForUser = async ({ email }) => {
    try {
        let user = await MDBServices.getUserByEmail(email)
        // log.info(user)
        let userQuizStatus = user[0].quiz_status
        let transformedQuizData = await MDBServices.getInitialQuizDataForUser(userQuizStatus)
        return transformedQuizData
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/**
 * Fetch the quiz data for the user. Quiz page fetch.
 * @param {Object} input - An object containing quizId.
 * @param {string} input.quizId - The quiz id. 
 * @returns {Promise<Array>}  output - An array containing the quiz data.
 * @example
 * // On success
 * {
 *      "message": "Quiz fetched successfully",
 *      "selectedQuiz": [
 *          {
 *              "_id": "644a0b85c440a2fcc864e7a7",
 *              "sectionId": "5119f37b-ef44-4272-a536-04af51ef4bbc",
 *              "sectionName": "Introduction to the market",
 *              "lessonId": "a4d32182-98ba-4968-90c3-aa0c27751d55",
 *              "lessonName": "Candle Stick",
 *              "quizId": "2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1",
 *              "quizTitle": "Candle Stick Quiz 1",
 *              "quizDescription": "Candle Stick Quiz 1",
 *              "questions": [
 *                  {
 *                      "question": "Candle Stick Quiz 1",
 *                      "options": [
 *                          {
 *                              "option": "a"
 *                          },
 *                          {
 *                              "option": "s"
 *                          },
 *                          {
 *                              "option": "d"
 *                          }
 *                      ],
 *                      "question_id": "b2a7a4a9-ba94-49d5-bfe7-e1579b60a4ec"
 *                  }, {}, {}
 *              ]
 *          }
 *      ]
 * }
 */
const processGetQuiz = async ({ quizId }) => {
    try {
        let selectedQuiz = await MDBServices.getQuizDataById(quizId)
        if (selectedQuiz.length === 0) {
            throw new Error('Quiz not found')
        } else {
            let updatedQuiz = selectedQuiz[0].questions.map((ques, index) => {
                const { correctAnswer, ...updatedQuestion } = ques
                return (
                    updatedQuestion
                )
            })
            selectedQuiz[0].questions = updatedQuiz
            return selectedQuiz
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/**
 * 
 * @param {object} input - An object containing email, sectionId, lessonId, quizId, quizData.
 * @param {string} input.email - The user's email.
 * @param {string} input.sectionId - The section id.
 * @param {string} input.lessonId - The lesson id.
 * @param {string} input.quizId - The quiz id.
 * @param {object} input.quizData - The user selections for the quiz.
 * @param {array} input.quizData.userSelection - The user selections for the quiz.
 * @returns {Promise<{score: number, total: number, quizTitle:string}>}  output - An object containing the quiz submission result.
 * @example
 * // On success
 * "data": {
 *      "score": 2,
 *      "total": 3,
 *      "quizTitle": "Candle Stick Quiz 1"
 *  }
 */
const processSubmitQuiz = async ({ email, sectionId, lessonId, quizId, quizData }) => {
    try {
        let quiz = await MDBServices.getQuizDataById(quizId)
        let score = 0
        let total = 0
        quiz[0].questions.forEach((question) => {
            quizData.userSelection.forEach((selection) => {
                if (question.question_id === selection.question_id) {
                    total = total + 1
                    if (question.correctAnswer === selection.selectedOption) {
                        score = score + 1
                    }
                }
            })
        })
        log.info(`quiz score : ${score}`)
        let data = {
            score: score,
            total: total,
            quizTitle: quiz[0].quizTitle,
        }
        const updateStatus = await MDBServices.updateQuizStatusForUser(email, sectionId, lessonId, quizId, score, total)
        if (updateStatus.acknowledged) {
            return data
        } else {
            throw new Error('Quiz status update failed')
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/**
 * Fetches the recent completed lesson and quiz along with the next lesson and quiz.
 * @param {object} input - An object containing email.
 * @param {string} input.email - The user's email.
 * @returns {Promise<{mostRecentLesson: Object, nextLesson: Object, mostRecentQuiz: Object, nextQuiz: Object}>}  output - An object containing the recent lesson and quiz status.
 * @example
 * {
 *      "mostRecentLesson": {
 *          "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
 *          "lesson_id": "4aa08919-369c-4ab4-93db-bf6e41b5b4fc",
 *          "lesson_name": "Crypto",
 *          "next_chapter_id": null,
 *          "prev_chapter_id": null,
 *          "parent_section_id": null,
 *          "lesson_start": true,
 *          "lesson_progress": 1,
 *          "lesson_completed": true,
 *          "lesson_completed_date": "8/1/2023, 10:46:49 AM"
 *      },
 *      "mostRecentQuiz": {
 *          "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
 *          "lesson_id": "a4d32182-98ba-4968-90c3-aa0c27751d55",
 *          "quiz_id": "2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1",
 *          "quiz_name": "Candle Stick Quiz 1",
 *          "quiz_completed_date": "8/1/2023, 10:55:01 AM",
 *          "quiz_score": 2,
 *          "quiz_completed": true,
 *          "quiz_total": 3
 *      },
 *     "nextLesson": {
 *          "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
 *          "lesson_id": "9d83198b-31ae-4717-af55-22bac8422c80",
 *          "lesson_name": "testting update",
 *          "next_chapter_id": null,
 *          "prev_chapter_id": null,
 *          "parent_section_id": null,
 *          "lesson_start": false,
 *          "lesson_progress": 1,
 *          "lesson_completed": false,
 *          "lesson_completed_date": ""
 *      },
 *      "nextQuiz": {
 *          "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
 *          "lesson_id": "a4d32182-98ba-4968-90c3-aa0c27751d55",
 *          "quiz_id": "78a33909-abdf-45ef-9024-220eeab59e27",
 *          "quiz_name": "Candle Stick Quiz 2",
 *          "quiz_completed_date": "12/10/2023, 1:14:00 PM",
 *          "quiz_score": 0,
 *          "quiz_completed": true,
 *          "quiz_total": 1
 *      }
 * } 
 */
const processGetRecentLessonAndQuiz = async ({ email }) => {
    try {
        let user = await MDBServices.getUserByEmail(email)
        const sectionIDs = await MDBServices.getSectionIDs()
        let lessonStatus = user[0].lesson_status
        let quizStatus = user[0].quiz_status
        let recentLessonQuizStatus = await AuthUtil.getRecentLessonAndQuiz(lessonStatus, quizStatus, sectionIDs)
        return recentLessonQuizStatus
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// process the file upload csv only
const processFileUpload = async (req) => {
    try {
        if (!req.files.length) {
            throw new Error('No files were uploaded')
        } else {
            let finalResult = AuthUtil.processUploadedCsv(req)
            return finalResult
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

module.exports = {
    processVerifyPassword
    , processUpdatePassword
    , processUpdateProfilePicture
    , processUpdateUserData
    , processUpdateUserPreferences
    , processUpdateUserLessonStatus
    , processGetInitialQuizDataForUser
    , processGetQuiz
    , processSubmitQuiz
    , processGetRecentLessonAndQuiz
    , processFileUpload
}