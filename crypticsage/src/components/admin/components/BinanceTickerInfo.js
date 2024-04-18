import React, { useEffect, useState, useRef } from 'react'
import { toast } from 'react-toastify';
// import BinanceChart from './BinanceChart'
import TickerWithHistoricalData from './TickerWithHistoricalData';
import TickerWithNoHistoricalData from './TickerWithNoHistoricalData';
import TickerSelector from './TickerSelector';
import { useSelector, useDispatch } from 'react-redux'
import { Success, Progress } from '../../dashboard/global/CustomToasts'
import {
    getBinanceHistoricalStatFromDb,
    refreshTickerMeta,
    updateAllBinanceTickers,
    checkFullUpdateStatus,
    fetchOneBinanceTicker,
    updateOneBinanceTicker,
    checkProcessStatus,
    getNewTickersToAdd
} from '../../../api/adminController'
import {
    Box,
    Typography,
    Grid,
    TextField,
    Button,
    Tooltip,
    IconButton,
    Skeleton,
    Divider
} from '@mui/material'
import Collapse from '@mui/material/Collapse';
import Fade from '@mui/material/Fade';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import {
    setBinanceStats
    , setYfinanceStats
    , setNewTickers
} from '../AdminSlice'

const StatusLegend = () => {
    return (
        <Box className='status-legends' display='flex' flexDirection='row' gap='15px' pr={1}>
            <Tooltip title="Data upto date" placement='top' arrow>
                <Box
                    sx={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: 'green',
                        cursor: 'pointer'
                    }}
                ></Box>
            </Tooltip>
            <Tooltip title="Couple of days old" placement='top' arrow>
                <Box
                    sx={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: '#ff9c4a',
                        cursor: 'pointer'
                    }}
                ></Box>
            </Tooltip>
            <Tooltip title="Somw what old" placement='top' arrow>
                <Box
                    sx={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: 'brown',
                        cursor: 'pointer'
                    }}
                ></Box>
            </Tooltip>
            <Tooltip title="Very old" placement='top' arrow>
                <Box
                    sx={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        backgroundColor: 'red',
                        cursor: 'pointer'
                    }}
                ></Box>
            </Tooltip>
        </Box>
    )
}

