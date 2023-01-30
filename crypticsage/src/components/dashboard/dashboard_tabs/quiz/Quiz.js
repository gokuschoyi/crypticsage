import React from 'react'
import Header from '../../global/Header';
import { Box, Typography, Button, useTheme, Grid } from '@mui/material';
import './Quiz.css'

const Quiz = (props) => {
    const theme = useTheme();
    const { title, subtitle } = props
    return (
        <Box className='quiz-container'>
            <Header title={title} subtitle={subtitle} />
        </Box>
    )
}

export default Quiz