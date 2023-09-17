import React, { useEffect, useRef } from 'react'
import { Box, Grid, Typography, useTheme, IconButton, CircularProgress, LinearProgress } from '@mui/material'
import Header from '../../../../global/Header'
import './SectionCard.css'
import { KeyboardDoubleArrowRightOutlinedIcon } from '../../../../global/Icons'

import { useSelector, useDispatch } from 'react-redux';
import { fetchSections } from '../../../../../../api/db'
import { setSections, setSectionId } from '../../SectionSlice'
import { useNavigate } from 'react-router-dom';

const SectionCard = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const theme = useTheme()
    const token = useSelector(state => state.auth.accessToken)
    const { sections } = useSelector(state => state.section)
    const allStatus = useSelector(state => state.auth.user_lesson_status)

    /* const resetReduxSectinoIdRef = useRef(false)
    useEffect(() => {
        if (!resetReduxSectinoIdRef.current) {
            resetReduxSectinoIdRef.current = true
            dispatch(setSectionId(""))
        }
    }) */

    // Fetch sections from the database
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
                                return {
                                    ...section,
                                    section_status: []
                                }
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

    function calculatePercentageCompleted(lessonsArray) {
        // console.log(lessonsArray)
        if(lessonsArray.length === 0) return 0
        // Initialize counters
        let totalLessons = lessonsArray.length;
        let completedLessons = 0;

        // Iterate over lessonsArray and count completed lessons
        lessonsArray.forEach(lesson => {
            if (lesson.lesson_completed) {
                completedLessons++;
            }
        });

        // Calculate percentage of completed lessons
        const percentageCompleted = (completedLessons / totalLessons) * 100;

        // Return the percentage of completed lessons as an integer
        return Math.round(percentageCompleted);
    }

    const openLesson = (sectionId) => {
        const sectionUrl = `/dashboard/sections/${sectionId}`;
        dispatch(setSectionId(sectionId))
        navigate(sectionUrl);
    };

    const CustomCard2 = (props) => {
        const { title, content, sectionId, section_status, index } = props
        return (
            <Box className="section-card" sx={{ backgroundColor: `${theme.palette.background.paper}` }}>
                <Box className='text-holder section-grid-card-padding'>
                    <Box className='section-title-box'>
                        <Typography className='section-title' variant="h3" fontWeight={400} >
                            {(index + 1) + " : " + title}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography textAlign="justify" variant="h6" fontWeight={300}   >
                            {content}
                        </Typography>
                    </Box>
                </Box>
                <Box className='section-grid-card-padding button-progress'>
                    <Box className='section-button-container'>
                        <IconButton aria-label="delete"
                            onClick={(e) => openLesson(sectionId)}
                            variant="text"
                            style={{ color: `#000000`, backgroundColor: 'red', margin: '5px' }}
                            sx={{
                                ':hover': {
                                    color: `black !important`,
                                    backgroundColor: 'white !important',
                                },
                            }}
                        >
                            <KeyboardDoubleArrowRightOutlinedIcon className='section-card-icon' />
                        </IconButton>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', marginTop: '10px', marginLeft: '5px' }}>
                        <Box sx={{ width: '100%', mr: 1, color: 'red' }}>
                            <LinearProgress color='primary' variant="determinate" value={calculatePercentageCompleted(section_status)} />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2" color="text.secondary">{calculatePercentageCompleted(section_status)} %</Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
        )
    }

    return (
        <React.Fragment>
            <Box width='-webkit-fill-available'>
                <Header title='Sections' subtitle='Explore various lessons' />
            </Box>
            <Box className='section-cards-container'>
                {sections.length === 0
                    ?
                    <Grid container justifyContent='center'>
                        <Grid item xs={11} sm={11} md={11} lg={11} justifyContent='center'>
                            <Box sx={{ display: 'flex', justifyContent: 'center', overflow: 'hidden' }}>
                                <CircularProgress size='30px' sx={{ color: 'red' }} />
                            </Box>
                        </Grid>
                    </Grid>
                    :
                    <Grid container className='section-grid-container' justifyContent='start'>
                        {sections && sections.map(({ title, sectionId, content, section_status }, index) => {
                            return (
                                <Grid item xs={11} sm={11} md={6} lg={4} xl={4} className='section-grid-card' key={index}>
                                    {CustomCard2({ title, content, sectionId, section_status, index })}
                                </Grid>
                            )
                        })}
                    </Grid>
                }
            </Box>
        </React.Fragment>
    )
}

export default SectionCard