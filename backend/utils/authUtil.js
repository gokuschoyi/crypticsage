const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const csv = require('csv-parser');
const fs = require('fs');
const util = require('util');
const readdir = util.promisify(fs.readdir);


/**
 * @typedef {Object} Quiz
 * @property {string} sectionId
 * @property {string} sectionName
 * @property {string} lessonId
 * @property {string} lessonName
 * @property {string} quizId
 * @property {string} quizTitle
 * @property {boolean} quizDescription
 * @property {array} questions
 * @property {boolean} [quiz_completed]
 * @property {string} [quiz_completed_date]
 * @property {number} [quiz_score]
 * @property {number} [quiz_total]
 */

/**
 * @typedef {Object} Lesson
 * @property {string} lessonID
 * @property {string} lessonName
 * @property {Quiz[]} allQuizzes
 */

/**
 * @typedef {Object} Section
 * @property {string} sectionId
 * @property {string} sectionName
 * @property {Lesson[]} lessons
 */

/**
 * @typedef {Object} OutputObject
 * @property {Section[]} quizzes
 */

/**
 * @param {Object} userQuizStatus user quiz data from FE
 * @param {Array<Quiz>} quizCollection 
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
     * @type {OutputObject}
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
    transformQuizData,
    processUploadedCsv,
    getRecentLessonAndQuiz,
    sortAndGroupLessons,
}