import React, { useEffect } from 'react'
import Header from '../../../../global/Header'
import './LessonCard.css'
import { KeyboardDoubleArrowRightOutlinedIcon } from '../../../../global/Icons'
import { Box, IconButton, Button, CircularProgress, Grid, CardContent, Typography, CardActions, useTheme } from '@mui/material'
const LessonCard = (props) => {
    const { lessons, lessonId, lessonName, goBackToSections, openSlide } = props
    const theme = useTheme()

    /* useEffect(() => {
        if (md === false) {
            const textElement = document.querySelectorAll('.lesson-title-box span')
            textElement.forEach((element) => {
                element.classList.remove('animate-text')
                element.addEventListener("mouseenter", function () {
                    this.style.animationPlayState = "running";
                });
                element.addEventListener("mouseleave", function () {
                    this.style.animationPlayState = "paused";
                });
            })
        }
    }) */

    useEffect(() => {
        const textElement = document.querySelectorAll('.lesson-title-box span')
        textElement.forEach((element) => {
            const delay = Math.random() * 5;
            element.classList.add('animate-text')
            element.style.animationDelay = `${delay}s`
        })
    })

    const LessonsBox = (props) => {
        const { title, chapter_id } = props
        const values = {
            'lessonName': title,
            'lessonId': chapter_id
        }
        return (
            <Box className='lessons-container-box ' sx={{ backgroundColor: `${theme.palette.primary.dark}` }}>
                <CardContent className='text lesson-title-box' sx={{ width: 'fill-available' }}>
                    <Typography variant="h5" className='rolling' component='span' sx={{ color: `${theme.palette.secondary.main}`, width: 'fill-available', cursor: 'pointer' }}>
                        {title}
                    </Typography>
                    <Typography sx={{ mb: 1.5, color: `${theme.palette.secondary.main}` }}>
                        {chapter_id}
                    </Typography>
                </CardContent>
                <CardActions sx={{ width: 'fill-available', justifyContent: 'center' }}>
                    <IconButton
                        onClick={(e) => openSlide(e)}
                        value={JSON.stringify(values)}
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
                <Header title={lessonName} subtitle={lessonId} />
                <Box>
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
            <Box pl={2} pr={3}>
                {lessons.length === 0
                    ? <CircularProgress />
                    :
                    <Grid container justifyContent='center'>
                        {lessons.map((lesson, index) => {
                            return (
                                <Grid item xs={11} sm={4} md={3} lg={2} key={index}>
                                    <LessonsBox title={lesson.title} chapter_id={lesson.chapter_id} />
                                </Grid>
                            )
                        })}
                    </Grid>
                }
            </Box>
        </React.Fragment>
    )
}

export default LessonCard