const { connect, close } = require('../services/db-conn')
const bcrypt = require('bcrypt');
const wodData = require('../utils/user/data/wodData')

const helper = require('../utils/user/user-util')

const verifyPassword = async (req, res) => {
    const { password } = req.body;
    if (!password) {
        res.status(400).json({ message: "Empty password" });
    } else {
        try {
            let uid = res.locals.data.uid
            const db = await connect("verifyPassword");
            const userCollection = db.collection('users');
            const user = await userCollection.find({ 'uid': uid }).toArray();
            const hashedPassword = user[0].password;
            let validPassword = false;
            if (hashedPassword === '' && (user[0].signup_type === 'google' || user[0].signup_type === 'facebook')) {
                validPassword = true
                res.status(200).json({ message: 'no password set', validPassword })
            } else {
                validPassword = await bcrypt.compare(password, hashedPassword);
                if (validPassword) {
                    res.status(200).json({ message: "Password verified successfully", validPassword });
                } else {
                    res.status(400).json({ message: "Incorrect Password", validPassword });
                }
            }
        } catch (err) {
            console.log(err)
            res.status(500).json({ message: "Password verification failed" });
        } finally {
            close("verifyPassword");
        }
    }
}

const updatePassword = async (req, res) => {
    const { password } = req.body;
    if (!password) {
        res.status(400).json({ message: "Invalid request" });
    } else {
        try {
            let uid = res.locals.data.uid
            const db = await connect("updatePassword");
            const userCollection = db.collection('users');
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = await userCollection.updateOne({ 'uid': uid }, { $set: { 'password': hashedPassword } });
            if (user) {
                res.status(200).json({ message: "Password updated successfully", status: true });
            } else {
                res.status(400).json({ message: "Password updation failed" });
            }
        } catch (err) {
            res.status(400).json({ message: "Password updation failed" });
        } finally {
            close("updatePassword");
        }
    }
}

const updateProfilePicture = async (req, res) => {
    const { profileImage } = req.body;
    if (!profileImage) {
        res.status(400).json({ message: "Image not provided" });
    } else {
        try {
            let uid = res.locals.data.uid
            const db = await connect("updateProfilePicture");
            const userCollection = db.collection('users');
            const user = await userCollection.updateOne({ 'uid': uid }, { $set: { 'profile_image': profileImage } });
            if (user) {
                res.status(200).json({ message: "Profile image updated successfully", status: true });
            } else {
                res.status(400).json({ message: "Profile image updation failed" });
            }
        } catch (err) {
            res.status(400).json({ message: "Error in updating the image.(DB issue)" });
        } finally {
            close("updateProfilePicture");
        }
    }
}

const updateUserData = async (req, res) => {
    const { userData } = req.body;
    if (!userData) {
        res.status(400).json({ message: "Invalid request" });
    } else {
        try {
            let uid = res.locals.data.uid
            const db = await connect("updateUserData");
            const userCollection = db.collection('users');
            const user = await userCollection.updateOne({ 'uid': uid }, { $set: { 'displayName': userData.displayName, 'mobile_number': userData.mobile_number } });
            if (user) {
                res.status(200).json({ message: "User data updated successfully", status: true });
            } else {
                res.status(400).json({ message: "User data updation failed" });
            }
        } catch (err) {
            res.status(400).json({ message: "User data updation failed" });
        } finally {
            close("updateUserData");
        }
    }
}

const updateUserPreference = async (req, res) => {
    const { preferences } = req.body;
    if (!preferences) {
        res.status(400).json({ message: "Invalid request" });
    } else {
        try {
            let uid = res.locals.data.uid
            const db = await connect("updateUserPreference");
            const userCollection = db.collection('users');
            const user = await userCollection.updateOne(
                { 'uid': uid },
                {
                    $set:
                    {
                        'preferences.dashboardHover': preferences.dashboardHover,
                        'preferences.collapsedSidebar': preferences.collapsedSidebar
                    }
                }
            );
            if (user) {
                res.status(200).json({ message: "Preferences updated successfully", status: true });
            } else {
                res.status(400).json({ message: "Preferences updation failed" });
            }
        } catch (err) {
            res.status(400).json({ message: "Preferences updation failed" });
        } finally {
            close("updateUserPreference");
        }
    }
}

const updateUserLessonStatus = async (req, res) => {
    const { lesson_status } = req.body;
    if (!lesson_status) {
        return res.status(400).json({ message: "Data is missing" });
    } else {
        try {
            let uid = res.locals.data.uid
            const db = await connect("updateUserLessonStatus");
            const userCollection = db.collection('users');
            const user = await userCollection.updateOne(
                { "uid": uid },
                {
                    $set: {
                        [`lesson_status.${lesson_status.section_id}.$[inner].lesson_start`]: lesson_status.lesson_start,
                        [`lesson_status.${lesson_status.section_id}.$[inner].lesson_progress`]: lesson_status.lesson_progress,
                        [`lesson_status.${lesson_status.section_id}.$[inner].lesson_completed`]: lesson_status.lesson_completed,
                        [`lesson_status.${lesson_status.section_id}.$[inner].lesson_completed_date`]: new Date().toLocaleString(),
                    }
                },
                {
                    arrayFilters: [
                        { "inner.section_id": lesson_status.section_id, "inner.lesson_id": lesson_status.lesson_id }
                    ]
                },
            );
            let lessonStatus
            if (user.acknowledged) {
                lessonStatus = await userCollection.find({ "uid": uid }).toArray();
                lessonStatus = lessonStatus[0].lesson_status;
                res.status(200).json({ message: "User lesson status updated successfully", status: true, lessonStatus });
            } else {
                res.status(400).json({ message: "User lesson status updation failed" });
            }
        } catch (err) {
            res.status(400).json({ message: "User lesson status updation failed" });
        } finally {
            close("updateUserLessonStatus");
        }
    }
}

