import React from 'react'
import Header from '../../global/Header';
import { Box, Typography, Button, useTheme, Grid } from '@mui/material';
import './Glossary.css'

const Glossary = (props) => {
    const theme = useTheme();
    const { title, subtitle } = props
    return (
        <Box className='glossary-container'>
            <Header title={title} subtitle={subtitle} />
        </Box>
    )
}

export default Glossary