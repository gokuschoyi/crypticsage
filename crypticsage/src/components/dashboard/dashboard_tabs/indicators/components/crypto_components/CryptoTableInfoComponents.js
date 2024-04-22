import {
    Box
    , Typography
    , Table
    , TableBody
    , TableCell
    , TableSortLabel
    , TableContainer
    , TableHead
    , TableRow
    , Paper
    , IconButton
    , FormControl
    , InputLabel
    , Select
    , MenuItem
    , Tooltip
    , Grid
    , Link
    , useTheme
    , useMediaQuery
} from '@mui/material'

import {
    getLastUpdatedTimeString
    , getDateTime
    , getCurrencySymbol
    , convert
} from '../../../../../../utils/Utils'

import {
    AutorenewIcon
    , ShowChartIcon
    , InfoOutlinedIcon
    , ArrowDropUpIcon
    , ArrowDropDownIcon
} from '../../../../global/Icons'

import {
    setSelectedTickerName
    , resetDataLoadedState
    , resetShowSettingsFlag
    , setCryptoDataInDbRedux
} from '../../modules/CryptoModuleSlice'

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export const CurrencySelectorAndRefresh = ({
    currency
    , handleCurrencyChange
    , availableCurrencyList
    , refreshCryptoData
}) => {
    const [open, setOpen] = React.useState(false);
    // handles open for select
    const handleOpen = () => {
        setOpen(true);
    };

    // handles close for select
    const handleClose = () => {
        setOpen(false);
    };
    return (
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
    )
}

export const StatsLegend = ({ latestUpdatedDate }) => {
    const theme = useTheme()
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    return (
        <Box className='last-updated-status-legend' display='flex' flexDirection='row' alignItems='baseline' gap={2}>
            <Box className='last-updated' display='flex' alignItems='baseline' gap='10px'>
                <Box>
                    <Box display='flex' flexDirection='row' gap='5px'>
                        <Typography fontSize='10px' fontWeight={500} color={theme.palette.primary.main}>Updated : </Typography>
                        <Typography fontSize='10px' fontWeight={500} color={theme.palette.primary.main}>{getLastUpdatedTimeString(latestUpdatedDate)}</Typography>
                    </Box>
                    <Box display='flex' justifyContent='flex-start'>
                        <Typography fontSize='10px' fontWeight={500} color={theme.palette.primary.main}>{getDateTime(latestUpdatedDate)}</Typography>
                    </Box>
                </Box>
            </Box>
            {sm &&
                <Box className='status-legend' display='flex' flexDirection='column' >
                    <Box display='flex' flexDirection='row' gap={'10px'} alignItems='center'>
                        <Box height='8px' width='8px'
                            style={{
                                borderRadius: '8px',
                                backgroundColor: 'green'
                            }} />
                        <Typography linespacing='1.5' fontSize='10px' fontWeight={400} color={theme.palette.text.primary}>Data Available</Typography>
                    </Box>
                    <Box display='flex' flexDirection='row' gap={'10px'} alignItems='center'>
                        <Box height='8px' width='8px'
                            style={{
                                borderRadius: '8px',
                                backgroundColor: 'orange'
                            }} />
                        <Typography linespacing='1.5' fontSize='10px' fontWeight={400} color={theme.palette.text.primary}>To Fetch</Typography>
                    </Box>
                    <Box display='flex' flexDirection='row' gap={'10px'} alignItems='center'>
                        <Box height='8px' width='8px'
                            style={{
                                borderRadius: '8px',
                                backgroundColor: 'red'
                            }} />
                        <Typography linespacing='1.5' fontSize='10px' fontWeight={400} color={theme.palette.text.primary}>Data Un-Available</Typography>
                    </Box>
                </Box>
            }
        </Box>
    )
}

