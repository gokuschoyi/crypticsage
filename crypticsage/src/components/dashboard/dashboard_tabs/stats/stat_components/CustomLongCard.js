import React from 'react'
import { Box, Typography } from '@mui/material'
const CustomLongCard = (props) => {
    const { title, content, subtitle, link } = props
    return (
        <Box className='card-holder-long hover'>
            <Box className='info-box'>
                <Typography variant='h4' sx={{ fontWeight: '500', textAlign: 'left' }} gutterBottom>
                    {title} :
                </Typography>
                <Typography variant='h5' sx={{ fontWeight: '300', textAlign: 'left', marginBottom: '0px' }} gutterBottom>
                    {content}
                </Typography>
                <Typography variant='h5' sx={{ fontWeight: '300', textAlign: 'left' }} gutterBottom>
                    {subtitle}
                </Typography>
            </Box>
            <Box className='action-box'>
                <a href={link} target='_blank' rel="noreferrer">Read More</a>
            </Box>
        </Box>
    )
}

export default CustomLongCard