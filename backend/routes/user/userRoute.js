const express = require('express')
const router = express.Router()
const fs = require('fs');

const verify = require('../auth/verifyToken')
const multer = require('multer');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!req.body || !req.body.uid) {
            cb(new Error('Missing parameter in request body or order of uid is incorrect. (uid should be first in body)'));
        } else {
            let foldrPath = `./user_uploads/${req.body.uid}`;
            if (!fs.existsSync(foldrPath)) {
                fs.mkdirSync(foldrPath);
            }
            cb(null, `${foldrPath}`)
        }
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
})
const upload = multer({
    storage: storage
});

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
    getRecentLessonAndQuizStatus,
    processFileUpload
} = require('../../utils/db-utils/user-db')

router.post('/verify_password', verify, async (req, res) => {
    console.log("Verify password request received");
    const { password } = req.body;
    if (!password) {
        res.status(500).json({ message: "Invalid request" });
    } else {
        verifyPassword(req, res)
    }
})

router.post('/update_password', verify, async (req, res) => {
    console.log("Update password request received");
    const { password } = req.body;
    if (!password) {
        res.status(500).json({ message: "Invalid request" });
    } else {
        updatePassword(req, res)
    }
})

router.post('/update_profileimage', verify, async (req, res) => {
    console.log("Update profile image request received");
    const { profileImage } = req.body;
    if (!profileImage) {
        res.status(500).json({ message: "Invalid request" });
    } else {
        updateProfilePicture(req, res)
    }
})

router.post('/update_userdata', verify, async (req, res) => {
    console.log("Update user data request received");
    const { userData } = req.body;
    if (!userData) {
        res.status(500).json({ message: "Invalid request" });
    } else {
        updateUserData(req, res)
    }
})

router.post('/update_preferences', verify, async (req, res) => {
    console.log("Update preferences request received");
    const { preferences } = req.body;
    if (!preferences) {
        res.status(500).json({ message: "Invalid request" });
    } else {
        updateUserPreference(req, res)
    }
})

router.post('/update_userLessonStatus', verify, async (req, res) => {
    console.log("Update user lesson status request received");
    const { lesson_status } = req.body;
    if (!lesson_status) {
        return res.status(500).json({ message: "User Id is required" });
    } else {
        updateUserLessonStatus(req, res);
    }
})

router.post('/get_initial_quiz_data_for_user', verify, async (req, res) => {
    console.log("Get initial quiz data for user request received");
    getInitialQuizDataForUser(req, res)
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
    const { sectionId, lessonId, quizId, quizData } = req.body;
    if (!sectionId || !lessonId || !quizId || !quizData) {
        return res.status(500).json({ message: "Quiz Id is required" });
    } else {
        submitQuiz(req, res)
    }
})

router.post('/get_recent_lesson_and_quiz', verify, async (req, res) => {
    console.log("Get recent lesson and quiz request received");
    getRecentLessonAndQuizStatus(req, res)
})

router.post('/upload_log_files', verify, upload.array('file', 3), async (req, res) => {
    if (!req.files.length === 0) {
        return res.status(500).json({ message: 'No files were uploaded.' });
    } else {
        processFileUpload(req, res)
    }
})
module.exports = router