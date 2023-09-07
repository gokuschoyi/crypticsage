// ssh -L 27017:localhost:27017 yadu@10.0.0.116 
// to link remote mongo to local instead of ssh

const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))

const { MongoClient } = require('mongodb');
const config = require('../config');
const { createTimer } = require('../utils/timer')
const authUtil = require('../utils/authUtil')

const CRYPTICSAGE_DATABASE_NAME = 'crypticsage'
const HISTORICAL_DATABASE_NAME = 'historical_data'

const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

// Create a client to the database - global client for all services below
const client = MongoClient.connect(config.mongoUri, mongoOptions)
    .then(client => {
        log.info(`Connected to Mongo database.`)
        return client
    })
    .catch(error => {
        log.error(error.stack)
        throw error
    })


// const { connect, close, binanceConnect, binanceClose } = require('./db-conn')


// Returns a single user object in an array if it exists, otherwise returns an empty array
// INPUT : email : { email }
// OUTPUT : [user]
const getUserByEmail = async ({ email }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const userCollection = db.collection('users');
        const filterEmail = { email: email }
        const user = await userCollection.find(filterEmail).toArray();
        return user
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// Returns true if user exists, false if user does not exist
// INPUT : email : { email }
// OUTPUT : boolean
const checkUserExists = async ({ email }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
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
        log.error(error.stack)
        throw error
    }
}

// Returns the result of the insertOne operation
// INPUT : userData : { userData }
// OUTPUT : insertResult
const insertNewUser = async ({ userData }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const userCollection = db.collection('users');
        const insertResult = await userCollection.insertOne(userData);
        return insertResult
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// Generates a new lesson status object for new user
const makeUserLessonStatus = async () => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
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
        log.error(error.stack)
        throw error
    }
}

// Generates a new quiz status object for new user
const makeUserQuizStatus = async () => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
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
        log.error(error.stack)
        throw error
    }
}

//<------------------------USER SERVICES------------------------>


const updateUserPasswordByEmail = async ({ email, hashedPassword }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const userCollection = db.collection('users');
        const user = await userCollection.updateOne({ 'email': email }, { $set: { 'password': hashedPassword } });
        return user
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const updateUserProfilePicture = async ({ email, profilePicture }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const userCollection = db.collection('users');
        const user = await userCollection.updateOne({ 'email': email }, { $set: { 'profile_image': profilePicture } });
        return user
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const updateUserData = async ({ email, userData }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
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
        log.error(error.stack)
        throw error
    }
}

const updateUserPreferences = async ({ email, preferences }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
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
        log.error(error.stack)
        throw error
    }
}

const updateUserLessonStatus = async ({ email, lesson_status }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
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
        log.error(error.stack)
        throw error
    }
}

