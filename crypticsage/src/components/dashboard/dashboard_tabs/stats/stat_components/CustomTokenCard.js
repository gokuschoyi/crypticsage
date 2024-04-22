import React from 'react'
import { Box, Typography, Paper, useTheme, IconButton, Tooltip } from '@mui/material'
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setSelectedTickerName, resetShowSettingsFlag, resetDataLoadedState, setCryptoDataInDbRedux } from '../../indicators/modules/CryptoModuleSlice';
import { ArrowDropDownIcon, ArrowDropUpIcon, ShowChartIcon } from '../../../global/Icons';
const CustomTokenCard = (props) => {
    const { title, price, image, price_change_24h, price_change_percentage_24h, market_cap_rank, high_24h, low_24h, symbol } = props
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const selectedToken = useSelector(state => state.cryptoModule.selectedTickerName);
    const theme = useTheme();

    const handleSymbolClick = ({ symbol }) => {
        if (symbol === 'N/A') return
        const redirectURL = `/dashboard/indicators/crypto/${symbol}/4h`
        if (symbol === selectedToken) {
            dispatch(resetShowSettingsFlag())
            navigate(redirectURL)
        } else {
            dispatch(setSelectedTickerName(symbol))
            dispatch(resetDataLoadedState())
            dispatch(resetShowSettingsFlag())
            dispatch(setCryptoDataInDbRedux({ dataInDb: [], total_count_db: 0 }))
            navigate(redirectURL)
        }
    }

    return (
        <Box className='card-holder-slider' >
            <Box className='info-box'>
                <Box className='token-box'>
                    {symbol !== 'N/A' ?
                        <Box className="underline-animation" display={'flex'} flexDirection='row' gap={1} justifyContent={'center'}>
                            <Typography variant='h5' sx={{ margin: '0px', fontSize: 20, fontWeight: '500', textAlign: 'left' }} gutterBottom>
                                {symbol !== 'N/A' ? symbol.toUpperCase() : title.toUpperCase()}
                            </Typography>
                            <IconButton size='small' aria-label="update" color="secondary" onClick={handleSymbolClick.bind(null, { symbol })}>
                                <Tooltip title="Go to ticker chart" placement='top'>
                                    <ShowChartIcon sx={{ width: '20px', height: '20px' }} />
                                </Tooltip>
                            </IconButton>
                        </Box>
                        :
                        <Typography variant='h5' sx={{ margin: '0px', fontSize: 20, fontWeight: '500', textAlign: 'left' }} gutterBottom>
                            {symbol !== 'N/A' ? symbol.toUpperCase() : title.toUpperCase()}
                        </Typography>
                    }
                    <Box display='flex' flexDirection='row' gap='1rem' alignContent='center' alignItems={'center'}>
                        {market_cap_rank &&
                            <Typography variant='h5' sx={{ margin: '0px', fontSize: 16, fontWeight: '300', textAlign: 'left' }} gutterBottom>
                                {market_cap_rank}
                            </Typography>
                        }
                        <img className='token-image' loading='lazy' src={`${image}`} alt={symbol} />
                    </Box>
                </Box>
                <Typography sx={{ fontSize: 25, fontWeight: '300', textAlign: 'left', marginBottom: '0px' }} gutterBottom>
                    {price}
                </Typography>
                <Box className='token-diff-box'>
                    <Typography className='price_change_24h' sx={{ fontSize: 16, fontWeight: '600', textAlign: 'left', color: price_change_24h > 0 ? `${theme.palette.success.main}` : `${theme.palette.primary.main}` }} gutterBottom>
                        {price_change_24h.toFixed(5)}
                    </Typography>
                    {price_change_24h > 0 ? <ArrowDropUpIcon sx={{ color: `${theme.palette.success.main}` }} /> : <ArrowDropDownIcon sx={{ color: `${theme.palette.primary.main}` }} />}
                    <Typography sx={{ fontSize: 16, fontWeight: '600', textAlign: 'left', color: price_change_percentage_24h < 0 ? `${theme.palette.primary.main}` : `${theme.palette.success.main}` }} gutterBottom>
                        {`${price_change_percentage_24h.toFixed(2)}%`}
                    </Typography>
                </Box>
                <Box className='high-low-box'>
                    <Paper elevation={4} sx={{ padding: '0px 5px' }} className='center-col'>
                        <Typography sx={{ margin: '0px', fontSize: 11, fontWeight: '500', textAlign: 'left' }} gutterBottom>
                            H 24h
                        </Typography>
                        <Typography sx={{ margin: '0px', fontSize: 11, fontWeight: '500', textAlign: 'left' }} gutterBottom>
                            {high_24h.toFixed(2)}
                        </Typography>
                    </Paper>
                    <Paper elevation={4} sx={{ padding: '0px 5px' }} className='center-col'>
                        <Typography sx={{ margin: '0px', fontSize: 11, fontWeight: '500', textAlign: 'left' }} gutterBottom>
                            L 24h
                        </Typography>
                        <Typography sx={{ margin: '0px', fontSize: 11, fontWeight: '500', textAlign: 'left' }} gutterBottom>
                            {low_24h.toFixed(2)}
                        </Typography>
                    </Paper>
                </Box>
            </Box>
            <Box className='action-box'>

            </Box>
        </Box>
    )
}

export default CustomTokenCard