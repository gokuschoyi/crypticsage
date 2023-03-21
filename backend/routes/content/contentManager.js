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
    const {  chapter_title, sectionId, lessonData } = req.body;
    try {
        let data={
            chapter_title,
            sectionId,
            lessonData,
            lessonId:uuidv4()
        }

        const db = await connect();
        const userCollection = await db.collection('lessons');
        await userCollection.insertOne(data);
        await close(db);
        res.status(200).json({ message: "Lesson added successfully" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Lesson creation failed" });
    }
})

module.exports = router