import React from 'react'
import { Box, Typography } from '@mui/material'
const CustomLongCard = (props) => {
    const { title, content, subtitle, link } = props
    return (
        <Box className='card-holder-long hover'>
            <Box className='info-box'>
                <Typography sx={{ fontSize: 20, fontWeight: '500', textAlign: 'left' }} gutterBottom>
                    {title} :
                </Typography>
                <Typography sx={{ fontSize: 20, fontWeight: '300', textAlign: 'left', marginBottom: '0px' }} gutterBottom>
                    {content}
                </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: '300', textAlign: 'left' }} gutterBottom>
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