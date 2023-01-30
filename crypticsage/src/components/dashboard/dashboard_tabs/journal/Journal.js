import React from 'react'
import Header from '../../global/Header';
import { Box, Typography, Button, useTheme, Grid } from '@mui/material';
import './Journal.css'

const Journal = (props) => {
    const theme = useTheme();
    const { title, subtitle } = props
    return (
        <Box className='journal-container'>
            <Header title={title} subtitle={subtitle} />
        </Box>
    )
}

export default Journal