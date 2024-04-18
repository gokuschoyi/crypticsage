import React from 'react'
import { Outlet } from 'react-router-dom';
import './Indicators.css'
import {
    Box,
} from '@mui/material'
const Indicators = () => {
    return (
        <Box className='indicators-container'>
            <Outlet />
        </Box>
    )
}

export default Indicators