const axios = require('axios');
const { getYfinanceQuotes } = require('../utils/crypto/crypto-stocks-util')

const getCryptoData = async (req, res) => {
    try {
        const cryptoData = await axios.get('https://min-api.cryptocompare.com/data/top/mktcapfull?limit=20&tsym=USD')
        var filteredCryptoData = cryptoData.data.Data.map((crypto, index) => {
            return {
                id: crypto.CoinInfo.Id,
                symbol: crypto.CoinInfo.Name,
                name: crypto.CoinInfo.FullName,
                image_url: `https://www.cryptocompare.com${crypto.CoinInfo.ImageUrl}`,
                current_price: crypto.RAW.USD.PRICE,
                market_cap_rank: index + 1,
                price_change_24h: crypto.RAW.USD.CHANGE24HOUR,
                price_change_percentage_24h: crypto.RAW.USD.CHANGEPCT24HOUR,
                last_updated: crypto.RAW.USD.LASTUPDATE,
                high_24h: crypto.RAW.USD.HIGH24HOUR,
                low_24h: crypto.RAW.USD.LOW24HOUR,
            }
        })
        res.status(200).json({ message: "Get Crypto Data request success", cryptoData: filteredCryptoData });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: "Get Crypto Data request error" })
    }
}

const getHistoricalData = async (req, res) => {
    const { tokenName, timePeriod, timeFrame } = req.body;
    let limit = 700;
    try {
        let url = `https://min-api.cryptocompare.com/data/v2/histo${timeFrame}?fsym=${tokenName}&tsym=USD&limit=${limit}`
        const historicalData = await axios.get(url)
        res.status(200).json({ message: "Get Historical Data request success", url, historicalData: historicalData.data });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: "Get Historical Data request error" })
    }
}

const getLatestCryptoData = async (req, res) => {
    try {
        const url = "https://min-api.cryptocompare.com/data/top/mktcapfull?limit=20&tsym=USD"
        let latestTokenData = await axios.get(url)
        latestTokenData = latestTokenData.data.Data

        let cryptoData = latestTokenData.map((token, index) => {
            return {
                market_cap_rank: index + 1,
                id: token.CoinInfo.Id,
                symbol: token.CoinInfo.Name,
                name: token.CoinInfo.FullName,
                image_url: `https://www.cryptocompare.com${token.CoinInfo.ImageUrl}`,
                max_supply: token.CoinInfo.MaxSupply,
                asset_launch_date: token.CoinInfo.AssetLaunchDate,
            }
        })

        const tsyms = 'USD,AUD,NZD,CAD,EUR,JPY'
        const symbolKeys = cryptoData.map(item => item.symbol)
        const fsym = symbolKeys.join(',')
        const priceUrl = `https://min-api.cryptocompare.com/data/pricemultifull?fsyms=${fsym}&tsyms=${tsyms}`
        let priceData = await axios.get(priceUrl)
        let finalPriceData = priceData.data.RAW

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

        const testTokenUrl = "https://api.binance.com/api/v3/exchangeInfo"
        let binanceResult = await axios.get(testTokenUrl)
        let ress = binanceResult.data.symbols
        // console.log(binanceResult)

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

        res.status(200).json({ message: "Get Latest Token Data request success", cryptoData });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: "Get Latest Token Data request error" })
    }
}

const getLatestStocksData = async (req, res) => {
    try {
        // 'AAPL','GOOG','MSFT','IBM','AMZN','ORCL','INTC','QCOM','CSCO','SAP','TSM','BIDU','EMC','HPQ','TXN','ERIC','ASML','YHOO'
        const yFSymbols = ['AAPL', 'GOOG', 'MSFT']
        let yFData = await getYfinanceQuotes(yFSymbols)
        res.status(200).json({ message: "Get Latest Stocks Data request success", yFData });
    } catch (err) {
        console.log(err);
        res.status(400).json({ message: "Get Latest Stocks Data request error" })
    }
}

module.exports = {
    getCryptoData,
    getHistoricalData,
    getLatestCryptoData,
    getLatestStocksData,
}