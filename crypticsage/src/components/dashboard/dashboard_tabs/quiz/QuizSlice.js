import { createSlice } from "@reduxjs/toolkit";

const initialState ={
    transformedData: [],
}

const quizSlice = createSlice({
    name: 'quiz',
    initialState,
    reducers: {
        setTransformedData: (state, action) => {
            state.transformedData = action.payload;
        },
        resetTransformedData: (state) => {
            state.transformedData = [];
        },
    }
})

const { actions, reducer } = quizSlice;
export const { setTransformedData, resetTransformedData } = actions;
export default reducer;
