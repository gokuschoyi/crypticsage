const config = require('../../config');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require('google-auth-library');
const { connect, close } = require('../db-conn')

const {
    makeAllStatusForUser,
    transformQuizData,
    processUploadedCsv,
    getRecentLessonAndQuiz
} = require('../helpers');

// <--- User Operations ---> //
const createNewUser = async (req, res) => {
    const { signup_type } = req.body;
    let userData = {};
    switch (signup_type) {
        case 'registration':
            const { userName, email, password, mobile_number } = req.body;
            if (!userName || !email || !password || !mobile_number) {
                return res.status(400).json({ message: "Please fill all the fields" });
            }
            else {
                const db = await connect("createNewUser - registration");
                const userCollection = db.collection('users');
                const filterEmail = { email: email }
                const user = await userCollection.find(filterEmail).toArray();
                if (user.length > 0) {
                    close("createNewUser - registration");
                    return res.status(400).json({ message: "User already exists" });
                }
                else {
                    const hashedPassword = await bcrypt.hash(password, 10);
                    let allStatus = await makeAllStatusForUser();
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
                        lesson_status: allStatus.lessonStatus,
                        quiz_status: allStatus.quizStatus,
                    }
                    try {
                        await userCollection.insertOne(userData);
                        res.status(200).json({ message: "Account created successfully" });
                    }
                    catch (err) {
                        res.status(500).json({ message: "User creation failed" });
                    } finally {
                        close("createNewUser - registration");
                    }
                }
            }
            break;
        case 'google':
            const { credentials, signup_type } = req.body;
            if (!credentials || !signup_type) {
                res.status(400).json({ message: "Invalid credentials, please try again" });
            }
            else {
                try {
                    const client = new OAuth2Client(config.googleOAuthClientId);
                    const ticket = await client.verifyIdToken({
                        idToken: credentials,
                        audience: config.googleOAuthClientId,
                    });
                    const payload = ticket.getPayload();

                    const db = await connect("createNewUser - google");
                    const userCollection = db.collection('users');
                    const filterEmail = { email: payload.email }
                    const user = await userCollection.find(filterEmail).toArray();

                    if (user.length > 0) {
                        return res.status(400).json({ message: "Account already exists, Signin with your google account" });
                    }
                    else {
                        let allStatus = await makeAllStatusForUser();
                        userData = {
                            displayName: payload.given_name,
                            email: payload.email,
                            password: '',
                            mobile_number: '',
                            profile_image: payload.picture,
                            emailVerified: payload.email_verified,
                            date: new Date().toLocaleString('au'),
                            uid: uuidv4(),
                            preferences: {
                                theme: true,
                                dashboardHover: true,
                                collapsedSidebar: true,
                            },
                            signup_type: signup_type,
                            lesson_status: allStatus.lessonStatus,
                            quiz_status: allStatus.quizStatus,
                        }
                    }
                    try {
                        await userCollection.insertOne(userData);
                        res.status(200).json({ message: "Account created successfully" });
                    }
                    catch (err) {
                        res.status(500).json({ message: "User creation failed" });
                    } finally {
                        close("createNewUser - google");
                    }
                } catch (err) {
                    res.status(500).json({ message: "Invalid credentials" });
                }
            }
            break;
        case 'facebook':
            const { userInfo } = req.body;
            if (!userInfo) {
                res.status(400).json({ message: "Invalid credentials, please try again" });
            }
            else {
                const db = await connect("createNewUser - facebook");
                const userCollection = db.collection('users');
                const filterEmail = { email: userInfo.email }
                const user = await userCollection.find(filterEmail).toArray();

                if (user.length > 0) {
                    return res.status(400).json({ message: "User already exists, Signin with your google account" });
                }
                else {
                    let allStatus = await makeAllStatusForUser();
                    userData = {
                        displayName: userInfo.first_name,
                        email: userInfo.email,
                        password: '',
                        mobile_number: '',
                        profile_image: userInfo.picture.data.url,
                        emailVerified: false,
                        date: new Date().toLocaleString('au'),
                        uid: uuidv4(),
                        preferences: {
                            theme: true,
                            dashboardHover: true,
                            collapsedSidebar: true,
                        },
                        signup_type: 'facebook',
                        lesson_status: allStatus.lessonStatus,
                        quiz_status: allStatus.quizStatus,
                    }
                }
                try {
                    await userCollection.insertOne(userData);
                    res.status(200).json({ message: "Account created successfully" });
                }
                catch (err) {
                    res.status(500).json({ message: "User creation failed" });
                } finally {
                    close("createNewUser - facebook");
                }
            }
            break;
        default:
            res.status(400).json({ message: "Invalid signup type or value not provided" });
            break;
    }
}

