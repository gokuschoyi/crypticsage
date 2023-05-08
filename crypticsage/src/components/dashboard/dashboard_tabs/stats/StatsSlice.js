import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    cryptoDataAutoComplete: [],
    selectedCoinName: '',
    selectedTokenName: '',
    selectedCoinData: [],
    selectedTokenUrl: '',
    timePeriod: {
        thirtyM: { timePeriod: '30', timeFrame: 'minute', checked: false },
        twoH: { timePeriod: '2', timeFrame: 'hour', checked: true },
        fourH: { timePeriod: '4', timeFrame: 'hour', checked: false },
        oneD: { timePeriod: '24', timeFrame: 'hour', checked: false },
    },
    wordOfTheDay: {},
    recent_lesson_quiz: {}
}

const statsSlice = createSlice({
    name: 'stats',
    initialState,
    reducers: {
        setCryptoDataAutoComplete: (state, action) => {
            state.cryptoDataAutoComplete = action.payload;
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
            state.selectedCoinData = [];
            state.selectedCoinName = '';
            state.selectedTokenName = '';
            state.timePeriod = {
                thirtyM: { timePeriod: '30', timeFrame: 'minute', checked: false },
                twoH: { timePeriod: '2', timeFrame: 'hour', checked: true },
                fourH: { timePeriod: '4', timeFrame: 'hour', checked: false },
                oneD: { timePeriod: '24', timeFrame: 'hour', checked: false },
            };
            state.wordOfTheDay = {};
            state.recent_lesson_quiz = {};
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