import React from 'react'
import { Box, Typography, Button, useTheme } from '@mui/material'
const UploadTradingViewDataCard = (props) => {
    const { title, subtitle, buttonName } = props
    const theme = useTheme()
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
                <Button className='card-button' sx={{
                    ':hover': {
                        color: 'black !important',
                        backgroundColor: 'red !important',
                        transition: '0.5s'
                    },
                    backgroundColor: `${theme.palette.background.default}`
                }} size="small">{buttonName}</Button>
            </Box>
        </Box>
    )
}

export default UploadTradingViewDataCard