
const { connect, close } = require('../db-conn')
const {
    getHistoricalDataYFinance,
    formatLocaleDate,
    formatYFinanceDate,
    convertToISODateTime,
    formatLocaleToYFinanceDate,
    insertYFinanceData,
} = require('./cryptoHelper')

// YFinance tickers to fetch AAPL, TSLA, AMZN, GOOGL, MSFT
// Available periods: d, w, m (d - daily, w - weekly, m - monthly)

const initialSaveHistoricalDataYFinance = async (req, res) => {
    const tickers = ["AAPL", "TSLA", "AMZN", "GOOGL", "MSFT"]
    const periods = ["d", "w", "m"]
    try {
        const db = await connect("saveHistoricalDataYFinance");
        const yFinanceCollection = db.collection("yFinance");
        const currentdate = new Date().toLocaleString();
        const formattedDate = formatLocaleDate(currentdate)
        console.log("formattedDate", formattedDate)
        for (let i = 0; i < tickers.length; i++) {
            let tickerData = {
                ticker_name: tickers[i],
                last_updated: new Date().toLocaleString(),
                data: {}
            }
            for (let j = 0; j < periods.length; j++) {
                let params = {
                    ticker_name: tickers[i],
                    from: formatYFinanceDate("01-01-2010"),
                    to: `${formatYFinanceDate(formattedDate)}`,
                    period: periods[j]
                }
                let yFResult = await getHistoricalDataYFinance(params)
                if (yFResult.length === 0) {
                    console.log("No data found for ", tickers[i], " with period ", periods[j])
                } else {
                    tickerData.data[periods[j]] = yFResult
                }
            }
            // yFinanceCollection.insertOne(tickerData)
        }
        res.status(200).json({ message: "Yfinance tickers added" });
    } catch (err) {
        console.log("Error in initialSaveHistoricalDataYFinance", err)
        res.status(500).json({ message: "Error in initialSaveHistoricalDataYFinance" });
    } finally {
        close("saveHistoricalDataYFinance");
    }
}

const updateHistoricalDataYFinance = async (req, res) => {
    const { period } = req.body
    try {
        const db = await connect("updateHistoricalDataYFinance");
        const yFinanceCollection = db.collection("yFinance");
        const pipeline = [
            { $project: { ticker_name: 1, last_updated: 1 } } // Specify the keys you want to retrieve
        ];
        const tickers = await yFinanceCollection.aggregate(pipeline).toArray()
        let datas = {}
        // change length later
        // updates all the tickers in the db
        for (let i = 0; i < tickers.length - 4; i++) {
            console.log("====================================")

            let currentUnixTime = new Date().getTime()
            let lastUpdatedUnixTime = new Date(convertToISODateTime(tickers[i].last_updated)).getTime()
            console.log("currentUnixTime", currentUnixTime, "lastUpdatedUnixTime", lastUpdatedUnixTime)

            let diff = currentUnixTime - lastUpdatedUnixTime
            let days = diff / (1000 * 3600 * 24)

            if (days > 1) {
                console.log("ticker", tickers[i].ticker_name, " needs to be updated")
                let params = {
                    ticker_name: tickers[i].ticker_name,
                    from: formatLocaleToYFinanceDate(tickers[i].last_updated),
                    to: `${formatLocaleToYFinanceDate(new Date().toLocaleString())}`,
                    period: period
                }

                let yFResult = await getHistoricalDataYFinance(params)
                if (yFResult.length !== 0) {
                    let resu = await insertYFinanceData({ _id: tickers[i]._id, dataType: period, values: yFResult })
                    datas[tickers[i].ticker_name] = { yFR: yFResult, newTickerData: resu }
                } else {
                    console.log("No data found for ", tickers[i].ticker_name, " with period ", period)
                }
            } else {
                console.log("ticker", tickers[i].ticker_name, " is up to date", days)
            }
        }
        res.status(200).json({ message: "Yfinance update check", updatedData: datas });
    } catch (err) {
        console.log("Error in updateHistoricalDataYFinance", err)
        res.status(500).json({ message: "Error in updateHistoricalDataYFinance" });
    } finally {
        close("updateHistoricalDataYFinance");
    }
}

module.exports = {
    initialSaveHistoricalDataYFinance,
    updateHistoricalDataYFinance,
}