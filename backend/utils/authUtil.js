const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const csv = require('csv-parser');
const fs = require('fs');
const util = require('util');
const readdir = util.promisify(fs.readdir);
const config = require('../config');
const { v4: uuidv4 } = require('uuid');
const types = require('../typedefs')
const jwt = require("jsonwebtoken");


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
    const user_id = user[0].uid
    // const userModels = await MDBServices.fetchUserModels(user_id) // user models being fetched from indicators page
    let userData = {}

    userData.accessToken = token;
    // userData.userModels = userModels;
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
 * @param {Object} userQuizStatus user quiz data from FE
 * @param {Array<types.Quiz>} quizCollection 
 * @returns {Promise<Object>} An object containing the transformed quiz data.
 */
const transformQuizData = async (userQuizStatus, quizCollection) => {
    const result = []
    //converting user status to array
    for (const sectionId in userQuizStatus) {
        const section = userQuizStatus[sectionId];

        // Loop through each lesson in the section
        for (const lessonId in section) {
            const lesson = section[lessonId];

            // Loop through each quiz in the lesson
            for (const quiz of lesson) {
                // Add the quiz object to the result array
                result.push(quiz);
            }
        }
    }

    //adding the user status to quiz collection 
    const updatedQuizCollection = quizCollection.map((quiz) => {
        const userQuiz = result.find((userQuiz) => userQuiz.quiz_id === quiz.quizId);
        if (userQuiz) {
            quiz.quiz_completed = userQuiz.quiz_completed;
            quiz.quiz_completed_date = userQuiz.quiz_completed_date;
            quiz.quiz_score = userQuiz.quiz_score;
            quiz.quiz_total = userQuiz.quiz_total;
        } else {
            quiz.quiz_completed = false;
            quiz.quiz_completed_date = "";
            quiz.quiz_score = 0;
            quiz.quiz_total = 0;
        }
        return quiz;
    })

    //transforming quiz collection to required format
    /**
     * @type {types.OutputObject}
     */
    const outputObject = {
        quizzes: []
    };
    for (let i = 0; i < updatedQuizCollection.length; i++) {
        const quiz = updatedQuizCollection[i];
        const sectionName = quiz.sectionName;
        const sectionId = quiz.sectionId;
        const lessonId = quiz.lessonId;
        const lessonName = quiz.lessonName;
        const quizId = quiz.quizId;
        const quizTitle = quiz.quizTitle;
        const quizCompleted = quiz.quiz_completed;
        const quizCompletedDate = quiz.quiz_completed_date;
        const questions = quiz.questions;
        const quizDescription = quiz.quizDescription;
        const quizScore = quiz.quiz_score;
        const quizTotal = quiz.quiz_total;


        let section = outputObject.quizzes.find(section => section.sectionName === sectionName) || null;
        if (!section) {
            section = {
                sectionName,
                sectionId,
                lessons: []
            };
            outputObject.quizzes.push(section);
        }

        let lesson = section.lessons.find(lesson => lesson.lessonName === lessonName && lesson.lessonID === lessonId);
        if (!lesson) {
            lesson = {
                lessonName,
                lessonID: lessonId,
                allQuizzes: []
            };
            section.lessons.push(lesson);
        }

        lesson.allQuizzes.push({
            sectionId,
            sectionName,
            lessonId,
            lessonName,
            quizId,
            quizTitle,
            quizDescription,
            questions,
            quiz_completed: quizCompleted,
            quiz_completed_date: quizCompletedDate,
            quiz_score: quizScore,
            quiz_total: quizTotal,
        });
    }
    return { outputObject };
}

