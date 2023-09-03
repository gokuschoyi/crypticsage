import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    cryptoDataInDb: [],
    stocksDataInDb: [],
    streamedTickerData: []
}

const cryptoStockModuleSlice = createSlice({
    name: 'cryptoStockModule',
    initialState,
    reducers: {
        setCryptoDataInDbRedux: (state, action) => {
            state.cryptoDataInDb = action.payload;
        },
        setStocksDataInDbRedux: (state, action) => {
            state.stocksDataInDb = action.payload;
        },
        setStreamedTickerDataRedux: (state, action) => {
            state.streamedTickerData.push(action.payload);
        },
        resetStreamedTickerDataRedux: (state) => {
            state.streamedTickerData = [];
        },
        resetCryptoStockModule: (state) => {
            state.cryptoDataInDb = [];
            state.stocksDataInDb = [];
            state.streamedTickerData = [];
        }
    }
})

const { reducer, actions } = cryptoStockModuleSlice;
export const {
    setCryptoDataInDbRedux,
    setStocksDataInDbRedux,
    setStreamedTickerDataRedux,
    resetStreamedTickerDataRedux,
    resetCryptoStockModule
} = actions;
export default reducer;