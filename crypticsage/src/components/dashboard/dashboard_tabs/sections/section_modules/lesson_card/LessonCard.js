import React, { useEffect, useRef } from 'react'
import Header from '../../../../global/Header'
import './LessonCard.css'
import { KeyboardDoubleArrowRightOutlinedIcon } from '../../../../global/Icons'
import { Box, IconButton, Button, CircularProgress, Grid, CardContent, Typography, CardActions, useTheme } from '@mui/material'

import { useSelector, useDispatch } from 'react-redux';
import { fetchLessons } from '../../../../../../api/db'
import { setLessons, clearLessons, setSectionId, setLessonId } from '../../SectionSlice'
import { useNavigate, useParams } from 'react-router-dom';

const LessonCard = () => {
    const params = useParams();
    const { sectId } = params
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const theme = useTheme()
    const token = useSelector(state => state.auth.accessToken)
    const { lessons, sectionId, sections } = useSelector(state => state.section)
    const allStatus = useSelector(state => state.auth.user_lesson_status)
    const [sectionName, setSectionName] = React.useState("")

    /* const ResetLessonIdRef = useRef(false)
    useEffect(() => {
        if (!ResetLessonIdRef.current) {
            ResetLessonIdRef.current = true
            dispatch(setLessonId(""))
        }
    }) */

    // Fetch lessons from the database
    const fetchLessonMounted = useRef(false)
    useEffect(() => {
        if (!fetchLessonMounted.current) {
            fetchLessonMounted.current = true
            let data = {
                token: token,
                sectionId: sectId
            }
            let selectedSectionLessonStatus = allStatus[sectId]
            let combinedArray = []
            let secName = sections.filter(section => section.sectionId === sectId)[0].title
            setSectionName(secName)
            try {
                if (lessons[0].sectionId === sectId) {
                    console.log("same section fetch")
                    return
                } else {
                    console.log("different section fetch")
                    dispatch(clearLessons())
                    fetchLessons(data)
                        .then(res => {
                            let lessons = res.data.lessons
                            combinedArray = lessons.map((lesson, index) => {
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
                            // dispatch(clearLessons())
                            dispatch(setLessons(combinedArray))
                            // dispatch(setSectionId(sectionIdMain))
                        })
                }
            } catch (error) {
                console.error(error);
            }

        }
    }, [lessons, dispatch, token, allStatus, sectionId, sectId, sections])

    const goBackToSections = () => {
        dispatch(setSectionId(""))
        let sectionsUrl = '/dashboard/sections'
        navigate(sectionsUrl)
    }

    const openSlide = (lessonId) => {
        dispatch(setLessonId(lessonId))
        let lessonUrl = `/dashboard/sections/${sectionId}/${lessonId}`;
        navigate(lessonUrl)
    }

    //animation delay for lesson title
    useEffect(() => {
        const textElement = document.querySelectorAll('.lesson-title-box span')
        textElement.forEach((element) => {
            const delay = Math.random() * 5;
            element.classList.add('animate-text')
            element.style.animationDelay = `${delay}s`
        })
    })

    const LessonsBox = (props) => {
        const { title, lessonId, completed } = props
        return (
            <Box className='lessons-container-box ' sx={{ backgroundColor: `${theme.palette.primary.light}`, borderRadius: '10px' }}>
                <CardContent className='text lesson-title-box' sx={{ width: 'fill-available' }}>
                    <Typography variant="h5" className='rolling' component='span' sx={{ color: 'white', width: 'fill-available', cursor: 'pointer' }}>
                        {title}
                    </Typography>
                    <Typography variant="h5" sx={{ color: 'white', width: 'fill-available', cursor: 'pointer' }}>
                        {completed ? 'Completed' : 'Not Completed'}
                    </Typography>
                </CardContent>
                <CardActions sx={{ width: 'fill-available', justifyContent: 'center' }}>
                    <IconButton
                        onClick={(e) => openSlide(lessonId)}
                        variant="outlined"
                        size='small'
                        style={{ color: 'white', backgroundColor: 'red', margin: '5px' }}
                        sx={{
                            ':hover': {
                                color: 'black !important',
                                backgroundColor: 'white !important'
                            }
                        }}>
                        <KeyboardDoubleArrowRightOutlinedIcon className='lesson-card-icon' />
                    </IconButton>
                </CardActions>
            </Box>
        )
    }

    return (
        <React.Fragment>
            <Box className='introduction-top'>
                <Header title={sectionName} />{/* add fetched lesson name */}
                <Box display='flex' justifyContent='flex-end'>
                    <Button
                        onClick={goBackToSections}
                        variant="text"
                        style={{ color: `#000000`, backgroundColor: 'red', margin: '5px', marginRight: '20px', height: '30px', width: '80px' }}
                        sx={{
                            ':hover': {
                                color: `black !important`,
                                backgroundColor: 'white !important',
                            },
                        }}>Go Back</Button>
                </Box>
            </Box>
            <Box>
                {lessons.length === 0 ?
                    <Grid container justifyContent='center'>
                        <Grid item xs={11} sm={11} md={11} lg={11} justifyContent='center'>
                            <Box sx={{ display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
                                <CircularProgress size='30px' sx={{ color: 'red' }} />
                            </Box>
                        </Grid>
                    </Grid>
                    :
                    <Grid container justifyContent='center'>
                        {lessons && lessons.map((lesson, index) => {
                            return (
                                <Grid item xs={11} sm={4} md={3} lg={2} key={index}>
                                    <LessonsBox title={lesson.chapter_title} lessonId={lesson.lessonId} completed={lesson.lesson_status.lesson_completed
                                    } />
                                </Grid>
                            )
                        })}
                    </Grid>
                }
            </Box>
            <Box className='goback-bottom'>
                <Box display='flex' justifyContent='flex-end'>
                    <Button
                        onClick={goBackToSections}
                        variant="text"
                        style={{ color: `#000000`, backgroundColor: 'red', margin: '5px', marginRight: '20px', height: '30px', width: '80px' }}
                        sx={{
                            ':hover': {
                                color: `black !important`,
                                backgroundColor: 'white !important',
                            },
                        }}>Go Back</Button>
                </Box>
            </Box>
        </React.Fragment>
    )
}

export default LessonCard