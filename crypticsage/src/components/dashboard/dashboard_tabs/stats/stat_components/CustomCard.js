import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import { shortenDate } from '../../../../../utils/Utils.js';

const CustomCard = (props) => {
    const { title, date, value, buttonName, buttonHandler } = props
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
                <Button onClick={buttonHandler}  variant='outlined' size="small">{buttonName}</Button>
            </Box>
        </Box>
    )
};

export default CustomCard