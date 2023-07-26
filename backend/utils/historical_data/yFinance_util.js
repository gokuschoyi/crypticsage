const yahooFinance = require('yahoo-finance2').default;
const { connect } = require('../../services/db-conn')

// new Date 10/07/2023, 12:19:38 pm to yyyy-mm-dd
const formatDateForYFinance = (param) => {
    // console.log(" Date param", param)
    const [date, tz] = param.split(', ');
    const [month, day, year] = date.split('/')
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
}

/* {
    "ticker_name": "AAPL",
    "from": "2012-01-01", // YYYY-MM-DD
    "to": "2012-06-30", // YYYY-MM-DD
    "period": "" // '1d' (daily), '1wk' (weekly), '1mo' (monthly), "1d", "1wk", "1mo"
    Valid intervals: [1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo] but only 1 week data per request
} */

const getHistoricalYFinanceData = async (params) => {
    const { ticker_name, from, to, period } = params;
    const query = ticker_name;
    const queryOptions = {
        period1: from,
        period2: to,
        interval: period
    }
    let result;
    let fResult;
    try {
        console.log("Fetching historical data for ", ticker_name, " from ", from, " to ", to, " with period ", period);
        result = await yahooFinance.historical(query, queryOptions)
        fResult = result.map((token) => {
            let unixTime = new Date(token.date).getTime();
            return {
                ...token,
                date: unixTime
            }
        })
    } catch (err) {
        console.log(err)
    }
    return fResult
}

// oldest data first saved to db
const insertHistoricalYFinanceDate = async (params) => {
    const { tickerData, tickerName } = params
    try {
        console.log("saiving", tickerName, "to db")
        const db = await connect("saveHistoricalDataYFinance")
        const yFinanceCollection = db.collection("yFinance_new");
        await yFinanceCollection.insertOne(tickerData)
    } catch (err) {
        console.log(err)
    }
}

const getAvailableYfTickersInDb = async () => {
    try {
        const db = await connect("get available yFinance tickers in db")
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
    } catch (err) {
        console.log(err)
        throw err
    }
}

// returns all the tickers in yFinance individually with time period
const getYFinanceTickerInfo = async (params) => {
    let tickers;
    try {
        console.log("Fetching y-finance token info from db")
        const db = await connect("updateHistoricalDataYFinance");
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
    } catch (err) {
        console.log(err)
    }
    return tickers;
}

// takes the last_updated and checks if that ticker needs update or not
// returns [daysElapsed, from, to]
const checkForUpdates = async (params) => {
    const { last_updated } = params;

    // Get the current date adjusted for the desired time zone and convert to UTC
    // 2023-07-10T00:00:00.000+00:00 to 10/07/2023, 10:00:00 am
    const currentDate = new Date();
    const currentUTCDate = new Date(currentDate.toLocaleString('en-US', { timeZone: "UTC" }))

    const l_updated = new Date(last_updated); // Convert the GMT time to a Date object
    const lastUpdatedTickerDate = new Date(l_updated.toLocaleString("en-US", { timeZone: "Australia/Sydney" }));

    const timeDiff = currentUTCDate.getTime() - lastUpdatedTickerDate.getTime(); // Calculate the time difference in milliseconds
    let daysElapsed = parseFloat((timeDiff / (1000 * 3600 * 24)).toFixed(2)) // Convert milliseconds to days

    if (daysElapsed > 0) {
        let from = formatDateForYFinance(lastUpdatedTickerDate.toLocaleString())
        let to = formatDateForYFinance(currentUTCDate.toLocaleString())
        if (from === to) {
            return [daysElapsed = 0]
        }
        return [daysElapsed, from, to]
    } else {
        return [daysElapsed = 0]
    }

    // console.log("elapsed :", daysElapsed, currentUTCDate.toLocaleString(), "+", lastUpdatedTickerDate.toLocaleString())

}

// insert all new token values to their respective collections
const insertLatestYFinanceData = async (params) => {
    const { _id, period, data } = params
    let updateResult;
    try {
        console.log("Saving data to database")
        const db = await connect("insertYFinanceData");
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
    } catch (err) {
        console.log(err)
    }
    return updateResult.modifiedCount
}

module.exports = {
    formatDateForYFinance
    , getHistoricalYFinanceData
    , insertHistoricalYFinanceDate
    , getAvailableYfTickersInDb
    , getYFinanceTickerInfo
    , checkForUpdates
    , insertLatestYFinanceData
}