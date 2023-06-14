const { connect, close } = require('../db-conn')

// <--- Sections ---> //
const getSections = async (req, res) => {
    try {
        const db = await connect("getSections");
        const sectionsCollection = db.collection('sections');
        const sections = await sectionsCollection.find({}).toArray();
        if (sections.length === 0) {
            res.status(200).json({ message: "No sections found" });
        } else {
            res.status(200).json({ message: "Sections fetched successfully", sections });
        }
    } catch (err) {
        res.status(500).json({ message: "Sections fetch failed" });
    } finally {
        close("getSections");
    }
}

const addSection = async (req, res) => {
    const { title, content, url } = req.body;
    try {
        const db = await connect("addSection");
        const sectionCollection = db.collection('sections');
        sectionId = uuidv4();
        let result = await sectionCollection.insertOne({ title, content, url, sectionId });
        let insertedSectionId = result.insertedId;
        let insertedSectionData = await sectionCollection.findOne({ _id: insertedSectionId });
        let createdSectionId = insertedSectionData.sectionId

        const allUserCollection = db.collection('users')
        const userCollection = await db.collection('users').find().toArray();
        for (const user of userCollection) {
            await allUserCollection.updateOne(
                { _id: user._id },
                { $set: { [`lesson_status.${createdSectionId}`]: [] } }
            )
        }
        res.status(200).json({ message: "Section added successfully", createdSectionId, update: false });
    } catch (err) {
        res.status(500).json({ message: "Section creation failed" });
    } finally {
        close("addSection");
    }
}

const updateSection = async (req, res) => {
    const { title, content, url, sectionId } = req.body;
    try {
        const db = await connect("updateSection");
        const sectionsCollection = db.collection('sections');
        let section = await sectionsCollection.findOne({ sectionId });
        if (section === null) {
            res.status(500).json({ message: "Section not found" });
        }
        else {
            await sectionsCollection.updateOne({ sectionId }, { $set: { title, content, url } });
            res.status(200).json({ message: "Section updated successfully", update: true });
        }
    } catch (err) {
        res.status(500).json({ message: "Section update failed" });
    } finally {
        close("updateSection");
    }
}

const deleteSection = async (req, res) => {
    const { sectionId } = req.body;
    try {
        const db = await connect("deleteSection");
        const sectionCollection = db.collection('sections')
        const result = sectionCollection.deleteOne({ sectionId: sectionId });

        const lessonsCollection = db.collection('lessons')
        const lessonsResult = lessonsCollection.deleteMany({ sectionId: sectionId });

        const allUserCollection = db.collection('users')
        const userCollection = await db.collection('users').find().toArray();
        for (const user of userCollection) {
            await allUserCollection.updateOne(
                { _id: user._id },
                { $unset: { [`lesson_status.${sectionId}`]: "" } }
            )
        }
        res.status(200).json({ message: "Section deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Section deletion failed" });
    } finally {
        close("deleteSection");
    }
}
// <--- Sections ---> //

// <--- Lessons ---> //
const getLessons = async (req, res) => {
    const { sectionId } = req.body;
    try {
        const db = await connect("getLessons");
        const lessonsCollection = db.collection('lessons');
        const lessons = await lessonsCollection.find({ 'sectionId': sectionId }).toArray();
        if (lessons.length === 0) {
            res.status(200).json({ message: "No lessons found" });
        } else {
            res.status(200).json({ message: "Lessons fetched successfully", lessons });
        }
    } catch (err) {
        res.status(500).json({ message: "Lessons fetch failed" });
    } finally {
        close("getLessons");
    }
}

const addLesson = async (req, res) => {
    const { chapter_title, sectionId, lessonData } = req.body;
    try {
        let data = {
            chapter_title,
            sectionId,
            lessonData,
            lessonId: uuidv4()
        }

        const db = await connect("addLesson");
        const lessonsCollection = db.collection('lessons');
        const result = await lessonsCollection.insertOne(data);
        let insertedId = result.insertedId;
        let insertedLessonData = await lessonsCollection.find({ _id: insertedId }).toArray();
        let lessonId = insertedLessonData[0].lessonId;
        let lesson_status = {
            section_id: sectionId,
            lesson_id: lessonId,
            lesson_name: lessonData.title,
            lesson_start: false,
            lesson_progress: 1,
            lesson_complete: false,
        }
        const allUserCollection = db.collection('users')
        const userCollection = await db.collection('users').find().toArray();
        for (const user of userCollection) {
            if (sectionId in user.lesson_status) {
                console.log("Lesson status key exists");
                await allUserCollection.updateOne(
                    { _id: user._id },
                    { $push: { [`lesson_status.${sectionId}`]: lesson_status } }
                );
            } else {
                console.log("Lesson status key does not exist");
                await collection.updateOne(
                    { _id: user._id },
                    { $set: { [`lesson_status.${sectionId}`]: [lesson_status] } }
                );
            }
        }
        res.status(200).json({ message: "Lesson added successfully", lessonId });
    } catch (err) {
        res.status(500).json({ message: "Lesson creation failed" });
    } finally {
        close("addLesson");
    }
}

const updateLesson = async (req, res) => {
    const { chapter_title, sectionId, lessonData, lessonId } = req.body;
    try {
        const db = await connect("updateLesson");
        const lessonsCollection = db.collection('lessons');
        let lesson = await lessonsCollection.findOne({ lessonId });
        if (lesson === null) {
            res.status(500).json({ message: "Lesson not found" });
        } else {
            await lessonsCollection.updateOne({ lessonId }, { $set: { chapter_title, sectionId, lessonData } });
            res.status(200).json({ message: "Lesson updated successfully" });
        }
    } catch (err) {
        res.status(500).json({ message: "Lesson update failed" });
    } finally {
        close("updateLesson")
    }
}

