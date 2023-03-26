const express = require('express')
const router = express.Router()

const { createNewUser, loginUser } = require('../../utils/db-utils/mongodb')

router.post('/signup', async (req, res) => {
    console.log("Signup request received");
    const { signup_type } = req.body;
    try {
        if (!signup_type) {
            return res.status(400).json({ message: "Invalid signup type or value not provided" });
        }
        else {
            createNewUser(req, res);
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "User creation failed" });
    }
})

router.post('/login', async (req, res) => {
    console.log("Signin request received");
    const { login_type } = req.body;
    try {
        if (!login_type) {
            res.status(400).json({ message: "Invalid login type or value not provided" });
        }
        else {
            loginUser(req, res);
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "User login failed" });
    }
})

module.exports = router