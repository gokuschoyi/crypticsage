const { connect, close } = require('../services/db-conn');
const { periodToMilliseconds } = require('../utils/crypto/crypto-stocks-util')
const { client } = require('../services/redis')

// INPUT : dataSource, tokenName, period (Required)
// dataSource : "binance" or "yFinance"

// yFinance tokenName : AAPL, TSLA, AMZN, GOOGL, MSFT
// yFinance periods  :  d, w, m (d - daily, w - weekly, m - monthly)

// binance tokenName : "BTCUSDT", "ETHUSDT", "ADAUSDT", "SOLUSDT"
// binance period : "1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w"

// OUTPUT: arrya of objects with keys: openTime, open, high, low, close, volume
// requiredColumns = ['openTime', 'open', 'high', 'low', 'close', 'volume'];
const fetchTokenData = async (dataSource, tokenName, period) => {
    console.log(`Fetching data for ${tokenName} with period ${period} from ${dataSource}`)
    try {
        const db = await connect("fetch token data");
        const tokenDataCollection = db.collection(`${dataSource}`);
        const tokenData = await tokenDataCollection.findOne(
            {
                ticker_name: `${tokenName}`,
            },
            {
                projection: {
                    _id: 0,
                    [`data.${period}.historical`]: {
                        $map: {
                            input: `$data.${period}.historical`,
                            as: "item",
                            in: {
                                openTime: "$$item.openTime",
                                open: "$$item.open",
                                high: "$$item.high",
                                low: "$$item.low",
                                close: "$$item.close",
                                volume: "$$item.volume"
                            }
                        }
                    }
                }
            }
        )
        if (tokenData) {
            return tokenData.data[period].historical
        } else {
            return ['no data']
        }
    } catch (err) {
        console.log(err)
        throw err
    } finally {
        close("fetch token data");
    }
}

const getTokenData = async (req, res) => {
    const { dataSource, tokenName, period } = req.body
    let tResult
    try {
        tResult = await fetchTokenData(dataSource, tokenName, period)
        res.status(200).json({ message: "Token Data fetched successfully", tResult })
    } catch (err) {
        console.log(err)
        res.status(400).json({ message: "Something went wrong" })
    }

}

// INPUT : cacheKey (Required) : "binance-BTCUSDT-1m"
// OUTPUT: Token Data stored in Redis, array of objects with keys: openTime, open, high, low, close, volume
const getValuesFromRedis = (cacheKey) => {
    return new Promise((resolve, reject) => {
        client.get(cacheKey, (error, result) => {
            if (error) {
                console.error("Error retrieving value from Redis:", error);
                reject(error);
            } else if (result) {
                console.log("Fetching data from Redis store for key:", cacheKey);
                resolve(JSON.parse(result));
            } else {
                console.log("Value does not exist in Redis store");
                resolve(null);
            }
        })
    })
}

// INPUT :
// tokenData [{},{}]
// windowSize : 10
// keyName : "sma10"	
const functionCalculateEMA = async (data, windowSize, keyName) => {
    console.log(keyName)
    const emaArray = [];
    let modifiedData = []
    if (data.length < windowSize) {
        return modifiedData;
    } else {
        // Calculate the initial Simple Moving Average (SMA)
        let sum = 0;
        for (let i = 0; i < windowSize; i++) {
            sum += parseFloat(data[i].open);
        }
        const sma = sum / windowSize;

        data[0][keyName] = sma.toFixed(8);
        emaArray.push(sma);

        // Calculate the EMA using the previous EMA and the current close value
        for (let i = 1; i < data.length; i++) {
            const previousEMA = emaArray[i - 1];
            const currentOpen = parseFloat(data[i].open);
            const multiplier = 2 / (windowSize + 1);
            const currentEMA = (currentOpen - previousEMA) * multiplier + previousEMA;
            emaArray.push(currentEMA);
            data[i][keyName] = currentEMA.toFixed(8);
        }

        return data;
    }
}

