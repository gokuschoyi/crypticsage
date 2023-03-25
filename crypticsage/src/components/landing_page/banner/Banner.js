import React, { useRef, useEffect } from 'react'
import { useNavigate } from "react-router-dom";
import { Box, Grid, Button, Typography } from "@mui/material"
// import Maincomp from "../../../assets/Main_Comp.png"
import Typed from 'typed.js';
import "./Banner.css"
import WordGlobe from '../animation/WordGlobe';
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
    const navigate = useNavigate();
    const handleClick = () => {
        navigate('auth');
    }

    return (
        <Box className="banner-container" sx={{ backgroundColor: `#00000080` }} id='home'>
            <Grid
                container
                direction="row"
                justifyContent="center"
                alignItems="center" p={8}
                spacing={2}
                className="banner-grid-container"
            >
                <Grid item xs={12} sm={12} md={6} lg={5} className="grid-col-left">
                    <Typography className='banner-text' pb={4} variant='h1' fontSize='50px' fontWeight='400' sx={{ textAlign: 'start', color: 'white' }}>Master the Market: Learn Crypto and Stocks Today.</Typography>
                    <p style={{height:'65px'}}>
                        <span
                            style={{
                                fontSize: '20px',
                                fontWeight: '400',
                                textAlign: 'start',
                                color: 'white'
                            }}
                            ref={el}>
                            </span>
                    </p>

                    <Button onClick={handleClick} className="grid-col-button-left " pb={4} style={{ color: 'white', backgroundColor: 'red' }} variant="contained" sx={{
                        ':hover': {
                            color: 'black !important',
                            backgroundColor: 'white !important'
                        }
                    }} >Get Started</Button>
                </Grid>
                <Grid className="banner-animation-container" item xs={12} sm={12} md={6} lg={6} sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Box className="banner-animation-model">
                        <WordGlobe />
                    </Box>    
                
                {/* <img className='img-container' src={Maincomp} alt="banner" /> */}
                </Grid>
            </Grid>
        </Box>
    )
}

export default Banner