const getInitialQuizDataForUser = async ({ userQuizStatus }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const quizCollection = await db.collection('quiz').find({}).toArray();
        let transformedQuizData = await authUtil.transformQuizData(userQuizStatus, quizCollection);
        transformedQuizData = transformedQuizData.outputObject.quizzes
        return transformedQuizData
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const getQuizDataById = async ({ quizId }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const quizCollection = db.collection('quiz');
        let selectedQuiz = await quizCollection.find({ "quizId": quizId }).toArray()
        return selectedQuiz
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const updateQuizStatusForUser = async ({ email, sectionId, lessonId, quizId, score, total }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
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
        log.error(error.stack)
        throw error
    }
}


//<------------------------USER SERVICES------------------------>



//<------------------------CONTENT MANAGER SERVICES------------------------>


// fetches all the documents from a collection
// INPUT : collection name, filter
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
const getAllDocumentsFromCollection = async ({ collectionName, filter }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const collection = db.collection(collectionName)
        const documents = await collection.find(filter).toArray()
        return documents
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// Inserts a new section to the database
// INPUT : title, content, url, sectionId
// OUTPUT : result object
const insertDocumentToCollection = async ({ collectionName, document }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const sectionCollection = db.collection(collectionName);
        let result = await sectionCollection.insertOne(document);
        return result
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// When a new section is created a new key is added to all the users lesson_status object
// INPUT : sectionId
// OUTPUT : result object
const addSectionStatusForUsers = async ({ sectionId }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
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
        log.error(error.stack)
        throw error
    }
}

// Updates the lesson status for all the users
const addLessonStatusForUsers = async ({ sectionId, lesson_status }) => {
    try {
        let updateStatus = []
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const allUserCollection = db.collection('users')
        const userCollection = await db.collection('users').find().toArray();
        for (const user of userCollection) {
            if (sectionId in user.lesson_status) {
                // log.info("Lesson status key exists");
                let update = await allUserCollection.updateOne(
                    { _id: user._id },
                    { $push: { [`lesson_status.${sectionId}`]: lesson_status } }
                );
                updateStatus.push(update)
            } else {
                // log.info("Lesson status key does not exist");
                let update = await collection.updateOne(
                    { _id: user._id },
                    { $set: { [`lesson_status.${sectionId}`]: [lesson_status] } }
                );
                updateStatus.push(update)
            }
        }
        return updateStatus
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// Updates the quiz status for all the users
const addQuizStatusForUsers = async ({ sectionId, lessonId, quizObject }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        let updated
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
        log.error(error.stack)
        throw error
    }
}

// fetches a single document from a collection to check if it exists
// INPUT : collectionName, id of the document
// OUTPUT : document object
const checkForDocumentInCollection = async ({ collectionName, id }) => {
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
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const collection = db.collection(collectionName);
        const document = await collection.findOne(filter)
        if (document) {
            return document
        } else {
            throw new Error("Document not found / does not exist")
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// Updates a section in the database
// INPUT : title, content, url, sectionId
// OUTPUT : result object
const updateSectionData = async ({ title, content, url, sectionId }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const sectionsCollection = db.collection('sections');
        let sections = await sectionsCollection.updateOne({ sectionId }, { $set: { title, content, url } });
        return sections
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// Updates a lesson in the database
const updateLessonData = async ({ chapter_title, lessonData, lessonId }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const lessonsCollection = db.collection('lessons');
        let lessons = await lessonsCollection.updateOne({ lessonId }, { $set: { chapter_title, lessonData } });
        return lessons
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const updateLessonNameChangeAcrossUsersStatus = async ({ sectionId, lessonId, chapter_title }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
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
        log.error(error.stack)
        throw error
    }
}

// Updates a quiz in the database
const updateQuizData = async ({ quizId, quizTitle, quizDescription, questions }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const quizzesCollection = db.collection('quiz');
        let update = await quizzesCollection.updateOne({ quizId }, { $set: { quizTitle, quizDescription, questions } });
        let reqData = await quizzesCollection.findOne({ quizId })
        return [update, reqData]
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const updateQuizNameChangeAcrossUsersStatus = async ({ sectionId, lessonId, quizId, quizTitle }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
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
        log.error(error.stack)
        throw error
    }
}

// Delete a documetn from a collection
// INPUT : collectionName, id of the document
// OUTPUT : result object
const deleteOneDocumentFromCollection = async ({ collectionName, id }) => {
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
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const collection = db.collection(collectionName)
        const result = await collection.deleteOne(filter);
        return result
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// Delete many documents from a collection
// INPUT : type, collectionName, id of the document
// OUTPUT : result object
const deleteManyDocumentsFromCollection = async ({ type, collectionName, id }) => {
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
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const collection = db.collection(collectionName)
        const result = await collection.deleteMany(filter);
        return result
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// When a section is deleted the status of that section, including all lessons and quizz is removed from all the users
// INPUT : sectionId
// OUTPUT : result object
const removeLessonAndQuizStatusFromUsers = async ({ sectionId }) => {
    try {
        let updatedStatus = []
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
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
        log.error(error.stack)
        throw error
    }
}

const removeOneLessonAndQuizStatusFromUsers = async ({ sectionId, lessonId }) => {
    try {
        let updatedStatus = []
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
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
                log.info("Lesson status key not present")
            }
            if ("quiz_status" in user && sectionId in user.quiz_status && lessonId in user.quiz_status[sectionId]) {
                // Quiz status key exists
                let removedQuizstatus = await allUserCollection.updateOne(
                    { _id: user._id },
                    { $unset: { [`quiz_status.${sectionId}.${lessonId}`]: 1 } }
                )
                updatedStatus.push(removedQuizstatus)
            } else {
                log.info("Quiz status key not present")
            }
        }
        return updatedStatus
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const removeQuizStatusFromUser = async ({ quizId, lessonId, sectionId }) => {
    try {
        let deletedStatus = []
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
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
        log.error(error.stack)
        throw error
    }
}

const deleteOneMetaData = async ({ symbol }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const collection = db.collection("binance_ticker_meta")
        const result = await collection.deleteOne({ symbol: symbol })
        return result
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}


//<------------------------CONTENT MANAGER SERVICES------------------------>



//<------------------------HISTORICAL DATA SERVICES------------------------>

//<------------------------Y-FINANCE SERVICES------------------------>

// Deletes all the historical data of a ticker from the db based oon tickername and type : crypto / stock
const deleteTickerHistDataFromDb = async ({ ticker_name, type }) => {
    try {
        const db = (await client).db(HISTORICAL_DATABASE_NAME)
        const tickerCollections = await db.listCollections().toArray()
        let deletedStatus = []
        for (const collectionInfo of tickerCollections) {
            const collectionName = collectionInfo.name
            if (collectionName.startsWith(`${type}_${ticker_name}`)) {
                const collectionToDelete = db.collection(collectionName)
                let deleted = await collectionToDelete.drop()
                deletedStatus.push(deleted)
                log.info(`Deleted collection ${collectionName}`)
            }
        }
        return deletedStatus
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

//<------------------------Y-FINANCE SERVICES------------------------>

//<------------------------BINANCE SERVICES-------------------------->

// Generates an array of objects with latest and oldest date based on latest tokens and data available in the db:crypticsage/binance
// Input : none
// Output : array of objects with update parameters for generateUpdateQueriesForBinanceTickers()
/* 
[
    {
        "ticker_name": "BTCUSDT",
        "data": {
            "4h": {
                "historical": 12993,
                "firstHistorical": 1502942400000,
                "lastHistorical": 1690156800000,
                "oldestDate": "8/17/2017, 2:00:00 PM",
                "latestDate": "7/24/2023, 10:00:00 AM"
            }
        }
    },
    {
        "ticker_name": "XRPUSDT",
        "data": {
            "4h": {
                "historical": 11409,
                "firstHistorical": 1525420800000,
                "lastHistorical": 1689739200000,
                "oldestDate": "5/4/2018, 6:00:00 PM",
                "latestDate": "7/19/2023, 2:00:00 PM"
            },
        }
    }
] 
*/
// fetch the below required data directly from binance_metadata and process accordingly

const getFirstObjectForEachPeriod = async ({ collection_name }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const collection = db.collection(collection_name);
        const result = await collection.find({}).toArray();
        let objectsWithConvertedDate = result.map(item => {
            const ticker_name = item.ticker_name;
            const data = {};

            Object.entries(item.data).forEach(([period, periodData]) => {
                const historical = periodData.ticker_count;
                const firstHistorical = periodData.oldest_ticker_data.openTime;
                const lastHistorical = periodData.latest_ticker_data.openTime;
                const oldestDate = new Date(periodData.oldest_ticker_data.openTime).toLocaleString();
                const latestDate = new Date(periodData.latest_ticker_data.openTime).toLocaleString();

                data[period] = {
                    historical,
                    firstHistorical,
                    lastHistorical,
                    oldestDate,
                    latestDate
                };
            });

            return { ticker_name, data };
        });
        return objectsWithConvertedDate;
    } catch (error) {
        log.error(error.stack)
        throw error
    }
};

const insertHistoricalDataToDb = async ({ type, ticker_name, period, token_data }) => {
    try {
        const collection_name = `${type}_${ticker_name}_${period}`;
        const db = (await client).db(HISTORICAL_DATABASE_NAME)
        const histCollection = db.collection(collection_name)

        const batchSize = 1000;
        let noOfBatches = Math.ceil(token_data.length / batchSize)
        let inserted = []

        let batchNo = 0; // Initialize batchNo before the loop

        for (let i = 0; i < token_data.length; i += batchSize) {
            const batch = token_data.slice(i, i + batchSize);

            const t = createTimer(`insertOneMBinanceDataToDb : batch ${i}`) // Insert the batch of documents into the collection
            t.startTimer()
            let ins = await histCollection.insertMany(batch);
            let lapsedTime = t.calculateTime()

            batchNo++
            inserted.push({ batch_no: batchNo, inserted: ins.insertedCount, acknowledged: ins.acknowledged })
            log.info(`Inserted batch ${batchNo} of ${noOfBatches}, Time taken : ${lapsedTime}`)
        }
        log.info(`Data for ${ticker_name} inserted. Count: ${token_data.length}`);
        return inserted
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const fetchTickerHistDataFromDb = async ({ type, ticker_name, period, page_no, items_per_page, new_fetch_offset }) => {
    try {
        const db = (await client).db(HISTORICAL_DATABASE_NAME)
        const collection_name = `${type}_${ticker_name}_${period}`
        const collection = db.collection(collection_name)
        const sortQuery = { openTime: -1 }
        
        new_fetch_offset = new_fetch_offset === undefined ? 0 : new_fetch_offset
        // Calculate the number of documents to skip based on the page number and items per page
        const skip = ((page_no - 1) * items_per_page) + new_fetch_offset;
        const t = createTimer('Fetching data from binance_historical')
        t.startTimer()
        const tokenData = await collection.find({}).sort(sortQuery).skip(skip).limit(items_per_page).toArray();
        t.stopTimer(__filename.slice(__dirname.length + 1))
        let finalResult = []

        if (tokenData.length > 0) {
            let output = {}
            const t1 = createTimer("Adding date to token data - binance_historical")
            t1.startTimer()
            // console.time('Adding date to token data - binance_historical')
            tokenData.reverse()
            tokenData.map((data) => {
                let obj = {
                    date: new Date(data.openTime).toLocaleString(),
                    openTime: data.openTime,
                    open: data.open,
                    high: data.high,
                    low: data.low,
                    close: data.close,
                    volume: data.volume,
                }
                finalResult.push(obj)
            })
            // console.timeEnd('Adding date to token data - binance_historical')
            t1.stopTimer(__filename.slice(__dirname.length + 1))

            output['ticker_name'] = ticker_name
            output['period'] = period
            output['page_no'] = page_no
            output['items_per_page'] = items_per_page
            output['start_date'] = finalResult.slice(-1)[0].date
            output['end_date'] = finalResult[0].date
            output['total_count'] = finalResult.length
            output['ticker_data'] = finalResult

            return output
        } else {
            return ["No data found in binance_historical"]
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const updateTickerMetaData = async ({ type, ticker_name, period, meta }) => {
    try {
        const collection_name = type === 'crypto' ? 'binance_metadata' : 'yfinance_metadata';
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const collection = db.collection(collection_name)

        const query = { ticker_name };
        const existingTicker = await collection.findOne(query);

        let updated
        if (existingTicker) {
            log.info(`Ticker ${ticker_name} exist. Updating metadata`);
            let update;
            if (existingTicker.data[period]) {
                log.info(`Period ${period} exists. Updating metadata`)
                update = {
                    $set: {
                        [`data.${period}.latest_ticker_data`]: meta.latest,
                        [`data.${period}.last_updated`]: new Date().toLocaleString(),
                        [`data.${period}.ticker_count`]: existingTicker.data[period].ticker_count + meta.updatedCount
                    }
                };
                updated = await collection.updateOne(query, update);

            } else {
                log.info(`Period ${period} does not exist. Adding metadata`)
                update = {
                    $set: {
                        [`data.${period}`]: {
                            oldest_ticker_data: meta.oldest,
                            latest_ticker_data: meta.latest,
                            last_updated: new Date().toLocaleString(),
                            ticker_count: meta.updatedCount
                        }
                    }
                };
            }
            updated = await collection.updateOne(query, update);
            log.info(`Ticker meta for ${ticker_name} updated in ${collection_name}`)

        } else {
            log.info(`Ticker meta for ${ticker_name} does not exist. Adding to db`);
            const newTicker = {
                ticker_name,
                meta: meta.metaData,
                data: {
                    [period]: {
                        oldest_ticker_data: meta.oldest,
                        latest_ticker_data: meta.latest,
                        last_updated: new Date().toLocaleString(),
                        ticker_count: meta.updatedCount
                    }
                }
            };
            updated = await collection.insertOne(newTicker);
            log.info(`Ticker meta for ${ticker_name} added to ${collection_name}`)

        }
        return updated
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

//<------------------------BINANCE SERVICES------------------------>

//<------------------------HISTORICAL DATA SERVICES------------------------>



//<------------------------CRYPTO-STOCKS SERVICES-------------------------->

// Fetches the top tickers from CryptoCompare and saves it to the DB : crypticsage/binance-ticker-meta
// INPUT : cryptodata from cryptocompare
// OUTPUT : Array of status based on the operation, insert or update 
/*
"insert": 
[
{
    "lastErrorObject": {
        "n": 1,
        "updatedExisting": true
    },
    "value": {
        "_id": "64eac17691934b84684b0c95",
        "symbol": "BTC",
        "asset_launch_date": "2009-01-03",
        "current_price": 26005.12,
        "high_24h": 26081.06,
        "id": "1182",
        "image_url": "https://www.cryptocompare.com/media/37746251/btc.png",
        "last_updated": 1693106832,
        "low_24h": 25964.95,
        "market_cap_rank": 1,
        "max_supply": 20999999.9769,
        "name": "Bitcoin",
        "price_change_24h": -69.63000000000102,
        "price_change_percentage_24h": -0.2670399524444185
    },
    "ok": 1
}
*/
const saveOrUpdateTickerMeta = async ({ cryptoData }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const metaCollection = db.collection('binance_ticker_meta')

        let status = []
        for (const tickerData of cryptoData) {
            const query = { symbol: tickerData.symbol };
            const update = { $set: tickerData };
            const options = { upsert: true };

            let updated = await metaCollection.findOneAndUpdate(query, update, options);
            status.push(updated)
            log.info(`Ticker metadata updated for ${tickerData.name}`);
        }
        return status
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// Fetches the top tickers from DB based on length: crypticsage/binance-ticker-meta
// INPUT : length - number of tickers to fetch : { length: 10 } or { length: "max" }
// OUTPUT : Array of tickers
/* 
[
    {
        "id": "1182",
        "symbol": "BTC",
        "name": "Bitcoin",
        "max_supply": 20999999.9769,
        "asset_launch_date": "2009-01-03",
        "image_url": "https://www.cryptocompare.com/media/37746251/btc.png",
        "market_cap_rank": 1
    },
    {
        "id": "7605",
        "symbol": "ETH",
        "name": "Ethereum",
        "max_supply": -1,
        "asset_launch_date": "2015-07-30",
        "image_url": "https://www.cryptocompare.com/media/37746238/eth.png",
        "market_cap_rank": 2
    }
]
*/
const fetchTickerMetaFromDb = async ({ length }) => {
    try {
        if (length === undefined || length === null || length === 'max' || length === 0 || length === '') {
            length = 1000
        }
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const projectionFields = {
            _id: 0,
            market_cap_rank: 1,
            id: 1,
            symbol: 1,
            name: 1,
            image_url: 1,
            max_supply: 1,
            asset_launch_date: 1,
        };
        const ticker_meta_collection = db.collection("binance_ticker_meta")
        const tickerMeta = await ticker_meta_collection.aggregate([
            { $project: projectionFields },
            { $limit: length },
        ]).toArray()
        return tickerMeta
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const checkTickerMetaDuplicateData = async ({ ticker_name }) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const testColl = await db.listCollections().toArray()
        const collection = db.collection(`binance_ticker_meta`)
        const pipeline = [
            {
                $group: {
                    _id: "$market_cap_rank",
                    count: { $sum: 1 }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ];

        const duplicateGroups = await collection.aggregate(pipeline).toArray();
        if (duplicateGroups.length > 0) {
            log.info("Duplicate documents found!");
            log.info(`Duplicate groups:", ${duplicateGroups}`);
            return [duplicateGroups, testColl]
        } else {
            log.info("No duplicate documents based on the openTime key.");
            return []
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

//<------------------------CRYPTO-STOCKS SERVICES-------------------------->


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
    , deleteOneMetaData
    , deleteTickerHistDataFromDb
    , getFirstObjectForEachPeriod
    , saveOrUpdateTickerMeta
    , fetchTickerMetaFromDb
    , checkTickerMetaDuplicateData
    , insertHistoricalDataToDb
    , fetchTickerHistDataFromDb
    , updateTickerMetaData
}