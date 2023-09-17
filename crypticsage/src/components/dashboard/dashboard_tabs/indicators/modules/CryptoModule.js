import React, { useState, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import Header from '../../../global/Header';
import { Indicators } from '../components/IndicatorDescription';
import { getHistoricalTickerDataFroDb, fetchLatestTickerForUser } from '../../../../../api/adminController'
import { setCryptoDataInDbRedux, resetStreamedTickerDataRedux } from './CryptoStockModuleSlice'
import MainChart from '../components/MainChartCopy';
import SelectedFunctionContainer from '../components/SelectedFunctionContainer';
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
                close: parseFloat(item.close),
                volume: parseFloat(item.volume),
            })
            seenTimes.add(item.openTime);
        } else {
            console.log('Duplicate found', item.openTime)
        }
    })
    return uniqueData
}

const checkIfNewTickerFetchIsRequired = ({ openTime, selectedTokenPeriod }) => {
    const periodInMilli = periodToMilliseconds(selectedTokenPeriod)
    const currentTime = new Date().getTime()

    let fetchLength = Math.floor((currentTime - openTime) / periodInMilli)

    let end
    switch (selectedTokenPeriod) {
        case '1m':
            end = new Date()
            end.setMinutes(end.getMinutes() - 1)
            end.setSeconds(59)
            break;
        default:
            let endAdded = new Date(openTime).getTime() + (fetchLength * periodInMilli) - 1000
            end = new Date(endAdded)
            break;
    }

    // console.log(new Date(openTime).toLocaleString(), new Date(end).toLocaleString())
    let finalDate = end.getTime()
    fetchLength = fetchLength - 1 // to avoid fetching the last ticker
    return [fetchLength, finalDate]
}

const CryptoModule = () => {
    const params = useParams();
    const token = useSelector(state => state.auth.accessToken);
    const { cryptotoken } = params;
    const module = window.location.href.split("/dashboard/indicators/")[1].split("/")[0]

    const dispatch = useDispatch();

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
    // console.log(selectedTokenPeriod)

    const handlePeriodChange = (newValue) => {
        // dispatch(setCryptoDataInDbRedux([]))
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
    const [newTickerLength, setNewTickerLength] = useState(0)

    // to fetch ticker data
    const tickerDataRef = useRef(false)
    useEffect(() => {

        if (!tickerDataRef.current) {
            // console.log('UE : Fetching ticker data from DB')
            tickerDataRef.current = true
            let converted = []
            dispatch(setCryptoDataInDbRedux([]))
            dispatch(resetStreamedTickerDataRedux())
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
                    let [fetchLength, end] = checkIfNewTickerFetchIsRequired({ openTime: latestOpenTime, selectedTokenPeriod })
                    setNewTickerLength(fetchLength)
                    if (fetchLength > 0) {
                        // console.log('UE : Fetching new tickers from binance')


                        const updateQueries = {
                            ticker_name: cryptotoken,
                            period: selectedTokenPeriod,
                            start: latestOpenTime,
                            end: end,
                        }

                        fetchLatestTickerForUser({
                            token,
                            updateQueries
                        })
                            .then((res) => {
                                const newData = res.data.newTickers
                                dataInDb.push(...newData)
                                converted = checkForUniqueAndTransform(dataInDb)
                                console.log('Total fetched data length : ', converted.length, 'New tickers to fetch', fetchLength, 'Fetched : ', newData.length)
                                setChartData(converted)
                                dispatch(setCryptoDataInDbRedux(dataInDb))
                            })
                            .catch(err => {
                                console.log(err)
                            })
                    } else {
                        converted = checkForUniqueAndTransform(dataInDb)
                        console.log('Up to date : Fetched data length : ', converted.length)
                        setChartData(converted)
                        dispatch(setCryptoDataInDbRedux(dataInDb))
                    }
                })
                .catch(err => {
                    console.log(err)
                })
        }
    })

    const selectedFunctions = useSelector(state => state.cryptoStockModule.selectedFunctions)
    const histDataLength = useSelector(state => state.cryptoStockModule.cryptoDataInDb).length

    return (
        <Box className='crypto-module-container'>
            <Box width='-webkit-fill-available'>
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

            <Grid container spacing={2} mt={4} className='indicator-chart-grid-box'>
                <Grid item xs={12} sm={12} md={12} lg={12} xl={12} >
                    <Box display='flex' flexDirection='column' height='100%'>
                        <Box className='selected-function-value-displaybox' display='flex' flexDirection='column' alignItems='start' pl={4} pr={4}></Box>
                        <Box className='chart-container' display='flex' flexDirection='column' height='100%' m={4}>
                            {chartData.length === 0 ?
                                (
                                    <Box className='token-chart-box' minHeight="100%" alignItems='center' justifyContent='center' display='flex'>
                                        <Skeleton variant="rounded" sx={{ bgcolor: '#3f3f40' }} width="80%" height="80%" />
                                    </Box>
                                )
                                :
                                (
                                    <Box className='token-chart-box' minHeight="100%">
                                        <MainChart
                                            latestTime={chartData[chartData.length - 1].time * 1000 + 60000}
                                            new_fetch_offset={newTickerLength}
                                            symbol={cryptotoken}
                                            selectedTokenPeriod={selectedTokenPeriod}
                                            module={module}
                                            fetchValues={fetchValues}
                                        />
                                    </Box>
                                )
                            }
                        </Box>
                    </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                    <Box ml={4} mr={4} mb={2} mt={2}>
                        <Box pl={1}>
                            <Typography variant='h4' sx={{ textAlign: 'start', color: 'white' }}>Selected Indicators</Typography>
                        </Box>
                        {selectedFunctions.length === 0 ?
                            (
                                <Box display='flex' flexDirection='row' justifyContent='flex-start'>
                                    <Typography variant='h6' sx={{ textAlign: 'start', color: 'white' }}>Select an indicator to view</Typography>
                                </Box>
                            )
                            :
                            (
                                <Grid container spacing={2} className='indicator-data-container'>
                                    {selectedFunctions && selectedFunctions.map((funcRedux, index) => {
                                        const { name } = funcRedux
                                        return (
                                            <Grid key={`${name}${index}`} item xs={12} sm={12} md={6} lg={4} xl={4}>
                                                <SelectedFunctionContainer key={index} funcRedux={funcRedux} histDataLength={histDataLength} fetchValues={fetchValues} />
                                            </Grid>
                                        )
                                    })}
                                </Grid>
                            )
                        }

                    </Box>

                </Grid>
            </Grid>

            <Indicators symbol={cryptotoken} fetchValues={fetchValues} />
        </Box>
    )
}

export default CryptoModule