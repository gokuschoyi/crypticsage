import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    counter: 0,
    sections: [],
    sectionId: '',
    lessons: [],
    lessonId: '',
    slides: {},
    sectionFlag: true,
    lessonFlag: false,
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
        setSectionId: (state, action) => {
            state.sectionId = action.payload;
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
        setLessonId: (state, action) => {
            state.lessonId = action.payload;
        },
        resetLessonId: (state) => {
            state.lessonId = '';
        },
        setSlides: (state, action) => {
            state.slides = action.payload;
        },
        setSectionFlag: (state, action) => {
            state.sectionFlag = action.payload;
        },
        setLessonFlag: (state, action) => {
            state.lessonFlag = action.payload;
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
            state.sectionId = '';
            state.lessons = [];
            state.lessonId = '';
            state.slides = {};
            state.sectionFlag = true;
            state.lessonFlag = false;
            state.slideFlag = false;
        }
    }
})

const { reducer, actions } = sectionSlice;
export const {
    setSectionId,
    setLessonId,
    resetLessonId,
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