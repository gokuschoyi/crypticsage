import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    cryptoData: [],
    stocksData: [],
}

const indicatorsSlice = createSlice({
    name: 'indicators',
    initialState,
    reducers: {
        setCryptoDataRedux: (state, action) => {
            state.cryptoData = action.payload;
        },
        setStocksDataRedux: (state, action) => {
            state.stocksData = action.payload;
        },
        resetIndicatorsState: (state) => {
            state.cryptoData = [];
            state.stocksData = [];
        }
    }
})

const { reducer, actions } = indicatorsSlice;
export const {
    setCryptoDataRedux,
    setStocksDataRedux,
    resetIndicatorsState
} = actions;
export default reducer;