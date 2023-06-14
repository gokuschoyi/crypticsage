const { connect, close } = require('../db-conn')
const {
    getHistoricalDataYFinance,
    formatLocaleDate,
    formatYFinanceDate,
    convertToISODateTime,
    formatLocaleToYFinanceDate,
    insertYFinanceData,
    getHistoricalDataBinance,
    formatBinaceDate,
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

            if (days < 1) {
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


// Binance tickers to fetch BTCUSDT, ETHUSDT, ADAUSDT, SOLUSDT
// "BTCUSDT", "ETHUSDT", "ADAUSDT", "SOLUSDT"
// Available periods: 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w
// "1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w"

const initialSaveHistoricalDataBinance = async (req, res) => {
    const tickers = ["BTCUSDT"]
    const periods = ["5m"]
    try {
        const db = await connect("saveHistoricalDataBinance");
        const binanceCollection = db.collection("Binance");
        let tickerDataColl = {}
        let binanceResult
        const currentDate = formatBinaceDate(new Date().toLocaleString())
        for (let i = 0; i < tickers.length; i++) {
            let tickerData = {
                ticker_name: tickers[i],
                last_updated: new Date().toLocaleString(),
                data: {}
            }
            tickerDataColl[tickers[i]] = tickerData
            for (let j = 0; j < periods.length; j++) {
                let params = {
                    ticker_name: tickers[i],
                    from: "05-14-2021",
                    to: `${currentDate}`,
                    period: periods[j]
                }
                binanceResult = await getHistoricalDataBinance(params)
                if (binanceResult.length === 0) {
                    console.log("No data found for ", tickers[i], " with period ", periods[j])
                } else {
                    tickerDataColl[tickers[i]].data[periods[j]] = binanceResult
                }
            }
        }
        res.status(200).json({ message: "Binance tickers added", data: tickerDataColl });
    } catch (err) {
        console.log("Error in initialSaveHistoricalDataBinance", err)
        res.status(500).json({ message: "Error in initialSaveHistoricalDataBinance" });
    } finally {
        close("saveHistoricalDataBinance");
    }
}

module.exports = {
    initialSaveHistoricalDataYFinance,
    updateHistoricalDataYFinance,
    initialSaveHistoricalDataBinance
}