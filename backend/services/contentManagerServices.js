const { close } = require('../services/db-conn')
const MDBServices = require('./mongoDBServices')


// Fetches from collection - getSections, getLessons, getQuizQuestions
// Returns all documents from a collection in the database
// INPUT : { collectionName, filter }
// OUTPUT : [documents]
const serviceGetDocuments = async ({ collectionName, filter }) => {
    const connectMessage = "Fetch Documents";
    try {
        let documents = await MDBServices.getAllDocumentsFromCollection({ collectionName, filter, connectMessage })
        if (documents.length === 0) {
            switch (collectionName) {
                case "sections":
                    throw new Error(`No ${collectionName} document found`)
                case "lessons":
                    documents = []
                    break;
                case "quiz":
                    documents = []
                    break;
            }
        }
        return documents
    } catch (error) {
        console.log(error)
        throw new Error(error)
    } finally {
        close(connectMessage)
    }
}

// Fetches from collection - addSection, addLesson, addQuizQuestions
// Adds new document to the database
// INPUT : { title, content, url }
const serviceAddDocuments = async ({ connectMessage, collectionName, document }) => {
    try {
        let insertedResult = await MDBServices.insertDocumentToCollection({ connectMessage, collectionName, document })
        let statusResult = null
        switch (collectionName) {
            case "sections":
                ({ sectionId } = document)
                statusResult = await MDBServices.addSectionStatusForUsers({ connectMessage: "Adding section status", sectionId })
                break;
            case "lessons":
                ({ sectionId, lessonId, lessonData } = document)
                let lesson_status = {
                    section_id: sectionId,
                    lesson_id: lessonId,
                    lesson_name: lessonData.title,
                    lesson_start: false,
                    lesson_progress: 1,
                    lesson_complete: false,
                }
                statusResult = await MDBServices.addLessonStatusForUsers({ connectMessage: "Adding lesson status", sectionId, lesson_status })
                break;
            case "quiz":
                ({ sectionId, lessonId, quizId, quizTitle } = document)
                let quizObject = {
                    section_id: sectionId,
                    lesson_id: lessonId,
                    quiz_id: quizId,
                    quiz_name: quizTitle,
                    quiz_completed_date: "",
                    quiz_score: "",
                    quiz_complete: false,
                }
                statusResult = await MDBServices.addQuizStatusForUsers({ connectMessage: "Adding quiz status", sectionId, lessonId, quizObject })
                break;
            default:
                break;
        }
        return [insertedResult, statusResult]
    } catch (error) {
        console.log(error)
        throw new Error(error)
    } finally {
        close(connectMessage)
    }
}


// updates an existing section in the database
// Input : { title, content, url, sectionId }
/* 
{
    "title": "testing",
    "content": "relatively new,  ",
    "url": "test12345",
    "sectionId":"7b436cb3-4645-4fd8-915f-5919f163fe22"
}
*/
// Output 
/* 
{
    "message": "Section updated successfully",
    "update": true
}
*/
const serviceUdpateSectionInDb = async ({ title, content, url, sectionId }) => {
    const connectMessage = "updateSection"
    try {
        await MDBServices.checkForDocumentInCollection({ collectionName: "sections", id: sectionId, connectMessage: "Check for doc" })
        const updated = await MDBServices.updateSectionData({ connectMessage, title, content, url, sectionId })
        return updated
    } catch (error) {
        console.log(error)
        throw new Error(error)
    } finally {
        close(connectMessage)
    }
}

// updates an existing lesson in the database. Have to add updates to lesson status for users
const serviceUpdateLessonInDb = async ({ chapter_title, lessonData, lessonId, sectionId }) => {
    const connectMessage = "updateLesson"
    try {
        await MDBServices.checkForDocumentInCollection({ collectionName: "lessons", id: lessonId, connectMessage: "Check for doc" })
        const updated = await MDBServices.updateLessonData({ connectMessage, chapter_title, lessonData, lessonId })
        const lessonTitleStatus = await MDBServices.updateLessonNameChangeAcrossUsersStatus({ connectMessage: "Updating lesson name in status", sectionId, lessonId, chapter_title })
        return [updated, lessonTitleStatus]
    } catch (error) {
        console.log(error)
        throw new Error(error)
    } finally {
        close(connectMessage)
    }
}

