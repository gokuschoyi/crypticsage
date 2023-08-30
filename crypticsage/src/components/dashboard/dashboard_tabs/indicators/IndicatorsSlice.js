import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    cryptoData: [],
    stocksData: [],
    cryptoPreferences: {
        currency: 'USD',
        order: 'asc',
        orderBy: 'market_cap_rank',
    }
}

const indicatorsSlice = createSlice({
    name: 'indicators',
    initialState,
    reducers: {
        setCryptoDataRedux: (state, action) => {
            state.cryptoData = action.payload.cryptoData;
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
    setCryptoDataRedux,
    setCryptoPreferencesRedux,
    setStocksDataRedux,
    resetIndicatorsState
} = actions;
export default reducer;