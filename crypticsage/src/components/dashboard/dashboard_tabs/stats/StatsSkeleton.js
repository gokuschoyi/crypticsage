import { Box, Skeleton, Grid } from '@mui/material'
import React from 'react'

const StatsSkeleton = () => {
    return (
        <Box
            display='flex'
            flexDirection='column'
            justifyContent='center'
            alignItems='center'
            p={2}
            borderRadius={2}
        >
            <Box display='flex' justifyContent='flex-start' flexDirection='column' width='100%'>
                <Skeleton variant="text" width={350} sx={{ fontSize: '4rem', bgcolor: '#565353' }} />
                <Skeleton variant="text" width={300} sx={{ fontSize: '2.5rem', bgcolor: '#565353' }} />
            </Box>
            <Grid container spacing={4}>
                <Grid item xs={12} sm={12} md={12} lg={6} xl={12}>
                    <Grid container spacing={2} display='flex' justifyContent='center'>
                        <Grid item xs={12} sm={12} md={6} lg={6} xl={3} className='single-card-grid'>
                            <Skeleton sx={{ bgcolor: '#565353' }} variant="rounded" width='100%' height={220} />
                        </Grid>
                        <Grid item xs={12} sm={12} md={6} lg={6} xl={3} className='single-card-grid'>
                            <Skeleton sx={{ bgcolor: '#565353' }} variant="rounded" width='100%' height={220} />
                        </Grid>
                        <Grid item xs={12} sm={12} md={6} lg={6} xl={3} className='single-card-grid'>
                            <Skeleton sx={{ bgcolor: '#565353' }} variant="rounded" width='100%' height={220} />
                        </Grid>
                        <Grid item xs={12} sm={12} md={6} lg={6} xl={3} className='single-card-grid'>
                            <Skeleton sx={{ bgcolor: '#565353' }} variant="rounded" width='100%' height={220} />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={6} xl={12}>
                    <Skeleton sx={{ bgcolor: '#565353' }} variant="rounded" width='100%' height={457} />
                </Grid>
            </Grid>
            <Grid container spacing={2} pt={4}>
                <Grid item xs={12} sm={12} md={12} lg={6}>
                    <Skeleton sx={{ bgcolor: '#565353' }} variant="rounded" width='100%' height={220} />
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={6}>
                    <Skeleton sx={{ bgcolor: '#565353' }} variant="rounded" width='100%' height={220} />
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={6}>
                    <Skeleton sx={{ bgcolor: '#565353' }} variant="rounded" width='100%' height={220} />
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={6}>
                    <Skeleton sx={{ bgcolor: '#565353' }} variant="rounded" width='100%' height={220} />
                </Grid>
            </Grid>
        </Box>
    )
}

export default StatsSkeleton