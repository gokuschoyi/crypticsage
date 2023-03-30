import React from 'react'
import { Box, Typography } from '@mui/material'
const UpdateQuiz = (props) => {
    const { value } = props;
    return (
        <Box>
            <Typography variant='h4' color='white' textAlign='start' >{value}</Typography>
        </Box>
    )
}

export default UpdateQuiz