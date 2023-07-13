const axios = require('axios');
const { connect } = require('../../services/db-conn');

const periodToMilliseconds = (period) => {
    switch (period) {
        case '1m':
            return 1000 * 60;
        case '3m':
            return 1000 * 60 * 3;
        case '5m':
            return 1000 * 60 * 5;
        case '15m':
            return 1000 * 60 * 15;
        case '30m':
            return 1000 * 60 * 30;
        case '1h':
            return 1000 * 60 * 60;
        case '2h':
            return 1000 * 60 * 60 * 2;
        case '4h':
            return 1000 * 60 * 60 * 4;
        case '6h':
            return 1000 * 60 * 60 * 6;
        case '8h':
            return 1000 * 60 * 60 * 8;
        case '12h':
            return 1000 * 60 * 60 * 12;
        case '1d':
            return 1000 * 60 * 60 * 24;
        case '3d':
            return 1000 * 60 * 60 * 24 * 3;
        case '1w':
            return 1000 * 60 * 60 * 24 * 7;
        default:
            return 1000 * 60 * 60 * 24;
    }
}

const divideTimePeriod = (startTime, endTime, period, limit) => {
    const duration = endTime - startTime; // in milliseconds
    const periodInMilliseconds = periodToMilliseconds(period);
    const numberOfDivisions = Math.ceil(duration / (limit * periodInMilliseconds));
    const divisions = [];

    for (let i = 0; i < numberOfDivisions; i++) {
        const start = startTime + i * limit * periodInMilliseconds;
        const end = Math.min(start + limit * periodInMilliseconds, endTime);
        divisions.push({ start, end });
    }

    return divisions;
}

const formatBinaceDate = (dateString) => {
    const [datePart, timePart] = dateString.split(", ");
    const [day, month, year] = datePart.split("/");
    const formattedDate = `${month}-${day}-${year}`;
    return formattedDate;
}

const initializeBinanceDb = async (params) => {
    const { tickers, periods } = params;
    console.log(tickers)
    const resArr = []
    let res
    try {
        const db = await connect("init binance db")
        const binanceCollection = db.collection('binance')

        for (const tickerName of tickers) {
            // Initialize the `data` object
            const data = {};
            for (const period of periods) {
                data[period] = { historical: [], last_updated: "" };
            }

            const filter = { ticker_name: tickerName };
            const update = { $setOnInsert: { ticker_name: tickerName, data: data } };
            const options = { upsert: true };

            const result = await binanceCollection.findOneAndUpdate(filter, update, options);

            if (result.value) {
                resArr.push({ ticker: tickerName, result: result })
                console.log(`Ticker ${tickerName} already exists, skipping update`);
            } else {
                resArr.push({ ticker: tickerName, result: result })
                console.log(`Inserted new ticker ${tickerName}`);
            }
        }
    } catch (err) {
        console.log(err)
    }
    return resArr
}

/* {
    "ticker_name": "ETHUSDT",
    "from": "01-01-2016", // MM-DD-YYYY
    "to": "12-30-2016", // MM-DD-YYYY
    "period": "" // 1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w */

const getHistoricalDataBinance = async (params) => {
    const { ticker_name, from, to, period } = params

    var startDate = new Date(from).getTime();
    var endDate = new Date(to).getTime();

    var divisions = divideTimePeriod(startDate, endDate, period, limit = 1000)
    // console.log("Total no of calls to the API", divisions)

    const fetchData = async () => {
        let data = []
        for (let i = 0; i < divisions.length; i++) {
            // console.log("Fetching batch ", i + 1, "of ", divisions.length, " batches")
            let start = divisions[i].start
            let end = divisions[i].end
            let url = `https://api.binance.com/api/v3/klines?symbol=${ticker_name}&interval=${period}&startTime=${start}&endTime=${end}&limit=1000`
            let response = await axios.get(url)
            data = [...data, ...response.data]
        }
        return data
    }

    const convertData = async (data) => {
        let convertedData = []
        for (let i = 0; i < data.length; i++) {
            convertedData[i] = {
                openTime: data[i][0],
                open: data[i][1],
                high: data[i][2],
                low: data[i][3],
                close: data[i][4],
                volume: data[i][5],
                closeTime: data[i][6],
                quoteAssetVolume: data[i][7],
                trades: data[i][8],
                takerBaseAssetVolume: data[i][9],
                takerQuoteAssetVolume: data[i][10],
            }
        }
        return convertedData
    }

    let data = await fetchData()
    const cData = await convertData(data)
    console.log(cData.length)
    return cData;
}

const insertBinanceDataToDb = async (param) => {
    const { ticker_name, period, tokenData } = param;
    const db = await connect("insertBinanceData");
    const binanceCollection = db.collection("binance");

    try {
        const existingTickerInDb = await binanceCollection.findOne({ ticker_name });
        if (existingTickerInDb) {
            console.log("ticker exists");
            const dataForPeriod = existingTickerInDb.data[period];
            const historicalDataExists = dataForPeriod && dataForPeriod.historical.length > 0;

            if (historicalDataExists) {
                console.log("period for token exists");
                return { message: "no historical update needed" };
            } else {
                let pushDataToDb;
                if (tokenData.length > 0) {
                    console.log(`new document count for ${ticker_name}_${period}`, tokenData.length);
                    const latestDateInData = tokenData[tokenData.length - 1].openTime;
                    const updateQuery = {
                        $push: { [`data.${period}.historical`]: { $each: tokenData } },
                        $set: { [`data.${period}.last_updated`]: new Date(latestDateInData).toLocaleString() },
                    };
                    pushDataToDb = await binanceCollection.updateOne({ ticker_name }, updateQuery);
                    return pushDataToDb;
                }
                else {
                    console.log(`new document count for ${ticker_name}_${period}`, tokenData.length);
                    return pushDataToDb = ["no data to push"]
                }
            }
        } else {
            console.log(`Ticker ${ticker_name} does not exist. Adding to db`);
            const latestDateInData = tokenData[tokenData.length - 1].openTime;
            const newDocument = {
                ticker_name,
                data: {
                    [period]: {
                        historical: tokenData,
                        last_updated: new Date(latestDateInData).toLocaleString(),
                    },
                },
            };
            const insertNewObj = await binanceCollection.insertOne(newDocument);
            return insertNewObj;
        }
    } catch (err) {
        console.log(err);
        throw err; // Propagate the error to the caller
    }
};


module.exports = {
    getHistoricalDataBinance,
    insertBinanceDataToDb,
    formatBinaceDate,
}