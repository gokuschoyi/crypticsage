const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))
const { createTimer } = require('../utils/timer')
const CSUtil = require('../utils/cryptoStocksUtil')
const MDBServices = require('../services/mongoDBServices')


const processGetLatestCryptoData = async () => {
    try {
        const t = createTimer('processGetLatestCryptoData')
        t.startTimer()

        const t2 = createTimer('Fetching ticker meta from db')
        t2.startTimer()
        let cryptoData = await MDBServices.fetchTickerMetaFromDb({ length: "max" })
        let cDataInDb = await MDBServices.getFirstObjectForEachPeriod({ collection_name: 'binance_metadata' })
        t2.stopTimer(__filename.slice(__dirname.length + 1))

        const t3 = createTimer('Promise All')
        t3.startTimer()
        const symbolKeys = cryptoData.map(item => item.symbol)
        const fsym = symbolKeys.join(',')
        const tsyms = 'USD,AUD,NZD,CAD,EUR,JPY'
        const { finalPriceData, ress } = await CSUtil.fetchDataFromUrls({ fsym, tsyms })

        const combinedData = cryptoData.map(item => {
            const symbol = item.symbol;
            const prices = {}
            const priceDataForToken = finalPriceData[symbol]
            for (const [key, value] of Object.entries(priceDataForToken)) {
                let fdMKCap = item.max_supply * value.PRICE
                prices[key] = {
                    "market_cap": value.MKTCAP,
                    "fd_market_cap": fdMKCap > 0 ? fdMKCap : value.MKTCAP,
                    "current_price": value.PRICE,
                    "supply": value.SUPPLY,
                    "last_updated": value.LASTUPDATE,
                    "median": value.MEDIAN,
                    "change_24_hrs": value.CHANGE24HOUR,
                    "change_percentage_24_hrs": value.CHANGEPCT24HOUR,
                    "change_day": value.CHANGEDAY,
                    "change_percentage_day": value.CHANGEPCTDAY,
                    "high_24h": value.HIGH24HOUR,
                    "low_24h": value.LOW24HOUR,
                }
            }
            return {
                ...item,
                prices
            }
        })

        let finalResult = combinedData.map((item) => {
            const matchingSymbol = ress.find(
                (secondItem) => secondItem.baseAsset === item.symbol && secondItem.quoteAsset === "USDT"
            );
            return {
                ...item,
                matchedSymbol: matchingSymbol ? matchingSymbol.symbol : null,
            };
        })

        let combinedDataWithDataInDb = finalResult.map((item) => {
            const matchingSymbol = cDataInDb.find(
                (secondItem) => item.matchedSymbol !== null && item.matchedSymbol === secondItem.ticker_name)
            return {
                ...item,
                dataInDb: matchingSymbol ? true : false
            }
        })

        cryptoData = combinedDataWithDataInDb
        const formattedTime = t.calculateTime()
        t3.stopTimer(__filename.slice(__dirname.length + 1))

        return [cryptoData, formattedTime]

    } catch (error) {
        log.error(error.stack)
        throw error
    }
}


// change later to fetch data from historical_data
const processFetchTickerDataFromDb = async ({ asset_type, ticker_name, period, page_no, items_per_page, new_fetch_offset }) => {
    try {
        const fetchedData = await MDBServices.fetchTickerHistDataFromDb({ type: asset_type, ticker_name, period, page_no, items_per_page, new_fetch_offset })
        return fetchedData
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

module.exports = {
    processGetLatestCryptoData
    , processFetchTickerDataFromDb
}