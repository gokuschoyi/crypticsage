import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    cryptoDataAutoComplete: [],
    yf_ticker: [],
    selectedCoinName: '',
    selectedTokenName: '',
    selectedCoinData: [],
    selectedTokenUrl: '',
    timePeriod: {
        minute: { timePeriod: '30', timeFrame: 'minute', checked: false },
        hour: { timePeriod: '2', timeFrame: 'hour', checked: true },
        day: { timePeriod: '24', timeFrame: 'day', checked: false },
    },
    wordOfTheDay: {},
    recent_lesson_quiz: {}
}

const statsSlice = createSlice({
    name: 'stats',
    initialState,
    reducers: {
        setCryptoDataAutoComplete: (state, action) => {
            state.cryptoDataAutoComplete = action.payload.cryptoData;
            state.yf_ticker = action.payload.yf_ticker
        },
        setSelectedCoinName: (state, action) => {
            state.selectedCoinName = action.payload.coinName;
            state.selectedTokenName = action.payload.tokenName
        },
        setSelectedCoinData: (state, action) => {
            state.selectedCoinData = action.payload.historicalData;
            state.selectedTokenUrl = action.payload.tokenUrl;
        },
        setTimePeriod: (state, action) => {
            state.timePeriod = action.payload;
        },
        setWordOfTheDay: (state, action) => {
            state.wordOfTheDay = action.payload;
        }
        ,
        setRecentLessonAndQuizStatus: (state, action) => {
            state.recent_lesson_quiz = action.payload;
        },
        resetStatsState: (state) => {
            state.cryptoDataAutoComplete = [];
            state.yf_ticker = [];
            state.selectedCoinData = [];
            state.selectedCoinName = '';
            state.selectedTokenName = '';
            state.timePeriod = {
                minute: { timePeriod: '30', timeFrame: 'minute', checked: false },
                hour: { timePeriod: '2', timeFrame: 'hour', checked: true },
                day: { timePeriod: '24', timeFrame: 'day', checked: false },
            };
            state.wordOfTheDay = {};
            state.recent_lesson_quiz = {};
            state.selectedTokenUrl = '';
        }
    }
})

const { reducer, actions } = statsSlice;
export const {
    setCryptoDataAutoComplete,
    setSelectedCoinName,
    setSelectedCoinData,
    setTimePeriod,
    setWordOfTheDay,
    setRecentLessonAndQuizStatus,
    resetStatsState,
} = actions;
export default reducer;