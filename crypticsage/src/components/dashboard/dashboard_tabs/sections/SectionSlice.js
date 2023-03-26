import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    counter: 0,
    sections: [],
    sectionFlag: true,
    lessons: [],
    lessonFlag: false,
    slides: '',
    slideFlag: false,
    currentLesson: 0,
    currentSlide: 0,
    lessonComplete: false,
}

const sectionSlice = createSlice({
    name: 'section',
    initialState,
    reducers: {
        incrementCounter: (state) => {
            state.counter += 1;
        },
        decrementCounter: (state) => {
            state.counter -= 1;
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
        setLessonFlag: (state, action) => {
            state.lessonFlag = action.payload;
        },
        setSlides: (state, action) => {
            state.slides = action.payload;
        },
        setSlideFlag: (state, action) => {
            state.slideFlag = action.payload;
        },
        resetSectionState: (state) => {
            state.counter = 0;
            state.sections = [];
            state.sectionFlag = true;
            state.lessons = [];
            state.lessonFlag = false;
            state.slides = '';
            state.slideFlag = false;
            state.currentLesson = 0;
            state.currentSlide = 0;
            state.lessonComplete = false;
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
    setSlides,
    incrementCounter,
    decrementCounter,
    resetCounter,
    resetSectionState
} = actions;
export default reducer;