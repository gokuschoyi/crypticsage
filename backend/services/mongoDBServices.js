// ssh -L 27017:localhost:27017 yadu@10.0.0.116 
// to link remote mongo to local instead of ssh

const types = require('../typedefs')

const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))

const { MongoClient } = require('mongodb');
const config = require('../config');
const { createTimer } = require('../utils/timer')
const authUtil = require('../utils/authUtil')
const IUtil = require('../utils/indicatorUtil')
const CacheUtil = require('../utils/cacheUtil')

const CRYPTICSAGE_DATABASE_NAME = 'crypticsage'
const HISTORICAL_DATABASE_NAME = 'historical_data'

const fs = require('fs')

// Create a client to the database - global client for all services below
const mongoUri = config.mongoUri ?? '';
const client = MongoClient.connect(mongoUri)
    .then(client => {
        log.crit(`Connected to Mongo database : 27017`)
        return client
    })
    .catch(error => {
        log.error(error.stack)
        throw error
    })



/**
 * Retrieves a user by email.
 * @async
 * @param {string} email Email of the user to be searched 
 * @returns {Promise<Array<object>>} An array containing the user object(s) matching the provided email else [].
 * @example 
 * // Retrieve user by email
 * const userEmail = "gokulsangamitrachoyi@gmail.com";
 * const user = getUserByEmail(userEmail);
 * console.log(user); // Output: Array containing the user object(s)
 * user = [
 *   {
 *     "_id": "64c9b4dbfaafffb6de7f9be6",
 *     "displayName": "gokul",
 *     "email": "gokulchoyi@gmail.com",
 *     "password": "$2b$10$ghX7mYS2CArpjH7kmEz92.uHOOx4No3FY.clPJljanV7CfY66LAjS",
 *     "mobile_number": "",
 *     "profile_image": "",
 *     "emailVerified": true,
 *     "date": "8/2/2023, 11:43:55 AM",
 *     "uid": "45eca875-f8ad-4585-a307-eaa9e6ddbdb6",
 *     "preferences": {
 *       "theme": true,
 *       "dashboardHover": false,
 *       "collapsedSidebar": true
 *     },
 *     "signup_type": "google",
 *     "lesson_status": {
 *       "2ab70e1b-3676-4b79-bfb5-57fd448ec98e": [
 *         {
 *           "section_id": "2ab70e1b-3676-4b79-bfb5-57fd448ec98e",
 *           "lesson_id": "8ed93f99-3c37-428c-af92-c322c79b4384",
 *           "lesson_name": "qwe",
 *           "next_chapter_id": null,
 *           "prev_chapter_id": null,
 *           "parent_section_id": null,
 *           "lesson_start": false,
 *           "lesson_progress": 1,
 *           "lesson_completed": false,
 *           "lesson_completed_date": ""
 *         }
 *       ],
 *       "5119f37b-ef44-4272-a536-04af51ef4bbc": [
 *         {}
 *       ]
 *     },
 *     "quiz_status": {
 *       "5119f37b-ef44-4272-a536-04af51ef4bbc": {
 *         "a4d32182-98ba-4968-90c3-aa0c27751d55": [
 *           {
 *             "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
 *             "lesson_id": "a4d32182-98ba-4968-90c3-aa0c27751d55",
 *             "quiz_id": "2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1",
 *             "quiz_name": "Candle Stick Quiz 1",
 *             "quiz_completed_date": "9/17/2023, 1:31:56 PM",
 *             "quiz_score": 1,
 *             "quiz_completed": true,
 *             "quiz_total": 3
 *           }
 *         ],
 *         "4aa08919-369c-4ab4-93db-bf6e41b5b4fc": [
 *           {}
 *         ]
 *       }
 *     }
 *   }
 * ];
 *
 */
