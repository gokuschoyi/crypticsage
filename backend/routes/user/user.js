const express = require('express')
const router = express.Router()
const verify = require('../auth/verifyToken')

const {
    verifyPassword,
    updatePassword,
    updateProfilePicture,
    updateUserData,
    updateUserPreference,
    updateUserLessonStatus,
    getInitialQuizDataForUser,
    getQuiz,
    submitQuiz,
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

router.post('/update_userLessonStatus', verify, async (req, res) => {
    console.log("Update user lesson status request received");
    const { uid } = req.body;
    if (!uid) {
        return res.status(500).json({ message: "User Id is required" });
    } else {
        updateUserLessonStatus(req, res);
    }
})

router.post('/get_initial_quiz_data_for_user', verify, async (req, res) => {
    console.log("Get initial quiz data for user request received");
    const { uid } = req.body;
    if (!uid) {
        return res.status(500).json({ message: "User Id is required" });
    } else {
        getInitialQuizDataForUser(req, res)
    }
})

router.post('/getQuiz', verify, async (req, res) => {
    console.log("Get quiz request received");
    const { quizId } = req.body;
    if (!quizId) {
        return res.status(500).json({ message: "Quiz Id is required" });
    } else {
        getQuiz(req, res)
    }
})

router.post('/submitQuiz', verify, async (req, res) => {
    console.log("Submit quiz request received");
    const { uid, sectionId, lessonId, quizId, quizData } = req.body;
    if (!uid || !sectionId || !lessonId || !quizId || !quizData) {
        return res.status(500).json({ message: "Quiz Id is required" });
    } else {
        submitQuiz(req, res)
    }
})

module.exports = router