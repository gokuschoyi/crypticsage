const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt');
const { connect, close } = require('../../utils/db-utils/db-conn')
const verify = require('../auth/verifyToken')

router.post('/verify_password', verify, async (req, res) => {
    console.log("Verify password request received");
    const { uid, password } = req.body;
    if (!uid || !password) {
        res.status(500).json({ message: "Invalid request" });
    } else {
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
})

router.post('/update_password', verify, async (req, res) => {
    console.log("Update password request received");
    const { uid, password } = req.body;
    if (!uid || !password) {
        res.status(500).json({ message: "Invalid request" });
    } else {
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
})

router.post('/update_profileimage', verify, async (req, res) => {
    console.log("Update profile image request received");
    const { uid, profileImage } = req.body;
    if (!uid || !profileImage) {
        res.status(500).json({ message: "Invalid request" });
    } else {
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
})

router.post('/update_userdata', verify, async (req, res) => {
    console.log("Update user data request received");
    const { uid, userData } = req.body;
    if (!uid || !userData) {
        res.status(500).json({ message: "Invalid request" });
    } else {
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
})

module.exports = router