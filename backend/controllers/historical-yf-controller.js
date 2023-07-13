const { close } = require('../services/db-conn')
const HDYFUtil = require('../utils/historical_data/yFinance_util')

// <------Y_Finance---------> //
// YFinance tickers to fetch AAPL, TSLA, AMZN, GOOGL, MSFT
// Available periods: "1d", "1wk", "1mo" (d - daily, w - weekly, m - monthly)

const initialSaveHistoricalDataYFinance = async (req, res) => {
    const tickers = ["AAPL", "TSLA", "AMZN"]
    const periods = ["1d", "1wk", "1mo"]
    try {
        const fromDate = '2023-01-01'
        const toDate = '2023-07-03' // HDYFUtil.formatDateForYFinance(new Date().toLocaleString())
        // console.log("formattedDate", fromDate, toDate)
        let uploadStatus = {};
        for (let i = 0; i < tickers.length; i++) {
            let tickerData = {
                ticker_name: tickers[i],
                data: {}
            }
            uploadStatus[tickers[i]] = {}
            for (let j = 0; j < periods.length; j++) {
                let params = {
                    ticker_name: tickers[i],
                    from: fromDate,
                    to: toDate,
                    period: periods[j]
                }
                let yFResult = await HDYFUtil.getHistoricalYFinanceData(params)
                if (yFResult.length === 0) {
                    uploadStatus[tickers[i]][periods[j]] = 0
                    console.log("No data found for ", tickers[i], " with period ", periods[j])
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
            await HDYFUtil.insertHistoricalYFinanceDate({ tickerData, tickerName: tickers[i] })
        }
        res.status(200).json({ message: "Yfinance tickers added", uploadStatus });
    } catch (err) {
        console.log("Error in initialSaveHistoricalDataYFinance", err)
        res.status(400).json({ message: "Error in initialSaveHistoricalDataYFinance" });
    } finally {
        close("saveHistoricalDataYFinance");
    }
}

const updateHistoricalYFinanceData = async (req, res) => {
    try {
        let diffArray = []
        const yfTickers = await HDYFUtil.getYFinanceTickerInfo()
        for (const ticker of yfTickers) {
            console.log("-------------------------------------------------------")
            let updateCount, yFResult, latestTickerDatafromYF, insertData
            const last_updated = ticker.last_updated
            const cfu = await HDYFUtil.checkForUpdates({ last_updated })
            const [daysElapsed] = cfu

            if (daysElapsed > 1) {
                const [daysElapsed, from, to] = cfu
                console.log(`${ticker.ticker_name} with period ${ticker.period} needs update from ${(new Date(ticker.last_updated).toLocaleString().split(', ')[0])}, days: ${Math.round(daysElapsed)} `)
                let params = {
                    ticker_name: ticker.ticker_name,
                    from: from,
                    to: to,
                    period: ticker.period
                }
                yFResult = await HDYFUtil.getHistoricalYFinanceData(params)
                latestTickerDatafromYF = yFResult.filter((val) => new Date(val.date).getTime() > new Date(ticker.last_historicalData.date).getTime())
                updateCount = latestTickerDatafromYF.length
                if (updateCount > 0) {
                    insertData = await HDYFUtil.insertLatestYFinanceData({ _id: ticker._id, period: ticker.period, data: latestTickerDatafromYF })
                    diffArray.push({
                        ticker_name: ticker.ticker_name,
                        period: ticker.period,
                        count: updateCount,
                        insertData
                    })
                } else {
                    console.log("no new data")
                }
            } else {
                console.log(`${ticker.ticker_name} with period ${ticker.period} is upto date : ${daysElapsed}`)
                diffArray.push({
                    ticker_name: ticker.ticker_name,
                    period: ticker.period,
                    count: updateCount || 0,
                    newTickerData: latestTickerDatafromYF || [],
                    insertData: insertData || 0
                })
            }
            console.log("-------------------------------------------------------")
        }
        res.status(200).json({ message: 'YF tokens updated', diffArray })
    } catch (err) {
        console.log(err)
    }
}

// <------Y_Finance---------> //

module.exports = {
    initialSaveHistoricalDataYFinance,
    updateHistoricalYFinanceData
}