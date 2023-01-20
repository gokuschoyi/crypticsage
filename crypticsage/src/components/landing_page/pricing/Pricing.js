import React from 'react'
import './Pricing.css'
import { Box, Card, Typography } from "@mui/material"
const Pricing = () => {
    return (
        <Box id="pricing" className="pricing-container">
            <Typography fontWeight={300} variant="h1" pt={10}>Pricing</Typography>
            <Box className="pricing-box">
                <Card sx={{ display: 'flex', width: '800px', textAlign: 'justify' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h5" fontWeight={300} className="padding-price" color="white">
                            The course offered is a comprehensive, well-structured, and interactive program that provides an in-depth introduction to the crypto and stock markets. It covers everything from the basics to advanced strategies, interactive lessons, quizzes, simulations, and real-time market data to help students understand the market and develop a plan. It is taught by expert instructors who can provide valuable insights and guidance, with a community forum where students can ask questions, share insights and connect with other learners. The course includes lifetime access to the course materials, updates and a personalized dashboard to track progress and set goals. With an attractive price, different subscription options and made more accessible by offering a payment plan option, this course is an excellent resource for anyone looking to gain a deeper understanding of crypto and stock trading, whether you're a beginner or an experienced trader.
                            As such you can get this course for 200Rs
                        </Typography>
                    </Box>
                </Card>
            </Box>
        </Box>
    )
}

export default Pricing