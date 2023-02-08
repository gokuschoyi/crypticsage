import React from 'react'
import { Box, Grid, Typography, useTheme, IconButton, CircularProgress, LinearProgress } from '@mui/material'
import Header from '../../../../global/Header'
import './SectionCard.css'
import {KeyboardDoubleArrowRightOutlinedIcon} from '../../../../global/Icons'
const SectionCard = (props) => {
    const { title, subtitle, sections, openLesson } = props
    const theme = useTheme()

    const CustomCard2 = (props) => {
        const { title, content, lessonId } = props
        const lessonData = {
            'sectionName': title,
            'sectionId': lessonId
        }
        return (
            <Box className="section-card" sx={{ backgroundColor: `${theme.palette.primary.dark}` }}>
                <Box className='text-holder section-grid-card-padding'>
                    <Typography className='section-title' variant="h3" fontWeight={400} color="secondary.main">
                        {title}
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
                        <Box sx={{ width: '100%', mr: 1, color: 'white' }}>
                            <LinearProgress color='secondary' variant="determinate" value={21} />
                        </Box>
                        <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2" color="text.secondary">{`${20}%`}</Typography>
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
                    ? <CircularProgress />
                    :
                    <Grid container className='section-grid-container' justifyContent='start'>
                        {sections.map(({ title, lessonId, content }, index) => {
                            return (
                                <Grid item xs={11} sm={11} md={6} lg={4} xl={3} className='section-grid-card' key={index}>
                                    {CustomCard2({ title, content, lessonId })}
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