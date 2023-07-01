var yahooFinance = require('yahoo-finance');
const axios = require('axios');
const { connect } = require('../db-conn')
/* {
    "ticker_name": "AAPL",
    "from": "2012-01-01", // YYYY-MM-DD
    "to": "2012-06-30", // YYYY-MM-DD
    "period": "" // 'd' (daily), 'w' (weekly), 'm' (monthly), 'v' (dividends only)
} */

const getHistoricalDataYFinance = async (params) => {
    const { ticker_name, from, to, period } = params
    console.log("Fetching historical data for ", ticker_name, " from ", from, " to ", to, " with period ", period);
    let result = await yahooFinance.historical({
        symbol: ticker_name,
        from: from,
        to: to,
        period: period
    });
    console.log("----------------------------------------------")
    for (let i = 0; i < result.length; i++) {
        result[i] = {
            openTime: new Date(result[i].date).getTime(),
            open: result[i].open,
            high: result[i].high,
            low: result[i].low,
            close: result[i].close,
            adjClose: result[i].adjClose,
            volume: result[i].volume
        }
    }
    return result
}


const getYfinanceQuotes = async (symbols) => {
    console.log("Fetching quotes for ", symbols)
    try {
        let result = await yahooFinance.quote({
            symbols: symbols,
            modules: ['price', 'summaryDetail', 'earnings', 'defaultKeyStatistics', 'financialData']
        }, function (err) {
            console.log(err);
        });
        let data = []
        for (item in symbols) {
            let symbol = symbols[item]
            let tokenData = {
                "symbol": symbol,
                "open": result[symbol].summaryDetail?.open || "N/A",
                "high": result[symbol].summaryDetail?.dayHigh || "N/A",
                "low": result[symbol].summaryDetail?.dayLow || "N/A",
                "divident_rate": result[symbol].summaryDetail?.dividendRate || "N/A",
                "divident_yield": result[symbol].summaryDetail?.dividendYield || "N/A",
                "five_year_avg_dividend_yield": result[symbol].summaryDetail?.fiveYearAvgDividendYield || "N/A",
                "market_cap": result[symbol].summaryDetail?.marketCap || "N/A",
                "fiftyTwoWeekLow": result[symbol].summaryDetail?.fiftyTwoWeekLow || "N/A",
                "fiftyTwoWeekHigh": result[symbol].summaryDetail?.fiftyTwoWeekHigh || "N/A",
                "enterpriseValue": result[symbol].defaultKeyStatistics?.enterpriseValue || "N/A",
                "pegRatio": result[symbol].defaultKeyStatistics?.pegRatio || "N/A",
                "currentQuarterEstimate": result[symbol].earnings?.earningsChart.currentQuarterEstimate || "N/A",
                "financial_chart": result[symbol].earnings?.financialsChart.yearly || "N/A",
                "short_name": result[symbol].price.shortName || "N/A",
                "total_cash": result[symbol].financialData?.totalCash || "N/A",
                "ebitda": result[symbol].financialData?.ebitda || "N/A",
                "total_debt": result[symbol].financialData?.totalDebt || "N/A",
                "total_revenue": result[symbol].financialData?.totalRevenue || "N/A",
                "debt_to_equity": result[symbol].financialData?.debtToEquity || "N/A",
                "gross_profit": result[symbol].financialData?.grossProfits || "N/A",
                "free_cashflow": result[symbol].financialData?.freeCashflow || "N/A",
                "operating_cashflow": result[symbol].financialData?.operatingCashflow || "N/A",
                "rev_growth": result[symbol].financialData?.revenueGrowth || "N/A",
            }
            console.log(result[symbol].financialData?.currentPrice)
            data.push(tokenData)
        }
        return data
    } catch (err) {
        console.log("Error in getYfinanceQuotes", err)
    }
}

// converts locale date to iso date time
// 13/06/2023, 4:18:46 pm to 2023-06-13T16:18:46.000Z 
const convertToISODateTime = (dateString) => {
    const [datePart, timePart] = dateString.split(", ");
    const [day, month, year] = datePart.split("/");
    const [time, period] = timePart.split(" ");
    const [hour, minute, second] = time.split(":");

    function formatHour(hour, period) {
        if (period.toLowerCase() === "pm" && hour < 12) {
            return String(Number(hour) + 12);
        } else {
            return hour;
        }
    }

    const formattedDateTime = `${year}-${month}-${day}T${formatHour(hour, period)}:${minute}:${second}.000Z`;
    return formattedDateTime;
}

// 13-06-2023 to 06-13-2023
const formatLocaleDate = (dateStr) => {
    const parts = dateStr.split(',');
    const date = parts[0];
    const [day, month, year] = date.split('/');
    const formattedDate = `${month}-${day}-${year}`;
    return formattedDate;
}

