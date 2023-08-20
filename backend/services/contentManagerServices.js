const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const { v4: uuidv4 } = require('uuid');

const { Queue, Worker } = require('bullmq');
const { close } = require('../services/db-conn')
const { redisClient } = require('../services/redis')

const connection = redisClient
let update_OneBinanceTicker_Queue
let update_OneBinanceTicker_oneM_Queue

let fetch_OneBinanceTicker_Queue
let fetch_OneBinanceTicker_oneM_Queue

const MDBServices = require('./mongoDBServices')
const HDServices = require('./historicalDataServices')
const CMUtil = require('../utils/contentManagerUtil')
const CSUtil = require('../utils/cryptoStocksUtil')
const HDUtil = require('../utils/historicalDataUtil');

const serviceFetchAndSaveLatestTickerMetaData = async ({ length }) => {
    try {
        let cryptoData = await CSUtil.fetchTopTickerByMarketCap({ length })
        let result = await MDBServices.saveLatestTickerMetaDataToDb({ cryptoData })
        return result
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const serviceGetBinanceTickerStatsFromDb = async () => {
    try {
        let tickerMeta = await MDBServices.fetchTickerMetaFromDb({ length: "" })
        let symbolsFromBinance = await CMUtil.fetchSymbolsFromBinanceAPI()

        let tickerNameAdded = tickerMeta.map((ticker) => {
            const matched = symbolsFromBinance.find((symbol) => symbol.baseAsset === ticker.symbol && symbol.quoteAsset === "USDT")
            return {
                ...ticker,
                ticker_name: matched ? matched.symbol : null,
            }
        })

        let tickerWithNoDataInBinance = tickerNameAdded.filter((item) => item.ticker_name === null)
        let finalRes = tickerNameAdded.filter((item) => item.ticker_name !== null)
        let tickersWithHistData = await MDBServices.getFirstObjectForEachPeriod({ collection_name: 'binance' })

        const findMatchingObject = (tickerName) => {
            return finalRes.find((item) => item.ticker_name === tickerName);
        };

        // Map over tickersWithHistData and add the matching object from finalRes to the new key "data"
        let updatedTickersWithHistData = tickersWithHistData.map((tickerData) => {
            const matchingObject = findMatchingObject(tickerData.ticker_name);
            if (matchingObject) {
                return {
                    meta: matchingObject,
                    ...tickerData,
                };
            }
            return tickerData;
        });

        let bHistData = await MDBServices.getDetailsFromBinanceHistorical()

        let totalTickerCountInDb = tickerMeta.length
        let totalTickersWithDataToFetch = finalRes.length

        updatedTickersWithHistData.map((item) => {
            let tickerName = item.ticker_name
            const matchingData = bHistData.find((data) => data.ticker_name === item.ticker_name);
            if (matchingData) {
                const newData = { "1m": matchingData[tickerName], ...item.data };
                item.data = newData;
            }
        })

        let tickersWithNoHistData = finalRes.filter(item1 => !tickersWithHistData.map(item2 => item2.ticker_name).includes(item1.ticker_name));

        return [totalTickerCountInDb, totalTickersWithDataToFetch, updatedTickersWithHistData, tickersWithNoHistData, tickerWithNoDataInBinance]
    } catch (error) {
        log.error(error.stack)
        throw error
    } finally {
        close("Fetch Ticker Stats")
    }
}

const serviceGetYfinanceTickerStatsFromDb = async () => {
    try {
        let yFTickerInfo = await MDBServices.getFirstObjectForEachPeriod({ collection_name: 'yFinance_new' })
        return yFTickerInfo
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// fullfetch one ticker
const serviceFetchOneBinanceTicker = async ({ fetchQueries }) => {
    var totalFetchJobsCount = 0;
    var completedFetchJobsCount = 0;
    const finalResult = {}
    const jobIDs = []
    const queueName = "Fetch-One-Binance-Ticker>4h"
    const queueName2 = "Fetch-One-Binance-Ticker-1m"

    let greaterThan4h = fetchQueries.map((queries) => {
        let newDate = new Date().toLocaleString()
        let [date, time] = newDate.split(", ")
        let [t, ap] = time.split(" ")
        return {
            ...queries,
            id: `${uuidv4()}_${date}_${t}_${ap}_${queries.ticker_name}_${queries.period}`,
            jobName: `Fetch-One-Binance-Ticker_${queries.ticker_name}_${queries.period}_FE-Request`
        }
    })

    let oneMQuery = {
        ticker_name: fetchQueries[0].ticker,
        period: "1m",
        id: uuidv4(),
        jobName: `Fetch-One-Binance-Ticker_${fetchQueries[0].ticker}_1m_FE-Request`,
    }

    try {
        console.time("Fetch-One-Binance-Ticker-FE-Request - Main Process (>= 4h)")

        const fetchOneBinanceTickerQueue = new Queue(queueName, { connection })
        const fetchOneBinanceTickerWorker = new Worker(queueName, HDUtil.processHistoricalData, { connection })

        const fetchOneBinanceTickerQueue2 = new Queue(queueName2, { connection })
        const fetchOneBinanceTickerWorker2 = new Worker(queueName2, HDUtil.processOneMHistoricalData, { connection })

        const { ticker_name, period, jobName, id } = oneMQuery

        const job2 = await fetchOneBinanceTickerQueue2.add(
            jobName,
            { ticker_name, period },
            {
                removeOnComplete: {
                    age: 3600, // keep up to 1 min
                    count: 1000, // keep up to 1000 jobs
                },
                removeOnFail: {
                    age: 3600, // keep up to 1 min
                },
                jobId: id,
                delay: 200
            }
        )

        fetch_OneBinanceTicker_Queue = fetchOneBinanceTickerQueue
        fetch_OneBinanceTicker_oneM_Queue = fetchOneBinanceTickerQueue2
        totalFetchJobsCount = greaterThan4h.length + 1

        const fetchCompletedListener = () => {
            completedFetchJobsCount++;
            if (completedFetchJobsCount < totalFetchJobsCount) {
                log.info(`(WORKER - Fetch >= 4h) Fetch job count : ${completedFetchJobsCount}`);
            } else {
                log.info(`(WORKER - Fetch >= 4h) Fetch job count Final Task : ${completedFetchJobsCount}`);
                console.timeEnd('Fetch-One-Binance-Ticker-FE-Request - Main Process (>= 4h)');
                close("Fetching data (>= 4h)")
                fetchOneBinanceTickerWorker.close();
                fetchOneBinanceTickerWorker.removeListener('completed', fetchCompletedListener); // Remove the listener
            }
        }

        const fetchCompletedListener2 = () => {
            completedFetchJobsCount++;
            log.info(`(WORKER - Fetch 1m) Fetch job count : ${completedFetchJobsCount}`);
            fetchOneBinanceTickerWorker2.close();
            fetchOneBinanceTickerWorker2.removeListener('completed', fetchCompletedListener2); // Remove the listener
        }

        const failedListener = (job) => {
            const redisCommand = `hgetall bull:${queueName}:${job.id}`
            log.error(`Update task failed for : ${job.name}, with id :  ${job.id}`)
            log.warn(`Check Redis for more info : ${redisCommand}`)
        }

        fetchOneBinanceTickerWorker.on('completed', fetchCompletedListener);
        fetchOneBinanceTickerWorker2.on('completed', fetchCompletedListener2);
        fetchOneBinanceTickerWorker.on('failed', failedListener);

        // Log any errors that occur in the worker, updates
        fetchOneBinanceTickerWorker.on('error', error => {
            // log the error
            log.error(error.stack)
        });

        for (const index in greaterThan4h) {
            const {
                jobName,
                ticker,
                period,
                id,
                meta
            } = greaterThan4h[index]

            const job = await fetchOneBinanceTickerQueue.add(
                jobName,
                { ticker, period, meta },
                {
                    removeOnComplete: {
                        age: 3600, // keep up to 1 min
                        count: 1000, // keep up to 1000 jobs
                    },
                    removeOnFail: {
                        age: 3600, // keep up to 1 min
                    },
                    jobId: id,
                }
            );

            const jobId = job.id
            jobIDs.push(jobId)
        }

        jobIDs.push(job2.id)

        finalResult["check_status_payload"] = {
            jobIds: jobIDs,
            type: "fetch-one-ticker_"
        }
        finalResult["total_actual_feches"] = greaterThan4h.length + 1
        finalResult["fetch_queries"] = greaterThan4h.push(oneMQuery)

        const isActive = fetchOneBinanceTickerWorker.isRunning();
        if (isActive) {
            const message = "Processing one ticker fetch request"
            return ({ message, finalResult });
        } else {
            fetchOneBinanceTickerWorker.run()
            const message = "Fetch tasks added to queue. (Initial Fetch)"
            return ({ message, finalResult });
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// updates one ticker
const serviceUpdateOneBinanceTicker = async ({ updateQueries }) => {
    var totalUpdateJobsCount = 0;
    var completedUpdateJobsCount = 0;
    const finalResult = {}
    const jobIDs = []
    const queueName = "Update-One-Binance-Ticker-Queue>4h"
    const queueName2 = "Update-One-Binance-Ticker-Queue-1m"

    let idNameAdded = updateQueries.map((queries) => {
        let newDate = new Date().toLocaleString()
        let [date, time] = newDate.split(", ")
        let [t, ap] = time.split(" ")
        return {
            ...queries,
            id: `${uuidv4()}_${date}_${t}_${ap}_${queries.ticker_name}_${queries.period}`,
            jobName: `Update-One-Binance-Ticker_${queries.ticker_name}_${queries.period}_FE-Request`
        }
    })

    let added = idNameAdded.filter((item) => item.period !== '1m')

    let oneM = idNameAdded.filter((item) => item.period === '1m')

    try {
        console.time("Update-One-Binance-Ticker-FE-Request - Main Process (>= 4h)")

        const updateOneBinanceTickerQueue = new Queue(queueName, { connection })
        const updateOneBinanceTickerWorker = new Worker(queueName, HDUtil.processUpdateHistoricalData, { connection })

        const updateOneBinanceTickerQueue2 = new Queue(queueName2, { connection })
        const updateOneBinanceTickerWorker2 = new Worker(queueName2, HDUtil.processUpdateHistoricalOneMData, { connection })

        update_OneBinanceTicker_Queue = updateOneBinanceTickerQueue
        update_OneBinanceTicker_oneM_Queue = updateOneBinanceTickerQueue2
        totalUpdateJobsCount = added.length + oneM.length

        const updateCompletedListener = () => {
            completedUpdateJobsCount++;
            if (completedUpdateJobsCount < totalUpdateJobsCount) {
                log.info(`(WORKER - Update >= 4h) Update job count : ${completedUpdateJobsCount}`);
            } else {
                log.info(`(WORKER - Update >= 4h) Update job count Final Task : ${completedUpdateJobsCount}`);
                console.timeEnd('Update-One-Binance-Ticker-FE-Request - Main Process (>= 4h)');
                close("Fetching data (>= 4h)")
                updateOneBinanceTickerWorker.close();
                updateOneBinanceTickerWorker.removeListener('completed', updateCompletedListener); // Remove the listener
            }
        }

        const updateCompletedListener2 = () => {
            completedUpdateJobsCount++;
            log.info(`(WORKER - Update 1m) Update job count : ${completedUpdateJobsCount}`);
            updateOneBinanceTickerWorker2.close();
            updateOneBinanceTickerWorker2.removeListener('completed', updateCompletedListener2); // Remove the listener
        }

        const failedListener = (job) => {
            const redisCommand = `hgetall bull:${queueName}:${job.id}`
            log.error(`Update task failed for : ", ${job.name}, " with id : ", ${job.id}`)
            log.warn(`Check Redis for more info : ", ${redisCommand}`)
        }

        updateOneBinanceTickerWorker.on('completed', updateCompletedListener);
        updateOneBinanceTickerWorker2.on('completed', updateCompletedListener2);
        updateOneBinanceTickerWorker.on('failed', failedListener);

        // Log any errors that occur in the worker, updates
        updateOneBinanceTickerWorker.on('error', error => {
            // log the error
            log.error(error.stack)
        });

        for (const index in added) {
            const {
                ticker_name,
                period,
                start,
                end,
                id,
                jobName,
            } = added[index]

            const job = await updateOneBinanceTickerQueue.add(
                jobName,
                { ticker_name, period, start, end },
                {
                    removeOnComplete: {
                        age: 3600, // keep up to 1 hr
                        count: 1000, // keep up to 1000 jobs
                    },
                    removeOnFail: {
                        age: 3600, // keep up to 1 hr
                    },
                    jobId: id,
                }
            )
            const jobId = job.id
            jobIDs.push(jobId)
        }

        const { ticker_name, period, start, end, id, jobName } = oneM[0]
        // log.info({ticker_name, period, start, end, id, jobName})
        const job2 = await updateOneBinanceTickerQueue2.add(
            jobName,
            { ticker_name, period, start, end },
            {
                removeOnComplete: {
                    age: 3600, // keep up to 1 hr
                    count: 1000, // keep up to 1000 jobs
                },
                removeOnFail: {
                    age: 3600, // keep up to 1 hr
                },
                jobId: id,
                delay: 200
            }
        )

        jobIDs.push(job2.id)

        finalResult["check_status_payload"] = {
            jobIds: jobIDs,
            type: "update-one-ticker_"
        }
        finalResult["total_actual_updates"] = added.length
        finalResult["update_queries"] = added

        const isActive = updateOneBinanceTickerWorker.isRunning();
        if (isActive) {
            const message = "Processing one ticker update request"
            return ({ message, finalResult });
        } else {
            updateOneBinanceTickerWorker.run()
            const message = "Update tasks added to queue. (Initial Fetch)"
            return ({ message, finalResult });
        }

    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// updates all tickers in the database
const serviceUpdateAllBinanceTickers = async () => {
    try {
        let greaterThan4h = await HDServices.processUpdateBinanceData()
        let lessThan4h = await HDServices.processUpdateBinanceOneMData()
        let finalIds = {
            "1m": lessThan4h.finalResult.check_status_payload,
            "4h": greaterThan4h.finalResult.check_status_payload
        }
        return finalIds
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const serviceCheckOneBinanceTickerJobCompletition = async ({ jobIds, type }) => {
    try {
        const processedResults = []
        switch (type) {
            case "update-one-ticker_":
                for (const jobId of jobIds) {
                    const job = await update_OneBinanceTicker_Queue.getJob(jobId) || await update_OneBinanceTicker_oneM_Queue.getJob(jobId);
                    if (job !== undefined) {
                        const result = await job.isCompleted();
                        const jobName = job.name
                        processedResults.push({ jobId: jobId, completed: result, jobName: jobName, data: job.returnvalue })
                    }
                }
                message = `Job status for ${type}`
                data = processedResults
                break;
            case "fetch-one-ticker_":
                for (const jobId of jobIds) {
                    const job = await fetch_OneBinanceTicker_Queue.getJob(jobId) || await fetch_OneBinanceTicker_oneM_Queue.getJob(jobId);
                    if (job !== undefined) {
                        const result = await job.isCompleted();
                        const jobName = job.name
                        processedResults.push({ jobId: jobId, completed: result, jobName: jobName, data: job.returnvalue })
                    }
                }
                message = `Job status for ${type}`
                data = processedResults
                break;
            default:
                return ({ message: "Invalid type", data: [] })
        }
        return ({ message, data })
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

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
        log.error(error.stack)
        throw error
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
        log.error(error.stack)
        throw error
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
        log.error(error.stack)
        throw error
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
        log.error(error.stack)
        throw error
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
        log.error(error.stack)
        throw error
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
        log.error(error.stack)
        throw error
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
        log.error(error.stack)
        throw error
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
        log.error(error.stack)
        throw error
    } finally {
        close(connectMessage)
    }
}


module.exports = {
    serviceFetchAndSaveLatestTickerMetaData
    , serviceGetBinanceTickerStatsFromDb
    , serviceGetYfinanceTickerStatsFromDb
    , serviceFetchOneBinanceTicker
    , serviceUpdateOneBinanceTicker
    , serviceUpdateAllBinanceTickers
    , serviceCheckOneBinanceTickerJobCompletition
    , serviceGetDocuments
    , serviceAddDocuments
    , serviceUdpateSectionInDb
    , serviceUpdateLessonInDb
    , serviceUpdateQuizInDb
    , serviceDeleteSectionFromDb
    , serviceDeleteLessonFromDb
    , serviceDeleteQuizFromDb
}