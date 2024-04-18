import React, { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setCryptoDataRedux, setCryptoPreferencesRedux } from '../../IndicatorsSlice'
import { setSelectedTickerName, resetDataLoadedState, resetShowSettingsFlag, setCryptoDataInDbRedux } from '../../modules/CryptoModuleSlice'
import { ArrowDropUpIcon, ArrowDropDownIcon, AutorenewIcon } from '../../../../global/Icons';
import { getLatestCryptoData } from '../../../../../../api/crypto'
import { convert, getLastUpdatedTimeString, getDateTime, getCurrencySymbol } from '../../../../../../utils/Utils'
import {
    Box
    , Typography
    , TableContainer
    , Table
    , TableHead
    , TableRow
    , TableCell
    , TableBody
    , TableSortLabel
    , useTheme
    , Skeleton
    , IconButton
    , MenuItem
    , Select
    , InputLabel
    , FormControl
    , Tooltip
} from '@mui/material'
const CryptoTable = () => {
    const theme = useTheme()
    const tableHeight = 700;
    const navigate = useNavigate();

    const dispatch = useDispatch();

    //<------ table logic ------>//
    const token = useSelector(state => state.auth.accessToken);
    const selectedToken = useSelector(state => state.cryptoModule.selectedTickerName);
    const selectedTickerPeriod = useSelector(state => state.cryptoModule.selectedTickerPeriod);
    const defaultTickerPeriod = '4h' // Default ticker period. Should be the same as in the redux state 
    const cryptoPreferences = useSelector(state => state.indicators.cryptoPreferences);
    const { currency: rCurr, order: rOrder, orderBy: rOrderBy } = cryptoPreferences
    const cryptoDataInRedux = useSelector(state => state.indicators.cryptoData);
    const [cryptoData, setCryptoData] = useState([]);
    // console.log(cryptoPreferences)

    const [latestUpdatedDate, setLatestUpdatedDate] = useState('')

    const [currency, setCurrency] = useState(rCurr)
    const [availableCurrencyList, setAvailableCurrencyList] = useState([])

    const [open, setOpen] = React.useState(false);
    // handles the user selection of currency and sets to currency
    const handleCurrencyChange = (event) => {
        if (event.target.value !== '') {
            setCurrency(event.target.value);
            dispatch(setCryptoPreferencesRedux({ cryptoPreferences: { ...cryptoPreferences, currency: event.target.value } }))
        }
    };

    // handles open for select
    const handleOpen = () => {
        setOpen(true);
    };

    // handles close for select
    const handleClose = () => {
        setOpen(false);
    };

    // get latest crypto data, sets states for available currencyList and latest updated date to latestUpdatedDate
    const loadedRef = useRef(false);
    useEffect(() => {
        if (!loadedRef.current && cryptoDataInRedux.length === 0) {
            // console.log('UE : ticker info fetch')
            loadedRef.current = true
            let data = {
                token: token,
            }
            getLatestCryptoData(data)
                .then((res) => {
                    setCryptoData(res.data.cryptoData)
                    const cList = res.data.cryptoData[0].prices
                    let cListArray = []
                    for (const [key] of Object.entries(cList)) {
                        cListArray.push(key)
                    }
                    setAvailableCurrencyList(cListArray)
                    setLatestUpdatedDate(cList.USD.last_updated)

                    let data = res.data.cryptoData
                    dispatch(setCryptoDataRedux({ cryptoData: data }))
                })
        } else if (cryptoDataInRedux.length > 0) {
            // console.log('UE : ticker info fetch from redux')
            setCryptoData(cryptoDataInRedux)
            const cList = cryptoDataInRedux[0].prices
            let cListArray = []
            for (const [key] of Object.entries(cList)) {
                cListArray.push(key)
            }
            setAvailableCurrencyList(cListArray)
            setLatestUpdatedDate(cList.USD.last_updated)
        } else {
            return
        }
    }, [cryptoDataInRedux, dispatch, token])

    // console.log(currency, availableCurrencyList)

    const [order, setOrder] = React.useState(rOrder);
    const [orderBy, setOrderBy] = React.useState(rOrderBy);

    // Sets the order and orderBy states
    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        dispatch(setCryptoPreferencesRedux({ cryptoPreferences: { ...cryptoPreferences, order: isAsc ? 'desc' : 'asc', orderBy: property } }))
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    // handler for sorting the table. Calls handleRequestSort to set the order and orderBy states
    const createSortHandler = (property) => (event) => {
        handleRequestSort(event, property);
    };

    //<------ table logic ------>//

    // sorting logic    
    useEffect(() => {
        if (cryptoData.length > 0) {
            console.log('UE : sorting')
            const copyCryptoData = [...cryptoData];
            const sortedArray = copyCryptoData.sort((a, b) => {
                const valueA = a[orderBy] || a.prices[currency][orderBy] || 0;
                const valueB = b[orderBy] || b.prices[currency][orderBy] || 0;
                if (order === 'asc') {
                    return valueA - valueB;
                } else {
                    return valueB - valueA;
                }
            });
            dispatch(setCryptoDataRedux({ cryptoData: sortedArray }))
            setCryptoData(sortedArray);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [order, orderBy, currency]);


    // refresh crypto data on click
    const refreshCryptoData = () => {
        console.log('refresh crypto data')
        const refreshIcon = document.getElementById('refresh-icon');
        refreshIcon.classList.add('rotate-icon');
        let data = {
            token: token,
        }
        getLatestCryptoData(data)
            .then((res) => {
                let data = res.data.cryptoData
                dispatch(setCryptoDataRedux({ cryptoData: data }))
                const cList = res.data.cryptoData[0].prices
                setLatestUpdatedDate(cList.USD.last_updated)
                refreshIcon.classList.remove('rotate-icon');
            })
    }

    //reddirect to '/dashboard/indicators/crypto/${dataId}' if matchedSymbol exists
    const handleTokenPageLoad = (dataId) => {
        console.log(dataId, selectedToken)
        if (dataId !== null) {
            if (dataId === selectedToken) {
                dispatch(resetShowSettingsFlag())
                navigate(`/dashboard/indicators/crypto/${dataId}/${selectedTickerPeriod}`)
            } else {
                dispatch(setSelectedTickerName(dataId))
                dispatch(resetDataLoadedState())
                dispatch(resetShowSettingsFlag())
                dispatch(setCryptoDataInDbRedux({ dataInDb: [], total_count_db: 0 }))
                navigate(`/dashboard/indicators/crypto/${dataId}/${defaultTickerPeriod}`)
            }
        } else {
            console.log("no token name present")
        }
    }

    // currency symbol based on the currency selected
    const currencySymbol = getCurrencySymbol(currency)
    return (
        <Box className='crypto-container'>
            <Box className='crypto-details-tabel' mr={4} ml={4}>
                {cryptoData.length === 0 ?
                    (
                        <Box className='skeleton-box' sx={{ height: `${tableHeight}px`, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Skeleton animation="wave" variant="rounded" sx={{ position: 'absolute', bgcolor: '#3f3f40', width: '95%', height: '95%' }} />
                        </Box>
                    )
                    :
                    (
                        <React.Fragment>
                            <Box className='ticker-currency-last-updated' display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' pl={1} pr={1} pt={1}>
                                <Box className='currency-selector-date-refresh' display='flex' flexDirection='row' alignItems='center' gap={4}>
                                    <FormControl sx={{ minWidth: 160 }}>
                                        <InputLabel color='secondary' id="demo-controlled-open-select-label">Select Currency</InputLabel>
                                        <Select
                                            size='small'
                                            labelId="demo-controlled-open-select-label"
                                            id="demo-controlled-open-select"
                                            open={open}
                                            onClose={handleClose}
                                            onOpen={handleOpen}
                                            value={currency}
                                            label="Select a currency"
                                            color='secondary'
                                            onChange={handleCurrencyChange}
                                            sx={{
                                                '& fieldset': {
                                                    borderColor: 'red !important'
                                                }
                                            }}
                                        >
                                            <MenuItem value="">
                                                <em>None</em>
                                            </MenuItem>
                                            {availableCurrencyList.map((item, index) => {
                                                return (
                                                    <MenuItem key={index} value={item}>{item}</MenuItem>
                                                )
                                            })}
                                        </Select>
                                    </FormControl>
                                    <Box>
                                        <IconButton
                                            aria-label="refresh crypto data"
                                            size="small"
                                            onClick={refreshCryptoData}
                                        >
                                            <AutorenewIcon id='refresh-icon' sx={{ width: '20px', height: '20px' }} />
                                        </IconButton>
                                    </Box>
                                </Box>
                                <Box className='last-updated-status-legend' display='flex' flexDirection='row' alignItems='center' gap={2}>
                                    <Box className='last-updated' height='60px' display='flex' alignItems='center' gap='10px'>
                                        <Box>
                                            <Box display='flex' flexDirection='row' gap='5px'>
                                                <Typography fontSize='12px' fontWeight={500} color={theme.palette.text.secondary}>Updated : </Typography>
                                                <Typography fontSize='12px' fontWeight={500} color={theme.palette.text.secondary}>{getLastUpdatedTimeString(latestUpdatedDate)}</Typography>
                                            </Box>
                                            <Box display='flex' justifyContent='flex-start'>
                                                <Typography fontSize='12px' fontWeight={500} color={theme.palette.text.secondary}>{getDateTime(latestUpdatedDate)}</Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box className='status-legend' display='flex' flexDirection='column' >
                                        <Box display='flex' flexDirection='row' gap={'10px'} alignItems='center'>
                                            <Box height='8px' width='8px'
                                                style={{
                                                    borderRadius: '8px',
                                                    backgroundColor: 'green'
                                                }} />
                                            <Typography fontSize='12px' fontWeight={400} color={theme.palette.text.secondary}>Data Available</Typography>
                                        </Box>
                                        <Box display='flex' flexDirection='row' gap={'10px'} alignItems='center'>
                                            <Box height='8px' width='8px'
                                                style={{
                                                    borderRadius: '8px',
                                                    backgroundColor: 'red'
                                                }} />
                                            <Typography fontSize='12px' fontWeight={400} color={theme.palette.text.secondary}>Data Un-Available</Typography>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                            <TableContainer sx={{ maxHeight: tableHeight }}>
                                <Table stickyHeader aria-label="sticky table" >
                                    <TableHead>
                                        <TableRow>
                                            <TableCell style={{ borderLeft: '1px solid white', minWidth: '250px' }}>
                                                <TableSortLabel
                                                    active={orderBy === 'market_cap_rank'}
                                                    direction={orderBy === 'market_cap_rank' ? order : 'asc'}
                                                    onClick={createSortHandler("market_cap_rank")}
                                                >
                                                    NAME
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell style={{ minWidth: '90px' }}>MKT CAP</TableCell>
                                            <TableCell style={{ minWidth: '100px' }}>FD CAP</TableCell>
                                            <TableCell style={{ minWidth: '90px' }}>PRICE {currencySymbol}</TableCell>
                                            <TableCell style={{ minWidth: '148px' }}>H / L {currencySymbol}</TableCell>
                                            <TableCell>MEDIAN</TableCell>
                                            <TableCell style={{ minWidth: '110px' }}>COINS</TableCell>
                                            <TableCell style={{ minWidth: '120px' }}>
                                                <TableSortLabel
                                                    active={orderBy === 'change_percentage_24_hrs'}
                                                    direction={orderBy === 'change_percentage_24_hrs' ? order : 'asc'}
                                                    onClick={createSortHandler("change_percentage_24_hrs")}
                                                >
                                                    % 24H {currencySymbol}
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell style={{ minWidth: '100px' }}>
                                                <TableSortLabel
                                                    active={orderBy === 'change_percentage_day'}
                                                    direction={orderBy === 'change_percentage_day' ? order : 'asc'}
                                                    onClick={createSortHandler("change_percentage_day")}
                                                >
                                                    % DAY {currencySymbol}
                                                </TableSortLabel>
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {cryptoData.map((row, index) => {
                                            const {
                                                market_cap_rank,
                                                id,
                                                symbol,
                                                name,
                                                image_url,
                                                max_supply,
                                                prices,
                                                matchedSymbol,
                                                dataInDb
                                            } = row;
                                            const {
                                                market_cap,
                                                fd_market_cap,
                                                current_price,
                                                high_24h,
                                                low_24h,
                                                median,
                                                supply,
                                                change_percentage_24_hrs,
                                                change_24_hrs,
                                                change_percentage_day,
                                                change_day,
                                            } = prices[currency]
                                            return (
                                                <TableRow hover key={index} className={`row-id ${index}`}>
                                                    <TableCell align='left' className='crypto-name'>
                                                        <Box
                                                            display='flex'
                                                            flexDirection='row'
                                                            alignItems='center'
                                                            justifyContent='space-between'
                                                            gap='5px'
                                                            className={matchedSymbol !== null && dataInDb ? 'crypto-content' : ''}
                                                            data-id={matchedSymbol !== null && dataInDb ? matchedSymbol : null}
                                                            onClick={(e) => {
                                                                const dataId = e.currentTarget.getAttribute('data-id')
                                                                handleTokenPageLoad(dataId)
                                                            }}
                                                        >
                                                            <Box display='flex' flexDirection='row' gap='5px'>
                                                                <Box display='flex' flexDirection='row' gap='5px' alignItems='center' >
                                                                    <Typography fontSize='10px' fontWeight={600}>{market_cap_rank}</Typography>
                                                                    <img src={image_url} loading='lazy' alt={id} width='15px' height='15px' />
                                                                    {name}
                                                                </Box>
                                                                <Box display='flex' alignItems='center'>
                                                                    <Typography fontSize='10px' fontWeight={600}>({symbol})</Typography>
                                                                </Box>
                                                            </Box>
                                                            <Tooltip title={matchedSymbol !== null && dataInDb ? 'Data available in Db' : matchedSymbol !== null && !dataInDb ? 'Data unavailable in Db' : 'Data unavailable in binance'} placement='top' arrow>
                                                                <Box height='8px' width='8px'
                                                                    style={{
                                                                        borderRadius: '8px',
                                                                        backgroundColor: matchedSymbol !== null && dataInDb
                                                                            ? 'green'
                                                                            : matchedSymbol !== null && !dataInDb
                                                                                ? 'orange'
                                                                                : 'red'
                                                                    }}
                                                                >
                                                                </Box>
                                                            </Tooltip>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>{convert(market_cap)}</TableCell>
                                                    <TableCell>{convert(fd_market_cap)}</TableCell>
                                                    <TableCell>{(current_price).toFixed(2)}</TableCell>
                                                    <TableCell>{(high_24h).toFixed(2)} / {(low_24h).toFixed(2)}</TableCell>
                                                    {/*<TableCell>{convert(high_24h)} / {convert(low_24h)}</TableCell>*/}
                                                    <TableCell>{(median).toFixed(3)}</TableCell>
                                                    <TableCell>{convert(supply)} {max_supply > 0 ? `of ${convert(max_supply)}` : ''}</TableCell>
                                                    <TableCell>
                                                        <Box display='flex' gap='5px' alignItems='center' justifyContent='space-between' sx={{ color: `${change_percentage_24_hrs >= 0 ? '#68e768' : 'red'}` }}>
                                                            <Box display='flex' flexDirection='row' gap='5px'>
                                                                <Box>{(change_percentage_24_hrs).toFixed(2)}%, </Box>
                                                                <Box>{(change_24_hrs).toFixed(2)}</Box>
                                                            </Box>
                                                            <Box display='flex' alignItems='center' >
                                                                {change_percentage_24_hrs >= 0
                                                                    ? <ArrowDropUpIcon />
                                                                    : <ArrowDropDownIcon />
                                                                }
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box display='flex' gap='5px' alignItems='center' justifyContent='space-between' sx={{ color: `${change_percentage_day >= 0 ? '#68e768' : 'red'}` }}>
                                                            <Box display='flex' flexDirection='row' gap='5px'>
                                                                <Box>{(change_percentage_day).toFixed(2)}%, </Box>
                                                                <Box>{(change_day).toFixed(2)}</Box>
                                                            </Box>
                                                            <Box display='flex' alignItems='center' >
                                                                {change_percentage_day >= 0
                                                                    ? <ArrowDropUpIcon sx={{ height: '20px', width: '20px' }} />
                                                                    : <ArrowDropDownIcon sx={{ height: '20px', width: '20px' }} />
                                                                }
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </React.Fragment>
                    )
                }
            </Box>
        </Box >
    )
}

export default CryptoTable