const { Queue, Worker } = require('bullmq');
const { close, binanceClose } = require('../services/db-conn')
const { redisClient } = require('../services/redis')

const HDBUtil = require('../utils/historical_data/binance_util')

const connection = redisClient // Create a Redis connection
let IFTaskQueue;
let UTaskQueue;
let IFOMTaskQueue;
let UOMTaskQueue;

// Entry point for Initial save binance Token endpoint
// Binance tickers to fetch BTCUSDT, ETHUSDT, ADAUSDT, SOLUSDT
// "BTCUSDT", "ETHUSDT", "ADAUSDT", "SOLUSDT"
// Available periods: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w


// <------------------------ 4h, 6h, 8h, 12h, 1d, 3d, 1w  (START) ------------------------> //

// - - - - - - - - - - - - - Initial fetch for Binance Data (START) - - - - - - - - - - - - - //

// function for the initialFetchWorker to process initial fetches
async function processHistoricalData(job) {
    const { ticker, period, meta } = job.data;
    console.log(`--------------------PROCESS HISTORICAL DATA START ${ticker} with period ${period}-------------------`)

    let params = {
        ticker_name: ticker,
        period: period
    }
    let historicalData = await HDBUtil.fetchHistoricalDataBinance(params); // Fetch the historical data for the ticker and time period
    let ins = await HDBUtil.insertBinanceDataToDb({ ticker_name: ticker, period: period, meta: meta, tokenData: historicalData }); // save historical data to db

    console.log(`--------------------PROCESS HISTORICAL DATA END ${ticker} with period ${period}-------------------`)

    return ins; // Return the result
}

// Fetching and saving data for 4h, 6h, 8h, 12h, 1d, 3d, 1w
const initialSaveHistoricalDataBinance = async (req, res) => {
    const { token_count } = req.body
    var totalJobsCount = 0;
    var completedJobsCount = 0;
    const finalResult = {}
    const jobIDs = []
    const queueName = "Historical-Data-Queue"
    try {
        console.time("Initial fetch - Main Process (>= 4h)")
        const periods = ["4h", "6h", "8h", "12h", "1d", "3d", "1w"]
        const [fi, totalNoOfRequiredFetches] = await HDBUtil.generateFetchQueriesForBinanceTickers({ periods, token_count })

        let fetchInfo = fi // for testing .slice(0, 1)

        // for keeping track of total number of jobs
        totalJobsCount = fetchInfo.length

        if (fetchInfo.length === 0) {
            close("get available binance tickers in db")
            console.timeEnd("Initial fetch - Main Process (>= 4h)")
            res.status(200).send({ message: "Initial Token Data present. No need to fetch, update data instead" })
            return
        } else {
            const initialFetchTaskQueue = new Queue(queueName, { connection }); // Create a task queue
            const initialFetchWorker = new Worker(queueName, processHistoricalData, { connection }); // Start a worker to process the tasks in the task queue

            IFTaskQueue = initialFetchTaskQueue

            // Log any errors that occur in the worker, initial save
            initialFetchWorker.on('error', err => {
                // log the error
                console.error("Error", err);
            });

            // counts the number of completed jobs, initial save
            initialFetchWorker.on('completed', (job) => {
                completedJobsCount++;
                if (completedJobsCount < totalJobsCount) {
                    console.log('(WORKER - Initial fetch >= 4h), Completed job count :', completedJobsCount);
                } else {
                    console.log('(WORKER - Initial fetch >= 4h), Completed job count Final Task :', completedJobsCount);
                    console.timeEnd('Initial fetch - Main Process (>= 4h)');
                    close("insertBinanceData")
                    initialFetchWorker.close()
                    initialFetchTaskQueue.close()
                }
            });

            // console logs the failed tasks in the queue, initial save
            initialFetchWorker.on('failed', (job) => {
                const redisCommand = `hgetall bull:${queueName}:${job.id}`
                console.log("Initial fetch task failed for : ", job.name, " with id : ", job.id)
                console.log("Check Redis for more info : ", redisCommand)
            })

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
                res.send({ message: 'Processing requests for initial fetch', finalResult });
            } else {
                initialFetchWorker.run()
                res.status(200).json({ message: "Fetch tasks added to queue. (Initial Fetch)" })
            }
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Internal server error" })
    }
}

