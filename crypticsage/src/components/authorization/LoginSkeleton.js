import { Box, Skeleton, Grid } from '@mui/material'
import React from 'react'

const LoginSkeleton = () => {
    return (
        <Grid className='grid-container' container spacing={2}>
            <Grid item xs={12} sm={12} md={12} lg={6}>
                <Box width='100%' height='100vh' display='flex' justifyContent='center' alignItems='center'>
                    <Box width='400px' backgroundColor='#2c2929' borderRadius='10px' padding='5px'>
                        <Box display='flex' flexDirection='column' justifyContent='center' alignItems='center'>
                            <Box display='flex' justifyContent='flex-start' width='100%' ml={4}>
                                <Skeleton variant="text" width={210} sx={{ fontSize: '3rem' }} />
                            </Box>
                            <Skeleton variant="text" width={350} sx={{ fontSize: '2.5rem' }} />
                            <Skeleton variant="text" width={350} sx={{ fontSize: '2.5rem' }} />
                        </Box>
                        <Box display='flex' justifyContent='center'>
                            <Skeleton variant="text" width={150} sx={{ fontSize: '1.5rem' }} />
                        </Box>
                        <Box display='flex' justifyContent='center' pt={6}>
                            <Skeleton variant="text" width={120} sx={{ fontSize: '2.5rem' }} />
                        </Box>
                        <Box display='flex' justifyContent='center' pt={6}>
                            <Skeleton variant="text" width={350} sx={{ fontSize: '1rem' }} />
                        </Box>
                        <Box display='flex' justifyContent='center' flexDirection='row' pt={4} gap='20px'>
                            <Skeleton variant="circular" width={50} height={50} />
                            <Skeleton variant="circular" width={50} height={50} />
                        </Box>
                    </Box>
                </Box>
            </Grid>
            <Grid className='animation-grid' item xs={12} sm={12} md={12} lg={6}>

            </Grid>
        </Grid>
    )
}

export default LoginSkeleton