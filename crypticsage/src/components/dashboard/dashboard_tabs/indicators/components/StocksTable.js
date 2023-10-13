import React, { useRef, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux';
import { getLatestStocksData } from '../../../../../api/crypto'
import { convert, getLastUpdatedTimeString, getDateTime } from '../../../../../utils/Utils'
import { ArrowDropUpIcon, ArrowDropDownIcon, AutorenewIcon } from '../../../global/Icons';
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
    , Collapse
} from '@mui/material'

import { setStocksDataRedux } from '../IndicatorsSlice'
import { setSelectedStockName, resetStateOnStockNameChange } from '../modules/StockModuleSlice'
import { useNavigate } from 'react-router-dom';

function Row(props) {
    const { row, handleStocksPageLoad } = props;
    const [openMore, setOpenMore] = React.useState(false);
    const switchCollapse = (e) => {
        setOpenMore((prev) => !prev)
    }

    const {
        symbol
        , open
        , high
        , low
        , divident_rate
        , divident_yield
        , five_year_avg_dividend_yield
        , market_cap
        , fiftyTwoWeekLow
        , fiftyTwoWeekHigh
        , enterpriseValue
        , pegRatio
        , currentQuarterEstimate
        , total_revenue
        , ebitda
        , total_cash
        , gross_profit
        , free_cashflow
        , operating_cashflow
        , total_debt
        , debt_to_equity
        , rev_growth
    } = row;
    return (
        <React.Fragment>
            <TableRow hover className={`row-id ${symbol}`}>
                <TableCell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={(e) => switchCollapse(e)}
                    >
                        {openMore ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell className='stocks-name'>
                    <Box className='stocks-content' data-id={symbol}
                        onClick={(e) => {
                            const dataId = e.currentTarget.getAttribute('data-id')
                            handleStocksPageLoad(dataId)
                        }}
                    >
                        {symbol}
                    </Box>
                </TableCell>
                <TableCell >
                    <Box>
                        <Box display='flex' gap='5px'>
                            <Box> O : <span className='stock-data'>{open},</span></Box>
                            <Box>H : <span className='stock-data'>{high},</span></Box>
                            <Box>L : <span className='stock-data'>{low}</span></Box>
                        </Box>
                    </Box>
                </TableCell>
                <TableCell >
                    <Box display='flex' flexDirection='row' gap='5px'>
                        <Box>H : <span className='stock-data'>{fiftyTwoWeekHigh},</span></Box>
                        <Box>L : <span className='stock-data'>{fiftyTwoWeekLow}</span></Box>
                    </Box>
                </TableCell>
                <TableCell >
                    <Box display='flex' flexDirection='row' gap='5px'>
                        <Box>MKT CAP : <span className='stock-data'>{convert(market_cap)},</span></Box>
                        <Box>ENT VAL : <span className='stock-data'>{convert(enterpriseValue)}</span></Box>
                    </Box>
                </TableCell>

                <TableCell sx={{ color: `${pegRatio >= 0 ? '#68e768' : 'red'}` }}>
                    <Box display='flex' flexDirection='row' gap='5px' alignItems='center'>
                        {pegRatio >= 0
                            ? <ArrowDropUpIcon />
                            : <ArrowDropDownIcon />
                        }
                        {pegRatio}
                    </Box>
                </TableCell>
                <TableCell sx={{ color: `${currentQuarterEstimate >= 0 ? '#68e768' : 'red'}` }}>
                    <Box display='flex' flexDirection='row' gap='5px' alignItems='center'>
                        {currentQuarterEstimate >= 0
                            ? <ArrowDropUpIcon />
                            : <ArrowDropDownIcon />
                        }
                        {currentQuarterEstimate}
                    </Box>
                </TableCell>
                <TableCell sx={{ color: `${rev_growth >= 0 ? '#68e768' : 'red'}` }}>
                    <Box display='flex' flexDirection='row' gap='5px' alignItems='center'>
                        {rev_growth >= 0
                            ? <ArrowDropUpIcon />
                            : <ArrowDropDownIcon />
                        }
                        {rev_growth}
                    </Box>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={12}>
                    <Collapse in={openMore} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom fontWeight='600' component="div">
                                DETAILS
                            </Typography>
                            <Table size="small" aria-label="purchases">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>CASH</TableCell>
                                        <TableCell style={{ minWidth: '180px' }}>DIVIDEND</TableCell>
                                        <TableCell>DEBT</TableCell>
                                        <TableCell>REVENUE</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    <TableRow>
                                        <TableCell >
                                            <Box display='flex' flexDirection='column'>
                                                <Box display='flex' flexDirection='column'>
                                                    <Box>TOTAL CASH : <span className='stock-data'>{convert(total_cash)}</span></Box>
                                                    <Box>GROSS PROFIT : <span className='stock-data'>{convert(gross_profit)}</span></Box>
                                                </Box>
                                                <Box display='flex' flexDirection='column'>
                                                    <Box>FCF : <span className='stock-data'>{convert(free_cashflow)}</span></Box>
                                                    <Box>OCF : <span className='stock-data'>{convert(operating_cashflow)}</span></Box>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell >
                                            <Box display='flex' alignItems='flex-start' flexDirection='column'>
                                                <Box>
                                                    DIVIDEND : {divident_rate === 'N/A' ? <span className='stock-data'>{divident_rate}</span> : <span className='stock-data'>{divident_rate}%</span>}
                                                </Box>
                                                <Box display='flex' flexDirection='column'>
                                                    <Box>DIVIDEND YIELD : <span className='stock-data'>{divident_yield}</span></Box>
                                                    <Box>5Y AVG DIVIDEND : <span className='stock-data'>{five_year_avg_dividend_yield}</span></Box>
                                                </Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell >
                                            <Box display='flex' gap='5px' flexDirection='column'>
                                                <Box>DEBT : <span className='stock-data'>{convert(total_debt)}</span></Box>
                                                <Box>D to E : <span className='stock-data'>{convert(debt_to_equity)}</span></Box>
                                            </Box>
                                        </TableCell>
                                        <TableCell >
                                            <Box display='flex' gap='5px' flexDirection='column'>
                                                <Box>REV : <span className='stock-data'>{convert(total_revenue)}</span></Box>
                                                <Box>EBITDA : <span className='stock-data'>{convert(ebitda)}</span></Box>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    )
}

const StocksTable = () => {
    const theme = useTheme()
    const tableHeight = 500;

    const dispatch = useDispatch();
    const navigate = useNavigate();

    //<------ table logic ------>//
    const token = useSelector(state => state.auth.accessToken);
    const [stockData, setStockData] = useState([]);
    const [fetchedTime, setFetchedTime] = useState('');
    const stockDataInRedux = useSelector(state => state.indicators.stocksData)

    // get latest stocks data
    const loadedRef = useRef(false);
    useEffect(() => {
        if (!loadedRef.current && stockDataInRedux.length === 0) {
            console.log('UE : Stocks info fetch')
            loadedRef.current = true;
            let data = {
                token: token,
            }
            getLatestStocksData(data)
                .then((res) => {
                    const time = Math.floor(Date.now() / 1000)
                    setFetchedTime(time);
                    setStockData(res.data.yFData)
                    dispatch(setStocksDataRedux(res.data.yFData))
                })
        } else {
            console.log('UE : Stocks info fetch from redux')
            let reduxCopy = [...stockDataInRedux]
            setStockData(reduxCopy)
        }
    }, [stockDataInRedux, token, dispatch])

    const [order, setOrder] = React.useState('asc');
    const [orderBy, setOrderBy] = React.useState('market_cap');

    const handleRequestSort = (event, property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const createSortHandler = (property) => (event) => {
        handleRequestSort(event, property);
    };

    //<------ table logic ------>//

    //useMemo to sort data. Also the vlaue of cryptoData is changed in this hook
    React.useMemo(() => {
        const sortedArray = stockData.sort((a, b) => {
            if (order === 'asc') {
                return a[orderBy] - b[orderBy];
            } else {
                return b[orderBy] - a[orderBy];
            }
        })
        return sortedArray;
    }, [stockData, order, orderBy])

    const refreshStockData = () => {
        console.log("refreshing stock data")
        const refreshIcon = document.getElementById('refresh-icon');
        refreshIcon.classList.add('rotate-icon');
        let data = {
            token: token,
        }
        getLatestStocksData(data)
            .then((res) => {
                // setStockData(res.data.yFData)
                dispatch(setStocksDataRedux(res.data.yFData))
                const time = Math.floor(Date.now() / 1000)
                setFetchedTime(time);
                refreshIcon.classList.remove('rotate-icon');
            })
    }

    const selectedStock = useSelector(state => state.stockModule.selectedStock)
    const handleStocksPageLoad = (dataId) => {
        console.log('handleStocksPageLoad : ', dataId)
        if (dataId !== null) {
            if (dataId === selectedStock) {
                navigate(`/dashboard/indicators/stocks/${dataId}`)
            } else { // reset state when stock name in redux and selected dont match
                dispatch(setSelectedStockName(dataId))
                dispatch(resetStateOnStockNameChange())
                navigate(`/dashboard/indicators/stocks/${dataId}`)
            }
        }
    }

    return (
        <Box className='stock-container'>
            <Box className='stocks-details-table' mr={4} ml={4}>
                {stockData.length === 0 ?
                    (
                        <Box className='skeleton-box' sx={{ height: `${tableHeight}px`, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Skeleton animation="wave" variant="rounded" sx={{ position: 'absolute', bgcolor: '#3f3f40', width: '95%', height: '95%' }} />
                        </Box>
                    )
                    :
                    (
                        <React.Fragment>
                            <Box className='last-updated-date-refresh' pl={1} pr={1} height='60px' display='flex' alignItems='center' gap='10px'>
                                <Box>
                                    <Box display='flex' flexDirection='row' gap='5px'>
                                        <Typography fontSize='12px' fontWeight={600} color={theme.palette.text.secondary}>Last Updated : </Typography>
                                        <Typography fontSize='12px' fontWeight={600} color={theme.palette.text.secondary}>{getLastUpdatedTimeString(fetchedTime)}</Typography>
                                    </Box>
                                    <Box display='flex' justifyContent='flex-start'>
                                        <Typography fontSize='12px' fontWeight={600} color={theme.palette.text.secondary}>{getDateTime(fetchedTime)}</Typography>
                                    </Box>
                                </Box>
                                <Box>
                                    <IconButton
                                        aria-label="refresh crypto data"
                                        size="small"
                                        onClick={refreshStockData}
                                    >
                                        <AutorenewIcon id='refresh-icon' sx={{ width: '20px', height: '20px' }} />
                                    </IconButton>
                                </Box>
                            </Box>
                            <TableContainer sx={{ maxHeight: tableHeight }}>
                                <Table stickyHeader aria-label="sticky table" >
                                    <TableHead>
                                        <TableRow>
                                            <TableCell style={{ borderLeft: '1px solid white' }} />
                                            <TableCell style={{ minWidth: '80px' }}>NAME</TableCell>
                                            <TableCell style={{ minWidth: '225px' }}>
                                                <TableSortLabel
                                                    active={orderBy === 'open'}
                                                    direction={orderBy === 'open' ? order : 'asc'}
                                                    onClick={createSortHandler("open")}
                                                >
                                                    PRICE
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell style={{ minWidth: '160px' }}>
                                                <TableSortLabel
                                                    active={orderBy === 'fiftyTwoWeekHigh'}
                                                    direction={orderBy === 'fiftyTwoWeekHigh' ? order : 'asc'}
                                                    onClick={createSortHandler("fiftyTwoWeekHigh")}
                                                >
                                                    52 WEEK
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell style={{ minWidth: '250px' }}>
                                                <TableSortLabel
                                                    active={orderBy === 'market_cap'}
                                                    direction={orderBy === 'market_cap' ? order : 'asc'}
                                                    onClick={createSortHandler("market_cap")}
                                                >
                                                    MKT CAP
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell style={{ minWidth: '80px' }}>PEG</TableCell>
                                            <TableCell style={{ minWidth: '80px' }}>Q EST</TableCell>
                                            <TableCell style={{ minWidth: '140px' }}>
                                                <TableSortLabel
                                                    active={orderBy === 'rev_growth'}
                                                    direction={orderBy === 'rev_growth' ? order : 'asc'}
                                                    onClick={createSortHandler("rev_growth")}
                                                >
                                                    R GROWTH
                                                </TableSortLabel>
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {stockData.map((row, index) => {
                                            return (
                                                <Row row={row} key={index} handleStocksPageLoad={handleStocksPageLoad} />
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </React.Fragment>
                    )
                }
            </Box>
        </Box>
    )
}

export default StocksTable