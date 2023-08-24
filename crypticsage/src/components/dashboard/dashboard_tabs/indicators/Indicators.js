import React, { useEffect, useState, useRef } from 'react'
import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux'
import './Indicators.css'
import MainChart from './components/MainChart'
import {
    Box,
    Grid,
    Skeleton
} from '@mui/material'
import { useOutletContext } from "react-router-dom";
import { getHistoricalData } from '../../../../api/crypto'
const Indicators = () => {
    const token = useSelector(state => state.auth.accessToken);
    const [setTest] = useOutletContext();
    const hide = () => {
        setTest(true);
    }

    const [data, setData] = useState([])

    const loadedRefFOrDataFetch = useRef(false)
    useEffect(() => {
        if (!loadedRefFOrDataFetch.current) {
            loadedRefFOrDataFetch.current = true
            if (data.length === 0) {
                let data = {
                    token: token,
                    tokenName: 'BTC',
                    timePeriod: '2',
                    timeFrame: 'hour'
                }
                getHistoricalData(data)
                    .then((res) => {
                        setData(res.data.historicalData.Data.Data)
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            }
        }
    })

    return (
        <Box className='indicators-container' onClick={hide}>
            {/* <Grid container spacing={2} pt={4}>
                <Grid item xs={12} sm={12} md={12} lg={12} xl={12} className='indicator-chart-grid-box'>
                    <Box className='chart-container' display='flex' flexDirection='column' height='100%' m={4}>
                        {data.length === 0 ?
                            (
                                <Box className='token-chart-box' height="100%" alignItems='center' justifyContent='center' display='flex'>
                                    <Skeleton variant="rounded" sx={{ bgcolor: '#3f3f40' }} width="80%" height="80%" />
                                </Box>
                            )
                            :
                            (
                                <Box className='token-chart-box' height="100%">
                                    <MainChart tData={data} />
                                </Box>
                            )
                        }
                    </Box>
                </Grid>
            </Grid> */}
            <Outlet />
        </Box >
    )
}

export default Indicators