// - - - - - - - - - - - - - Initial fetch for Binance Data (END) - - - - - - - - - - - - - //



// - - - - - - - - - - - - - Updates the binance data (START) - - - - - - - - - - - - - //

// Function for the updateWorker to process updates
async function processUpdateHistoricalData(job) {
    const { ticker_name, period, start, end } = job.data
    console.log(`--------------------UPDATE HISTORICAL DATA START ${ticker_name} WITH PERIOD ${period} from ${new Date(start).toLocaleString()} to ${new Date(end).toLocaleString()}-------------------`)

    let insertResult = []
    const updateResult = await HDBUtil.fetchLatestTickerData({ ticker_name, period, start, end })
    if (updateResult.length > 0) {
        insertResult = await HDBUtil.updateBinanceDataToDb({ ticker_name, period, tokenData: updateResult })
        console.log(`--------------------UPDATE HISTORICAL DATA END ${ticker_name} WITH PERIOD ${period} from ${new Date(start).toLocaleString()} to ${new Date(end).toLocaleString()}-------------------`)

        return insertResult
    } else {
        console.log("No new data to update")
        console.log(`--------------------UPDATE HISTORICAL DATA END ${ticker_name} WITH PERIOD ${period} from ${new Date(start).toLocaleString()} to ${new Date(end).toLocaleString()}-------------------`)
        return insertResult = ["No New Data"]
    }

}

