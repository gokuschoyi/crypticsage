const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const { createTimer } = require('../utils/timer')
const { Queue, Worker } = require('bullmq');
const { close, binanceClose } = require('../services/db-conn')
const { redisClient } = require('../services/redis')

const MDBServices = require('../services/mongoDBServices')
const HDUtil = require('../utils/historicalDataUtil')

const connection = redisClient // Create a Redis connection
let IFTaskQueue;
let UTaskQueue;
let IFOMTaskQueue;
let UOMTaskQueue;


const processInitialSaveHistoricalDataYFinance = async ({ tickersList, periods }) => {
    const connectMessage = "Initial-YF Historical Data Fetch"
    try {
        let availableTickers = await MDBServices.getAvailableYfTickersInDb({ connectMessage })
        let tickers = tickersList.filter((ticker) => {
            return !availableTickers.some((obj) => obj.ticker_name === ticker)
        })
        let uploadStatus = {};
        if (tickers.length > 0) {
            const toDate = '2023-07-03' // HDUtil.formatDateForYFinance(new Date().toLocaleString())

            for (let i = 0; i < tickers.length; i++) {
                let tickerData = {
                    ticker_name: tickers[i],
                    data: {}
                }
                let fromDate
                const startDate = await HDUtil.getFirstTradeDate({ symbol: tickers[i] })
                if (startDate === undefined) {
                    const customError = new Error(`No start date for ${tickers[i]}`)
                    customError.failReason = "No start date"
                    throw customError
                } else {
                    const newD = new Date(startDate).toLocaleString()
                    fromDate = HDUtil.formatDateForYFinance(newD)

                    log.info(fromDate)

                    uploadStatus[tickers[i]] = {}
                    for (let j = 0; j < periods.length; j++) {
                        let params = {
                            ticker_name: tickers[i],
                            from: fromDate,
                            to: toDate,
                            period: periods[j]
                        }
                        let yFResult = await HDUtil.getHistoricalYFinanceData(params)
                        if (yFResult.length === 0) {
                            uploadStatus[tickers[i]][periods[j]] = 0
                            log.info(`No data found for ${tickers[i]} with period ${periods[j]}`)
                        } else {
                            uploadStatus[tickers[i]][periods[j]] = yFResult.length
                            const lastElementInArray = yFResult[yFResult.length - 1]
                            const lastUpdateDate = new Date(lastElementInArray.date)
                            tickerData.data[periods[j]] = {
                                historical: yFResult,
                                last_updated: lastUpdateDate
                            }
                        }
                    }
                }
                await MDBServices.insertHistoricalYFinanceDate({ tickerData, connectMessage: "Insert-YF Historical Data" })
            }
        }
        return [uploadStatus, availableTickers, tickers]
    } catch (error) {
        log.error(error.stack)
        throw error
    } finally {
        close(connectMessage)
    }
}

const processUpdateHistoricalYFinanceData = async ({ symbol }) => {
    const connectMessage = "Update-YF Historical Data"
    try {
        let diffArray = []
        let yfTickersInDb = await MDBServices.getYFinanceTickerInfo({ connectMessage: "Feching ticker data from yFinance" })
        let yfTickers
        if (symbol === 'all') {
            yfTickers = yfTickersInDb
        } else {
            yfTickers = yfTickersInDb.filter((val) => val.ticker_name === symbol)
        }
        for (const ticker of yfTickers) {
            log.info("-------------------------------------------------------")
            const { _id, period, ticker_name, last_updated, last_historicalData } = ticker

            let updateCount, yFResult, latestTickerDatafromYF, insertData
            const cfu = await HDUtil.checkForUpdates({ last_updated })
            const [daysElapsed] = cfu

            if (daysElapsed > 1) {
                const [daysElapsed, from, to] = cfu
                log.info(`${ticker_name} with period ${period} needs update from ${(new Date(last_updated).toLocaleString().split(', ')[0])}, days: ${Math.round(daysElapsed)} `)
                let params = {}
                if (period === '1mo') {
                    const [y, m, d] = from.split('-')
                    const fromDate = `${y}-${m}-01`
                    params = {
                        ticker_name: ticker_name,
                        from: fromDate,
                        to: to,
                        period: period
                    }
                } else {
                    params = {
                        ticker_name: ticker_name,
                        from: from,
                        to: to,
                        period: period
                    }
                }
                yFResult = await HDUtil.getHistoricalYFinanceData(params)
                latestTickerDatafromYF = yFResult.filter((val) => new Date(val.date).getTime() > new Date(last_historicalData.date).getTime())
                updateCount = latestTickerDatafromYF.length
                log.info(`New data length : ${updateCount}`)
                if (updateCount > 0) {
                    insertData = await MDBServices.insertLatestYFinanceData({ _id: _id, period: period, data: latestTickerDatafromYF, connectMessage: "Inserting latest YF data" })
                    diffArray.push({
                        ticker_name: ticker_name,
                        period: period,
                        count: updateCount,
                        insertData
                    })
                } else {
                    log.info("No new data")
                }
            } else {
                log.info(`${ticker_name} with period ${period} is upto date : ${daysElapsed}`)
                diffArray.push({
                    ticker_name: ticker_name,
                    period: period,
                    count: updateCount || 0,
                    newTickerData: latestTickerDatafromYF || [],
                    insertData: insertData || 0
                })
            }
            log.info("-------------------------------------------------------")
        }
        return diffArray
    } catch (error) {
        log.error(error.stack)
        throw error
    } finally {
        close(connectMessage)
    }
}