const loginUser = async (req, res) => {
    const { login_type } = req.body;
    let adminList = ['goku@gmail.com', 'gokulsangamitrachoyi@gmail.com']
    let admin_status = false;
    switch (login_type) {
        case 'emailpassword':
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({ message: "Please fill all the fields" });
            }
            else {
                const db = await connect("loginUser - emailpassword");
                const userCollection = db.collection('users');
                const filterEmail = { email: email }
                let user = [];
                try {
                    user = await userCollection.find(filterEmail).toArray();
                    if (user.length === 0) {
                        res.status(400).json({ message: "User does not exist or email is wrong" });
                    }
                    else {
                        const hashedPassword = user[0].password;
                        const decryptedPassword = await bcrypt.compare(password, hashedPassword);
                        if (!decryptedPassword) {
                            res.status(400).json({ message: "Password is wrong" });
                        } else {
                            admin_status = adminList.includes(email);
                            const token = jwt.sign(
                                {
                                    email: user[0].email,
                                    user_name: user[0].user_name,
                                    uid: user[0].uid
                                },
                                config.tokenKey,
                                {
                                    expiresIn: '1d'
                                }
                            );
                            let lesson_status = user[0].lesson_status
                            let quiz_status = user[0].quiz_status
                            let recent_lesson_quiz = await getRecentLessonAndQuiz(lesson_status, quiz_status)

                            let userData = {};
                            userData.email = user[0].email;
                            userData.displayName = user[0].displayName;
                            userData.emailVerified = user[0].emailVerified;
                            userData.uid = user[0].uid;
                            userData.profile_image = user[0].profile_image;
                            userData.preferences = user[0].preferences;
                            userData.mobile_number = user[0].mobile_number;
                            userData.accessToken = token;
                            userData.signup_type = user[0].signup_type;
                            userData.admin_status = admin_status;
                            userData.lesson_status = user[0].lesson_status;
                            userData.passwordEmptyFlag = user[0].password === '' ? true : false;

                            res.status(200).json({ message: "User login successful", data: userData, recent_lesson_quiz });
                        }
                    }
                } catch (err) {
                    res.status(500).json({ message: "User does not exist or email is wrong" });
                } finally {
                    close("loginUser - emailpassword");
                }

            }
            break;
        case 'google':
            const { credential } = req.body;
            if (!credential) {
                res.status(400).json({ message: "Invalid credentials, please try again" });
            }
            else {
                try {
                    const client = new OAuth2Client(config.googleOAuthClientId);
                    const ticket = await client.verifyIdToken({
                        idToken: credential,
                        audience: config.googleOAuthClientId,
                    });
                    const payload = ticket.getPayload();
                    let email = payload.email;
                    const db = await connect("loginUser - google");
                    const userCollection = db.collection('users');
                    const filterEmail = { email: email }
                    const user = await userCollection.find(filterEmail).toArray();
                    if (user.length === 0) {
                        res.status(400).json({ message: "There is no account associated with your email. Register first" });
                        close("loginUser - google");
                    }
                    else {
                        admin_status = adminList.includes(email);
                        const token = jwt.sign(
                            {
                                email: payload.email,
                                user_name: payload.given_name,
                                uid: user[0].uid
                            },
                            config.tokenKey,
                            {
                                expiresIn: '1d'
                            }
                        );
                        let lesson_status = user[0].lesson_status
                        let quiz_status = user[0].quiz_status
                        let recent_lesson_quiz = await getRecentLessonAndQuiz(lesson_status, quiz_status)

                        let userData = {};
                        userData.email = user[0].email;
                        userData.displayName = user[0].displayName;
                        userData.emailVerified = user[0].emailVerified;
                        userData.uid = user[0].uid;
                        userData.profile_image = user[0].profile_image;
                        userData.preferences = user[0].preferences;
                        userData.mobile_number = user[0].mobile_number;
                        userData.accessToken = token;
                        userData.signup_type = user[0].signup_type;
                        userData.admin_status = admin_status;
                        userData.lesson_status = user[0].lesson_status;
                        userData.passwordEmptyFlag = user[0].password === '' ? true : false;

                        res.status(200).json({ message: "User login successful", data: userData, recent_lesson_quiz });
                    }
                }
                catch (err) {
                    console.log(err)
                    res.status(500).json({ message: "Could not verify your credentials" });
                } finally {
                    close("loginUser - google");
                }
            }
            break;
        case 'facebook':
            const { facebook_email } = req.body;
            if (!facebook_email) {
                res.status(400).json({ message: "Invalid credentials, please try again" });
            }
            else {
                const db = await connect("loginUser - facebook");
                const userCollection = db.collection('users');
                const filterEmail = { email: facebook_email }
                const user = await userCollection.find(filterEmail).toArray();
                if (user.length === 0) {
                    res.status(400).json({ message: "There is no account associated with your email. Register first" });
                    close("loginUser - facebook");
                }
                else {
                    admin_status = adminList.includes(facebook_email);
                    const token = jwt.sign(
                        {
                            email: user[0].email,
                            guser_name: user[0].user_name,
                            uid: user[0].uid
                        },
                        config.tokenKey,
                        {
                            expiresIn: '1d'
                        }
                    );
                    let lesson_status = user[0].lesson_status
                    let quiz_status = user[0].quiz_status
                    let recent_lesson_quiz = await getRecentLessonAndQuiz(lesson_status, quiz_status)

                    let userData = {};
                    userData.email = user[0].email;
                    userData.displayName = user[0].displayName;
                    userData.emailVerified = user[0].emailVerified;
                    userData.uid = user[0].uid;
                    userData.profile_image = user[0].profile_image;
                    userData.preferences = user[0].preferences;
                    userData.mobile_number = user[0].mobile_number;
                    userData.accessToken = token;
                    userData.signup_type = user[0].signup_type;
                    userData.admin_status = admin_status;
                    userData.lesson_status = user[0].lesson_status;
                    userData.passwordEmptyFlag = user[0].password === '' ? true : false;
                    close("loginUser - facebook");
                    res.status(200).json({ message: "User login successful", data: userData, recent_lesson_quiz });
                }
            }
            break;
        default:
            res.status(400).json({ message: "Invalid login type or value not provided" });
    }
}

