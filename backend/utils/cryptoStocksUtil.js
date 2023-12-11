const { info } = require('winston');
const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const yahooFinance = require('yahoo-finance2').default; // summary quotes not working
const axios = require('axios').default;
const MDBServices = require('../services/mongoDBServices')

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
    // console.log(param)
    let tokenData = {}
    tokenData["symbol"] = symbol
    tokenData["open"] = param.summaryDetail?.open || param.summaryDetail?.open?.raw || "N/A"
    tokenData["high"] = param.summaryDetail?.dayHigh || param.summaryDetail?.dayHigh?.raw || "N/A"
    tokenData["low"] = param.summaryDetail?.dayLow || param.summaryDetail?.dayLow?.raw || "N/A"
    tokenData["divident_rate"] = param.summaryDetail?.dividendRate || param.summaryDetail?.dividendRate?.raw || "N/A"
    tokenData["divident_yield"] = param.summaryDetail?.dividendYield || param.summaryDetail?.dividendYield?.raw || "N/A"
    tokenData["five_year_avg_dividend_yield"] = param.summaryDetail?.fiveYearAvgDividendYield || param.summaryDetail?.fiveYearAvgDividendYield?.raw || "N/A"
    tokenData["market_cap"] = param.summaryDetail?.marketCap || param.summaryDetail?.marketCap?.raw || "N/A"
    tokenData["fiftyTwoWeekLow"] = param.summaryDetail?.fiftyTwoWeekLow || param.summaryDetail?.fiftyTwoWeekLow?.raw || "N/A"
    tokenData["fiftyTwoWeekHigh"] = param.summaryDetail?.fiftyTwoWeekHigh || param.summaryDetail?.fiftyTwoWeekHigh?.raw || "N/A"
    tokenData["enterpriseValue"] = param.defaultKeyStatistics?.enterpriseValue || param.defaultKeyStatistics?.enterpriseValue?.raw || "N/A"
    tokenData["pegRatio"] = param.defaultKeyStatistics?.pegRatio || param.defaultKeyStatistics?.pegRatio?.raw || "N/A"
    tokenData["currentQuarterEstimate"] = param.earnings?.earningsChart.currentQuarterEstimate || param.earnings?.earningsChart.currentQuarterEstimate?.raw || "N/A"
    tokenData["financial_chart"] = param.earnings?.financialsChart.yearly || "N/A"
    tokenData["short_name"] = param.price?.shortName || "N/A"
    tokenData["total_cash"] = param.financialData?.totalCash || param.financialData?.totalCash?.raw || "N/A"
    tokenData["ebitda"] = param.financialData?.ebitd || param.financialData?.ebitda?.raw || "N/A"
    tokenData["total_debt"] = param.financialData?.totalDebt || param.financialData?.totalDebt?.raw || "N/A"
    tokenData["total_revenue"] = param.financialData?.totalRevenue || param.financialData?.totalRevenue?.raw || "N/A"
    tokenData["debt_to_equity"] = param.financialData?.debtToEquity || param.financialData?.debtToEquity?.raw || "N/A"
    tokenData["gross_profit"] = param.financialData?.grossProfits || param.financialData?.grossProfits?.raw || "N/A"
    tokenData["free_cashflow"] = param.financialData?.freeCashflow || param.financialData?.freeCashflow?.raw || "N/A"
    tokenData["operating_cashflow"] = param.financialData?.operatingCashflow || param.financialData?.operatingCashflow?.raw || "N/A"
    tokenData["rev_growth"] = param.financialData?.revenueGrowth || param.financialData?.revenueGrowth?.raw || "N/A"
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

        const tickerSymbol = await MDBServices.getBinanceTIckerNames()

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

        const filteredCryptoDataWithMatched = filteredCryptoData.map(crypto => {
            // Find the ticker with the same symbol
            const ticker = tickerSymbol.find(t => t.ticker_name.startsWith(crypto.symbol));
            // If a matching ticker is found, use its matched value, otherwise use false
            const matched = ticker ? ticker.ticker_name : 'N/A';
            // Return a new object with the matched key
            return {...crypto, matched};
        });
        
        // console.log(filteredCryptoDataWithMatched)

        return cryptoData = filteredCryptoDataWithMatched
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

