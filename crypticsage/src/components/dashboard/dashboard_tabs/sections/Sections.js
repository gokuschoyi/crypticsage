import React, { useEffect, useRef } from 'react'
import { useOutletContext } from "react-router-dom";
import { Box } from '@mui/material';
import './Sections.css'
import { useSelector, useDispatch } from 'react-redux';
import { setSections, setLessons, clearLessons, setSlides, resetCounter } from './SectionSlice';
import { setLessonFlag, setSectionFlag, setSlideFlag } from './SectionSlice';

import SectionCard from './section_modules/section_card/SectionCard';
import LessonCard from './section_modules/lesson_card/LessonCard';
import SlideCard from './section_modules/slide_card/SlideCard';

import { fetchSections, fetchLessons } from '../../../../api/db';

const Sections = (props) => {
    const [setTest] = useOutletContext();
    const hide = () => {
        setTest(true);
    }
    const dispatch = useDispatch();
    const { title, subtitle } = props
    const token = useSelector(state => state.auth.accessToken)
    const { sections, lessons, slides } = useSelector(state => state.section)
    const { sectionFlag, lessonFlag, slideFlag } = useSelector(state => state.section)
    const allStatus = useSelector(state => state.auth.user_lesson_status)

    // Load section from backend here
    const fetchSectionMounted = useRef(false)
    useEffect(() => {
        if (!fetchSectionMounted.current) { // Only run if the component is mounted
            fetchSectionMounted.current = true // Set the mount state to true after the first run
            if (sections.length === 0) {
                let data = {
                    token: token
                }
                fetchSections(data)
                    .then(res => {
                        let sect = res.data.sections;
                        const combinedArray = sect.map(section => {
                            const sectionId = section.sectionId;
                            if (allStatus[sectionId]) {
                                return {
                                    ...section,
                                    section_status: allStatus[sectionId]
                                };
                            } else {
                                return section;
                            }
                        });
                        dispatch(setSections(combinedArray))
                    })
                    .catch(error => {
                        console.error(error);
                    })
            }
        }
    }, [sections, dispatch, token, allStatus])


    const [sectionId, setSectionId] = React.useState(0)
    const [sectionName, setSectionName] = React.useState('')
    const [slideName, setSlideName] = React.useState('')

    //load lesson from backend here based on id and section name
    const openLesson = async (e) => {
        dispatch(clearLessons())
        let sectId = JSON.parse(e.target.value).sectionId
        let selectedSectionLessonStatus = allStatus[sectId]


        dispatch(setSectionFlag(false))
        dispatch(setLessonFlag(true))
        let data = {
            token: token,
            sectionId: JSON.parse(e.target.value).sectionId
        }
        try {
            let res = await fetchLessons(data);
            let lessons = res.data.lessons
            const combinedArray = lessons.map((lesson, index) => {
                const lessonId = lesson.lessonId;
                if (selectedSectionLessonStatus[index].lesson_id === lessonId) {
                    return {
                        ...lesson,
                        lesson_status: selectedSectionLessonStatus[index]
                    };
                } else {
                    return lesson;
                }
            });
            dispatch(setLessons(combinedArray))
            var id = JSON.parse(e.target.value).sectionId
            var name = JSON.parse(e.target.value).sectionName
            setSectionId(id)
            setSectionName(name)
        } catch (error) {
            console.error(error);
        }
    }

    //load slides from backend here based on id and lesson name
    const openSlide = (e) => {
        dispatch(setSlideFlag(true))
        dispatch(setLessonFlag(false))
        let lessonId = JSON.parse(e.target.value).lessonId
        let selectedLesson = lessons.filter(lesson => lesson.lessonId === lessonId)[0]
        dispatch(setSlides(selectedLesson))
        setSlideName(selectedLesson.chapter_title)
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
                <LessonCard lessons={lessons} sectionId={sectionId} sectionName={sectionName} goBackToSections={goBackToSections} openSlide={openSlide} />
            )}
            {slideFlag && (
                <SlideCard slides={slides} slideName={slideName} goBackToLessons={goBackToLessons} />
            )}
        </Box>
    )
}

export default Sections