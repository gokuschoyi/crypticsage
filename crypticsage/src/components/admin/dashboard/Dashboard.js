import React, { useState, useEffect, useRef } from 'react'
import './Dashboard.css'
import { useOutletContext } from "react-router-dom";
import AdminHeader from '../global/AdminHeader'
import { Box, Typography, TextField, Skeleton, Button, Tooltip, IconButton, Grid, Accordion, AccordionSummary, AccordionDetails, Alert, Collapse } from '@mui/material'
import { useSelector } from 'react-redux'
import { getHistoricalStatFromDb, refreshTickerMeta, deleteOneTickerMeta } from '../../../api/adminController';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CloseIcon from '@mui/icons-material/Close';

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

    return `${elapsedDays}d:${elapsedHours}h:${elapsedMinutes}m`;
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

const TickerWithHisoricalData = ({ ticker }) => {
    const { ticker_name, meta, data } = ticker;
    const { image_url, market_cap_rank, name, asset_launch_date, id, max_supply, symbol } = meta;
    const periodsInData = Object.keys(data);
    const latestTickerDate = data[periodsInData[0]].lastHistorical;
    const daysSinceUpdate = formatDateDifferenceToNow(latestTickerDate);

    return (
        <Box className='ticker-in-db-box' display='flex' flexDirection='column' alignItems='start' p={1} sx={{ backgroundColor: "#171818", borderRadius: '5px' }}>
            <Box className='ticker-with-data-hist-title' display='flex' flexBasis='row' justifyContent='space-between' width='100%'>
                <Box display='flex' flexDirection='row' alignItems='center' gap='5px'>
                    <img className='token-image-hist-box' loading='lazy' src={`${image_url}`} alt='crypto' />
                    <Typography className='hist-title' variant='h5' fontWeight='500'>{name}</Typography>
                </Box>
                <Box display='flex' justifyContent='flex-start' alignItems='center' gap='5px'>
                    <Typography sx={{ fontSize: 16, fontWeight: '300' }} >
                        R : {market_cap_rank}
                    </Typography>
                    <Tooltip title="Update ticker data" placement='bottom'>
                        <IconButton size='small' aria-label="update" color="secondary">
                            <DownloadIcon className='small-icon' />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            <Box className='hist-meta' ml={1} mt={1}>
                <Box display='flex' flexDirection='column' justifyContent='flex-start' alignItems='start' gap='5px'>
                    <Typography variant='h6' fontWeight='400'>ID : {id}</Typography>
                    <Typography variant='h6' fontWeight='400'>Symbol : {symbol}</Typography>
                    <Typography variant='h6' fontWeight='400'>Ticker : {ticker_name}</Typography>
                    <Typography variant='h6' fontWeight='400'>Max Supply : {max_supply < 0 ? 'N/A' : max_supply}</Typography>
                    <Typography variant='h6' fontWeight='400'>Launch Date : {asset_launch_date}</Typography>
                    <Typography variant='h6' fontWeight='400'>Last updated : {daysSinceUpdate} ago</Typography>
                </Box>
            </Box>
            <Box className='hist-data' pt={1} width='100%'>
                <Accordion TransitionProps={{ unmountOnExit: true }} disableGutters>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                    >
                        <Typography>Period Data for {ticker_name} </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {periodsInData.map((period, index) => {
                            const periodData = data[period];
                            return (
                                <React.Fragment key={index}>
                                    <PeriodData period={period} periodData={periodData} />
                                </React.Fragment>
                            )
                        })}
                    </AccordionDetails>
                </Accordion>
            </Box>
        </Box>
    )
}

