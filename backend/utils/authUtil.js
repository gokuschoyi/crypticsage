const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const csv = require('csv-parser');
const fs = require('fs');
const util = require('util');
const readdir = util.promisify(fs.readdir);

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
            quiz.quiz_score = "";
            quiz.quiz_total = "";
        }
        return quiz;
    })

    //transforming quiz collection to required format
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
        const quizScore = quiz.quiz_score;
        const quizTotal = quiz.quiz_total;

        let section = outputObject.quizzes.find(section => section.sectionName === sectionName);
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
            quizId,
            quizTitle,
            quizCompleted,
            quizCompletedDate,
            quizScore,
            quizTotal
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

const getRecentLessonAndQuiz = async (lessonStatus, quizStatus) => {

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

    let latestDate = null;
    let mostRecentQuiz = {};
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
        return { mostRecentLesson, mostRecentQuiz }
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