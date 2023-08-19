import React from 'react'
import './Dashboard.css'
import BinanceTickerInfo from '../components/BinanceTickerInfo'
import YFinanceTickerInfo from '../components/YFinanceTickerInfo';

// import { useOutletContext } from "react-router-dom";
import AdminHeader from '../global/AdminHeader'
import { Box, Typography } from '@mui/material'

const Dashboard = (props) => {
    const { title, subtitle } = props;
    // const [setTest] = useOutletContext();
    // onHide causes [Violation] 'click' handler took 151ms errrors, not sure why ?????? when added to admin-dashboard-container onClick=hide
    // Also check other places where hide is used
    /* const hide = () => {
        setTest(true);
    } */

    return (
        <Box className='admin-dashboard-container'>
            <AdminHeader title={title} subtitle={subtitle} />
            <Box className='admin-controller-stats' pl={4} pr={4}>

                <Box display='flex' justifyContent='flex-start' flexDirection='row'>
                    <Typography variant='h3'>Binance Ticker Info</Typography>
                    <Box id="w-socket"></Box>
                </Box>
                <BinanceTickerInfo />

                <Box className='yFinance-stats-box' display='flex' mt={4} mb={2} justifyContent='flex-start' >
                    <Typography variant='h3' >Y-Finance Ticker Info</Typography>
                </Box>
                <YFinanceTickerInfo />
            </Box>
        </Box >
    )
}

export default Dashboard