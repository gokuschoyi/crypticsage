const express = require('express')
const router = express.Router()
const { connect, close } = require('../../utils/db-utils/db-conn')
const verify = require('../auth/verifyToken')
const { v4: uuidv4 } = require('uuid');

router.post('/get_sections', verify, async (req, res) => {
    console.log("Get sections request received");
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
})

router.post('/add_section', async (req, res) => {
    console.log("Add section request received");
    const { title, content, url } = req.body;
    try {
        const db = await connect();
        const userCollection = await db.collection('sections');
        sectionId = uuidv4();
        await userCollection.insertOne({ title, content, url, sectionId });
        await close(db);
        res.status(200).json({ message: "Section added successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Section creation failed" });
    }
})

router.post('/update_section', verify, async (req, res) => {
    console.log("Update ection request received");
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
            res.status(200).json({ message: "Section updated successfully" });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Section update failed" });
    }
})

router.post('/get_lessons', verify, async (req, res) => {
    const { sectionId } = req.body;
    console.log("Get lessons request received");
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
})

router.post('/add_lesson', async (req, res) => {
    console.log("Add lesson request received");
    const { chapter_title, sectionId, lessonData } = req.body;
    try {
        let data = {
            chapter_title,
            sectionId,
            lessonData,
            lessonId: uuidv4()
        }

        const db = await connect();
        const userCollection = await db.collection('lessons');
        const result = await userCollection.insertOne(data);
        let insertedId = result.insertedId;
        let insertedLessonData = await userCollection.find({ _id: insertedId }).toArray();
        let lessonId = insertedLessonData[0].lessonId;
        await close(db);
        res.status(200).json({ message: "Lesson added successfully", lessonId });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Lesson creation failed" });
    }
})

router.post('/update_lesson', verify, async (req, res) => {
    console.log("Update lesson request received");
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
})

router.post('/get_quizquestions', verify, async (req, res) => {
    const { lessonId } = req.body;
    console.log("Get quiz questions request received");
    try {
        const db = await connect();
        const userCollection = await db.collection('quiz');
        const quizQuestions = await userCollection.find({ 'lessonId': lessonId }).toArray();
        await close(db);
        if (quizQuestions.length === 0) {
            res.status(200).json({ message: "No quiz questions found", status: false });
        } else {
            res.status(200).json({ message: "Quiz questions fetched successfully", quizQuestions, status:true });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Quiz questions fetch failed" });
    }
})

router.post('/add_quizquestion', verify, async (req, res) => {
    console.log("Add quiz question request received");
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
})

router.post('/update_quizquestion', verify, async (req, res) => {
    console.log("Update quiz question request received");
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
})

module.exports = router