// INPUT :   
// {
//    "dataSource":"binance",
//    "tokenName":"BTCUSDT",
//    "period":"1d"
// }
const calculateSMA = async (req, res) => {
    const { dataSource, tokenName, period } = req.body
    const cacheKey = `${dataSource}-${tokenName}-${period}`;
    let requiredTokenData = [];
    const windowSize = 10;

    requiredTokenData = await getValuesFromRedis(cacheKey);
    requiredTokenData.reverse()
    if (requiredTokenData.length < windowSize) {
        res.status(400).json({ message: "Not enough data to calculate SMA", data: requiredTokenData })
    } else {
        let sum = 0;
        for (let i = 0; i < windowSize; i++) {
            sum += parseFloat(requiredTokenData[i].close);
        }

        const sma = sum / windowSize;
        requiredTokenData[0].sma = sma.toFixed(8);
        // calculate the SMA for the first w  values, as there are not enough values in the history
        for (let i = 1; i < requiredTokenData.length - windowSize; i++) {
            sum = sum - parseFloat(requiredTokenData[i - 1].close) + parseFloat(requiredTokenData[i + windowSize - 1].close);
            const currentSMA = sum / windowSize;
            requiredTokenData[i].sma = currentSMA.toFixed(8);
        }
        let modifiedData = requiredTokenData.map((item) => {
            return {
                openTime: new Date(item.openTime).toLocaleString(),
                open: item.open,
                close: item.close,
                sma: item?.sma || null
            }
        })
        modifiedData = modifiedData.reverse();
        res.status(200).json({ message: "SMA calculated successfully", requiredTokenData, modifiedData })
    }
}

// INPUT :   
// {
//    "dataSource":"binance",
//    "tokenName":"BTCUSDT",
//    "period":"1d"
// }
const calculateEMA = async (req, res) => {
    const { dataSource, tokenName, period } = req.body
    const cacheKey = `${dataSource}-${tokenName}-${period}`;
    let requiredTokenData = await getValuesFromRedis(cacheKey);
    requiredTokenData = requiredTokenData.reverse();
    const windowSize = 10;
    const keyName = "ema";

    let emaData = await functionCalculateEMA(requiredTokenData, windowSize, keyName);

    if (emaData.length === 0) {
        res.status(400).json({ message: "Not enough data to calculate EMA" })
    } else {
        let modifiedData = emaData.map((item) => {
            return {
                openTime: new Date(item.openTime).toLocaleString(),
                open: item.open,
                close: item.close,
                [keyName]: item[keyName]
            }
        })
        let length = modifiedData.length;
        modifiedData = modifiedData.reverse()
        res.status(200).json({ message: "EMA calculated successfully", length, modifiedData })
    }
}

// INPUT :   
// {
//    "dataSource":"binance",
//    "tokenName":"BTCUSDT",
//    "period":"1d"
// }
const calculateBollingerBands = async (req, res) => {
    const { dataSource, tokenName, period } = req.body
    const cacheKey = `${dataSource}-${tokenName}-${period}`;
    let requiredTokenData = await getValuesFromRedis(cacheKey);
    requiredTokenData = requiredTokenData.reverse()
    let bolingerTokenData = JSON.parse(JSON.stringify(requiredTokenData));

    const windowSize = 10;
    const numStandardDeviations = 2;

    const calculateTP = async (tokenData) => {
        let bolingerDataWithTP = tokenData.map((item) => {
            let typicalPrice = ((parseFloat(item.high) + parseFloat(item.low) + parseFloat(item.close)) / 3).toFixed(8);
            return {
                ...item,
                tp: typicalPrice,
                upperBand: null,
                middleBand: null,
                lowerBand: null
            }
        })
        return bolingerDataWithTP;
    }

    if (requiredTokenData.length < windowSize) {
        res.status(400).json({ message: "Not enough data to calculate Bollinger Bands" })
    } else {
        let tokenDataWithTP = await calculateTP(bolingerTokenData);
        for (let i = windowSize - 1; i < tokenDataWithTP.length; i++) {
            const typicalPriceArray = tokenDataWithTP.slice(i - windowSize + 1, i + 1).map(obj => parseFloat(obj.tp));

            const avgTP = typicalPriceArray.reduce((sum, price) => sum + price, 0) / windowSize;
            const standardDeviation = Math.sqrt(typicalPriceArray.reduce((sum, price) => sum + Math.pow(price - avgTP, 2), 0) / windowSize);

            const upperBand = avgTP + numStandardDeviations * standardDeviation;
            const lowerBand = avgTP - numStandardDeviations * standardDeviation;

            tokenDataWithTP[i - windowSize + 1].upperBand = upperBand.toFixed(8);
            tokenDataWithTP[i - windowSize + 1].middleBand = avgTP.toFixed(8);
            tokenDataWithTP[i - windowSize + 1].lowerBand = lowerBand.toFixed(8);

        }

        tokenDataWithTP = tokenDataWithTP.map((item) => {
            return {
                ...item,
                openTime: new Date(item.openTime).toLocaleString(),
            }
        })

        tokenDataWithTP = tokenDataWithTP.reverse();
        let length = tokenDataWithTP.length;
        res.status(200).json({ message: "Bollinger Bands calculated successfully", length, tokenDataWithTP })
    }
}

