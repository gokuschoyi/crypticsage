import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    binance_stats: {},
    yfinance_stats: {},
    new_tickers: [],
}

const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {
        setBinanceStats: (state, action) => {
            state.binance_stats = action.payload;
        },
        setYfinanceStats: (state, action) => {
            state.yfinance_stats = action.payload;
        },
        setNewTickers: (state, action) => {
            state.new_tickers = action.payload;
        },
        updateOnTickerAdd(state, action) {
            const { tickersWithNoDataInBinance, tickersWithNoHistData } = action.payload
            const modifyData = (data) => {
                return data.map((ticker) => {
                    return {
                        symbol: ticker.symbol,
                        asset_launch_date: ticker.asset_launch_date,
                        id: ticker.id,
                        image_url: ticker.image_url,
                        market_cap_rank: ticker.market_cap_rank,
                        max_supply: ticker.max_supply,
                        name: ticker.name,
                        ticker_name: ticker.ticker_name,
                    }
                })
            }
            const modified_ticker_with_no_data = modifyData(tickersWithNoDataInBinance)
            const modified_ticker_with_no_hist_data = modifyData(tickersWithNoHistData)
            console.log(modified_ticker_with_no_data.length, modified_ticker_with_no_hist_data.length)

            state.binance_stats.totalTickerCountInDb = state.binance_stats.totalTickerCountInDb + modified_ticker_with_no_data.length + modified_ticker_with_no_hist_data.length
            state.binance_stats.tickerWithNoDataInBinance = [...state.binance_stats.tickerWithNoDataInBinance, ...modified_ticker_with_no_data]
            state.binance_stats.tickersWithNoHistData = [...state.binance_stats.tickersWithNoHistData, ...modified_ticker_with_no_hist_data]

            const current_tickers = state.new_tickers
            const filteredOut = current_tickers
                .filter(
                    ticker =>
                        modified_ticker_with_no_data.some(tick => tick.symbol !== ticker.symbol) ||
                        modified_ticker_with_no_hist_data.some(tick => tick.symbol !== ticker.symbol)
                )
            console.log(filteredOut.length)
            state.new_tickers = filteredOut
        },
        resetAdminState: (state) => {
            state.binance_stats = {};
            state.yfinance_stats = {};
            state.new_tickers = [];
        }
    }
})

const { reducer, actions } = adminSlice;
export const {
    setBinanceStats
    , setYfinanceStats
    , setNewTickers
    , updateOnTickerAdd
    , resetAdminState
} = actions;
export default reducer;