import React, { useEffect } from 'react'
import { useOutletContext } from "react-router-dom";
import { Box, useTheme } from '@mui/material';
import './Sections.css'
import LESSON_DATA from './section_modules/data/LessonData';
import SECTION_DATA from './section_modules/data/SectionData';
import CHAPTER_DATA from './section_modules/data/ChapterData';
import { useSelector, useDispatch } from 'react-redux';
import { setSections, setLessons, setSlides, resetCounter } from './SectionSlice';
import { setLessonFlag, setSectionFlag, setSlideFlag } from './SectionSlice';

import SectionCard from './section_modules/section_card/SectionCard';
import LessonCard from './section_modules/lesson_card/LessonCard';
import SlideCard from './section_modules/slide_card/SlideCard';

const Sections = (props) => {
    const [setTest] = useOutletContext();
    const hide = () => {
        setTest(true);
    }
    const theme = useTheme();
    const dispatch = useDispatch();
    const { title, subtitle } = props

    const { sections, lessons, slides } = useSelector(state => state.section)
    const{sectionFlag, lessonFlag, slideFlag} = useSelector(state => state.section)
    // Load section from backend here
    useEffect(() => {
        if (sections.length === 0) {
            dispatch(setSections(SECTION_DATA))
        }
        // console.log(sections)
    }, [sections, dispatch])


    const [lessonId, setLessonId] = React.useState(0)
    const [lessonName, setLessonName] = React.useState('')
    const [slideName, setSlideName] = React.useState('')


    //load lesson from backend here based on id and section name
    const openLesson = (e) => {
        dispatch(setLessonFlag(true))
        dispatch(setSectionFlag(false))
        const { value } = e.target
        dispatch(setLessons(LESSON_DATA))
        var id = JSON.parse(value).sectionId
        var name = JSON.parse(value).sectionName
        setLessonId(id)
        setLessonName(name)
    }

    //load slides from backend here based on id and lesson name
    const openSlide = (e) => {
        dispatch(setSlideFlag(true))
        dispatch(setLessonFlag(false))
        const { value } = e.target
        var slideName = JSON.parse(value).lessonName
        setSlideName(slideName)
        dispatch(setSlides(CHAPTER_DATA))
        console.log(slideName)
    }

    const goBackToSections = () => {
        dispatch(setLessonFlag(false))
        dispatch(setSectionFlag(true))
    }

    const goBackToLessons = () => {
        dispatch(setSlideFlag(false))
        dispatch(setLessonFlag(true))
        dispatch(resetCounter())
    }

    return (
        <Box className='learning-container' onClick={hide}>
            {sectionFlag && (
                <SectionCard title={title} subtitle={subtitle} sections={sections} openLesson={openLesson} />
            )}
            {lessonFlag && (
                <LessonCard lessons={lessons} lessonId={lessonId} lessonName={lessonName} goBackToSections={goBackToSections} openSlide={openSlide} />
            )}
            {slideFlag && (
                <SlideCard slides={slides} slideName={slideName} goBackToLessons={goBackToLessons} />
            )}
        </Box>
    )
}

export default Sections