// INPUT :   
// {
//    "dataSource":"binance",
//    "tokenName":"BTCUSDT",
//    "period":"1d"
// }
const calculateIchimokuCloud = async (req, res) => {
    const { dataSource, tokenName, period } = req.body
    const cacheKey = `${dataSource}-${tokenName}-${period}`;

    const tenkanSenPeriod = 9; // Change this to the desired period
    const kijunSenPeriod = 26; // Change this to the desired period
    const leadingSpanAPeriod = 26;// Change this to the desired period
    const leadingSpanBPeriod = 52;// Change this to the desired period
    const laggingSpanPeriod = 26;// Change this to the desired period

    let requiredTokenData = await getValuesFromRedis(cacheKey);
    let latestDateInData = requiredTokenData[0].openTime;

    const addExtraLeadingSpanAData = (data) => {
        let extraLeadingSpanAData = [];
        for (let i = 1; i <= leadingSpanAPeriod; i++) {
            let buffer = (i * periodToMilliseconds(period))
            let time = (latestDateInData + buffer)
            extraLeadingSpanAData.push({ openTime: time });
        }
        extraLeadingSpanAData = extraLeadingSpanAData.reverse();
        return [...extraLeadingSpanAData, ...data];
    }

    let lengthBeforePadding = requiredTokenData.length;
    requiredTokenData = addExtraLeadingSpanAData(requiredTokenData);

    //oldest data is at the start of the array
    // requiredTokenData = requiredTokenData.reverse();

    // Calculate the Tenkan Sen and Kikun Sen for the given period
    const calculatePeriodHighLow = (type, data, tksPeriod) => {
        for (let i = 1; i <= data.length; i++) {
            if (i >= tksPeriod) {
                const highValues = data.slice(i - tksPeriod, i).map(obj => parseFloat(obj.high));
                const lowValues = data.slice(i - tksPeriod, i).map(obj => parseFloat(obj.low));
                const calculatedPeriodValue = (Math.max(...highValues) + Math.min(...lowValues)) / 2;
                if (isNaN(calculatedPeriodValue) === false) {
                    data[i - 1][type] = calculatedPeriodValue.toFixed(8);
                } else {
                    data[i - 1][type] = null;
                }
            } else {
                data[i - 1][type] = null;
            }
        }
        return data;
    };

    // Calculate the Leading Span A for the given period and shift it forward by lSpanAPeriod
    const calculateLeadingSpanA = (type, data, lSpanAPeriod) => {
        let startIndex = kijunSenPeriod - 1;
        for (let i = 0; i < data.length - kijunSenPeriod; i++) {
            if (i >= startIndex) {
                let obj = data[i];
                let leadingSpanAValue = ((parseFloat(obj.tenkanSen) + parseFloat(obj.kijunSen)) / 2).toFixed(8);
                data[i + lSpanAPeriod - 1][type] = leadingSpanAValue;
            } else {
                data[i][type] = null;
            }
        }
        for (i = kijunSenPeriod - 1; i < kijunSenPeriod + lSpanAPeriod - 1; i++) {
            data[i][type] = null;
        }
        return data;
    }

    // Calculate the Leading Span B for the given period and shift it forward by kijunSenPeriod
    const calculateLeadingSpanB = (type, data, lSpanBPeriod) => {
        for (let i = 1; i <= data.length - leadingSpanAPeriod; i++) {
            if (i >= lSpanBPeriod) {
                const highValues = data.slice(i - lSpanBPeriod, i).map(obj => parseFloat(obj.high));
                const lowValues = data.slice(i - lSpanBPeriod, i).map(obj => parseFloat(obj.low));
                const valHigh = Math.max(...highValues);
                const valLow = Math.min(...lowValues);
                const spanB = (valHigh + valLow) / 2;
                // console.log(i+25, valHigh, valLow, spanB)
                data[i + 26 - 1][type] = spanB.toFixed(8);
            } else {
                data[i + 26 - 1][type] = null;
            }
        }
        for (i = 0; i < kijunSenPeriod + lSpanBPeriod - 2; i++) {
            data[i][type] = null;
        }
        return data;
    }

    // Calculate the Lagging Span for the given period and shift it backward by laggingSpanPeriod
    const calculateLaggingSpan = (type, data, lSPeriod) => {
        for (let i = lSPeriod - 1; i < data.length; i++) {
            data[i - lSPeriod + 1][type] = data[i].close;
        }
        return data;
    }

    let length = requiredTokenData.length;
    // res.status(200).json({ message: "Ichimoku Cloud calculated successfully", lengthBeforePadding, length, requiredTokenData })

    if (requiredTokenData.length < 52) {
        res.status(400).json({ message: "Not enough data to calculate Ichimoku Cloud" })
    } else {
        let tksen = calculatePeriodHighLow(type = "tenkanSen", requiredTokenData, tenkanSenPeriod);
        let kjsen = calculatePeriodHighLow(type = "kijunSen", tksen, kijunSenPeriod);
        let leadingSpanA = calculateLeadingSpanA(type = "leadingSpanA", kjsen, leadingSpanAPeriod);
        let leadingSpanB = calculateLeadingSpanB(type = "leadingSpanB", leadingSpanA, leadingSpanBPeriod);
        let laggingSpan = calculateLaggingSpan(type = "laggingSpan", leadingSpanB, laggingSpanPeriod);

        let modifiedData = laggingSpan.map(({ openTime, ...rest }) => {
            return {
                openTime: new Date(openTime).toLocaleString(),
                ...rest
            }
        })

        res.status(200).json({ message: "Ichimoku Cloud calculated successfully", lengthBeforePadding, length, modifiedData })
    }
}

