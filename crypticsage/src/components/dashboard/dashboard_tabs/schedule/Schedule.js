import React from 'react'
import Header from '../../global/Header';
import { Box, Typography, Button, useTheme, Grid } from '@mui/material';
import './Schedule.css'

const Schedule = (props) => {
    const theme = useTheme();
    const { title, subtitle } = props
    return (
        <Box className='schedule-container'>
            <Header title={title} subtitle={subtitle} />
        </Box>
    )
}

export default Schedule