import React from 'react'
import { Box, Typography } from '@mui/material'
import { ArrowDropDownIcon, ArrowDropUpIcon } from '../../../global/Icons';
const CustomTokenCard = (props) => {
    const { title, price, image, price_change_24h, price_change_percentage_24h, market_cap_rank, high_24h, low_24h } = props
    return (
        <Box className='card-holder-slider' >
            <Box className='info-box'>
                <Box className='token-box'>
                    <Typography sx={{ fontSize: 20, fontWeight: '500', textAlign: 'left' }} gutterBottom>
                        {title.toUpperCase()}
                    </Typography>
                    <Box display='flex' flexBasis='row' gap='1rem'>
                        {market_cap_rank &&
                            <Box>
                                <Typography sx={{ fontSize: 16, fontWeight: '300', textAlign: 'left' }} gutterBottom>
                                    {market_cap_rank}
                                </Typography>
                            </Box>
                        }
                        <img className='token-image' loading='lazy' src={`${image}`} alt='crypto' />
                    </Box>
                </Box>
                <Typography sx={{ fontSize: 25, fontWeight: '300', textAlign: 'left', marginBottom: '0px' }} gutterBottom>
                    {price}
                </Typography>
                <Box className='token-diff-box'>
                    <Typography className='price_change_24h' sx={{ fontSize: 16, fontWeight: '600', textAlign: 'left', color: price_change_24h > 0 ? 'green' : 'red' }} gutterBottom>
                        {price_change_24h.toFixed(5)}
                    </Typography>
                    {price_change_24h > 0 ? <ArrowDropUpIcon sx={{ color: 'green' }} /> : <ArrowDropDownIcon sx={{ color: 'red' }} />}
                    <Typography sx={{ fontSize: 16, fontWeight: '600', textAlign: 'left', color: price_change_percentage_24h < 0 ? 'red' : 'green' }} gutterBottom>
                        {`${price_change_percentage_24h.toFixed(2)}%`}
                    </Typography>
                </Box>
                <Box className='high-low-box'>
                    <Box className='center-col'>
                        <Typography sx={{ fontSize: 14, fontWeight: '300', textAlign: 'left' }} gutterBottom>
                            H 24h
                        </Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: '300', textAlign: 'left' }} gutterBottom>
                            {high_24h}
                        </Typography>
                    </Box>
                    <Box className='center-col'>
                        <Typography sx={{ fontSize: 14, fontWeight: '300', textAlign: 'left' }} gutterBottom>
                            L 24h
                        </Typography>
                        <Typography sx={{ fontSize: 12, fontWeight: '300', textAlign: 'left' }} gutterBottom>
                            {low_24h}
                        </Typography>
                    </Box>
                </Box>
            </Box>
            <Box className='action-box'>

            </Box>
        </Box>
    )
}

export default CustomTokenCard