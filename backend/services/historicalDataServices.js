const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const { createTimer } = require('../utils/timer')
const { Queue, Worker } = require('bullmq');
const { close } = require('../services/db-conn')
const { redisClient } = require('../services/redis')

const MDBServices = require('../services/mongoDBServices')
const HDUtil = require('../utils/historicalDataUtil')

const connection = redisClient // Create a Redis connection
let IFTaskQueue;
let UTaskQueue;


const processInitialSaveHistoricalDataYFinance = async ({ tickersList, periods }) => {
    try {
        const collection_name = 'yfinance_metadata'
        let availableTickers = await MDBServices.getFirstObjectForEachPeriod(collection_name)
        let tickers = tickersList.filter((ticker) => {
            return !availableTickers.some((obj) => obj.ticker_name === ticker)
        })
        let uploadStatus = {};

        if (tickers.length > 0) {
            // const formattedDate = HDUtil.formatDateForYFinance(new Date().toLocaleString())
            // log.info(formattedDate)

            const toDate = '2023-07-03' // HDUtil.formatDateForYFinance(new Date().toLocaleString())
            for (let i = 0; i < tickers.length; i++) {
                const ticker_name = tickers[i]
                let fromDate
                const startDate = await HDUtil.getFirstTradeDate({ symbol: ticker_name })
                if (startDate === undefined) {
                    const customError = new Error(`No start date for ${ticker_name}`)
                    // @ts-ignore
                    customError.failReason = "No start date"
                    throw customError
                } else {
                    const newD = new Date(startDate).toLocaleString()
                    fromDate = HDUtil.formatDateForYFinance(newD)

                    log.info(fromDate)

                    uploadStatus[ticker_name] = {}
                    for (let j = 0; j < periods.length; j++) {
                        const period = periods[j]
                        let params = {
                            ticker_name: ticker_name,
                            from: fromDate,
                            to: toDate,
                            period: period
                        }
                        let yFResult = await HDUtil.getHistoricalYFinanceData(params)
                        let ins;
                        if (yFResult.length > 0) {
                            let meta = {}
                            const type = 'stock'
                            let newIns = await MDBServices.insertHistoricalDataToDb(type, ticker_name, period, yFResult)
                            let metadata = {
                                oldest: yFResult[0],
                                latest: yFResult[yFResult.length - 1],
                                updatedCount: yFResult.length,
                                metaData: meta
                            }
                            let updateMetaRes = await MDBServices.updateTickerMetaData(type, ticker_name, period, metadata)
                            ins = [newIns, updateMetaRes]
                            uploadStatus[ticker_name][period] = ins
                        } else {
                            ins = ['No Data Found']
                            uploadStatus[ticker_name][period] = ins
                        }
                    }
                }
            }
        } else { uploadStatus.message = "Ticker data already present" }
        return [uploadStatus, availableTickers, tickers]
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const processUpdateHistoricalYFinanceData = async ({ symbol }) => {
    try {
        let diffArray = []
        const collection_name = 'yfinance_metadata'
        let allYfTickersInDb = await MDBServices.getFirstObjectForEachPeriod(collection_name)

        let yfTickersInDb = []
        allYfTickersInDb.forEach((ticker) => {
            const tickerName = ticker.ticker_name
            const data = ticker.data
            Object.entries(data).forEach(([key, value]) => {
                yfTickersInDb.push({
                    ticker_name: tickerName,
                    period: key,
                    last_updated: value.lastHistorical
                })
            })
        })

        let yfTickers
        if (symbol === 'all') {
            log.info("Updating all tickers")
            yfTickers = yfTickersInDb
        } else {
            log.info(`Updating one ticker : ${symbol}`)
            yfTickers = yfTickersInDb.filter((val) => val.ticker_name === symbol)
        }


        for (const ticker of yfTickers) {
            log.info("-------------------------------------------------------")
            const { ticker_name, period, last_updated } = ticker
            let updateCount, yFResult, latestTickerDatafromYF, insertData
            const cfu = await HDUtil.checkForUpdates({ last_updated })
            const [daysElapsed] = cfu

            if (daysElapsed > 2) {
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
                latestTickerDatafromYF = yFResult.filter((val) => new Date(val.date).getTime() > new Date(last_updated).getTime())
                updateCount = latestTickerDatafromYF.length

                if (updateCount > 0) {
                    let meta = {}
                    const type = 'stock'
                    let newIns = await MDBServices.insertHistoricalDataToDb(type, ticker_name, period, latestTickerDatafromYF)
                    let metadata = {
                        oldest: latestTickerDatafromYF[0],
                        latest: latestTickerDatafromYF[latestTickerDatafromYF.length - 1],
                        updatedCount: latestTickerDatafromYF.length,
                        metaData: meta
                    }
                    let updateMetaRes = await MDBServices.updateTickerMetaData(type, ticker_name, period, metadata)

                    diffArray.push({
                        ticker_name: ticker_name,
                        period: period,
                        count: updateCount,
                        newIns,
                        updateMetaRes
                    })
                } else {
                    diffArray.push({
                        ticker_name: ticker_name,
                        period: period,
                        count: updateCount || 0,
                        newTickerData: latestTickerDatafromYF || [],
                        insertData: insertData || 0
                    })
                }
                log.info(`New data length : ${updateCount}`)
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
        }
        return diffArray
    } catch (error) {
        log.error(error.stack)
        throw error
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
        const t = createTimer('Initial fetch - Main Process')
        t.startTimer()
        const periods = ["1m", "4h", "6h", "8h", "12h", "1d", "3d", "1w"]
        const [fi, totalNoOfRequiredFetches] = await HDUtil.generateFetchQueriesForBinanceTickers({ periods, token_count })

        let fetchInfo = fi // for testing .slice(0, 1)

        // for keeping track of total number of jobs
        totalJobsCount = fetchInfo.length

        if (fetchInfo.length === 0) {
            t.stopTimer(__filename.slice(__dirname.length + 1))
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
                    log.info(`(WORKER - Initial fetch), Completed job count : ${completedJobsCount}`);
                } else {
                    log.info(`(WORKER - Initial fetch), Completed job count Final Task : ${completedJobsCount}`);
                    t.stopTimer(__filename.slice(__dirname.length + 1))
                    // initialFetchWorker.close()
                    // initialFetchTaskQueue.close()
                }
            });

            // console logs the failed tasks in the queue, initial save
            initialFetchWorker.on('failed', (job) => {
                // @ts-ignore
                const redisCommand = `hgetall bull:${queueName}:${job.id}`
                // @ts-ignore
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
        const t = createTimer('Update Binance Token - Main Process')
        t.startTimer()
        const [result, totalNoOfRequiredUpdates] = await HDUtil.generateUpdateQueriesForBinanceTickers()

        const updateQueue = new Queue(queueName, { connection })
        const updateWorker = new Worker(queueName, HDUtil.processUpdateHistoricalData, { connection })

        UTaskQueue = updateQueue
        const updateQueries = result // full updates now, add slice for partial updates, result.slice(0, 10)
        totalUpdateJobsCount = updateQueries.length

        // counts the number of completed jobs, updates
        const updateCompletedListener = () => {
            completedUpdateJobsCount++;
            if (completedUpdateJobsCount < totalUpdateJobsCount) {
                log.info(`(WORKER - Update) Update job count : ${completedUpdateJobsCount}`);
            } else {
                log.info(`(WORKER - Update) Update job count Final Task : ${completedUpdateJobsCount}`);
                t.stopTimer(__filename.slice(__dirname.length + 1))
                // updateWorker.close()
                updateWorker.removeListener('completed', updateCompletedListener)
            }
        }

        // console logs the failed tasks in the queue, updates
        const failedListener = () => {
            // @ts-ignore
            const redisCommand = `hgetall bull:${queueName}:${job.id}`
            // @ts-ignore
            log.error(`Update task failed for : ", ${job.name}, " with id : ", ${job.id}`)
            log.warn(`Check Redis for more info : ", ${redisCommand}`)
        }

        updateWorker.on('completed', updateCompletedListener)
        updateWorker.on('failed', failedListener)

        // Log any errors that occur in the worker, updates
        updateWorker.on('error', error => {
            // log the error
            log.error(error.stack)
        });

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
            const message = "Update tasks added to queue. (Initial Update)"
            return ({ message, finalResult });
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// - - - - - - - - - - - - - Updates the binance data (END) - - - - - - - - - - - - - //

// <------------------------ 4h, 6h, 8h, 12h, 1d, 3d, 1w (END) - BINANCE ------------------------> //


// - - - - - - - - - - - - - Checks status of the jobs, update/o(START) - - - - - - - - - - - - - //

const serviceCheckJobCompletition = async ({ jobIds, type }) => {
    try {
        const processedResults = []
        let message, data
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
            case "full_update_":
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
            default:
                message = "Invalid type"
                data = []
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
    , serviceCheckJobCompletition
}