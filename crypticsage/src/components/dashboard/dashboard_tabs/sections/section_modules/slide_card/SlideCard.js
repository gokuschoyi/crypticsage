import React, { useEffect, useRef } from 'react'
import './SlideCard.css'
import Header from '../../../../global/Header'
import { useSelector, useDispatch } from 'react-redux';
import SlideComponent from './Slide'
import { setSlides, resetCounter, setLessonId } from '../../SectionSlice';
import { useNavigate, useParams } from 'react-router-dom';

import { Box, Button, CircularProgress, useTheme } from '@mui/material'
const SlideCard = (props) => {
    const params = useParams();
    const theme = useTheme()
    const { lessId } = params
    const { lessons, slides, sectionId } = useSelector(state => state.section)
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const fetchSlideMounted = useRef(false)
    useEffect(() => {
        if (!fetchSlideMounted.current) {
            console.log("fetchSlideMounted")
            fetchSlideMounted.current = true
            let selectedLesson = lessons.filter(lesson => lesson.lessonId === lessId)[0]
            dispatch(setSlides(selectedLesson))
        }
    })

    function isEmptyObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return true; // Treat non-object values as empty
        }
        return Object.keys(obj).length === 0;
    }

    const goBackToLessons = () => {
        let lessonsUrl = `/dashboard/sections/${sectionId}`
        dispatch(setLessonId(""))
        dispatch(resetCounter())
        navigate(lessonsUrl)
    }

    return (
        <React.Fragment>
            <Box className='introduction-top'>
                <Header title={slides?.chapter_title || `test`} />
                <Box>
                    <Button
                        onClick={goBackToLessons}
                        variant="outlined"
                        style={{ margin: '5px', marginRight: '20px', height: '30px' }}
                    >Go Back</Button>
                </Box>
            </Box>
            <Box className='slides' pl={4} pr={4}>
                {isEmptyObject(slides) ?
                    (
                        <CircularProgress />
                    )
                    :
                    (
                        <SlideComponent lessons={lessons} />
                    )
                }
            </Box>
        </React.Fragment>
    )
}

export default SlideCard