const TickerWithNoHistData = ({ ticker, handleDeleteTickerMeta, downloadFlag }) => {
    const { id, symbol, ticker_name, max_supply, asset_launch_date, image_url, name, market_cap_rank } = ticker;
    return (
        <Box className='ticker-in-db-box' display='flex' flexDirection='column' alignItems='start' p={1} sx={{ backgroundColor: "#171818", borderRadius: '5px' }}>
            <Box className='ticker-hist-title' display='flex' flexBasis='row' justifyContent='space-between' width='100%'>
                <Box display='flex' flexDirection='row' alignItems='center' gap='5px'>
                    <img className='token-image-hist-box' loading='lazy' src={`${image_url}`} alt='crypto' />
                    <Typography className='hist-title' variant='h5' fontWeight='500' >{name}</Typography>
                </Box>
                <Box display='flex' justifyContent='flex-start' alignItems='center' gap={'4px'}>
                    <Typography sx={{ fontSize: 16, fontWeight: '300' }} >
                        R : {market_cap_rank}
                    </Typography>
                    {downloadFlag ?
                        <Box>
                            <Tooltip title="Fetch ticker data" placement='bottom'>
                                <IconButton className='small-icon-button' size='small' aria-label="update" color="secondary">
                                    <DownloadIcon className='small-icon' />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete ticker" placement='bottom'>
                                <IconButton className='small-icon-button' size='small' aria-label="update" color="secondary" onClick={(e) => handleDeleteTickerMeta({ type: "noHistData", symbol })}>
                                    <DeleteOutlineIcon className='small-icon' />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        :
                        <Box>
                            <Tooltip title="Delete ticker" placement='bottom'>
                                <IconButton className='small-icon-button' size='small' aria-label="update" color="secondary" onClick={(e) => handleDeleteTickerMeta({ type: "noBinanceData", symbol })}>
                                    <DeleteOutlineIcon className='small-icon' />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    }

                </Box>
            </Box>
            <Box className='hist-meta' ml={1} mt={1}>
                <Box display='flex' flexDirection='column' justifyContent='flex-start' alignItems='start' gap='5px'>
                    <Typography variant='h6' fontWeight='400'>ID : {id}</Typography>
                    <Typography variant='h6' fontWeight='400'>Symbol : {symbol} ({ticker_name === null ? 'N/A' : ticker_name})</Typography>
                    <Typography variant='h6' fontWeight='400'>Ticker : {ticker_name === null ? 'N/A' : ticker_name}</Typography>
                    <Typography variant='h6' fontWeight='400'>Max Supply : {max_supply < 0 ? 'N/A' : max_supply}</Typography>
                    <Typography variant='h6' fontWeight='400'>Launch Date : {asset_launch_date}</Typography>
                </Box>
            </Box>
        </Box>
    )
}