const BinanceTickerInfo = () => {
    const dispatch = useDispatch()
    const token = useSelector(state => state.auth.accessToken);
    const binanceStats = useSelector(state => state.admin.binance_stats)
    // const newTickers_ = useSelector(state => state.admin.new_tickers)

    const [fetchedData, setFetchedData] = useState({});
    // const [newTickers, setNewTickersState] = useState([]);
    const [historicalStat, setHistoricalStat] = useState('');
    const [tickerRefreshValue, setTickerRefreshValue] = useState('');
    const [searchTicker, setSearchTicker] = useState('');
    const [sortDirection, setSortDirection] = useState("asc")
    const [isUpdated, setIsUpdated] = useState(false)

    const isInitialMount = useRef(false);
    // Initial fetch of binance historical stats UE
    useEffect(() => {
        if (Object.keys(binanceStats).length === 0 && !isInitialMount.current) {
            console.log('Initial Fetch Binance data UE')
            isInitialMount.current = true;

            getBinanceHistoricalStatFromDb({ token })
                .then((res) => {
                    dispatch(setBinanceStats(res.data))
                    setFetchedData(res.data)
                    setTickerRefreshValue(res.data.totalTickerCountInDb === 0 ? 5 : res.data.totalTickerCountInDb)
                })
                .catch((err) => {
                    console.log(err)
                })

            getNewTickersToAdd({ token })
                .then((res) => {
                    dispatch(setNewTickers(res.data.new_tickers))
                    // setNewTickersState(res.data.new_tickers)
                })
                .catch((error) => {
                    console.log(error)
                })
        } else {
            console.log('Hist stat present in redux...lodaing that')
            setFetchedData(binanceStats)
            setTickerRefreshValue(binanceStats.totalTickerCountInDb)
            // setNewTickersState(newTickers_)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, binanceStats]);

    // Filtering based on search UE
    useEffect(() => {
        if (Object.keys(fetchedData).length > 0) {
            console.log('Filtering UE')
            let updatedDataCopy = JSON.parse(JSON.stringify(fetchedData));

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

    // Fetching updated data UE
    useEffect(() => {
        if (isUpdated) {
            console.log('Updated Fetch stats data UE')
            getBinanceHistoricalStatFromDb({ token })
                .then((res) => {
                    setFetchedData(res.data)
                    setTickerRefreshValue(res.data.totalTickerCountInDb)
                    // console.log(res)
                })
                .catch((err) => {
                    console.log(err.response.data.message)
                })
            setIsUpdated(false)
        }
    }, [token, isUpdated])

    // Sorting based on last historical UE
    useEffect(() => {
        if (Object.keys(fetchedData).length > 0) {
            console.log("Sorting UE New")
            let copiedData = JSON.parse(JSON.stringify(fetchedData));

            const precedence = ["1m", "4h", "6h", "8h", "12h", "1d", "3d", "1w"]; // Define the precedence of keys

            let sortedData = copiedData.tickersWithHistData.sort((a, b) => {
                const availableKeysA = Object.keys(a.data).filter(key => precedence.includes(key));
                const availableKeysB = Object.keys(b.data).filter(key => precedence.includes(key));

                const latestHistoricalA = Math.max(...availableKeysA.map(key => a.data[key].lastHistorical));
                const latestHistoricalB = Math.max(...availableKeysB.map(key => b.data[key].lastHistorical));

                if (sortDirection === 'desc') {
                    return latestHistoricalA < latestHistoricalB ? -1 : 1;
                } else {
                    return latestHistoricalA > latestHistoricalB ? -1 : 1;
                }
            });

            setHistoricalStat(prevStat => ({
                ...prevStat,
                tickersWithHistData: sortedData
            }));
        }
    }, [sortDirection, fetchedData]);


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
                Success(`Successfully updated ${updateCounts.updatedCount} tickers ${updateCounts.insertedCount > 0 ? `and inserted ${updateCounts.insertedCount} new tickers` : ' '}`)
                getBinanceHistoricalStatFromDb({ token })
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

    const handleSearchTicker = (e) => {
        console.log(e.target.value)
        setSearchTicker(e.target.value)
    }

    const updateAllRef = useState(null)
    const handleUpdateAllBinanceTickers = async () => {
        console.log("Update all Binance clicked")
        const updateAllBinTickers = await updateAllBinanceTickers({ token })
        Success(updateAllBinTickers.data.message)
        updateAllRef.current = Progress('Processing update request for all tickers')
        let processIds = updateAllBinTickers.data.finalProcessIds.ids.jobIds

        let payload = {
            jobIds: processIds,
            type: 'full_update_'
        }
        console.log(payload)

        let interval = setInterval(async () => {
            let statusReq = await checkFullUpdateStatus({ token, payload })
            let processed = statusReq.data.data

            const allJobsCompleted = processed.every(update => update.completed);

            if (allJobsCompleted) {
                clearInterval(interval); // Clear the interval if all jobs are completed
                setIsUpdated(true)
                toast.update(updateAllRef.current, { progress: 100 })
                console.log("All jobs completed");
            } else {
                const totalCompletedCount = processed.reduce((count, item) => {
                    if (item.completed === true) {
                        return count + 1;
                    }
                    return count;
                }, 0);
                let progressPer = Math.ceil(Math.round(totalCompletedCount / processed.length * 100))
                let progFrac = (progressPer / 100).toFixed(2)
                toast.update(updateAllRef.current, { progress: progFrac })
                console.log(`Completed ${totalCompletedCount} out of ${processed.length}`);
            }
        }, 2000);
    }

    let updateRef = useRef(null)
    let fullfetchRef = useRef(null)
    const handleUpdateBianceTicker = async ({ ticker_name, type }) => {
        console.log(ticker_name, type)
        let payload, interval
        switch (type) {
            case "update":
                let selectedTicker = historicalStat.tickersWithHistData
                    .filter((item) => item.ticker_name === ticker_name)[0].data
                let keys = Object.keys(selectedTicker)
                let updateQueries = []
                for (let i = 0; i < keys.length; i++) {
                    let keyData = selectedTicker[keys[i]]
                    updateQueries.push(
                        {
                            ticker_name: ticker_name,
                            period: keys[i],
                            start: keyData.lastHistorical,
                            end: new Date().getTime()
                        }
                    )
                }

                const updateBinanceTicker = await updateOneBinanceTicker({ token, updateQueries })
                Success(updateBinanceTicker.data.message)
                updateRef.current = Progress(`Processing update request for ${ticker_name}`)

                payload = updateBinanceTicker.data.finalResult.check_status_payload
                // console.log(payload)

                interval = setInterval(async () => {
                    let statusReq = await checkProcessStatus({ token, payload })
                    let status = statusReq.data.status
                    const allJobsCompleted = status.every(update => update.completed);

                    if (allJobsCompleted) {
                        clearInterval(interval); // Clear the interval if all jobs are completed
                        setIsUpdated(true)
                        toast.update(updateRef.current, { progress: 100 })
                        console.log("All jobs completed");
                    } else {
                        const totalCompletedCount = status.reduce((count, item) => {
                            if (item.completed === true) {
                                return count + 1;
                            }
                            return count;
                        }, 0);
                        let progressPer = Math.ceil(Math.round(totalCompletedCount / status.length * 100))
                        let progFrac = (progressPer / 100).toFixed(2)
                        toast.update(updateRef.current, { progress: progFrac })
                        console.log(`Completed ${totalCompletedCount} out of ${status.length}`);
                    }
                }, 2000); // Interval time in milliseconds

                break;
            case "fullfetch":
                const periods = ["1m", "4h", "6h", "8h", "12h", "1d", "3d", "1w"]
                let selectedTickerFull = historicalStat.tickersWithNoHistData
                    .filter((item) => item.ticker_name === ticker_name)[0]

                let tickerMeta = {
                    market_cap_rank: selectedTickerFull.market_cap_rank,
                    symbol: selectedTickerFull.ticker_name,
                    name: selectedTickerFull.name,
                    asset_launch_date: selectedTickerFull.asset_launch_date
                }
                let fetchQueries = []
                for (const period of periods) {
                    let fetchQuery = {
                        ticker_name: ticker_name,
                        period: period,
                        meta: tickerMeta
                    }
                    fetchQueries.push(fetchQuery)
                }

                console.log(fetchQueries)

                const fetchedBinanceInfo = await fetchOneBinanceTicker({ token, fetchQueries })
                Success(fetchedBinanceInfo.data.message)
                fullfetchRef.current = Progress('Processing fullfetch request')
                payload = fetchedBinanceInfo.data.finalResult.check_status_payload
                console.log(payload)

                interval = setInterval(async () => {
                    let statusReq = await checkProcessStatus({ token, payload })
                    let status = statusReq.data.status
                    const allJobsCompleted = status.every(update => update.completed);

                    if (allJobsCompleted) {
                        clearInterval(interval); // Clear the interval if all jobs are completed
                        setIsUpdated(true)
                        toast.update(fullfetchRef.current, { progress: 100 })
                        console.log("All jobs completed");
                    } else {
                        const totalCompletedCount = status.reduce((count, item) => {
                            if (item.completed === true) {
                                return count + 1;
                            }
                            return count;
                        }, 0);
                        let progressFPer = Math.ceil(Math.round(totalCompletedCount / status.length * 100))
                        let progFrac = (progressFPer / 100).toFixed(2)
                        toast.update(fullfetchRef.current, { progress: progFrac })
                        console.log(`Completed ${totalCompletedCount} out of ${status.length}`);
                    }
                }, 2000);
                break;
            default:
                throw new Error(`Unknown type: ${type}`);
        }
    }

    // actual delete from db not implemented yet
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

    const [checkedWithHist, setCheckedWithHist] = React.useState(false);
    const [checkedNoHist, setCheckedNoHist] = React.useState(false);
    const [checkedNoBinance, setCheckedNoBinance] = React.useState(false);
    const handlesetCheckedWithHistChange = () => {
        console.log("show")
        setCheckedWithHist((prev) => !prev);
    };

    const handlesetCheckedNoHistChange = () => {
        console.log("show")
        setCheckedNoHist((prev) => !prev);
    };

    const handlesetCheckedNoBinanceChange = () => {
        console.log("show")
        setCheckedNoBinance((prev) => !prev);
    };

    return (
        <Box className='binance-stats-component'>
            {historicalStat === '' ?
                (
                    <Skeleton className='admin-dash-skeleton' variant="rectangular" animation="wave" width="auto" />
                )
                :
                (
                    <Box className='main-binance-stats-box' mb={2}>
                        <Box className='binance-stats-notifications'>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={12} md={12} lg={6} xl={6}>
                                    <Box >
                                        <Box className='ticker-in-db' display='flex' pt={2} pb={2} flexDirection='column' alignItems='start'>
                                            <Typography variant='h5'>Total Tickers : {historicalStat.totalTickerCountInDb}</Typography>
                                            <Typography variant='h5'>Tickers with historical data : {historicalStat.tickersWithHistDataLength}</Typography>
                                            <Typography variant='h5'>Tickers without historical data : {historicalStat.tickersWithNoHistDataLength}</Typography>
                                            <Typography variant='h5'>Tickers with no data in Binance : {historicalStat.tickerWithNoDataInBinance.length}</Typography>
                                        </Box>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={12} md={12} lg={6} xl={6}>
                                    {historicalStat.totalTickerCountInDb === 0 &&
                                        <Box className='update-all-tickers' display='flex' flexDirection='row' alignItems='center' pt={2} pb={2} gap={2}>
                                            <Button size='small' color='primary' variant="contained" onClick={handleRefreshTickerMeta} >Fetch Ticker Meta</Button>
                                        </Box>
                                    }
                                    PlaceHolder
                                </Grid>
                            </Grid>
                        </Box>

                        {historicalStat.totalTickerCountInDb !== 0 &&
                            <Box className='meta-update-count' display='flex' flexDirection='row' pt={2} pb={2} gap={2}>
                                <Box display='flex' flexDirection='row' alignItems='flex-start' gap={1}>
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
                                            },
                                            '& .MuiInputBase-input': {
                                                height: '15px'
                                            },
                                        }}
                                    />
                                    <Button size='small' color='primary' variant="contained" onClick={handleRefreshTickerMeta} >Refresh</Button>
                                    <Tooltip sx={{ padding: '4px' }} placement='top' arrow title="Refresh the tickers in DB. Count is the no of tickers to add or update. If count is more than total tickers, new tickers wil be fetched and added, else existing ticker meta is updated">
                                        <IconButton>
                                            <InfoOutlinedIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                                <Divider orientation="vertical" variant="middle" flexItem />
                                <Box >
                                    <TickerSelector />
                                </Box>
                            </Box>
                        }

                        <Box className='search-ticker-box' display='flex' flexDirection='row' alignItems='center' pt={2} pb={2} gap={2}>
                            <TextField
                                color='secondary'
                                label="Search ticker"
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
                        </Box>

                        <Box className='main-hist-data-tickers-box'>
                            <Box className={checkedWithHist ? 'hist-data-tickers' : 'hist-data-tickers_padding'} display='flex' flexDirection='row' justifyContent='space-between' sx={{ backgroundColor: checkedWithHist ? '#070707' : '#262727' }}>
                                <Box className='with-hist-data-title' display='flex' flexDirection='row' alignItems='center' gap={2}>
                                    <Typography variant='h3' className='small-screen-font-size'>Tickers with Historical Data : {historicalStat.tickersWithHistData.length}</Typography>
                                    <Fade in={checkedWithHist}>
                                        <IconButton sx={{ width: '30px', height: '30px' }} onClick={(e) => setSortDirection((prev) => prev === 'asc' ? 'desc' : 'asc')}>
                                            <ArrowUpwardIcon className={sortDirection === 'asc' ? 'normal-icon' : 'rotate-icon'} />
                                        </IconButton>
                                    </Fade>
                                </Box>
                                <IconButton sx={{ width: '30px', height: '30px' }} onClick={(e) => handlesetCheckedWithHistChange(e)}>
                                    <ExpandMoreIcon />
                                </IconButton>
                            </Box>
                            {historicalStat.tickersWithHistData.length === 0 ?
                                (
                                    <Collapse in={checkedWithHist}>
                                        <Box mt={2} pt={4} pb={4} backgroundColor="#262727">
                                            <Typography variant='h5'>No tickers with historical data.</Typography>
                                        </Box>
                                    </Collapse>
                                )
                                :
                                (
                                    <Collapse in={checkedWithHist}>
                                        <Box className='ticker-data-box' pl={1} pr={1} mt={2} pb={2} sx={{ backgroundColor: "#262727", borderRadius: '5px' }}>
                                            <Box className='legend-update-collapse' pt={1} pb={1} display='flex' flexDirection='row' justifyContent='flex-end' gap='5px' alignItems='center'>
                                                <Fade in={checkedWithHist}>
                                                    <Box display='flex' flexDirection='row' justifyContent='center' alignItems='center' gap='5px'>
                                                        <StatusLegend />

                                                        <Box sx={{ backgroundColor: '#121212' }} borderRadius='5px'>
                                                            <Tooltip
                                                                arrow
                                                                placement='left'
                                                                title={
                                                                    (
                                                                        <Box
                                                                            display='flex' flexDirection='row' gap='5px'
                                                                        >
                                                                            <Button color='error' variant='contained' size='small' onClick={handleUpdateAllBinanceTickers}>Yes</Button>
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
                                                            <IconButton sx={{ width: '30px', height: '30px' }}>
                                                                <InfoOutlinedIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </Fade>
                                            </Box>

                                            <Grid container spacing={2}>
                                                {historicalStat.tickersWithHistData.map((ticker, index) => {
                                                    return (
                                                        <Grid key={index} item xs={12} sm={12} md={6} lg={4}>
                                                            <TickerWithHistoricalData ticker={ticker} handleUpdateBianceTicker={handleUpdateBianceTicker} />
                                                        </Grid>
                                                    )
                                                }
                                                )}
                                            </Grid>
                                        </Box>
                                    </Collapse>
                                )
                            }
                        </Box>

                        <Box className='main-no-hist-data-tickers-box'>
                            <Box className={checkedNoHist ? 'no-hist-data-tickers' : 'no-hist-data-tickers_padding'} display='flex' flexDirection='row' justifyContent='space-between' mt={2} sx={{ backgroundColor: checkedNoHist ? '#070707' : '#262727' }}>
                                <Typography variant='h3' className='small-screen-font-size'>Tickers without Historical Data : {historicalStat.tickersWithNoHistData.length}</Typography>
                                <IconButton sx={{ width: '30px', height: '30px' }} onClick={(e) => handlesetCheckedNoHistChange(e)}>
                                    <ExpandMoreIcon />
                                </IconButton>
                            </Box>
                            {historicalStat.tickersWithNoHistData.length === 0 ?
                                (
                                    <Collapse in={checkedNoHist}>
                                        <Box mt={2} pt={4} pb={4} backgroundColor="#262727">
                                            <Typography variant='h5'>No tickers</Typography>
                                        </Box>
                                    </Collapse>
                                )
                                :
                                (
                                    <Collapse in={checkedNoHist}>
                                        <Box className='ticker-with-no-data-box' p={1} mt={2} sx={{ backgroundColor: "#262727", borderRadius: '5px' }}>
                                            <Grid container spacing={2}>
                                                {historicalStat.tickersWithNoHistData.map((ticker, index) => {
                                                    return (
                                                        <Grid key={index} item xs={12} sm={12} md={6} lg={4}>
                                                            <TickerWithNoHistoricalData ticker={ticker} handleUpdateBianceTicker={handleUpdateBianceTicker} handleDeleteTickerMeta={handleDeleteTickerMeta} downloadFlag={true} />
                                                        </Grid>
                                                    )
                                                })}
                                            </Grid>
                                        </Box>
                                    </Collapse>
                                )
                            }
                        </Box>

                        <Box className='main-no-hist-data-in-binnce-box'>
                            <Box className={checkedNoBinance ? 'no-hist-data-in-binnce' : 'no-hist-data-in-binnce_padding'} display='flex' justifyContent='space-between' mt={2} sx={{ backgroundColor: checkedNoBinance ? '#070707' : '#262727' }}>
                                <Typography variant='h3' className='small-screen-font-size'>Tickers with no data in binance : {historicalStat.tickerWithNoDataInBinance.length}</Typography>
                                <IconButton sx={{ width: '30px', height: '30px' }} onClick={(e) => handlesetCheckedNoBinanceChange(e)}>
                                    <ExpandMoreIcon />
                                </IconButton>
                            </Box>
                            {historicalStat.tickerWithNoDataInBinance.length === 0 ?
                                (
                                    <Collapse in={checkedNoBinance}>
                                        <Box mt={2} pt={4} pb={4} backgroundColor="#262727">
                                            <Typography variant='h5'>All ticker have data that can be fetched from Binance</Typography>
                                        </Box>
                                    </Collapse>
                                )
                                :
                                (
                                    <Collapse in={checkedNoBinance}>
                                        <Box className='ticker-with-np-data-in-binance' p={1} mt={2} sx={{ backgroundColor: "#262727", borderRadius: '5px' }}>
                                            <Grid container spacing={2}>
                                                {historicalStat.tickerWithNoDataInBinance.map((ticker, index) => {
                                                    return (
                                                        <Grid key={index} item xs={12} sm={12} md={6} lg={4}>
                                                            <TickerWithNoHistoricalData ticker={ticker} handleDeleteTickerMeta={handleDeleteTickerMeta} downloadFlag={false} />
                                                        </Grid>
                                                    )
                                                })}
                                            </Grid>
                                        </Box>
                                    </Collapse>
                                )
                            }
                        </Box>

                    </Box >
                )
            }
        </Box >
    )
}

export default BinanceTickerInfo