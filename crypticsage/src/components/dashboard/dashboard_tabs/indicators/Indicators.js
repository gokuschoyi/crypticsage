import React from 'react'
import { Box } from '@mui/material'
import { useOutletContext } from "react-router-dom";
import Header from '../../global/Header'
const Indicators = () => {
    const [setTest] = useOutletContext();
    const hide = () => {
        setTest(true);
    }
    return (
        <Box className='indicators-container' onClick={hide}>
            <Box height='100%' width='-webkit-fill-available'>
                <Header title="Indicators" />
            </Box>
        </Box>
    )
}

export default Indicators