// 06-13-2023 to 2023-06-13
const formatYFinanceDate = (date) => {
    const parts = date.split('-');
    const month = parts[0];
    const day = parts[1];
    const year = parts[2];
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
}

const formatLocaleToYFinanceDate = (dateString) => {
    const [datePart, timePart] = dateString.split(", ");
    const [day, month, year] = datePart.split("/");
    const formattedDate = `${year}-${month}-${day}`;
    return formattedDate;
}

// input //
// _id = document id of the ticker in mongodb
// dataType = d, w, m
// values = array of latest ticker data fetched from yFinace

// output //
// result = result of the update query, modifiedCount = 1 if updated, 0 if not updated

const insertYFinanceData = async (props) => {
    const { _id, dataType, values } = props

    const db = await connect("insertYFinanceData");
    const yFinanceCollection = db.collection("yFinance");
    const filters = {
        "_id": _id
    };
    const projection = {
        [`data.${dataType}`]: { $slice: [`$data.${dataType}`, 2] }
    };
    const options = {
        projection
    };
    const result = await yFinanceCollection.findOne(filters, options); // top 2 values to check for latest ticker value
    // console.log("result", result)
    let latestTickerDataInDb = result.data.d[0]
    let latestTickerDatafromYF = values.filter((value) => value.date > latestTickerDataInDb.date)

    const update = {
        $push: {
            [`data.${dataType}`]: { $each: latestTickerDatafromYF, $position: 0 }
        }
    }

    const updateResult = await yFinanceCollection.updateOne(filters, update);

    return updateResult.modifiedCount
}



// Binance API //

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
    console.log("Total no of calls to the API", divisions)

    let data = []
    for (let i = 0; i < divisions.length; i++) {
        console.log("Fetching batch ", i + 1, "of ", divisions.length, " batches")
        let start = divisions[i].start
        let end = divisions[i].end
        let url = `https://api.binance.com/api/v3/klines?symbol=${ticker_name}&interval=${period}&startTime=${start}&endTime=${end}&limit=1000`
        let response = await axios.get(url)
        data = [...data, ...response.data]
    }

    for (let i = 0; i < data.length; i++) {
        if (i % 100 === 0) {
            console.log("Processing data ", i + 1, "of ", data.length, " data")
        }
        data[i] = {
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
    if (data.length > 0) {
        return data
    } else {
        res.status(200).json({ message: `No data found for token - ${ticker_name} Binance` })
    }
}

const insertBinanceData = async (props) => {
    const { ticker_name, period, tokenData } = props
    const db = await connect("insertBinanceData");
    const binanceCollection = db.collection("binance");

    // Check if the ticker already exists in the database
    const existingTicker = await binanceCollection.findOne({ ticker_name });
    if (existingTicker) {
        let isDataForPeriodAvailable = existingTicker.data[period] ? true : false;
        if (isDataForPeriodAvailable) {
            let latestTickerDataInDb = existingTicker.data[period][0].openTime;
            let latestTickerDataFromBinance = tokenData.filter((data) => data.openTime > latestTickerDataInDb);

            // check if the latestTickerDataFromBinance is not empty and then update the document
            if (latestTickerDataFromBinance.length !== 0) {
                console.log("new document count", latestTickerDataFromBinance.length)
                // Update the existing document with the new token data for the respective period filtered by latestTickerDataInDb
                const updateResult = await binanceCollection.updateOne(
                    { ticker_name },
                    {
                        $push: { [`data.${period}`]: { $each: latestTickerDataFromBinance, $position: 0 } },
                        $set: { lastUpdated: new Date().toLocaleString() }
                    }
                );
                return updateResult;
            } else {
                return { message: `No new data found for token - ${ticker_name} ${period}, Binance` }
            }
        } else {
            const updateResult = await binanceCollection.updateOne(
                { ticker_name },
                { $set: { [`data.${period}`]: tokenData, lastUpdated: new Date().toLocaleString() } }
            );
            return updateResult;
        }
    } else {
        // Insert a new document (ticker object) for the ticker with the token data
        const tickerData = {
            ticker_name,
            lastUpdated: new Date().toLocaleString(),
            data: {
                [period]: tokenData
            }
        };
        const insertResult = await binanceCollection.insertOne(tickerData);
        return insertResult;
    }
}

module.exports = {
    getHistoricalDataYFinance,
    getYfinanceQuotes,
    formatLocaleDate,
    formatYFinanceDate,
    formatLocaleToYFinanceDate,
    convertToISODateTime,
    insertYFinanceData,
    formatBinaceDate,
    periodToMilliseconds,
    getHistoricalDataBinance,
    insertBinanceData
}