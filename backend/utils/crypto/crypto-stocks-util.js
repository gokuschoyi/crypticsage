// const yahooFinance = require('yahoo-finance2').default; // summary quotes not working
const axios = require('axios');

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

const getYfinanceQuotes = async (symbols) => {
    console.log("Fetching quotes for ", symbols)
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
        } catch (err) {
            console.log(err)
            throw err
        }
    }
    return finalData
}

module.exports = {
    periodToMilliseconds,
    getYfinanceQuotes
}
