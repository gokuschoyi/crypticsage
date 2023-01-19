import React from 'react'
import './LandingPage.css'
import AnimationScript from './AnimationScript'
import Navbar from '../components/landing_page/navbar/Navbar'
const LandingPage = () => {
    return (
        <>
            <div className="animation-container">
                <AnimationScript />
            </div>
            <div className='navbar'>
                <Navbar />
            </div>
        </>
    )
}

export default LandingPage