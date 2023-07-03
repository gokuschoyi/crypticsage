import React, { useRef, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux';
import { ArrowDropUpIcon, ArrowDropDownIcon, AutorenewIcon } from '../../../global/Icons';
import { getLatestCryptoData } from '../../../../../api/crypto'
import { convert, getLastUpdatedTimeString, getDateTime } from '../../../../../utils/Utils'
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
} from '@mui/material'
const CryptoTable = () => {
    const theme = useTheme()
    const tableHeight = 500;
    const dispatch = useDispatch();

    //<------ table logic ------>//
    const token = useSelector(state => state.auth.accessToken);
    const [cryptoData, setCryptoData] = useState([]);

    // get latest crypto data
    const loadedRef = useRef(false);
    useEffect(() => {
        let data = {
            token: token,
        }
        if (!loadedRef.current) {
            loadedRef.current = true;
            getLatestCryptoData(data)
                .then((res) => {
                    setCryptoData(res.data.cryptoData)
                })
        }
    })

    const [order, setOrder] = React.useState('asc');
    const [orderBy, setOrderBy] = React.useState('market_cap_rank');

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
        const sortedArray = cryptoData.sort((a, b) => {
            if (order === 'asc') {
                return a[orderBy] - b[orderBy];
            } else {
                return b[orderBy] - a[orderBy];
            }
        })
        return sortedArray;
    }, [cryptoData, order, orderBy])

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
                setCryptoData(res.data.cryptoData)
                refreshIcon.classList.remove('rotate-icon');
            })
    }

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
                            <Box className='last-updated-date-refresh' pl={1} pr={1} height='60px' display='flex' alignItems='center' gap='10px'>
                                <Box>
                                    <Box display='flex' flexDirection='row' gap='5px'>
                                        <Typography fontSize='12px' fontWeight={600} color={theme.palette.text.secondary}>Last Updated : </Typography>
                                        <Typography fontSize='12px' fontWeight={600} color={theme.palette.text.secondary}>{getLastUpdatedTimeString(cryptoData[0].last_updated)}</Typography>
                                    </Box>
                                    <Box display='flex' justifyContent='flex-start'>
                                        <Typography fontSize='12px' fontWeight={600} color={theme.palette.text.secondary}>{getDateTime(cryptoData[0].last_updated)}</Typography>
                                    </Box>
                                </Box>
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
                            <TableContainer sx={{ maxHeight: tableHeight }}>
                                <Table stickyHeader aria-label="sticky table" >
                                    <TableHead>
                                        <TableRow>
                                            <TableCell style={{ borderLeft: '1px solid white', minWidth: '186px' }}>
                                                <TableSortLabel
                                                    active={orderBy === 'market_cap_rank'}
                                                    direction={orderBy === 'market_cap_rank' ? order : 'asc'}
                                                    onClick={createSortHandler("market_cap_rank")}
                                                >
                                                    NAME
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell style={{ minWidth: '90px' }}>MKT CAP</TableCell>
                                            <TableCell style={{ minWidth: '108px' }}>FD MKT CAP</TableCell>
                                            <TableCell>PRICE</TableCell>
                                            <TableCell style={{ minWidth: '148px' }}>H / L</TableCell>
                                            <TableCell>MEDIAN</TableCell>
                                            <TableCell style={{ minWidth: '110px' }}>COINS</TableCell>
                                            <TableCell style={{ minWidth: '120px' }}>
                                                <TableSortLabel
                                                    active={orderBy === 'change_percentage_24_hrs'}
                                                    direction={orderBy === 'change_percentage_24_hrs' ? order : 'asc'}
                                                    onClick={createSortHandler("change_percentage_24_hrs")}
                                                >
                                                    % 24H
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell style={{ minWidth: '100px' }}>
                                                <TableSortLabel
                                                    active={orderBy === 'change_percentage_day'}
                                                    direction={orderBy === 'change_percentage_day' ? order : 'asc'}
                                                    onClick={createSortHandler("change_percentage_day")}
                                                >
                                                    % DAY
                                                </TableSortLabel>
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {cryptoData.map((row, index) => {
                                            const {
                                                market_cap_rank,
                                                image_url,
                                                id,
                                                name,
                                                symbol,
                                                market_cap,
                                                fd_market_cap,
                                                current_price,
                                                high_24h,
                                                low_24h,
                                                median,
                                                supply,
                                                max_supply,
                                                change_percentage_24_hrs,
                                                change_24_hrs,
                                                change_percentage_day,
                                                change_day
                                            } = row;
                                            return (
                                                <TableRow hover key={index} className={`row-id ${index}`}>
                                                    <TableCell align='left' className='crypto-name'>
                                                        <Box display='flex' flexDirection='row' gap='5px' className='crypto-content'>
                                                            <Box display='flex' flexDirection='row' gap='5px' alignItems='center' >
                                                                <Typography fontSize='10px' fontWeight={600}>{market_cap_rank}</Typography>
                                                                <img src={image_url} loading='lazy' alt={id} width='20px' height='20px' />
                                                                {name}
                                                            </Box>
                                                            <Box display='flex' alignItems='center'>
                                                                <Typography fontSize='10px' fontWeight={600}>({symbol})</Typography>
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>{convert(market_cap)}</TableCell>
                                                    <TableCell>{convert(fd_market_cap)}</TableCell>
                                                    <TableCell>{(current_price).toFixed(6)}</TableCell>
                                                    <TableCell>{(high_24h).toFixed(2)} / {(low_24h).toFixed(2)}</TableCell>
                                                    <TableCell>{(median).toFixed(3)}</TableCell>
                                                    <TableCell>{convert(supply)} {max_supply > 0 ? `of ${convert(max_supply)}` : ''}</TableCell>
                                                    <TableCell>
                                                        <Box display='flex' gap='5px' alignItems='center'>
                                                            <Box display='flex' width='65px' alignItems='center' sx={{ color: `${change_percentage_24_hrs >= 0 ? '#68e768' : 'red'}` }}>
                                                                {change_percentage_24_hrs >= 0
                                                                    ? <ArrowDropUpIcon />
                                                                    : <ArrowDropDownIcon />
                                                                }
                                                                <Box>{(change_percentage_24_hrs).toFixed(2)}%, </Box>
                                                            </Box>
                                                            <Box sx={{ color: `${theme.palette.primary.newWhite}` }}>
                                                                {(change_24_hrs).toFixed(2)}$
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Box display='flex' gap='5px' alignItems='center'>
                                                            <Box display='flex' width='65px' sx={{ color: `${change_percentage_day >= 0 ? '#68e768' : 'red'}` }}>
                                                                {change_percentage_day >= 0
                                                                    ? <ArrowDropUpIcon sx={{ height: '20px', width: '20px' }} />
                                                                    : <ArrowDropDownIcon sx={{ height: '20px', width: '20px' }} />
                                                                }
                                                                <Box>{(change_percentage_day).toFixed(2)}%, </Box>
                                                            </Box>
                                                            <Box sx={{ color: `${theme.palette.primary.newWhite}` }}>
                                                                {(change_day).toFixed(2)}$
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
        </Box>



    )
}

export default CryptoTable