const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const yahooFinance = require('yahoo-finance2').default; // summary quotes not working
const axios = require('axios').default;

// < - - - - - - - - - - Helper Functions - - - - - - - - - - >

// Fetches the price data from CryptoCompare and Binance in parallel
// INPUT : fsym - from symbol : BTC,ETH : string 
//         tsyms - to symbols : USD,AUD,NZD,CAD,EUR,JPY : string
// OUTPUT : finalPriceData - price data from CryptoCompare
//          ress - exchange info Binance
const fetchDataFromUrls = async ({ fsym, tsyms }) => {
    const priceDataUrl = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${fsym}&tsyms=${tsyms}`
    const binanceURL = "https://api.binance.com/api/v3/exchangeInfo"

    // const promiseOne = axios.get(tokenDataURL)
    const promiseTwo = axios.get(priceDataUrl)
    const promiseThree = axios.get(binanceURL)

    return Promise.all([promiseTwo, promiseThree])
        .then((responses) => {
            const [priceDataResponse, binanceResponse] = responses
            const finalPriceData = priceDataResponse.data.RAW
            const ress = binanceResponse.data.symbols
            return { finalPriceData, ress }
        })
        .catch((error) => {
            let formattedError = JSON.stringify(logger.formatError(error))
            log.error({ message: 'Error in Fetching', error: formattedError })
            throw error
        })
}

// formats the time in milliseconds to human readable format
// INPUT : milliseconds
// OUTPUT : formatted time
const formatMillisecond = (milliseconds) => {
    if (milliseconds < 1000) {
        return milliseconds.toFixed(3) + ' ms';
    } else if (milliseconds < 60000) {
        return (milliseconds / 1000).toFixed(3) + ' s';
    } else {
        const hours = Math.floor(milliseconds / 3600000);
        const minutes = Math.floor((milliseconds % 3600000) / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        const remainingMilliseconds = milliseconds % 1000;

        const formattedTime = [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0'),
            remainingMilliseconds.toString().padStart(3, '0')
        ].join(':');

        return formattedTime;
    }
}

// Converts the period to milliseconds
// INPUT : period
// OUTPUT : milliseconds
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

// generates the required object for the Stocks table data
// INPUT : symbol - symbol of the token : string
//         param - price data from CryptoCompare : object
// OUTPUT : tokenData - required object for the Stocks table data
const generateYFObject = (symbol, param) => {
    let tokenData = {}
    tokenData["symbol"] = symbol
    tokenData["open"] = param.summaryDetail?.open.raw || "N/A"
    tokenData["high"] = param.summaryDetail?.dayHigh.raw || "N/A"
    tokenData["low"] = param.summaryDetail?.dayLow.raw || "N/A"
    tokenData["divident_rate"] = param.summaryDetail?.dividendRate.raw || "N/A"
    tokenData["divident_yield"] = param.summaryDetail?.dividendYield.raw || "N/A"
    tokenData["five_year_avg_dividend_yield"] = param.summaryDetail?.fiveYearAvgDividendYield.raw || "N/A"
    tokenData["market_cap"] = param.summaryDetail?.marketCap.raw || "N/A"
    tokenData["fiftyTwoWeekLow"] = param.summaryDetail?.fiftyTwoWeekLow.raw || "N/A"
    tokenData["fiftyTwoWeekHigh"] = param.summaryDetail?.fiftyTwoWeekHigh.raw || "N/A"
    tokenData["enterpriseValue"] = param.defaultKeyStatistics?.enterpriseValue.raw || "N/A"
    tokenData["pegRatio"] = param.defaultKeyStatistics?.pegRatio.raw || "N/A"
    tokenData["currentQuarterEstimate"] = param.earnings?.earningsChart.currentQuarterEstimate.raw || "N/A"
    tokenData["financial_chart"] = param.earnings?.financialsChart.yearly || "N/A"
    tokenData["short_name"] = param.price?.shortName || "N/A"
    tokenData["total_cash"] = param.financialData?.totalCash.raw || "N/A"
    tokenData["ebitda"] = param.financialData?.ebitda.raw || "N/A"
    tokenData["total_debt"] = param.financialData?.totalDebt.raw || "N/A"
    tokenData["total_revenue"] = param.financialData?.totalRevenue.raw || "N/A"
    tokenData["debt_to_equity"] = param.financialData?.debtToEquity.raw || "N/A"
    tokenData["gross_profit"] = param.financialData?.grossProfits.raw || "N/A"
    tokenData["free_cashflow"] = param.financialData?.freeCashflow.raw || "N/A"
    tokenData["operating_cashflow"] = param.financialData?.operatingCashflow.raw || "N/A"
    tokenData["rev_growth"] = param.financialData?.revenueGrowth.raw || "N/A"
    return tokenData
}

// Fetches the top tickers by market cap from CryptoCompare
// INPUT : length - number of tickers to fetch : { length: 10 }
// OUTPUT : Array of tickers
/* 
[
    {
        "id": "1182",
        "symbol": "BTC",
        "name": "Bitcoin",
        "max_supply": 20999999.9769,
        "asset_launch_date": "2009-01-03",
        "image_url": "https://www.cryptocompare.com/media/37746251/btc.png",
        "current_price": 29432.56,
        "market_cap_rank": 1,
        "price_change_24h": 191.1700000000019,
        "price_change_percentage_24h": 0.6537650911943718,
        "last_updated": 1690429029,
        "high_24h": 29685.09,
        "low_24h": 29159.16
    }
]
*/
const fetchTopTickerByMarketCap = async ({ length }) => {
    try {
        let cryptoData = await axios.get(`https://min-api.cryptocompare.com/data/top/mktcapfull?limit=${length}&tsym=USD`)

        const undefinedRemoved = cryptoData.data.Data.filter((ticker) => {
            // console.log(ticker.RAW?.USD.PRICE)
            return ticker.RAW !== undefined;
        })

        const filteredCryptoData = undefinedRemoved.map((crypto, index) => {
            const { CoinInfo, RAW } = crypto;
            return {
                id: CoinInfo.Id,
                symbol: CoinInfo.Name,
                name: CoinInfo.FullName,
                max_supply: CoinInfo.MaxSupply,
                asset_launch_date: CoinInfo.AssetLaunchDate,
                image_url: `https://www.cryptocompare.com${CoinInfo.ImageUrl}`,
                current_price: RAW.USD.PRICE,
                market_cap_rank: index + 1,
                price_change_24h: RAW.USD.CHANGE24HOUR,
                price_change_percentage_24h: RAW.USD.CHANGEPCT24HOUR,
                last_updated: RAW.USD.LASTUPDATE,
                high_24h: RAW.USD.HIGH24HOUR,
                low_24h: RAW.USD.LOW24HOUR,
            };
        });
        return cryptoData = filteredCryptoData
    } catch (error) {
        let formattedError = JSON.stringify(logger.formatError(error))
        log.error({ message: 'Error CryptoCompare', error: formattedError })
        throw error
    }
}

