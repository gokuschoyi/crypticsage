const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const { createTimer } = require('../utils/timer')
const { v4: uuidv4 } = require('uuid');

const { Queue, Worker } = require('bullmq');
const { redisClient } = require('../services/redis')

const connection = redisClient

let update_OneBinanceTicker_Queue
let fetch_OneBinanceTicker_Queue

const MDBServices = require('./mongoDBServices')
const HDServices = require('./historicalDataServices')
const CMUtil = require('../utils/contentManagerUtil')
const CSUtil = require('../utils/cryptoStocksUtil')
const HDUtil = require('../utils/historicalDataUtil');

function findMissingNumbers(sequence) {
    // Sort the sequence
    sequence.sort((a, b) => a - b);

    const missingNumbers = [];

    // Iterate through the sorted sequence to find gaps
    for (let i = 0; i < sequence.length - 1; i++) {
        const currentNumber = sequence[i];
        const nextNumber = sequence[i + 1];

        // If there is a gap between the current and next number
        if (nextNumber - currentNumber > 1) {
            // Add missing numbers to the array
            for (let j = currentNumber + 1; j < nextNumber; j++) {
                missingNumbers.push(j);
            }
        }
    }

    return missingNumbers;
}

// Updating the binance ticker metadata
const serviceFetchAndSaveLatestTickerMetaData = async ({ length: f_length }) => {
    try {
        if (f_length === undefined) f_length = 0
        let tickerMeta = await MDBServices.getBinanceTickerList() // Fetching from DB

        const length = Math.max(f_length, tickerMeta.length) + 5 // Offset to prevent missing data / additional fetch
        let [cryptoData] = await CSUtil.fetchTopTickerByMarketCap({ length })

        // console.log('New ticker length', cryptoData.length)
        // console.log('Existing ticker length DB', tickerMeta.length)
        // console.log('---------------------')

        let final_ticker = cryptoData.filter((crypto) => {
            return tickerMeta.some((ticker) => {
                if (ticker.symbol === crypto.symbol) {
                    // console.log(crypto.market_cap_rank !== ticker?.market_cap_rank ? 'Rank mismatch' : 'Rank matched', crypto?.name, ticker?.name)
                    return true;
                }
                return false;
            });
        });

        // console.log('---------------------')
        // console.log('Matched ticker (New) length', final_ticker.length)

        // Filtering out the tickers that ranked lower or were delisted/no info exists 
        const no_rank = tickerMeta.filter(ticker => !final_ticker.some(item => item.symbol === ticker.symbol))
        // console.log('No rank (Match between new and DB)', no_rank.length)

        if (no_rank.length > 0) {
            log.info('Additional ticker fetch to check')
            let [additional_ticker] = await CSUtil.fetchTopTickerByMarketCap({ length: 2 * length })
            console.log('Additional fetch length', additional_ticker.length)
            additional_ticker.forEach((crypto) => {
                const matched_no_rank = no_rank.find((ticker) => ticker.symbol === crypto.symbol)
                if (matched_no_rank) {
                    // console.log('matched')
                    final_ticker.push(crypto) // ticker info found in extra fetch
                }
            })
        }

        // Checking if additional fetch filled the no_rank list
        if (tickerMeta.length > final_ticker.length) {
            // console.log('No data after additional fetch, remove from db')
            for (const ticker of no_rank) {
                await MDBServices.deleteOneMetaData(ticker.symbol);
            }
        }
        // console.log('Matched ticker length', final_ticker.length)

        final_ticker = final_ticker.sort((a, b) => a.market_cap_rank - b.market_cap_rank)

        const ranks = final_ticker.map((item) => item.market_cap_rank)
        const missing_numbers = findMissingNumbers(ranks)
        log.info(`Missing numbers ${missing_numbers}`)

        missing_numbers.forEach((item) => {
            const missing_ticker_data = cryptoData.find((ticker) => ticker.market_cap_rank === item)
            final_ticker.push(missing_ticker_data)
        })

        final_ticker = final_ticker.sort((a, b) => a.market_cap_rank - b.market_cap_rank)
        // final_ticker.forEach((item) => { console.log(item.market_cap_rank, item.name) })

        const symbols_ = final_ticker.map((item) => item.symbol)

        let result = await MDBServices.saveOrUpdateTickerMeta(final_ticker)
        return [result, symbols_]
        // return final_ticker
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// fetching an updating binance ticker info meta
const serviceFetchAndUpdateBinanceTickerInfoMeta = async (symbols) => {
    try {
        let final_ticker_info_list = []
        for (let i = 0; i < symbols.length; i++) {
            const info = await CSUtil.fetchDataBySymbol({ symbol: symbols[i] })
            log.info(`Fetched data for ${symbols[i]}`)
            final_ticker_info_list.push({ symbol: symbols[i], info })
        }

        let result = await MDBServices.saveOrUpdateTickerInfoMeta(final_ticker_info_list)
        return result
    } catch (err) {
        log.error(err.stack)
        throw err
    }
}

/**
 * This returns a dictionary with a `table` _key_ and a `database` _key_.
 *
 * @param {Array} params - An array of 2 elements
 * @return {{table: string, database: string}} - The database and table to query
 */
const parseTableAndDb = (params) => {
    return { table: params[0], database: params[1] };
}

// needs rework after db changes
/**
 * 
 * Retrieve information about tickers and their data.
 * @async
 * @returns {Promise<
 * [
 *      totalTickerCountInDb:number,
 *      totalTickersWithDataToFetch:number,
 *      tickersWithHistData:Array,
 *      tickersWithNoHistData:Array,
 *      tickerWithNoDataInBinance:Array
 * ]
 * >} An array containing various ticker-related data.
 */
const serviceGetBinanceTickerStatsFromDb = async () => {
    try {
        const length = ''
        let tickerMeta = await MDBServices.fetchTickerMetaFromDb(length)
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
        const collection_name = 'binance_metadata'
        let tickersWithHistData = await MDBServices.getFirstObjectForEachPeriod(collection_name)

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

        let totalTickerCountInDb = tickerMeta.length
        let totalTickersWithDataToFetch = finalRes.length

        let tickersWithNoHistData = finalRes.filter(item1 => !tickersWithHistData.map(item2 => item2.ticker_name).includes(item1.ticker_name));

        return [
            totalTickerCountInDb,
            totalTickersWithDataToFetch,
            updatedTickersWithHistData,
            tickersWithNoHistData,
            tickerWithNoDataInBinance
        ]
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const serviceGetYfinanceTickerStatsFromDb = async () => {
    try {
        const collection_name = 'yfinance_metadata'
        let yFTickerInfo = await MDBServices.getFirstObjectForEachPeriod(collection_name)
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
    const queueName = "Fetch-One-Binance-Ticker"

    let newDate = new Date().toLocaleString()
    let [date, time] = newDate.split(", ")
    let [t, ap] = time.split(" ")

    let greaterThan4h = fetchQueries.map((queries) => {
        return {
            ...queries,
            id: `${uuidv4()}_${date}_${t}_${ap}_${queries.ticker_name}_${queries.period}`,
            jobName: `Fetch-One-Binance-Ticker_${queries.ticker_name}_${queries.period}_FE-Request`
        }
    })

    try {
        const t = createTimer("Fetch-One-Binance-Ticker-FE-Request - Main Process")
        t.startTimer()

        const fetchOneBinanceTickerQueue = new Queue(queueName, { connection })
        const fetchOneBinanceTickerWorker = new Worker(queueName, HDUtil.processHistoricalData, { connection })

        fetch_OneBinanceTicker_Queue = fetchOneBinanceTickerQueue
        totalFetchJobsCount = greaterThan4h.length

        const fetchCompletedListener = () => {
            completedFetchJobsCount++;
            if (completedFetchJobsCount < totalFetchJobsCount) {
                log.info(`(WORKER - Fetch Single-Fetch) Fetch job count : ${completedFetchJobsCount}`);
            } else {
                log.info(`(WORKER - Fetch Single-Fetch) Fetch job count Final Task : ${completedFetchJobsCount}`);
                t.stopTimer(__filename.slice(__dirname.length + 1))
                // fetchOneBinanceTickerWorker.close();
                fetchOneBinanceTickerWorker.removeListener('completed', fetchCompletedListener); // Remove the listener
            }
        }


        const failedListener = (job) => {
            const redisCommand = `hgetall bull:${queueName}:${job.id}`
            log.error(`Update task failed for : ${job.name}, with id :  ${job.id}`)
            log.warn(`Check Redis for more info : ${redisCommand}`)
        }

        fetchOneBinanceTickerWorker.on('completed', fetchCompletedListener);
        fetchOneBinanceTickerWorker.on('failed', failedListener);

        // Log any errors that occur in the worker, updates
        fetchOneBinanceTickerWorker.on('error', error => {
            // log the error
            log.error(error.stack)
        });

        for (const index in greaterThan4h) {
            const {
                jobName,
                ticker_name,
                period,
                id,
                meta
            } = greaterThan4h[index]

            const job = await fetchOneBinanceTickerQueue.add(
                jobName,
                { ticker: ticker_name, period, meta },
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

        finalResult["check_status_payload"] = {
            jobIds: jobIDs,
            type: "fetch-one-ticker_"
        }
        finalResult["total_actual_feches"] = greaterThan4h.length + 1
        finalResult["fetch_queries"] = greaterThan4h

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
    const queueName = "Update-One-Binance-Ticker-Queue"

    let idNameAdded = updateQueries.map((queries) => {
        const { ticker_name, period, start } = queries
        let newDate = new Date().toLocaleString()
        let [date, time] = newDate.split(", ")
        let [t, ap] = time.split(" ")
        return {
            ticker_name,
            period,
            start,
            end: HDUtil.calculateUpdateTickerEndDate({ openTime: start, period }),
            id: `${uuidv4()}_${date}_${t}_${ap}_${queries.ticker_name}_${queries.period}`,
            jobName: `Update-One-Binance-Ticker_${queries.ticker_name}_${queries.period}_FE-Request`
        }
    })

    let added = idNameAdded

    try {
        const t = createTimer("Update-One-Binance-Ticker-FE-Request - Main Process")
        t.startTimer()

        const updateOneBinanceTickerQueue = new Queue(queueName, { connection })
        const updateOneBinanceTickerWorker = new Worker(queueName, HDUtil.processUpdateHistoricalData, { connection })

        update_OneBinanceTicker_Queue = updateOneBinanceTickerQueue

        totalUpdateJobsCount = added.length

        const updateCompletedListener = () => {
            completedUpdateJobsCount++;
            if (completedUpdateJobsCount < totalUpdateJobsCount) {
                log.info(`(WORKER - Update single ticker) Update job count : ${completedUpdateJobsCount}`);
            } else {
                log.info(`(WORKER - Update single ticker) Update job count Final Task : ${completedUpdateJobsCount}`);
                t.stopTimer(__filename.slice(__dirname.length + 1))
                // updateOneBinanceTickerWorker.close();
                updateOneBinanceTickerWorker.removeListener('completed', updateCompletedListener); // Remove the listener
            }
        }

        const failedListener = (job) => {
            const redisCommand = `hgetall bull:${queueName}:${job.id}`
            log.error(`Update task failed for : ", ${job.name}, " with id : ", ${job.id}`)
            log.warn(`Check Redis for more info : ", ${redisCommand}`)
        }

        updateOneBinanceTickerWorker.on('completed', updateCompletedListener);
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
            const message = "Update tasks added to queue. (Post fetch update)"
            return ({ message, finalResult });
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}
const updateDbWithNewTickerInfo = async ({ type, ticker_name, period, token_data }) => {
    try {
        await MDBServices.insertHistoricalDataToDb(type, ticker_name, period, token_data)
        let metadata = {
            latest: token_data[token_data.length - 1],
            updatedCount: token_data.length,
        }
        await MDBServices.updateTickerMetaData(type, ticker_name, period, metadata)
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const serviceGetLatestTickerDataForUser = async ({ updateQueries }) => {
    try {
        const { ticker_name, period, start, end } = updateQueries
        const type = "crypto"
        let result = await HDUtil.fetchBinanceHistoricalBetweenPeriods({ ticker_name, period, start, end })
        updateDbWithNewTickerInfo({ type, ticker_name, period, token_data: result })
        return result
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const serviceUpdateTickerWithOneDataPoint = async ({ fetchQuery }) => {
    try {
        const { ticker_name, period, start, end } = fetchQuery
        const type = "crypto"
        let result = await HDUtil.fetchData({ ticker_name, period, start, end, type: 'Fetch One Ticker' })
        let converted = HDUtil.convertData(result)
        if (converted.length === 0) {
            log.info(`No data for ${ticker_name} - ${period} - ${start} - ${end}`)
        } else {
            updateDbWithNewTickerInfo({ type, ticker_name, period, token_data: converted })
        }
        return converted
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const serviceUpdateAllBinanceTickers = async () => {
    try {
        let greaterThan4h = await HDServices.processUpdateBinanceData()
        let finalIds = {
            "ids": greaterThan4h.finalResult.check_status_payload
        }
        return finalIds
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const serviceCheckOneBinanceTickerJobCompletition = async ({ jobIds, type }) => {
    try {
        let message = ""
        let data = []
        const processedResults = []
        switch (type) {
            case "update-one-ticker_":
                for (const jobId of jobIds) {
                    const job = await update_OneBinanceTicker_Queue.getJob(jobId)
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
                    const job = await fetch_OneBinanceTicker_Queue.getJob(jobId)
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
    try {
        let documents = await MDBServices.getAllDocumentsFromCollection(collectionName, filter)
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
    }
}

// Fetches from collection - addSection, addLesson, addQuizQuestions
// Adds new document to the database
// INPUT : { title, content, url }
const serviceAddDocuments = async ({ collectionName, document }) => {
    try {
        let insertedResult = await MDBServices.insertDocumentToCollection(collectionName, document)
        let statusResult = null
        let sectionId = null
        let lessonId = null
        let lessonData = null
        let quizId = null
        let quizTitle = null
        switch (collectionName) {
            case "sections":
                ({ sectionId } = document)
                statusResult = await MDBServices.addSectionStatusForUsers(sectionId)
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
                statusResult = await MDBServices.addLessonStatusForUsers(sectionId, lesson_status)
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
                statusResult = await MDBServices.addQuizStatusForUsers(sectionId, lessonId, quizObject)
                break;
            default:
                break;
        }
        return [insertedResult, statusResult]
    } catch (error) {
        log.error(error.stack)
        throw error
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

    try {
        const collectionName = "sections"
        const id = sectionId
        await MDBServices.checkForDocumentInCollection(collectionName, id)
        const updated = await MDBServices.updateSectionData(title, content, url, sectionId)
        return updated
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// updates an existing lesson in the database. Have to add updates to lesson status for users
const serviceUpdateLessonInDb = async ({ chapter_title, lessonData, lessonId, sectionId }) => {

    try {
        const collectionName = "lessons"
        const id = lessonId
        await MDBServices.checkForDocumentInCollection(collectionName, id)
        const updated = await MDBServices.updateLessonData(chapter_title, lessonData, lessonId)
        const lessonTitleStatus = await MDBServices.updateLessonNameChangeAcrossUsersStatus(sectionId, lessonId, chapter_title)
        return [updated, lessonTitleStatus]
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// updates an existing quiz in the database. Have to add updates to quiz status for users
const serviceUpdateQuizInDb = async ({ quizId, quizTitle, quizDescription, questions }) => {
    try {
        const collectionName = "quiz"
        const id = quizId
        await MDBServices.checkForDocumentInCollection(collectionName, id)
        const [update, reqData] = await MDBServices.updateQuizData(quizId, quizTitle, quizDescription, questions)
        const { sectionId, lessonId } = reqData
        const quizTitleStatus = await MDBServices.updateQuizNameChangeAcrossUsersStatus(sectionId, lessonId, quizId, quizTitle)
        return [update, quizTitleStatus]
    } catch (error) {
        log.error(error.stack)
        throw error
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

    try {
        const collectionName = "sections"
        const deleteCollectionNameLessons = 'lessons'
        const deleteCollectionNameQuiz = 'quiz'
        const type = "sectionDelete"
        const id = sectionId
        await MDBServices.checkForDocumentInCollection(collectionName, id)

        const deletedSection = await MDBServices.deleteOneDocumentFromCollection(collectionName, id)
        const deletedLessons = await MDBServices.deleteManyDocumentsFromCollection(type, deleteCollectionNameLessons, sectionId)
        const deletedQuiz = await MDBServices.deleteManyDocumentsFromCollection(type, deleteCollectionNameQuiz, sectionId)
        const removedLessonAndQuizStatus = await MDBServices.removeLessonAndQuizStatusFromUsers(sectionId)
        return [deletedSection, deletedLessons, deletedQuiz, removedLessonAndQuizStatus]
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const serviceDeleteLessonFromDb = async ({ lessonId, sectionId }) => {
    try {
        const collectionName = "lessons"
        const id = lessonId
        const type = "lessonDelete"
        const deleteCollectionNameQuiz = 'quiz'
        await MDBServices.checkForDocumentInCollection(collectionName, id)

        const deleteLesson = await MDBServices.deleteOneDocumentFromCollection(collectionName, id)
        const deletedQuiz = await MDBServices.deleteManyDocumentsFromCollection(type, deleteCollectionNameQuiz, lessonId)
        const deletedLessonStatusFromUser = await MDBServices.removeOneLessonAndQuizStatusFromUsers(sectionId, lessonId)
        return [deleteLesson, deletedQuiz, deletedLessonStatusFromUser]
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const serviceDeleteQuizFromDb = async ({ quizId, sectionId, lessonId }) => {
    try {
        const collectionName = "quiz"
        const id = quizId
        await MDBServices.checkForDocumentInCollection(collectionName, id)

        const deleteQuiz = await MDBServices.deleteOneDocumentFromCollection(collectionName, id)
        const deleteQuizStatusFromUser = await MDBServices.removeQuizStatusFromUser(quizId, lessonId, sectionId)
        return [deleteQuiz, deleteQuizStatusFromUser]
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}


module.exports = {
    serviceFetchAndSaveLatestTickerMetaData
    , serviceFetchAndUpdateBinanceTickerInfoMeta
    , serviceGetBinanceTickerStatsFromDb
    , serviceGetYfinanceTickerStatsFromDb
    , serviceFetchOneBinanceTicker
    , serviceUpdateOneBinanceTicker
    , serviceGetLatestTickerDataForUser
    , serviceUpdateTickerWithOneDataPoint
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