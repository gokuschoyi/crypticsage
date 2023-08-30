import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom';
import Header from '../../../global/Header';
import IndicatorDescription from '../components/IndicatorDescription';
import { getHistoricalTickerDataFroDb } from '../../../../../api/adminController'
import MainChart from '../components/MainChart';
import { useSelector } from 'react-redux'
import {
    Box
    , Typography
    , Autocomplete
    , TextField
    , Grid
    , Skeleton
    ,
} from '@mui/material'
const CryptoModule = () => {
    const params = useParams();
    const token = useSelector(state => state.auth.accessToken);
    const { cryptotoken } = params;
    const module = window.location.href.split("/dashboard/indicators/")[1].split("/")[0]
    // console.log(module)

    const periods = [
        '1m',
        '4h',
        '6h',
        '8h',
        '12h',
        "1d",
        '3d',
        '1w',
    ]

    const [selectedTokenPeriod, setSelectedTokenPeriod] = useState('4h');
    console.log(selectedTokenPeriod)

    const handlePeriodChange = (newValue) => {
        setSelectedTokenPeriod(newValue);
        setFetchValues({
            asset_type: module,
            ticker_name: cryptotoken,
            period: newValue,
            page_no: 1,
            items_per_page: 500
        })
        tickerDataRef.current = false
    }

    // to fetch ticker data
    const [ticker_name] = useState(cryptotoken) // remains constant throughout the page
    let defaultFetchValues = {
        asset_type: module,
        ticker_name: ticker_name,
        period: selectedTokenPeriod,
        page_no: 1,
        items_per_page: 500
    }

    // default fetch data
    const [chartData, setChartData] = useState([]) // data to be passed to chart
    const [fetchValues, setFetchValues] = useState(defaultFetchValues)

    // to fetch ticker data
    const tickerDataRef = useRef(false)
    useEffect(() => {
        if (!tickerDataRef.current) {
            tickerDataRef.current = true
            getHistoricalTickerDataFroDb({
                token,
                payload: {
                    asset_type: fetchValues.asset_type,
                    ticker_name: fetchValues.ticker_name,
                    period: fetchValues.period,
                    page_no: fetchValues.page_no,
                    items_per_page: fetchValues.items_per_page
                }
            })
                .then((res) => {
                    const uniqueData = [];
                    const seenTimes = new Set();

                    res.data.fetchedResults.ticker_data.forEach((item) => {
                        if (!seenTimes.has(item.openTime)) {
                            uniqueData.push({
                                time: (item.openTime / 1000),
                                open: parseFloat(item.open),
                                high: parseFloat(item.high),
                                low: parseFloat(item.low),
                                close: parseFloat(item.close)
                            })
                            seenTimes.add(item.openTime);
                        }
                    })
                    console.log('Fetched data length : ', uniqueData.length)
                    setChartData(uniqueData)
                })
                .catch(err => {
                    console.log(err)
                })
        }
    })


    /* const wsRef = useRef(false)
    useEffect(() => {
        const lowerCaseSymbol = cryptotoken.toLowerCase()
        const webSocketConnectionURI = `wss://stream.binance.com:9443/ws/${lowerCaseSymbol}@kline_${selectedTokenPeriod}`
        console.log("WS connection uri: ", webSocketConnectionURI)

        if (wsRef.current) {
            wsRef.current.close(); // Close the existing WebSocket connection
        }

        const ws = new WebSocket(webSocketConnectionURI)
        wsRef.current = ws; // Store the WebSocket reference in the ref

        ws.onmessage = (e) => {
            const message = JSON.parse(e.data);
            console.log(message);
        };

        ws.onerror = (e) => {
            console.log(e);
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close(); // Close the WebSocket connection on unmount
            }
        };
    }, [cryptotoken, selectedTokenPeriod]) */

    return (
        <Box className='crypto-module-container'>
            <Box height='100%' width='-webkit-fill-available'>
                <Header title='Details' />
            </Box>

            <Box pl={4} display='flex' flexDirection='row' alignItems='center' gap='10px'>
                <Typography variant='h3' textAlign='start' pt={1} pb={1}>{cryptotoken}</Typography>
                <Box className='autocomplete-select-box' width='200px'>
                    <Autocomplete
                        size='small'
                        disableClearable
                        disablePortal={false}
                        id="selec-stock-select"
                        options={periods}
                        value={selectedTokenPeriod} // Set the selected value
                        onChange={(event, newValue) => handlePeriodChange(newValue)} // Handle value change
                        sx={{ width: 'auto' }}
                        renderInput={(params) => <TextField {...params}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: 'white',
                                    }
                                }
                            }}
                            label="Select a period"
                            color="secondary"
                        />}
                    />
                </Box>
            </Box>

            <Grid container spacing={2} pt={4}>
                <Grid item xs={12} sm={12} md={12} lg={12} xl={12} className='indicator-chart-grid-box'>
                    <Box className='chart-container' display='flex' flexDirection='column' height='100%' m={4}>
                        {chartData.length === 0 ?
                            (
                                <Box className='token-chart-box' height="100%" alignItems='center' justifyContent='center' display='flex'>
                                    <Skeleton variant="rounded" sx={{ bgcolor: '#3f3f40' }} width="80%" height="80%" />
                                </Box>
                            )
                            :
                            (
                                <Box className='token-chart-box' height="100%">
                                    <MainChart tData={chartData} symbol={cryptotoken} />
                                </Box>
                            )
                        }
                    </Box>
                </Grid>
            </Grid>

            <IndicatorDescription symbol={cryptotoken} />
        </Box>
    )
}

export default CryptoModule