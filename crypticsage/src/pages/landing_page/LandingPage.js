import React, { useEffect, useState } from 'react'
import { Box, useTheme } from '@mui/material'
import useMediaQuery from '@mui/material/useMediaQuery';

import './LandingPage.css'
// import AnimationScript from '../../components/landing_page/animation/AnimationScript'
// import ParallaxStar from '../../components/landing_page/animation/ParallaxStar'

import { Navbar, Banner, Features, CourseDetails, Testimonials, Pricing, Footer, ParallaxStar } from '../../components/landing_page/index'
const LandingPage = () => {
    const theme = useTheme();
    const lg = useMediaQuery(theme.breakpoints.down('lg'));
    const [toggle, setToggle] = useState(false);
    const showNav = () => {
        setToggle((prev) => !prev);
    }

    const closeNav = () => {
        setToggle(false);
    }

    useEffect(() => {
        if (!lg) {
            setToggle(false);
        }
    }, [lg])


    return (
        <>
            <div className="animation-container">
                <ParallaxStar />
            </div>
            <div className='main'>
                <Navbar toggle={toggle} setToggle={showNav} />
                <Box className='content' onClick={closeNav}>
                    <Banner />
                    <Features />
                    <CourseDetails />
                    <Testimonials />
                    <Pricing />
                    <Footer />
                </Box>
            </div>
        </>
    )
}

export default LandingPage