const TickerWithYFHistoricalData = ({ ticker }) => {
    const { ticker_name, data } = ticker;
    const periodsInData = Object.keys(data);
    const latestTickerDate = data[periodsInData[0]].lastHistorical;
    const daysSinceUpdate = formatDateDifferenceToNow(latestTickerDate);
    return (
        <Box className='yfinance-ticker-in-db-box' display='flex' flexDirection='column' alignItems='start' p={1} sx={{ backgroundColor: "#171818", borderRadius: '5px' }}>
            <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' width='100%'>
                <Box display='flex' flexDirection='column' alignItems='flex-start'>
                    <Typography variant='h5' fontWeight='400'>Ticker : {ticker_name}</Typography>
                    <Typography variant='h6' fontWeight='400'>Last updated : {daysSinceUpdate} ago</Typography>
                </Box>
                <Tooltip title="Fetch YF ticker data" placement='bottom'>
                    <IconButton size='small' sx={{ width: '34px', height: '34px' }} aria-label="update" color="secondary">
                        <DownloadIcon />
                    </IconButton>
                </Tooltip>
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

const Dashboard = (props) => {
    const { title, subtitle } = props;
    const [setTest] = useOutletContext();
    const hide = () => {
        setTest(true);
    }
    const token = useSelector(state => state.auth.accessToken);
    const [fetchedData, setFetchedData] = useState('');
    const [historicalStat, setHistoricalStat] = useState('');
    const [tickerRefreshValue, setTickerRefreshValue] = useState('');

    const [message, setMessage] = useState('');
    const [showMessage, setShowMessage] = useState(false);

    const [searchTicker, setSearchTicker] = useState('');

    const isInitialMount = useRef(false);
    useEffect(() => {
        if (!isInitialMount.current) {
            isInitialMount.current = true;
            getHistoricalStatFromDb({ token })
                .then((res) => {
                    setFetchedData(res.data)
                    setTickerRefreshValue(res.data.totalTickerCountInDb)
                    // console.log(res)
                })
                .catch((err) => {
                    console.log(err.response.data.message)
                })
        }
    });

    useEffect(() => {
        if (fetchedData !== '') {
            let updatedDataCopy = { ...fetchedData };

            // Function to filter tickers based on the name
            const filterTickersByName = (tickers, searchTicker) => {
                const lowerCaseSearchTicker = searchTicker.toLowerCase();
                return tickers.filter((ticker) => {
                    // Adjust the path to the ticker name based on the array structure
                    const tickerName = (ticker.meta && ticker.meta.name) || ticker.name;
                    return tickerName.toLowerCase().includes(lowerCaseSearchTicker);
                });
            };

            // Filter tickers in updatedDataCopy
            updatedDataCopy.tickersWithHistData = filterTickersByName(
                updatedDataCopy.tickersWithHistData,
                searchTicker
            );
            updatedDataCopy.tickersWithNoHistData = filterTickersByName(
                updatedDataCopy.tickersWithNoHistData,
                searchTicker
            );
            updatedDataCopy.tickerWithNoDataInBinance = filterTickersByName(
                updatedDataCopy.tickerWithNoDataInBinance,
                searchTicker
            );

            setHistoricalStat(updatedDataCopy);
        }

    }, [searchTicker, fetchedData])

    const handleSearchTicker = (e) => {
        console.log(e.target.value)
        setSearchTicker(e.target.value)
    }

    const handleRefreshTickerMeta = () => {
        console.log(parseInt(tickerRefreshValue))
        let fetchLength = parseInt(tickerRefreshValue)
        if (fetchLength < historicalStat.totalTickerCountInDb) {
            fetchLength = historicalStat.totalTickerCountInDb
        }
        if (fetchLength > 50) {
            fetchLength = 50
        }
        refreshTickerMeta({ token, length: fetchLength })
            .then((res) => {
                console.log(res.data)
                let result = res.data.result

                const updateCounts = result.reduce(
                    (acc, curr) => {
                        if (curr.modifiedCount) {
                            acc.updatedCount++;
                        }
                        if (curr.insertedId) {
                            acc.insertedCount++;
                        }
                        return acc;
                    },
                    { updatedCount: 0, insertedCount: 0 }
                );
                setMessage(`Successfully updated ${updateCounts.updatedCount} tickers ${updateCounts.insertedCount > 0 ? `and inserted ${updateCounts.insertedCount} new tickers` : ' '}`)
                setShowMessage(true)
                getHistoricalStatFromDb({ token })
                    .then((res) => {
                        setHistoricalStat(res.data)
                        setTickerRefreshValue(res.data.totalTickerCountInDb)
                        // console.log(res)
                    })
                    .catch((err) => {
                        console.log(err.response.data.message)
                    })
            })
            .catch((err) => {
                console.log(err.response.data.message)
            })
    }

    const handleDeleteTickerMeta = ({ type, symbol }) => {
        console.log("delete", symbol)
        if (type === 'noHistData') {
            let updatedData = { ...fetchedData };
            updatedData.totalTickerCountInDb = updatedData.totalTickerCountInDb - 1;
            updatedData.tickersWithNoHistDataLength = updatedData.tickersWithNoHistDataLength - 1;
            updatedData.tickersWithNoHistData = updatedData.tickersWithNoHistData.filter((ticker) => ticker.symbol !== symbol)
            setFetchedData(updatedData)
        }
        if (type === 'noBinanceData') {
            let updatedData = { ...fetchedData };
            updatedData.totalTickerCountInDb = updatedData.totalTickerCountInDb - 1;
            updatedData.tickerWithNoDataInBinance = updatedData.tickerWithNoDataInBinance.filter((ticker) => ticker.symbol !== symbol)
            setFetchedData(updatedData)
        }

        /* deleteOneTickerMeta({ token, symbol })
            .then((res) => {
                let updatedData = historicalStat;
                updatedData.totalTickerCountInDb = updatedData.totalTickerCountInDb - 1;
                updatedData.tickersWithNoHistDataLength = updatedData.tickersWithNoHistDataLength - 1;
                
            }) */
    }

    return (
        <Box className='admin-dashboard-container' onClick={hide}>
            <AdminHeader title={title} subtitle={subtitle} />
            <Box className='admin-controller-stats' pl={4} pr={4}>
                {historicalStat === '' ?
                    (
                        <Skeleton variant="rectangular" animation="wave" height="400px" width="auto" />
                    )
                    :
                    (
                        <Box className='stats-box' mb={2}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
                                    <Box display='flex' justifyContent='flex-start'>
                                        <Typography variant='h3'>Binance Ticker Info</Typography>
                                    </Box>

                                    <Box className='ticker-in-db' display='flex' pt={2} pb={2} flexDirection='column' alignItems='start'>
                                        <Typography variant='h5'>Total Tickers : {historicalStat.totalTickerCountInDb}</Typography>
                                        <Typography variant='h5'>Tickers with historical data : {historicalStat.tickersWithHistDataLength}</Typography>
                                        <Typography variant='h5'>Tickers without historical data : {historicalStat.tickersWithNoHistDataLength}</Typography>
                                        <Typography variant='h5'>Tickers with no data in Binance : {historicalStat.tickerWithNoDataInBinance.length}</Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={12} md={8} lg={8} xl={8}>
                                    {showMessage &&
                                        <Box sx={{ width: '100%' }}>
                                            <Collapse in={showMessage}>
                                                <Alert
                                                    action={
                                                        <IconButton
                                                            aria-label="close"
                                                            color="inherit"
                                                            size="small"
                                                            onClick={() => {
                                                                setShowMessage(false);
                                                            }}
                                                        >
                                                            <CloseIcon fontSize="inherit" />
                                                        </IconButton>
                                                    }
                                                    sx={{ mb: 2 }}
                                                >
                                                    {message}
                                                </Alert>
                                            </Collapse>
                                        </Box>
                                    }
                                </Grid>
                            </Grid>

                            <Box className='meta-update-count' display='flex' flexDirection='row' alignItems='center' pt={2} pb={2} gap={2}>
                                <TextField
                                    color='secondary'
                                    label="Count"
                                    value={tickerRefreshValue}
                                    onChange={(e) => setTickerRefreshValue(e.target.value)}
                                    id="outlined-size-small"
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': {
                                                borderColor: '#E0E3E2',
                                            }
                                        }
                                    }}
                                />
                                <Button size='small' color='primary' variant="contained" onClick={handleRefreshTickerMeta} >Refresh</Button>
                                <Tooltip placement='top' arrow title="Refresh the tickers in DB. Count is the no of tickers to add or update. If count is more than total tickers, new tickers wil be fetched and added, else existing ticker meta is updated">
                                    <IconButton>
                                        <InfoOutlinedIcon />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            <Box className='search-ticker-box' display='flex' flexDirection='row' alignItems='center' pt={2} pb={2} gap={2}>
                                <TextField
                                    color='secondary'
                                    label="sarch ticker name"
                                    variant="outlined"
                                    value={searchTicker}
                                    onChange={(e) => handleSearchTicker(e)}
                                    id="outlined-size-small"
                                    size="small"
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': {
                                                borderColor: '#E0E3E2',
                                            }
                                        }
                                    }}
                                />
                                <Button size='small' color='primary' variant="contained">Search</Button>
                            </Box>

                            <Box className='hist-data-tickers' display='flex' flexDirection='row' justifyContent='space-between' mt={2}>
                                <Typography variant='h3' className='small-screen-font-size'>Tickers with Historical Data : {historicalStat.tickersWithHistData.length}</Typography>
                                <Box display='flex' flexDirection='row' gap='5px'>
                                    <Button size='small' color='primary' variant="contained" >Update All</Button>
                                    <Tooltip size='small' placement='top' arrow title="Update all the ticker data">
                                        <IconButton sx={{ width: '30px', height: '30px' }}>
                                            <InfoOutlinedIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                            {historicalStat.tickersWithHistData.length === 0 ?
                                (
                                    <Box mt={2} pt={4} pb={4} backgroundColor="#262727">
                                        <Typography variant='h5'>No tickers with historical data. Fetch First :P</Typography>
                                    </Box>
                                )
                                :
                                (
                                    <Box className='ticker-data-box' p={1} mt={2} sx={{ backgroundColor: "#262727", borderRadius: '5px' }}>
                                        <Grid container spacing={2}>
                                            {historicalStat.tickersWithHistData.map((ticker, index) => {
                                                return (
                                                    <Grid key={index} item xs={12} sm={12} md={6} lg={4}>
                                                        <TickerWithHisoricalData ticker={ticker} />
                                                    </Grid>
                                                )
                                            }
                                            )}
                                        </Grid>
                                    </Box>
                                )
                            }

                            <Box className='no-hist-data-tickers' display='flex' flexDirection='row' justifyContent='space-between' mt={2}>
                                <Typography variant='h3' className='small-screen-font-size'>Tickers without Historical Data : {historicalStat.tickersWithNoHistData.length}</Typography>
                                {historicalStat.tickersWithNoHistDataLength !== 0 &&
                                    <Box display='flex' flexDirection='row' gap='5px'>
                                        <Button size='small' color='primary' variant="contained" >Fetch All</Button>
                                        <Tooltip size='small' placement='top' arrow title="Fetch and save all the ticker data">
                                            <IconButton sx={{ width: '30px', height: '30px' }}>
                                                <InfoOutlinedIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                }
                            </Box>
                            {historicalStat.tickersWithNoHistData.length === 0 ?
                                (
                                    <Box mt={2} pt={4} pb={4} backgroundColor="#262727">
                                        <Typography variant='h5'>No tickers to fetch</Typography>
                                    </Box>
                                )
                                :
                                (
                                    <Box className='ticker-with-no-data-box' p={1} mt={2} sx={{ backgroundColor: "#262727", borderRadius: '5px' }}>
                                        <Grid container spacing={2}>
                                            {historicalStat.tickersWithNoHistData.map((ticker, index) => {
                                                return (
                                                    <Grid key={index} item xs={12} sm={12} md={6} lg={4}>
                                                        <TickerWithNoHistData ticker={ticker} handleDeleteTickerMeta={handleDeleteTickerMeta} downloadFlag={true} />
                                                    </Grid>
                                                )
                                            })}
                                        </Grid>
                                    </Box>
                                )
                            }

                            <Box className='no-hist-data-in-binnce' display='flex' justifyContent='flex-start' mt={2}>
                                <Typography variant='h3' className='small-screen-font-size'>Tickers with no data in binance : {historicalStat.tickerWithNoDataInBinance.length}</Typography>
                            </Box>
                            {historicalStat.tickerWithNoDataInBinance.length === 0 ?
                                (
                                    <Box mt={2} pt={4} pb={4} backgroundColor="#262727">
                                        <Typography variant='h5'>All ticker have data that can be fetched from Binance</Typography>
                                    </Box>
                                )
                                :
                                (
                                    <Box className='ticker-with-np-data-in-binance' p={1} mt={2} sx={{ backgroundColor: "#262727", borderRadius: '5px' }}>
                                        <Grid container spacing={2}>
                                            {historicalStat.tickerWithNoDataInBinance.map((ticker, index) => {
                                                return (
                                                    <Grid key={index} item xs={12} sm={12} md={6} lg={4}>
                                                        <TickerWithNoHistData ticker={ticker} handleDeleteTickerMeta={handleDeleteTickerMeta} downloadFlag={false} />
                                                    </Grid>
                                                )
                                            })}
                                        </Grid>
                                    </Box>
                                )
                            }

                            <Box display='flex' justifyContent='flex-start' mt={2}>
                                <Typography variant='h3' >Y-Finance Ticker Info</Typography>
                            </Box>
                            <Box className='yfinance-ticker-in-db' display='flex' pt={2} pb={2} flexDirection='column' alignItems='start'>
                                <Typography variant='h5'>Total Tickers : {historicalStat.yFTickerInfo.length}</Typography>
                                <Typography variant='h5'>Tickers with historical data : {historicalStat.yFTickerInfo.length}</Typography>
                            </Box>

                            <Box className='yfinance-hist-data-tickers' display='flex' flexDirection='row' justifyContent='space-between' mt={2}>
                                <Typography variant='h3' className='small-screen-font-size'>Y-Finance Tickers with Historical Data</Typography>
                                <Box display='flex' flexDirection='row' gap='5px'>
                                    <Button size='small' color='primary' variant="contained" >Update All</Button>
                                    <Tooltip size='small' placement='top' arrow title="Update all the ticker data">
                                        <IconButton>
                                            <InfoOutlinedIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Box>
                            {historicalStat.yFTickerInfo.length === 0 ?
                                (
                                    <Box mt={2} pt={4} pb={4} backgroundColor="#262727">
                                        <Typography variant='h5'>No YF tickers with historical data. Fetch First :P</Typography>
                                    </Box>
                                )
                                :
                                (
                                    <Box className='ticker-data-box' p={1} mt={2} sx={{ backgroundColor: "#262727", borderRadius: '5px' }}>
                                        <Grid container spacing={2}>
                                            {historicalStat.yFTickerInfo.map((ticker, index) => {
                                                return (
                                                    <Grid key={index} item xs={12} sm={12} md={6} lg={4}>
                                                        <TickerWithYFHistoricalData ticker={ticker} />
                                                    </Grid>
                                                )
                                            })}
                                        </Grid>
                                    </Box>
                                )
                            }

                        </Box>
                    )
                }
            </Box>
        </Box>
    )
}

export default Dashboard