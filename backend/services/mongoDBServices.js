const { connect, close, binanceConnect, binanceClose } = require('./db-conn')
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



//<------------------------HISTORICAL DATA SERVICES------------------------>

//<------------------------Y-FINANCE SERVICES------------------------>

// returns all the tickers in yFinance individually with time period
const getAvailableYfTickersInDb = async ({ connectMessage }) => {
    try {
        const db = await connect(connectMessage)
        const yFCollection = db.collection('yFinance_new')
        const yFTickers = await yFCollection.aggregate([
            {
                $project: {
                    _id: 1,
                    ticker_name: 1,
                    data: {
                        $objectToArray: "$data"
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    ticker_name: 1,
                    data: {
                        $arrayToObject: {
                            $map: {
                                input: "$data",
                                as: "period",
                                in: {
                                    k: "$$period.k",
                                    v: {
                                        historical: { $cond: [{ $isArray: "$$period.v.historical" }, true, false] }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ]).toArray()
        return yFTickers
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// oldest data first saved to db
const insertHistoricalYFinanceDate = async ({ tickerData, connectMessage }) => {
    try {
        const db = await connect(connectMessage)
        const yFinanceCollection = db.collection("yFinance_new");
        await yFinanceCollection.insertOne(tickerData)
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// returns all the tickers in yFinance individually with time period
const getYFinanceTickerInfo = async ({ connectMessage }) => {
    let tickers;
    try {
        console.log("Fetching y-finance token info from db")
        const db = await connect(connectMessage);
        const yFinanceCollection = db.collection("yFinance_new");
        const pipeline = [
            {
                $project: {
                    _id: 1,
                    ticker_name: 1,
                    data: { $objectToArray: "$data" },
                },
            },
            {
                $project: {
                    _id: 1,
                    ticker_name: 1,
                    data: {
                        $map: {
                            input: "$data",
                            as: "item",
                            in: {
                                _id: "$_id",
                                period: "$$item.k",
                                ticker_name: "$ticker_name",
                                last_updated: "$$item.v.last_updated",
                                last_historicalData: {
                                    $arrayElemAt: ["$$item.v.historical", -1],
                                },
                            },
                        },
                    },
                },
            },
            {
                $unwind: "$data",
            },
            {
                $replaceRoot: { newRoot: "$data" },
            },
        ];
        tickers = await yFinanceCollection.aggregate(pipeline).toArray()
        return tickers;
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// insert all new token values to their respective collections
const insertLatestYFinanceData = async ({ _id, period, data, connectMessage }) => {
    let updateResult;
    try {
        const db = await connect(connectMessage);
        const yFinanceCollection = db.collection("yFinance_new");
        const filters = {
            "_id": _id
        };
        let latestDate = new Date(data[data.length - 1].date)
        const update = {
            $push: {
                [`data.${period}.historical`]: { $each: data },
            },
            $set: {
                [`data.${period}.last_updated`]: latestDate,
            }
        }
        updateResult = await yFinanceCollection.updateOne(filters, update);
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
    return updateResult.modifiedCount
}


//<------------------------Y-FINANCE SERVICES------------------------>

//<------------------------BINANCE SERVICES-------------------------->

const formatMillisecond = (milliseconds) => {
    if (milliseconds < 1000) {
        return milliseconds.toFixed(3) + ' ms';
    } else if (milliseconds < 60000) {
        return (milliseconds / 1000).toFixed(3) + ' s';
    } else {
        const hours = Math.floor(milliseconds / 3600000);
        const minutes = Math.floor((milliseconds % 3600000) / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        const remainingMilliseconds = milliseconds % 1000;

        const formattedTime = [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0'),
            remainingMilliseconds.toString().padStart(3, '0')
        ].join(':');

        return formattedTime;
    }
}

// Gets all the tickers saved in the db:crypticsage/binance
// Input : none
// Output : array of objects from the db formatted accordingly
/* [
    {
        "_id": "64b7737936811988c24f2a32",
        "ticker_name": "BTCUSDT",
        "data": {
            "4h": {
                "historical": true
            },
            "6h": {
                "historical": true
            },
            "8h": {
                "historical": true
            },
            "12h": {
                "historical": true
            },
            "1d": {
                "historical": true
            },
            "3d": {
                "historical": true
            },
            "1w": {
                "historical": true
            }
        }
    }
] */
const getAvailableBinanceTickersInDb = async () => {
    try {
        const db = await connect("Fetching available binance tickers in db")
        const binanceCollection = db.collection('binance')
        const tickersNew = await binanceCollection.aggregate([
            {
                $project: {
                    _id: 1,
                    ticker_name: 1,
                    data: {
                        $objectToArray: "$data"
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    ticker_name: 1,
                    data: {
                        $arrayToObject: {
                            $map: {
                                input: "$data",
                                as: "period",
                                in: {
                                    k: "$$period.k",
                                    v: {
                                        historical: { $cond: [{ $isArray: "$$period.v.historical" }, true, false] }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ]).toArray()
        // console.log(tickersNew[0].data)
        return tickersNew
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// Insert the initial fetched data to the db:crypticsage/binance
// Input : ticker_name (string), period (string), meta (object), tokenData (array of ticker object) : { ticker_name, period, meta, tokenData }
// Output : object with the result of the insert query or messageif no data to insert
const insertBinanceDataToDb = async ({ ticker_name, period, meta, tokenData, allTickersInDb }) => {
    const db = await connect("Inserting Binance Data to db");
    const binanceCollection = db.collection("binance");

    try {
        let sTime = performance.now()
        let existingTickerInDb = allTickersInDb.filter((item) => item.ticker_name === ticker_name)[0]

        if (existingTickerInDb) {
            console.log("Ticker exists in DB");
            const historicalDataExists = period in existingTickerInDb.data;

            if (historicalDataExists) {
                console.log("Period for token exists");
                return { message: "No historical update needed" };
            } else {
                let pushDataToDb;
                if (tokenData.length > 0) {
                    const latestDateInData = tokenData[tokenData.length - 1].openTime;
                    const updateQuery = {
                        $push: { [`data.${period}.historical`]: { $each: tokenData } },
                        $set: { [`data.${period}.last_updated`]: new Date(latestDateInData).toLocaleString() },
                    };
                    pushDataToDb = await binanceCollection.updateOne({ ticker_name }, updateQuery);
                    let eTime = performance.now()
                    let lapsedTime = formatMillisecond(eTime - sTime)
                    console.log(`Inserted ${ticker_name}, ${period}, with ${tokenData.length} items, Time taken : ${lapsedTime}`)
                    return pushDataToDb;
                }
                else {
                    console.log(`No data for ${ticker_name}_${period}`, tokenData.length);
                    return pushDataToDb = ["No data to push"]
                }
            }
        } else {
            console.log(`Ticker ${ticker_name} does not exist. Adding to db`);
            const latestDateInData = tokenData[tokenData.length - 1].openTime;
            const newDocument = {
                ticker_name,
                meta,
                data: {
                    [period]: {
                        historical: tokenData,
                        last_updated: new Date(latestDateInData).toLocaleString(),
                    },
                },
            };
            const insertNewObj = await binanceCollection.insertOne(newDocument);
            let eTime = performance.now()
            let lapsedTime = formatMillisecond(eTime - sTime)
            console.log(`Inserted ${ticker_name}, ${period}, with ${tokenData.length} items, Time taken : ${lapsedTime}`)
            return insertNewObj;
        }
    } catch (error) {
        console.log(error)
        throw new Error(error.message) // Propagate the error to the caller
    }
};

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
const getFirstObjectForEachPeriod = async () => {
    try {
        const db = await connect("Getting first objects for each period")
        const collection = db.collection('binance');
        const result = await collection.aggregate([
            {
                $project: {
                    _id: 0,
                    ticker_name: 1,
                    data: {
                        $objectToArray: "$data"
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    ticker_name: 1,
                    data: {
                        $arrayToObject: {
                            $map: {
                                input: "$data",
                                as: "period",
                                in: {
                                    k: "$$period.k",
                                    v: {
                                        $let: {
                                            vars: {
                                                historicalArray: "$$period.v.historical",
                                                firstHistorical: { $arrayElemAt: ["$$period.v.historical", 0] },
                                                lastHistorical: { $arrayElemAt: ["$$period.v.historical", -1] }
                                            },
                                            in: {
                                                $mergeObjects: [
                                                    { historical: { $size: "$$historicalArray" } },
                                                    { firstHistorical: "$$firstHistorical.openTime" },
                                                    { lastHistorical: "$$lastHistorical.openTime" }
                                                ]
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        ]).toArray();

        const objectsWithConvertedDate = result.map((obj) => {
            const dataWithConvertedDate = Object.entries(obj.data).reduce((acc, [key, value]) => {
                // console.log(value)
                const oldestDate = new Date(value.firstHistorical).toLocaleString();
                const latestDate = new Date(value.lastHistorical).toLocaleString();

                return { ...acc, [key]: { ...value, oldestDate, latestDate } };
            }, {});

            return { ...obj, data: dataWithConvertedDate };
        });

        return objectsWithConvertedDate;
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    } finally {
        close("get first objs");
    }
};

// Updates the Ticker with the latest data
// Input : ticker_name (string), period (string), tokenData (array of ticker object) : { ticker_name, period, tokenData }
// Output : return modified count
const updateBinanceDataToDb = async ({ ticker_name, period, tokenData }) => {
    let updatedReuslt;
    try {
        const db = await connect("Updating data (>= 4h)")
        const binanceCollection = db.collection("binance")
        const filter = {
            "ticker_name": ticker_name
        }
        let latestDate = new Date(tokenData[tokenData.length - 1].openTime).toLocaleString()
        const updateQuery = {
            $push: {
                [`data.${period}.historical`]: { $each: tokenData }
            },
            $set: {
                [`data.${period}.last_updated`]: latestDate
            }
        }
        let sTime = performance.now()
        updatedReuslt = await binanceCollection.updateOne(filter, updateQuery)
        let eTime = performance.now()
        let lapsedTime = formatMillisecond(eTime - sTime)
        console.log(`Updated ${ticker_name} with ${tokenData.length} items, Time taken : ${lapsedTime}`)
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
    return updatedReuslt.modifiedCount
}

// get all the token names collection from db: Crypticsage/binance
// Input : none
// Output : array of token names
/* 
[
    "BTCUSDT",
    "BNBUSDT",
    "ADAUSDT",
    "SOLUSDT", 
    "ETHUSDT",
    "XRPUSDT",
    "APTUSDT",
    "ARBUSDT",
    "USDCUSDT",
    "DOGEUSDT"
]
*/
const getBinanceTickerNames = async () => {
    try {
        const db = await connect("Get Binance ticker names from db crypticsage/binance")
        const binanceCollection = db.collection("binance")
        const result = await binanceCollection.aggregate([
            {
                $group: {
                    _id: null,
                    ticker_names: { $addToSet: "$ticker_name" }
                }
            },
            {
                $project: {
                    _id: 0,
                    ticker_names: 1
                }
            }
        ]).toArray()
        return result[0].ticker_names
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// get all collection names from db: binance_historical
// Input : none
// Output : array of token names
/* 
[
    "BTCUSDT",
    "USDCUSDT",
    "ARBUSDT",
    "BNBUSDT",
    "ADAUSDT"
]
*/
const getTickersInBinanceDbMinutes = async () => {
    try {
        const db = await binanceConnect("Get all collection names from db binance_historical")
        const collectionsList = await db.listCollections().toArray()
        let collectionNames = []
        if (collectionsList.length > 0) {
            collectionsList.map((item) => { collectionNames.push(item.name) })
            return collectionNames
        } else {
            return []
        }
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

const getLatestOneMTickerDataFromDb = async ({ ticker_name }) => {
    try {
        const db = await binanceConnect("Get last document from collection - binance_historical")
        const collection = db.collection(ticker_name)
        const lastDocument = await collection.findOne({}, { sort: { $natural: -1 } })
        return lastDocument
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// Insert the fetched ticker data to the db:binance_historical in batches
// Input : ticker_name (string), token_data (array of ticker object) : { ticker_name, token_data }
// Output : object with the result of the mongo insert query
const insertOneMBinanceDataToDb = async ({ ticker_name, token_data }) => {
    try {
        const db = await binanceConnect("Saving oneM binance token data to db")
        const collection = db.collection(`${ticker_name}`)
        const batchSize = 1000;
        let noOfBatches = Math.ceil(token_data.length / batchSize)
        let inserted = []
        for (let i = 0; i < token_data.length; i += batchSize) {
            const batch = token_data.slice(i, i + batchSize);

            // Insert the batch of documents into the collection
            let sTime = performance.now()
            let ins = await collection.insertMany(batch);
            let eTime = performance.now()
            let lapsedTime = formatMillisecond(eTime - sTime)
            let batchNo = i > 0 ? Math.ceil(i / 1000) : 1
            inserted.push({ batch_no: batchNo, inserted: ins.insertedCount, acknowledged: ins.acknowledged })
            console.log(`Inserted batch ${batchNo} of ${noOfBatches}, Time taken : ${lapsedTime}`)

            // console.log(`Inserted batch ${i} of ${noOfBatches}`);
        }
        console.log('Data insertion complete.');
        return inserted
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

// <------------------------Random Testing------------------------->

const getData = async ({ ticker_name }) => {
    try {
        const db = await binanceConnect("Fetching binance token data")
        const collection = db.collection(`${ticker_name}`)
        const tokenData = await collection.find({}).toArray()
        let finalResult = []
        if (tokenData) {
            tokenData.map((data) => {
                let obj = {
                    openTime: new Date(data.openTime).toLocaleString(),
                    open: data.open,
                    high: data.high,
                    low: data.low,
                    close: data.close,
                }
                finalResult.push(obj)
            })
            return finalResult
        } else {
            return ({ message: "No data found" })
        }
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

const checkDuplicateData = async ({ ticker_name }) => {
    try {
        const db = await binanceConnect("Checking duplicate data")
        const testColl = await db.listCollections().toArray()
        const collection = db.collection(`${ticker_name}`)
        const pipeline = [
            {
                $group: {
                    _id: "$openTime",
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
            console.log("Duplicate documents found!");
            console.log("Duplicate groups:", duplicateGroups);
            return [duplicateGroups, testColl]
        } else {
            console.log("No duplicate documents based on the openTime key.");
            return []
        }
    } catch (err) {
        console.log(err)
        throw err
    }
}

// <------------------------Random Testing------------------------->

//<------------------------BINANCE SERVICES------------------------>

//<------------------------HISTORICAL DATA SERVICES------------------------>



//<------------------------CRYPTO-STOCKS SERVICES-------------------------->

// Fetches the top tickers from CryptoCompare and saves it to the DB : crypticsage/binance-ticker-meta
// INPUT : cryptodata from cryptocompare
// OUTPUT : Array of status based on the operation, insert or update 
/*
Update existing tickers : 
[
    {
        "acknowledged": true,
        "modifiedCount": 1,
        "upsertedId": null,
        "upsertedCount": 0,
        "matchedCount": 1
    },
    {
        "acknowledged": true,
        "modifiedCount": 1,
        "upsertedId": null,
        "upsertedCount": 0,
        "matchedCount": 1
    }
]

Insert new tickers :
[
{
        "acknowledged": true,
        "insertedId": "64c1e773829fa7a8bd04288e"
    },
    {
        "acknowledged": true,
        "insertedId": "64c1e773829fa7a8bd04288f"
    }
]
*/
const saveLatestTickerMetaDataToDb = async ({ cryptoData }) => {
    try {
        const db = await connect("Ticker meta fetch and save")
        console.time('find')
        const ticker_meta_collection = db.collection("binance_ticker_meta")
        const collection = await ticker_meta_collection.find().toArray()
        console.timeEnd('find')
        if (collection.length > 0) {
            // let cryptoData = await fetchTopTickerByMarketCap({ length })
            // Update existing tickers and insert new tickers
            let status = []
            for (const tickerData of cryptoData) {
                const existingTicker = collection.find(
                    (ticker) => ticker.symbol === tickerData.symbol
                );

                if (existingTicker) {
                    // Update existing ticker
                    let update = await ticker_meta_collection.updateOne(
                        { symbol: tickerData.symbol },
                        { $set: tickerData }
                    );
                    status.push(update)
                } else {
                    // Check if the market_cap_rank exists in the collection
                    const existingTickerByRank = collection.find(
                        (ticker) => ticker.market_cap_rank === tickerData.market_cap_rank
                    );

                    if (existingTickerByRank) {
                        // Replace the document with the same market_cap_rank
                        let replace = await ticker_meta_collection.replaceOne(
                            { market_cap_rank: tickerData.market_cap_rank },
                            tickerData
                        );
                        status.push(replace);
                    } else {
                        // Insert new ticker
                        let insert = await ticker_meta_collection.insertOne(tickerData);
                        status.push(insert);
                    }
                }
            }
            return status
        } else {
            console.time("market fullcap")
            // let cryptoData = await fetchTopTickerByMarketCap({ length })
            console.timeEnd("market fullcap")

            const insertedResult = await ticker_meta_collection.insertMany(cryptoData)
            return insertedResult
        }
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
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
        const db = await connect("Ticker meta fetch and save")
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
        console.log(error)
        throw new Error(error.message)
    }
}

const fetchTickersFromBinanceHistoricalDb = async ({ ticker_name, period, page_no, items_per_page }) => {
    try {
        const db = await binanceConnect("Fetching binance token data form binance_historical")
        const sortQuery = { openTime: -1 }
        const collection = db.collection(`${ticker_name}`)
        // Calculate the number of documents to skip based on the page number and items per page
        const skip = (page_no - 1) * items_per_page;
        console.time('fetching data from binance_historical')
        const tokenData = await collection.find({}).sort(sortQuery).skip(skip).limit(items_per_page).toArray();
        console.timeEnd('fetching data from binance_historical')
        let finalResult = []

        if (tokenData.length > 0) {
            let output = {}
            console.time('Adding date to token data - binance_historical')
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
            console.timeEnd('Adding date to token data - binance_historical')

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
        console.log(error)
        throw new Error(error.message)
    }
}

const fetchTickersFromCrypticsageBinance = async ({ dataSource, ticker_name, period, page_no, items_per_page }) => {
    try {
        const db = await connect("fetch token data");
        const tokenDataCollection = db.collection(`${dataSource}`);
        // Calculate the skip value based on the page number
        // const itemsPerPage = 10;
        const skip = (page_no - 1) * items_per_page;

        console.time('Fetch token data - crypticsage/binance')
        const tokenData = await tokenDataCollection.aggregate([
            { $match: { ticker_name: ticker_name } },
            { $project: { _id: 0, [`data.${period}.historical`]: 1 } },
            { $unwind: `$data.${period}.historical` },
            { $sort: { [`data.${period}.historical.openTime`]: -1 } },
            { $skip: skip },
            { $limit: items_per_page },
            {
                $project: {
                    openTime: `$data.${period}.historical.openTime`,
                    open: `$data.${period}.historical.open`,
                    high: `$data.${period}.historical.high`,
                    low: `$data.${period}.historical.low`,
                    close: `$data.${period}.historical.close`,
                    volume: `$data.${period}.historical.volume`,
                },
            },
        ]).toArray();
        console.timeEnd('Fetch token data - crypticsage/binance')

        if (tokenData.length > 0) {
            let output = {}
            console.time('Adding date - crypticsage/binance')
            tokenData.reverse()
            let converted = tokenData.map((item) => {
                return {
                    date: new Date(item?.openTime).toLocaleString(),
                    ...item,
                }
            })
            console.timeEnd('Adding date - crypticsage/binance')

            output['ticker_name'] = ticker_name
            output['period'] = period
            output['page_no'] = page_no
            output['items_per_page'] = items_per_page
            output['start_date'] = converted.slice(-1)[0].date
            output['end_date'] = converted[0].date
            output['total_count'] = converted.length
            output['ticker_data'] = converted

            return output
        }
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

const checkTickerMetaDuplicateData = async ({ ticker_name }) => {
    try {
        const db = await connect("Checking duplicate data")
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
            console.log("Duplicate documents found!");
            console.log("Duplicate groups:", duplicateGroups);
            return [duplicateGroups, testColl]
        } else {
            console.log("No duplicate documents based on the openTime key.");
            return []
        }
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    } finally {
        close("Checking duplicate data")
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
    , getAvailableYfTickersInDb
    , insertHistoricalYFinanceDate
    , getYFinanceTickerInfo
    , insertLatestYFinanceData
    , getAvailableBinanceTickersInDb
    , insertBinanceDataToDb
    , getFirstObjectForEachPeriod
    , updateBinanceDataToDb
    , getBinanceTickerNames
    , getTickersInBinanceDbMinutes
    , getLatestOneMTickerDataFromDb
    , insertOneMBinanceDataToDb
    , getData
    , checkDuplicateData
    , saveLatestTickerMetaDataToDb
    , fetchTickerMetaFromDb
    , fetchTickersFromBinanceHistoricalDb
    , fetchTickersFromCrypticsageBinance
    , checkTickerMetaDuplicateData
}