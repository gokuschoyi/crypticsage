const express = require('express')
const router = express.Router()
const { initializeApp } = require('firebase/app')

const config = require('../../config');
const app = initializeApp(config.firebaseConfig);

const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require("firebase/auth");
const auth = getAuth();
const { db } = require('../../db');


router.post('/signup', async (req, res) => {
    console.log("Signup request received");
    var userResponse = '';
    const { userName, email, password, mobile_number } = req.body;
    try {
        userResponse = await createUserWithEmailAndPassword(auth, email, password);
        if (userResponse !== '') {
            const createdAt = new Date();
            var data = {
                "email": email,
                createdAt,
                "displayName": userName,
                "mobile_number": mobile_number,
                "emailVerified": userResponse.user.emailVerified,
            }
            const res = await db.collection('users').doc(userResponse.user.uid).set(data);
        }

        var data = {
            "email": userResponse.user.email,
            "uid": userResponse.user.uid,
            "displayName": userName,
            "emailVerified": userResponse.user.emailVerified,
            "createdAt": userResponse.user.createdAt,
            "accessToken": userResponse.user.stsTokenManager.accessToken,
            "expirationTime": userResponse.user.stsTokenManager.expirationTime,
        }
        res.json({ message: "Signup successful", code: 200, status: 'success', data })
    }
    catch (err) {
        res.json({ message: "Signup Error", code: 400, status: 'error', errorMessage: "Email already in use" })
    }
})

router.post('/login', async (req, res) => {
    console.log("Signin request received");
    const { email, password } = req.body;
    var displayName = '';
    try {
        const userResponse = await signInWithEmailAndPassword(auth, email, password);
        const uid = userResponse.user.uid;
        userRef = db.collection("users").doc(uid);
        const snapshot = await userRef.get();
        displayName = snapshot.data().displayName;
        var data = {
            "email": userResponse.user.email,
            "uid": userResponse.user.uid,
            "displayName": displayName,
            "emailVerified": userResponse.user.emailVerified,
            "createdAt": userResponse.user.createdAt,
            "accessToken": userResponse.user.stsTokenManager.accessToken,
            "expirationTime": userResponse.user.stsTokenManager.expirationTime,
        }
        res.json({ message: "Signin successful", code: 200, status: 'success', data })
    }
    catch (err) {
        if (err.code === 'auth/user-not-found') {
            res.json({ message: "Signin Error", code: 400, status: 'error', errorMessage: "User not found" })
        }
        if (err.code === 'auth/wrong-password') {
            res.json({ message: "Signin Error", code: 400, status: 'error', errorMessage: "Wrong password" })
        }
    }
})

router.post('/forgotPassword', async (req, res) => {
    console.log("Forgot password request received");
    const { email } = req.body;
    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('email', '==', email).get();
        if (!snapshot.empty) {
            return res.json({ message: "Email has been sent to you", code: 200, status: 'success', email: email })
        }
        else {
            return res.json({ message: "Sorry, Email not found", code: 400, status: 'error', errorMessage: "User not found" })
        }
    }
    catch (err) {
        res.json({ message: "Forgot password Error", code: 400, status: 'error', errorMessage: "User not found" })
    }
})

module.exports = router