[Go Back](../README.md#content-routes)

## Content Route

- ### POST /updateTickerMeta

  Endpoint to check and update the binance ticker meta data.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/update_ticker_meta

  **Body**: <code>number</code> length - The length of the ticker to update

  **Code**: <code>200</code> Get Crypto Data request success  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Get Crypto Data request success  
   **Response**: <code>array</code> result - The result array of the update request

- ### POST /deleteTickerMeta

  Endpoint to delete the binance ticker meta data.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/delete_ticker_meta

  **Body**: <code>string</code> symbol - The symbol of the ticker to delete

  **Code**: <code>200</code> Delete Ticker Meta request success  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Delete Ticker Meta request success  
   **Response**: <code>object</code> deletedTickerMeta - The result of the delete request

- ### POST /findYFTicker

  Endpoint to find a specific yFinance ticker/tickers.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/find_yf_ticker

  **Body**: <code>array</code> symbols - The symbol/symbols of the ticker to check.

  **Code**: <code>200</code> YF Ticker search success  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - YF Ticker search success  
   **Response**: <code>array</code> result - The result array containing the various quotes and exchanges of the requested symbols.

- ### POST /fetchNewTickersToAdd

  Endpoint to fetch new binance tickers who's metadata is not in the database

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/fetch_new_tickers_to_add

  **Code**: <code>200</code> Get new tickers success  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Get new tickers success  
   **Response**: <code>array</code> new_tickers - The result array containing the new tickers not in DB.

- ### POST /addNewTickerMeta

  Endpoint to add new binance ticker metadata to the database

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/add_new_ticker_meta

  **Code**: <code>200</code>Add new ticker meta success  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message -Add new ticker meta success  
   **Response**: <code>array</code> result - The result of the update or insert operation  
   **Response**: <code>array</code> tickersWithNoDataInBinance - Tickers with no data in Binance  
   **Response**: <code>array</code> tickersWithNoHistData - Tickers with no historical data

- ### POST /getBinanceTickersIndb

  Endpoint to fetch the existing binance tickers in the database

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/get_binance_tickers

  **Code**: <code>200</code> Tickers fetched successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Tickers fetched successfully  
   **Response**: <code>array</code> tickerWithNoDataInBinance - Tickers with no data in Binance  
   **Response**: <code>array</code> tickersWithHistData - Tickers with data in DB  
   **Response**: <code>array</code> tickersWithNoHistData - Tickers with no data in DB  
   **Response**: <code>number</code> tickersWithHistDataLength - Length of tickers with data in DB  
   **Response**: <code>number</code> tickersWithNoHistDataLength - Length of tickers with no data in DB  
   **Response**: <code>number</code> totalTickerCountInDb - Total number of tickers in DB  
   **Response**: <code>number</code> totalTickersWithDataToFetch - Total number of tickers with data to fetch

- ### POST /getYfinanceTickersIndb

  Endpoint to fetch the existing yFinance tickers in the database

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/get_yfinance_tickers

  **Code**: <code>200</code> Yfinance Tickers fetched successfully  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Yfinance Tickers fetched successfully  
   **Response**: <code>array</code> yFTickerInfo - The result array containing the Y-Finance ticker info

- ### POST /fetchOneBinanceTicker

  Endpoint to add the historical data for a single binance ticker.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/fetch_one_binance_ticker

  **Body**: <code>array</code> fetchQuries - The fetch queries for the ticker [{ticker_name, period, meta:{market_cap_rank, symbol, name, asset_launch_date}},{}]

  **Code**: <code>200</code> Processing one ticker fetch request  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Processing one ticker fetch request  
   **Response**: <code>object</code> finalResult - The result of the fetch request

- ### POST /updateOneBinanceTicker

  Endpoint to update the historical data for a single binance ticker.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/update_one_binance_ticker

  **Body**: <code>array</code> updateQueries - The update queries for the ticker [{ticker_name, period, start, end},{}]

  **Code**: <code>200</code> Processing one ticker update request  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Processing one ticker update request  
   **Response**: <code>object</code> finalResult - The result of the update request

- ### POST /updateAllBinanceTickers

  Endpoint to update the historical data for all binance ticker.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/update_all_binance_tickers

  **Body**: <code>array</code> updateQueries - The update queries for the ticker [{ticker_name, period, start, end},{}]

  **Code**: <code>200</code> Processing update request  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - Processing update request  
   **Response**: <code>object</code> finalResult - The result of the update request

- ### POST /updateHistoricalYFinanceData

  Endpoint to update the historical data for a specific ticker or all tickers from Y-Finance

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/update_historical_yFinance_data

  **Body**: <code>string</code> symbol - The symbol of the ticker to update | 'all' to update all ticker in DB

  **Code**: <code>200</code> YF tokens updated  
   **Code**: <code>400</code> Error response

  **Response**: <code>string</code> message - YF tokens updated  
   **Response**: <code>object</code> diffArray - The result of the update process

- ### POST /fetchOneYFinanceTicker

  Endpoint to add the historical data for a single YF ticker.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/fetch_one_yfinance_ticker

  **Body**: <code>array</code> symbol - The symbol of the ticker to fetch.

  **Code**: <code>200</code> Yfinance tickers added.  
   **Code**: <code>400</code> Error response.

  **Response**: <code>string</code> message - Yfinance tickers added.  
   **Response**: <code>array</code> uploadStatus - The result of the upload process.  
   **Response**: <code>array</code> availableTickers - The available tickers in the database.  
   **Response**: <code>array</code> tickers - The tickers that was updated.

- ### POST /deleteOneYfinanceTicker

  Endpoint to delete the historical data for a single YF ticker.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/delete_one_yfinance_ticker

  **Body**: <code>string</code> symbol - The symbol of the ticker to delete.

  **Code**: <code>200</code> Yfinance tickers deleted.  
   **Code**: <code>400</code> Error response.

  **Response**: <code>string</code> message - Yfinance tickers deleted.  
   **Response**: <code>object</code> deleteStatus - The result of the delete process.

- ### POST /getProcessStatus

  Endpoint to check the status of the bull worker process.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/get_process_status

  **Body**: <code>array</code> jobIds - The jobIds of the process to check.

  **Code**: <code>200</code> Job status for update-one-ticker\_.  
   **Code**: <code>400</code> Error response.

  **Response**: <code>string</code> message - Job status for update-one-ticker\_.  
   **Response**: <code>array</code> status - An array containing the staus of each job.

- ### POST /getSections

  Endpoint to fetch the sections in the database.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/get_sections

  **Code**: <code>200</code> Sections fetched successfully.  
   **Code**: <code>400</code> Error response.

  **Response**: <code>string</code> message - Sections fetched successfully.  
   **Response**: <code>array</code> sections - An array containing the sections in the database.

- ### POST /addSection

  Endpoint to add a section to the database.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/add_section

  **Body**: <code>string</code> title - The title of the section to add.  
   **Body**: <code>string</code> content - The content of the section to add.  
   **Body**: <code>string</code> url - The url of the section to add.

  **Code**: <code>200</code> Section added successfully.  
   **Code**: <code>400</code> Error response.

  **Response**: <code>string</code> message - Section added successfully.  
   **Response**: <code>string</code> createdSectionId - The id of the created section.  
   **Response**: <code>boolean</code> update - Wheather the section was inserted or updated. (True = updated, False = inserted)  
   **Response**: <code>array</code> insertedResult - The result of the insert operation.

- ### POST /updateSection

  Endpoint to update a section to the database.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/update_section

  **Body**: <code>string</code> title - The title of the section to update.  
   **Body**: <code>string</code> content - The content of the section to update.  
   **Body**: <code>string</code> url - The url of the section to update.  
   **Body**: <code>string</code> sectionId - The id of the section to update

  **Code**: <code>200</code> Section updated successfully.  
   **Code**: <code>400</code> Error response.

  **Response**: <code>string</code> message - Section updated successfully.  
   **Response**: <code>string</code> createdSectionId - The id of the created section.  
   **Response**: <code>boolean</code> update - The update status.

- ### POST /deleteSection

  Endpoint to delete a sections from the database.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/delete_section

  **Body**: <code>string</code> sectionId - The id of the section to delete.

  **Code**: <code>200</code> Section deleted successfully.  
   **Code**: <code>400</code> Error response.

  **Response**: <code>string</code> message - Section deleted successfully.  
   **Response**: <code>array</code> deleted - An array containing the deleted status.

- ### POST /getLessons

  Endpoint to fetch the lessons for a section in the database.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/get_lessons

  **Body**: <code>string</code> sectionId - The id of the section to fetch lessons for.

  **Code**: <code>200</code> Lessons fetched successfully.  
   **Code**: <code>400</code> Error response.

  **Response**: <code>string</code> message - Lessons fetched successfully.  
   **Response**: <code>array</code> sections - An array containing the lessons for the section.

- ### POST /addLesson

  Endpoint to add a lesson to the database.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/add_lesson

  **Body**: <code>string</code> chapter_title - The title of the lesson to add.  
   **Body**: <code>string</code> sectionId - The id of the section to add the lesson to.  
   **Body**: <code>object</code> lessonData - The data of the lesson to add.

  **Code**: <code>200</code> Lesson added successfully.  
   **Code**: <code>400</code> Error response.

  **Response**: <code>string</code> message - Lesson added successfully.  
   **Response**: <code>string</code> lessonId - The id of the created lesson.  
   **Response**: <code>array</code> insertedResult - The result of the update operation.

- ### POST /updateLesson

  Endpoint to update a lesson in the database.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/update_lesson

  **Body**: <code>string</code> chapter_title - The title of the lesson to add.  
   **Body**: <code>object</code> lessonData - The data of the lesson to add.  
   **Body**: <code>string</code> lessonId - The id of the lesson to update.  
   **Body**: <code>string</code> sectionId - The id of the section to which the lesson belongs.

  **Code**: <code>200</code> Lesson updated successfully.  
   **Code**: <code>400</code> Error response.

  **Response**: <code>string</code> message - Lesson updated successfully.  
   **Response**: <code>array</code> update - The result of the update operation.

- ### POST /deleteLesson

  Endpoint to delete a lesson from the database.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/delete_section

  **Body**: <code>string</code> sectionId - The id of the section to which the lesson belongs to.  
   **Body**: <code>string</code> lessonId - The id of the lesson to delete.

  **Code**: <code>200</code> Lesson deleted successfully.  
   **Code**: <code>400</code> Error response.

  **Response**: <code>string</code> message - Lesson deleted successfully.  
   **Response**: <code>array</code> deleted - An array containing the deleted status.

- ### POST /getQuizzes

  Endpoint to fetch the quizzes for a lesson in the database.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/get_quizQuestions

  **Body**: <code>string</code> lessonId - The id of the lesson to fetch quizzes for.

  **Code**: <code>200</code> Quiz fetched successfully.  
   **Code**: <code>400</code> Error response.

  **Response**: <code>string</code> message - Quiz fetched successfully.  
   **Response**: <code>string</code> status - The status of the request.  
   **Response**: <code>array</code> sections - An array containing the lessons for the section.

- ### POST /addQuizQuestion

  Endpoint to add a quiz to the database.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/add_quizQuestion

  **Body**: <code>string</code> sectionId - The id of the section to add the lesson to.  
   **Body**: <code>string</code> sectionName - The title of the section.  
   **Body**: <code>string</code> lessonId - The id of the lesson to add the quiz to.  
   **Body**: <code>string</code> lessonName - The title of the lesson.  
   **Body**: <code>string</code> quizTitle - The title of the lesson to add.  
   **Body**: <code>string</code> quizDescription - The quiz description.  
   **Body**: <code>array</code> questions - The questions for the quiz.

  **Code**: <code>200</code> Quiz question added successfully.  
   **Code**: <code>400</code> Error response.

  **Response**: <code>string</code> message - Quiz question added successfully.  
   **Response**: <code>string</code> quizId - The id of the created quiz.  
   **Response**: <code>array</code> insertedResult - The result of the insert operation.

- ### POST /updateQuizQuestion

  Endpoint to update a quiz in the database.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/update_quizQuestion

  **Body**: <code>string</code> quizId - The id of the quiz to update.  
   **Body**: <code>string</code> quizTitle - The title of the lesson to update.  
   **Body**: <code>string</code> quizDescription - The quiz description.  
   **Body**: <code>array</code> questions - The questions for the quiz.

  **Code**: <code>200</code> Quiz question updated successfully.  
   **Code**: <code>400</code> Error response.

  **Response**: <code>string</code> message - Quiz question updated successfully.  
   **Response**: <code>array</code> update - The result of the update operation.

- ### POST /deleteQuizQuestion

  Endpoint to delete a quiz from the database.

  **Kind**: inner property of [<code>route/content</code>](../README.md#content-routes)  
   **Auth**: This route requires JWT Authentication with a valid access token (Bearer Token).  
   **Path**: <code>POST</code> /content/delete_quizQuestion

  **Body**: <code>string</code> sectionId - The id of the section to which the quiz belongs to.  
   **Body**: <code>string</code> sectionId - The id of the lesson to which the quiz belongs to.  
   **Body**: <code>string</code> sectionId - The id of the quiz to delete.

  **Code**: <code>200</code> Quiz question deleted successfully.  
   **Code**: <code>400</code> Error response.

  **Response**: <code>string</code> message - Quiz question deleted successfully.  
   **Response**: <code>array</code> deleted - An array containing the deleted status.

[Go Back](../README.md#content-routes)
