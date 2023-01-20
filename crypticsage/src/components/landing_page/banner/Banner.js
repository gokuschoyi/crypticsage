import React from 'react'
import { Box, useTheme, Grid, Button, Typography } from "@mui/material"
import Maincomp from "../../../assets/Main_Comp.png"
import "./Banner.css"
const Banner = () => {
    const theme = useTheme();
    return (
        <Box className="banner-container" id='home'>
            <Grid
                container
                direction="row"
                justifyContent="center"
                alignItems="center" p={8}
                spacing={2}
            >
                <Grid item xs={12} sm={6} md={4} lg={4} className="grid-col-left">
                    <Typography pb={4} variant='h1' sx={{ textAlign: 'start' }}>Master the Market: Learn Crypto and Stocks Today.</Typography>
                    <Typography pb={4} variant='h5' sx={{ textAlign: 'start' }}>Unlock the potential of the financial market with our comprehensive course.</Typography>
                    <Button className="grid-col-button-left " pb={4} style={{ color: `${theme.palette.primary.main}`, backgroundColor: `${theme.palette.secondary.main}` }} variant="contained" sx={{
                        ':hover': {
                            color: 'black !important',
                            backgroundColor: 'white !important'
                        }
                    }} >Get Started</Button>
                </Grid>
                <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: 'end' }}>
                    {/* <img className='img-container' src={Maincomp} alt="banner" /> */}
                </Grid>
            </Grid>
        </Box>
    )
}

export default Banner