import React, { useRef, useEffect } from 'react'
import { Box, useTheme, Grid, Button, Typography } from "@mui/material"
import Maincomp from "../../../assets/Main_Comp.png"
import Typed from 'typed.js';
import "./Banner.css"
const Banner = () => {
    const el = useRef(null);
    // Create reference to store the Typed instance itself
    const typed = useRef(null);

    useEffect(() => {
        const options = {
            strings: [
                'Learn from anywhere, anytime with our e-learning platform.',
                'Upgrade your skills with our online courses.',
                'Learn at your own pace with our online courses',
                'Revolutionize your learning experience with our e-platform.',
            ],
            typeSpeed: 100,
            backSpeed: 50,
            backDelay: 2000,
            shuffle: true,
            loop: true,
            loopCount: Infinity,
        };

        // elRef refers to the <span> rendered below
        typed.current = new Typed(el.current, options);

        return () => {
            // Make sure to destroy Typed instance during cleanup
            // to prevent memory leaks
            typed.current.destroy();
        }
    }, [])
    const theme = useTheme();
    return (
        <Box className="banner-container" sx={{ backgroundColor: `${theme.palette.primary.extraDark}` }} id='home'>
            <Grid
                container
                direction="row"
                justifyContent="center"
                alignItems="center" p={8}
                spacing={2}
            >
                <Grid item xs={12} sm={12} md={6} lg={5} className="grid-col-left">
                    <Typography pb={4} variant='h1' fontSize='50px' fontWeight='400' sx={{ textAlign: 'start' }}>Master the Market: Learn Crypto and Stocks Today.</Typography>
                    <p><span 
                        style={{
                            fontSize:'20px',
                            fontWeight:'400',
                            textAlign: 'start'
                        }}    
                    ref={el}></span></p>
                    
                    <Button className="grid-col-button-left " pb={4} style={{ color: `${theme.palette.primary.extraDark}`, backgroundColor: `${theme.palette.secondary.main}` }} variant="contained" sx={{
                        ':hover': {
                            color: 'black !important',
                            backgroundColor: 'white !important'
                        }
                    }} >Get Started</Button>
                </Grid>
                <Grid item xs={12} sm={12} md={6} lg={7} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <img className='img-container' src={Maincomp} alt="banner" />
                </Grid>
            </Grid>
        </Box>
    )
}

export default Banner