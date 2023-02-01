import React from 'react'
import Header from '../../global/Header';
import { Box, Typography, Button, useTheme, Grid, CardMedia } from '@mui/material';
import './Lessons.css'
import LESSONS_DATA from './LessonsData';

const Lessons = (props) => {
    const theme = useTheme();
    const { title, subtitle } = props

    const CustomCard = (props) => {
        const { title, content } = props
        return (
            <Box className="lesson-card">
                <Grid container sx={{ paddingTop: '0px' }} spacing={2} justifyContent='center' alignContent='center'>
                    <Grid item xs={12} sm={12} md={10} lg={8}>
                        <Box className='text-holder'>
                            <Typography className='lesson-title' variant="h3" fontWeight={400} color="secondary.main">
                                {title}
                            </Typography>
                            <Typography textAlign="justify" variant="h6" fontWeight={300} color="white"  >
                                {content}
                            </Typography>
                        </Box>
                        <Box className='lesson-button-container'>
                            <Button variant="text" style={{ color: `#000000`, backgroundColor: 'red', margin: '5px' }} sx={{
                                ':hover': {
                                    color: `black !important`,
                                    backgroundColor: 'white !important',
                                },
                            }}>Go to Lesson</Button>
                        </Box>
                    </Grid>

                    <Grid className='lesson-image-container' item xs={12} sm={12} md={10} lg={4}>
                        <Box className='lesson-image-container'>
                            <CardMedia
                                component="img"
                                sx={{ width: 151 }}
                                image="https://source.unsplash.com/random"
                                alt="Live from space album cover"
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        )
    }

    return (
        <Box className='lessons-container'>
            <Box height='100%' width='-webkit-fill-available'>
                <Header title={title} subtitle={subtitle} />
            </Box>
            <Box className='lessons-cards-container'>
                <Grid className='lessons-grid-container' container spacing={2} justifyContent='center'>
                    {LESSONS_DATA.map((lesson, index) => {
                        return (
                            <Grid className='lessons-grid-card' item xs={12} sm={12} md={10} lg={6} key={index}>
                                <CustomCard title={lesson.title} content={lesson.content} />
                            </Grid>
                        )
                    })}
                </Grid>
            </Box>
        </Box>
    )
}

export default Lessons