// INPUT :   
// {
//    "dataSource":"binance",
//    "tokenName":"BTCUSDT",
//    "period":"1d"
// }
const calculateRSI = async (req, res) => {
    const { dataSource, tokenName, period } = req.body
    const cacheKey = `${dataSource}-${tokenName}-${period}`;
    let requiredTokenData = await getValuesFromRedis(cacheKey);
    let length = requiredTokenData.length;
    // requiredTokenData = requiredTokenData.reverse();
    const RSI_PERIOD = 14;

    const calculateGainLoss = (data) => {
        const priceDiffs = [];
        for (let i = 1; i < data.length; i++) {
            let pChange = ((parseFloat(data[i].close) - parseFloat(data[i - 1].close)) / parseFloat(data[i].close)) * 100;
            priceDiffs.push(
                {
                    openTime: new Date(data[i].openTime).toLocaleString(),
                    close: data[i].close,
                    percentChange: pChange,
                    gain: Math.max(pChange, 0),
                    loss: Math.abs(Math.min(pChange, 0))
                }
            )
        }
        return priceDiffs;
    }

    const calculateGainLossAvg = (data, period) => {
        for (let i = 0; i < data.length; i++) {
            if (i >= period) {
                let gainSum = 0;
                let lossSum = 0;
                for (let j = i - period; j < i; j++) {
                    gainSum += data[j].gain;
                    lossSum += data[j].loss;
                }
                data[i]["avgGain"] = gainSum / period;
                data[i]["avgLoss"] = lossSum / period;
            } else {
                data[i]["avgGain"] = null;
                data[i]["avgLoss"] = null;
            }
        }
        return data;
    }

    const calculateRelativeStrengthIndex = (data) => {
        for (let i = 0; i < data.length; i++) {
            if (i >= RSI_PERIOD) {
                let rs = data[i].avgGain / data[i].avgLoss;
                data[i]["relativeStrength"] = rs;
                data[i]["RSI"] = 100 - (100 / (1 + rs))
            } else {
                data[i]["relativeStrength"] = null;
                data[i]["RSI"] = null;
            }
        }
        return data;
    }

    let priceDiffs = calculateGainLoss(requiredTokenData);

    let avgGainLoss = calculateGainLossAvg(priceDiffs, RSI_PERIOD);

    let relativeStrength = calculateRelativeStrengthIndex(avgGainLoss);
    // relativeStrength = relativeStrength.slice(-150)


    res.status(200).json({ message: "RSI calculated successfully", length, relativeStrength })
}

