import React from 'react'
import Header from '../../global/Header';
import { Box, Typography, Button, useTheme, Grid } from '@mui/material';
import './Lessons.css'

const Lessons = (props) => {
    const theme = useTheme();
    const { title, subtitle } = props
    return (
        <Box className='lessons-container'>
            <Header title={title} subtitle={subtitle} />
        </Box>
    )
}

export default Lessons