const config = require('../../config');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require('google-auth-library');

const { connect, close } = require('./db-conn')

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
                        signup_type: 'registration'
                    }
                    token = jwt.sign(
                        {
                            email: email,
                            user_name: userName
                        },
                        config.tokenKey,
                        {
                            expiresIn: '4h'
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
                            signup_type: signup_type
                        }
                    }
                    const token = jwt.sign(
                        {
                            email: payload.email,
                            given_name: payload.given_name
                        },
                        config.tokenKey,
                        {
                            expiresIn: '4h'
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
                        signup_type: 'facebook'
                    }
                }
                const token = jwt.sign(
                    {
                        email: userInfo.email,
                        given_name: userInfo.first_name
                    },
                    config.tokenKey,
                    {
                        expiresIn: '4h'
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
                            expiresIn: '4h'
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
                                expiresIn: '4h'
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
                            expiresIn: '4h'
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
                    res.status(200).json({ message: "User login successful", data: userData });
                }
            }
            break;
        default:
            res.status(400).json({ message: "Invalid login type or value not provided" });
    }
}


module.exports = {
    createNewUser,
    loginUser
}