const processUploadedCsv = async (req) => {
    let final = {}
    const uid = req.body.uid;
    try {
        const folderPath = `user_uploads/${uid}`; // Folder path to read files from
        const files = await readdir(folderPath); // Read files from the folder
        // log.info(files);

        await Promise.all(files.map((filename) => {
            let headersProcessed = false;
            let headers = {};
            let results = [];

            return new Promise((resolve, reject) => {
                const filePath = `${folderPath}/${filename}`; // Constructing the file path
                fs.createReadStream(filePath)
                    .pipe(csv())
                    .on('data', (data) => {
                        if (!headersProcessed) {
                            headersProcessed = true;
                            Object.keys(data).map((header) => {
                                headers[header] = header
                            })
                        }
                        let obj = {}
                        for (const [key, value] of Object.entries(data)) {
                            obj[headers[key]] = value;
                        }
                        results.push(obj);
                    })
                    .on('end', () => {
                        const regex = /-\d+.*$/;
                        let trimmed = filename.replace(regex, '')
                        final[trimmed] = results
                        // @ts-ignore
                        resolve()
                    })
                    .on('error', (error) => {
                        reject(error);
                    });
            })
        }))
        return final
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const getRecentLessonAndQuiz = async (lessonStatus, quizStatus, sectionIDs) => {
    let nextLesson = {};
    let latestLesson = {};
    for (const key in lessonStatus) {
        const lessons = lessonStatus[key];
        for (const lesson of lessons) {
            if (lesson.lesson_completed_date !== '') {
                if (!latestLesson.lesson_completed_date || new Date(lesson.lesson_completed_date) > new Date(latestLesson.lesson_completed_date)) {
                    latestLesson = lesson;
                }
            }
        }
    }

    const mostRecentLesson = latestLesson
    // console.log(Object.keys(mostRecentLesson).length !== 0)
    if (Object.keys(mostRecentLesson).length !== 0) {
        const sectionId = mostRecentLesson.section_id;
        const lessonId = mostRecentLesson.lesson_id;
        const allLessonForSection = lessonStatus[sectionId]

        const latestSectionIndex = sectionIDs.findIndex((section) => section.sectionId === sectionId)
        const latestLessonIndex = allLessonForSection.findIndex((lesson) => lesson.lesson_id === lessonId)
        // console.log("Latest lesson index", latestLessonIndex, "Latest section index", latestSectionIndex)

        if (latestLessonIndex === allLessonForSection.length - 1) {
            nextLesson
            const nextSectionID = sectionIDs[latestSectionIndex + 1].sectionId
            nextLesson = lessonStatus[nextSectionID][0]
        } else {
            nextLesson = allLessonForSection[latestLessonIndex + 1]
            // console.log("Next lesson is", nextLesson)
        }
    } else {
        const firstSectionID = sectionIDs[0].sectionId
        // console.log('First section ID when initial',firstSectionID)
        nextLesson = lessonStatus[firstSectionID][0]
        // console.log('No lesson completed yet, initial')
    }

    let latestDate = null;
    let mostRecentQuiz = {};
    let nextQuiz = {};
    try {
        for (const sectionId in quizStatus) {
            const lesson = quizStatus[sectionId];
            for (const lessonId in lesson) {
                const quizzes = quizStatus[sectionId][lessonId];
                for (const quiz of quizzes) {
                    if (quiz.quiz_completed_date && (!latestDate || new Date(quiz.quiz_completed_date) > new Date(latestDate))) {
                        latestDate = quiz.quiz_completed_date;
                        mostRecentQuiz = quiz;
                    }
                }
            }
        }

        if (Object.keys(mostRecentQuiz).length !== 0) {
            const mostRecentQuiz_sectionID = mostRecentQuiz.section_id;
            const mostRecentQuiz_lessonID = mostRecentQuiz.lesson_id;
            const mostRecentQuiz_quizID = mostRecentQuiz.quiz_id;
            const allLessonForSection_ = lessonStatus[mostRecentQuiz_sectionID]
            const latestSectionIndex_ = sectionIDs.findIndex((section) => section.sectionId === mostRecentQuiz_sectionID)
            let nextLesson_ = {};

            const allQuizForLesson = quizStatus[mostRecentQuiz_sectionID][mostRecentQuiz_lessonID]
            const latestQuizIndex = allQuizForLesson.findIndex((quiz) => quiz.quiz_id === mostRecentQuiz_quizID)
            // console.log("Latest quiz index", latestQuizIndex)

            if (latestQuizIndex === allQuizForLesson.length - 1) {
                // console.log("Last quiz done for lesson")
                const lessonIndex = allLessonForSection_.findIndex((lesson) => lesson.lesson_id === mostRecentQuiz_lessonID)
                // console.log("Lesson index", lessonIndex)
                if (lessonIndex === allLessonForSection_.length - 1) {
                    const nextSectionID = sectionIDs[latestSectionIndex_ + 1].sectionId
                    nextLesson_ = lessonStatus[nextSectionID][0]
                    nextQuiz = quizStatus[nextSectionID][nextLesson_.lesson_id][0]
                } else {
                    nextLesson_ = allLessonForSection_[lessonIndex + 1]
                    nextQuiz = quizStatus[mostRecentQuiz_sectionID][nextLesson_.lesson_id][0]
                }
            } else {
                nextQuiz = allQuizForLesson[latestQuizIndex + 1]
            }
            // console.log("Next quiz is", nextQuiz)
        } else {
            const firstSectionID = sectionIDs[0].sectionId
            // console.log('First section ID when initial',firstSectionID)
            const all_lessons = quizStatus[firstSectionID]
            const firstLessonID = Object.keys(all_lessons)[0]
            // console.log('First lesson ID when initial',firstLessonID)
            nextQuiz = quizStatus[firstSectionID][firstLessonID][0]
            // console.log('No quiz completed yet, initial')
        }

        return { mostRecentLesson, nextLesson, mostRecentQuiz, nextQuiz }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const sortAndGroupLessons = (lessonArray) => {
    const sortedLessons = lessonArray.sort((a, b) => {
        if (a.section_id < b.section_id) {
            return -1;
        } else if (a.section_id > b.section_id) {
            return 1;
        }
        return 0;
    });

    const groupedLessons = {};
    sortedLessons.forEach((lesson) => {
        if (!groupedLessons[lesson.section_id]) {
            groupedLessons[lesson.section_id] = [];
        }
        groupedLessons[lesson.section_id].push(lesson);
    });

    return groupedLessons;
};

module.exports = {
    checkIsAdmin,
    generateJWTToken,
    generateUserObjectForLogin,
    generateUserObjectForSignup,
    transformQuizData,
    processUploadedCsv,
    getRecentLessonAndQuiz,
    sortAndGroupLessons,
}