const verifyPassword = async (req, res) => {
    const { password } = req.body;
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
                res.status(500).json({ message: "Incorrect Password", validPassword });
            }
        }
    } catch (err) {
        res.status(500).json({ message: "Password verification failed" });
    } finally {
        close("verifyPassword");
    }
}

const updatePassword = async (req, res) => {
    const { password } = req.body;
    try {
        let uid = res.locals.data.uid
        const db = await connect("updatePassword");
        const userCollection = db.collection('users');
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await userCollection.updateOne({ 'uid': uid }, { $set: { 'password': hashedPassword } });
        if (user) {
            res.status(200).json({ message: "Password updated successfully", status: true });
        } else {
            res.status(500).json({ message: "Password updation failed" });
        }
    } catch (err) {
        res.status(500).json({ message: "Password updation failed" });
    } finally {
        close("updatePassword");
    }
}

const updateProfilePicture = async (req, res) => {
    const { profileImage } = req.body;
    try {
        let uid = res.locals.data.uid
        const db = await connect("updateProfilePicture");
        const userCollection = db.collection('users');
        const user = await userCollection.updateOne({ 'uid': uid }, { $set: { 'profile_image': profileImage } });
        if (user) {
            res.status(200).json({ message: "Profile image updated successfully", status: true });
        } else {
            res.status(500).json({ message: "Profile image updation failed" });
        }
    } catch (err) {
        res.status(500).json({ message: "Profile image updation failed" });
    } finally {
        close("updateProfilePicture");
    }
}

