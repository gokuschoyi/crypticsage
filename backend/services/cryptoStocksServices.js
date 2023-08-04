const CSUtil = require('../utils/cryptoStocksUtil')
const MDBServices = require('../services/mongoDBServices')

const processFetchAndSaveLatestTickerMetaData = async ({ length }) => {
    try {
        let cryptoData = await CSUtil.fetchTopTickerByMarketCap({ length })
        let result = await MDBServices.saveLatestTickerMetaDataToDb({ cryptoData })
        return result
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

const processGetLatestCryptoData = async () => {
    try {
        let sTime = performance.now()

        console.time("Fetching ticker meta from db")
        let cryptoData = await MDBServices.fetchTickerMetaFromDb({ length: "max" })
        console.timeEnd("Fetching ticker meta from db")

        console.time("Promise All")
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
                (secondItem) => secondItem.baseAsset === item.symbol
            );
            return {
                ...item,
                matchedSymbol: matchingSymbol ? matchingSymbol.symbol : null,
            };
        })

        cryptoData = finalResult
        let eTime = performance.now()
        const formattedTime = CSUtil.formatMillisecond(eTime - sTime)
        console.timeEnd("Promise All")

        return [cryptoData, formattedTime]

    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

const processFetchTickerDataFromDb = async ({ asset_type, ticker_name, period, page_no, items_per_page }) => {
    const asset_class_db = {
        "crypto": "binance",
        "stocks": "yFinance_new"
    }
    try {
        if (asset_type === "crypto" && (period === "2h" || period === "1h" || period === "30m" || period === "15m" || period === "5m" || period === "3m" || period === "1m")) {
            console.log(`Fetching data for ${ticker_name} with period ${period} from binance_historical`)
            const output = await MDBServices.fetchTickersFromBinanceHistoricalDb({ ticker_name, period, page_no, items_per_page })
            return output
        } else {
            const dataSource = asset_class_db[asset_type]
            console.log(`Fetching data for ${ticker_name} with period ${period} from crypticsage/${dataSource}`)
            const output = await MDBServices.fetchTickersFromCrypticsageBinance({ dataSource, ticker_name, period, page_no, items_per_page })
            return output
        }
    } catch (error) {
        console.log(error)
        throw new Error(error.message)
    }
}

module.exports = {
    processFetchAndSaveLatestTickerMetaData
    , processGetLatestCryptoData
    , processFetchTickerDataFromDb
}