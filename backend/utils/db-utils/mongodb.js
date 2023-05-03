const config = require('../../config');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require('google-auth-library');
const { connect, close } = require('./db-conn')

const {
    makeAllStatusForUser,
    transformQuizData,
    processUploadedCsv
} = require('./helpers');

// <--- User Operations ---> //
const createNewUser = async (req, res) => {
    const { signup_type } = req.body;
    let token = '';
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
                    token = jwt.sign(
                        {
                            email: email,
                            user_name: userName
                        },
                        config.tokenKey,
                        {
                            expiresIn: '8h'
                        }
                    );
                    try {
                        await userCollection.insertOne(userData);
                        delete userData.password;
                        userData.accessToken = token;
                        res.status(200).json({ message: "User created successfully", data: userData });
                    }
                    catch (err) {
                        console.log(err);
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
                        return res.status(400).json({ message: "User already exists, Signin with your google account" });
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
                    const token = jwt.sign(
                        {
                            email: payload.email,
                            given_name: payload.given_name
                        },
                        config.tokenKey,
                        {
                            expiresIn: '8h'
                        }
                    );
                    try {
                        await userCollection.insertOne(userData);
                        close("createNewUser - google");
                        delete userData.password;
                        userData.accessToken = token;
                        res.status(200).json({ message: "User created successfully", data: userData });
                    }
                    catch (err) {
                        console.log(err);
                        res.status(500).json({ message: "User creation failed" });
                    } finally {
                        close("createNewUser - google");
                    }
                } catch (err) {
                    console.log(err);
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
                const token = jwt.sign(
                    {
                        email: userInfo.email,
                        given_name: userInfo.first_name
                    },
                    config.tokenKey,
                    {
                        expiresIn: '8h'
                    }
                );
                try {
                    await userCollection.insertOne(userData);
                    close("createNewUser - facebook");
                    delete userData.password;
                    userData.accessToken = token;
                    res.status(200).json({ message: "User created successfully", data: userData });
                }
                catch (err) {
                    console.log(err);
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
                                    expiresIn: '8h'
                                }
                            );

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

                            res.status(200).json({ message: "User login successful", data: userData });
                        }
                    }
                } catch (err) {
                    console.log(err);
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
                                expiresIn: '8h'
                            }
                        );
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

                        res.status(200).json({ message: "User login successful", data: userData });
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
                            expiresIn: '8h'
                        }
                    );
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
                    res.status(200).json({ message: "User login successful", data: userData });
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
        console.log(err);
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
        console.log(err);
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
        console.log(err);
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
        console.log(err);
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
        console.log(err);
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
        console.log(err);
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
        console.log(err);
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
        console.log(err);
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
        console.log(err);
        res.status(500).json({ message: "Quiz submission failed" });
    } finally {
        close("submitQuiz");
    }
}

const processFileUpload = async (req, res) => {
    let finalResult;
    try {
        finalResult = await processUploadedCsv(req)
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "File upload failed" });
    } finally {
        res.status(200).json({ message: "File uploaded successfully", finalResult });
    }

}
// <--- User Operations ---> //