const getUserByEmail = async (email) => {
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

/**
 * Checking if user exists by email.
 * @async
 * @param {string} email Email of the user to be checked
 * @returns {Promise<boolean>} True if user exists, false if user does not exist
 * @example
 * // Check if user exists
 * const userEmail = "gokulschoyi@gmail.com";
 * const userExists = checkUserExists(userEmail);
 * console.log(userExists); // Output: true
 */
const checkUserExists = async (email) => {
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

/**
 * Inserts a new user into the database.
 * @async
 * @param {types.User} userData - The user data to be inserted.
 * @returns {Promise<object>} insertedResult A promise that resolves with the result of the insertion.
 * @throws {Error} If an error occurs during the insertion process.
 *
 * @example
 * const userData = {
 *   displayName: 'John Doe',
 *   email: 'johndoe@example.com',
 *   password: 'hashedPassword',
 *   mobile_number: '',
 *   profile_image: 'https://example.com/profile.jpg',
 *   emailVerified: false,
 *   date: new Date().toLocaleString('au'),
 *   uid: 'uniqueId123',
 *   preferences: {
 *     theme: true,
 *     dashboardHover: true,
 *     collapsedSidebar: true,
 *   },
 *   signup_type: 'facebook',
 *   lesson_status: {},
 *   quiz_status: {},
 * };
 *
 *   const result = await insertNewUser(userData);
 *   result = {
 *        acknowledged: true,
 *        insertedId: new ObjectId("650797a1bfe90c585fd21a7d")
 *     }
 */
const insertNewUser = async (userData) => {
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

/**
 * async function to generate a new lesson status object for new user
 * @async
 * @returns {Promise<object>} An object containing lesson data.
 *
 * @example
 * // Sample output:
 * const lessonData = getLessonData();
 * // Output:
 * {
 *     "2ab70e1b-3676-4b79-bfb5-57fd448ec98e": [
 *         {
 *             "section_id": "2ab70e1b-3676-4b79-bfb5-57fd448ec98e",
 *             "lesson_id": "8ed93f99-3c37-428c-af92-c322c79b4384",
 *             "lesson_name": "qwe",
 *             "lesson_start": false,
 *             "lesson_progress": 1,
 *             "lesson_completed": false,
 *             "lesson_completed_date": ""
 *         }
 *     ],
 *     // ... Other lesson data ...
 * }
 */
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

/**
 * async function to generate a new quiz status object for new user
 * @async
 * @returns {Promise<object>} An object containing quiz data.
 * 
 * @example
 * // Sample output:
 * const quizData = getQuizData();
 * // Output:
 * {
 * {
 *  "5119f37b-ef44-4272-a536-04af51ef4bbc": {
 *    "a4d32182-98ba-4968-90c3-aa0c27751d55": [
 *     {
 *         "section_id": "5119f37b-ef44-4272-a536-04af51ef4bbc",
 *         "lesson_id": "a4d32182-98ba-4968-90c3-aa0c27751d55",
 *         "quiz_id": "2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1",
 *         "quiz_name": "Candle Stick Quiz 1",
 *         "quiz_completed_date": "",
 *         "quiz_score": "",
 *         "quiz_completed": false
 *     },
 *     {}
 *   ]
 * },
 * // ... Other quiz data ...
 */
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

/**
 * Updates the password of a user by email.
 * @async
 * @param {string} email The email of the user whose password is to be updated.
 * @param {string} hashedPassword  The hashed password of the user.
 * @returns {Promise<object>} An object containing the result of the update operation.
 * @example
 * const email = "testuser@gmail.com";
 * const hashedPassword = "$2b$10$ghX7mYS2CArpjH7kmEz92";
 * const result = updateUserPasswordByEmail(email, hashedPassword);
 * console.log(result); 
 * // Output: { 
 *      acknowledged: true, 
 *      modifiedCount: 1, 
 *      upsertedId: null, 
 *      upsertedCount: 0, 
 *      matchedCount: 1 
 * }
 */
const updateUserPasswordByEmail = async (email, hashedPassword) => {
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

/**
 * Updates the profile picture of a user by email.
 * @async
 * @param {string} email The email of the user whose profile picture is to be updated.
 * @param {string} profilePicture A base64 encoded string of the user's profile picture.
 * @returns {Promise<object>} An object containing the result of the update operation.
 * @example
 * const email = "testuser@gmail.com";
 * const profilePicture = "data:image/jpeg;base64,";
 * const result = updateUserProfilePicture(email, profilePicture);
 * console.log(result); 
 * // Output: 
 * { 
 *      acknowledged: true,
 *      modifiedCount: 1,
 *      upsertedId: null, 
 *      upsertedCount: 0, 
 *      matchedCount: 1 
 * }
 */
const updateUserProfilePicture = async (email, profilePicture) => {
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

/**
 * @typedef {Object} UserData
 * @property {string} displayName - The user's display name.
 * @property {string} mobile_number - The user's mobile number.
 */

/**
 * Updates the display name and mobile number of a user by email.
 * @async 
 * @param {string} email - The email of the user whose email verification status is to be updated.
 * @param {UserData} userData - The user data to be updated.
 * @returns {Promise<object>} A promise that resolves when the update is complete.
 *
 * @example
 * const email = 'example@example.com';
 * const userData = {
 *   displayName: 'John Doe',
 *   mobile_number: '+1234567890',
 * };
 * const update = await updateUserProfile(email, updatedUserData);
 * console.log(update) 
 * // Output: 
 * { 
 *      acknowledged: true, 
 *      modifiedCount: 1,   
 *      upsertedId: null,   
 *      upsertedCount: 0,   
 *      matchedCount: 1
 *  }
 */
const updateUserData = async (email, userData) => {
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

/**
 * @typedef {Object} Preferences
 * @property {boolean} dashboardHover - The dashboard hover status.
 * @property {boolean} collapsedSidebar - The collapsed sidebar status.
 * @property {boolean} theme - The theme status.
 */

/**
 * Updates the preferences of a user by email.
 * @async
 * @param {string} email - The email of the user whose preferences are to be updated.
 * @param {Preferences} preferences - The preferences to be updated.
 * @returns {Promise<object>} A promise that resolves when the update is complete.
 * 
 * @example
 * const email = 'example@example.com';
 * const preferences = {
 *  dashboardHover: true,
 *  collapsedSidebar: true,
 * };
 * const update = await updateUserPreferences(email, preferences);
 * console.log(update)
 * // Output:
 * {
 *      acknowledged: true,
 *      modifiedCount: 1,
 *      upsertedId: null,
 *      upsertedCount: 0,
 *      matchedCount: 1
 * }
 */
const updateUserPreferences = async (email, preferences) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const userCollection = db.collection('users');
        const user = await userCollection.updateOne(
            { 'email': email },
            {
                $set:
                {
                    'preferences.dashboardHover': preferences.dashboardHover,
                    'preferences.collapsedSidebar': preferences.collapsedSidebar,
                    'preferences.theme': preferences.theme,
                }
            }
        );
        return user
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/**
 * Update the lesson status of a user by email.
 * @async
 * @param {string} email 
 * @param {types.LessonStatus} lesson_status 
 * @returns {Promise<Array>} An array containing the message, status flag and result of the update operation.
 * @example
 * const email = 'example@example.com';
 * const lesson_status = {
 *    section_id: '5119f37b-ef44-4272-a536-04af51ef4bbc',
 *    lesson_id: 'a4d32182-98ba-4968-90c3-aa0c27751d55',
 *    lesson_name: 'Candle Stick Quiz 1',
 *    next_chapter_id: null,
 *    prev_chapter_id: null,
 *    parent_section_id: null,
 *    lesson_start: true,
 *    lesson_progress: 1,
 *    lesson_completed: true,
 *    lesson_completed_date: ''
 * };
 * const update = await updateUserLessonStatus(email, lesson_status);
 * console.log(update) 
 * // Output: 
 * // message : User lesson status updated successfully
 * // uStatus : true
 * // userLessonStatus : {
 * //     '2ab70e1b-3676-4b79-bfb5-57fd448ec98e': [
 * //          {
 * //            section_id: '2ab70e1b-3676-4b79-bfb5-57fd448ec98e',
 * //            lesson_id: '8ed93f99-3c37-428c-af92-c322c79b4384',
 * //            lesson_name: 'qwe',
 * //            next_chapter_id: null,
 * //            prev_chapter_id: null,
 * //            parent_section_id: null,
 * //            lesson_start: false,
 * //            lesson_progress: 1,
 * //            lesson_completed: false,
 * //            lesson_completed_date: ''
 * //          }, {}
 * //     ], ...
 * //    }    
 */
const updateUserLessonStatus = async (email, lesson_status) => {
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
            let uStatus = true
            return [message, uStatus, userLessonStatus]
        } else {
            throw new Error("User lesson status update failed")
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/**
 * Get the latest quiz status object for a user.
 * @async
 * @param {object} userQuizStatus The latest user quiz status object from the user object.
 * @returns {Promise<Array>} An array containing the quizzes' status for various sections and lessons.
 */
const getInitialQuizDataForUser = async (userQuizStatus) => {
    try {
        let quizzes_array = []
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)

        const quizCollectionFromDB = await db.collection('quiz').find({}).toArray();

        const quizCollection = quizCollectionFromDB.map((quiz) => {
            return {
                sectionId: quiz.sectionId,
                sectionName: quiz.sectionName,
                lessonId: quiz.lessonId,
                lessonName: quiz.lessonName,
                quizId: quiz.quizId,
                quizTitle: quiz.quizTitle,
                quizDescription: quiz.quizDescription,
                questions: quiz.questions,
            }
        })
        let transformedQuizData = await authUtil.transformQuizData(userQuizStatus, quizCollection);
        quizzes_array = transformedQuizData.outputObject.quizzes
        return quizzes_array
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/**
 * Fetches the quiz data for a particular quiz id.
 * @async
 * @param {string} quizId The quiz id of the quiz to be fetched
 * @returns {Promise<Array>} An array containing the individual quiz data
 */
const getQuizDataById = async (quizId) => {
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

/**
 * Updates the quiz status for a user after a quiz is completed.
 * @async
 * @param {string} email The email of the user whose quiz status is to be updated.
 * @param {string} sectionId The section id of the quiz to be updated.
 * @param {string} lessonId The lesson id of the quiz to be updated. 
 * @param {string} quizId The quiz id of the quiz to be updated. 
 * @param {number} score The score of the quiz to be updated. 
 * @param {number} total The total score of the quiz to be updated. 
 * @returns {Promise<object>} An object containing the result of the update operation.
 * @example
 * const email = 'testuser@gmail.com';
 * const sectionId = '5119f37b-ef44-4272-a536-04af51ef4bbc';
 * const lessonId = 'a4d32182-98ba-4968-90c3-aa0c27751d55';
 * const quizId = '2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1';
 * const score = 1;
 * const total = 3;
 * const result = await updateQuizStatusForUser(email, sectionId, lessonId, quizId, score, total);
 * console.log(result) 
 * // Output:
 * {
 *      acknowledged: true,
 *      modifiedCount: 0,
 *      upsertedId: null,
 *      upsertedCount: 0,
 *      matchedCount: 0
 * } 
 */
const updateQuizStatusForUser = async (email, sectionId, lessonId, quizId, score, total) => {
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
        console.log(user)
        return user
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}


//<------------------------USER SERVICES------------------------>



//<------------------------CONTENT MANAGER SERVICES------------------------>

/**
 * Feteches documents from a collection based on the filter parameter
 * @async
 * @param {string} collectionName The name of the collection to fetch documents from
 * @param {Object} filter The filter to apply to the collection
 * @returns {Promise<array>} An array of documents
 * @example
 * const collectionName = 'sections';
 * const filter = {};
 * const sections = await getAllDocumentsFromCollection(collectionName, filter);
 * console.log(sections);
 * // Output:
 * [
 *  {
 *   "_id": "6412d6826ad7375e1c777ada",
 *   "title": "Introduction to the market",
 *      "content": "The crypto market is relatively new, highly volatile, ...",
 *   "url": "",
 *   "sectionId": "5119f37b-ef44-4272-a536-04af51ef4bbc"
 * }, {}, ...
 * ]
 */
const getAllDocumentsFromCollection = async (collectionName, filter) => {
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


/**
 * Fetechs the ids of all the sections in order
 * @returns {Promise<array>} An array of section ids
 */
const getSectionIDs = async () => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const sectionCollection = db.collection('sections')
        const keysToIncude = { _id: 0, sectionId: 1, title: 1 }

        const sectionIds = await sectionCollection.aggregate([
            {
                $project: keysToIncude
            }
        ]).toArray()

        return sectionIds
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/**
 * Inserts a new document to a collection
 * @async
 * @param {string} collectionName The name of the collection to insert the document into
 * @param {Object} document The document to be inserted
 * @returns {Promise<object>} An object containing the result of the insertion
 * @example
 * const collectionName = 'sections';
 * const document = {
 *      title: 'Introduction to the market',
 *      content: 'The crypto market is relatively new, highly volatile, ...',
 *      url: '',
 * };
 * const result = await insertDocumentToCollection(collectionName, document);
 * console.log(result);
 * // Output:
 * {
 *      acknowledged: true,
 *      insertedId: new ObjectId("6507b68dddb95bf8d5e0b71e")
 * }
 */
const insertDocumentToCollection = async (collectionName, document) => {
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

/**
 * When a new section is created a new key is added to all the users lesson_status object
 * @async
 * @param {string} sectionId  The section id of the section to be added
 * @returns {Promise<array>} An array containing the result of the update operation
 * @example
 * const sectionId = '5119f37b-ef44-4272-a536-04af51ef4bbc';
 * const result = await addSectionStatusForUsers(sectionId);
 * console.log(result);
 * // Output:
 * [
 * {
 *      acknowledged: true,
 *      modifiedCount: 1,
 *      upsertedId: null,
 *      upsertedCount: 0,
 *      matchedCount: 1
 * }, {}, ...
 * ]
 */
const addSectionStatusForUsers = async (sectionId) => {
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

/**
 * @typedef {Object} LessonObjectToDb
 * @property {string} section_id - The section id.
 * @property {string} lesson_id - The lesson id.
 * @property {string} lesson_name - The lesson name.
 * @property {boolean} lesson_start - The lesson start status.
 * @property {number} lesson_progress - The lesson progress.
 * @property {boolean} lesson_complete - The lesson completion status.
 */

/**
 * Updates the lesson status for all the users after adding a new lesson
 * @async
 * @param {string} sectionId 
 * @param {LessonObjectToDb} lesson_status 
 * @returns {Promise<array>} An array containing the result of the update operation
 * @example
 * const sectionId = '5119f37b-ef44-4272-a536-04af51ef4bbc';
 * const lesson_status = {
 *      section_id: '5119f37b-ef44-4272-a536-04af51ef4bbc',
 *      lesson_id: 'a4d32182-98ba-4968-90c3-aa0c27751d55',
 *      lesson_name: 'Candle Stick Quiz 1',
 *      lesson_start: true,
 *      lesson_progress: 1,
 *      lesson_completed: true,
 * }
 * const result = await addLessonStatusForUsers(sectionId, lesson_status);
 * console.log(result);
 * // Output:
 * [
 *  {
 *      acknowledged: true,
 *      modifiedCount: 1,
 *      upsertedId: null,
 *      upsertedCount: 0,
 *      matchedCount: 1
 *  }, {}, ...
 * ]
 * 
 */
const addLessonStatusForUsers = async (sectionId, lesson_status) => { // check for irregularities here with updating
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
                let update = await allUserCollection.updateOne(
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

/**
 * @typedef {Object} QuizObjectToDb
 * @property {string} section_id - The section id.
 * @property {string} lesson_id - The lesson id.
 * @property {string} quiz_id - The quiz id.
 * @property {string} quiz_name - The quiz name.
 * @property {string} quiz_completed_date - The quiz completion date.
 * @property {string} quiz_score - The quiz score.
 * @property {boolean} quiz_complete - The quiz completion status.
 */

/**
 * Updates the quiz status for all the users after adding a new quiz
 * @async
 * @param {string} sectionId 
 * @param {string} lessonId 
 * @param {QuizObjectToDb} quizObject 
 * @returns {Promise<object>} Object containing the result of the update operation
 * @example
 * const sectionId = '5119f37b-ef44-4272-a536-04af51ef4bbc';
 * const lessonId = 'a4d32182-98ba-4968-90c3-aa0c27751d55';
 * const quizObject = {
 *      section_id: '5119f37b-ef44-4272-a536-04af51ef4bbc',
 *      lesson_id: 'a4d32182-98ba-4968-90c3-aa0c27751d55',
 *      quiz_id: '2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1',
 *      quiz_name: 'Candle Stick Quiz 1',
 *      quiz_completed_date: '',
 *      quiz_score: '',
 *      quiz_completed: false,
 * }
 * const result = await addQuizStatusForUsers(sectionId, lessonId, quizObject);
 * console.log(result);
 * // Output:
 * {
 *      acknowledged: true,
 *      modifiedCount: 1,
 *      upsertedId: null,
 *      upsertedCount: 0,
 *      matchedCount: 1
 * }
 */
const addQuizStatusForUsers = async (sectionId, lessonId, quizObject) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        let updated
        const allUserCollection = db.collection('users')
        const AUCollection = allUserCollection.find({})
        while (await AUCollection.hasNext()) {
            const user = await AUCollection.next();
            if (user !== null) {
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
        }
        return updated
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/**
 * Checks if a document exists in a collection
 * @async
 * @param {string} collectionName  The name of the collection to check
 * @param {string} id  The id of the document to check
 * @returns {Promise<object>} An object containing the document if it exists
 * @example
 * const collectionName = 'sections';
 * const id = '5119f37b-ef44-4272-a536-04af51ef4bbc';
 * const section = await checkForDocumentInCollection(collectionName, id);
 * console.log(section);
 * // Output:
 * {
 *      "_id": "6412d6826ad7375e1c777ada",
 *      "title": "Introduction to the market",
 *      "content": "The crypto market is relatively new, highly volatile, ...",
 *      "url": "",
 *      "sectionId": "5119f37b-ef44-4272-a536-04af51ef4bbc"
 * }
 */
const checkForDocumentInCollection = async (collectionName, id) => {
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
        let filter = { [key]: id }
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

/**
 * Updates a section in the database
 * @async
 * @param {string} title The title of the section 
 * @param {string} content The content of the section
 * @param {string} url The url of the section
 * @param {string} sectionId The section id of the section to be updated
 * @returns {Promise<object>} An object containing the result of the update operation
 * @example
 * const title = 'Introduction to the market';
 * const content = 'The crypto market is relatively new, highly volatile, ...';
 * const url = '';
 * const sectionId = '5119f37b-ef44-4272-a536-04af51ef4bbc';
 * const result = await updateSectionData(title, content, url, sectionId);
 * console.log(result);
 * // Output:
 * {
 *      acknowledged: true,
 *      modifiedCount: 1,
 *      upsertedId: null,
 *      upsertedCount: 0,
 *      matchedCount: 1
 * }
 */
const updateSectionData = async (title, content, url, sectionId) => {
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

/**
 * Updates a lesson in the database
 * @async
 * @param {string} chapter_title 
 * @param {object} lessonData 
 * @param {string} lessonId 
 * @returns {Promise<object>} An object containing the result of the update operation
 * @example
 * const chapter_title = 'Candle Stick Quiz 1';
 * const lessonData = {
 *      "title": "Candle Stick Quiz 1",
 *      "content": "The crypto market is relatively new, highly volatile, ...",
 *      "url": "",
 *      "lessonId": "a4d32182-98ba-4968-90c3-aa0c27751d55"
 *  };
 * const lessonId = 'a4d32182-98ba-4968-90c3-aa0c27751d55';
 * const result = await updateLessonData(chapter_title, lessonData, lessonId);
 * console.log(result);
 * // Output:
 * {
 *      acknowledged: true,
 *      modifiedCount: 1,
 *      upsertedId: null,
 *      upsertedCount: 0,
 *      matchedCount: 1
 * }
 */
const updateLessonData = async (chapter_title, lessonData, lessonId) => {
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

/**
 * Updates the lesson status of all the users after a lesson is updated
 * @async
 * @param {string} sectionId  The section id of the section to be updated
 * @param {string} lessonId  The lesson id of the lesson to be updated
 * @param {string} chapter_title  The chapter title of the lesson to be updated
 * @returns {Promise<object>} An object containing the result of the update operation
 * @example
 * const sectionId = '5119f37b-ef44-4272-a536-04af51ef4bbc';
 * const lessonId = 'a4d32182-98ba-4968-90c3-aa0c27751d55';
 * const chapter_title = 'Candle Stick Quiz 1';
 * const result = await updateLessonNameChangeAcrossUsersStatus(sectionId, lessonId, chapter_title);
 * console.log(result);
 * // Output:
 * {
 *      acknowledged: true,
 *      modifiedCount: 5,
 *      upsertedId: null,
 *      upsertedCount: 0,
 *      matchedCount: 5
 * }
 * 
 */
const updateLessonNameChangeAcrossUsersStatus = async (sectionId, lessonId, chapter_title) => {
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
        console.log(updated)
        return updated
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/**
 * Updates a quiz in the database
 * @async
 * @param {string} quizId  The quiz id of the quiz to be updated
 * @param {string} quizTitle  The quiz title of the quiz to be updated
 * @param {string} quizDescription  The quiz description of the quiz to be updated
 * @param {Array} questions  The questions of the quiz to be updated
 * @returns {Promise<array>} An array containing the result of the update operation and the updated quiz data
 * @example
 * const quizId = '2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1';
 * const quizTitle = 'Candle Stick Quiz 1';
 * const quizDescription = 'The crypto market is relatively new, highly volatile, ...';
 * const questions = [
 *     {
 *      {
 *       "question": "test",
 *       "options": [
 *           {
 *               "option": "a"
 *           },
 *           {
 *               "option": "s"
 *           },
 *           {
 *               "option": "d"
 *           }
 *       ],
 *       "correctAnswer": "d"
 *  }
 * ];
 * 
 * const result = await updateQuizData(quizId, quizTitle, quizDescription, questions);
 * console.log(result);
 * // Output:
 * [
 *  {
 *       acknowledged: true,
 *       modifiedCount: 1,
 *       upsertedId: null,
 *       upsertedCount: 0,
 *       matchedCount: 1
 *  },
 *  {
 *   _id: new ObjectId("6507be96b6437f017aa45ef8"),
 *   sectionId: '534413b3-ce75-42cb-b5d7-88db5a65c7eb',
 *   sectionName: 'test new ',
 *   lessonId: '40a21934-d949-46e4-b557-bc708f1ac1f9',
 *   lessonName: 'test',
 *   quizId: 'eef473fe-a19f-4d96-948c-e3f0a824c30d',
 *   quizTitle: 'test new',
 *   quizDescription: 'test',
 *   questions: [ { question: 'test', options: [Array], correctAnswer: 'd' } ]
 *  }
 * ]
 */
const updateQuizData = async (quizId, quizTitle, quizDescription, questions) => {
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

/**
 * Uodates the quiz name change across all the users
 * @async
 * @param {string} sectionId The section id of the section to be updated
 * @param {string} lessonId The lesson id of the lesson to be updated
 * @param {string} quizId The quiz id of the quiz to be updated 
 * @param {string} quizTitle The quiz title of the quiz to be updated 
 * @returns {Promise<object>} An object containing the result of the update operation
 * @example
 * const sectionId = '5119f37b-ef44-4272-a536-04af51ef4bbc';
 * const lessonId = 'a4d32182-98ba-4968-90c3-aa0c27751d55';
 * const quizId = '2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1';
 * const quizTitle = 'Candle Stick Quiz 1';
 * const result = await updateQuizNameChangeAcrossUsersStatus(sectionId, lessonId, quizId, quizTitle);
 * console.log(result);
 * // Output:
 * {
 *      acknowledged: true,
 *      modifiedCount: 5,
 *      upsertedId: null,
 *      upsertedCount: 0,
 *      matchedCount: 5
 * }
 */
const updateQuizNameChangeAcrossUsersStatus = async (sectionId, lessonId, quizId, quizTitle) => {
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
        console.log(updated)
        return updated
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/**
 * Deletes a document from a collection based on the id
 * @async
 * @param {string} collectionName collection name
 * @param {string} id id of the document
 * @returns {Promise<object>} An object containing the result of the deletion operation
 * @example
 * const collectionName = 'sections';
 * const id = '5119f37b-ef44-4272-a536-04af51ef4bbc';
 * const result = await deleteOneDocumentFromCollection(collectionName, id);
 * console.log(result);
 * // Output:
 * {
 *      acknowledged: true,
 *      deletedCount: 1
 * }
 */
const deleteOneDocumentFromCollection = async (collectionName, id) => {
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
        let filter = { [key]: id }
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const collection = db.collection(collectionName)
        const result = await collection.deleteOne(filter);
        return result
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/**
 * Deletes many documents from a collection based on the id
 * @async
 * @param {string} type The type of delete operation to be performed
 * @param {string} collectionName The name of the collection to delete documents from
 * @param {string} id The id of the document to be deleted
 * @returns {Promise<object>} An object containing the result of the deletion operation
 * @example
 * const type = 'sectionDelete';
 * const collectionName = 'sections';
 * const id = '5119f37b-ef44-4272-a536-04af51ef4bbc';
 * const result = await deleteManyDocumentsFromCollection(type, collectionName, id);
 * console.log(result);
 * // Output:
 * {
 *      acknowledged: true,
 *      deletedCount: 1
 * }
 */
const deleteManyDocumentsFromCollection = async (type, collectionName, id) => {
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
        let filter = { [key]: id }
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const collection = db.collection(collectionName)
        const result = await collection.deleteMany(filter);
        return result
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/**
 * Removes the lesson and quiz status from all the users after a section is deleted
 * @async
 * @param {string} sectionId The section id of the section to be removed
 * @returns {Promise<array>} An array containing the result of the deletion operation
 * @example
 * const sectionId = '5119f37b-ef44-4272-a536-04af51ef4bbc';
 * const result = await removeLessonAndQuizStatusFromUsers(sectionId);
 * console.log(result);
 * // Output:
 * [
 * {
 *      acknowledged: true,
 *      modifiedCount: 1,
 *      upsertedId: null,
 *      upsertedCount: 0,
 *      matchedCount: 1
 * }, {}, ...
 * ]
 */
const removeLessonAndQuizStatusFromUsers = async (sectionId) => {
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

/**
 * Deletes the lessona and quiz status from all the users after a lesson is deleted
 * @async
 * @param {string} sectionId The section id to which the lesson belongs
 * @param {string} lessonId The lesson id of the lesson to be removed
 * @returns {Promise<array>} An array containing the result of the deletion operation
 * @example
 * const sectionId = '5119f37b-ef44-4272-a536-04af51ef4bbc';
 * const lessonId = 'a4d32182-98ba-4968-90c3-aa0c27751d55';
 * const result = await removeOneLessonAndQuizStatusFromUsers(sectionId, lessonId);
 * console.log(result);
 * // Output:
 * [
 * {
 *      acknowledged: true,
 *      modifiedCount: 1,
 *      upsertedId: null,
 *      upsertedCount: 0,
 *      matchedCount: 1
 * }, {}, ...
 * ]
 */
const removeOneLessonAndQuizStatusFromUsers = async (sectionId, lessonId) => {
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

/**
 * Removes a quiz status from all the users after a quiz is deleted
 * @async
 * @param {string} quizId Quiz id of the quiz to be removed
 * @param {string} lessonId Lesson id of the lesson to which the quiz belongs
 * @param {string} sectionId Section id of the section to which the quiz belongs
 * @returns {Promise<array>} An array containing the result of the deletion operation
 * @example
 * const quizId = '2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1';
 * const lessonId = 'a4d32182-98ba-4968-90c3-aa0c27751d55';
 * const sectionId = '5119f37b-ef44-4272-a536-04af51ef4bbc';
 * const result = await removeQuizStatusFromUser(quizId, lessonId, sectionId);
 * console.log(result);
 * // Output:
 * [
 * {
 *      acknowledged: true,
 *      modifiedCount: 1,
 *      upsertedId: null,
 *      upsertedCount: 0,
 *      matchedCount: 1
 * }, {}, ...
 * ]
 */
const removeQuizStatusFromUser = async (quizId, lessonId, sectionId) => {
    try {
        let deletedStatus = []
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const allUserCollection = db.collection('users')
        const AUCollection = allUserCollection.find({})
        while (await AUCollection.hasNext()) {
            const user = await AUCollection.next();
            let deleted = await allUserCollection.updateOne(
                // @ts-ignore
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

/**
 * Deletes a ticker meta from db:crypticsage/binance_ticker_meta
 * @async
 * @param {string} symbol Symbol to be deleted
 * @returns {Promise<object>} An object containing the result of the deletion operation
 * @example
 * const symbol = 'BTCUSDT';
 * const result = await deleteOneMetaData(symbol);
 * console.log(result);
 * // Output:
 * {
 *      acknowledged: true,
 *      deletedCount: 1
 * }
 */
const deleteOneMetaData = async (symbol) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const collection = db.collection("binance_ticker_meta")
        const result = await collection.deleteOne({ symbol: symbol })
        console.log(result)
        return result
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}


//<------------------------CONTENT MANAGER SERVICES------------------------>



//<------------------------HISTORICAL DATA SERVICES------------------------>

//<------------------------Y-FINANCE SERVICES------------------------>

/**
 * Deletes all the historical data of a ticker from the db based on tickername and type : crypto / stock
 * @param {string} ticker_name The ticker name
 * @param {string} type crypto | stock 
 * @returns {Promise<array>} An array containing the result of the deletion operation
 * @example
 * const ticker_name = 'BTCUSDT';
 * const type = 'crypto';
 * const result = await deleteTickerHistDataFromDb(ticker_name, type);
 * console.log(result);
 * // Output:
 * [
 *     true, true, ...
 * ]
 */
const deleteTickerHistDataFromDb = async (ticker_name, type) => {
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

/**
 * Generates an array of objects with latest and oldest date based on latest tokens and data available in the db:crypticsage/binance
 * @async
 * @param {string} collection_name The name of the collection to generate the data for. binance_metadata | yfinance_metadata
 * @returns {Promise<array>} An array of objects with latest and oldest date
 * @example
 * const collection_name = 'binance_metadata';
 * const result = await getFirstObjectForEachPeriod(collection_name);
 * console.log(result);
 * // Output:	
 * [
 *  {
 *      "ticker_name": "BTCUSDT",
 *      "data": {
 *          "4h": {
 *              "historical": 12993,
 *              "firstHistorical": 1502942400000,
 *              "lastHistorical": 1690156800000,
 *              "oldestDate": "8/17/2017, 2:00:00 PM",
 *              "latestDate": "7/24/2023, 10:00:00 AM"
 *          }
 *      }
 *  },
 *  {
 *      "ticker_name": "XRPUSDT",
 *      "data": {
 *          "4h": {
 *              "historical": 11409,
 *              "firstHistorical": 1525420800000,
 *              "lastHistorical": 1689739200000,
 *              "oldestDate": "5/4/2018, 6:00:00 PM",
 *              "latestDate": "7/19/2023, 2:00:00 PM"
 *          },
 *      }
 *  }
 * ]
 */
const getFirstObjectForEachPeriod = async (collection_name) => {
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

const getBinanceTIckerNames = async () => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const collection = db.collection('binance_metadata');
        // Specify the field to return in the second parameter of the find() method
        const result = await collection.find({}, { projection: { ticker_name: 1, _id: 0 } }).toArray();
        return result;
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/**
 * Inserts an array of ticker data to the db:historical_data
 * @async
 * @param {string} type crypto | stock
 * @param {string} ticker_name The ticker name 
 * @param {string} period 1m | 4h | 6h | 8h | 12h | 1d | 3d | 1w 
 * @param {array} token_data The array of ticker data to be inserted
 * @returns {Promise<array>} An array containing the result of the insertion operation
 * @example
 * const type = 'crypto';
 * const ticker_name = 'BTCUSDT';
 * const period = '4h';
 * const token_data = [
 * {
 *      "openTime": 1502942400000,
 *      "open": "4261.48000000",
 *      "high": "4313.62000000",
 *      "low": "4261.48000000",
 *      "close": "4285.08000000",
 *      "volume": "39.89610500",
 *      "closeTime": 1502956799999,
 *      "quoteAssetVolume": "171154.47252880",
 *      "trades": 196
 * }, ... {}
 * ];
 * const result = await insertHistoricalDataToDb(type, ticker_name, period, token_data);
 * console.log(result);
 * // Output:
 * [
 *      {
 *           "batch_no": 1,
 *           "inserted": 1000,
 *           "acknowledged": true
 *      }, ...{}
 * ]
 */
const insertHistoricalDataToDb = async (type, ticker_name, period, token_data) => {
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

/**
 * Fetches the entire ticker data from db:historical_data based on the type, ticker name and period
 * @async
 * @param {Object} params
 * @param {string} params.type crypto | forex | stock
 * @param {string} params.ticker_name the ticker name
 * @param {string} params.period 1m | 1h | 4h | 6h | 8h | 12h | 1d | 3d | 1w
 * @param {boolean} params.return_result_ true | false Weather to return the result or not
 * @returns {Promise<Array>} An object containing the fetched data 
 * @example
 * const type = 'crypto';
 * const ticker_name = 'BTCUSDT';
 * const period = '4h';
 * const result = await fetchEntireHistDataFromDb({type, ticker_name, period});
 * console.log(result);
 * // Output:
 * [
 * {
 *   "openTime": 1502942400000,
 *   "open": "4261.48000000",
 *   "high": "4313.62000000",
 *   "low": "4261.48000000",
 *   "close": "4285.08000000",
 *   "volume": "39.89610500",
 * }, ... {}
 * ]
 */
const fetchEntireHistDataFromDb = async ({ type, ticker_name, period, return_result_ }) => {
    // Check if the historical data is present in redis, if not fetch and save it to redis
    const cacheKey = `${type}_${ticker_name}_${period}_full_historical_data`
    const t = createTimer(`Fetching entire ticker data for ${ticker_name}, ${period}`)
    if (config.debug_flag === 'true') {
        t.startTimer()
    }

    let tokenData = []
    try {
        let from_msg = "Historical Data"
        tokenData = await CacheUtil.get_cached_data(cacheKey, from_msg)
        if (tokenData === null) {
            log.info('Fetching data from db')
            const db = (await client).db(HISTORICAL_DATABASE_NAME)
            const collection_name = `${type}_${ticker_name}_${period}`
            const collection = db.collection(collection_name)
            const sortQuery = { openTime: 1 }
            const keysToIncude = { _id: 0, openTime: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 }

            // @ts-ignore
            tokenData = await collection.aggregate([
                {
                    $project: keysToIncude,
                },
                {
                    $sort: sortQuery,
                }
            ]).toArray();

            // Save the fetched data to redis. Also check for new ticker data and returns that
            const new_ticker_data = await CacheUtil.set_cached_historical_data(cacheKey, tokenData, period)
            if (new_ticker_data.length > 0) {
                // console.log('New data to update', new_ticker_data)
                await insertHistoricalDataToDb(type, ticker_name, period, new_ticker_data)
                let metadata = {
                    latest: new_ticker_data[new_ticker_data.length - 1],
                    updatedCount: new_ticker_data.length,
                }
                await updateTickerMetaData(type, ticker_name, period, metadata)
            }
            log.info(`Data fetched from db : ${tokenData.length}`)

            if (config.debug_flag === 'true') {
                log.info(`Initial Total Length : ${tokenData.length}`)
                console.log('Latest Data : ', tokenData[tokenData.length - 1], new Date(tokenData[tokenData.length - 1].openTime).toLocaleString())
                t.stopTimer(__filename.slice(__dirname.length + 1))
            }

            return return_result_ ? tokenData : []
        } else {
            log.info(`Data fetched from cache : ${tokenData.length}`)
            if (config.debug_flag === 'true') {
                log.info(`Initial Total Length : ${tokenData.length}`)
                console.log('Latest Data : ', tokenData[tokenData.length - 1], new Date(tokenData[tokenData.length - 1].openTime).toLocaleString())
                t.stopTimer(__filename.slice(__dirname.length + 1))
            }
            return return_result_ ? tokenData : []
        }

    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const fetch_history_slice = async (params) => {
    let { ticker_name, type, period, page_no, items_per_page, new_fetch_offset } = params
    try {
        const meta_db = (await client).db(CRYPTICSAGE_DATABASE_NAME) // added total count from metadata
        const meta_collection = meta_db.collection('binance_metadata')
        const meta_data = await meta_collection.findOne({ ticker_name: ticker_name })
        // @ts-ignore
        const total_count = meta_data.data[period].ticker_count

        const db = (await client).db(HISTORICAL_DATABASE_NAME)
        const collection_name = `${type}_${ticker_name}_${period}`
        const collection = db.collection(collection_name)
        const sortQuery = { openTime: -1 }
        const keysToIncude = { _id: 0, openTime: 1, open: 1, high: 1, low: 1, close: 1, volume: 1 }

        new_fetch_offset = new_fetch_offset === undefined ? 0 : new_fetch_offset
        // Calculate the number of documents to skip based on the page number and items per page
        const skip = ((page_no - 1) * items_per_page) + new_fetch_offset;
        // @ts-ignore
        let tokenData = await collection.find({}, { projection: keysToIncude }).sort(sortQuery).skip(skip).limit(items_per_page).toArray();

        if (tokenData.length > 0) {
            let output = {}
            tokenData = tokenData.reverse().map((data) => {
                return {
                    ...data,
                    date: new Date(data.openTime).toLocaleString(),
                }
            })

            output['ticker_name'] = ticker_name
            output['total_count_db'] = total_count
            output['period'] = period
            output['page_no'] = page_no
            output['items_per_page'] = items_per_page
            output['start_date'] = tokenData.slice(-1)[0].date
            output['end_date'] = tokenData[0].date
            output['total_count'] = tokenData.length
            output['ticker_data'] = tokenData

            return output
        } else {
            return ["No data found in binance_historical"]
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}


const fetch_sliced_data_from_redis = async (params) => {
    let { ticker_name, type, period, page_no, items_per_page, new_fetch_offset } = params

    // Fetching from Redis
    const cacheKey = `${type}_${ticker_name}_${period}_full_historical_data`
    let from_msg = "Historical Data Slicing"
    let full_ticker_history = await CacheUtil.get_cached_data(cacheKey, from_msg)
    full_ticker_history = full_ticker_history.reverse()

    let tokenData = full_ticker_history.slice((page_no - 1) * items_per_page, page_no * items_per_page)
    if (tokenData.length > 0) {
        let output = {}
        tokenData = tokenData.reverse().map((data) => {
            return {
                ...data,
                date: new Date(data.openTime).toLocaleString(),
            }
        })

        output['ticker_name'] = ticker_name
        output['total_count_db'] = full_ticker_history.length
        output['period'] = period
        output['page_no'] = page_no
        output['items_per_page'] = items_per_page
        output['start_date'] = tokenData.slice(-1)[0].date
        output['end_date'] = tokenData[0].date
        output['total_count'] = tokenData.length
        output['ticker_data'] = tokenData

        return output
    } else {
        return ["No data found in binance_historical"]
    }
}


/**
 * Fetches the ticker data from db:historical_data based on the ticker name, period, page_no and items_per_page.
 * Only being used for the main chart loading and debounced fetch
 * @async
 * @param {string} uid 
 * @param {string} type 
 * @param {string} ticker_name 
 * @param {string} period 
 * @param {number} page_no 
 * @param {number} items_per_page 
 * @param {number} new_fetch_offset 
 * @returns {Promise<object>} An object containing the fetched data
 * @example
 * const uid = 'user id'
 * const type = 'crypto';
 * const ticker_name = 'BTCUSDT';
 * const period = '4h';
 * const page_no = 1;
 * const items_per_page = 100;
 * const new_fetch_offset = 0;
 * const result = await fetchTickerHistDataFromDb(uid, type, ticker_name, period, page_no, items_per_page, new_fetch_offset);
 * console.log(result);
 * // Output:
 * {
 *      "ticker_name": "BTCUSDT",
 *      "period": "4h",
 *      "page_no": 1,
 *      "items_per_page": 100,
 *      "start_date": "8/17/2017, 2:00:00 PM",
 *      "end_date": "7/24/2023, 10:00:00 AM",
 *      "total_count": 12993,
 *      "ticker_data": [
 *          {
 *              "date": "7/24/2023, 10:00:00 AM",
 *              "openTime": 1690156800000,
 *              "open": "100000.00000000",
 *              "high": "100000.00000000",
 *              "low": "100000.00000000",
 *              "close": "100000.00000000",
 *              "volume": "0.00000000"
 *          }, ... {}
 *      ]
 * }    
 */
const fetchTickerHistDataFromDb = async (uid, type, ticker_name, period, page_no, items_per_page, new_fetch_offset) => {
    const ohlcv_cache_key = `${uid}_${type}_${ticker_name}_${period}_ohlcv_data`
    // console.log(type, ticker_name, period, page_no, items_per_page, new_fetch_offset)

    let ohlchData = {}
    try {
        const from_msg = "OHLCV Data"
        ohlchData = await CacheUtil.get_cached_data(ohlcv_cache_key, from_msg)

        if (ohlchData === null) { // Initial load of tickers
            log.info('Fetching OHLCV data from db')
            const history_slice = await fetch_sliced_data_from_redis({
                ticker_name
                , type
                , period
                , page_no
                , items_per_page
                , new_fetch_offset
            })

            const new_ticker_data = await CacheUtil.set_cached_ohlcv_data(ohlcv_cache_key, history_slice)

            if (new_ticker_data.length > 0) {
                console.log('New ticker data length: ', new_ticker_data.length)
                // @ts-ignore
                history_slice.total_count_db = history_slice.total_count_db + new_ticker_data.length
                await insertHistoricalDataToDb(type, ticker_name, period, new_ticker_data)
                let metadata = {
                    latest: new_ticker_data[new_ticker_data.length - 1],
                    updatedCount: new_ticker_data.length,
                }
                await updateTickerMetaData(type, ticker_name, period, metadata)
            }

            // @ts-ignore
            log.info(`Data fetched from db : ${history_slice.ticker_data.length}`)

            return history_slice
        } else {
            log.info(`Data for ticker ${ticker_name} ${period} exists`)
            const { ticker_data, page_no: savedPageNo, ...rest } = ohlchData
            log.info(`Cached page no :  ${savedPageNo}`)

            if (page_no > savedPageNo) {
                log.info(`New Page data requested for ${page_no}, fetching additional OHLCV data from db`)
                const history_slice = await fetch_sliced_data_from_redis({
                    ticker_name
                    , type
                    , period
                    , page_no
                    , items_per_page
                    , new_fetch_offset
                })

                // @ts-ignore
                const new_page_data = history_slice.ticker_data
                const to_update_ohlcv_data = [...new_page_data, ...ticker_data]

                const to_update_data = {
                    ...rest,
                    page_no,
                    end_date: new_page_data[0].date,
                    ticker_data: to_update_ohlcv_data,
                    total_count: to_update_ohlcv_data.length
                }

                // const { ticker_data: updated_ticker_data, ...rest_data } = to_update_data
                // console.log('Updated data : ', rest_data)

                await CacheUtil.update_cached_ohlcv_data(ohlcv_cache_key, to_update_data)

                return history_slice
            } else {
                console.log('Page no same or less than cached, fetching data from cache')
                return ohlchData
            }
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/**
 * Fetched ticker data from db:historical_data based on the ticker name, period and fetch_count
 * @async
 * @param {string} asset_type The type of asset : crypto | stock
 * @param {string} ticker_name The ticker name
 * @param {string} period The period of the ticker data : 1m | 4h | 6h | 8h | 12h | 1d | 3d | 1w
 * @param {number} fetch_count The number of data to be fetched
 * @returns {Promise<object>} An object containing the fetched data
 * @example
 * const asset_type = 'crypto';
 * const ticker_name = 'BTCUSDT';
 * const period = '4h';
 * const fetch_count = 100;
 * const result = await fetchTickerHistDataBasedOnCount(asset_type, ticker_name, period, fetch_count);
 * console.log(result);
 * // Output:
 * {
 *      "ticker_name": "BTCUSDT",
 *      "period": "4h",
 *      "page_no": 1,
 *      "items_per_page": 100,
 *      "start_date": "8/17/2017, 2:00:00 PM",
 *      "end_date": "7/24/2023, 10:00:00 AM",
 *      "total_count": 12993,
 *      "ticker_data": [
 *          {
 *              "date": "7/24/2023, 10:00:00 AM",
 *              "openTime": 1690156800000,
 *              "open": "100000.00000000",
 *              "high": "100000.00000000",
 *              "low": "100000.00000000",
 *              "close": "100000.00000000",
 *              "volume": "0.00000000"
 *          }, ... {}
 *      ]
 * }    
 */
const fetchTickerHistDataBasedOnCount = async (asset_type, ticker_name, period, fetch_count) => {
    try {
        const db = (await client).db(HISTORICAL_DATABASE_NAME)
        const collection_name = `${asset_type}_${ticker_name}_${period}`
        const collection = db.collection(collection_name)
        const sortQuery = { openTime: -1 }

        // @ts-ignore
        const tokenData = await collection.find({}).sort(sortQuery).limit(fetch_count).toArray();

        let finalResult = []

        if (tokenData.length > 0) {
            let output = {}
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

            output['ticker_name'] = ticker_name
            output['period'] = period
            output['fetch_count'] = fetch_count
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

/**
 * Updates the ticker meta data in db:crypticsage/binance_metadata after fetching the historical or new data from binance
 * @async
 * @param {string} type crypto | stock 
 * @param {string} ticker_name The ticker name 
 * @param {string} period 1m | 4h | 6h | 8h | 12h | 1d | 3d | 1w 
 * @param {object} meta The meta data to be updated 
 * @returns {Promise<object>} An object containing the result of the update operation
 * @example
 * const type = 'crypto';
 * const ticker_name = 'BTCUSDT';
 * const period = '4h';
 * const meta = {
 *      latest:{} // Latest ticker data
 *      updatedCount: 100 // Number of tickers updated
 * }
 * const result = await updateTickerMetaData(type, ticker_name, period, meta);
 * console.log(result);
 * // Output:
 * {
 *      "acknowledged": true,
 *      "modifiedCount": 0,
 *      "upsertedId": null,
 *      "upsertedCount": 0,
 *      "matchedCount": 1
 * }
 */
const updateTickerMetaData = async (type, ticker_name, period, meta) => {
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

/**
 * Fetches the top tickers from DB based on length: crypticsage/binance-ticker-meta
 * @async
 * @param {array} cryptoData The array of ticker data (cryptodata from cryptocompare)
 * @returns {Promise<array>} Array of status based on the operation, insert or update 
 * @example
 * const cryptoData = [
 * {},..{}
 * ];
 * const result = await saveOrUpdateTickerMeta(cryptoData);
 * console.log(result);
 * // Output:
 * [
 *   {
 *      lastErrorObject: { n: 1, updatedExisting: true },
 *      value: {
 *          _id: new ObjectId("64eea42b91934b84684ce880"),
 *          symbol: 'BTC',
 *          asset_launch_date: '2009-01-03',
 *          current_price: 27411.81,
 *          high_24h: 28169.48,
 *          id: '1182',
 *          image_url: 'https://www.cryptocompare.com/media/37746251/btc.png',
 *          last_updated: 1693363675,
 *          low_24h: 25911.7,
 *          market_cap_rank: 1,
 *          max_supply: 20999999.9769,
 *          name: 'Bitcoin',
 *          price_change_24h: 1326.7900000000009,
 *          price_change_percentage_24h: 5.086405914199034
 *      },
 *      ok: 1
 *   , ...{}
 * ]
 */
const saveOrUpdateTickerMeta = async (cryptoData) => {
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
            // log.info(`Ticker metadata updated for ${tickerData.name}`);
        }
        return status
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const saveOrUpdateTickerInfoMeta = async (tickerInfo) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const metaCollection = db.collection('binance_ticker_meta')
        let status = []
        for (const tickerData of tickerInfo) {
            const query = { symbol: tickerData.symbol };
            const update = { $set: { info: tickerData.info } };
            const options = { upsert: true };

            let updated = await metaCollection.findOneAndUpdate(query, update, options);
            status.push(updated)
            // log.info(`Ticker info updated for ${tickerData.symbol}`);
        }
        return status
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const fetch_single_b_ticker_info = async (symbol) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const metaCollection = db.collection('binance_ticker_meta')

        const query = { symbol: symbol };
        const projection = { _id: 0, info: 1 }
        const tickerInfo = await metaCollection.findOne(query, { projection: projection });
        // @ts-ignore
        return tickerInfo.info
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/**
 * Fetches the saved ticker meta data from db:crypticsage/binance_ticker_meta
 * @async
 * @param {number|string} length number of tickers to fetch : { length: 10 } or { length: "max" }
 * @returns {Promise<array>} Array of tickers
 * @example
 * const length = 10;
 * const result = await fetchTickerMetaFromDb(length);
 * console.log(result);
 * // Output:
 * [
 *  {
 *      "id": "1182",
 *      "symbol": "BTC",
 *      "name": "Bitcoin",
 *      "max_supply": 20999999.9769,
 *      "asset_launch_date": "2009-01-03",
 *      "image_url": "https://www.cryptocompare.com/media/37746251/btc.png",
 *      "market_cap_rank": 1
 *  },
 *  {
 *      "id": "7605",
 *      "symbol": "ETH",
 *      "name": "Ethereum",
 *      "max_supply": -1,
 *      "asset_launch_date": "2015-07-30",
 *      "image_url": "https://www.cryptocompare.com/media/37746238/eth.png",
 *      "market_cap_rank": 2
 *  }
 * ]
 */
const fetchTickerMetaFromDb = async (length) => {
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

const getBinanceTickerList = async () => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const ticker_meta_collection = db.collection("binance_ticker_meta")
        let tickerMeta = await ticker_meta_collection.aggregate([
            { $project: { _id: 0 } }
        ]).toArray()

        tickerMeta = tickerMeta.sort((a, b) => a.market_cap_rank - b.market_cap_rank)

        return tickerMeta
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const updateTickerMeta_matched_value = async (symbol, matched_value) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const ticker_meta_collection = db.collection("binance_ticker_meta")
        const query = { symbol: symbol }
        const update = { $set: { matched: matched_value } }
        const options = { upsert: true }
        const updated = await ticker_meta_collection.updateOne(query, update, options)
        return updated
    } catch (error) {
        log.error(error.stack)
        throw error

    }
}

/**
 * Function to check for duplicate data in db:crypticsage/binance_historical
 * @async
 * @param {string} ticker_name The ticker name 
 * @returns {Promise<array>} An array containing the result of the aggregation operation
 * @example
 * const ticker_name = 'BTCUSDT';
 * const result = await checkTickerMetaDuplicateData(ticker_name);
 * console.log(result);
 * // Output:
 * []
 */
const checkTickerMetaDuplicateData = async (ticker_name) => {
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

const checkForDuplicateDocumentsInHistory = async (ticker_name, period) => {
    try {
        const db = (await client).db(HISTORICAL_DATABASE_NAME)
        const collection_name = `crypto_${ticker_name}_${period}`
        const collection = db.collection(collection_name)

        const duplicates = await collection.aggregate([
            {
                $group: {
                    _id: '$openTime',
                    count: { $sum: 1 },
                    docs: { $push: '$$ROOT' } // Include all documents in the group
                }
            },
            {
                $match: {
                    count: { $gt: 1 } // Find keys with more than one occurrence
                }
            }
        ]).toArray();

        let deleteduplicateResult = []
        if (duplicates.length > 0) {
            console.log('Duplicate documents found. Removing duplicates...', duplicates.length);

            // Loop through duplicates and remove all but one document for each duplicate key
            let c = 1;
            for (const duplicate of duplicates) {
                console.log(`Removing ${c++} of ${duplicates.length} duplicates (${duplicate.count}) for key ${duplicate._id}, ${new Date(duplicate._id).toLocaleString()}`)
                // @ts-ignore
                let delDupli = await collection.deleteMany({ openTime: duplicate._id }, { sort: { _id: 1 }, limit: duplicate.count - 1 });
                deleteduplicateResult.push(delDupli)
            }
            console.log(duplicates.length, 'Duplicate documents removed.');
            console.log('Duplicate documents removed.');
        } else {
            console.log('No duplicate documents found.');
        }

        const latestDocumentCount = await collection.countDocuments();

        const cryptic_db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const cryptic_collection = cryptic_db.collection(`binance_metadata`)

        const updatedResult = await cryptic_collection.updateOne(
            { ticker_name: ticker_name },
            {
                $set: {
                    [`data.${period}.ticker_count`]: latestDocumentCount
                }
            })

        return [deleteduplicateResult, updatedResult, latestDocumentCount]

    } catch (error) {
        log.error(error.stack)
        throw error

    }
}

const fetchYFinanceShortSummary = async (symbols) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const collection = db.collection('yfinance_metadata')

        const query = { ticker_name: { $in: symbols } }

        const matching = await collection.find(query).toArray()
        const final = matching.map((item) => { return item.meta.short_summary })
        return final

    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const fetchYFinanceFullSummary = async (symbol) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const collection = db.collection('yfinance_metadata')

        const query = { ticker_name: symbol }
        const document = await collection.findOne(query)
        if (document) {
            return document.meta.full_summary
        } else {
            return null
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const updateYFinanceMetadata = async (ticker_name, meta_type, meta_data) => {
    // log.info(`Updating ${meta_type} for ${ticker_name} `)
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const collection = db.collection('yfinance_metadata')
        const query = { ticker_name };
        const stock = await collection.findOne(query)
        let updatedStockMeta;
        if (stock) {
            // Check if the `meta_type` field exists in the `meta` object
            if (stock.meta && stock.meta[meta_type]) {
                // Update the specific `meta_type` field
                log.info(`Updating ${meta_type} for ${ticker_name} `)
                updatedStockMeta = await collection.updateOne(
                    query, // Use the same query
                    {
                        $set: {
                            [`meta.${meta_type}`]: meta_data
                        }
                    }
                );
            } else {
                // Update the entire `meta` object 
                log.info(`Adding ${meta_type} for ${ticker_name} `)
                updatedStockMeta = await collection.updateOne(
                    query, // Use the same query
                    {
                        $set: {
                            [`meta.${meta_type}`]: meta_data // Create a new `meta` object with the desired field
                        }
                    }
                );
            }
        }
        return updatedStockMeta
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const isMetadatAvailable = async (ticker_name) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const collection = db.collection('yfinance_metadata')

        const query = { ticker_name };
        const document = await collection.findOne(query)
        // @ts-ignore
        if (Object.keys(document.meta).length > 0) {
            return true
        } else {
            return false
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

/* let res = async () => {
    isMetadatAvailable('AAPL').then((result) => {console.log(result)})
}
res() */
//<------------------------CRYPTO-STOCKS SERVICES-------------------------->

const saveModelForUser = async (user_id, ticker_name, ticker_period, model_id, model_name, model_type, model_data) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const model_collection = db.collection('models')

        // Check if the model with the same ID exists
        const existingModel = await model_collection.findOne({ 'model_id': model_id });

        if (!existingModel) {
            // The model with the same ID does not exist, create a new model document
            const newModel = {
                user_id,
                model_id,
                model_name,
                model_type,
                model_created_date: new Date().getTime(),
                ticker_name,
                ticker_period,
                model_data,
            };

            const inserted = await model_collection.insertOne(newModel);
            return [true, inserted];
        } else {
            // The model with the same ID already exists, return a message or handle accordingly
            let message = 'Model with the same ID already exists.';
            return [false, message];
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const fetchUserModels = async (user_id) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const model_collection = db.collection('models')

        const projection_field = {
            _id: 0,
            model_id: 1,
            model_name: 1,
            model_created_date: 1,
            ticker_name: 1,
            ticker_period: 1,
            model_type: 1,
            model_data: {
                $cond: {
                    if: { $eq: ["$model_type", "LSTM"] },
                    then: {
                        $mergeObjects: [
                            "$model_data",
                            {
                                predicted_result: {
                                    $mergeObjects: [
                                        "$model_data.predicted_result",
                                        {
                                            predictions_array: {
                                                $slice: [
                                                    "$model_data.predicted_result.predictions_array",
                                                    { $multiply: ["$model_data.training_parameters.lookAhead", -1] }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    },
                    else: "$model_data"
                }
            }
        }

        const pipeline = [
            // Match documents with the specified user_id
            {
                $match: { user_id }
            },
            {
                $addFields: {
                    'model_data.wgan_final_forecast.predictions': {
                        $cond: {
                            if: { $eq: ["$model_type", "WGAN-GP"] },
                            then: {
                                $slice: [
                                    '$model_data.wgan_final_forecast.predictions',
                                    { $multiply: ['$model_data.training_parameters.lookAhead', -1] }
                                ]
                            },
                            else: "$$REMOVE" // This will remove the field if the condition is false
                        }
                    },
                    'model_data.epoch_results': {
                        $slice: ['$model_data.epoch_results', -1]
                    },
                }
            },
            {
                $addFields: {
                    'model_data.wgan_final_forecast': {
                        $cond: {
                            if: { $eq: ["$model_type", "LSTM"] },
                            then: "$$REMOVE",
                            else: "$model_data.wgan_final_forecast"
                        }
                    }
                }
            },
            {
                $addFields: {
                    'model_data.predicted_result.initial_forecast': {
                        $slice: [
                            '$model_data.predicted_result.scaled',
                            { $multiply: ['$model_data.training_parameters.lookAhead', -1] }
                        ]
                    }
                }
            },
            {
                $addFields: {
                    'model_data.predicted_result': {
                        $cond: {
                            if: { $eq: ["$model_type", "WGAN-GP"] },
                            then: "$$REMOVE",
                            else: "$model_data.predicted_result"
                        }
                    }
                }
            },
            {
                $project: projection_field
            },
            // You can add additional stages here as needed
            {
                $unset: [
                    'model_data.predicted_result.dates',
                    'model_data.predicted_result.standardized',
                    'model_data.predicted_result.scaled',
                    'model_data.correlation_data'
                ]
            }
        ];

        // Perform the aggregation
        const userModels = await model_collection.aggregate(pipeline).toArray();

        // const finalUserModels = []
        if (userModels.length > 0) {
            userModels.map((model) => {
                let { model_data: m_data, model_id, model_type } = model
                // let m_data = model.model_data
                m_data['latest_forecast_result'] = {}

                let path = ''
                if (model_type === 'LSTM') {
                    path = `./models/${model_id}`
                } else {
                    path = `./worker_celery/saved_models/${model_id}`
                }

                if (fs.existsSync(path)) {
                    model['model_data_available'] = true
                } else {
                    model['model_data_available'] = false
                }

                return {
                    ...model,
                    model_data: m_data
                }
            })
            // return userModels
        }
        else {
            return []
        }

        const additionalData = await getAdditionalTrainingRunResults(user_id)
        if (additionalData.length > 0) {
            // console.log('Additional data found')
            const combined = userModels.map((model) => {
                const matchingObj = additionalData.find((ob) => ob.model_id === model.model_id);
                if (matchingObj) {
                    return {
                        ...model,
                        additional_training_run_results: matchingObj.additional_training_run_results // Corrected variable name to `matchingObj`
                    };
                } else {
                    return model; // Added else block to return original object if no match is found
                }
            });
            return combined
        }

        return userModels

    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const addNewWganTrainingResults = async (data) => {
    const {
        uid,
        model_created_date,
        model_id,
        epoch_results,
        train_duration,
        training_parameters,
        wgan_intermediate_forecast,
        wgan_final_forecast
    } = data

    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const model_collection = db.collection('models')

        const data_to_update = {
            epoch_results,
            train_duration,
            training_parameters,
            wgan_intermediate_forecast,
            wgan_final_forecast,
            model_created_date
        }

        const query = { model_id, user_id: uid }
        const updated = await model_collection.updateOne(query,
            {
                $push: { ['additional_training_run_results']: data_to_update }
            }
        )

        return updated
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const getAdditionalTrainingRunResults = async (uid) => {
    const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
    const model_collection = db.collection('models')

    // Fetch additional trainining results for wgan models
    const proj_field = {
        _id: 0,
        model_id: 1,
        additional_training_run_results: 1
    }

    const pipeline = [
        {
            $match: {
                user_id: uid,
                model_type: 'WGAN-GP',
                additional_training_run_results: { $exists: true }
            }
        },
        {
            $addFields: {
                additional_training_run_results: {
                    $map: {
                        input: '$additional_training_run_results',
                        as: 'result',
                        in: {
                            $mergeObjects: [
                                { latest_forecast_result: {} },
                                '$$result',
                                {
                                    wgan_final_forecast: {
                                        predictions: {
                                            $slice: [
                                                '$$result.wgan_final_forecast.predictions',
                                                { $multiply: ['$$result.training_parameters.lookAhead', -1] }
                                            ]
                                        },
                                        rmse: '$$result.wgan_final_forecast.rmse'
                                    },
                                    epoch_results: { $slice: ['$$result.epoch_results', -1] }
                                }
                            ]
                        }
                    }
                }
            }
        },
        {
            $project: proj_field
        }
    ]

    let additional_data
    try {
        additional_data = await model_collection.aggregate(pipeline).toArray()
    } catch (error) {
        log.error(error.stack)
        throw error
    }

    return additional_data
}


const temp_setLSTMRmse = async (model_id, rmse) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const model_collection = db.collection('models')

        const query = { model_id }
        const update = { $set: { 'model_data.predicted_result.rmse': rmse } }
        const updated = await model_collection.updateOne(query, update)

        return updated
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const getModelResult = async (user_id, model_id) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const model_collection = db.collection('models')

        const projection_field = {
            _id: 0,
            model_data: 1,
            ticker_period: 1
        }

        const pipeline = [
            {
                $match: { user_id, model_id }
            },
            {
                $addFields: {
                    'model_data.predicted_result.initial_forecast': {
                        $slice: [
                            '$model_data.predicted_result.scaled',
                            { $multiply: ['$model_data.training_parameters.lookAhead', -1] }
                        ]
                    }
                }
            },
            {
                $project: projection_field
            },
            {
                $unset: [
                    'model_data.training_parameters',
                    'model_data.talibExecuteQueries',
                    'model_data.scores',
                    'model_data.epoch_results',
                    'model_data.train_duration',
                    'model_data.predicted_result.standardized',
                    'model_data.predicted_result.scaled',
                    'model_data.predicted_result.mean_array',
                    'model_data.predicted_result.variance_array'
                ]
            }
        ]

        const modelResult = await model_collection.aggregate(pipeline).toArray()

        if (modelResult.length > 0) {
            const result = modelResult[0].model_data.predicted_result
            const { dates, predictions_array, label_mean, label_variance, forecast } = result
            const rmse = IUtil.calculateScaledRMSE(dates, predictions_array, label_variance, label_mean, modelResult[0].ticker_period)
            const slicedPredictions = predictions_array.slice(-forecast.length)
            delete result.dates
            delete result.label_mean
            delete result.label_variance
            result.predictions_array = slicedPredictions
            result.rmse = rmse
            return result
        }
        else {
            return []
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const renameModelForUser = async (user_id, model_id, model_name) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const model_collection = db.collection('models')

        const query = { user_id, model_id }
        const update = { $set: { model_name } }
        const updated = await model_collection.updateOne(query, update)

        return updated
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const deleteUserModel = async (user_id, model_id) => {
    try {
        const db = (await client).db(CRYPTICSAGE_DATABASE_NAME)
        const model_collection = db.collection('models')

        const query = { user_id, model_id }
        const deleted = await model_collection.deleteOne(query)
        return deleted
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

module.exports = {
    getUserByEmail
    , temp_setLSTMRmse
    , addNewWganTrainingResults
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
    , getSectionIDs
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
    , deleteTickerHistDataFromDb
    , getFirstObjectForEachPeriod
    , getBinanceTIckerNames
    , saveOrUpdateTickerMeta
    , saveOrUpdateTickerInfoMeta
    , fetch_single_b_ticker_info
    , fetchTickerMetaFromDb
    , deleteOneMetaData
    , getBinanceTickerList
    , updateTickerMeta_matched_value
    , checkTickerMetaDuplicateData
    , insertHistoricalDataToDb
    , fetchEntireHistDataFromDb
    , fetchTickerHistDataFromDb
    , fetchTickerHistDataBasedOnCount
    , updateTickerMetaData
    , checkForDuplicateDocumentsInHistory
    , fetchYFinanceShortSummary
    , fetchYFinanceFullSummary
    , updateYFinanceMetadata
    , isMetadatAvailable
    , saveModelForUser
    , fetchUserModels
    , getModelResult
    , renameModelForUser
    , deleteUserModel
}