// updates an existing quiz in the database. Have to add updates to quiz status for users
const serviceUpdateQuizInDb = async ({ quizId, quizTitle, quizDescription, questions }) => {
    const connectMessage = "updateQuizQuestions"
    try {
        await MDBServices.checkForDocumentInCollection({ collectionName: "quiz", id: quizId, connectMessage })
        const [update, reqData] = await MDBServices.updateQuizData({ quizId, quizTitle, quizDescription, questions, connectMessage: "updting quiz data" })
        const { sectionId, lessonId } = reqData
        const quizTitleStatus = await MDBServices.updateQuizNameChangeAcrossUsersStatus({ connectMessage: "Updating quiz name in status", sectionId, lessonId, quizId, quizTitle })
        return [update, quizTitleStatus]
    } catch (error) {
        console.log(error)
        throw new Error(error)
    } finally {
        close(connectMessage)
    }
}


// Deletes an existing section from the database
// Input : { sectionId }
// Output
/* 
{
    "message": "Section deleted successfully"
}
*/
const serviceDeleteSectionFromDb = async ({ sectionId }) => {
    const connectMessage = "deleteSection"
    try {
        await MDBServices.checkForDocumentInCollection({ collectionName: "sections", id: sectionId, connectMessage })

        const deletedSection = await MDBServices.deleteOneDocumentFromCollection({ collectionName: "sections", id: sectionId, connectMessage: "Deleting one section" })
        const deletedLessons = await MDBServices.deleteManyDocumentsFromCollection({ type: "sectionDelete", collectionName: "lessons", id: sectionId, connectMessage: "Deleting many lessons" })
        const deletedQuiz = await MDBServices.deleteManyDocumentsFromCollection({ type: "sectionDelete", collectionName: "quiz", id: sectionId, connectMessage: "Deleting many quiz" })
        const removedLessonAndQuizStatus = await MDBServices.removeLessonAndQuizStatusFromUsers({ sectionId, connectMessage: "Removing lesson and quiz Ssatus" })
        return [deletedSection, deletedLessons, deletedQuiz, removedLessonAndQuizStatus]
    } catch (error) {
        console.log(error)
        throw new Error(error)
    } finally {
        close(connectMessage)
    }
}

const serviceDeleteLessonFromDb = async ({ lessonId, sectionId }) => {
    const connectMessage = "deleteLesson"
    try {
        await MDBServices.checkForDocumentInCollection({ collectionName: "lessons", id: lessonId, connectMessage })

        const deleteLesson = await MDBServices.deleteOneDocumentFromCollection({ collectionName: "lessons", id: lessonId, connectMessage: "Deleting one lesson" })
        const deletedQuiz = await MDBServices.deleteManyDocumentsFromCollection({ type: "lessonDelete", collectionName: "quiz", id: lessonId, connectMessage: "Deleting many quiz" })
        const deletedLessonStatusFromUser = await MDBServices.removeOneLessonAndQuizStatusFromUsers({ sectionId, lessonId, connectMessage: "Removing one lesson and quiz status" })
        return [deleteLesson, deletedQuiz, deletedLessonStatusFromUser]
    } catch (error) {
        console.log(error)
        throw new Error(error)
    } finally {
        close(connectMessage)
    }
}

const serviceDeleteQuizFromDb = async ({ quizId, sectionId, lessonId }) => {
    const connectMessage = "deleteQuizQuestion"
    try {
        await MDBServices.checkForDocumentInCollection({ collectionName: "quiz", id: quizId, connectMessage })

        const deleteQuiz = await MDBServices.deleteOneDocumentFromCollection({ collectionName: "quiz", id: quizId, connectMessage: "Deleting quiz" })
        const deleteQuizStatusFromUser = await MDBServices.removeQuizStatusFromUser({ sectionId, lessonId, quizId, connectMessage: "Removing quiz Status" })
        return [deleteQuiz, deleteQuizStatusFromUser]
    } catch (error) {
        console.log(error)
        throw new Error(error)
    } finally {
        close(connectMessage)
    }
}


module.exports = {
    serviceGetDocuments
    , serviceAddDocuments
    , serviceUdpateSectionInDb
    , serviceUpdateLessonInDb
    , serviceUpdateQuizInDb
    , serviceDeleteSectionFromDb
    , serviceDeleteLessonFromDb
    , serviceDeleteQuizFromDb
}