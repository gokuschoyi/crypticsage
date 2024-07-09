import React, { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Success, Info } from '../../dashboard/global/CustomToasts'
// import YfChart from './YfinanceChart'
import {
    Box,
    Skeleton,
    Typography,
    Grid,
    TextField,
    Button,
    Tooltip,
    IconButton,
    Collapse,
    Fade,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material'

import {
    getYfinanceHistoricalStatFromDb,
    checkForYFTicker,
    updateAllYFinanceTickers,
    fetchOneYfinanceTicker,
    deleteOneYfinanceTicker
} from '../../../api/adminController'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

function formatDateDifferenceToNow(targetDate) {
    const now = new Date().getTime();
    const difference = Math.abs(now - targetDate);

    const oneMinuteInMilliseconds = 60 * 1000;
    const oneHourInMilliseconds = 60 * oneMinuteInMilliseconds;
    const oneDayInMilliseconds = 24 * oneHourInMilliseconds;

    const elapsedDays = Math.floor(difference / oneDayInMilliseconds);
    const remainingMilliseconds = difference % oneDayInMilliseconds;
    const elapsedHours = Math.floor(remainingMilliseconds / oneHourInMilliseconds);
    const remainingMillisecondsAfterHours = remainingMilliseconds % oneHourInMilliseconds;
    const elapsedMinutes = Math.floor(remainingMillisecondsAfterHours / oneMinuteInMilliseconds);

    return [elapsedDays, elapsedHours, elapsedMinutes]
}

function generateElapsedDate(day, hr, m) {
    const parts = []
    if (day > 0) {
        parts.push(`${day}d`)
    }
    if (hr > 0) {
        parts.push(`${hr}h`)
    }
    if (m > 0) {
        parts.push(`${m}m`)
    }
    if (m === 0) {
        parts.push(`0m`)
    }
    return parts.join(':')
}

const PeriodData = ({ period, periodData }) => {
    const { historical, firstHistorical, lastHistorical } = periodData;
    return (
        <Box className='period-info' pl={1} pr={1} mt='5px' mb='5px' display='flex' flexDirection='column' sx={{ backgroundColor: '#262727', borderRadius: '5px' }}>
            <Box display='flex' flexDirection='row' justifyContent='space-between' >
                <Typography variant='h5' fontWeight='400'>Period : {period}</Typography>
            </Box>
            <Box display='flex' flexDirection='column' alignItems='flex-start'>
                <Typography variant='h6' fontWeight='400'>Ticker Count : {historical}</Typography>
                <Typography variant='h6' fontWeight='400'>Latest : {new Date(lastHistorical).toLocaleString()}</Typography>
                <Typography variant='h6' fontWeight='400'>Oldest : {new Date(firstHistorical).toLocaleString()}</Typography>
            </Box>
        </Box>
    )
}

const TickerWithYFHistoricalData = ({ ticker, updateOneYFTicker, handleDeleteOneYfinanceTicker }) => {
    const { ticker_name, data } = ticker;
    const periodsInData = Object.keys(data);
    const latestTickerDate = data[periodsInData[0]].lastHistorical;
    const [d, h, m] = formatDateDifferenceToNow(latestTickerDate);
    let daysSinceUpdate = generateElapsedDate(d, h, m);
    return (
        <Box className='yfinance-ticker-in-db-box' display='flex' flexDirection='column' alignItems='start' p={1} sx={{ backgroundColor: "#171818", borderRadius: '5px' }}>
            <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' width='100%'>
                <Box display='flex' flexDirection='column' alignItems='flex-start'>
                    <Typography variant='h5' fontWeight='400'>Ticker : {ticker_name}</Typography>
                    <Typography variant='h6' fontWeight='400'>Last updated : {daysSinceUpdate} ago</Typography>
                </Box>
                <Box display='flex' flexDirection='row' justifyContent='center' alignItems='center'>
                    <Tooltip
                        arrow
                        placement='left'
                        title={
                            (
                                <Box
                                    display='flex' flexDirection='row' gap='5px'
                                >
                                    <Button color='error' variant='contained' size='small' onClick={handleDeleteOneYfinanceTicker.bind(null, { symbol: ticker_name })}>Yes</Button>
                                    <Button color='warning' variant='contained' size='small' onClick={() => console.log('No')}>No</Button>
                                </Box>
                            )
                        }
                    >
                        <DeleteOutlineIcon className='small-icon' p={'5px'} sx={{ cursor: 'pointer' }} />
                    </Tooltip>

                    <Tooltip
                        arrow
                        placement='bottom'
                        title={
                            (
                                <Box
                                    display='flex' flexDirection='row' gap='5px'
                                >
                                    <Button color='primary' variant='contained' size='small' onClick={((e) => updateOneYFTicker(ticker_name))}>Yes</Button>
                                    <Button color='primary' variant='contained' size='small' onClick={() => console.log('No')}>No</Button>
                                </Box>
                            )
                        }
                    >
                        <IconButton size='small' aria-label="update" color="secondary">
                            <DownloadIcon className='small-icon' />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            <Box className='hist-data' pt={1} width='100%'>
                {periodsInData.map((period, index) => {
                    return (
                        <PeriodData key={index} period={period} periodData={data[period]} />
                    )
                })}
            </Box>
        </Box>
    )
}

const YFinanceTickerInfo = () => {
    const token = useSelector(state => state.auth.accessToken);
    const [yFinaceData, setYFinaceData] = useState('') // to store the yfinance data from db : yfinace_new
    const [stockName, setStockName] = useState('') // input symbol names to search
    const [stockNameInputError, setStockNameInputError] = useState(''); // input field error message

    const [isYfData, setIsYfData] = useState(true) // to show and hide the searched yf symbol/symbols

    const [searchStockDataResult, setSearchStockDataResult] = useState([]); // to store the searched yf symbol/symbols
    const [yfTickerUpdated, setYfTickerUpdated] = useState(false) // flag to fetch yf data from db

    const [updateSearchStockDataResult, setUpdateSearchStockDataResult] = useState([])

    const isInitialMount = useRef(false);
    useEffect(() => {
        if (!isInitialMount.current) {
            console.log("Initial fetch of yfinance data")
            isInitialMount.current = true;
            getYfinanceHistoricalStatFromDb({ token })
                .then(res => {
                    setYFinaceData(res.data)
                })
        }
    })

    // handles the update of one yf ticker
    const updateOneYFTicker = async (symbol) => {
        console.log("Updating one yf ticker", symbol)
        updateAllYFinanceTickers({ token, symbol })
            .then(res => {
                const updatedLength = res.data.diffArray.length
                let message
                if (updatedLength === 0) {
                    message = `No new data to update for ${symbol}.`
                } else {
                    setYfTickerUpdated(true)
                    message = `Updated ${updatedLength} tickers. Updated ${updatedLength} tickers`
                }
                Success(message)
            })
            .catch(err => {
                console.log(err)
                Error(err.message)
            })
    }

    // fetches the yf ticker data from db after a symbol is updated
    useEffect(() => {
        if (yfTickerUpdated) {
            console.log("UE on Update")
            getYfinanceHistoricalStatFromDb({ token })
                .then(res => {
                    setYFinaceData(res.data)
                    setYfTickerUpdated(false)
                })
        }
    }, [yfTickerUpdated, token])

    const handleCheckForStockData = async () => {
        const parts = stockName.split(',');
        const trimmedParts = parts.map(part => part.trim()).filter(part => part !== '');
        const capitalized = trimmedParts.map(part => part.toUpperCase());
        if (capitalized.length === 0) {
            setStockNameInputError('Empty parameter')
            return
        } else {
            setStockNameInputError('')
        }

        const checkedYfTickersInfo = await checkForYFTicker({ token, symbols: capitalized });

        setSearchStockDataResult(checkedYfTickersInfo.data.result)
    }

    useEffect(() => {
        if (searchStockDataResult.length !== 0) {
            console.log("UE on New fetch/Update")
            // Create a mapping of ticker_name to result index
            const tickerSymbolMap = {};
            yFinaceData.yFTickerInfo.forEach(item => {
                tickerSymbolMap[item.ticker_name] = item.ticker_name;
            });

            const final = []

            searchStockDataResult.forEach(item => {
                const quotes = []
                item.quotes.forEach((quote) => {
                    if (tickerSymbolMap.hasOwnProperty(quote.symbol)) {
                        quotes.push({ ...quote, data_available: true })
                    } else {
                        if (quote.isYahooFinance) {
                            quotes.push({ ...quote, data_available: false })
                        }
                    }
                })
                final.push({ ...item, quotes })
            })
            setUpdateSearchStockDataResult(final);
        }
    }, [searchStockDataResult, yFinaceData.yFTickerInfo])

    const downladNewYFTickerData = async (sym) => {
        console.log("Fetching new symbol data", sym)
        let symbol = [sym]
        await fetchOneYfinanceTicker({ token, symbol })
            .then(res => {
                if (res.data.failReason === 'No start date') {
                    Info(res.data.message)
                } else {
                    setYfTickerUpdated(true)
                    Success(res.data.message)
                }
            })
            .catch(err => {
                console.log(err)
            })
    }

    const handleUpdateAllYFinanceTickers = async () => {
        console.log("update all")
        updateAllYFinanceTickers({ token, symbol: 'all' })
            .then(res => {
                setYfTickerUpdated(true)
                const updatedLength = res.data.diffArray.length
                let message
                if (updatedLength === 0) {
                    message = `No new data to update for all tickers.`
                } else {
                    message = `Updated ${updatedLength} tickers. Updated ${updatedLength} tickers`
                }
                Success(message)
            })
            .catch(err => {
                console.log(err)
                Error(err.message)
            })
    }

    const [checkedYfHist, setCheckedYfhHist] = React.useState(false);
    const handlesetCheckedWithYfChange = () => {
        console.log("show")
        setCheckedYfhHist((prev) => !prev);
    };

    const handleDeleteOneYfinanceTicker = async ({ symbol }) => {
        console.log("delete one yf ticker", symbol)
        deleteOneYfinanceTicker({ token, symbol })
            .then(res => {
                setYfTickerUpdated(true)
                Success(res.data.message)
            })
    }

    const [yFChartData, setYFChartData] = useState([])
    useEffect(() => {
        if (yFinaceData.length !== 0) {
            console.log('Chart UE')
            try {
                // console.log(yFinaceData.yFTickerInfo)
                const data = yFinaceData.yFTickerInfo.map((ticker) => {
                    return {
                        tickerName: ticker.ticker_name,
                        day: ticker.data['1d'].historical,
                        week: ticker.data['1wk'].historical,
                        month: ticker.data['1mo']?.historical,
                    }
                })
                setYFChartData(data)
            } catch (err) {
                console.log(err)
            }
        }
    }, [yFinaceData])

    return (
        <Box className='yFinance-stats-component'>
            {yFinaceData === '' ?
                (
                    <Skeleton className='admin-dash-skeleton' variant="rectangular" animation="wave" width="auto" />
                )
                :
                (
                    <Box className='main-yFinance-stats-box' mb={2}>
                        <Box className='yfinance-stats-notifications'>
                            <Box className='yFinance-stats-notifications'>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={12} md={12} lg={6} xl={6}>
                                        <Box className='yfinance-ticker-in-db' display='flex' pb={2} flexDirection='column' alignItems='start'>
                                            <Typography variant='h5'>Total Tickers : {yFinaceData.yFTickerInfo.length}</Typography>
                                            <Typography variant='h5'>Tickers with historical data : {yFinaceData.yFTickerInfo.length}</Typography>
                                        </Box>

                                        <Box className='yFinance-search-and-update' display='flex' justifyContent='flex-start' gap='10px'>
                                            <TextField
                                                error={stockNameInputError === '' ? false : true}
                                                color='secondary'
                                                label="Enter stock name"
                                                value={stockName}
                                                onChange={(e) => setStockName(e.target.value)}
                                                id="outlined-size-small"
                                                size="small"
                                                helperText={stockNameInputError === '' ? '' : stockNameInputError}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        '& fieldset': {
                                                            borderColor: '#E0E3E2',
                                                        }
                                                    }
                                                }}
                                            />
                                            <Button size='small' color='primary' variant="contained" onClick={handleCheckForStockData} >Check</Button>
                                            <Tooltip placement='top' arrow title="Enter a stock name/names to check if historical data exists or not. If passing multiple names, seperate them with comma.(AAPL,GOOGL)">
                                                <IconButton>
                                                    <InfoOutlinedIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>

                                        <Box className='notification' mt={1} sx={{ width: '100%' }}>
                                            <Box display="flex" flexDirection="row" gap="10px">
                                                <Button variant="contained" onClick={() => { setIsYfData(true) }} sx={{ width: '100%' }}>Show</Button>
                                                <Button variant="contained" onClick={() => { setIsYfData(false) }} sx={{ width: '100%' }}>Hide</Button>
                                            </Box>
                                            <Collapse sx={{ marginTop: '10px' }} in={isYfData}>
                                                <Box>
                                                    {updateSearchStockDataResult && updateSearchStockDataResult.map((status, index) => {
                                                        return (
                                                            <Box key={index} display='flex' flexDirection='column'>
                                                                <Box display='flex' flexDirection='row' alignItems='center' height='30px' justifyContent='space-between'>
                                                                    <Typography variant="h6" fontSize='16px' textAlign='start'>
                                                                        {`Searched symbol : ${status.symbol} - Name : ${status.name}`}
                                                                    </Typography>
                                                                    <Box display='flex' flexDirection='row' alignItems='center'>
                                                                        <Box
                                                                            sx={{
                                                                                width: "8px",
                                                                                height: "8px",
                                                                                borderRadius: "50%",
                                                                                backgroundColor: status.available ? "#00FF00" : "#FF0000",
                                                                            }}
                                                                        ></Box>
                                                                    </Box>
                                                                </Box>
                                                                <Box width='100%' pt={1} display='flex' justifyContent='flex-start'>
                                                                    <Accordion className='accordian-yf' TransitionProps={{ unmountOnExit: true }} sx={{ width: '100%' }}>
                                                                        <AccordionSummary
                                                                            expandIcon={<ExpandMoreIcon />}
                                                                            aria-controls="panel1a-content"
                                                                            id="panel1a-header"
                                                                        >
                                                                            <Typography>Exchanges for {status.name}</Typography>
                                                                        </AccordionSummary>
                                                                        <AccordionDetails>
                                                                            {status.quotes.map((quote, index) => {
                                                                                return (
                                                                                    <Box key={index} display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' width='100%'>
                                                                                        <Typography variant="h6" fontSize='15px' textAlign='start'>
                                                                                            {` ${quote.symbol} - ${quote.typeDisp} `}
                                                                                        </Typography>
                                                                                        {!quote.data_available ?
                                                                                            <IconButton size='small' onClick={((e) => downladNewYFTickerData(quote.symbol))} sx={{ width: '30px', height: '30px' }} aria-label="download" color="warning">
                                                                                                <DownloadIcon />
                                                                                            </IconButton>
                                                                                            :
                                                                                            <IconButton size='small' sx={{ width: '30px', height: '30px' }} aria-label="download" color="success">
                                                                                                <CheckIcon />
                                                                                            </IconButton>
                                                                                        }
                                                                                    </Box>
                                                                                )
                                                                            })}
                                                                        </AccordionDetails>
                                                                    </Accordion>
                                                                </Box>
                                                            </Box>
                                                        )
                                                    })
                                                    }
                                                </Box>
                                            </Collapse>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={12} md={12} lg={6} xl={6}>
                                        Placeholder
                                        {/* <YfChart data={yFChartData} /> */}
                                    </Grid>
                                </Grid>
                            </Box>
                        </Box>

                        <Box className='main-yfinance-hist-data-tickers-box'>
                            <Box
                                className={checkedYfHist ? 'yfinance-hist-data-tickers' : 'yfinance-hist-data-tickers_padding'}
                                display='flex'
                                flexDirection='row'
                                justifyContent='space-between'
                                mt={2}
                                sx={{
                                    backgroundColor: checkedYfHist ? '#070707' : '#262727'
                                }}
                            >
                                <Typography variant='h3' className='small-screen-font-size'>Y-F Tickers with Historical Data</Typography>
                                <Box display='flex' flexDirection='row' gap='5px' alignItems='center'>
                                    <IconButton sx={{ width: '30px', height: '30px' }} onClick={(e) => handlesetCheckedWithYfChange(e)}>
                                        <ExpandMoreIcon />
                                    </IconButton>
                                </Box>
                            </Box>
                            {yFinaceData.yFTickerInfo.length === 0 ?
                                (
                                    <Collapse in={checkedYfHist}>
                                        <Box mt={2} pt={4} pb={4} backgroundColor="#262727">
                                            <Typography variant='h5'>No YF tickers with historical data. Fetch First :P</Typography>
                                        </Box>
                                    </Collapse>
                                )
                                :
                                (
                                    <Collapse in={checkedYfHist}>
                                        <Box className='ticker-data-box' pl={1} pr={1} pb={2} mt={2} mb={2} sx={{ backgroundColor: "#262727", borderRadius: '5px' }}>
                                            <Box className='yf-update-all' pt={1} pb={1} display='flex' flexDirection='row' justifyContent='flex-end' gap='5px' alignItems='center'>
                                                <Fade in={checkedYfHist}>
                                                    <Box display='flex' flexDirection='row' justifyContent='center' alignItems='center' gap='5px'>
                                                        <Box sx={{ backgroundColor: '#121212' }} borderRadius='5px'>
                                                            <Tooltip
                                                                arrow
                                                                placement='left'
                                                                title={
                                                                    (
                                                                        <Box
                                                                            display='flex' flexDirection='row' gap='5px'
                                                                        >
                                                                            <Button color='error' variant='contained' size='small' onClick={handleUpdateAllYFinanceTickers}>Yes</Button>
                                                                            <Button color='warning' variant='contained' size='small' onClick={() => console.log('No')}>No</Button>
                                                                        </Box>
                                                                    )
                                                                }
                                                            >
                                                                <Typography variant='h6' p={'5px'}
                                                                    sx={{ cursor: 'pointer' }}
                                                                >
                                                                    Update All
                                                                </Typography>
                                                            </Tooltip>
                                                        </Box>
                                                        <Tooltip size='small' placement='top' arrow title="Update all the ticker data">
                                                            <IconButton>
                                                                <InfoOutlinedIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </Fade>
                                            </Box>
                                            <Grid container spacing={2}>
                                                {yFinaceData.yFTickerInfo.map((ticker, index) => {
                                                    return (
                                                        <Grid key={index} item xs={12} sm={12} md={6} lg={4}>
                                                            <TickerWithYFHistoricalData ticker={ticker} updateOneYFTicker={updateOneYFTicker} handleDeleteOneYfinanceTicker={handleDeleteOneYfinanceTicker} />
                                                        </Grid>
                                                    )
                                                })}
                                            </Grid>
                                        </Box>
                                    </Collapse>
                                )
                            }
                        </Box>
                    </Box>
                )
            }
        </Box>
    )
}

export default YFinanceTickerInfo