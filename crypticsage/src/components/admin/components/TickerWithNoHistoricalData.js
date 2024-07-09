import React from 'react'
import {
    Box
    , Typography
    , IconButton
    , Tooltip
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/Download';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const TickerWithNoHistoricalData = ({ ticker, handleUpdateBianceTicker, handleDeleteTickerMeta, downloadFlag }) => {
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
                                <IconButton className='small-icon-button' size='small' aria-label="update" color="secondary" onClick={handleUpdateBianceTicker.bind(null, { ticker_name, type: "fullfetch" })}>
                                    <DownloadIcon className='small-icon' />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete ticker" placement='bottom'>
                                <IconButton className='small-icon-button' size='small' aria-label="update" color="secondary" onClick={handleDeleteTickerMeta.bind(null, { type: "noHistData", symbol })} >
                                    <DeleteOutlineIcon className='small-icon' />
                                </IconButton>
                            </Tooltip>
                        </Box>
                        :
                        <Box>
                            <Tooltip title="Delete ticker" placement='bottom'>
                                <IconButton className='small-icon-button' size='small' aria-label="update" color="secondary" onClick={handleDeleteTickerMeta.bind(null, { type: "noBinanceData", symbol })}>
                                    <DeleteOutlineIcon className='small-icon' />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    }

                </Box>
            </Box>
            <Box className='hist-meta' ml={1} mt={1}>
                <Box display='flex' flexDirection='column' justifyContent='flex-start' alignItems='start' gap='5px'>
                    <Typography variant='admin_stats'>ID : {id}</Typography>
                    <Typography variant='admin_stats'>Symbol : {symbol} ({ticker_name === null ? 'N/A' : ticker_name})</Typography>
                    <Typography variant='admin_stats'>Ticker : {ticker_name === null ? 'N/A' : ticker_name}</Typography>
                    <Typography variant='admin_stats'>Max Supply : {max_supply < 0 ? 'N/A' : max_supply}</Typography>
                    <Typography variant='admin_stats'>Launch Date : {asset_launch_date}</Typography>
                </Box>
            </Box>
        </Box>
    )
}

export default TickerWithNoHistoricalData