import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    cryptoDataInDb: [],
    stocksDataInDb: [],
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
        }
    }
})

const { reducer, actions } = cryptoStockModuleSlice;
export const {
    setCryptoDataInDbRedux,
    setStocksDataInDbRedux
} = actions;
export default reducer;