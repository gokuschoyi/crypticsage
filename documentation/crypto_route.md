[Go Back](../README.md#crypto-routes)

## Crypto Route

- ### POST /getCryptoData

  Endpoint to fetch the crypto ticker meta from the DB.

  **Kind**: inner property of [<code>route/crypto</code>](../README.md#crypto-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /crypto/getCryptoData

  **Code**: <code>200</code> Get Binance Ticker Meta Data request success  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Get Binance Ticker Meta Data request success  
   **Response**: <code>array</code> cryptoData - List of available tickers with some metadata from the DB.

  #### Response

  ```json
  {
    "message": "Get Binance Ticker Meta Data request success",
    "cryptoData": [
      {
        "symbol": "BTC",
        "asset_launch_date": "2009-01-03",
        "current_price": 63896.6807281853,
        "high_24h": 64634.4259671594,
        "id": "1182",
        "image_url": "https://www.cryptocompare.com/media/37746251/btc.png",
        "last_updated": 1714938592,
        "low_24h": 62923.4726545215,
        "market_cap_rank": 1,
        "matched": "BTCUSDT",
        "max_supply": 20999999.9769,
        "name": "Bitcoin",
        "price_change_24h": -37.47702884149476,
        "price_change_percentage_24h": -0.0586181630544367,
        "info": {}
      }, ...{}
    ]
  }
  ```

- ### POST /getHistoricalData

  Endpoint to to fetch the latest crypto ticker chart data from cryptocompare api

  **Kind**: inner property of [<code>route/crypto</code>](../README.md#crypto-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /crypto/getHistoricalData

  **Body**: <code>string</code> tokenName - The ticker name of the token  
   **Body**: <code>string</code> timeFrame - The time frame of the data to be fetched

  **Code**: <code>200</code> Get Historical Data request success  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Get Historical Data request success  
   **Response**: <code>object</code> historicalData - Array of ticker data for the selected period.  
   **Response**: <code>string</code> url - The url from where the data was fetched.

  #### Request

  ```json
  {
    "tokenName": "BTC",
    "timeFrame": "hour"
  }
  ```

  #### Response

  ```json
  {
    "message":"Get Historical data request success",
    "url":"https://min-api.cryptocompare.com/data/v2/histohour?fsym=BTC&tsym=USD&limit=700",
    "historicalData": {
      "Data": {
        "Data": [
          {
            "time": 1712451600,
            "high": 69636.93,
            "low": 69018.5,
            "open": 69034.11,
            "volumefrom": 901.81,
            "volumeto": 62626375.34,
            "close": 69566.65,
            "conversionType": "direct",
            "conversionSymbol": ""
          }
        ], ...{}
      }
    }
  }
  ```

- ### POST /getLatestCryptoData

  Endpoint to fetch the crypto ticker metadata from the DB for table info.

  **Kind**: inner property of [<code>route/crypto</code>](../README.md#crypto-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /crypto/get-latest-crypto-data

  **Code**: <code>200</code> Get Latest Token Data request success  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Get Latest Token Data request success  
   **Response**: <code>string</code> formattedTime - Time taken to fetch the data.  
   **Response**: <code>array</code> cryptoData - List of available crypto tickers with metadata from the DB.

  #### Response

  ```json
  {
    "message": "Get Latest Token Data request success",
    "formattedTime": "3.057 s",
    "cryptoData": [
      {
        "symbol": "BTC",
        "asset_launch_date": "2009-01-03",
        "id": "1182",
        "image_url": "https://www.cryptocompare.com/media/37746251/btc.png",
        "market_cap_rank": 1,
        "max_supply": 20999999.9769,
        "name": "Bitcoin",
        "prices": {
          "USD": {
            "market_cap": 1263701008308.8499,
            "fd_market_cap": 1347456051861.2207,
            "current_price": 64164.5739687344,
            "supply": 19694684,
            "last_updated": 1714974083,
            "median": 64164.5739687344,
            "change_24_hrs": 936.5371922871054,
            "change_percentage_24_hrs": 1.4812055537931386,
            "change_day": 127.07893930490536,
            "change_percentage_day": 0.19844458195390705,
            "high_24h": 64634.4259671594,
            "low_24h": 63185.533121961
          },
          "AUD": {
            "market_cap": 1909151574993.7883,
            "fd_market_cap": 2035685519542.6416,
            "current_price": 96937.4057991379,
            "supply": 19694684,
            "last_updated": 1714974063,
            "median": 96937.4057991379,
            "change_24_hrs": 1184.6566304333974,
            "change_percentage_24_hrs": 1.2372037781872758,
            "change_day": 3.6763199557899497,
            "change_percentage_day": 0.0037926116900098136,
            "high_24h": 97745.2021038034,
            "low_24h": 95649.1906504454
          },
          "NZD": {
            "market_cap": 2109327441170.24,
            "fd_market_cap": 2249128557525.9585,
            "current_price": 107101.36,
            "supply": 19694684,
            "last_updated": 1714971600,
            "median": 107101.36,
            "change_24_hrs": 1488.5599999999977,
            "change_percentage_24_hrs": 1.409450369652161,
            "change_day": 209.38999999999942,
            "change_percentage_day": 0.19588936381282843,
            "high_24h": 107101.36,
            "low_24h": 105381.37
          },
          "CAD": {
            "market_cap": 1730991379849.2,
            "fd_market_cap": 1845717297969.711,
            "current_price": 87891.3,
            "supply": 19694684,
            "last_updated": 1714974067,
            "median": 87891.3,
            "change_24_hrs": 1317.1000000000058,
            "change_percentage_24_hrs": 1.5213539368541735,
            "change_day": 271.6999999999971,
            "change_percentage_day": 0.31009043638637596,
            "high_24h": 88510,
            "low_24h": 86573.4
          },
          "EUR": {
            "market_cap": 1174236284196.8372,
            "fd_market_cap": 1252061822419.1218,
            "current_price": 59621.9916093519,
            "supply": 19694684,
            "last_updated": 1714974078,
            "median": 59621.9916093519,
            "change_24_hrs": 866.3052135639009,
            "change_percentage_24_hrs": 1.4744193570105302,
            "change_day": 122.26212195039989,
            "change_percentage_day": 0.20548349211619144,
            "high_24h": 60008.5344537654,
            "low_24h": 58725.5537157266
          },
          "JPY": {
            "market_cap": 194656656264591.72,
            "fd_market_cap": 207558028199886.72,
            "current_price": 9883715.63943812,
            "supply": 19694684,
            "last_updated": 1714974062,
            "median": 9883715.63943812,
            "change_24_hrs": 200178.9224318713,
            "change_percentage_24_hrs": 2.0672087924272198,
            "change_day": 41432.90176109038,
            "change_percentage_day": 0.42096841622403286,
            "high_24h": 9905044.13124918,
            "low_24h": 9683489.73739707
          }
        },
        "matchedSymbol": "BTCUSDT",
        "dataInDb": true
      }, ...{}
    ]
  }
  ```

- ### POST /getLatestStocksData

  Endpoint to fetch the stock ticker metadata from the DB for table info.

  **Kind**: inner property of [<code>route/crypto</code>](../README.md#crypto-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /crypto/get-latest-stocks-data

  **Code**: <code>200</code> Get Latest Stocks Data request success  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Get Latest Stocks Data request success  
   **Response**: <code>array</code> yFData - List of available stock tickers with metadata from the DB.

  #### Response

  ```json
  {
    "message": "Get Latest Stocks Data request success",
    "yFData": [
      {
        "symbol": "AAPL",
        "open": 186.67,
        "high": 187,
        "low": 182.66,
        "divident_rate": 1,
        "divident_yield": 0.0055,
        "five_year_avg_dividend_yield": 0.73,
        "market_cap": 2811660599296,
        "fiftyTwoWeekLow": 164.08,
        "fiftyTwoWeekHigh": 199.62,
        "enterpriseValue": 2849403830272,
        "pegRatio": 2.41,
        "currentQuarterEstimate": 1.31,
        "financial_chart": [
          {
            "date": 2020,
            "revenue": 274515000000,
            "earnings": 57411000000
          },
          {
            "date": 2021,
            "revenue": 365817000000,
            "earnings": 94680000000
          },
          {
            "date": 2022,
            "revenue": 394328000000,
            "earnings": 99803000000
          },
          {
            "date": 2023,
            "revenue": 383285000000,
            "earnings": 96995000000
          }
        ],
        "short_name": "Apple Inc.",
        "total_cash": 67150000128,
        "ebitda": "N/A",
        "total_debt": 104590000128,
        "total_revenue": 381623009280,
        "debt_to_equity": 140.968,
        "gross_profit": "N/A",
        "free_cashflow": 84726874112,
        "operating_cashflow": 110563000320,
        "rev_growth": -0.043
      }, ...{}
    ]
  }
  ```

- ### POST /getStockSummaryDetails

  Endpoint to fetch the individual stock summary for a YF Ticker.

  **Kind**: inner property of [<code>route/crypto</code>](../README.md#crypto-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /crypto/get-stock-summary-details

  **Body**: <code>string</code> symbol - The ticker name of the stock

  **Code**: <code>200</code> Get Stock Summary Details request success  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Get Stock Summary Details request success  
   **Response**: <code>object</code> stockSummaryDetails - Various keys with the stock summary results.

  #### Request

  ```json
  {
    "symbol": "INMD"
  }
  ```

  #### Response

  ```json
  {
    "message": "Get Stock Summary Details request success",
    "stockSummaryDetails": {
      "combinedCashflowStatement": {},
      "combinedBalanceSheet": {},
      "cominedIncomeStatement": {},
      "assetProfile": {},
      "recommendationTrend": {},
      "institutionOwnership": {},
      "combinedEarnings": {},
      "indexTrend": {},
      "defaultKeyStatistics": {},
      "fundOwnership": {},
      "combinedPriceSummary": {},
      "insiderHolders": {},
      "calendarEvents": {},
      "upgradeDowngradeHistory": {},
      "financialData": {}
    }
  }
  ```

- ### POST /fetchSingleTickerInfo

  Endpoint to fetch the summary for a Binance Ticker.

  **Kind**: inner property of [<code>route/crypto</code>](../README.md#crypto-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /crypto/fetch_single_ticker_info

  **Body**: <code>string</code> symbol - The ticker name of the crypto

  **Code**: <code>200</code> Single Ticker Info fetched successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Single Ticker Info fetched successfully  
   **Response**: <code>object</code> data - Various keys with the crypto summary results.

  #### Request

  ```json
  {
    "symbol": "BTC"
  }
  ```

  #### Response

  ```json
  {
    "message": "Single Ticker Info fetched successfully",
    "data": {
      "basic": {},
      "supply": {},
      "asset_security_metrics": {},
      "leaders": {},
      "hash_algorithm": {},
      "asset_industries": {},
      "trading_signals": {},
      "layer_two_solutions": {},
      "privacy_solutions": {},
      "algorithm_types": {}
    }
  }
  ```

- ### POST /fetchTokenData

  Endpoint to fetch the ohlcv data to be plotted on chart.

  **Kind**: inner property of [<code>route/crypto</code>](../README.md#crypto-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /crypto/fetch_token_data

  **Body**: <code>string</code> asset_type - The type of asset (crypto/stock)  
   **Body**: <code>number</code> items_per_page - The number of items per page  
   **Body**: <code>number</code> page_no - The page number  
   **Body**: <code>string</code> period - The period of the data to be fetched  
   **Body**: <code>string</code> ticker_name - The ticker name of the crypto

  **Code**: <code>200</code> Token Data fetched successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Token Data fetched successfully  
   **Response**: <code>object</code> fetchedResults - Object containing the fetched data.

  #### Request

  ```json
  {
    "asset_type": "crypto",
    "ticker_name": "BTCUSDT",
    "period": "4h",
    "page_no": 1,
    "items_per_page": 500
  }
  ```

  #### Response

  ```json
  {
    "message": "Token Data Fetched Successfully",
    "fetchedResults": {
      "ticker_name": "BTCUSDT",
      "total_count_db": 14715,
      "period": "4h",
      "page_no": 1,
      "items_per_page": 500,
      "start_date": "06/05/2024, 10:00:00 am",
      "end_date": "13/02/2024, 7:00:00 am",
      "total_count": 500,
      "expires_at": 1714982399000,
      "ticker_data": [
        {
          "openTime": 1707768000000,
          "open": "49532.02000000",
          "high": "50271.02000000",
          "low": "49532.02000000",
          "close": "49917.27000000",
          "volume": "7397.09443000",
          "date": "13/02/2024, 7:00:00 am"
        }, ...{}
      ]
    }
  }
  ```

[Go Back](../README.md#crypto-routes)