const getYFinanceShortSummary = async (symbols) => {
    try {
        const short_summary_result = await MDBServices.fetchYFinanceShortSummary(symbols)
        return short_summary_result
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const getYFinanceFullSummary = async (symbol) => {
    try {
        const full_summary_result = await MDBServices.fetchYFinanceFullSummary(symbol)
        return full_summary_result
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const yFinance_metaData_updater = async () => {
    try {
        const collection_name = 'yfinance_metadata'
        const stock_symbols_data = await MDBServices.getFirstObjectForEachPeriod(collection_name)
        let stock_symbols = stock_symbols_data.map((symbol) => symbol.ticker_name)
        log.info('Updating short summary for symbols')
        await getYfinanceQuotes(stock_symbols)

        log.info('Updating full summary for stock')
        const meta_type = 'full_summary'
        for (const symb in stock_symbols) {
            const symbol = stock_symbols[symb]
            const full_summary = await getStockSummaryDetails(symbol)
            await MDBServices.updateYFinanceMetadata(symbol, meta_type, full_summary)
        }
        return 'Success'
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
    const meta_type = 'short_summary'

    try {
        log.info('Test fetching to ensure URL works, else using package')
        log.info(`${baseYFUrl}${symbols[0]}?modules=assetProfile`)
        const result = await axios.get(`${baseYFUrl}${symbols[0]}?modules=assetProfile`)

        if (result.data) {
            for (const item in symbols) {
                let symbol = symbols[item]
                console.log('short summary', symbol)
                const finalUrl = `${baseYFUrl}${symbol}?${key}`
                try {
                    const result = await axios.get(finalUrl)
                    summaryDetail = result.data.quoteSummary.result[0]
                    let transformedData = generateYFObject(symbol, summaryDetail)
                    await MDBServices.updateYFinanceMetadata(symbol, meta_type, transformedData)
                    finalData.push(transformedData)
                } catch (error) {
                    log.error(error.stack)
                    throw error
                }
            }
        }
    } catch (err) {
        log.warn('Fetch from URL failed, trying Yahoo Finance package');
        try {
            for (const symbol of symbols) {
                console.log(symbol)
                // @ts-ignore
                const quoteData = await yahooFinance.quoteSummary(symbol, { modules: modules });
                let transformedData = generateYFObject(symbol, quoteData);
                let updateSS = await MDBServices.updateYFinanceMetadata(symbol, meta_type, transformedData)
                // console.log(updateSS)
                finalData.push(transformedData);
            }
        } catch (err) {
            log.warn('yhaoo package error')
            log.error(err.stack)
        }
    }
    return finalData
}

const yFinanceDataCleaner = (result) => {
    log.info('Cleaning yF data from URL Fetch')
    let resultObj = {}
    for (const [key, moduleValue] of Object.entries(result)) {
        switch (key) {
            case 'assetProfile':
                log.info('Cleaning assetProfile')
                let companyofficers = moduleValue.companyOfficers.map((officer) => {
                    return {
                        ...officer,
                        totalPay: officer?.totalPay?.raw === undefined ? 'N/A' : officer.totalPay.raw,
                        exercisedValue: officer?.exercisedValue?.raw === undefined ? 'N/A' : officer.exercisedValue.raw,
                        unexercisedValue: officer?.unexercisedValue?.raw === undefined ? 'N/A' : officer.unexercisedValue.raw,
                    }
                });

                moduleValue.companyOfficers = companyofficers;
                moduleValue.governanceEpochDate = moduleValue.governanceEpochDate * 1000
                moduleValue.compensationAsOfEpochDate = moduleValue.compensationAsOfEpochDate * 1000
                resultObj[key] = moduleValue;
                break;
            case 'recommendationTrend':
                log.info('Cleaning recommendationTrend')
                resultObj[key] = moduleValue
                break;
            case 'indexTrend':
                log.info('Cleaning indexTrend')
                const indexTrendCopy = {
                    ...moduleValue,
                    peRatio: moduleValue?.peRatio?.raw === undefined ? 'N/A' : moduleValue.peRatio.raw,
                    pegRatio: moduleValue?.pegRatio?.raw === undefined ? 'N/A' : moduleValue.pegRatio.raw,
                    estimates: moduleValue.estimates.map((estimate) => {
                        return {
                            ...estimate,
                            growth: estimate?.growth?.raw === undefined ? 'N/A' : estimate.growth.raw,
                        }
                    })
                }
                resultObj[key] = indexTrendCopy
                break;
            case 'price':
                log.info('Cleaning price')
                const priceCopy = {
                    ...moduleValue,
                    preMarketChangePercent: moduleValue?.preMarketChangePercent?.raw === undefined ? 'N/A' : moduleValue.preMarketChangePercent.raw,
                    preMarketChange: moduleValue?.preMarketChange?.raw === undefined ? 'N/A' : moduleValue.preMarketChange.raw,
                    preMarketPrice: moduleValue?.preMarketPrice?.raw === undefined ? 'N/A' : moduleValue.preMarketPrice.raw,
                    postMarketChangePercent: moduleValue?.postMarketChangePercent?.raw === undefined ? 'N/A' : moduleValue.postMarketChangePercent.raw,
                    postMarketChange: moduleValue?.postMarketChange?.raw === undefined ? 'N/A' : moduleValue.postMarketChange.raw,
                    postMarketPrice: moduleValue?.postMarketPrice?.raw === undefined ? 'N/A' : moduleValue.postMarketPrice.raw,
                    regularMarketChangePercent: moduleValue?.regularMarketChangePercent?.raw === undefined ? 'N/A' : moduleValue.regularMarketChangePercent.raw,
                    regularMarketChange: moduleValue?.regularMarketChange?.raw === undefined ? 'N/A' : moduleValue.regularMarketChange.raw,
                    priceHint: moduleValue?.priceHint?.raw === undefined ? 'N/A' : moduleValue.priceHint.raw,
                    regularMarketPrice: moduleValue?.regularMarketPrice?.raw === undefined ? 'N/A' : moduleValue.regularMarketPrice.raw,
                    regularMarketDayHigh: moduleValue?.regularMarketDayHigh?.raw === undefined ? 'N/A' : moduleValue.regularMarketDayHigh.raw,
                    regularMarketDayLow: moduleValue?.regularMarketDayLow?.raw === undefined ? 'N/A' : moduleValue.regularMarketDayLow.raw,
                    regularMarketVolume: moduleValue?.regularMarketVolume?.raw === undefined ? 'N/A' : moduleValue.regularMarketVolume.raw,
                    regularMarketPreviousClose: moduleValue?.regularMarketPreviousClose?.raw === undefined ? 'N/A' : moduleValue.regularMarketPreviousClose.raw,
                    regularMarketOpen: moduleValue?.regularMarketOpen?.raw === undefined ? 'N/A' : moduleValue.regularMarketOpen.raw,
                    marketCap: moduleValue?.marketCap?.raw === undefined ? 'N/A' : moduleValue.marketCap.raw,
                    averageDailyVolume10Day: moduleValue?.averageDailyVolume10Day?.raw === undefined ? 'N/A' : moduleValue.averageDailyVolume10Day.raw,
                    averageDailyVolume3Month: moduleValue?.averageDailyVolume3Month?.raw === undefined ? 'N/A' : moduleValue.averageDailyVolume3Month.raw,
                }
                resultObj[key] = priceCopy
                break;
            case 'summaryDetail':
                log.info('Cleaning summaryDetail')
                const summaryDetailCopy = {
                    ...moduleValue,
                    priceHint: moduleValue?.priceHint?.raw === undefined ? 'N/A' : moduleValue.priceHint.raw,
                    previousClose: moduleValue?.previousClose?.raw === undefined ? 'N/A' : moduleValue.previousClose.raw,
                    open: moduleValue?.open?.raw === undefined ? 'N/A' : moduleValue.open.raw,
                    dayLow: moduleValue?.dayLow?.raw === undefined ? 'N/A' : moduleValue.dayLow.raw,
                    dayHigh: moduleValue?.dayHigh?.raw === undefined ? 'N/A' : moduleValue.dayHigh.raw,
                    regularMarketPreviousClose: moduleValue?.regularMarketPreviousClose?.raw === undefined ? 'N/A' : moduleValue.regularMarketPreviousClose.raw,
                    regularMarketOpen: moduleValue?.regularMarketOpen?.raw === undefined ? 'N/A' : moduleValue.regularMarketOpen.raw,
                    regularMarketDayLow: moduleValue?.regularMarketDayLow?.raw === undefined ? 'N/A' : moduleValue.regularMarketDayLow.raw,
                    regularMarketDayHigh: moduleValue?.regularMarketDayHigh?.raw === undefined ? 'N/A' : moduleValue.regularMarketDayHigh.raw,
                    dividendYield: moduleValue?.dividendYield?.raw === undefined ? 'N/A' : moduleValue.dividendYield.raw,
                    payoutRatio: moduleValue?.payoutRatio?.raw === undefined ? 'N/A' : moduleValue.payoutRatio.raw,
                    beta: moduleValue?.beta?.raw === undefined ? 'N/A' : moduleValue.beta.raw,
                    trailingPE: moduleValue?.trailingPE?.raw === undefined ? 'N/A' : moduleValue.trailingPE.raw,
                    forwardPE: moduleValue?.forwardPE?.raw === undefined ? 'N/A' : moduleValue.forwardPE.raw,
                    volume: moduleValue?.volume?.raw === undefined ? 'N/A' : moduleValue.volume.raw,
                    regularMarketVolume: moduleValue?.regularMarketVolume?.raw === undefined ? 'N/A' : moduleValue.regularMarketVolume.raw,
                    averageVolume: moduleValue?.averageVolume?.raw === undefined ? 'N/A' : moduleValue.averageVolume.raw,
                    averageVolume10days: moduleValue?.averageVolume10days?.raw === undefined ? 'N/A' : moduleValue.averageVolume10days.raw,
                    averageDailyVolume10Day: moduleValue?.averageDailyVolume10Day?.raw === undefined ? 'N/A' : moduleValue.averageDailyVolume10Day.raw,
                    bid: moduleValue?.bid?.raw === undefined ? 'N/A' : moduleValue.bid.raw,
                    ask: moduleValue?.ask?.raw === undefined ? 'N/A' : moduleValue.ask.raw,
                    bidSize: moduleValue?.bidSize?.raw === undefined ? 'N/A' : moduleValue.bidSize.raw,
                    askSize: moduleValue?.askSize?.raw === undefined ? 'N/A' : moduleValue.askSize.raw,
                    marketCap: moduleValue?.marketCap?.raw === undefined ? 'N/A' : moduleValue.marketCap.raw,
                    fiftyTwoWeekLow: moduleValue?.fiftyTwoWeekLow?.raw === undefined ? 'N/A' : moduleValue.fiftyTwoWeekLow.raw,
                    fiftyTwoWeekHigh: moduleValue?.fiftyTwoWeekHigh?.raw === undefined ? 'N/A' : moduleValue.fiftyTwoWeekHigh.raw,
                    priceToSalesTrailing12Months: moduleValue?.priceToSalesTrailing12Months?.raw === undefined ? 'N/A' : moduleValue.priceToSalesTrailing12Months.raw,
                    fiftyDayAverage: moduleValue?.fiftyDayAverage?.raw === undefined ? 'N/A' : moduleValue.fiftyDayAverage.raw,
                    twoHundredDayAverage: moduleValue?.twoHundredDayAverage?.raw === undefined ? 'N/A' : moduleValue.twoHundredDayAverage.raw,
                    trailingAnnualDividendRate: moduleValue?.trailingAnnualDividendRate?.raw === undefined ? 'N/A' : moduleValue.trailingAnnualDividendRate.raw,
                    trailingAnnualDividendYield: moduleValue?.trailingAnnualDividendYield?.raw === undefined ? 'N/A' : moduleValue.trailingAnnualDividendYield.raw,
                }
                resultObj[key] = summaryDetailCopy
                break;
            case "calendarEvents":
                log.info('Cleaning calendarEvents')
                const calendarEventsCopy = {
                    ...moduleValue,
                    earnings: {
                        earningsDate: moduleValue.earnings.earningsDate.map((date) => { return date.raw * 1000 }),
                        earningsAverage: moduleValue.earnings.earningsAverage.raw,
                        earningsLow: moduleValue.earnings.earningsLow.raw,
                        earningsHigh: moduleValue.earnings.earningsHigh.raw,
                        revenueAverage: moduleValue.earnings.revenueAverage.raw,
                        revenueLow: moduleValue.earnings.revenueLow.raw,
                        revenueHigh: moduleValue.earnings.revenueHigh.raw,
                    }
                }
                resultObj[key] = calendarEventsCopy
                break;
            case 'earnings':
                log.info('Cleaning earnings')
                const earningsCopy = {
                    ...moduleValue,
                    earningsChart: {
                        ...moduleValue.earningsChart,
                        quarterly: moduleValue.earningsChart.quarterly.map((info) => {
                            return {
                                ...info,
                                actual: info?.actual?.raw === undefined ? 'N/A' : info.actual.raw,
                                estimate: info?.estimate?.raw === undefined ? 'N/A' : info.estimate.raw,
                            }
                        }),
                        currentQuarterEstimate: moduleValue.earningsChart.currentQuarterEstimate.raw,
                        earningsDate: moduleValue.earningsChart.earningsDate.map((date) => { return date.raw * 1000 }),
                    },
                    financialsChart: {
                        yearly: moduleValue.financialsChart.yearly.map((yearly) => {
                            return {
                                ...yearly,
                                revenue: yearly?.revenue?.raw === undefined ? 'N/A' : yearly.revenue.raw,
                                earnings: yearly?.earnings?.raw === undefined ? 'N/A' : yearly.earnings.raw,
                            }
                        }),
                        quarterly: moduleValue.financialsChart.quarterly.map((quarterly) => {
                            return {
                                ...quarterly,
                                revenue: quarterly?.revenue?.raw === undefined ? 'N/A' : quarterly.revenue.raw,
                                earnings: quarterly?.earnings?.raw === undefined ? 'N/A' : quarterly.earnings.raw,
                            }
                        })
                    }
                }
                resultObj[key] = earningsCopy
                break;
            case 'earningsHistory':
                log.info('Cleaning earningsHistory')
                const earningsHistoryCopy = {
                    ...moduleValue,
                    history: moduleValue.history.map((hist) => {
                        return {
                            ...hist,
                            epsActual: hist?.epsActual?.raw === undefined ? 'N/A' : hist.epsActual.raw,
                            epsEstimate: hist?.epsEstimate?.raw === undefined ? 'N/A' : hist.epsEstimate.raw,
                            epsDifference: hist?.epsDifference?.raw === undefined ? 'N/A' : hist.epsDifference.raw,
                            surprisePercent: hist?.surprisePercent?.raw === undefined ? 'N/A' : hist.surprisePercent.raw,
                            quarter: hist?.quarter?.raw === undefined ? 'N/A' : hist.quarter.raw * 1000,
                        }
                    })
                }
                resultObj[key] = earningsHistoryCopy
                break;
            case 'earningsTrend':
                log.info('Cleaning earningsTrend')
                const earningsTrendCopy = {
                    ...moduleValue,
                    trend: moduleValue.trend.map((trend) => {
                        return {
                            ...trend,
                            growth: trend?.growth?.raw === undefined ? 'N/A' : trend.growth.raw,
                            earningsEstimate: {
                                avg: trend?.earningsEstimate?.avg?.raw === undefined ? 'N/A' : trend.earningsEstimate.avg.raw,
                                low: trend?.earningsEstimate?.low?.raw === undefined ? 'N/A' : trend.earningsEstimate.low.raw,
                                high: trend?.earningsEstimate?.high?.raw === undefined ? 'N/A' : trend.earningsEstimate.high.raw,
                                yearAgoEps: trend?.earningsEstimate?.yearAgoEps?.raw === undefined ? 'N/A' : trend.earningsEstimate.yearAgoEps.raw,
                                numberOfAnalysts: trend?.earningsEstimate?.numberOfAnalysts?.raw === undefined ? 'N/A' : trend.earningsEstimate.numberOfAnalysts.raw,
                                growth: trend?.earningsEstimate?.growth?.raw === undefined ? 'N/A' : trend.earningsEstimate.growth.raw,
                            },
                            revenueEstimate: {
                                avg: trend?.revenueEstimate?.avg?.raw === undefined ? 'N/A' : trend.revenueEstimate.avg.raw,
                                low: trend?.revenueEstimate?.low?.raw === undefined ? 'N/A' : trend.revenueEstimate.low.raw,
                                high: trend?.revenueEstimate?.high?.raw === undefined ? 'N/A' : trend.revenueEstimate.high.raw,
                                yearAgoRevenue: trend?.revenueEstimate?.yearAgoRevenue?.raw === undefined ? 'N/A' : trend.revenueEstimate.yearAgoRevenue.raw,
                                numberOfAnalysts: trend?.revenueEstimate?.numberOfAnalysts?.raw === undefined ? 'N/A' : trend.revenueEstimate.numberOfAnalysts.raw,
                                growth: trend?.revenueEstimate?.growth?.raw === undefined ? 'N/A' : trend.revenueEstimate.growth.raw,
                            },
                            epsTrend: {
                                current: trend?.epsTrend?.current?.raw === undefined ? 'N/A' : trend.epsTrend.current.raw,
                                '7daysAgo': trend?.epsTrend?.['7daysAgo']?.raw === undefined ? 'N/A' : trend.epsTrend['7daysAgo'].raw,
                                '30daysAgo': trend?.epsTrend?.['30daysAgo']?.raw === undefined ? 'N/A' : trend.epsTrend['30daysAgo'].raw,
                                '60daysAgo': trend?.epsTrend?.['60daysAgo']?.raw === undefined ? 'N/A' : trend.epsTrend['60daysAgo'].raw,
                                '90daysAgo': trend?.epsTrend?.['90daysAgo']?.raw === undefined ? 'N/A' : trend.epsTrend['90daysAgo'].raw,
                            },
                            epsRevisions: {
                                upLast7days: trend?.epsRevisions?.upLast7days?.raw === undefined ? 'N/A' : trend.epsRevisions.upLast7days.raw,
                                upLast30days: trend?.epsRevisions?.upLast30days?.raw === undefined ? 'N/A' : trend.epsRevisions.upLast30days.raw,
                                downLast30days: trend?.epsRevisions?.downLast30days?.raw === undefined ? 'N/A' : trend.epsRevisions.downLast30days.raw,
                                downLast90days: trend?.epsRevisions?.downLast90days?.raw === undefined ? 'N/A' : trend.epsRevisions.downLast90days.raw,
                            }
                        }
                    })
                }
                resultObj[key] = earningsTrendCopy
                break;
            case 'cashflowStatementHistory':
                log.info('Cleaning cashflowStatementHistory')
                const cashflowStatementHistoryCopy = {
                    ...moduleValue,
                    cashflowStatements: moduleValue.cashflowStatements.map((statement) => {
                        return {
                            ...statement,
                            endDate: statement?.endDate?.raw === undefined ? 'N/A' : statement.endDate.raw * 1000,
                            netIncome: statement?.netIncome?.raw === undefined ? 'N/A' : statement.netIncome.raw,
                            depreciation: statement?.depreciation?.raw === undefined ? 'N/A' : statement.depreciation.raw,
                            changeToNetincome: statement?.changeToNetincome?.raw === undefined ? 'N/A' : statement.changeToNetincome.raw,
                            changeToInventory: statement?.changeToInventory?.raw === undefined ? 'N/A' : statement.changeToInventory.raw,
                            changeToAccountReceivables: statement?.changeToAccountReceivables?.raw === undefined ? 'N/A' : statement.changeToAccountReceivables.raw,
                            changeToLiabilities: statement?.changeToLiabilities?.raw === undefined ? 'N/A' : statement.changeToLiabilities.raw,
                            changeToOperatingActivities: statement?.changeToOperatingActivities?.raw === undefined ? 'N/A' : statement.changeToOperatingActivities.raw,
                            totalCashFromOperatingActivities: statement?.totalCashFromOperatingActivities?.raw === undefined ? 'N/A' : statement.totalCashFromOperatingActivities.raw,
                            capitalExpenditures: statement?.capitalExpenditures?.raw === undefined ? 'N/A' : statement.capitalExpenditures.raw,
                            investments: statement?.investments?.raw === undefined ? 'N/A' : statement.investments.raw,
                            otherCashflowsFromInvestingActivities: statement?.otherCashflowsFromInvestingActivities?.raw === undefined ? 'N/A' : statement.otherCashflowsFromInvestingActivities.raw,
                            totalCashflowsFromInvestingActivities: statement?.totalCashflowsFromInvestingActivities?.raw === undefined ? 'N/A' : statement.totalCashflowsFromInvestingActivities.raw,
                            netBorrowings: statement?.netBorrowings?.raw === undefined ? 'N/A' : statement.netBorrowings.raw,
                            otherCashflowsFromFinancingActivities: statement?.otherCashflowsFromFinancingActivities?.raw === undefined ? 'N/A' : statement.otherCashflowsFromFinancingActivities.raw,
                            totalCashFromFinancingActivities: statement?.totalCashFromFinancingActivities?.raw === undefined ? 'N/A' : statement.totalCashFromFinancingActivities.raw,
                            effectOfExchangeRate: statement?.effectOfExchangeRate?.raw === undefined ? 'N/A' : statement.effectOfExchangeRate.raw,
                            changeInCash: statement?.changeInCash?.raw === undefined ? 'N/A' : statement.changeInCash.raw,
                            repurchaseOfStock: statement?.repurchaseOfStock?.raw === undefined ? 'N/A' : statement.repurchaseOfStock.raw,
                        }
                    })
                }
                resultObj[key] = cashflowStatementHistoryCopy
                break;
            case 'cashflowStatementHistoryQuarterly':
                log.info('Cleaning cashflowStatementHistoryQuarterly')
                const cashflowStatementHistoryQuarterlyCopy = {
                    ...moduleValue,
                    cashflowStatements: moduleValue.cashflowStatements.map((statement) => {
                        return {
                            ...statement,
                            endDate: statement?.endDate?.raw === undefined ? 'N/A' : statement.endDate.raw * 1000,
                            netIncome: statement?.netIncome?.raw === undefined ? 'N/A' : statement.netIncome.raw,
                            depreciation: statement?.depreciation?.raw === undefined ? 'N/A' : statement.depreciation.raw,
                            changeToNetincome: statement?.changeToNetincome?.raw === undefined ? 'N/A' : statement.changeToNetincome.raw,
                            changeToInventory: statement?.changeToInventory?.raw === undefined ? 'N/A' : statement.changeToInventory.raw,
                            changeToAccountReceivables: statement?.changeToAccountReceivables?.raw === undefined ? 'N/A' : statement.changeToAccountReceivables.raw,
                            changeToLiabilities: statement?.changeToLiabilities?.raw === undefined ? 'N/A' : statement.changeToLiabilities.raw,
                            changeToOperatingActivities: statement?.changeToOperatingActivities?.raw === undefined ? 'N/A' : statement.changeToOperatingActivities.raw,
                            totalCashFromOperatingActivities: statement?.totalCashFromOperatingActivities?.raw === undefined ? 'N/A' : statement.totalCashFromOperatingActivities.raw,
                            capitalExpenditures: statement?.capitalExpenditures?.raw === undefined ? 'N/A' : statement.capitalExpenditures.raw,
                            investments: statement?.investments?.raw === undefined ? 'N/A' : statement.investments.raw,
                            otherCashflowsFromInvestingActivities: statement?.otherCashflowsFromInvestingActivities?.raw === undefined ? 'N/A' : statement.otherCashflowsFromInvestingActivities.raw,
                            totalCashflowsFromInvestingActivities: statement?.totalCashflowsFromInvestingActivities?.raw === undefined ? 'N/A' : statement.totalCashflowsFromInvestingActivities.raw,
                            netBorrowings: statement?.netBorrowings?.raw === undefined ? 'N/A' : statement.netBorrowings.raw,
                            otherCashflowsFromFinancingActivities: statement?.otherCashflowsFromFinancingActivities?.raw === undefined ? 'N/A' : statement.otherCashflowsFromFinancingActivities.raw,
                            totalCashFromFinancingActivities: statement?.totalCashFromFinancingActivities?.raw === undefined ? 'N/A' : statement.totalCashFromFinancingActivities.raw,
                            effectOfExchangeRate: statement?.effectOfExchangeRate?.raw === undefined ? 'N/A' : statement.effectOfExchangeRate.raw,
                            changeInCash: statement?.changeInCash?.raw === undefined ? 'N/A' : statement.changeInCash.raw,
                            repurchaseOfStock: statement?.repurchaseOfStock?.raw === undefined ? 'N/A' : statement.repurchaseOfStock.raw,
                        }
                    })
                }
                resultObj[key] = cashflowStatementHistoryQuarterlyCopy
                break;
            case 'balanceSheetHistory':
                log.info('Cleaning balanceSheetHistory')
                const balanceSheetHistoryCopy = {
                    ...moduleValue,
                    balanceSheetStatements: moduleValue.balanceSheetStatements.map((statement) => {
                        return {
                            ...statement,
                            endDate: statement?.endDate?.raw === undefined ? 'N/A' : statement.endDate.raw * 1000,
                            cash: statement?.cash?.raw === undefined ? 'N/A' : statement.cash.raw,
                            shortTermInvestments: statement?.shortTermInvestments?.raw === undefined ? 'N/A' : statement.shortTermInvestments.raw,
                            netReceivables: statement?.netReceivables?.raw === undefined ? 'N/A' : statement.netReceivables.raw,
                            inventory: statement?.inventory?.raw === undefined ? 'N/A' : statement.inventory.raw,
                            otherCurrentAssets: statement?.otherCurrentAssets?.raw === undefined ? 'N/A' : statement.otherCurrentAssets.raw,
                            totalCurrentAssets: statement?.totalCurrentAssets?.raw === undefined ? 'N/A' : statement.totalCurrentAssets.raw,
                            longTermInvestments: statement?.longTermInvestments?.raw === undefined ? 'N/A' : statement.longTermInvestments.raw,
                            propertyPlantEquipment: statement?.propertyPlantEquipment?.raw === undefined ? 'N/A' : statement.propertyPlantEquipment.raw,
                            goodWill: statement?.goodWill?.raw === undefined ? 'N/A' : statement.goodWill.raw,
                            intangibleAssets: statement?.intangibleAssets?.raw === undefined ? 'N/A' : statement.intangibleAssets.raw,
                            otherAssets: statement?.otherAssets?.raw === undefined ? 'N/A' : statement.otherAssets.raw,
                            deferredLongTermAssetCharges: statement?.deferredLongTermAssetCharges?.raw === undefined ? 'N/A' : statement.deferredLongTermAssetCharges.raw,
                            totalAssets: statement?.totalAssets?.raw === undefined ? 'N/A' : statement.totalAssets.raw,
                            accountsPayable: statement?.accountsPayable?.raw === undefined ? 'N/A' : statement.accountsPayable.raw,
                            shortLongTermDebt: statement?.shortLongTermDebt?.raw === undefined ? 'N/A' : statement.shortLongTermDebt.raw,
                            otherCurrentLiab: statement?.otherCurrentLiab?.raw === undefined ? 'N/A' : statement.otherCurrentLiab.raw,
                            longTermDebt: statement?.longTermDebt?.raw === undefined ? 'N/A' : statement.longTermDebt.raw,
                            otherLiab: statement?.otherLiab?.raw === undefined ? 'N/A' : statement.otherLiab.raw,
                            totalCurrentLiabilities: statement?.totalCurrentLiabilities?.raw === undefined ? 'N/A' : statement.totalCurrentLiabilities.raw,
                            totalLiab: statement?.totalLiab?.raw === undefined ? 'N/A' : statement.totalLiab.raw,
                            commonStock: statement?.commonStock?.raw === undefined ? 'N/A' : statement.commonStock.raw,
                            retainedEarnings: statement?.retainedEarnings?.raw === undefined ? 'N/A' : statement.retainedEarnings.raw,
                            treasuryStock: statement?.treasuryStock?.raw === undefined ? 'N/A' : statement.treasuryStock.raw,
                            otherStockholderEquity: statement?.otherStockholderEquity?.raw === undefined ? 'N/A' : statement.otherStockholderEquity.raw,
                            totalStockholderEquity: statement?.totalStockholderEquity?.raw === undefined ? 'N/A' : statement.totalStockholderEquity.raw,
                            netTangibleAssets: statement?.netTangibleAssets?.raw === undefined ? 'N/A' : statement.netTangibleAssets.raw,
                        }
                    })
                }
                resultObj[key] = balanceSheetHistoryCopy
                break;
            case 'balanceSheetHistoryQuarterly':
                log.info('Cleaning balanceSheetHistoryQuarterly')
                const balanceSheetHistoryQuarterlyCopy = {
                    ...moduleValue,
                    balanceSheetStatements: moduleValue.balanceSheetStatements.map((statement) => {
                        return {
                            ...statement,
                            endDate: statement?.endDate?.raw === undefined ? 'N/A' : statement.endDate.raw * 1000,
                            cash: statement?.cash?.raw === undefined ? 'N/A' : statement.cash.raw,
                            shortTermInvestments: statement?.shortTermInvestments?.raw === undefined ? 'N/A' : statement.shortTermInvestments.raw,
                            netReceivables: statement?.netReceivables?.raw === undefined ? 'N/A' : statement.netReceivables.raw,
                            inventory: statement?.inventory?.raw === undefined ? 'N/A' : statement.inventory.raw,
                            otherCurrentAssets: statement?.otherCurrentAssets?.raw === undefined ? 'N/A' : statement.otherCurrentAssets.raw,
                            totalCurrentAssets: statement?.totalCurrentAssets?.raw === undefined ? 'N/A' : statement.totalCurrentAssets.raw,
                            longTermInvestments: statement?.longTermInvestments?.raw === undefined ? 'N/A' : statement.longTermInvestments.raw,
                            propertyPlantEquipment: statement?.propertyPlantEquipment?.raw === undefined ? 'N/A' : statement.propertyPlantEquipment.raw,
                            goodWill: statement?.goodWill?.raw === undefined ? 'N/A' : statement.goodWill.raw,
                            intangibleAssets: statement?.intangibleAssets?.raw === undefined ? 'N/A' : statement.intangibleAssets.raw,
                            otherAssets: statement?.otherAssets?.raw === undefined ? 'N/A' : statement.otherAssets.raw,
                            deferredLongTermAssetCharges: statement?.deferredLongTermAssetCharges?.raw === undefined ? 'N/A' : statement.deferredLongTermAssetCharges.raw,
                            totalAssets: statement?.totalAssets?.raw === undefined ? 'N/A' : statement.totalAssets.raw,
                            accountsPayable: statement?.accountsPayable?.raw === undefined ? 'N/A' : statement.accountsPayable.raw,
                            shortLongTermDebt: statement?.shortLongTermDebt?.raw === undefined ? 'N/A' : statement.shortLongTermDebt.raw,
                            otherCurrentLiab: statement?.otherCurrentLiab?.raw === undefined ? 'N/A' : statement.otherCurrentLiab.raw,
                            longTermDebt: statement?.longTermDebt?.raw === undefined ? 'N/A' : statement.longTermDebt.raw,
                            otherLiab: statement?.otherLiab?.raw === undefined ? 'N/A' : statement.otherLiab.raw,
                            totalCurrentLiabilities: statement?.totalCurrentLiabilities?.raw === undefined ? 'N/A' : statement.totalCurrentLiabilities.raw,
                            totalLiab: statement?.totalLiab?.raw === undefined ? 'N/A' : statement.totalLiab.raw,
                            commonStock: statement?.commonStock?.raw === undefined ? 'N/A' : statement.commonStock.raw,
                            retainedEarnings: statement?.retainedEarnings?.raw === undefined ? 'N/A' : statement.retainedEarnings.raw,
                            treasuryStock: statement?.treasuryStock?.raw === undefined ? 'N/A' : statement.treasuryStock.raw,
                            otherStockholderEquity: statement?.otherStockholderEquity?.raw === undefined ? 'N/A' : statement.otherStockholderEquity.raw,
                            totalStockholderEquity: statement?.totalStockholderEquity?.raw === undefined ? 'N/A' : statement.totalStockholderEquity.raw,
                            netTangibleAssets: statement?.netTangibleAssets?.raw === undefined ? 'N/A' : statement.netTangibleAssets.raw,
                        }
                    })
                }
                resultObj[key] = balanceSheetHistoryQuarterlyCopy
                break;
            case 'incomeStatementHistory':
                log.info('Cleaning incomeStatementHistory')
                const incomeStatementHistoryCopy = {
                    ...moduleValue,
                    incomeStatementHistory: moduleValue.incomeStatementHistory.map((hist) => {
                        return {
                            ...hist,
                            endDate: hist?.endDate?.raw === undefined ? 'N/A' : hist.endDate.raw * 1000,
                            totalRevenue: hist?.totalRevenue?.raw === undefined ? 'N/A' : hist.totalRevenue.raw,
                            costOfRevenue: hist?.costOfRevenue?.raw === undefined ? 'N/A' : hist.costOfRevenue.raw,
                            grossProfit: hist?.grossProfit?.raw === undefined ? 'N/A' : hist.grossProfit.raw,
                            researchDevelopment: hist?.researchDevelopment?.raw === undefined ? 'N/A' : hist.researchDevelopment.raw,
                            sellingGeneralAdministrative: hist?.sellingGeneralAdministrative?.raw === undefined ? 'N/A' : hist.sellingGeneralAdministrative.raw,
                            totalOperatingExpenses: hist?.totalOperatingExpenses?.raw === undefined ? 'N/A' : hist.totalOperatingExpenses.raw,
                            operatingIncome: hist?.operatingIncome?.raw === undefined ? 'N/A' : hist.operatingIncome.raw,
                            totalOtherIncomeExpenseNet: hist?.totalOtherIncomeExpenseNet?.raw === undefined ? 'N/A' : hist.totalOtherIncomeExpenseNet.raw,
                            ebit: hist?.ebit?.raw === undefined ? 'N/A' : hist.ebit.raw,
                            interestExpense: hist?.interestExpense?.raw === undefined ? 'N/A' : hist.interestExpense.raw,
                            incomeBeforeTax: hist?.incomeBeforeTax?.raw === undefined ? 'N/A' : hist.incomeBeforeTax.raw,
                            incomeTaxExpense: hist?.incomeTaxExpense?.raw === undefined ? 'N/A' : hist.incomeTaxExpense.raw,
                            netIncomeFromContinuingOps: hist?.netIncomeFromContinuingOps?.raw === undefined ? 'N/A' : hist.netIncomeFromContinuingOps.raw,
                            netIncome: hist?.netIncome?.raw === undefined ? 'N/A' : hist.netIncome.raw,
                            netIncomeApplicableToCommonShares: hist?.netIncomeApplicableToCommonShares?.raw === undefined ? 'N/A' : hist.netIncomeApplicableToCommonShares.raw,
                        }
                    })
                }
                resultObj[key] = incomeStatementHistoryCopy
                break;
            case 'incomeStatementHistoryQuarterly':
                log.info('Cleaning incomeStatementHistoryQuarterly')
                const incomeStatementHistoryQuarterlyCopy = {
                    ...moduleValue,
                    incomeStatementHistory: moduleValue.incomeStatementHistory.map((hist) => {
                        return {
                            ...hist,
                            endDate: hist?.endDate?.raw === undefined ? 'N/A' : hist.endDate.raw * 1000,
                            totalRevenue: hist?.totalRevenue?.raw === undefined ? 'N/A' : hist.totalRevenue.raw,
                            costOfRevenue: hist?.costOfRevenue?.raw === undefined ? 'N/A' : hist.costOfRevenue.raw,
                            grossProfit: hist?.grossProfit?.raw === undefined ? 'N/A' : hist.grossProfit.raw,
                            researchDevelopment: hist?.researchDevelopment?.raw === undefined ? 'N/A' : hist.researchDevelopment.raw,
                            sellingGeneralAdministrative: hist?.sellingGeneralAdministrative?.raw === undefined ? 'N/A' : hist.sellingGeneralAdministrative.raw,
                            totalOperatingExpenses: hist?.totalOperatingExpenses?.raw === undefined ? 'N/A' : hist.totalOperatingExpenses.raw,
                            operatingIncome: hist?.operatingIncome?.raw === undefined ? 'N/A' : hist.operatingIncome.raw,
                            totalOtherIncomeExpenseNet: hist?.totalOtherIncomeExpenseNet?.raw === undefined ? 'N/A' : hist.totalOtherIncomeExpenseNet.raw,
                            ebit: hist?.ebit?.raw === undefined ? 'N/A' : hist.ebit.raw,
                            interestExpense: hist?.interestExpense?.raw === undefined ? 'N/A' : hist.interestExpense.raw,
                            incomeBeforeTax: hist?.incomeBeforeTax?.raw === undefined ? 'N/A' : hist.incomeBeforeTax.raw,
                            incomeTaxExpense: hist?.incomeTaxExpense?.raw === undefined ? 'N/A' : hist.incomeTaxExpense.raw,
                            netIncomeFromContinuingOps: hist?.netIncomeFromContinuingOps?.raw === undefined ? 'N/A' : hist.netIncomeFromContinuingOps.raw,
                            netIncome: hist?.netIncome?.raw === undefined ? 'N/A' : hist.netIncome.raw,
                            netIncomeApplicableToCommonShares: hist?.netIncomeApplicableToCommonShares?.raw === undefined ? 'N/A' : hist.netIncomeApplicableToCommonShares.raw,
                        }
                    })
                }
                resultObj[key] = incomeStatementHistoryQuarterlyCopy
                break;
            case 'defaultKeyStatistics':
                log.info('Cleaning defaultKeyStatistics')
                const defaultKeyStatisticsCopy = {
                    ...moduleValue,
                    priceHint: moduleValue?.priceHint?.raw === undefined ? 'N/A' : moduleValue.priceHint.raw,
                    enterpriseValue: moduleValue?.enterpriseValue?.raw === undefined ? 'N/A' : moduleValue.enterpriseValue.raw,
                    forwardPE: moduleValue?.forwardPE?.raw === undefined ? 'N/A' : moduleValue.forwardPE.raw,
                    profitMargins: moduleValue?.profitMargins?.raw === undefined ? 'N/A' : moduleValue.profitMargins.raw,
                    floatShares: moduleValue?.floatShares?.raw === undefined ? 'N/A' : moduleValue.floatShares.raw,
                    sharesOutstanding: moduleValue?.sharesOutstanding?.raw === undefined ? 'N/A' : moduleValue.sharesOutstanding.raw,
                    sharesShort: moduleValue?.sharesShort?.raw === undefined ? 'N/A' : moduleValue.sharesShort.raw,
                    sharesShortPriorMonth: moduleValue?.sharesShortPriorMonth?.raw === undefined ? 'N/A' : moduleValue.sharesShortPriorMonth.raw,
                    sharesShortPreviousMonthDate: moduleValue?.sharesShortPreviousMonthDate?.raw === undefined ? 'N/A' : moduleValue.sharesShortPreviousMonthDate.raw * 1000,
                    dateShortInterest: moduleValue?.dateShortInterest?.raw === undefined ? 'N/A' : moduleValue.dateShortInterest.raw * 1000,
                    sharesPercentSharesOut: moduleValue?.sharesPercentSharesOut?.raw === undefined ? 'N/A' : moduleValue.sharesPercentSharesOut.raw,
                    heldPercentInsiders: moduleValue?.heldPercentInsiders?.raw === undefined ? 'N/A' : moduleValue.heldPercentInsiders.raw,
                    heldPercentInstitutions: moduleValue?.heldPercentInstitutions?.raw === undefined ? 'N/A' : moduleValue.heldPercentInstitutions.raw,
                    shortRatio: moduleValue?.shortRatio?.raw === undefined ? 'N/A' : moduleValue.shortRatio.raw,
                    shortPercentOfFloat: moduleValue?.shortPercentOfFloat?.raw === undefined ? 'N/A' : moduleValue.shortPercentOfFloat.raw,
                    beta: moduleValue?.beta?.raw === undefined ? 'N/A' : moduleValue.beta.raw,
                    impliedSharesOutstanding: moduleValue?.impliedSharesOutstanding?.raw === undefined ? 'N/A' : moduleValue.impliedSharesOutstanding.raw,
                    bookValue: moduleValue?.bookValue?.raw === undefined ? 'N/A' : moduleValue.bookValue.raw,
                    priceToBook: moduleValue?.priceToBook?.raw === undefined ? 'N/A' : moduleValue.priceToBook.raw,
                    lastFiscalYearEnd: moduleValue?.lastFiscalYearEnd?.raw === undefined ? 'N/A' : moduleValue.lastFiscalYearEnd.raw * 1000,
                    nextFiscalYearEnd: moduleValue?.nextFiscalYearEnd?.raw === undefined ? 'N/A' : moduleValue.nextFiscalYearEnd.raw * 1000,
                    mostRecentQuarter: moduleValue?.mostRecentQuarter?.raw === undefined ? 'N/A' : moduleValue.mostRecentQuarter.raw * 1000,
                    earningsQuarterlyGrowth: moduleValue?.earningsQuarterlyGrowth?.raw === undefined ? 'N/A' : moduleValue.earningsQuarterlyGrowth.raw,
                    netIncomeToCommon: moduleValue?.netIncomeToCommon?.raw === undefined ? 'N/A' : moduleValue.netIncomeToCommon.raw,
                    trailingEps: moduleValue?.trailingEps?.raw === undefined ? 'N/A' : moduleValue.trailingEps.raw,
                    forwardEps: moduleValue?.forwardEps?.raw === undefined ? 'N/A' : moduleValue.forwardEps.raw,
                    pegRatio: moduleValue?.pegRatio?.raw === undefined ? 'N/A' : moduleValue.pegRatio.raw,
                    lastSplitDate: moduleValue?.lastSplitDate?.raw === undefined ? 'N/A' : moduleValue.lastSplitDate.raw * 1000,
                    enterpriseToRevenue: moduleValue?.enterpriseToRevenue?.raw === undefined ? 'N/A' : moduleValue.enterpriseToRevenue.raw,
                    enterpriseToEbitda: moduleValue?.enterpriseToEbitda?.raw === undefined ? 'N/A' : moduleValue.enterpriseToEbitda.raw,
                    ['52WeekChange']: moduleValue?.['52WeekChange']?.raw === undefined ? 'N/A' : moduleValue['52WeekChange'].raw,
                    SandP52WeekChange: moduleValue?.SandP52WeekChange?.raw === undefined ? 'N/A' : moduleValue.SandP52WeekChange.raw,
                }
                resultObj[key] = defaultKeyStatisticsCopy
                break;
            case 'financialData':
                log.info('Cleaning financialData')
                const financialDataCopy = {
                    ...moduleValue,
                    currentPrice: moduleValue?.currentPrice?.raw === undefined ? 'N/A' : moduleValue.currentPrice.raw,
                    targetHighPrice: moduleValue?.targetHighPrice?.raw === undefined ? 'N/A' : moduleValue.targetHighPrice.raw,
                    targetLowPrice: moduleValue?.targetLowPrice?.raw === undefined ? 'N/A' : moduleValue.targetLowPrice.raw,
                    targetMeanPrice: moduleValue?.targetMeanPrice?.raw === undefined ? 'N/A' : moduleValue.targetMeanPrice.raw,
                    targetMedianPrice: moduleValue?.targetMedianPrice?.raw === undefined ? 'N/A' : moduleValue.targetMedianPrice.raw,
                    recommendationMean: moduleValue?.recommendationMean?.raw === undefined ? 'N/A' : moduleValue.recommendationMean.raw,
                    numberOfAnalystOpinions: moduleValue?.numberOfAnalystOpinions?.raw === undefined ? 'N/A' : moduleValue.numberOfAnalystOpinions.raw,
                    totalCash: moduleValue?.totalCash?.raw === undefined ? 'N/A' : moduleValue.totalCash.raw,
                    totalCashPerShare: moduleValue?.totalCashPerShare?.raw === undefined ? 'N/A' : moduleValue.totalCashPerShare.raw,
                    ebitda: moduleValue?.ebitda?.raw === undefined ? 'N/A' : moduleValue.ebitda.raw,
                    totalDebt: moduleValue?.totalDebt?.raw === undefined ? 'N/A' : moduleValue.totalDebt.raw,
                    quickRatio: moduleValue?.quickRatio?.raw === undefined ? 'N/A' : moduleValue.quickRatio.raw,
                    currentRatio: moduleValue?.currentRatio?.raw === undefined ? 'N/A' : moduleValue.currentRatio.raw,
                    totalRevenue: moduleValue?.totalRevenue?.raw === undefined ? 'N/A' : moduleValue.totalRevenue.raw,
                    debtToEquity: moduleValue?.debtToEquity?.raw === undefined ? 'N/A' : moduleValue.debtToEquity.raw,
                    revenuePerShare: moduleValue?.revenuePerShare?.raw === undefined ? 'N/A' : moduleValue.revenuePerShare.raw,
                    returnOnAssets: moduleValue?.returnOnAssets?.raw === undefined ? 'N/A' : moduleValue.returnOnAssets.raw,
                    returnOnEquity: moduleValue?.returnOnEquity?.raw === undefined ? 'N/A' : moduleValue.returnOnEquity.raw,
                    grossProfits: moduleValue?.grossProfits?.raw === undefined ? 'N/A' : moduleValue.grossProfits.raw,
                    freeCashflow: moduleValue?.freeCashflow?.raw === undefined ? 'N/A' : moduleValue.freeCashflow.raw,
                    operatingCashflow: moduleValue?.operatingCashflow?.raw === undefined ? 'N/A' : moduleValue.operatingCashflow.raw,
                    earningsGrowth: moduleValue?.earningsGrowth?.raw === undefined ? 'N/A' : moduleValue.earningsGrowth.raw,
                    revenueGrowth: moduleValue?.revenueGrowth?.raw === undefined ? 'N/A' : moduleValue.revenueGrowth.raw,
                    grossMargins: moduleValue?.grossMargins?.raw === undefined ? 'N/A' : moduleValue.grossMargins.raw,
                    ebitdaMargins: moduleValue?.ebitdaMargins?.raw === undefined ? 'N/A' : moduleValue.ebitdaMargins.raw,
                    operatingMargins: moduleValue?.operatingMargins?.raw === undefined ? 'N/A' : moduleValue.operatingMargins.raw,
                    profitMargins: moduleValue?.profitMargins?.raw === undefined ? 'N/A' : moduleValue.profitMargins.raw,
                }
                resultObj[key] = financialDataCopy
                break;
            case 'fundOwnership':
                log.info('Cleaning fundOwnership')
                const fundOwnershipCopy = {
                    ...moduleValue,
                    ownershipList: moduleValue.ownershipList.map((owner) => {
                        return {
                            ...owner,
                            reportDate: owner?.reportDate?.raw === undefined ? 'N/A' : owner.reportDate.raw * 1000,
                            pctHeld: owner?.pctHeld?.raw === undefined ? 'N/A' : owner.pctHeld.raw,
                            position: owner?.position?.raw === undefined ? 'N/A' : owner.position.raw,
                            value: owner?.value?.raw === undefined ? 'N/A' : owner.value.raw,
                            pctChange: owner?.pctChange?.raw === undefined ? 'N/A' : owner.pctChange.raw,
                        }
                    })
                }
                resultObj[key] = fundOwnershipCopy
                break;
            case 'insiderHolders':
                log.info('Cleaning insiderHolders')
                const insiderHoldersCopy = {
                    ...moduleValue,
                    holders: moduleValue.holders.map((holder) => {
                        return {
                            ...holder,
                            latestTransDate: holder?.latestTransDate?.raw === undefined ? 'N/A' : holder.latestTransDate.raw * 1000,
                            positionDirect: holder?.positionDirect?.raw === undefined ? 'N/A' : holder.positionDirect.raw,
                            positionDirectDate: holder?.positionDirectDate?.raw === undefined ? 'N/A' : holder.positionDirectDate.raw * 1000,
                            positionIndirect: holder?.positionIndirect?.raw === undefined ? 'N/A' : holder.positionIndirect.raw,
                            positionIndirectDate: holder?.positionIndirectDate?.raw === undefined ? 'N/A' : holder.positionIndirectDate.raw * 1000,
                        }
                    })
                }
                resultObj[key] = insiderHoldersCopy
                break;
            case 'institutionOwnership':
                log.info('Cleaning institutionOwnership')
                const institutionOwnershipCopy = {
                    ...moduleValue,
                    ownershipList: moduleValue.ownershipList.map((owner) => {
                        return {
                            ...owner,
                            reportDate: owner?.reportDate?.raw === undefined ? 'N/A' : owner.reportDate.raw * 1000,
                            pctHeld: owner?.pctHeld?.raw === undefined ? 'N/A' : owner.pctHeld.raw,
                            position: owner?.position?.raw === undefined ? 'N/A' : owner.position.raw,
                            value: owner?.value?.raw === undefined ? 'N/A' : owner.value.raw,
                            pctChange: owner?.pctChange?.raw === undefined ? 'N/A' : owner.pctChange.raw,
                        }
                    })
                }
                resultObj[key] = institutionOwnershipCopy
                break;
            case 'insiderTransactions':
                log.info('Cleaning insiderTransactions')
                const insiderTransactionsCopy = {
                    ...moduleValue,
                    transactions: moduleValue.transactions.map((transaction) => {
                        return {
                            ...transaction,
                            shares: transaction?.shares?.raw === undefined ? 'N/A' : transaction.shares.raw,
                            value: transaction?.value?.raw === undefined ? 'N/A' : transaction.value.raw,
                            startDate: transaction?.startDate?.raw === undefined ? 'N/A' : transaction.startDate.raw * 1000,
                        }
                    })
                }
                resultObj[key] = insiderTransactionsCopy
                break;
            case 'upgradeDowngradeHistory':
                log.info('Cleaning upgradeDowngradeHistory')
                const upgradeDowngradeHistoryCopy = {
                    ...moduleValue,
                    history: moduleValue.history.map((hist) => {
                        return {
                            ...hist,
                            epochGradeDate: hist.epochGradeDate * 1000
                        }
                    })
                }
                resultObj[key] = upgradeDowngradeHistoryCopy
                break;
            default:
                log.warn('No key match from url fetch')
        }
    }
    log.info('------------------------------------------')
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

const fetchFromYFinancePackage = async (symbol, modules, insightsOptions) => {
    log.info('Fetching from Y-Finance Package')
    // 'summaryProfile','majorHoldersBreakdown' 'netSharePurchaseActivity' not included as it same as assetProfile with less information

    const blackListModules = ['secFilings', 'industryTrend', 'majorDirectHolders', 'sectorTrend', 'topHoldings', 'fundProfile', 'fundPerformance'] // no data from EP
    const whiteListModule = ['quoteType']

    const moduleOptions = {
        modules: modules
    }
    let qSummary = {}
    let symbolInsights = {}
    // @ts-ignore
    // symbolInsights = await yahooFinance.insights(symbol, insightsOptions);
    // @ts-ignore
    qSummary = await yahooFinance.quoteSummary(symbol, moduleOptions)
    return [qSummary, symbolInsights]
}

const fetchFromYFinanceURL = async (symbol, modules) => {
    log.info('Fetching from Y-Finance URL')
    let qSummary = {}
    const baseYFUrl = "https://query1.finance.yahoo.com/v6/finance/quoteSummary/"
    const key = modules.map(module => `modules=${module}`).join('&');
    const finalUrl = `${baseYFUrl}${symbol}?${key}`
    console.log(finalUrl)

    const fetchedResult = await axios.get(finalUrl)
        .then((response) => {
            return response.data.quoteSummary.result[0]
        })
    qSummary = yFinanceDataCleaner(fetchedResult)
    return qSummary
}

const generateStockReport = async (symbol) => {

    const modules = [
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

    const insightsOptions = {
        reportsCount: 4
    }

    let qSummary = {}
    let symbolInsights = {}
    try {
        const [qSumm, symbolInsi] = await fetchFromYFinancePackage(symbol, modules, insightsOptions)
        qSummary = qSumm
        return qSummary
    } catch (err) {
        log.info('Error fetching summary from yahoo finance 2, Trying to fetch from url instead')
        qSummary = await fetchFromYFinanceURL(symbol, modules)
        return qSummary
    }
}

const getStockSummaryDetails = async (symbol) => {
    log.info(`Fetching symbol summary for ${symbol}`)

    let qSummary = {}
    qSummary = await generateStockReport(symbol)
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

    if (Object.keys(qSummary).length !== 0) {
        for (const [key, moduleValue] of Object.entries(qSummary)) {
            // console.log(key)
            switch (key) {
                case 'assetProfile':
                    log.info('Payload assetProfile')
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
                    log.info('Payload recommendationTrend')
                    delete moduleValue.maxAge
                    stockProfile[key] = moduleValue
                    break;
                case 'indexTrend':
                    log.info('Payload indexTrend')
                    delete moduleValue.maxAge
                    stockProfile[key] = moduleValue
                    break;
                case 'price':
                    log.info('Payload price')
                    delete moduleValue.maxAge
                    if (stockProfile['combinedPriceSummary'] === undefined) {
                        stockProfile['combinedPriceSummary'] = moduleValue
                    } else {
                        stockProfile['combinedPriceSummary'] = { ...stockProfile['combinedPriceSummary'], ...moduleValue }
                    }
                    break;
                case 'summaryDetail':
                    log.info('Payload summaryDetail')
                    delete moduleValue.maxAge
                    if (stockProfile['combinedPriceSummary'] === undefined) {
                        stockProfile['combinedPriceSummary'] = moduleValue
                    } else {
                        stockProfile['combinedPriceSummary'] = { ...stockProfile['combinedPriceSummary'], ...moduleValue }
                    }
                    break;
                case 'calendarEvents':
                    log.info('Payload calendarEvents')
                    delete moduleValue.maxAge
                    stockProfile[key] = moduleValue
                    break;
                case 'earnings':
                    log.info('Payload earnings')
                    delete moduleValue.maxAge
                    if (stockProfile['combinedEarnings'] === undefined) {
                        stockProfile['combinedEarnings'] = moduleValue
                    } else {
                        stockProfile['combinedEarnings'] = { ...stockProfile['combinedEarnings'], ...moduleValue }
                    }
                    break;
                case 'earningsHistory':
                    log.info('Payload earningsHistory')
                    delete moduleValue.maxAge
                    if (stockProfile['combinedEarnings'] === undefined) {
                        stockProfile['combinedEarnings'] = moduleValue
                    } else {
                        stockProfile['combinedEarnings'] = { ...stockProfile['combinedEarnings'], ...moduleValue }
                    }
                    break;
                case 'earningsTrend':
                    log.info('Payload earningsTrend')
                    delete moduleValue.maxAge
                    if (stockProfile['combinedEarnings'] === undefined) {
                        stockProfile['combinedEarnings'] = moduleValue
                    } else {
                        stockProfile['combinedEarnings'] = { ...stockProfile['combinedEarnings'], ...moduleValue }
                    }
                    break;
                case 'cashflowStatementHistory':
                    log.info('Payload cashflowStatementHistory')
                    delete moduleValue.maxAge
                    stockProfile.combinedCashflowStatement.annual = moduleValue;
                    break;
                case 'cashflowStatementHistoryQuarterly':
                    log.info('Payload cashflowStatementHistoryQuarterly')
                    delete moduleValue.maxAge
                    stockProfile.combinedCashflowStatement.quarterly = moduleValue;
                    break;
                case 'balanceSheetHistory':
                    log.info('Payload balanceSheetHistory')
                    delete moduleValue.maxAge
                    stockProfile.combinedBalanceSheet.annual = moduleValue;
                    break;
                case 'balanceSheetHistoryQuarterly':
                    log.info('Payload balanceSheetHistoryQuarterly')
                    delete moduleValue.maxAge
                    stockProfile.combinedBalanceSheet.quarterly = moduleValue;
                    break;
                case 'incomeStatementHistory':
                    log.info('Payload incomeStatementHistory')
                    delete moduleValue.maxAge
                    stockProfile.cominedIncomeStatement.annual = moduleValue;
                    break;
                case 'incomeStatementHistoryQuarterly':
                    log.info('Payload incomeStatementHistoryQuarterly')
                    delete moduleValue.maxAge
                    stockProfile.cominedIncomeStatement.quarterly = moduleValue;
                    break;
                case 'defaultKeyStatistics':
                    log.info('Payload defaultKeyStatistics')
                    delete moduleValue.maxAge
                    stockProfile[key] = transformDefaultKeyStat(moduleValue)
                    break;
                case 'financialData':
                    log.info('Payload financialData')
                    delete moduleValue.maxAge
                    stockProfile[key] = transformFinancialData(moduleValue)
                    break;
                case 'fundOwnership':
                    log.info('Payload fundOwnership')
                    delete moduleValue.maxAge
                    stockProfile[key] = moduleValue
                    break;
                case 'insiderHolders':
                    log.info('Payload insiderHolders')
                    delete moduleValue.maxAge
                    stockProfile[key] = moduleValue
                    break;
                case 'institutionOwnership':
                    log.info('Payload institutionOwnership')
                    delete moduleValue.maxAge
                    stockProfile[key] = moduleValue
                    break;
                case 'insiderTransactions':
                    log.info('Payload insiderTransactions')
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
                    log.info('Payload upgradeDowngradeHistory')
                    delete moduleValue.maxAge
                    stockProfile[key] = moduleValue
                    break;
                default:
                    log.warn('No key match')
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
                transactions: matched?.transactions || []
            }
        })
        stockProfile['insiderHolders'].holders = added
        delete stockProfile.insiderTransactions
        return stockProfile
    }
    // console.log(added)
}

// < - - - - - - - - - - Helper Functions - - - - - - - - - - >

module.exports = {
    fetchDataFromUrls
    , formatMillisecond
    , periodToMilliseconds
    , fetchTopTickerByMarketCap
    , getLatestOHLCForTicker
    , getYFinanceShortSummary
    , getYFinanceFullSummary
    , yFinance_metaData_updater
    , getYfinanceQuotes
    , getStockSummaryDetails
}
