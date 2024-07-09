import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    cryptoData: [],
    stocksData: [],
    cryptoPreferences: {
        currency: 'USD',
        order: 'asc',
        orderBy: 'market_cap_rank',
    },
    selectedTab: 0,
}

const indicatorsSlice = createSlice({
    name: 'indicators',
    initialState,
    reducers: {
        setSelectedTab: (state, action) => {
            state.selectedTab = action.payload;
        },
        setCryptoDataRedux: (state, action) => {
            state.cryptoData = action.payload.cryptoData;
        },
        setTickerInfo: (state, action) => {
            const { symbol, data } = action.payload;
            const currentTickers = state.cryptoData;
            const toUpdateIndex = currentTickers.findIndex(ticker => ticker.symbol === symbol);
            if (toUpdateIndex !== -1) {
                const toUpdate = currentTickers[toUpdateIndex];
                toUpdate['info'] = data;
                currentTickers[toUpdateIndex] = toUpdate;
            }
            state.cryptoData = currentTickers;
        },
        setCryptoPreferencesRedux: (state, action) => {
            state.cryptoPreferences = action.payload.cryptoPreferences;
        },
        setStocksDataRedux: (state, action) => {
            state.stocksData = action.payload;
        },
        resetIndicatorsState: (state) => {
            state.cryptoData = [];
            state.stocksData = [];
            state.cryptoPreferences = {
                currency: 'USD',
                order: 'asc',
                orderBy: 'market_cap_rank',
            }
        }
    }
})

const { reducer, actions } = indicatorsSlice;
export const {
    setSelectedTab,
    setCryptoDataRedux,
    setTickerInfo,
    setCryptoPreferencesRedux,
    setStocksDataRedux,
    resetIndicatorsState
} = actions;
export default reducer;