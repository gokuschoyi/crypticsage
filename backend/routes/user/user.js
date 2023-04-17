const express = require('express')
const router = express.Router()
const verify = require('../auth/verifyToken')

const {
    verifyPassword,
    updatePassword,
    updateProfilePicture,
    updateUserData,
    updateUserPreference
} = require('../../utils/db-utils/mongodb')

router.post('/verify_password', verify, async (req, res) => {
    console.log("Verify password request received");
    const { uid, password } = req.body;
    if (!uid || !password) {
        res.status(500).json({ message: "Invalid request" });
    } else {
        verifyPassword(req, res)
    }
})

router.post('/update_password', verify, async (req, res) => {
    console.log("Update password request received");
    const { uid, password } = req.body;
    if (!uid || !password) {
        res.status(500).json({ message: "Invalid request" });
    } else {
        updatePassword(req, res)
    }
})

router.post('/update_profileimage', verify, async (req, res) => {
    console.log("Update profile image request received");
    const { uid, profileImage } = req.body;
    if (!uid || !profileImage) {
        res.status(500).json({ message: "Invalid request" });
    } else {
        updateProfilePicture(req, res)
    }
})

router.post('/update_userdata', verify, async (req, res) => {
    console.log("Update user data request received");
    const { uid, userData } = req.body;
    if (!uid || !userData) {
        res.status(500).json({ message: "Invalid request" });
    } else {
        updateUserData(req, res)
    }
})

router.post('/update_preferences', verify, async (req, res) => {
    console.log("Update preferences request received");
    const { uid, preferences } = req.body;
    if (!uid || !preferences) {
        res.status(500).json({ message: "Invalid request" });
    } else {
        updateUserPreference(req, res)
    }
})

module.exports = router