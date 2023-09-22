const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const bcrypt = require('bcrypt');
const { close } = require('../services/db-conn')
const MDBServices = require('../services/mongoDBServices');
const AuthUtil = require('../utils/authUtil')

// verifies the user password before changing it if it exists for that user
// if the user has signed up with google or facebook, then no password is set
// INPUT : email, password : {email, password}
// OUTPUT : message, validPassword : {message, validPassword}
/* 
ON SUCCESS :
{
    "message": "Password verified successfully",
    "validPassword": true
}

ON FAILURE :
{
    "message": "Error: Incorrect Password",
    "validPassword": false
}
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

// updates the user password
// INPUT : email, newPassword : {email, newPassword}
// OUTPUT : message, status : {message, status}
/* 
ON SUCCESS :
{
    "message": "Password updated successfully",
    "status": true
}
*/
const processUpdatePassword = async ({ email, newPassword }) => {
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await MDBServices.updateUserPasswordByEmail(email, hashedPassword)
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// updates the user profile picture
// INPUT : email, profilePicture : {email, profilePicture} base64 encoded
// OUTPUT : message, status : {message, status}
/* 
ON SUCCESS :
{
    "message": "Profile image updated successfully",
    "status": true
}
*/
const processUpdateProfilePicture = async ({ email, profilePicture }) => {
    try {
        const updateResult = await MDBServices.updateUserProfilePicture(email, profilePicture)
        if (updateResult.modifiedCount === 1) {
            let  message = "Profile image updated successfully"
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

// updates the user data displayname and mobile number
// INPUT : email, userData : {email, userData}
// OUTPUT : message, status : {message, status}
/* 
ON SUCCESS :
{
    "message": "User data updated successfully",
    "status": true
}
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

// updates the user preferences 
// INPUT : email, preferences : {email, preferences}
/* 
"preferences": {
    "dashboardHover": false,
    "collapsedSidebar": true
}
*/
// OUTPUT : message, status : {message, status}
/* 
ON SUCCESS :
{
    "message": "User preferences updated successfully",
    "status": true
}
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

// updates the user completed lesson status
// INPUT : email, lesson_status : {email, lesson_status}
/* 
"lesson_status": {
    "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
    "lesson_id": "4aa08919-369c-4ab4-93db-bf6e41b5b4fc",
    "lesson_name": "Crypto",
    "next_chapter_id": null,
    "prev_chapter_id": null,
    "parent_section_id": null,
    "lesson_start": true,
    "lesson_progress": 1,
    "lesson_completed": true,
    "lesson_completed_date": ""
}
*/
// OUTPUT : message, status userLessonStatus : {message, status, userLessonStatus}
/* 
"message": "User lesson status updated successfully",
"status": true,
"lessonStatus": {
    "2ab70e1b-3676-4b79-bfb5-57fd448ec98e": [
        {
            "section_id": "2ab70e1b-3676-4b79-bfb5-57fd448ec98e",
            "lesson_id": "8ed93f99-3c37-428c-af92-c322c79b4384",
            "lesson_name": "qwe",
            "next_chapter_id": null,
            "prev_chapter_id": null,
            "parent_section_id": null,
            "lesson_start": false,
            "lesson_progress": 1,
            "lesson_completed": false,
            "lesson_completed_date": ""
        }
    ]
    "dc0e48f5-d442-47f2-96c2-2ff0d6ab72f7": [
        {
            "section_id": "dc0e48f5-d442-47f2-96c2-2ff0d6ab72f7",
            "lesson_id": "2a9b899f-807f-4ac7-b3f1-8ff61c539692",
            "lesson_name": "Intense Analysis Testing",
            "next_chapter_id": null,
            "prev_chapter_id": null,
            "parent_section_id": null,
            "lesson_start": false,
            "lesson_progress": 1,
            "lesson_completed": false,
            "lesson_completed_date": ""
        }
    ]
}
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

// gets all the quiz data for the user
// INPUT : email
// OUTPUT : quizData : {quizData}
/* 
{
    "message": "Quiz data fetched successfully",
    "transformedQuizData": [
        {
            "sectionName": "Introduction to the market",
            "sectionId": "5119f37b-ef44-4272-a536-04af51ef4bbc",
            "lessons": [
                {
                    "lessonName": "Candle Stick",
                    "lessonID": "a4d32182-98ba-4968-90c3-aa0c27751d55",
                    "allQuizzes": [
                        {
                            "quizId": "2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1",
                            "quizTitle": "Candle Stick Quiz 1",
                            "quizCompleted": true,
                            "quizCompletedDate": "7/31/2023, 3:25:07 PM",
                            "quizScore": 2,
                            "quizTotal": 3
                        }
                    ]
                }
            ]
        },
        {
            "sectionName": "Fundamental Analysis",
            "sectionId": "f82ec216-5daa-4be3-ae54-a456c85ffbf2",
            "lessons": [
                {
                    "lessonName": "Intro to Technical Analysis",
                    "lessonID": "717ff262-cca9-4424-b393-669be5139a62",
                    "allQuizzes": [
                        {
                            "quizId": "2d040ee2-1c76-4712-8e13-2a564d0664de",
                            "quizTitle": "Intro to Technical Analysis",
                            "quizCompleted": false,
                            "quizCompletedDate": "",
                            "quizScore": ""
                        }
                    ]
                }
            ]
        }
    ]
}
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

// gets the quiz data for the quiz id
// INPUT : quizId
/* 
{
    "quizId":"2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1"
}
*/
// OUTPUT : quizData : {quizData}
/* 
{
    "message": "Quiz fetched successfully",
    "selectedQuiz": [
        {
            "_id": "644a0b85c440a2fcc864e7a7",
            "sectionId": "5119f37b-ef44-4272-a536-04af51ef4bbc",
            "sectionName": "Introduction to the market",
            "lessonId": "a4d32182-98ba-4968-90c3-aa0c27751d55",
            "lessonName": "Candle Stick",
            "quizId": "2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1",
            "quizTitle": "Candle Stick Quiz 1",
            "quizDescription": "Candle Stick Quiz 1",
            "questions": [
                {
                    "question": "Candle Stick Quiz 1",
                    "options": [
                        {
                            "option": "a"
                        },
                        {
                            "option": "s"
                        },
                        {
                            "option": "d"
                        }
                    ],
                    "question_id": "b2a7a4a9-ba94-49d5-bfe7-e1579b60a4ec"
                }, {}, {}
            ]
        }
    ]
}
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

// process the quiz submission
// INPUT : email, sectionId, lessonId, quizId, quizData : { email, sectionId, lessonId, quizId, quizData }
// quizData : { quizData }
/* 
{
    "lessonId": "a4d32182-98ba-4968-90c3-aa0c27751d55",
    "quizData": {
        "userSelection": [
            {
                "question_id": "e0ea9124-8567-40d4-a7a9-97f774b0e7ec",
                "question": "What is what is what?",
                "selectedOption": "what"
            },
            {
                "question_id": "2a6870fe-c194-4e8f-ac98-482b7afb756e",
                "question": "What is a candle stick?",
                "selectedOption": "w"
            },
            {
                "question_id": "b2a7a4a9-ba94-49d5-bfe7-e1579b60a4ec",
                "question": "Candle Stick Quiz 1",
                "selectedOption": "s"
            }
        ]
    },
    "quizId": "2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1",
    "sectionId": "5119f37b-ef44-4272-a536-04af51ef4bbc"
}
*/
// OUTPUT : { data }
/* 
{
    "message": "Quiz submitted successfully",
    "status": true,
    "data": {
        "score": 2,
        "total": 3,
        "quizTitle": "Candle Stick Quiz 1"
    }
}
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

// fetches the recent completed lesson and quiz
// INPUT : email
// OUTPUT : recentLessonQuizStatus : { recentLesson, recentQuiz }
/* 
{
    "message": "Recent lesson and quiz status fetched successfully",
    "recentLessonQuizStatus": {
        "mostRecentLesson": {
            "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
            "lesson_id": "4aa08919-369c-4ab4-93db-bf6e41b5b4fc",
            "lesson_name": "Crypto",
            "next_chapter_id": null,
            "prev_chapter_id": null,
            "parent_section_id": null,
            "lesson_start": true,
            "lesson_progress": 1,
            "lesson_completed": true,
            "lesson_completed_date": "8/1/2023, 10:46:49 AM"
        },
        "mostRecentQuiz": {
            "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
            "lesson_id": "a4d32182-98ba-4968-90c3-aa0c27751d55",
            "quiz_id": "2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1",
            "quiz_name": "Candle Stick Quiz 1",
            "quiz_completed_date": "8/1/2023, 10:55:01 AM",
            "quiz_score": 2,
            "quiz_completed": true,
            "quiz_total": 3
        }
    }
}
*/
const processGetRecentLessonAndQuiz = async ({ email }) => {
    try {
        let user = await MDBServices.getUserByEmail(email)
        let lessonStatus = user[0].lesson_status
        let quizStatus = user[0].quiz_status
        let recentLessonQuizStatus = await AuthUtil.getRecentLessonAndQuiz(lessonStatus, quizStatus)
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