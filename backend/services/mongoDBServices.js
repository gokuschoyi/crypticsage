const { connect, close } = require('./db-conn')
const authUtil = require('../utils/authUtil')

// Returns a single user object in an array if it exists, otherwise returns an empty array
// INPUT : email, connectMessage : { email, connectMessage }
// OUTPUT : [user]
const getUserByEmail = async ({ email, connectMessage }) => {
    try {
        const db = await connect(connectMessage);
        const userCollection = db.collection('users');
        const filterEmail = { email: email }
        const user = await userCollection.find(filterEmail).toArray();
        return user
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// Returns true if user exists, false if user does not exist
// INPUT : email, connectMessage : { email, connectMessage }
// OUTPUT : boolean
const checkUserExists = async ({ email, connectMessage }) => {
    try {
        const db = await connect(connectMessage);
        const userCollection = db.collection('users');
        const pipeline = [
            {
                $match: { email: email },
            },
            {
                $limit: 1,
            },
            {
                $project: {
                    email: 1,
                }
            }
        ]
        const user = await userCollection.aggregate(pipeline).toArray();
        if (user.length === 0) {
            return false
        } else {
            return true
        }
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// Returns the result of the insertOne operation
// INPUT : userData : { userData }
// OUTPUT : insertResult
const insertNewUser = async ({ userData }) => {
    try {
        const db = await connect("insertNewUser");
        const userCollection = db.collection('users');
        const insertResult = await userCollection.insertOne(userData);
        return insertResult
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// Generates a new lesson status object for new user
const makeUserLessonStatus = async () => {
    try {
        const db = await connect("makeUserLessonStatus");
        const lessonCollection = db.collection('lessons');
        const lessons = await lessonCollection.find({}).toArray();
        const userLessonStatus = [];
        lessons.forEach(lesson => {
            userLessonStatus.push({
                section_id: lesson.sectionId,
                lesson_id: lesson.lessonId,
                lesson_name: lesson.chapter_title,
                next_chapter_id: lesson.next_chapter_id,
                prev_chapter_id: lesson.prev_chapter_id,
                parent_section_id: lesson.parent_chapter_id,
                lesson_start: false,
                lesson_progress: 1,
                lesson_completed: false,
                lesson_completed_date: '',
            })
        });
        const groupedLessons = authUtil.sortAndGroupLessons(userLessonStatus);
        return groupedLessons;
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// Generates a new quiz status object for new user
const makeUserQuizStatus = async () => {
    try {
        const db = await connect("makeUserQuizStatus");
        const quizCollection = db.collection('quiz');
        const quizzes = await quizCollection.find({}).toArray();
        const userQuizStatus = { quiz_status: {} };
        quizzes.forEach((obj) => {
            // Extract relevant properties from the current object
            const { sectionId, lessonId, quizId, quizTitle } = obj;

            // Retrieve the section object from the output object, creating it if necessary
            const sectionObject = userQuizStatus.quiz_status?.[sectionId] ?? {};

            // Retrieve the lesson array from the section object, creating it if necessary
            const lessonArray = sectionObject[lessonId] ?? [];

            // Create a new quiz object using the extracted properties
            const quizObject = {
                section_id: sectionId,
                lesson_id: lessonId,
                quiz_id: quizId,
                quiz_name: quizTitle,
                quiz_completed_date: "",
                quiz_score: "",
                quiz_completed: false,
            };

            // Add the new quiz object to the lesson array
            lessonArray.push(quizObject);

            // Update the section object with the new lesson array
            sectionObject[lessonId] = lessonArray;

            // Update the output object with the updated section object
            userQuizStatus.quiz_status[sectionId] = sectionObject;
        });
        return userQuizStatus.quiz_status;
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

//<------------------------USER SERVICES------------------------>

const updateUserPasswordByEmail = async ({ email, hashedPassword, connectMessage }) => {
    try {
        const db = await connect(connectMessage);
        const userCollection = db.collection('users');
        const user = await userCollection.updateOne({ 'email': email }, { $set: { 'password': hashedPassword } });
        return user
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

const updateUserProfilePicture = async ({ email, profilePicture, connectMessage }) => {
    try {
        const db = await connect(connectMessage);
        const userCollection = db.collection('users');
        const user = await userCollection.updateOne({ 'email': email }, { $set: { 'profile_image': profilePicture } });
        return user
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

const updateUserData = async ({ email, userData, connectMessage }) => {
    try {
        const db = await connect(connectMessage);
        const userCollection = db.collection('users');
        const user = await userCollection.updateOne(
            { 'email': email },
            {
                $set:
                {
                    'displayName': userData.displayName,
                    'mobile_number': userData.mobile_number
                }
            });
        return user
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

const updateUserPreferences = async ({ email, preferences, connectMessage }) => {
    try {
        const db = await connect(connectMessage);
        const userCollection = db.collection('users');
        const user = await userCollection.updateOne(
            { 'email': email },
            {
                $set:
                {
                    'preferences.dashboardHover': preferences.dashboardHover,
                    'preferences.collapsedSidebar': preferences.collapsedSidebar
                }
            }
        );
        return user
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

const updateUserLessonStatus = async ({ email, lesson_status, connectMessage }) => {
    try {
        const db = await connect(connectMessage);
        const userCollection = db.collection('users');
        const user = await userCollection.updateOne(
            { "email": email },
            {
                $set: {
                    [`lesson_status.${lesson_status.section_id}.$[inner].lesson_start`]: lesson_status.lesson_start,
                    [`lesson_status.${lesson_status.section_id}.$[inner].lesson_progress`]: lesson_status.lesson_progress,
                    [`lesson_status.${lesson_status.section_id}.$[inner].lesson_completed`]: lesson_status.lesson_completed,
                    [`lesson_status.${lesson_status.section_id}.$[inner].lesson_completed_date`]: new Date().toLocaleString(),
                }
            },
            {
                arrayFilters: [
                    { "inner.section_id": lesson_status.section_id, "inner.lesson_id": lesson_status.lesson_id }
                ]
            },
        );
        let userLessonStatus
        if (user.acknowledged) {
            userLessonStatus = await userCollection.find({ "email": email }).toArray();
            userLessonStatus = userLessonStatus[0].lesson_status;
            let message = "User lesson status updated successfully"
            uStatus = true
            return [message, uStatus, userLessonStatus]
        } else {
            throw new Error("User lesson status update failed")
        }
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

const getInitialQuizDataForUser = async ({ userQuizStatus, connectMessage }) => {
    try {
        const db = await connect(connectMessage);
        const quizCollection = await db.collection('quiz').find({}).toArray();
        let transformedQuizData = await authUtil.transformQuizData(userQuizStatus, quizCollection);
        transformedQuizData = transformedQuizData.outputObject.quizzes
        return transformedQuizData
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

const getQuizDataById = async ({ connectMessage, quizId }) => {
    try {
        const db = await connect(connectMessage);
        const quizCollection = db.collection('quiz');
        let selectedQuiz = await quizCollection.find({ "quizId": quizId }).toArray()
        return selectedQuiz
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

const updateQuizStatusForUser = async ({ email, sectionId, lessonId, quizId, score, total, connectMessage }) => {
    try {
        const db = await connect(connectMessage);
        const userCollection = db.collection('users');
        const user = await userCollection.updateOne(
            { email: email },
            {
                $set: {
                    [`quiz_status.${sectionId}.${lessonId}.$[inner].quiz_completed_date`]: new Date().toLocaleString(),
                    [`quiz_status.${sectionId}.${lessonId}.$[inner].quiz_score`]: score,
                    [`quiz_status.${sectionId}.${lessonId}.$[inner].quiz_completed`]: true,
                    [`quiz_status.${sectionId}.${lessonId}.$[inner].quiz_total`]: total,
                }
            },
            {
                arrayFilters: [
                    { "inner.section_id": sectionId, "inner.lesson_id": lessonId, "inner.quiz_id": quizId }
                ]
            }
        )
        return user
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

//<------------------------USER SERVICES------------------------>


//<------------------------CONTENT MANAGER SERVICES------------------------>

// fetches all the documents from a collection
// INPUT : collection name, filter, connectMessage
// OUTPUT : array of objects
/* 
{
    "sections": [
        {
            "_id": "6412d6826ad7375e1c777ada",
            "title": "Introduction to the market",
            "content": "The crypto market is relatively new, highly volatile, and has seen tremendous growth in recent years. It is a decentralized digital assets market where investors can buy and sell different type of cryptocurrencies, such as Bitcoin. The stock market, on the other hand, is an established market that has been in existence for centuries where publicly traded companies issue and sell shares of stock that represent ownership in the company. The value of the stock is influenced by factors such as earnings, market trends and global events. Both markets are subject to speculation and can be volatile, but they operate differently and have different underlying assets. Stocks are considered to be more stable than cryptocurrencies, but also tend to have lower potential returns.",
            "url": "",
            "sectionId": "5119f37b-ef44-4272-a536-04af51ef4bbc"
        },
        {
            "_id": "6413b75e116bb8075de38fc0",
            "title": "Fundamental Analysis",
            "content": "Fundamental analysis is a method of evaluating securities by analyzing underlying factors that affect the security's value. In the stock market, it focus on a company's financial health, management, and industry conditions by analyzing financial statements, assessing the management team and their track record and evaluating the overall health of the industry in which the company operates. In the crypto market, it's use is limited as many cryptocurrencies do not have traditional financials, assets or revenue streams. Instead it focuses on the technology behind the coin, the purpose or utility of the coin and the coin's adoption rate. While fundamental analysis can be a valuable tool in both markets, the approach and focus can be different and in the case of crypto market it's more important due to high failure rates.",
            "url": "https://picsum.photos/200/300",
            "sectionId": "f82ec216-5daa-4be3-ae54-a456c85ffbf2"
        }
    ]
}
*/
const getAllDocumentsFromCollection = async ({ collectionName, filter, connectMessage }) => {
    try {
        const db = await connect(connectMessage);
        const collection = db.collection(collectionName)
        const documents = await collection.find(filter).toArray()
        return documents
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// Inserts a new section to the database
// INPUT : title, content, url, sectionId, connectMessage
// OUTPUT : result object
const insertDocumentToCollection = async ({ connectMessage, collectionName, document }) => {
    try {
        const db = await connect(connectMessage);
        const sectionCollection = db.collection(collectionName);
        let result = await sectionCollection.insertOne(document);
        return result
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// When a new section is created a new key is added to all the users lesson_status object
// INPUT : connectMessage, sectionId
// OUTPUT : result object
const addSectionStatusForUsers = async ({ connectMessage, sectionId }) => {
    try {
        const db = await connect(connectMessage);
        const allUserCollection = db.collection('users')
        const userCollection = await db.collection('users').find().toArray();
        let updateStatus = []
        for (const user of userCollection) {
            const updated = await allUserCollection.updateOne(
                { _id: user._id },
                { $set: { [`lesson_status.${sectionId}`]: [] } }
            )
            updateStatus.push(updated)
        }
        return updateStatus
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// Updates the lesson status for all the users
const addLessonStatusForUsers = async ({ connectMessage, sectionId, lesson_status }) => {
    try {
        let updateStatus = []
        const db = await connect(connectMessage);
        const allUserCollection = db.collection('users')
        const userCollection = await db.collection('users').find().toArray();
        for (const user of userCollection) {
            if (sectionId in user.lesson_status) {
                // console.log("Lesson status key exists");
                let update = await allUserCollection.updateOne(
                    { _id: user._id },
                    { $push: { [`lesson_status.${sectionId}`]: lesson_status } }
                );
                updateStatus.push(update)
            } else {
                // console.log("Lesson status key does not exist");
                let update = await collection.updateOne(
                    { _id: user._id },
                    { $set: { [`lesson_status.${sectionId}`]: [lesson_status] } }
                );
                updateStatus.push(update)
            }
        }
        return updateStatus
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// Updates the quiz status for all the users
const addQuizStatusForUsers = async ({ connectMessage, sectionId, lessonId, quizObject }) => {
    try {
        let updated
        const db = await connect(connectMessage);
        const allUserCollection = db.collection('users')
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
            updated = await allUserCollection.updateOne(
                { _id: user._id },
                { $set: { quiz_status: user.quiz_status } }
            );
        }
        return updated
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// fetches a single document from a collection to check if it exists
// INPUT : collectionName, id of the document, connectMessage
// OUTPUT : document object
const checkForDocumentInCollection = async ({ collectionName, id, connectMessage }) => {
    try {
        let key = ''
        switch (collectionName) {
            case 'sections':
                key = 'sectionId'
                break;
            case 'lessons':
                key = 'lessonId'
                break;
            case 'quiz':
                key = 'quizId'
                break;
            default:
                throw new Error("Invalid collection name")
        }
        filter = { [key]: id }
        const db = await connect(connectMessage);
        const collection = db.collection(collectionName);
        const document = await collection.findOne(filter)
        if (document) {
            return document
        } else {
            throw new Error("Document not found / does not exist")
        }
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// Updates a section in the database
// INPUT : title, content, url, sectionId, connectMessage
// OUTPUT : result object
const updateSectionData = async ({ connectMessage, title, content, url, sectionId }) => {
    try {
        const db = await connect(connectMessage);
        const sectionsCollection = db.collection('sections');
        let sections = await sectionsCollection.updateOne({ sectionId }, { $set: { title, content, url } });
        return sections
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// Updates a lesson in the database
const updateLessonData = async ({ connectMessage, chapter_title, lessonData, lessonId }) => {
    try {
        const db = await connect(connectMessage);
        const lessonsCollection = db.collection('lessons');
        let lessons = await lessonsCollection.updateOne({ lessonId }, { $set: { chapter_title, lessonData } });
        return lessons
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

const updateLessonNameChangeAcrossUsersStatus = async ({ connectMessage, sectionId, lessonId, chapter_title }) => {
    try {
        const db = await connect(connectMessage);
        const filter = {
            [`lesson_status.${sectionId}`]: {
                $elemMatch: {
                    lesson_id: lessonId
                }
            }
        };

        const update = {
            $set: {
                [`lesson_status.${sectionId}.$[elem].lesson_name`]: chapter_title
            }
        };

        const options = {
            arrayFilters: [{ "elem.lesson_id": lessonId }]
        };

        const allUserCollection = db.collection('users')
        const updated = await allUserCollection.updateMany(filter, update, options);
        return updated
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// Updates a quiz in the database
const updateQuizData = async ({ connectMessage, quizId, quizTitle, quizDescription, questions }) => {
    try {
        const db = await connect(connectMessage);
        const quizzesCollection = db.collection('quiz');
        let update = await quizzesCollection.updateOne({ quizId }, { $set: { quizTitle, quizDescription, questions } });
        let reqData = await quizzesCollection.findOne({ quizId })
        return [update, reqData]
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

const updateQuizNameChangeAcrossUsersStatus = async ({ connectMessage, sectionId, lessonId, quizId, quizTitle }) => {
    try {
        const db = await connect(connectMessage);
        const filter = {
            [`quiz_status.${sectionId}.${lessonId}`]: {
                $elemMatch: {
                    quiz_id: quizId
                }
            }
        };

        const update = {
            $set: {
                [`quiz_status.${sectionId}.${lessonId}.$[elem].quiz_name`]: quizTitle
            }
        };

        const options = {
            arrayFilters: [{ "elem.quiz_id": quizId }]
        };

        const allUserCollection = db.collection('users')
        const updated = await allUserCollection.updateMany(filter, update, options);
        return updated
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// Delete a documetn from a collection
// INPUT : collectionName, id of the document, connectMessage
// OUTPUT : result object
const deleteOneDocumentFromCollection = async ({ collectionName, id, connectMessage }) => {
    try {
        let key = ''
        switch (collectionName) {
            case 'sections':
                key = 'sectionId'
                break;
            case 'lessons':
                key = 'lessonId'
                break;
            case 'quiz':
                key = 'quizId'
                break;
            default:
                throw new Error("Invalid collection name")
        }
        filter = { [key]: id }
        const db = await connect(connectMessage);
        const collection = db.collection(collectionName)
        const result = await collection.deleteOne(filter);
        return result
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// Delete many documents from a collection
// INPUT : type, collectionName, id of the document, connectMessage
// OUTPUT : result object
const deleteManyDocumentsFromCollection = async ({ type, collectionName, id, connectMessage }) => {
    try {
        let key = ''
        switch (type) {
            case 'sectionDelete':
                key = 'sectionId'
                break;
            case 'lessonDelete':
                key = 'lessonId'
                break;
            default:
                throw new Error("Invalid collection name")
        }
        filter = { [key]: id }
        const db = await connect(connectMessage);
        const collection = db.collection(collectionName)
        const result = await collection.deleteMany(filter);
        return result
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// When a section is deleted the status of that section, including all lessons and quizz is removed from all the users
// INPUT : connectMessage, sectionId
// OUTPUT : result object
const removeLessonAndQuizStatusFromUsers = async ({ sectionId, connectMessage }) => {
    try {
        let updatedStatus = []
        const db = await connect(connectMessage);
        const allUserCollection = db.collection('users')
        const userCollection = await db.collection('users').find().toArray();
        for (const user of userCollection) {
            let updated = await allUserCollection.updateOne(
                { _id: user._id },
                {
                    $unset: {
                        [`lesson_status.${sectionId}`]: 1,
                        [`quiz_status.${sectionId}`]: 1
                    }
                }
            )
            updatedStatus.push(updated)
        }
        return updatedStatus
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

const removeOneLessonAndQuizStatusFromUsers = async ({ connectMessage, sectionId, lessonId }) => {
    try {
        let updatedStatus = []
        const db = await connect(connectMessage);
        const allUserCollection = db.collection('users')
        const userCollection = await db.collection('users').find().toArray();
        for (const user of userCollection) {
            if (sectionId in user.lesson_status) {
                // Lesson status key exists
                let removedLessonStatus = await allUserCollection.updateOne(
                    { _id: user._id },
                    { $pull: { [`lesson_status.${sectionId}`]: { lesson_id: lessonId } } }
                )
                updatedStatus.push(removedLessonStatus)
            } else {
                console.log("Lesson status key not present")
            }
            if ("quiz_status" in user && sectionId in user.quiz_status && lessonId in user.quiz_status[sectionId]) {
                // Quiz status key exists
                let removedQuizstatus = await allUserCollection.updateOne(
                    { _id: user._id },
                    { $unset: { [`quiz_status.${sectionId}.${lessonId}`]: 1 } }
                )
                updatedStatus.push(removedQuizstatus)
            } else {
                console.log("Quiz status key not present")
            }
        }
        return updatedStatus
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

const removeQuizStatusFromUser = async ({ connectMessage, quizId, lessonId, sectionId }) => {
    try {
        let deletedStatus = []
        const db = await connect(connectMessage);
        const allUserCollection = db.collection('users')
        const AUCollection = allUserCollection.find({})
        while (await AUCollection.hasNext()) {
            const user = await AUCollection.next();
            let deleted = await allUserCollection.updateOne(
                { _id: user._id },
                { $pull: { [`quiz_status.${sectionId}.${lessonId}`]: { quiz_id: quizId } } }
            )
            deletedStatus.push(deleted)
        }
        return deletedStatus
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}


//<------------------------CONTENT MANAGER SERVICES------------------------>

module.exports = {
    getUserByEmail
    , checkUserExists
    , insertNewUser
    , makeUserLessonStatus
    , makeUserQuizStatus
    , updateUserPasswordByEmail
    , updateUserProfilePicture
    , updateUserData
    , updateUserPreferences
    , updateUserLessonStatus
    , getInitialQuizDataForUser
    , getQuizDataById
    , updateQuizStatusForUser
    , getAllDocumentsFromCollection
    , checkForDocumentInCollection
    , insertDocumentToCollection
    , deleteOneDocumentFromCollection
    , deleteManyDocumentsFromCollection
    , addSectionStatusForUsers
    , addLessonStatusForUsers
    , addQuizStatusForUsers
    , updateSectionData
    , updateLessonData
    , updateLessonNameChangeAcrossUsersStatus
    , updateQuizData
    , updateQuizNameChangeAcrossUsersStatus
    , removeLessonAndQuizStatusFromUsers
    , removeOneLessonAndQuizStatusFromUsers
    , removeQuizStatusFromUser
}