// <------------------------ 4h, 6h, 8h, 12h, 1d, 3d, 1w  (START) - BINANCE------------------------> //

// - - - - - - - - - - - - - Initial fetch for Binance Data (START) - - - - - - - - - - - - - //

// Fetching and saving data for 4h, 6h, 8h, 12h, 1d, 3d, 1w
const processInitialSaveHistoricalDataBinance = async ({ token_count }) => {
    var totalJobsCount = 0;
    var completedJobsCount = 0;
    const finalResult = {}
    const jobIDs = []
    const queueName = "Historical-Data-Queue"
    try {
        const t = createTimer('Initial fetch - Main Process (>= 4h)')
        t.startTimer()
        // console.time("Initial fetch - Main Process (>= 4h)")
        const periods = ["4h", "6h", "8h", "12h", "1d", "3d", "1w"]
        const [fi, totalNoOfRequiredFetches] = await HDUtil.generateFetchQueriesForBinanceTickers({ periods, token_count })

        let fetchInfo = fi // for testing .slice(0, 1)

        // for keeping track of total number of jobs
        totalJobsCount = fetchInfo.length

        if (fetchInfo.length === 0) {
            close("Initial save historical data Binance")
            t.stopTimer(__filename.slice(__dirname.length + 1))
            // console.timeEnd("Initial fetch - Main Process (>= 4h)")
            return ({ message: "Initial Token Data present. No need to fetch, update data instead" })

        } else {
            const initialFetchTaskQueue = new Queue(queueName, { connection }); // Create a task queue
            const initialFetchWorker = new Worker(queueName, HDUtil.processHistoricalData, { connection }); // Start a worker to process the tasks in the task queue

            IFTaskQueue = initialFetchTaskQueue

            // Log any errors that occur in the worker, initial save
            initialFetchWorker.on('error', error => {
                // log the error
                log.error(error.stack)
            });

            // counts the number of completed jobs, initial save
            initialFetchWorker.on('completed', (job) => {
                completedJobsCount++;
                if (completedJobsCount < totalJobsCount) {
                    log.info(`(WORKER - Initial fetch >= 4h), Completed job count : ${completedJobsCount}`);
                } else {
                    log.info(`(WORKER - Initial fetch >= 4h), Completed job count Final Task : ${completedJobsCount}`);
                    t.stopTimer(__filename.slice(__dirname.length + 1))
                    // console.timeEnd('Initial fetch - Main Process (>= 4h)');
                    close("Initial save historical data Binance ")
                    initialFetchWorker.close()
                    initialFetchTaskQueue.close()
                }
            });

            // console logs the failed tasks in the queue, initial save
            initialFetchWorker.on('failed', (job) => {
                const redisCommand = `hgetall bull:${queueName}:${job.id}`
                log.error(`Initial fetch task failed for : , ${job.name}, with id : , ${job.id}`)
                log.warn(`Check Redis for more info : ${redisCommand}`)
            });

            for (const index in fetchInfo) {
                const {
                    jobName,
                    ticker,
                    period,
                    id,
                    meta
                } = fetchInfo[index]

                const job = await initialFetchTaskQueue.add(
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

            finalResult["check_status_payload"] = {
                jobIds: jobIDs,
                type: "initial_"
            }
            finalResult["total_required_fetches"] = totalNoOfRequiredFetches
            finalResult["total_actual_fetches"] = fetchInfo.length
            finalResult["fetch_queries"] = fetchInfo

            const isActive = initialFetchWorker.isRunning();
            if (isActive) {
                const message = "Processing requests for initial fetch"
                return ({ message, finalResult });
            } else {
                initialFetchWorker.run()
                const message = "Fetch tasks added to queue. (Initial Fetch)"
                return ({ message, finalResult });
            }

        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// - - - - - - - - - - - - - Initial fetch for Binance Data (END) - - - - - - - - - - - - - //

// - - - - - - - - - - - - - Updates the binance data (START) - - - - - - - - - - - - - //

// Entry point to update Binance Tokens
const processUpdateBinanceData = async () => {
    var totalUpdateJobsCount = 0;
    var completedUpdateJobsCount = 0;
    const finalResult = {}
    const jobIDs = []
    const queueName = "Update-Historical-Data-Queue"
    try {
        const t = createTimer('Update Binance Token - Main Process (>= 4h)')
        t.startTimer()
        // console.time("Update Binance Token - Main Process (>= 4h)")
        const [result, totalNoOfRequiredUpdates] = await HDUtil.generateUpdateQueriesForBinanceTickers()

        const updateQueue = new Queue(queueName, { connection })
        const updateWorker = new Worker(queueName, HDUtil.processUpdateHistoricalData, { connection })

        UTaskQueue = updateQueue
        const updateQueries = result // full updates now, add slice for partial updates, result.slice(0, 10)
        totalUpdateJobsCount = updateQueries.length

        // Log any errors that occur in the worker, updates
        updateWorker.on('error', error => {
            // log the error
            log.error(error.stack)
        });

        // counts the number of completed jobs, updates
        updateWorker.on('completed', () => {
            completedUpdateJobsCount++;
            if (completedUpdateJobsCount < totalUpdateJobsCount) {
                log.info(`(WORKER - Update >= 4h) Update job count : ${completedUpdateJobsCount}`);
            } else {
                log.info(`(WORKER - Update >= 4h) Update job count Final Task : ${completedUpdateJobsCount}`);
                // console.timeEnd('Update Binance Token - Main Process (>= 4h)');
                t.stopTimer(__filename.slice(__dirname.length + 1))
                close("Updating data (>= 4h)")
                updateWorker.close()
                // updateQueue.close()
            }
        });

        // console logs the failed tasks in the queue, updates
        updateWorker.on('failed', (job) => {
            const redisCommand = `hgetall bull:${queueName}:${job.id}`
            log.error(`Update task failed for : ", ${job.name}, " with id : ", ${job.id}`)
            log.warn(`Check Redis for more info : ", ${redisCommand}`)
        })

        for (const index in updateQueries) {
            const {
                ticker_name,
                period,
                start,
                end,
                id,
                jobName
            } = updateQueries[index]

            const job = await updateQueue.add(
                jobName,
                { ticker_name, period, start, end },
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
            )
            const jobId = job.id
            jobIDs.push(jobId)
        }

        finalResult["check_status_payload"] = {
            jobIds: jobIDs,
            type: "update_"
        }
        finalResult["total_required_updates"] = totalNoOfRequiredUpdates
        finalResult["total_actual_updates"] = updateQueries.length
        finalResult["update_queries"] = updateQueries

        const isActive = updateWorker.isRunning();
        if (isActive) {
            const message = "Processing update request"
            return ({ message, finalResult });
        } else {
            updateWorker.run()
            const message = "Update tasks added to queue. (Initial Fetch)"
            return ({ message, finalResult });
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// - - - - - - - - - - - - - Updates the binance data (END) - - - - - - - - - - - - - //

// <------------------------ 4h, 6h, 8h, 12h, 1d, 3d, 1w (END) - BINANCE ------------------------> //


// <--------------------------------------- 1m ---------------------------------------> //

// - - - - - - - - - - - - - Initial fetch for Binance 1m Data (START) - - - - - - - - - - - - - //

// Entry point for Initial save binance Token endpoint One Min data
const processInitialSaveHistoricalDataBinanceOneM = async () => {
    var totalInitialOneMJobsCount = 0;
    var completedInitialOneMJobsCount = 0;
    const finalResult = {}
    const jobIDs = []
    const queueName = "One-Minute-Historical-Data-Queue"
    try {
        const t = createTimer('Initial fetch - Main Process (1m)')
        t.startTimer()
        // console.time("Initial fetch - Main Process (1m)")
        const [calculateTokensToFetch] = await HDUtil.getMinuteTokensToFetchAndUpdate()
        const [generateFetchQueries] = await HDUtil.generateFetchAndUpdateQueries()

        const [tokensToFetch, totalCount] = calculateTokensToFetch()
        const fq = await generateFetchQueries({ tokensToFetch })

        const initialOneMQueue = new Queue(queueName, { connection })
        const initialOneMWorker = new Worker(queueName, HDUtil.processOneMHistoricalData, { connection })

        IFOMTaskQueue = initialOneMQueue

        // const fetchQueries = fq.slice(0, 1) //remove this later for full update
        const fetchQueries = fq
        totalInitialOneMJobsCount = fetchQueries.length

        // Log any errors that occur in the worker, initial fetch 1m data
        initialOneMWorker.on('error', err => {
            // log the error
            log.error(`initialOneMWorker Error : ${err.stack}`)
        });

        // counts the number of completed jobs, initial fetch 1m data
        initialOneMWorker.on('completed', (job) => {
            completedInitialOneMJobsCount++;
            if (completedInitialOneMJobsCount < totalInitialOneMJobsCount) {
                log.info(`(WORKER - Initial Fetch 1m) Completed job count : ${completedInitialOneMJobsCount}`);
            } else {
                log.info(`(WORKER - Initial Fetch 1m) Completed job count Final Task : ${completedInitialOneMJobsCount}`);
                // console.timeEnd('Initial fetch - Main Process (1m)');
                t.stopTimer(__filename.slice(__dirname.length + 1))
                binanceClose("Saving oneM binance token data")
            }
        });

        // console logs the failed tasks in the queue, initial fetch 1m data
        initialOneMWorker.on('failed', (job) => {
            const redisCommand = `hgetall bull:${queueName}:${job.id}`
            log.error(`Initial fetch for 1m task failed for ${job.name} with id : ${job.id}`)
            log.warn(`Check Redis for more info : ${redisCommand}`)
        })

        for (const index in fetchQueries) {
            const {
                ticker_name,
                period,
                id,
                jobName
            } = fetchQueries[index]

            const job = await initialOneMQueue.add(
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
                }
            )
            const jobId = job.id
            jobIDs.push(jobId)
        }

        finalResult["check_status_payload"] = {
            jobIds: jobIDs,
            type: "initial_1m"
        }
        finalResult["total_required_fetches"] = totalCount
        finalResult["total_actual_fetches"] = fetchQueries.length
        finalResult["fetch_queries"] = fetchQueries

        const isActive = initialOneMWorker.isRunning();
        if (isActive) {
            const message = "Processing requests for initial 1m fetch"
            return ({ message, finalResult });
        } else {
            initialOneMWorker.run()
            const message = "Fetch tasks added to queue. (Initial Fetch 1m)"
            return ({ message, finalResult });
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// - - - - - - - - - - - - - Initial fetch for Binance 1m Data (END) - - - - - - - - - - - - - //


// - - - - - - - - - - - - - Updates the binance data One Minute (START) - - - - - - - - - - - - - //

// Entry point for Update binance Token endpoint One Min data
const processUpdateBinanceOneMData = async () => {
    var totalUpdateOneMJobsCount = 0;
    var completedUpdateOneMJobsCount = 0;
    const finalResult = {}
    const jobIDs = []
    const queueName = "Update-One-Minute-Historical-data-Queue"
    try {
        const t = createTimer('Update Binance Token - Main Process (1m)')
        t.startTimer()
        // console.time("Update Binance Token - Main Process (1m)")
        const [cttf, calculateTokensToUpdate] = await HDUtil.getMinuteTokensToFetchAndUpdate()
        const [gfq, generateUpdateQueries] = await HDUtil.generateFetchAndUpdateQueries()

        const [tokensToUpdate, totalCount] = calculateTokensToUpdate()
        const uq = await generateUpdateQueries({ tokensToUpdate })
        // const updateQueries = uq.slice(0, 1) // for testing, processing only one object
        const updateQueries = uq
        totalUpdateOneMJobsCount = updateQueries.length

        const oneMUpdateQueue = new Queue(queueName, { connection })
        const oneMUpdateWorker = new Worker(queueName, HDUtil.processUpdateHistoricalOneMData, { connection })

        UOMTaskQueue = oneMUpdateQueue

        // Log any errors that occur in the worker, updates 1m ticker
        oneMUpdateWorker.on('error', error => {
            // log the error
            log.error(`oneMWorker Error : ${error}`);
        });

        // counts the number of completed jobs, updates 1m ticker
        oneMUpdateWorker.on('completed', (job) => {
            completedUpdateOneMJobsCount++;
            if (completedUpdateOneMJobsCount < totalUpdateOneMJobsCount) {
                log.info(`(WORKER - Update 1m) Completed job count : ${completedUpdateOneMJobsCount}`);
            } else {
                log.info(`(WORKER - Update 1m) Completed job count Final Task : ${completedUpdateOneMJobsCount}`);
                oneMUpdateWorker.close()
                // console.timeEnd("Update Binance Token - Main Process (1m)")
                t.stopTimer__filename.slice(__dirname.length + 1)()
            }
        });

        // console logs the failed tasks in the queue, updates 1m ticker
        oneMUpdateWorker.on('failed', (job) => {
            const redisCommand = `hgetall bull:${queueName}:${job.id}`
            log.error(`Update 1m task failed for : ", ${job.name}, " with id : ", ${job.id}`)
            log.warn(`Check Redis for more info : ", ${redisCommand}`)
        })

        for (const index in updateQueries) {
            const {
                ticker_name,
                period,
                start,
                end,
                id,
                jobName
            } = updateQueries[index]

            const job = await oneMUpdateQueue.add(
                jobName,
                { ticker_name, period, start, end },
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
            )
            const jobId = job.id
            jobIDs.push(jobId)
        }

        finalResult["check_status_payload"] = {
            jobIds: jobIDs,
            type: "update_1m"
        }
        finalResult["total_required_updates"] = totalCount
        finalResult["total_actual_fetches"] = updateQueries.length
        finalResult["update_queries"] = updateQueries

        const isActive = oneMUpdateWorker.isRunning();
        if (isActive) {
            const message = "Processing requests for initial 1m fetch"
            return ({ message, finalResult });
        } else {
            oneMUpdateWorker.run()
            const message = "Fetch tasks added to queue. (Initial Fetch 1m)"
            return ({ message, finalResult });
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// - - - - - - - - - - - - - Updates the binance data One Minute (END) - - - - - - - - - - - - - //

// <--------------------------------------- 1m ---------------------------------------> //

// - - - - - - - - - - - - - Checks status of the jobs, update/o(START) - - - - - - - - - - - - - //

const serviceCheckJobCompletition = async ({ jobIds, type }) => {
    try {
        const processedResults = []
        switch (type) {
            case "initial_":
                for (const jobId of jobIds) {
                    const job = await IFTaskQueue.getJob(jobId);
                    if (job !== undefined) {
                        const result = await job.isCompleted();
                        const jobName = job.name
                        processedResults.push({ jobId: jobId, completed: result, jobName: jobName, data: job.returnvalue })
                    }
                }
                message = `Job status for ${type}`
                data = processedResults
                break;
            case "update_":
                for (const jobId of jobIds) {
                    const job = await UTaskQueue.getJob(jobId);
                    if (job !== undefined) {
                        const result = await job.isCompleted();
                        const jobName = job.name
                        processedResults.push({ jobId: jobId, completed: result, jobName: jobName, data: job.returnvalue })
                    }
                }
                message = `Job status for ${type}`
                data = processedResults
                break;
            case "initial_1m":
                for (const jobId of jobIds) {
                    const job = await IFOMTaskQueue.getJob(jobId);
                    if (job !== undefined) {
                        const result = await job.isCompleted();
                        const jobName = job.name
                        processedResults.push({ jobId: jobId, completed: result, jobName: jobName, data: job.returnvalue })
                    }
                }
                message = `Job status for ${type}`
                data = processedResults
                break;
            case "update_1m":
                for (const jobId of jobIds) {
                    const job = await UOMTaskQueue.getJob(jobId);
                    if (job !== undefined) {
                        const result = await job.isCompleted();
                        const jobName = job.name
                        processedResults.push({ jobId: jobId, completed: result, jobName: jobName, data: job.returnvalue })
                    }
                }
                message = `Job status for ${type}`
                data = processedResults
                break;
            case "full_update_":
                for (const jobId of jobIds) {
                    const job = await UTaskQueue.getJob(jobId) || await UOMTaskQueue.getJob(jobId);
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
                res.status(400).json({ message: "Invalid type" })
                break;
        }
        return ({ message, data })
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// - - - - - - - - - - - - -  Checks status of the jobs  update/initial (END) - - - - - - - - - - - - - //


module.exports = {
    processInitialSaveHistoricalDataYFinance
    , processUpdateHistoricalYFinanceData
    , processInitialSaveHistoricalDataBinance
    , processUpdateBinanceData
    , processInitialSaveHistoricalDataBinanceOneM
    , processUpdateBinanceOneMData
    , serviceCheckJobCompletition
}