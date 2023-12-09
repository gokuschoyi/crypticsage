import React from 'react'
import { Box, Typography, Button } from '@mui/material'
const UploadTradingViewDataCard = (props) => {
    const { title, subtitle, buttonName } = props
    return (
        <Box className='card-trading-view-data hover'>
            <Box className='info-box'>
                <Typography variant='h4' textAlign='start' gutterBottom>
                    {title} :
                </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: '300', textAlign: 'left' }} gutterBottom>
                    {subtitle}
                </Typography>
            </Box>
            <Box className='action-box'>
                <Button className='card-button' variant='outlined' size="small">{buttonName}</Button>
            </Box>
        </Box>
    )
}

export default UploadTradingViewDataCard