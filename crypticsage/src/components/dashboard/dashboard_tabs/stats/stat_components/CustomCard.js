import React from 'react'
import { Box, useTheme, Typography, Button } from '@mui/material'
import { shortenDate } from '../../../../../utils/Utils.js';

const CustomCard = (props) => {
    const { title, date, value, buttonName, buttonHandler } = props
    const theme = useTheme()
    let formattedDate = shortenDate(date)
    return (
        <Box className='card-holder hover'>
            <Box className='info-box'>
                <Typography variant='h3' textAlign='start' gutterBottom>
                    {title} :
                </Typography>
                <Typography variant='h4' fontWeight='400' textAlign='start' gutterBottom>
                    {value}
                </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: '300', textAlign: 'left' }} gutterBottom>
                    {formattedDate}
                </Typography>
            </Box>
            <Box className='action-box'>
                <Button onClick={buttonHandler} className='card-button' sx={{
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
};

export default CustomCard