const deleteLesson = async (req, res) => {
    const { lessonId, sectionId } = req.body;
    try {
        const db = await connect("deleteLesson");
        const lessonsCollection = db.collection('lessons');
        const result = await lessonsCollection.deleteOne({ lessonId: lessonId });

        const allUserCollection = db.collection('users')
        const userCollection = await db.collection('users').find().toArray();
        for (const user of userCollection) {
            if (sectionId in user.lesson_status) {
                console.log("Lesson status key exists");
                await allUserCollection.updateOne(
                    { _id: user._id },
                    { $pull: { [`lesson_status.${sectionId}`]: { lesson_id: lessonId } } }
                )
            } else {
                console.log("Lesson status key not present")
            }
        }
        res.status(200).json({ message: "Lesson deleted successfully", result });
    } catch (err) {
        res.status(500).json({ message: "Lesson deletion failed" });
    } finally {
        close("deleteLesson");
    }
}
// <--- Lessons ---> //


// <--- Quiz ---> //
const getQuizQuestions = async (req, res) => {
    const { lessonId } = req.body;
    try {
        const db = await connect("getQuizQuestions");
        const quizCollection = db.collection('quiz');
        const quizQuestions = await quizCollection.find({ 'lessonId': lessonId }).toArray();
        if (quizQuestions.length === 0) {
            res.status(200).json({ message: "No quiz questions found", status: false });
        } else {
            res.status(200).json({ message: "Quiz questions fetched successfully", quizQuestions, status: true });
        }
    } catch (err) {
        res.status(500).json({ message: "Quiz questions fetch failed" });
    } finally {
        close("getQuizQuestions");
    }
}

const addQuizQuestions = async (req, res) => {
    const { quizData } = req.body;
    try {
        const db = await connect("addQuizQuestions");
        const quizCollection = db.collection('quiz');
        quizData.quizId = uuidv4();
        quizData.questions.map((question) => {
            question.question_id = uuidv4();
        })
        const result = await quizCollection.insertOne(quizData);
        let insertedId = result.insertedId;
        let insertedQuizData = await quizCollection.find({ _id: insertedId }).toArray();
        let quizId = insertedQuizData[0].quizId;

        const allUserCollection = db.collection('users')
        const { sectionId, lessonId } = quizData;
        const quizObject = {
            section_id: sectionId,
            lesson_id: lessonId,
            quiz_id: quizId,
            quiz_name: insertedQuizData[0].quizTitle,
            quiz_completed_date: "",
            quiz_score: "",
            quiz_completed: false,
        };

        const AUCollection = allUserCollection.find({})
        while (await AUCollection.hasNext()) {
            const user = await AUCollection.next();
            if (!user.quiz_status[sectionId]) {
                // Create a new object for the section ID if it doesn't exist
                user.quiz_status[sectionId] = {};
            }
            // Check if the lesson ID exists in the quiz_status object
            if (!user.quiz_status[sectionId][lessonId]) {
                // Create a new epmty array for the lesson ID if it doesn't exist
                user.quiz_status[sectionId][lessonId] = [];
            }
            // Add the new quiz object to the quizzes array
            user.quiz_status[sectionId][lessonId].push(quizObject);
            // Update the document in the collection
            await allUserCollection.updateOne(
                { _id: user._id },
                { $set: { quiz_status: user.quiz_status } }
            );
        }
        res.status(200).json({ message: "Quiz question added successfully", quizId });

    } catch (err) {
        res.status(500).json({ message: "Quiz question creation failed" });
    } finally {
        close("addQuizQuestions");
    }
}

const updateQuizQuestions = async (req, res) => {
    const { quizId, quizTitle, quizDescription, questions } = req.body;
    try {
        const db = await connect("updateQuizQuestions");
        const userCollection = db.collection('quiz');
        let quiz = await userCollection.findOne({ quizId });
        if (quiz === null) {
            close("updateQuizQuestions");
            res.status(500).json({ message: "Quiz question not found" });
        } else {
            await userCollection.updateOne({ quizId }, { $set: { quizTitle, quizDescription, questions } });
            close("updateQuizQuestions");
            res.status(200).json({ message: "Quiz question updated successfully" });
        }
    } catch (err) {
        res.status(500).json({ message: "Quiz question update failed" });
    }
}

const deleteQuizQuestion = async (req, res) => {
    const { sectionId, lessonId, quizId } = req.body;
    try {
        const db = await connect("deleteQuizQuestion");
        const quizCollection = db.collection('quiz');
        await quizCollection.deleteOne({ quizId: quizId });

        let resuw = []
        const allUserCollection = db.collection('users')
        const AUCollection = allUserCollection.find({})
        while (await AUCollection.hasNext()) {
            const user = await AUCollection.next();
            let resultw = await allUserCollection.updateOne(
                { _id: user._id },
                { $pull: { [`quiz_status.${sectionId}.${lessonId}`]: { quiz_id: quizId } } }
            )
            resuw.push(resultw)

        }

        res.status(200).json({ message: "Quiz question deleted successfully", resuw });
    } catch (err) {
        res.status(500).json({ message: "Quiz question deletion failed" });
    } finally {
        close("deleteQuizQuestion");
    }
}
// <--- Quiz ---> //

module.exports = {
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
}