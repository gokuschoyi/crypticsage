import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom';
import Header from '../../../global/Header';
import IndicatorDescription from '../components/IndicatorDescription';
import { getHistoricalTickerDataFroDb, fetchLatestTickerForUser } from '../../../../../api/adminController'
import MainChart from '../components/MainChartCopy';
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

const periodToMilliseconds = (period) => {
    switch (period) {
        case '1m':
            return 1000 * 60;
        case '4h':
            return 1000 * 60 * 60 * 4;
        case '6h':
            return 1000 * 60 * 60 * 6;
        case '8h':
            return 1000 * 60 * 60 * 8;
        case '12h':
            return 1000 * 60 * 60 * 12;
        case '1d':
            return 1000 * 60 * 60 * 24;
        case '3d':
            return 1000 * 60 * 60 * 24 * 3;
        case '1w':
            return 1000 * 60 * 60 * 24 * 7;
        default:
            return 1000 * 60 * 60 * 24;
    }
}

const checkForUniqueAndTransform = (data) => {
    const uniqueData = [];
    const seenTimes = new Set();

    data.forEach((item) => {
        if (!seenTimes.has(item.openTime)) {
            uniqueData.push({
                time: (item.openTime / 1000),
                open: parseFloat(item.open),
                high: parseFloat(item.high),
                low: parseFloat(item.low),
                close: parseFloat(item.close)
            })
            seenTimes.add(item.openTime);
        } else {
            console.log('Duplicate found', item.openTime)
        }
    })
    return uniqueData
}

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
        setChartData([])
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

    const checkIfNewTickerFetchIsRequired = (openTime) => {
        const periodInMilli = periodToMilliseconds(selectedTokenPeriod)
        const currentTime = new Date().getTime()

        const noOfTickersToFetch = Math.floor((currentTime - openTime) / periodInMilli)
        // console.log('No to fetch : ', noOfTickersToFetch)
        // console.log('Latest ticker data time : ', periodInMilli, currentTime - openTime)
        return noOfTickersToFetch
    }

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
                    const dataInDb = res.data.fetchedResults.ticker_data

                    const latestOpenTime = dataInDb[dataInDb.length - 1].openTime
                    let fetchLength = checkIfNewTickerFetchIsRequired(latestOpenTime)
                    if (fetchLength > 0) {
                        let end = new Date()
                        end.setMinutes(end.getMinutes() - 1)
                        end.setSeconds(59)
                        
                        const updateQueries = {
                            ticker_name: cryptotoken,
                            period: selectedTokenPeriod,
                            start: latestOpenTime,
                            end: end.getTime(),
                        }

                        fetchLatestTickerForUser({
                            token,
                            updateQueries
                        })
                            .then((res) => {
                                const newData = res.data.newTickers
                                dataInDb.push(...newData)
                                let converted = checkForUniqueAndTransform(dataInDb)
                                console.log('Totla fetched data length : ', converted.length, 'New tickers to fetch', fetchLength, 'Fetched : ', newData.length)
                                setChartData(converted)
                            })
                            .catch(err => {
                                console.log(err)
                            })
                    } else {
                        let converted = checkForUniqueAndTransform(dataInDb)
                        console.log('Fetched data length : ', converted.length)
                        setChartData(converted)
                    }
                })
                .catch(err => {
                    console.log(err)
                })
        }
    })


    /* const wsRef = useRef(false)
    useEffect(() => {
        if (selectedTokenPeriod === '1m') {
            console.log('Connecting to binance WS')
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
                let tickerPayload = {
                    openTime: message.k.t,
                    open: message.k.o,
                    high: message.k.h,
                    low: message.k.l,
                    close: message.k.c,
                    volume: message.k.v,
                    closeTime: message.k.T,
                    quoteAssetVolume: message.k.q,
                    trade: message.k.n,
                    takerBaseAssetVolume: message.k.V,
                    takerQuoteAssetVolume: message.k.Q,
                }
                // console.log(tickerPayload);
                const latetstTickerOpenTime = chartData[chartData.length - 1].time * 1000
                if (tickerPayload.openTime > latetstTickerOpenTime) {
                    console.log('New ticker available', new Date(latetstTickerOpenTime).toLocaleString(), new Date(tickerPayload.openTime).toLocaleString())
                    
                } else {
                    console.log('No new ticker')
                }
            };

            ws.onerror = (e) => {
                console.log(e);
            };
        }

        return () => {
            if (wsRef.current) {
                wsRef.current.close(); // Close the WebSocket connection on unmount
            }
        };

    }, [chartData, cryptotoken, selectedTokenPeriod]) */

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
                                    <MainChart token={token} tData={chartData} symbol={cryptotoken} selectedTokenPeriod={selectedTokenPeriod} />
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