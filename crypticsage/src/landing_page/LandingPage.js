import React from 'react'
import './LandingPage.css'
import AnimationScript from '../components/landing_page/animation/AnimationScript'
import ParallaxStar from '../components/landing_page/animation/ParallaxStar'
import Navbar from '../components/landing_page/navbar/Navbar'
import Banner from '../components/landing_page/banner/Banner'
import Features from '../components/landing_page/features/Features'
import CourseDetails from '../components/landing_page/course_details/CourseDetails'
import Testimonials from '../components/landing_page/testimonials/Testimonials';
import Pricing from '../components/landing_page/pricing/Pricing';
import Footer from '../components/landing_page/footer/Footer'
const LandingPage = () => {
    return (
        <>
            <div className="animation-container">
                <AnimationScript />
            </div>
            <div className='main'>
                <Navbar />
                <Banner />
                <Features />
                <CourseDetails />
                <Testimonials />
                <Pricing />
                <Footer />
            </div>
        </>
    )
}

export default LandingPage