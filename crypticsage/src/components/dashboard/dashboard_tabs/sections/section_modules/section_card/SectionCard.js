import React from 'react'
import { Box, Grid, Typography, useTheme, IconButton, CircularProgress, LinearProgress } from '@mui/material'
import Header from '../../../../global/Header'
import './SectionCard.css'
import { KeyboardDoubleArrowRightOutlinedIcon } from '../../../../global/Icons'
const SectionCard = (props) => {
    const { title, subtitle, sections, openLesson } = props
    const theme = useTheme()


    function calculatePercentageCompleted(lessonsArray) {
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

    const CustomCard2 = (props) => {
        const { title, content, sectionId, section_status, index } = props
        const lessonData = {
            'sectionName': title,
            'sectionId': sectionId
        }
        return (
            <Box className="section-card" sx={{ backgroundColor: `${theme.palette.primary.dark}` }}>
                <Box className='text-holder section-grid-card-padding'>
                    <Typography className='section-title' variant="h3" fontWeight={400} color="white">
                        {(index + 1) + " : " + title}
                    </Typography>
                    <Typography textAlign="justify" variant="h6" fontWeight={300} color="white"  >
                        {content}
                    </Typography>
                </Box>
                <Box className='section-grid-card-padding button-progress'>
                    <Box className='section-button-container'>
                        <IconButton aria-label="delete"
                            onClick={(e) => openLesson(e)}
                            value={JSON.stringify(lessonData)}
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
            <Box height='100%' width='-webkit-fill-available'>
                <Header title={title} subtitle={subtitle} />
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