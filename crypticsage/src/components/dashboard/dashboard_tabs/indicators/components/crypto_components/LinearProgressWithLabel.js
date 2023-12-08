import React from 'react'
import { Box, LinearProgress, Typography } from '@mui/material'
const LinearProgressWithLabel = (props) => {
    const color = 'red'
    return (
        <Box ref={props.cRef} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} id='custom-linear-progress'>
            <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress id='linear-progress' color='secondary' sx={{ backgroundColor: `${color}` }} variant="determinate" value={0} />
            </Box>
            <Box sx={{ minWidth: 140, textAlign: 'end' }}>
                <Typography variant="custom" sx={{ fontWeight: '600', fontSize: '0.7rem' }} color="text.secondary" id='batch-count'>{props.type} : </Typography>
            </Box>
        </Box>
    );
}

export default LinearProgressWithLabel