// Fetches the latest OHLC data for the specified tokenName and timeperiod with limit
const getLatestOHLCForTicker = async ({ timeFrame, tokenName, limit }) => {
    try {
        let url = `https://min-api.cryptocompare.com/data/v2/histo${timeFrame}?fsym=${tokenName}&tsym=USD&limit=${limit}`
        const historicalData = await axios.get(url)
        let data = historicalData.data
        return [data, url]
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

// Fetches the quotes for the given symbols
// INPUT : symbols - array of symbols
// OUTPUT : finalData - array of objects containing the quotes for the given symbols
const getYfinanceQuotes = async (symbols) => {
    log.info(`Fetching quotes for : ${symbols}`)
    let summaryDetail
    const baseYFUrl = "https://query1.finance.yahoo.com/v6/finance/quoteSummary/"
    const modules = ['price', 'summaryDetail', 'earnings', 'defaultKeyStatistics', 'financialData']
    const key = modules.map(module => `modules=${module}`).join('&');
    let finalData = []
    for (const item in symbols) {
        let symbol = symbols[item]
        const finalUrl = `${baseYFUrl}${symbol}?${key}`
        try {
            const result = await axios.get(finalUrl)
            summaryDetail = result.data.quoteSummary.result[0]
            let transformedData = generateYFObject(symbol, summaryDetail)
            finalData.push(transformedData)
        } catch (error) {
            log.error(error.stack)
            throw error
        }
    }
    return finalData
}

const yFinanceDatCleaner = (result) => {
    let resultObj = {}
    for (const [key, moduleValue] of Object.entries(result)) {
        switch (key) {
            case 'assetProfile':
                console.log('Cleaning assetProfile')
                let companyofficers = moduleValue.companyOfficers
                companyofficers.forEach((officer) => {
                    return {
                        ...officer,
                        totalPay: officer.totalPay.raw,
                        exercisedValue: officer.exercisedValue.raw,
                        unexercisedValue: officer.unexercisedValue.raw,
                    }
                })
                moduleValue.companyOfficers = companyofficers
                resultObj[key] = moduleValue
                break;
            default:
                console.log('No key match from url fetch')
        }
    }
    return resultObj
}

const transformPriceSummary = (stockData) => {
    let groupedData = {}
    // Group 1: Stock Market Data
    const stockMarketData = {
        basicMarketData: {
            priceHint: stockData.priceHint,
            previousClose: stockData.previousClose,
            open: stockData.open,
            dayLow: stockData.dayLow,
            dayHigh: stockData.dayHigh,
        },
        regularMarketData: {
            regularMarketPreviousClose: stockData.regularMarketPreviousClose,
            regularMarketOpen: stockData.regularMarketOpen,
            regularMarketDayLow: stockData.regularMarketDayLow,
            regularMarketDayHigh: stockData.regularMarketDayHigh,
        },
        financialData: {
            dividendYield: stockData.dividendYield,
            payoutRatio: stockData.payoutRatio,
            beta: stockData.beta,
            trailingPE: stockData.trailingPE,
            forwardPE: stockData.forwardPE,
        },
        volumeData: {
            volume: stockData.volume,
            regularMarketVolume: stockData.regularMarketVolume,
            averageVolume: stockData.averageVolume,
            averageVolume10days: stockData.averageVolume10days,
            averageDailyVolume10Day: stockData.averageDailyVolume10Day,
            averageDailyVolume3Month: stockData.averageDailyVolume3Month,
        },
        bidAskData: {
            bid: stockData.bid,
            ask: stockData.ask,
            bidSize: stockData.bidSize,
            askSize: stockData.askSize,
        },
        marketCapAndRange: {
            marketCap: stockData.marketCap,
            fiftyTwoWeekLow: stockData.fiftyTwoWeekLow,
            fiftyTwoWeekHigh: stockData.fiftyTwoWeekHigh,
            priceToSalesTrailing12Months: stockData.priceToSalesTrailing12Months,
        },
        movingAverages: {
            fiftyDayAverage: stockData.fiftyDayAverage,
            twoHundredDayAverage: stockData.twoHundredDayAverage,
        },
        dividendInformation: {
            trailingAnnualDividendRate: stockData.trailingAnnualDividendRate,
            trailingAnnualDividendYield: stockData.trailingAnnualDividendYield,
        }
    };

    // Group 2: Market and Exchange Information 
    const marketExchangeInfo = {
        currencyAndMarketSource: {
            currency: stockData.currency,
            fromCurrency: stockData.fromCurrency,
            toCurrency: stockData.toCurrency,
            currencySymbol: stockData.currencySymbol,
        },
        marketExchange: {
            exchange: stockData.exchange,
            exchangeName: stockData.exchangeName,
            exchangeDataDelayedBy: stockData.exchangeDataDelayedBy,
        },
        stockInformation: {
            quoteType: stockData.quoteType,
            symbol: stockData.symbol,
            underlyingSymbol: stockData.underlyingSymbol,
            shortName: stockData.shortName,
            longName: stockData.longName,
            quoteSourceName: stockData.quoteSourceName,
        },
        priceData: {
            postMarketChangePercent: stockData.postMarketChangePercent,
            postMarketChange: stockData.postMarketChange,
            postMarketTime: stockData.postMarketTime,
            postMarketPrice: stockData.postMarketPrice,
            postMarketSource: stockData.postMarketSource,
            regularMarketChangePercent: stockData.regularMarketChangePercent,
            regularMarketChange: stockData.regularMarketChange,
            regularMarketTime: stockData.regularMarketTime,
            regularMarketPrice: stockData.regularMarketPrice,
        },
        stockTradeability: {
            tradeable: stockData.tradeable,
        },
        marketInformation: {
            coinMarketCapLink: stockData.coinMarketCapLink,
            algorithm: stockData.algorithm,
            preMarketSource: stockData.preMarketSource,
            regularMarketSource: stockData.regularMarketSource,
        },
    }
    groupedData['stockMarketData'] = stockMarketData
    groupedData['marketExchangeInfo'] = marketExchangeInfo
    return groupedData;
}

const transformDefaultKeyStat = (inputData) => {
    return {
        "price_information": {
            "priceHint": inputData.priceHint,
            "forwardPE": inputData.forwardPE
        },
        "profitability": {
            "profitMargins": inputData.profitMargins
        },
        "shares_information": {
            "floatShares": inputData.floatShares,
            "sharesOutstanding": inputData.sharesOutstanding,
            "sharesShort": inputData.sharesShort,
            "sharesShortPriorMonth": inputData.sharesShortPriorMonth,
            "sharesShortPreviousMonthDate": inputData.sharesShortPreviousMonthDate,
            "dateShortInterest": inputData.dateShortInterest,
            "sharesPercentSharesOut": inputData.sharesPercentSharesOut,
            "heldPercentInsiders": inputData.heldPercentInsiders,
            "heldPercentInstitutions": inputData.heldPercentInstitutions,
            "shortRatio": inputData.shortRatio,
            "shortPercentOfFloat": inputData.shortPercentOfFloat
        },
        "financial_metrics": {
            "beta": inputData.beta,
            "impliedSharesOutstanding": inputData.impliedSharesOutstanding,
            "bookValue": inputData.bookValue,
            "priceToBook": inputData.priceToBook,
            "lastFiscalYearEnd": inputData.lastFiscalYearEnd,
            "nextFiscalYearEnd": inputData.nextFiscalYearEnd,
            "mostRecentQuarter": inputData.mostRecentQuarter,
            "earningsQuarterlyGrowth": inputData.earningsQuarterlyGrowth,
            "netIncomeToCommon": inputData.netIncomeToCommon,
            "trailingEps": inputData.trailingEps,
            "forwardEps": inputData.forwardEps,
            "pegRatio": inputData.pegRatio,
            "lastSplitFactor": inputData.lastSplitFactor,
            "lastSplitDate": inputData.lastSplitDate,
            "category": inputData.category,
            "fundFamily": inputData.fundFamily,
            "legalType": inputData.legalType,
        },
        "valuation_and_performance": {
            "enterpriseValue": inputData.enterpriseValue,
            "enterpriseToRevenue": inputData.enterpriseToRevenue,
            "enterpriseToEbitda": inputData.enterpriseToEbitda,
            "52WeekChange": inputData["52WeekChange"],
            "SandP52WeekChange": inputData.SandP52WeekChange
        }
    };
}

const transformFinancialData = (financialData) => {
    const targetPricesAndRecommendations = {
        currentPrice: financialData.currentPrice,
        targetHighPrice: financialData.targetHighPrice,
        targetLowPrice: financialData.targetLowPrice,
        targetMeanPrice: financialData.targetMeanPrice,
        targetMedianPrice: financialData.targetMedianPrice,
        recommendationMean: financialData.recommendationMean,
        recommendationKey: financialData.recommendationKey,
        numberOfAnalystOpinions: financialData.numberOfAnalystOpinions,
    };

    const cashAndDebt = {
        totalCash: financialData.totalCash,
        totalCashPerShare: financialData.totalCashPerShare,
        totalDebt: financialData.totalDebt,
        debtToEquity: financialData.debtToEquity,
    };

    const financialRatios = {
        quickRatio: financialData.quickRatio,
        currentRatio: financialData.currentRatio,
        returnOnAssets: financialData.returnOnAssets,
        returnOnEquity: financialData.returnOnEquity,
    };

    const revenueAndProfits = {
        totalRevenue: financialData.totalRevenue,
        revenuePerShare: financialData.revenuePerShare,
        grossProfits: financialData.grossProfits,
        freeCashflow: financialData.freeCashflow,
        operatingCashflow: financialData.operatingCashflow,
        earningsGrowth: financialData.earningsGrowth,
        revenueGrowth: financialData.revenueGrowth,
        ebitda: financialData.ebitda,
    };

    const profitMargins = {
        grossMargins: financialData.grossMargins,
        ebitdaMargins: financialData.ebitdaMargins,
        operatingMargins: financialData.operatingMargins,
        profitMargins: financialData.profitMargins,
    };

    const currency = {
        financialCurrency: financialData.financialCurrency,
    };

    return {
        targetPricesAndRecommendations: targetPricesAndRecommendations,
        cashAndDebt: cashAndDebt,
        financialRatios: financialRatios,
        revenueAndProfits: revenueAndProfits,
        profitMargins: profitMargins,
        currency: currency,
    };
}

const getStockSummaryDetails = async (symbol) => {
    // 'summaryProfile','majorHoldersBreakdown' 'netSharePurchaseActivity' not included as it same as assetProfile with less information
    log.info(`Fetching symbol summary for ${symbol}`)
    const whiteListModule = ['secFilings', 'quoteType']
    const blackListModules = ['industryTrend', 'majorDirectHolders', 'sectorTrend', 'topHoldings', 'fundProfile', 'fundPerformance']

    const moduleOptions = {
        modules: [
            'assetProfile'
            , 'balanceSheetHistory'
            , 'balanceSheetHistoryQuarterly'
            , 'calendarEvents'
            , 'cashflowStatementHistory'
            , 'cashflowStatementHistoryQuarterly'
            , 'defaultKeyStatistics'
            , 'earnings'
            , 'earningsHistory'
            , 'earningsTrend'
            , 'financialData'
            , 'fundOwnership'
            , 'incomeStatementHistory'
            , 'incomeStatementHistoryQuarterly'
            , 'indexTrend'
            , 'insiderHolders'
            , 'insiderTransactions'
            , 'institutionOwnership'
            , 'price'
            , 'recommendationTrend'
            , 'summaryDetail'
            , 'upgradeDowngradeHistory'
        ]
    }

    const insightsOptions = {
        reportsCount: 4
    }

    let qSummary = {}
    let symbolInsights = {}
    let stockProfile = {
        combinedCashflowStatement: {
            annual: {},
            quarterly: {}
        },
        combinedBalanceSheet: {
            annual: {},
            quarterly: {}
        },
        cominedIncomeStatement: {
            annual: {},
            quarterly: {}
        }
    }

    const modules = ["assetProfile"]

    try {
        // @ts-ignore
        symbolInsights = await yahooFinance.insights(symbol, insightsOptions);
        // @ts-ignore
        qSummary = await yahooFinance.quoteSummary(symbol, moduleOptions)

    } catch (error) {
        log.warn('Error fetching summary from yahoo finance 2, Trying to fetch from url instead')
        log.error(error.stack)
        try {
            const baseYFUrl = "https://query1.finance.yahoo.com/v6/finance/quoteSummary/"
            const key = modules.map(module => `modules=${module}`).join('&');
            const finalUrl = `${baseYFUrl}${symbol}?${key}`
            console.log(finalUrl)
        } catch (error) {
            log.warn('Error fetching URL')
            log.error(error.stack)
            throw error
        }
    }

    for (const [key, moduleValue] of Object.entries(qSummary)) {
        // console.log(key)
        switch (key) {
            case 'assetProfile':
                console.log('assetProfile')
                delete moduleValue.city
                delete moduleValue.state
                delete moduleValue.zip
                delete moduleValue.country
                delete moduleValue.phone
                delete moduleValue.industryKey
                delete moduleValue.industryDisp
                delete moduleValue.sectorKey
                delete moduleValue.sectorDisp
                delete moduleValue.maxAge
                stockProfile[key] = moduleValue
                break;
            case 'recommendationTrend':
                console.log('recommendationTrend')
                delete moduleValue.maxAge
                stockProfile[key] = moduleValue
                break;
            case 'indexTrend':
                console.log('indexTrend')
                delete moduleValue.maxAge
                stockProfile[key] = moduleValue
                break;
            case 'price':
                console.log('price')
                delete moduleValue.maxAge
                if (stockProfile['combinedPriceSummary'] === undefined) {
                    stockProfile['combinedPriceSummary'] = moduleValue
                } else {
                    stockProfile['combinedPriceSummary'] = { ...stockProfile['combinedPriceSummary'], ...moduleValue }
                }
                break;
            case 'summaryDetail':
                console.log('summaryDetail')
                delete moduleValue.maxAge
                if (stockProfile['combinedPriceSummary'] === undefined) {
                    stockProfile['combinedPriceSummary'] = moduleValue
                } else {
                    stockProfile['combinedPriceSummary'] = { ...stockProfile['combinedPriceSummary'], ...moduleValue }
                }
                break;
            case 'calendarEvents':
                console.log('calendarEvents')
                delete moduleValue.maxAge
                stockProfile[key] = moduleValue
                break;
            case 'earnings':
                console.log('earnings')
                delete moduleValue.maxAge
                if (stockProfile['combinedEarnings'] === undefined) {
                    stockProfile['combinedEarnings'] = moduleValue
                } else {
                    stockProfile['combinedEarnings'] = { ...stockProfile['combinedEarnings'], ...moduleValue }
                }
                break;
            case 'earningsHistory':
                console.log('earningsHistory')
                delete moduleValue.maxAge
                if (stockProfile['combinedEarnings'] === undefined) {
                    stockProfile['combinedEarnings'] = moduleValue
                } else {
                    stockProfile['combinedEarnings'] = { ...stockProfile['combinedEarnings'], ...moduleValue }
                }
                break;
            case 'earningsTrend':
                console.log('earningsTrend')
                delete moduleValue.maxAge
                if (stockProfile['combinedEarnings'] === undefined) {
                    stockProfile['combinedEarnings'] = moduleValue
                } else {
                    stockProfile['combinedEarnings'] = { ...stockProfile['combinedEarnings'], ...moduleValue }
                }
                break;
            case 'cashflowStatementHistory':
                console.log('cashflowStatementHistory')
                delete moduleValue.maxAge
                stockProfile.combinedCashflowStatement.annual = moduleValue;
                break;
            case 'cashflowStatementHistoryQuarterly':
                console.log('cashflowStatementHistoryQuarterly')
                delete moduleValue.maxAge
                stockProfile.combinedCashflowStatement.quarterly = moduleValue;
                break;
            case 'balanceSheetHistory':
                console.log('balanceSheetHistory')
                delete moduleValue.maxAge
                stockProfile.combinedBalanceSheet.annual = moduleValue;
                break;
            case 'balanceSheetHistoryQuarterly':
                console.log('balanceSheetHistoryQuarterly')
                delete moduleValue.maxAge
                stockProfile.combinedBalanceSheet.quarterly = moduleValue;
                break;
            case 'incomeStatementHistory':
                console.log('incomeStatementHistory')
                delete moduleValue.maxAge
                stockProfile.cominedIncomeStatement.annual = moduleValue;
                break;
            case 'incomeStatementHistoryQuarterly':
                console.log('incomeStatementHistoryQuarterly')
                delete moduleValue.maxAge
                stockProfile.cominedIncomeStatement.quarterly = moduleValue;
                break;
            case 'defaultKeyStatistics':
                console.log('defaultKeyStatistics')
                delete moduleValue.maxAge
                stockProfile[key] = transformDefaultKeyStat(moduleValue)
                break;
            case 'financialData':
                console.log('financialData')
                delete moduleValue.maxAge
                stockProfile[key] = transformFinancialData(moduleValue)
                break;
            case 'fundOwnership':
                console.log('fundOwnership')
                delete moduleValue.maxAge
                stockProfile[key] = moduleValue
                break;
            case 'insiderHolders':
                console.log('insiderHolders')
                delete moduleValue.maxAge
                stockProfile[key] = moduleValue
                break;
            case 'institutionOwnership':
                console.log('institutionOwnership')
                delete moduleValue.maxAge
                stockProfile[key] = moduleValue
                break;
            case 'insiderTransactions':
                console.log('insiderTransactions')
                delete moduleValue.maxAge
                const groupedArray = moduleValue.transactions.reduce((acc, obj) => {
                    const existingEntry = acc.find(entry => entry.name === obj.filerName);
                    if (existingEntry) {
                        existingEntry.transactions.push(obj);
                    } else {
                        acc.push({
                            name: obj.filerName,
                            transactions: [obj]
                        });
                    }
                    return acc;
                }, []);
                stockProfile[key] = groupedArray
                break;
            case 'upgradeDowngradeHistory':
                delete moduleValue.maxAge
                stockProfile[key] = moduleValue
                break;
            default:
                console.log('No key match')
        }
    }

    let combinedPriceSummaryCopy = stockProfile['combinedPriceSummary']
    let transformedPriceSummary = transformPriceSummary(combinedPriceSummaryCopy)
    stockProfile['combinedPriceSummary'] = transformedPriceSummary

    const insideHld = stockProfile['insiderHolders'].holders
    const insideTran = stockProfile['insiderTransactions']
    const added = insideHld.map((item, index) => {
        const matched = insideTran.find((element) => element.name === item.name)
        return {
            ...item,
            transactions: matched.transactions
        }
    })
    stockProfile['insiderHolders'].holders = added
    delete stockProfile.insiderTransactions
    // console.log(added)
    return stockProfile
}

// < - - - - - - - - - - Helper Functions - - - - - - - - - - >

module.exports = {
    fetchDataFromUrls
    , formatMillisecond
    , periodToMilliseconds
    , fetchTopTickerByMarketCap
    , getLatestOHLCForTicker
    , getYfinanceQuotes
    , getStockSummaryDetails
}
