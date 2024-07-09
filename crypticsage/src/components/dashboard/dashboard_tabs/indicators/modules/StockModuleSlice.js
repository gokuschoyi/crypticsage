import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    selectedStock: '',
    selectedStockPeriod: '1d',
    stockSummary: {},
    stocksDataInDb: [],
}

const stockModuleSlice = createSlice({
    name: 'stockModule',
    initialState,
    reducers: {
        setStocksDataInDbRedux: (state, action) => {
            state.stocksDataInDb = action.payload;
        },
        setSelectedStockName: (state, action) => {
            state.selectedStock = action.payload;
        },
        setSelectedStockPeriod: (state, action) => {
            state.selectedStockPeriod = action.payload;
        },
        setStockSummary: (state, action) => {
            state.stockSummary = action.payload;
        },
        resetStateOnStockNameChange: (state) => {
            state.selectedStockPeriod = '1d'
            state.stockSummary = {}
        },
        resetStocksDataInDbRedux: (state) => {
            state.stocksDataInDb = [];
            state.selectedStockPeriod = '1d'
            state.selectedStock = ''
        },
    }
})

const { reducer, actions } = stockModuleSlice
export const {
    setStocksDataInDbRedux,
    setSelectedStockName,
    setSelectedStockPeriod,
    setStockSummary,
    resetStateOnStockNameChange,
    resetStocksDataInDbRedux,
} = actions
export default reducer