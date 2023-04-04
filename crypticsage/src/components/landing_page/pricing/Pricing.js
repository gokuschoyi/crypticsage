import React from 'react'
import './Pricing.css'
import { Box, Card, Typography, IconButton } from "@mui/material"
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
const Pricing = () => {
    return (
        <Box id="pricing" className="pricing-container" sx={{ backgroundColor: `black` }}>
            <Typography sx={{color:'white'}} fontWeight={300} fontSize="50px" letterSpacing="5px" variant="h1" pt={18}>PRICING</Typography>
            <Box className="pricing-box">
                <Card sx={{ backgroundColor:'#121212', display: 'flex', width: '800px', textAlign: 'justify' }} className="pricing-card">
                    <Typography variant="h5" fontWeight={300} className="padding-price" color="#fafafa">
                        The course offered is a comprehensive, well-structured, and interactive program that provides an in-depth introduction to the crypto and stock markets. It covers everything from the basics to advanced strategies, interactive lessons, quizzes, simulations, and real-time market data to help students understand the market and develop a plan. It is taught by expert instructors who can provide valuable insights and guidance, with a community forum where students can ask questions, share insights and connect with other learners. The course includes lifetime access to the course materials, updates and a personalized dashboard to track progress and set goals. With an attractive price, different subscription options and made more accessible by offering a payment plan option, this course is an excellent resource for anyone looking to gain a deeper understanding of crypto and stock trading, whether you're a beginner or an experienced trader.
                        As such you can get this course for 200Rs
                    </Typography>
                </Card>
            </Box>
            <Box className="get-to-top">
                <IconButton
                    aria-label="delete"
                    size='large'
                    sx={{
                        backgroundColor: 'white', color: 'black',
                        ':hover': { backgroundColor: 'red', color: 'white' }
                    }}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    <ExpandLessIcon />
                </IconButton>
            </Box>
        </Box>
    )
}

export default Pricing