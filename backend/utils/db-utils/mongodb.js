const config = require('../../config');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require('google-auth-library');

const { connect, close } = require('./db-conn')

const { sortAndGroupLessons } = require('./helpers');

const makeUserLessonStatus = async () => {
    const db = await connect();
    const lessonCollection = await db.collection('lessons');
    const lessons = await lessonCollection.find({}).toArray();
    const userLessonStatus = [];
    lessons.forEach(lesson => {
        userLessonStatus.push({
            section_id: lesson.sectionId,
            lesson_id: lesson.lessonId,
            lesson_name: lesson.chapter_title,
            lesson_start: false,
            lesson_progress: 1,
            lesson_completed: false,
        })
    });
    const groupedLessons = sortAndGroupLessons(userLessonStatus);
    close();
    return groupedLessons;
}

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
                const db = await connect();
                const userCollection = await db.collection('users');
                const filterEmail = { email: email }
                const user = await userCollection.find(filterEmail).toArray();
                if (user.length > 0) {
                    close();
                    return res.status(400).json({ message: "User already exists" });
                }
                else {
                    const hashedPassword = await bcrypt.hash(password, 10);
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
                        lesson_status: await makeUserLessonStatus()
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
                        close();
                        delete userData.password;
                        userData.accessToken = token;
                        res.status(200).json({ message: "User created successfully", data: userData });
                    }
                    catch (err) {
                        console.log(err);
                        res.status(500).json({ message: "User creation failed" });
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

                    const db = await connect();
                    const userCollection = await db.collection('users');
                    const filterEmail = { email: payload.email }
                    const user = await userCollection.find(filterEmail).toArray();

                    if (user.length > 0) {
                        close();
                        return res.status(400).json({ message: "User already exists, Signin with your google account" });
                    }
                    else {
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
                            lesson_status: await makeUserLessonStatus()
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
                        close();
                        delete userData.password;
                        userData.accessToken = token;
                        res.status(200).json({ message: "User created successfully", data: userData });
                    }
                    catch (err) {
                        console.log(err);
                        res.status(500).json({ message: "User creation failed" });
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
                const db = await connect();
                const userCollection = await db.collection('users');
                const filterEmail = { email: userInfo.email }
                const user = await userCollection.find(filterEmail).toArray();

                if (user.length > 0) {
                    close();
                    return res.status(400).json({ message: "User already exists, Signin with your google account" });
                }
                else {
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
                        lesson_status: await makeUserLessonStatus()
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
                    close();
                    delete userData.password;
                    userData.accessToken = token;
                    res.status(200).json({ message: "User created successfully", data: userData });
                }
                catch (err) {
                    console.log(err);
                    res.status(500).json({ message: "User creation failed" });
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
                const db = await connect();
                const userCollection = await db.collection('users');
                const filterEmail = { email: email }
                const user = await userCollection.find(filterEmail).toArray();
                if (user.length === 0) {
                    res.status(400).json({ message: "User does not exist or email is wrong" });
                }
                else {
                    admin_status = adminList.includes(email);
                    const hashedPassword = user[0].password;
                    const decryptedPassword = await bcrypt.compare(password, hashedPassword);
                    const token = jwt.sign(
                        {
                            email: user[0].email,
                            user_name: user[0].user_name
                        },
                        config.tokenKey,
                        {
                            expiresIn: '8h'
                        }
                    );
                    if (decryptedPassword) {
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
                        res.status(200).json({ message: "User login successful", data: userData });
                    }
                    else {
                        close();
                        res.status(400).json({ message: "wrong password" });
                    }
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
                    const db = await connect();
                    const userCollection = await db.collection('users');
                    const filterEmail = { email: email }
                    const user = await userCollection.find(filterEmail).toArray();
                    if (user.length === 0) {
                        res.status(400).json({ message: "There is no account associated with your email. Register first" });
                    }
                    else {
                        admin_status = adminList.includes(email);
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
                        res.status(200).json({ message: "User login successful", data: userData });
                    }
                }
                catch (err) {
                    console.log(err);
                    res.status(500).json({ message: "Could not verify your credentials" });
                }
            }
            break;
        case 'facebook':
            const { facebook_email } = req.body;
            if (!facebook_email) {
                res.status(400).json({ message: "Invalid credentials, please try again" });
            }
            else {
                const db = await connect();
                const userCollection = await db.collection('users');
                const filterEmail = { email: facebook_email }
                const user = await userCollection.find(filterEmail).toArray();
                if (user.length === 0) {
                    res.status(400).json({ message: "There is no account associated with your email. Register first" });
                }
                else {
                    admin_status = adminList.includes(facebook_email);
                    const token = jwt.sign(
                        {
                            email: user[0].email,
                            given_name: user[0].user_name
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
                    res.status(200).json({ message: "User login successful", data: userData });
                }
            }
            break;
        default:
            res.status(400).json({ message: "Invalid login type or value not provided" });
    }
}

const getSections = async (req, res) => {
    try {
        const db = await connect();
        const userCollection = await db.collection('sections');
        const sections = await userCollection.find({}).toArray();
        await close(db);
        if (sections.length === 0) {
            res.status(200).json({ message: "No sections found" });
        } else {
            res.status(200).json({ message: "Sections fetched successfully", sections });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Sections fetch failed" });
    }
}

const addSection = async (req, res) => {
    const { title, content, url } = req.body;
    try {
        const db = await connect();
        const sectionCollection = await db.collection('sections');
        sectionId = uuidv4();
        let result = await sectionCollection.insertOne({ title, content, url, sectionId });
        let insertedSectionId = result.insertedId;
        let insertedSectionData = await sectionCollection.findOne({ _id: insertedSectionId });
        let createdSectionId = insertedSectionData.sectionId

        const allUserCollection = await db.collection('users')
        const userCollection = await db.collection('users').find().toArray();
        for (const user of userCollection) {
            await allUserCollection.updateOne(
                { _id: user._id },
                { $set: { [`lesson_status.${createdSectionId}`]: [] } }
            )
        }
        await close(db);
        res.status(200).json({ message: "Section added successfully", createdSectionId, update:false });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Section creation failed" });
    }
}

const updateSection = async (req, res) => {
    const { title, content, url, sectionId } = req.body;
    try {
        const db = await connect();
        const userCollection = await db.collection('sections');
        let section = await userCollection.findOne({ sectionId });
        if (section === null) {
            await close(db);
            res.status(500).json({ message: "Section not found" });
        }
        else {
            await userCollection.updateOne({ sectionId }, { $set: { title, content, url } });
            await close(db);
            res.status(200).json({ message: "Section updated successfully", update: true });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Section update failed" });
    }
}

const deleteSection = async (req, res) => {
    const { sectionId } = req.body;
    try {
        const db = await connect();
        const sectionCollection = await db.collection('sections')
        const result = sectionCollection.deleteOne({ sectionId: sectionId });

        const lessonsCollection = await db.collection('lessons')
        const lessonsResult = lessonsCollection.deleteMany({ sectionId: sectionId });

        const allUserCollection = await db.collection('users')
        const userCollection = await db.collection('users').find().toArray();
        for (const user of userCollection) {
            await allUserCollection.updateOne(
                { _id: user._id },
                { $unset: { [`lesson_status.${sectionId}`]: "" } }
            )
        }
        await close(db);
        res.status(200).json({ message: "Section deleted successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Section deletion failed" });
    }
}

const getLessons = async (req, res) => {
    const { sectionId } = req.body;
    try {
        const db = await connect();
        const userCollection = await db.collection('lessons');
        const lessons = await userCollection.find({ 'sectionId': sectionId }).toArray();
        await close(db);
        if (lessons.length === 0) {
            res.status(200).json({ message: "No lessons found" });
        } else {
            res.status(200).json({ message: "Lessons fetched successfully", lessons });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Lessons fetch failed" });
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

        const db = await connect();
        const lessonsCollection = await db.collection('lessons');
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
        const allUserCollection = await db.collection('users')
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

        await close(db);
        res.status(200).json({ message: "Lesson added successfully", lessonId });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Lesson creation failed" });
    }
}

const updateLesson = async (req, res) => {
    const { chapter_title, sectionId, lessonData, lessonId } = req.body;
    try {
        const db = await connect();
        const userCollection = await db.collection('lessons');
        let lesson = await userCollection.findOne({ lessonId });
        if (lesson === null) {
            await close(db);
            res.status(500).json({ message: "Lesson not found" });
        } else {
            await userCollection.updateOne({ lessonId }, { $set: { chapter_title, sectionId, lessonData } });
            await close(db)
            res.status(200).json({ message: "Lesson updated successfully" });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Lesson update failed" });
    }
}

const deleteLesson = async (req, res) => {
    const { lessonId, sectionId } = req.body;
    try {
        const db = await connect();
        const lessonsCollection = await db.collection('lessons');
        const result = await lessonsCollection.deleteOne({ lessonId: lessonId });

        const allUserCollection = await db.collection('users')
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
    }
}

const getQuizQuestions = async (req, res) => {
    const { lessonId } = req.body;
    try {
        const db = await connect();
        const userCollection = await db.collection('quiz');
        const quizQuestions = await userCollection.find({ 'lessonId': lessonId }).toArray();
        await close(db);
        if (quizQuestions.length === 0) {
            res.status(200).json({ message: "No quiz questions found", status: false });
        } else {
            res.status(200).json({ message: "Quiz questions fetched successfully", quizQuestions, status: true });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Quiz questions fetch failed" });
    }
}

const addQuizQuestions = async (req, res) => {
    const { quizData } = req.body;
    try {
        const db = await connect();
        const userCollection = await db.collection('quiz');
        quizData.quizId = uuidv4();
        const result = await userCollection.insertOne(quizData);
        let insertedId = result.insertedId;
        let insertedQuizData = await userCollection.find({ _id: insertedId }).toArray();
        let quizId = insertedQuizData[0].quizId;
        await close(db);
        res.status(200).json({ message: "Quiz question added successfully", quizId });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Quiz question creation failed" });
    }
}

const updateQuizQuestions = async (req, res) => {
    const { quizId, quizTitle, quizDescription, questions } = req.body;
    try {
        const db = await connect();
        const userCollection = await db.collection('quiz');
        let quiz = await userCollection.findOne({ quizId });
        if (quiz === null) {
            await close(db);
            res.status(500).json({ message: "Quiz question not found" });
        } else {
            await userCollection.updateOne({ quizId }, { $set: { quizTitle, quizDescription, questions } });
            await close(db);
            res.status(200).json({ message: "Quiz question updated successfully" });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Quiz question update failed" });
    }
}

const verifyPassword = async (req, res) => {
    const { uid, password } = req.body;
    try {
        const db = await connect();
        const userCollection = await db.collection('users');
        const user = await userCollection.find({ 'uid': uid }).toArray();
        const hashedPassword = user[0].password;
        const validPassword = await bcrypt.compare(password, hashedPassword);
        if (validPassword) {
            res.status(200).json({ message: "Password verified successfully", validPassword });
            await close(db);
        } else {
            res.status(500).json({ message: "Incorrect Password", validPassword });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Password verification failed" });
    }
}

const updatePassword = async (req, res) => {
    const { uid, password } = req.body;
    try {
        const db = await connect();
        const userCollection = await db.collection('users');
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await userCollection.updateOne({ 'uid': uid }, { $set: { 'password': hashedPassword } });
        if (user) {
            res.status(200).json({ message: "Password updated successfully", status: true });
            await close(db);
        } else {
            res.status(500).json({ message: "Password updation failed" });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Password updation failed" });
    }
}

const updateProfilePicture = async (req, res) => {
    const { uid, profileImage } = req.body;
    try {
        const db = await connect();
        const userCollection = await db.collection('users');
        const user = await userCollection.updateOne({ 'uid': uid }, { $set: { 'profile_image': profileImage } });
        if (user) {
            res.status(200).json({ message: "Profile image updated successfully", status: true });
            await close(db);
        } else {
            res.status(500).json({ message: "Profile image updation failed" });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Profile image updation failed" });
    }
}

const updateUserData = async (req, res) => {
    const { uid, userData } = req.body;
    try {
        const db = await connect();
        const userCollection = await db.collection('users');
        const user = await userCollection.updateOne({ 'uid': uid }, { $set: { 'displayName': userData.displayName, 'mobile_number': userData.mobile_number } });
        if (user) {
            res.status(200).json({ message: "User data updated successfully", status: true });
            await close(db);
        } else {
            res.status(500).json({ message: "User data updation failed" });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "User data updation failed" });
    }
}

const updateUserPreference = async (req, res) => {
    const { uid, preferences } = req.body;
    try {
        const db = await connect();
        const userCollection = await db.collection('users');
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
            await close(db);
        } else {
            res.status(500).json({ message: "Preferences updation failed" });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Preferences updation failed" });
    }
}

const updateUserLessonStatus = async (req, res) => {
    const { uid, lesson_status } = req.body;
    try {
        const db = await connect();
        const userCollection = await db.collection('users');
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
            await close(db);
        } else {
            res.status(500).json({ message: "User lesson status updation failed" });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "User lesson status updation failed" });
    }
}

module.exports = {
    makeUserLessonStatus,
    createNewUser,
    loginUser,
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
    verifyPassword,
    updatePassword,
    updateProfilePicture,
    updateUserData,
    updateUserPreference,
    updateUserLessonStatus,
}