const getInitialQuizDataForUser = async (req, res) => {
    try {
        let uid = res.locals.data.uid
        const db = await connect("getInitialQuizDataForUser");
        const user = await db.collection('users').find({ "uid": uid }).toArray();
        let userQuizStatus = user[0].quiz_status
        const quizCollection = await db.collection('quiz').find({}).toArray();
        let transformedQuizData = await helper.transformQuizData(userQuizStatus, quizCollection);
        transformedQuizData = transformedQuizData.outputObject.quizzes
        res.status(200).json({ message: "Quiz data fetched successfully", transformedQuizData });
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Quiz data fetch failed" });
    } finally {
        close("getInitialQuizDataForUser");
    }
}

const getQuiz = async (req, res) => {
    const { quizId } = req.body;
    if (!quizId) {
        return res.status(400).json({ message: "Quiz Id is required" });
    } else {
        try {
            const db = await connect("getQuiz");
            const quizCollection = db.collection('quiz');
            let selectedQuiz = await quizCollection.find({ "quizId": quizId }).toArray()
            if (selectedQuiz.length === 0) {
                res.status(400).json({ message: "No quiz found" });
            } else {
                updatedQuiz = selectedQuiz[0].questions.map((ques, index) => {
                    const { correctAnswer, ...updatedQuestion } = ques
                    return (
                        updatedQuestion
                    )
                })
                selectedQuiz[0].questions = updatedQuiz
                res.status(200).json({ message: "Quiz fetched successfully", selectedQuiz });
            }
        } catch (err) {
            res.status(400).json({ message: "Quiz fetch failed" });
        } finally {
            close("getQuiz");
        }
    }
}

const submitQuiz = async (req, res) => {
    const { sectionId, lessonId, quizId, quizData } = req.body;
    if (!sectionId || !lessonId || !quizId || !quizData) {
        return res.status(400).json({ message: "Quiz Id is required" });
    } else {
        try {
            let uid = res.locals.data.uid
            const db = await connect("submitQuiz");
            const quiz = await db.collection('quiz').find({ quizId: quizId }).toArray()
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
            console.log(score)
            let data = {
                score: score,
                total: total,
                quizTitle: quiz[0].quizTitle,
            }
            const userCollection = db.collection('users');
            const user = await userCollection.updateOne(
                { uid: uid },
                {
                    $set: {
                        [`quiz_status.${sectionId}.${lessonId}.$[inner].quiz_completed_date`]: new Date().toLocaleString(),
                        [`quiz_status.${sectionId}.${lessonId}.$[inner].quiz_score`]: score,
                        [`quiz_status.${sectionId}.${lessonId}.$[inner].quiz_completed`]: true,
                        [`quiz_status.${sectionId}.${lessonId}.$[inner].quiz_total`]: total,
                    }
                },
                {
                    arrayFilters: [
                        { "inner.section_id": sectionId, "inner.lesson_id": lessonId, "inner.quiz_id": quizId }
                    ]
                }
            );
            if (user.acknowledged) {
                res.status(200).json({ message: "Quiz submitted successfully", status: true, data });
            } else {
                res.status(400).json({ message: "Quiz submission failed" });
            }
        } catch (err) {
            res.status(400).json({ message: "Quiz submission failed" });
        } finally {
            close("submitQuiz");
        }
    }
}

const getRecentLessonAndQuizStatus = async (req, res) => {
    try {
        let uid = res.locals.data.uid
        const db = await connect("getRecentLessonAndQuizStatus");
        const user = await db.collection('users').find({ "uid": uid }).toArray();
        let lessonStatus = user[0].lesson_status
        let quizStatus = user[0].quiz_status
        let recentLessonQuizStatus = await helper.getRecentLessonAndQuiz(lessonStatus, quizStatus)
        res.status(200).json({ message: "Recent lesson and quiz status fetched successfully", recentLessonQuizStatus });
    } catch (err) {
        res.status(500).json({ message: "Recent lesson and quiz status fetch failed" });
    } // no finaly cause it closes the connection for the next process
}

const wordOfTheDay = async (req, res) => {
    let wordData = wodData[Math.floor(Math.random() * wodData.length)];
    let objectkey = Object.keys(wordData)[0];
    let word = wordData[objectkey];
    res.status(200).json({ message: "Word of the day request success", word });
}

const processFileUpload = async (req, res) => {
    if (!req.files.length === 0) {
        return res.status(400).json({ message: 'No files were uploaded.' });
    } else {
        let finalResult;
        try {
            finalResult = await helper.processUploadedCsv(req)
            res.status(200).json({ message: "File uploaded successfully", finalResult });
        } catch (err) {
            res.status(400).json({ message: "File upload failed" });
        }
    }
}

module.exports = {
    verifyPassword,
    updatePassword,
    updateProfilePicture,
    updateUserData,
    updateUserPreference,
    updateUserLessonStatus,
    getInitialQuizDataForUser,
    getQuiz,
    submitQuiz,
    getRecentLessonAndQuizStatus,
    wordOfTheDay,
    processFileUpload
}