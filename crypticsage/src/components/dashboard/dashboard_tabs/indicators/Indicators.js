import React from 'react'
import { Outlet } from 'react-router-dom';
import './Indicators.css'
import {
    Box,
} from '@mui/material'
import { useOutletContext } from "react-router-dom";
const Indicators = () => {
    const [setTest] = useOutletContext();
    const hide = () => {
        setTest(true);
    }

    return (
        <Box className='indicators-container' onClick={hide}>
            <Outlet />
        </Box >
    )
}

export default Indicators