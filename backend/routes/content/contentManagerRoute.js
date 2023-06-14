const express = require('express')
const router = express.Router()
const verify = require('../auth/verifyToken')
const { v4: uuidv4 } = require('uuid');

const {
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
} = require('../../utils/db-utils/admin-db')

router.post('/get_sections', verify, async (req, res) => {
    console.log("Get sections request received");
    getSections(req, res);
})

router.post('/add_section', async (req, res) => {
    console.log("Add section request received");
    const { title, content } = req.body;
    if (!title || !content) {
        return res.status(500).json({ message: "Invalid section data" });
    } else {
        addSection(req, res);
    }
})

router.post('/update_section', verify, async (req, res) => {
    console.log("Update ection request received");
    const { sectionId } = req.body;
    if (sectionId === '') {
        return res.status(500).json({ message: "Section Id is required" });
    } else {
        updateSection(req, res);
    }
})

router.post('/delete_section', verify, async (req, res) => {
    console.log("Delete section request received");
    const { sectionId } = req.body;
    if (sectionId === '') {
        return res.status(500).json({ message: "Section Id is required" });
    } else {
        deleteSection(req, res);
    }
})

router.post('/get_lessons', verify, async (req, res) => {
    console.log("Get lessons request received");
    const { sectionId } = req.body;
    if (sectionId === '') {
        return res.status(500).json({ message: "Section Id is required" });
    } else {
        getLessons(req, res);
    }
})

router.post('/add_lesson', async (req, res) => {
    console.log("Add lesson request received");
    const { chapter_title, sectionId, lessonData } = req.body;
    if (!chapter_title || !sectionId || !lessonData) {
        return res.status(500).json({ message: "Invalid or No parameters passed" });
    } else {
        addLesson(req, res);
    }
})

router.post('/update_lesson', verify, async (req, res) => {
    console.log("Update lesson request received");
    const { lessonId } = req.body;
    if (!lessonId) {
        return res.status(500).json({ message: "Section Id is required" });
    } else {
        updateLesson(req, res);
    }
})

router.post('/delete_lesson', verify, async (req, res) => {
    console.log("Delete lesson request received");
    const { lessonId } = req.body;
    if (!lessonId) {
        return res.status(500).json({ message: "Lesson Id is required" });
    } else {
        deleteLesson(req, res);
    }
})

router.post('/get_quizquestions', verify, async (req, res) => {
    console.log("Get quiz questions request received");
    const { lessonId } = req.body;
    if (!lessonId) {
        return res.status(500).json({ message: "Lesson Id is required" });
    } else {
        getQuizQuestions(req, res);
    }
})

router.post('/add_quizquestion', verify, async (req, res) => {
    console.log("Add quiz question request received");
    const { quizData } = req.body;
    if (!quizData) {
        return res.status(500).json({ message: "Invalid or No parameters passed" });
    } else {
        addQuizQuestions(req, res);
    }
})

router.post('/update_quizquestion', verify, async (req, res) => {
    console.log("Update quiz question request received");
    const { quizId } = req.body;
    if (!quizId) {
        return res.status(500).json({ message: "Quiz Id is required" });
    } else {
        updateQuizQuestions(req, res);
    }
})

router.post('/delete_quizquestion', verify, async (req, res) => {
    console.log("Delete quiz question request received");
    const { quizId, lessonId, sectionId } = req.body;
    if (!quizId || !lessonId || !sectionId) {
        return res.status(500).json({ message: "Quiz Id is required" });
    } else {
        deleteQuizQuestion(req, res);
    }
})

module.exports = router