const updateUserData = async (req, res) => {
    const { userData } = req.body;
    try {
        let uid = res.locals.data.uid
        const db = await connect("updateUserData");
        const userCollection = db.collection('users');
        const user = await userCollection.updateOne({ 'uid': uid }, { $set: { 'displayName': userData.displayName, 'mobile_number': userData.mobile_number } });
        if (user) {
            res.status(200).json({ message: "User data updated successfully", status: true });
        } else {
            res.status(500).json({ message: "User data updation failed" });
        }
    } catch (err) {
        res.status(500).json({ message: "User data updation failed" });
    } finally {
        close("updateUserData");
    }
}

const updateUserPreference = async (req, res) => {
    const { preferences } = req.body;
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
            res.status(500).json({ message: "Preferences updation failed" });
        }
    } catch (err) {
        res.status(500).json({ message: "Preferences updation failed" });
    } finally {
        close("updateUserPreference");
    }
}

const updateUserLessonStatus = async (req, res) => {
    const { lesson_status } = req.body;
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
            res.status(500).json({ message: "User lesson status updation failed" });
        }
    } catch (err) {
        res.status(500).json({ message: "User lesson status updation failed" });
    } finally {
        close("updateUserLessonStatus");
    }
}

const getInitialQuizDataForUser = async (req, res) => {
    try {
        let uid = res.locals.data.uid
        const db = await connect("getInitialQuizDataForUser");
        const user = await db.collection('users').find({ "uid": uid }).toArray();
        let userQuizStatus = user[0].quiz_status
        const quizCollection = await db.collection('quiz').find({}).toArray();
        let transformedQuizData = await transformQuizData(userQuizStatus, quizCollection);
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
    try {
        const db = await connect("getQuiz");
        const quizCollection = db.collection('quiz');
        let selectedQuiz = await quizCollection.find({ "quizId": quizId }).toArray()
        if (selectedQuiz.length === 0) {
            res.status(200).json({ message: "No quiz found" });
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
        res.status(500).json({ message: "Quiz fetch failed" });
    } finally {
        close("getQuiz");
    }
}

const submitQuiz = async (req, res) => {
    const { sectionId, lessonId, quizId, quizData } = req.body;
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
            res.status(500).json({ message: "Quiz submission failed" });
        }
    } catch (err) {
        res.status(500).json({ message: "Quiz submission failed" });
    } finally {
        close("submitQuiz");
    }
}

const getRecentLessonAndQuizStatus = async (req, res) => {
    try {
        let uid = res.locals.data.uid
        const db = await connect("getRecentLessonAndQuizStatus");
        const user = await db.collection('users').find({ "uid": uid }).toArray();
        let lessonStatus = user[0].lesson_status
        let quizStatus = user[0].quiz_status
        let recentLessonQuizStatus = await getRecentLessonAndQuiz(lessonStatus, quizStatus)
        res.status(200).json({ message: "Recent lesson and quiz status fetched successfully", recentLessonQuizStatus });
    } catch (err) {
        res.status(500).json({ message: "Recent lesson and quiz status fetch failed" });
    } // no finaly cause it closes the connection for the next process
}

const processFileUpload = async (req, res) => {
    let finalResult;
    try {
        finalResult = await processUploadedCsv(req)
    } catch (err) {
        res.status(500).json({ message: "File upload failed" });
    } finally {
        res.status(200).json({ message: "File uploaded successfully", finalResult });
    }

}
// <--- User Operations ---> //

module.exports = {
    createNewUser,
    loginUser,
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
    processFileUpload,
}
