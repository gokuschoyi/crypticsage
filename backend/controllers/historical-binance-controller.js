const { Queue, Worker, QueueEvents } = require('bullmq');
const { v4: uuidv4 } = require('uuid');
const { close } = require('../services/db-conn')
const { client } = require('../services/redis')

const HDBUtil = require('../utils/historical_data/binance_util')

// Binance tickers to fetch BTCUSDT, ETHUSDT, ADAUSDT, SOLUSDT
// "BTCUSDT", "ETHUSDT", "ADAUSDT", "SOLUSDT"
// Available periods: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w
// "1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w"
const tickers = ["BTCUSDT", "ADAUSDT"]
const periods = ["1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w"]

// Create a Redis connection
const connection = client

// Create a task queue
const taskQueue = new Queue('historicalDataQueue', { connection });

// Create an event listener for task completion
const queueEvents = new QueueEvents('historicalDataQueue', { connection });

// Start a worker to process the tasks in the task queue
const worker = new Worker('historicalDataQueue', processHistoricalData, { connection });

// Log any errors that occur in the worker
worker.on('error', err => {
    // log the error
    console.error("Error", err);
});

var completedJobsCount = 0;

// counts the number of completed jobs
queueEvents.on('completed', (job) => {
    completedJobsCount++;
    if (tickers.length * periods.length !== completedJobsCount) {
        console.log('Completed job count:', completedJobsCount);
    } else {
        console.log('All jobs completed');
        close("insertBinanceData")
        // taskQueue.clean(0);
    }
});

// console logs the failed tasks in the queue
queueEvents.on('failed', (job) => {
    console.log("Failed job id", job.jobId)
})

// function for the worker to process the task
async function processHistoricalData(job) {
    const { ticker, period, from, to } = job.data;
    console.log(`--------------------PROCESS HISTORICAL DATA START ${ticker}_${from} to ${to}  with period ${period}-------------------`)
    // console.log("ticker", ticker, "period", period, "from", from, "to", to)
    let params = {
        ticker_name: ticker,
        from: `${from}`,
        to: `${to}`,
        period: period
    }

    // Fetch the historical data for the ticker and time period
    let historicalData = await HDBUtil.getHistoricalDataBinance(params);

    // save historical data to db
    let ins = await HDBUtil.insertBinanceDataToDb({ ticker_name: ticker, period: period, tokenData: historicalData });

    console.log(`--------------------PROCESS HISTORICAL DATA END ${ticker}_${from} to ${to}  with period ${period}-------------------`)

    // Return the result
    return ins;
}

// entry point for the API
const initialSaveHistoricalDataBinance = async (req, res) => {
    const results = []
    const from = "06-12-2023"
    const to = HDBUtil.formatBinaceDate(new Date().toLocaleString())
    for (const ticker of tickers) {
        for (const period of periods) {
            var id = uuidv4();
            var jobName = `fetchHistoricalData-${ticker}-${period}`;
            console.log("jobName", jobName)
            const job = await taskQueue.add(
                jobName,
                { ticker, period, from, to },
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

            /// Wait for the job to complete and get the result
            // const result = await job.isCompleted();
            results.push(job.id);
        }
    }
    const isActive = worker.isRunning();
    if (isActive) {
        res.send({ message: 'Processing requests', jobIDs: results });
    } else {
        worker.run()
        res.status(200).json({ message: "Tasks added to queue" })
    }

    // console.log("results", results)
    // console.log("get completed jobs", await taskQueue.getCompletedCount())
}

// checks status of the jobs
const checkJobCompletition = async (req, res) => {
    const { jobIds } = req.body
    if (jobIds.length === 0) {
        res.status(400).json({ message: "Invalid parameters, provide atleast one job id" })
    } else {
        const processedResults = []
        for (const jobId of jobIds) {
            const job = await taskQueue.getJob(jobId);
            const result = await job.isCompleted();;
            const jobName = job.name
            processedResults.push({ jobId: jobId, completed: result, jobName: jobName, data: job.returnvalue })
        }
        // console.log("result", processedResults)
        res.status(200).json({ message: "Job status", data: processedResults });
    }
}

module.exports = {
    initialSaveHistoricalDataBinance,
    checkJobCompletition,
}