export const CustomTable = ({ selectedTickerToLoad, currency, cryptoPreferences, cryptoData, setCryptoData, handleTickerInfoLoad }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { order: rOrder, orderBy: rOrderBy } = cryptoPreferences
    const selectedToken = useSelector(state => state.cryptoModule.selectedTickerName);
    const selectedTickerPeriod = useSelector(state => state.cryptoModule.selectedTickerPeriod);
    const defaultTickerPeriod = '4h' // Default ticker period. Should be the same as in the redux state 
    const [order, setOrder] = React.useState(rOrder);
    const [orderBy, setOrderBy] = React.useState(rOrderBy);
    const currencySymbol = getCurrencySymbol(currency)

    // Sets the order and orderBy states
    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        // dispatch(setCryptoPreferencesRedux({ cryptoPreferences: { ...cryptoPreferences, order: isAsc ? 'desc' : 'asc', orderBy: property } }))
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    // handler for sorting the table. Calls handleRequestSort to set the order and orderBy states
    const createSortHandler = (property) => (event) => {
        handleRequestSort(event, property);
    };

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

    // sorting logic    
    useEffect(() => {
        if (cryptoData.length > 0) {
            // console.log('UE : sorting')
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
            // dispatch(setCryptoDataRedux({ cryptoData: sortedArray }))
            setCryptoData(sortedArray);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [order, orderBy, currency]);

    return (
        <TableContainer className='table-main-meta'>
            <Table stickyHeader aria-label="sticky table" >
                <TableHead>
                    <TableRow>
                        <TableCell style={{ borderLeft: '1px solid white', minWidth: '300px' }}>
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
                            <TableRow
                                selected={selectedTickerToLoad === symbol}
                                hover
                                key={index}
                                className={`row-id ${index}`}
                            >
                                <TableCell align='left' className='crypto-name'>
                                    <Box
                                        display='flex'
                                        flexDirection='row'
                                        alignItems='center'
                                        justifyContent='space-between'
                                        gap='5px'
                                        className={matchedSymbol !== null && dataInDb ? 'crypto-content' : ''}
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
                                        <Box display='flex' alignItems='center' gap={1}>
                                            <Tooltip title={matchedSymbol !== null && dataInDb ? 'Go to chart' : matchedSymbol !== null && !dataInDb ? 'Data unavailable in Db' : 'Data unavailable in binance'} placement='left' arrow>
                                                <IconButton
                                                    aria-label="show chart"
                                                    size="small"
                                                    data-id={matchedSymbol !== null && dataInDb ? matchedSymbol : null}
                                                    onClick={(e) => {
                                                        const dataId = e.currentTarget.getAttribute('data-id')
                                                        handleTokenPageLoad(dataId)
                                                    }}
                                                    style={{
                                                        color: matchedSymbol !== null && dataInDb
                                                            ? 'green'
                                                            : matchedSymbol !== null && !dataInDb
                                                                ? 'orange'
                                                                : 'red'
                                                    }}
                                                >
                                                    <ShowChartIcon id='show-chart' className='smaller-icon' />
                                                </IconButton>
                                            </Tooltip>
                                            <IconButton
                                                aria-label="show chart info"
                                                size="small"
                                                disabled={selectedTickerToLoad === symbol ? true : false}
                                                data-id={matchedSymbol !== null && dataInDb ? matchedSymbol : symbol}
                                                onClick={(e) => {
                                                    const dataId = e.currentTarget.getAttribute('data-id')
                                                    handleTickerInfoLoad(dataId)
                                                }}
                                            >
                                                <InfoOutlinedIcon id='show-info' className='smaller-icon' />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </TableCell>
                                <TableCell>{convert(market_cap)}</TableCell>
                                <TableCell>{convert(fd_market_cap)}</TableCell>
                                <TableCell>{(current_price).toFixed(2)}</TableCell>
                                <TableCell>{(high_24h).toFixed(2)} / {(low_24h).toFixed(2)}</TableCell>
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
    )
}

export const BasicBox = ({ data: basic }) => {
    const theme = useTheme()
    const tickerData = useSelector(state => state.indicators.cryptoData)
    const currency = useSelector(state => state.indicators.cryptoPreferences.currency)
    const ticker_to_show = tickerData.filter((ticker) => ticker.name.toLowerCase() === basic.name.toLowerCase())[0]
    // console.log(ticker_to_show)
    const price_data = ticker_to_show.prices[currency]
    // console.log(price_data)
    // console.log(basic.asset_description)
    const {
        change_24_hrs
        , change_percentage_24_hrs
        , current_price
        , high_24h
        , low_24h
    } = price_data
    return (
        <Box className='basic-box'>
            <Grid container spacing={1}>
                <Grid item xs={12} sm={12} md={4} lg={4} xl={4}>
                    <Box display='flex' flexDirection='column' gap={1}>
                        <Box display={'flex'} flexDirection={'row'} alignItems={'flex-start'}>
                            <Typography variant='h4' fontWeight={600}>{basic.name}</Typography>
                        </Box>
                        <Paper elevation={2} className='basic-box-paper'>
                            <Box display={'flex'} flexDirection='row' alignItems='center'>
                                <img src={basic.logo_url} loading='lazy' alt={basic.name} width='50px' height='50px' />
                                <Box display={'flex'} flexDirection={'column'} alignItems={'start'}>
                                    <Typography sx={{ fontSize: 22, fontWeight: '300', textAlign: 'left', marginBottom: '0px' }} gutterBottom>
                                        {current_price.toFixed(2)}
                                    </Typography>
                                    <Box className='token-diff-box'>
                                        <Typography className='change_24_hrs' sx={{ fontSize: 14, fontWeight: '600', textAlign: 'left', color: change_24_hrs > 0 ? `${theme.palette.success.main}` : `${theme.palette.primary.main}` }} gutterBottom>
                                            {change_24_hrs.toFixed(2)}
                                        </Typography>
                                        {change_24_hrs > 0 ? <ArrowDropUpIcon sx={{ color: `${theme.palette.success.main}` }} /> : <ArrowDropDownIcon sx={{ color: `${theme.palette.primary.main}` }} />}
                                        <Typography sx={{ fontSize: 14, fontWeight: '600', textAlign: 'left', color: change_percentage_24_hrs < 0 ? `${theme.palette.primary.main}` : `${theme.palette.success.main}` }} gutterBottom>
                                            {`${change_percentage_24_hrs.toFixed(2)}%`}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                            <Box display={'flex'} flexDirection={'column'} >
                                <Box className='high-low-box' gap={1}>
                                    <Box sx={{ padding: '0px 5px' }} className='center-col' title='24H High'>
                                        <Typography sx={{ margin: '0px', fontSize: 11, fontWeight: '500', textAlign: 'left' }} gutterBottom>
                                            H 24h
                                        </Typography>
                                        <Typography sx={{ margin: '0px', fontSize: 11, fontWeight: '500', textAlign: 'left' }} gutterBottom>
                                            {high_24h.toFixed(2)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ padding: '0px 5px' }} className='center-col' title='24H Low'>
                                        <Typography sx={{ margin: '0px', fontSize: 11, fontWeight: '500', textAlign: 'left' }} gutterBottom>
                                            L 24h
                                        </Typography>
                                        <Typography sx={{ margin: '0px', fontSize: 11, fontWeight: '500', textAlign: 'left' }} gutterBottom>
                                            {low_24h.toFixed(2)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Box>
                            <Box pl={'4px'} pt={1} display={'flex'} flexDirection={'column'} alignItems='flex-start'>
                                <Typography fontSize='12px' fontWeight={600}>Updated date : {new Date(basic.updated_on * 1000).toDateString()}</Typography>
                                <Typography fontSize='12px' fontWeight={600}>Launch Date : {new Date(basic.launch_date * 1000).toDateString()}</Typography>
                                <Typography fontSize='12px' fontWeight={600}>Created Date : {new Date(basic.created_on * 1000).toDateString()}</Typography>
                                <Box display='flex' flexDirection='row' alignItems='felx-start' gap="4px">
                                    <Typography fontSize='12px' fontWeight={600}>Website : </Typography>
                                    <a href={basic.website} style={{ fontSize: '12px', textDecoration: 'none', color: `${theme.palette.primary.main}` }}>{basic.website}</a>
                                </Box>
                                <Typography fontSize='12px' fontWeight={600}>Asset Type : {basic.asset_type}</Typography>
                            </Box>
                        </Paper>
                    </Box>
                </Grid>

                <Grid item xs={12} sm={12} md={8} lg={8} xl={8}>
                    <Box display={'flex'} flexDirection={'column'} alignItems={'start'}>
                        <Typography variant='h4' fontWeight={600}>Summary</Typography>
                        <Typography fontSize='12px' fontWeight={600} textAlign={'justify'}>{basic.asset_short_description}</Typography>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    )
}

export const SupplyBox = ({ data: supply }) => {
    const theme = useTheme()
    return (
        <Box className='supply-box'>
            <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                <Typography sx={{ color: theme.palette.primary.main }} variant='h5' fontWeight={600}>Supply</Typography>
            </Box>

            <Box className='supply-elements' >
                <Typography fontSize='12px' fontWeight={600}>Total : {supply.total >= 0 ? supply.total : 'N/A'}</Typography>
                <Typography fontSize='12px' fontWeight={600}>Max : {supply.max >= 0 ? supply.max : 'N/A'}</Typography>
                <Typography fontSize='12px' fontWeight={600}>Issued : {supply.issued >= 0 ? supply.issued : 'N/A'}</Typography>
                <Typography fontSize='12px' fontWeight={600}>Future : {supply.future >= 0 ? supply.future : 'N/A'}</Typography>
                <Typography fontSize='12px' fontWeight={600}>Circulating : {supply.circulating >= 0 ? supply.circulating : 'N/A'}</Typography>
                <Typography fontSize='12px' fontWeight={600}>Staked : {supply.staked >= 0 ? supply.staked : 'N/A'}</Typography>
                <Typography fontSize='12px' fontWeight={600}>Locked : {supply.locked >= 0 ? supply.locked : 'N/A'}</Typography>
                <Typography fontSize='12px' fontWeight={600}>Burnt : {supply.burnt >= 0 ? supply.burnt : 'N/A'}</Typography>
            </Box>
        </Box>
    )
}

export const LayerTwoSolutionsBox = ({ data: layer_two_solutions }) => {
    const theme = useTheme()
    const is_data_present = layer_two_solutions.length >= 1 ? true : false
    return (
        <Box className='layer-two-solutions-box'>
            <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                <Typography
                    variant='h5'
                    fontWeight={600}
                    color={is_data_present ? theme.palette.primary.main : theme.palette.text.disabled}
                >
                    Layer Two Solutions {is_data_present ? '' : ' - Data Unavailable'}
                </Typography>
            </Box>
            <Grid container spacing={1}>
                {layer_two_solutions.length >= 1 &&
                    layer_two_solutions.map((solution, index) => {
                        const { category, description, name, website_url } = solution
                        return (
                            <Grid key={index} item xs={12} sm={6} md={6} lg={6} xl={3}>
                                <Paper elevation={8} className='solution-box' sx={{ height: '100%' }}>
                                    <Box display={'flex'} flexDirection={'column'} alignItems={'start'} p={1}>
                                        <Typography variant='h6'>{index + 1} : {name}</Typography>
                                        <Box display={'flex'} flexDirection={'column'} alignItems={'start'} gap={'4px'}>
                                            <Typography fontSize='12px' fontWeight={600}>Category : {category}</Typography>
                                            <Typography fontSize='12px' fontWeight={600}>Web : <Link href={website_url} target='_blank' rel='noreferrer'>{website_url}</Link></Typography>
                                            <Typography fontSize='12px' textAlign={'justify'} fontWeight={600}>Description : {description}</Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>
                        )
                    })
                }
            </Grid>
        </Box>
    )
}

export const PrivacySolutionsBox = ({ data: privacy_solutions }) => {
    const theme = useTheme()
    const is_data_present = privacy_solutions.length >= 1 ? true : false
    return (
        <Box className='privacy-soluions-box'>
            <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                <Typography
                    variant='h5'
                    fontWeight={600}
                    color={is_data_present ? theme.palette.primary.main : theme.palette.text.disabled}
                >
                    Privacy Solutions {is_data_present ? '' : ' - Data Unavailable'}
                </Typography>
            </Box>
            <Grid container spacing={1}>
                {privacy_solutions.length >= 1 &&
                    privacy_solutions.map((solution, index) => {
                        const { description, name, website_url } = solution
                        return (
                            <Grid key={index} item xs={12} sm={6} md={6} lg={6} xl={3}>
                                <Paper elevation={8} className='privacy-box' sx={{ height: '100%' }}>
                                    <Box display={'flex'} flexDirection={'column'} alignItems={'start'} p={1}>
                                        <Typography variant='h6'>{index + 1} : {name}</Typography>
                                        <Box display={'flex'} flexDirection={'column'} alignItems={'start'} gap={'4px'}>
                                            <Typography className='info-url' fontSize='12px' fontWeight={600}>Web : <Link href={website_url} target='_blank' rel='noreferrer'>{website_url}</Link></Typography>
                                            <Typography fontSize='12px' textAlign={'justify'} fontWeight={600}>Description : {description}</Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>
                        )
                    })
                }
            </Grid>
        </Box>
    )
}

export const TradingSignalsBox = ({ data: trading_signals }) => {
    const theme = useTheme()
    const is_data_present = trading_signals.data.length >= 1 ? true : false
    return (
        <Box className='trading-signals-box'>
            <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                <Typography
                    variant='h5'
                    fontWeight={600}
                    color={is_data_present ? theme.palette.primary.main : theme.palette.text.disabled}
                >
                    Trading Signals {is_data_present ? '' : ' - Data Unavailable'}
                </Typography>
                <Typography
                    variant='h5'
                    fontWeight={600}
                    color={is_data_present ? theme.palette.primary.main : theme.palette.text.disabled}
                >
                    {trading_signals.time !== undefined ? `as of ${new Date(trading_signals.time * 1000).toDateString()}` : ''}
                </Typography>
            </Box>
            <Grid container spacing={1}>
                {trading_signals.data.length >= 1 &&
                    trading_signals.data.map((signal, index) => {
                        const { key, data } = signal
                        const {
                            category,
                            score,
                            score_threshold_bearish,
                            score_threshold_bullish,
                            sentiment,
                            value
                        } = data
                        return (
                            <Grid key={key} item xs={12} sm={6} md={4} lg={4} xl={3}>
                                <Paper elevation={8} className='signal-box'>
                                    <Box display={'flex'} flexDirection={'column'} alignItems={'start'} p={1}>
                                        <Typography variant='h6'>{key.toUpperCase()}</Typography>
                                        <Box display={'flex'} flexDirection={'column'} alignItems={'start'}>
                                            <Typography fontSize='12px' fontWeight={600}>Category : {category}</Typography>
                                            <Typography fontSize='12px' fontWeight={600}>Score : {score}</Typography>
                                            <Typography fontSize='12px' fontWeight={600}>Score Threshold Bearish : {score_threshold_bearish}</Typography>
                                            <Typography fontSize='12px' fontWeight={600}>Score Threshold Bullish : {score_threshold_bullish}</Typography>
                                            <Typography fontSize='12px' fontWeight={600}>Sentiment : {sentiment}</Typography>
                                            <Typography fontSize='12px' fontWeight={600}>Value : {value}</Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>
                        )
                    })
                }
            </Grid>
        </Box>
    )
}

export const LeadersBox = ({ data: leaders }) => {
    const theme = useTheme()
    const is_data_present = leaders.length >= 1 ? true : false
    return (
        <Box className='leaders-box'>
            <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                <Typography
                    variant='h5'
                    fontWeight={600}
                    color={is_data_present ? theme.palette.primary.main : theme.palette.text.disabled}
                >
                    Leaders {is_data_present ? '' : ' - Data Unavailable'}
                </Typography>
            </Box>
            <Grid container spacing={1}>
                {leaders.length >= 1 &&
                    leaders.map((leader, index) => {
                        const { full_name, leader_type } = leader
                        return (
                            <Grid key={index} item xs={12} sm={6} md={4} lg={4} xl={3}>
                                <Paper elevation={8} className='leader-box'>
                                    <Box display={'flex'} flexDirection={'column'} alignItems={'start'} p={1}>
                                        <Typography variant='h6'>{full_name}, {leader_type}</Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        )
                    })
                }
            </Grid>
        </Box>
    )
}

export const HashAlgorithmBox = ({ data: hash_algorithm }) => {
    const theme = useTheme()
    const is_data_present = hash_algorithm.length >= 1 ? true : false
    return (
        <Box className='hash-algorithm-box'>
            <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                <Typography
                    variant='h5'
                    fontWeight={600}
                    color={is_data_present ? theme.palette.primary.main : theme.palette.text.disabled}
                >
                    Hash Algorithm {is_data_present ? '' : ' - Data Unavailable'}
                </Typography>
            </Box>
            <Grid container spacing={1}>
                {hash_algorithm.length >= 1 &&
                    hash_algorithm.map((algo, index) => {
                        const { NAME } = algo
                        return (
                            <Grid key={index} item xs={12} sm={6} md={4} lg={4} xl={3}>
                                <Paper elevation={8} className='algo-box'>
                                    <Box display={'flex'} flexDirection={'column'} alignItems={'start'} p={1}>
                                        <Typography variant='h6'>{NAME}</Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        )
                    })
                }
            </Grid>
        </Box>
    )
}

export const AssetIndustriesBox = ({ data: asset_industries }) => {
    const theme = useTheme()
    const is_data_present = asset_industries.length >= 1 ? true : false
    return (
        <Box className='asset-industries-box'>
            <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                <Typography
                    variant='h5'
                    fontWeight={600}
                    color={is_data_present ? theme.palette.primary.main : theme.palette.text.disabled}
                >
                    Asset Industries {is_data_present ? '' : ' - Data Unavailable'}
                </Typography>
            </Box>
            <Grid container spacing={1}>
                {asset_industries.length >= 1 &&
                    asset_industries.map((industry, index) => {
                        const { asset_industry } = industry
                        return (
                            <Grid key={index} item xs={12} sm={6} md={4} lg={4} xl={3}>
                                <Paper elevation={8} className='industry-box'>
                                    <Box display={'flex'} flexDirection={'column'} alignItems={'start'} p={1}>
                                        <Typography variant='h6'>{asset_industry}</Typography>
                                    </Box>
                                </Paper>
                            </Grid>
                        )
                    })
                }
            </Grid>
        </Box>
    )
}

export const AlgorithmTypesBox = ({ data: algorithm_types }) => {
    const theme = useTheme()
    const is_data_present = algorithm_types.length >= 1 ? true : false
    return (
        <Box className='algorithm-types-box'>
            <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                <Typography
                    variant='h5'
                    fontWeight={600}
                    color={is_data_present ? theme.palette.primary.main : theme.palette.text.disabled}
                >
                    Algorithm Types {is_data_present ? '' : ' - Data Unavailable'}
                </Typography>
            </Box>
            <Grid container spacing={1}>
                {algorithm_types.length >= 1 &&
                    algorithm_types.map((leader, index) => {
                        const { description, name } = leader
                        return (
                            <Grid key={index} item xs={12} sm={6} md={4} lg={6} xl={3}>
                                <Paper elevation={8} className='algorithm-box'>
                                    <Box display={'flex'} flexDirection={'column'} alignItems={'start'} p={1}>
                                        <Typography variant='h6'>{index + 1} : {name}</Typography>
                                        <Box display={'flex'} flexDirection={'column'} alignItems={'start'} gap={'4px'}>
                                            <Typography fontSize='12px' textAlign={'justify'} fontWeight={600}>Description : {description}</Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>
                        )
                    })
                }
            </Grid>
        </Box>
    )
}

export const AssetSecurityMetrics = ({ data: asset_security_metrics }) => {
    const theme = useTheme()
    const is_data_present = asset_security_metrics.length >= 1 ? true : false
    return (
        <Box className='asset-security-metrics-box'>
            <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                <Typography
                    variant='h5'
                    fontWeight={600}
                    color={is_data_present ? theme.palette.primary.main : theme.palette.text.disabled}
                >
                    Asset Security Metrics {is_data_present ? '' : ' - Data Unavailable'}
                </Typography>
            </Box>
            <Grid container spacing={1}>
                {asset_security_metrics.length >= 1 &&
                    asset_security_metrics.map((metric, index) => {
                        const { NAME, OVERALL_RANK, OVERALL_SCORE, UPDATED_AT } = metric
                        return (
                            <Grid key={index} item xs={12} sm={6} md={4} lg={4} xl={3}>
                                <Paper elevation={8} className='security-metric-box'>
                                    <Box display={'flex'} flexDirection={'column'} alignItems={'start'} p={1}>
                                        <Typography variant='h6'>{NAME}</Typography>
                                        <Box display={'flex'} flexDirection={'column'} alignItems={'start'} gap={'4px'}>
                                            <Typography fontSize='12px' fontWeight={600}>Overall Rank : {OVERALL_RANK}</Typography>
                                            <Typography fontSize='12px' fontWeight={600}>Overall Score : {OVERALL_SCORE}</Typography>
                                            <Typography fontSize='12px' fontWeight={600}>Updated At : {new Date(UPDATED_AT * 1000).toDateString()}</Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>
                        )
                    })
                }
            </Grid>
        </Box>
    )
}