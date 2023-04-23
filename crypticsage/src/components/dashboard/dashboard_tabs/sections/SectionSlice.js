import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    counter: 0,
    sections: [],
    sectionFlag: true,
    lessons: [],
    lessonFlag: false,
    slides: {},
    slideFlag: false,
}

const sectionSlice = createSlice({
    name: 'section',
    initialState,
    reducers: {
        setCounter: (state, action) => {
            state.counter = action.payload.slideCounter;
        },
        incrementCounter: (state) => {
            state.counter = state.counter + 1;
            state.slides.lesson_status.lesson_progress = (state.counter) + 1;
        },
        decrementCounter: (state) => {
            state.counter = state.counter - 1;
            state.slides.lesson_status.lesson_progress = (state.counter) + 1;
        },
        resetCounter: (state) => {
            state.counter = 0;
        },
        setSectionFlag: (state, action) => {
            state.sectionFlag = action.payload;
        },
        setSections: (state, action) => {
            state.sections = action.payload;
        },
        setLessons: (state, action) => {
            state.lessons = action.payload;
        },
        clearLessons: (state) => {
            state.lessons = [];
        },
        setLessonFlag: (state, action) => {
            state.lessonFlag = action.payload;
        },
        setSlides: (state, action) => {
            state.slides = action.payload;
        },
        setSlideFlag: (state, action) => {
            state.slideFlag = action.payload;
        },
        setLessonStartedFlag: (state, action) => {
            state.slides.lesson_status.lesson_start = action.payload;
        },
        setLessonCompleteFlag: (state, action) => {
            state.slides.lesson_status.lesson_completed = action.payload;
        },
        resetSectionState: (state) => {
            state.counter = 0;
            state.sections = [];
            state.sectionFlag = true;
            state.lessons = [];
            state.lessonFlag = false;
            state.slides = {};
            state.slideFlag = false;
        }
    }
})

const { reducer, actions } = sectionSlice;
export const {
    setSectionFlag,
    setLessonFlag,
    setSlideFlag,
    setSections,
    setLessons,
    clearLessons,
    setSlides,
    setCounter,
    incrementCounter,
    decrementCounter,
    resetCounter,
    setLessonStartedFlag,
    setLessonCompleteFlag,
    resetSectionState
} = actions;
export default reducer;