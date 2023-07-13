const { connect, close } = require('../../services/db-conn')
const csv = require('csv-parser');
const fs = require('fs');
const util = require('util');
const readdir = util.promisify(fs.readdir);

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

const makeUserLessonStatus = async () => {
    const db = await connect("makeUserLessonStatus");
    const lessonCollection = db.collection('lessons');
    const lessons = await lessonCollection.find({}).toArray();
    const userLessonStatus = [];
    lessons.forEach(lesson => {
        userLessonStatus.push({
            section_id: lesson.sectionId,
            lesson_id: lesson.lessonId,
            lesson_name: lesson.chapter_title,
            next_chapter_id: lesson.next_chapter_id,
            prev_chapter_id: lesson.prev_chapter_id,
            parent_section_id: lesson.parent_chapter_id,
            lesson_start: false,
            lesson_progress: 1,
            lesson_completed: false,
            lesson_completed_date: '',
        })
    });
    const groupedLessons = sortAndGroupLessons(userLessonStatus);
    return groupedLessons;
}

const makeUserQuizStatus = async () => {
    const db = await connect("makeUserQuizStatus");
    const quizCollection = db.collection('quiz');
    const quizzes = await quizCollection.find({}).toArray();
    const userQuizStatus = { quiz_status: {} };
    quizzes.forEach((obj) => {
        // Extract relevant properties from the current object
        const { sectionId, lessonId, quizId, quizTitle } = obj;

        // Retrieve the section object from the output object, creating it if necessary
        const sectionObject = userQuizStatus.quiz_status?.[sectionId] ?? {};

        // Retrieve the lesson array from the section object, creating it if necessary
        const lessonArray = sectionObject[lessonId] ?? [];

        // Create a new quiz object using the extracted properties
        const quizObject = {
            section_id: sectionId,
            lesson_id: lessonId,
            quiz_id: quizId,
            quiz_name: quizTitle,
            quiz_completed_date: "",
            quiz_score: "",
            quiz_completed: false,
        };

        // Add the new quiz object to the lesson array
        lessonArray.push(quizObject);

        // Update the section object with the new lesson array
        sectionObject[lessonId] = lessonArray;

        // Update the output object with the updated section object
        userQuizStatus.quiz_status[sectionId] = sectionObject;
    });
    return userQuizStatus.quiz_status;
}

const makeAllStatusForUser = async () => {
    let lessonStatus, quizStatus;
    try {
        lessonStatus = await makeUserLessonStatus();
        quizStatus = await makeUserQuizStatus();
        return { lessonStatus, quizStatus };
    } catch (err) {
        console.log(err);
    } finally {
        close("makeAllStatusForUser");
    }
}

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
        console.log(files);

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
    } catch (err) {
        console.log(err);
        return err
    } finally {
        console.log("finally for process upload")
    }
}

const getRecentLessonAndQuiz = async (lessonStatus, quizStatus) => {
    const allLesson = Object.values(lessonStatus)
        .flat()
        .filter(lesson => lesson.lesson_completed_date !== '');

    if (allLesson.length > 0) {
        allLesson.sort((a, b) => new Date(b.lesson_completed_date) - new Date(a.lesson_completed_date));
    }

    const mostRecentLesson = allLesson.length > 0 ? allLesson[0] : {};

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
    } catch (err) {
        console.log(err)
    }
}

module.exports = {
    makeAllStatusForUser,
    transformQuizData,
    getRecentLessonAndQuiz,
    processUploadedCsv,
}