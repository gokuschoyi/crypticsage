const config = require('../config');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { close } = require('../services/db-conn')
const authDbServices = require('../services/auth-db-services')
const userUtils = require('../utils/user/user-util')

// <--- User Operations ---> //
const createNewUser = async (req, res) => {
    const { signup_type } = req.body;
    if (!signup_type) {
        return res.status(400).json({ message: "Invalid signup type or value not provided" });
    } else {
        try {
            let userData = {};
            switch (signup_type) {
                case 'registration':
                    const { userName, email, password, mobile_number } = req.body;
                    if (!userName || !email || !password || !mobile_number) {
                        return res.status(400).json({ message: "Please fill all the fields" });
                    }
                    else {
                        const [user, userCollection] = await authDbServices.getUserByEmail(email, 'createNewUser - registration')
                        if (user.length > 0) {
                            close("createNewUser - registration");
                            return res.status(400).json({ message: "User already exists" });
                        }
                        else {
                            const hashedPassword = await bcrypt.hash(password, 10);
                            let allStatus = await userUtils.makeAllStatusForUser();
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
                        const payload = await authDbServices.verifyGoogleCredentials(credentials)
                        if (Object.keys(payload).length === 0) {
                            res.status(400).json({ message: "Could not verify your google credentials" });
                        } else {
                            const [user, userCollection] = await authDbServices.getUserByEmail(payload.email, 'createNewUser - google')
                            if (user.length > 0) {
                                return res.status(400).json({ message: "Account already exists, Signin with your google account" });
                            }
                            else {
                                let allStatus = await userUtils.makeAllStatusForUser();
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
                                try {
                                    await userCollection.insertOne(userData);
                                    res.status(200).json({ message: "Account created successfully" });
                                }
                                catch (err) {
                                    res.status(400).json({ message: "User creation failed" });
                                } finally {
                                    close("createNewUser - google");
                                }
                            }
                        }
                    }
                    break;
                case 'facebook':
                    const { userInfo } = req.body;
                    if (!userInfo) {
                        res.status(400).json({ message: "Invalid credentials, please try again" });
                    }
                    else {
                        const [user, userCollection] = await authDbServices.getUserByEmail(userInfo.email, 'createNewUser - facebook')
                        if (user.length > 0) {
                            return res.status(400).json({ message: "User already exists, Signin with your google account" });
                        }
                        else {
                            let allStatus = await userUtils.makeAllStatusForUser();
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
                    }
                    break;
                default:
                    res.status(400).json({ message: "Invalid signup type or value not provided" });
                    break;
            }
        } catch (err) {
            console.log(err);
            res.status(400).json({ message: "User creation failed" });
        }
    }
}

const loginUser = async (req, res) => {
    const { login_type } = req.body;
    if (!login_type) {
        return res.status(400).json({ message: "Invalid login type" });
    } else {
        try {
            let adminList = ['goku@gmail.com', 'gokulsangamitrachoyi@gmail.com']
            let admin_status = false;
            switch (login_type) {
                case 'emailpassword':
                    const { email, password } = req.body;
                    if (!email || !password) {
                        res.status(400).json({ message: "Please fill all the fields" });
                    }
                    else {
                        try {
                            const [user] = await authDbServices.getUserByEmail(email, 'loginUser - emailpassword')
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
                                    let recent_lesson_quiz = await userUtils.getRecentLessonAndQuiz(lesson_status, quiz_status)

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
                            console.log(err)
                            res.status(400).json({ message: "Error fetching user data from db" });
                        } finally {
                            close("loginUser - emailpassword")
                        }
                    }
                    break;
                case 'google':
                    const { credential } = req.body;
                    if (!credential) {
                        res.status(400).json({ message: "No google credentials sent" });
                    }
                    else {
                        try {
                            const payload = await authDbServices.verifyGoogleCredentials(credential)
                            if (Object.keys(payload).length === 0) {
                                res.status(400).json({ message: "Could not verify your google credentials" });
                            } else {
                                let email = payload.email;
                                const [user] = await authDbServices.getUserByEmail(email, 'loginUser - emailpassword')
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
                                    let recent_lesson_quiz = await userUtils.getRecentLessonAndQuiz(lesson_status, quiz_status)

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
                            console.log(err)
                            res.status(400).json({ message: "Could not verify your google credentials" });
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
                        const [user] = await authDbServices.getUserByEmail(facebook_email, 'oginUser - facebook')
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
                            let recent_lesson_quiz = await userUtils.getRecentLessonAndQuiz(lesson_status, quiz_status)

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
        } catch (err) {
            console.log(err);
            res.status(400).json({ message: "Login failed" });
        }
    }
}

module.exports = {
    createNewUser,
    loginUser,
}