// INPUT :
// {
//    "dataSource":"binance",
//    "tokenName":"BTCUSDT",
//    "period":"1d"
// }

// ema 1d 127, 12h 254, 4h 762
const calculateMACD = async (req, res) => {
    const { dataSource, tokenName, period } = req.body
    const cacheKey = `${dataSource}-${tokenName}-${period}`;
    let requiredTokenData = await getValuesFromRedis(cacheKey);
    requiredTokenData = requiredTokenData.reverse()
    const ema12KeyName = "ema12"
    const ema26KeyName = "ema26"

    let ema12Data = JSON.parse(JSON.stringify(requiredTokenData))
    let ema26Data = JSON.parse(JSON.stringify(requiredTokenData))
    let length = ema12Data.length;

    ema12Data = ema12Data.reverse();
    ema26Data = ema26Data.reverse();

    let ema12 = await functionCalculateEMA(ema12Data, 12, ema12KeyName);
    let ema26 = await functionCalculateEMA(ema26Data, 26, ema26KeyName);

    let macd = ema12.map((item, index) => {
        let calculatedMacd = parseFloat(item[ema12KeyName]) - parseFloat(ema26[index][ema26KeyName])
        return {
            ...item,
            [ema26KeyName]: ema26[index][ema26KeyName],
            macd: calculatedMacd,
            open: calculatedMacd
        }
    })

    let macdData = JSON.parse(JSON.stringify(macd))

    let signalLine = await functionCalculateEMA(macdData, 9, "signalLine");

    signalLine = signalLine.map((item, index) => {
        return {
            ...item,
            openval: ema12[index].open,
            openTime: new Date(item.openTime).toLocaleString(),
            macdHisto: item.macd - item.signalLine
        }
    })

    res.status(200).json({ message: "MACD calculated successfully", length, signalLine })
}

// INPUT :
// {
//    "dataSource":"binance",
//    "tokenName":"BTCUSDT",
//    "period":"1d"
// }
const calculateATR = async (req, res) => {
    const { dataSource, tokenName, period } = req.body
    const cacheKey = `${dataSource}-${tokenName}-${period}`;
    const ATR_PERIOD = 14;
    let requiredTokenData = await getValuesFromRedis(cacheKey);
    requiredTokenData = requiredTokenData.reverse()
    let lengthRTD = requiredTokenData.length;

    let atrData = JSON.parse(JSON.stringify(requiredTokenData))
    atrData = atrData.reverse();

    const calculateTrueRange = (data) => {
        data[0]["trueRange"] = null;
        for (let i = 1; i < data.length; i++) {
            let trueRange = Math.max(
                data[i].high - data[i].low,
                Math.abs(data[i].high - data[i - 1].close),
                Math.abs(data[i].low - data[i - 1].close)
            )
            data[i]["trueRange"] = trueRange;
        }
        return data;
    }

    // simple moving average of true range
    const calculateAverageTrueRange = (data, period) => {
        for (let i = 0; i < data.length; i++) {
            if (i >= period) {
                let sum = 0;
                for (let j = i - period; j < i; j++) {
                    sum += data[j].trueRange;
                }
                data[i]["atr"] = sum / period;
            } else {
                data[i]["atr"] = null;
            }
        }
        return data;
    }

    let trueRange = calculateTrueRange(atrData);
    // removing first element as there is no tru range for first element
    trueRange = trueRange.slice(1)
    let trLength = trueRange.length;

    let atr = calculateAverageTrueRange(trueRange, ATR_PERIOD);
    atr = atr.map((item) => {
        return {
            ...item,
            openTime: new Date(item.openTime).toLocaleString()
        }
    })

    res.status(200).json({ message: "ATR calculated successfully", lengthRTD, trLength, atr })
}

module.exports = {
    getTokenData,
    fetchTokenData,
    calculateSMA,
    calculateEMA,
    calculateBollingerBands,
    calculateIchimokuCloud,
    calculateRSI,
    calculateMACD,
    calculateATR
};