// Entry point to update Binance Tokens
const updateBinanceData = async (req, res) => {
    var totalUpdateJobsCount = 0;
    var completedUpdateJobsCount = 0;
    const finalResult = {}
    const jobIDs = []
    const queueName = "Update-Historical-Data-Queue"
    try {
        console.time("Update Binance Token - Main Process (>= 4h)")
        const [result, totalNoOfRequiredUpdates] = await HDBUtil.generateUpdateQueriesForBinanceTickers()

        const updateQueue = new Queue(queueName, { connection })
        const updateWorker = new Worker(queueName, processUpdateHistoricalData, { connection })

        UTaskQueue = updateQueue
        const updateQueries = result // full updates now, add slice for partial updates, result.slice(0, 10)
        totalUpdateJobsCount = updateQueries.length

        // Log any errors that occur in the worker, updates
        updateWorker.on('error', err => {
            // log the error
            console.error("Error", err);
        });

        // counts the number of completed jobs, updates
        updateWorker.on('completed', () => {
            completedUpdateJobsCount++;
            if (completedUpdateJobsCount < totalUpdateJobsCount) {
                console.log('(WORKER - Update >= 4h) Update job count :', completedUpdateJobsCount);
            } else {
                console.log('(WORKER - Update >= 4h) Update job count Final Task :', completedUpdateJobsCount);
                console.timeEnd('Update Binance Token - Main Process (>= 4h)');
                close("Updating data (>= 4h)")
                updateWorker.close()
                updateQueue.close()
            }
        });

        // console logs the failed tasks in the queue, updates
        updateWorker.on('failed', (job) => {
            const redisCommand = `hgetall bull:${queueName}:${job.id}`
            console.log("Update task failed for : ", job.name, " with id : ", job.id)
            console.log("Check Redis for more info : ", redisCommand)
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
            res.send({ message: 'Processing update requests', finalResult });
        } else {
            updateWorker.run()
            res.status(200).json({ message: "Update tasks added to queue. (Initial Fetch)" })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Internal server error" })
    }
}

// - - - - - - - - - - - - - Updates the binance data (END) - - - - - - - - - - - - - //

// <------------------------ 4h, 6h, 8h, 12h, 1d, 3d, 1w (END) ------------------------> //




// <--------------------------------------- 1m ---------------------------------------> //

// - - - - - - - - - - - - - Initial fetch for Binance 1m Data (START) - - - - - - - - - - - - - //

// function for the initialFetchWorker to process initial fetches One Min data
async function processOneMHistoricalData(job) {
    const { ticker_name, period } = job.data;
    console.log(`--------------------PROCESS 1m HISTORICAL DATA START ${ticker_name} with period ${period}-------------------`)
    let params = {
        ticker_name: ticker_name,
        period: period
    }
    let fetchedData = await HDBUtil.testGetHistoricalDataBinance(params);
    let ins = await HDBUtil.insertOneMBinanceDataToDb({ ticker_name: ticker_name, token_data: fetchedData })
    console.log(`--------------------PROCESS 1m HISTORICAL DATA END ${ticker_name} with period ${period}-------------------`)
    return ins
}

// Entry point for Initial save binance Token endpoint One Min data
const initialSaveHistoricalDataBinanceOneM = async (req, res) => {
    var totalInitialOneMJobsCount = 0;
    var completedInitialOneMJobsCount = 0;
    const finalResult = {}
    const jobIDs = []
    const queueName = "One-Minute-Historical-Data-Queue"

    try {
        console.time("Initial fetch - Main Process (1m)")
        const [calculateTokensToFetch] = await HDBUtil.getMinuteTokensToFetchAndUpdate()
        const [generateFetchQueries] = await HDBUtil.generateFetchAndUpdateQueries()
        const [tokensToFetch, totalCount] = calculateTokensToFetch()

        const fq = await generateFetchQueries({ tokensToFetch })

        const initialOneMQueue = new Queue(queueName, { connection })
        const initialOneMWorker = new Worker(queueName, processOneMHistoricalData, { connection })

        IFOMTaskQueue = initialOneMQueue

        // const fetchQueries = fq.slice(0, 1) //remove this later for full update
        const fetchQueries = fq
        totalInitialOneMJobsCount = fetchQueries.length

        // Log any errors that occur in the worker, initial fetch 1m data
        initialOneMWorker.on('error', err => {
            // log the error
            console.error("initialOneMWorker Error", err);
        });

        // counts the number of completed jobs, initial fetch 1m data
        initialOneMWorker.on('completed', (job) => {
            completedInitialOneMJobsCount++;
            if (completedInitialOneMJobsCount < totalInitialOneMJobsCount) {
                console.log('(WORKER - Initial Fetch 1m) Completed job count : ', completedInitialOneMJobsCount);
            } else {
                console.log('(WORKER - Initial Fetch 1m) Completed job count Final Task : ', completedInitialOneMJobsCount);
                console.timeEnd('Initial fetch - Main Process (1m)');
                binanceClose("saving oneM binance token data")
            }
        });

        // console logs the failed tasks in the queue, initial fetch 1m data
        initialOneMWorker.on('failed', (job) => {
            const redisCommand = `hgetall bull:${queueName}:${job.id}`
            console.log("Initial fetch for 1m task failed for : ", job.name, " with id : ", job.id)
            console.log("Check Redis for more info : ", redisCommand)
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
            res.send({ message: 'Processing requests for initial 1m fetch', finalResult });
        } else {
            initialOneMWorker.run()
            res.status(200).json({ message: "Fetch tasks added to queue. (Initial Fetch 1m)" })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Internal server error" })
    }
}

// - - - - - - - - - - - - - Initial fetch for Binance 1m Data (END) - - - - - - - - - - - - - //



// - - - - - - - - - - - - - Updates the binance data One Minute (START) - - - - - - - - - - - - - //

async function processUpdateHistoricalOneMData(job) {
    const { ticker_name, period, start, end } = job.data
    console.log(`--------------------UPDATE HISTORICAL DATA START ${ticker_name} WITH PERIOD ${period} from ${new Date(start).toLocaleString()} to ${new Date(end).toLocaleString()}-------------------`)
    let params = {
        ticker_name: ticker_name,
        period: period,
        start: start,
        end: end
    }
    const fetchedData = await HDBUtil.fetchBinanceHistoricalBetweenPeriods(params)
    const ins = await HDBUtil.insertOneMBinanceDataToDb({ ticker_name: ticker_name, token_data: fetchedData })

    console.log(`--------------------UPDATE HISTORICAL DATA END ${ticker_name} WITH PERIOD ${period} from ${new Date(start).toLocaleString()} to ${new Date(end).toLocaleString()}-------------------`)
    return ins
}

const updateBinanceOneMData = async (req, res) => {
    var totalUpdateOneMJobsCount = 0;
    var completedUpdateOneMJobsCount = 0;
    const finalResult = {}
    const jobIDs = []
    const queueName = "Update-One-Minute-Historical-data-Queue"

    try {
        console.time("Update Binance Token - Main Process (1m)")
        const [cttf, calculateTokensToUpdate] = await HDBUtil.getMinuteTokensToFetchAndUpdate()
        const [gfq, generateUpdateQueries] = await HDBUtil.generateFetchAndUpdateQueries()
        const [tokensToUpdate, totalCount] = calculateTokensToUpdate()

        const uq = await generateUpdateQueries({ tokensToUpdate })
        // const updateQueries = uq.slice(0, 1) // for testing, processing only one object
        const updateQueries = uq
        totalUpdateOneMJobsCount = updateQueries.length

        const oneMUpdateQueue = new Queue(queueName, { connection })
        const oneMUpdateWorker = new Worker(queueName, processUpdateHistoricalOneMData, { connection })

        UOMTaskQueue = oneMUpdateQueue

        // Log any errors that occur in the worker, updates 1m ticker
        oneMUpdateWorker.on('error', err => {
            // log the error
            console.error("oneMWorker Error", err);
        });

        // counts the number of completed jobs, updates 1m ticker
        oneMUpdateWorker.on('completed', (job) => {
            completedUpdateOneMJobsCount++;
            if (completedUpdateOneMJobsCount < totalUpdateOneMJobsCount) {
                console.log('(WORKER - Update 1m) Completed job count : ', completedUpdateOneMJobsCount);
            } else {
                console.log('(WORKER - Update 1m) Completed job count Final Task : ', completedUpdateOneMJobsCount);
                oneMUpdateWorker.close()
                console.timeEnd("Update Binance Token - Main Process (1m)")
            }
        });

        // console logs the failed tasks in the queue, updates 1m ticker
        oneMUpdateWorker.on('failed', (job) => {
            const redisCommand = `hgetall bull:${queueName}:${job.id}`
            console.log("Update 1m task failed for : ", job.name, " with id : ", job.id)
            console.log("Check Redis for more info : ", redisCommand)
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
            res.send({ message: 'Processing update for 1m data', finalResult });
        } else {
            oneMUpdateWorker.run()
            res.status(200).json({ message: "Fetch tasks added to queue. (Update 1m)" })
        }
    } catch (err) {
        console.log(err)
        res.status(500).json({ message: "Internal server error" })
    }
}

// - - - - - - - - - - - - - Updates the binance data One Minute (END) - - - - - - - - - - - - - //


// <--------------------------------------- 1m ---------------------------------------> //


// - - - - - - - - - - - - - Checks status of the jobs, update/o(START) - - - - - - - - - - - - - //

const checkJobCompletition = async (req, res) => {
    const { jobIds, type } = req.body
    if (jobIds.length === 0 || type === "") {
        res.status(400).json({ message: "Invalid parameters, provide atleast one job id or type is empty" })
    } else {
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
                res.status(200).json({ message: `Job status for ${type}`, data: processedResults });
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
                res.status(200).json({ message: `Job status for ${type}`, data: processedResults });
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
                res.status(200).json({ message: `Job status for ${type}`, data: processedResults });
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
                res.status(200).json({ message: `Job status for ${type}`, data: processedResults });
                break;
            default:
                res.status(400).json({ message: "Invalid type" })
                break;
        }
    }
}

// - - - - - - - - - - - - -  Checks status of the jobs  update/initial (END) - - - - - - - - - - - - - //

module.exports = {
    initialSaveHistoricalDataBinance,
    updateBinanceData,
    initialSaveHistoricalDataBinanceOneM,
    updateBinanceOneMData,
    checkJobCompletition,
}