// <--- Sections ---> //
const getSections = async (req, res) => {
    try {
        const db = await connect("getSections");
        const sectionsCollection = db.collection('sections');
        const sections = await sectionsCollection.find({}).toArray();
        if (sections.length === 0) {
            res.status(200).json({ message: "No sections found" });
        } else {
            res.status(200).json({ message: "Sections fetched successfully", sections });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Sections fetch failed" });
    } finally {
        close("getSections");
    }
}

const addSection = async (req, res) => {
    const { title, content, url } = req.body;
    try {
        const db = await connect("addSection");
        const sectionCollection = db.collection('sections');
        sectionId = uuidv4();
        let result = await sectionCollection.insertOne({ title, content, url, sectionId });
        let insertedSectionId = result.insertedId;
        let insertedSectionData = await sectionCollection.findOne({ _id: insertedSectionId });
        let createdSectionId = insertedSectionData.sectionId

        const allUserCollection = db.collection('users')
        const userCollection = await db.collection('users').find().toArray();
        for (const user of userCollection) {
            await allUserCollection.updateOne(
                { _id: user._id },
                { $set: { [`lesson_status.${createdSectionId}`]: [] } }
            )
        }
        res.status(200).json({ message: "Section added successfully", createdSectionId, update: false });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Section creation failed" });
    } finally {
        close("addSection");
    }
}

const updateSection = async (req, res) => {
    const { title, content, url, sectionId } = req.body;
    try {
        const db = await connect("updateSection");
        const sectionsCollection = db.collection('sections');
        let section = await sectionsCollection.findOne({ sectionId });
        if (section === null) {
            res.status(500).json({ message: "Section not found" });
        }
        else {
            await sectionsCollection.updateOne({ sectionId }, { $set: { title, content, url } });
            res.status(200).json({ message: "Section updated successfully", update: true });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Section update failed" });
    } finally {
        close("updateSection");
    }
}

const deleteSection = async (req, res) => {
    const { sectionId } = req.body;
    try {
        const db = await connect("deleteSection");
        const sectionCollection = db.collection('sections')
        const result = sectionCollection.deleteOne({ sectionId: sectionId });

        const lessonsCollection = db.collection('lessons')
        const lessonsResult = lessonsCollection.deleteMany({ sectionId: sectionId });

        const allUserCollection = db.collection('users')
        const userCollection = await db.collection('users').find().toArray();
        for (const user of userCollection) {
            await allUserCollection.updateOne(
                { _id: user._id },
                { $unset: { [`lesson_status.${sectionId}`]: "" } }
            )
        }
        res.status(200).json({ message: "Section deleted successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Section deletion failed" });
    } finally {
        close("deleteSection");
    }
}
// <--- Sections ---> //

// <--- Lessons ---> //
const getLessons = async (req, res) => {
    const { sectionId } = req.body;
    try {
        const db = await connect("getLessons");
        const lessonsCollection = db.collection('lessons');
        const lessons = await lessonsCollection.find({ 'sectionId': sectionId }).toArray();
        if (lessons.length === 0) {
            res.status(200).json({ message: "No lessons found" });
        } else {
            res.status(200).json({ message: "Lessons fetched successfully", lessons });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Lessons fetch failed" });
    } finally {
        close("getLessons");
    }
}

const addLesson = async (req, res) => {
    const { chapter_title, sectionId, lessonData } = req.body;
    try {
        let data = {
            chapter_title,
            sectionId,
            lessonData,
            lessonId: uuidv4()
        }

        const db = await connect("addLesson");
        const lessonsCollection = db.collection('lessons');
        const result = await lessonsCollection.insertOne(data);
        let insertedId = result.insertedId;
        let insertedLessonData = await lessonsCollection.find({ _id: insertedId }).toArray();
        let lessonId = insertedLessonData[0].lessonId;
        let lesson_status = {
            section_id: sectionId,
            lesson_id: lessonId,
            lesson_name: lessonData.title,
            lesson_start: false,
            lesson_progress: 1,
            lesson_complete: false,
        }
        const allUserCollection = db.collection('users')
        const userCollection = await db.collection('users').find().toArray();
        for (const user of userCollection) {
            if (sectionId in user.lesson_status) {
                console.log("Lesson status key exists");
                await allUserCollection.updateOne(
                    { _id: user._id },
                    { $push: { [`lesson_status.${sectionId}`]: lesson_status } }
                );
            } else {
                console.log("Lesson status key does not exist");
                await collection.updateOne(
                    { _id: user._id },
                    { $set: { [`lesson_status.${sectionId}`]: [lesson_status] } }
                );
            }
        }
        res.status(200).json({ message: "Lesson added successfully", lessonId });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Lesson creation failed" });
    } finally {
        close("addLesson");
    }
}

const updateLesson = async (req, res) => {
    const { chapter_title, sectionId, lessonData, lessonId } = req.body;
    try {
        const db = await connect("updateLesson");
        const lessonsCollection = db.collection('lessons');
        let lesson = await lessonsCollection.findOne({ lessonId });
        if (lesson === null) {
            res.status(500).json({ message: "Lesson not found" });
        } else {
            await lessonsCollection.updateOne({ lessonId }, { $set: { chapter_title, sectionId, lessonData } });
            res.status(200).json({ message: "Lesson updated successfully" });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Lesson update failed" });
    } finally {
        close("updateLesson")
    }
}

const deleteLesson = async (req, res) => {
    const { lessonId, sectionId } = req.body;
    try {
        const db = await connect("deleteLesson");
        const lessonsCollection = db.collection('lessons');
        const result = await lessonsCollection.deleteOne({ lessonId: lessonId });

        const allUserCollection = db.collection('users')
        const userCollection = await db.collection('users').find().toArray();
        for (const user of userCollection) {
            if (sectionId in user.lesson_status) {
                console.log("Lesson status key exists");
                await allUserCollection.updateOne(
                    { _id: user._id },
                    { $pull: { [`lesson_status.${sectionId}`]: { lesson_id: lessonId } } }
                )
            } else {
                console.log("Lesson status key not present")
            }
        }
        res.status(200).json({ message: "Lesson deleted successfully", result });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Lesson deletion failed" });
    } finally {
        close("deleteLesson");
    }
}
// <--- Lessons ---> //


// <--- Quiz ---> //
const getQuizQuestions = async (req, res) => {
    const { lessonId } = req.body;
    try {
        const db = await connect("getQuizQuestions");
        const quizCollection = db.collection('quiz');
        const quizQuestions = await quizCollection.find({ 'lessonId': lessonId }).toArray();
        if (quizQuestions.length === 0) {
            res.status(200).json({ message: "No quiz questions found", status: false });
        } else {
            res.status(200).json({ message: "Quiz questions fetched successfully", quizQuestions, status: true });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Quiz questions fetch failed" });
    } finally {
        close("getQuizQuestions");
    }
}

const addQuizQuestions = async (req, res) => {
    const { quizData } = req.body;
    try {
        const db = await connect("addQuizQuestions");
        const quizCollection = db.collection('quiz');
        quizData.quizId = uuidv4();
        quizData.questions.map((question) => {
            question.question_id = uuidv4();
        })
        const result = await quizCollection.insertOne(quizData);
        let insertedId = result.insertedId;
        let insertedQuizData = await quizCollection.find({ _id: insertedId }).toArray();
        let quizId = insertedQuizData[0].quizId;

        const allUserCollection = db.collection('users')
        const { sectionId, lessonId } = quizData;
        const quizObject = {
            section_id: sectionId,
            lesson_id: lessonId,
            quiz_id: quizId,
            quiz_name: insertedQuizData[0].quizTitle,
            quiz_completed_date: "",
            quiz_score: "",
            quiz_completed: false,
        };

        const AUCollection = allUserCollection.find({})
        while (await AUCollection.hasNext()) {
            const user = await AUCollection.next();
            if (!user.quiz_status[sectionId]) {
                // Create a new object for the section ID if it doesn't exist
                user.quiz_status[sectionId] = {};
            }
            // Check if the lesson ID exists in the quiz_status object
            if (!user.quiz_status[sectionId][lessonId]) {
                // Create a new epmty array for the lesson ID if it doesn't exist
                user.quiz_status[sectionId][lessonId] = [];
            }
            // Add the new quiz object to the quizzes array
            user.quiz_status[sectionId][lessonId].push(quizObject);
            // Update the document in the collection
            await allUserCollection.updateOne(
                { _id: user._id },
                { $set: { quiz_status: user.quiz_status } }
            );
        }
        res.status(200).json({ message: "Quiz question added successfully", quizId });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Quiz question creation failed" });
    } finally {
        close("addQuizQuestions");
    }
}

const updateQuizQuestions = async (req, res) => {
    const { quizId, quizTitle, quizDescription, questions } = req.body;
    try {
        const db = await connect("updateQuizQuestions");
        const userCollection = db.collection('quiz');
        let quiz = await userCollection.findOne({ quizId });
        if (quiz === null) {
            close("updateQuizQuestions");
            res.status(500).json({ message: "Quiz question not found" });
        } else {
            await userCollection.updateOne({ quizId }, { $set: { quizTitle, quizDescription, questions } });
            close("updateQuizQuestions");
            res.status(200).json({ message: "Quiz question updated successfully" });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Quiz question update failed" });
    }
}

const deleteQuizQuestion = async (req, res) => {
    const { sectionId, lessonId, quizId } = req.body;
    try {
        const db = await connect("deleteQuizQuestion");
        const quizCollection = db.collection('quiz');
        await quizCollection.deleteOne({ quizId: quizId });

        let resuw = []
        const allUserCollection = db.collection('users')
        const AUCollection = allUserCollection.find({})
        while (await AUCollection.hasNext()) {
            const user = await AUCollection.next();
            let resultw = await allUserCollection.updateOne(
                { _id: user._id },
                { $pull: { [`quiz_status.${sectionId}.${lessonId}`]: { quiz_id: quizId } } }
            )
            resuw.push(resultw)

        }

        res.status(200).json({ message: "Quiz question deleted successfully", resuw });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Quiz question deletion failed" });
    } finally {
        close("deleteQuizQuestion");
    }
}
// <--- Quiz ---> //


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
    processFileUpload,
    getSections,
    addSection,
    updateSection,
    deleteSection,
    getLessons,
    addLesson,
    updateLesson,
    deleteLesson,
    getQuizQuestions,
    addQuizQuestions,
    updateQuizQuestions,
    deleteQuizQuestion,
}
