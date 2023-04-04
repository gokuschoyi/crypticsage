import React from 'react'
import "./CourseDetails.css"
import { Box, Card, Typography } from "@mui/material"
const CourseDetails = () => {
    return (
        <Box id="course" className="course-container" >
            <Typography sx={{color:'white'}} fontWeight={300} fontSize="50px" letterSpacing="5px" variant="h1" pt={18}>COURSE DETAILS</Typography>
            <Box className="course-box">
                <Card className='course-card' sx={{ display: 'flex', backgroundColor:'#121212', flexDirection: 'column', width: '1000px', textAlign: 'start' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h4" fontWeight={400} className="padding-course" color="white">
                            The course will be divided into several modules, each covering a specific aspect of the financial market. For example:
                        </Typography>
                        <Box p={2}>
                            <ul sx={{ padding: '10px' }}>
                                <li>
                                    <Typography variant="h6" fontWeight={300} color="#e5e5e5" className="li-padding">
                                        Introduction to Crypto and Stocks: The basics of how crypto and stock markets work, the differences and similarities, the most relevant market actors and how the market is impacted by external factors
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="h6" fontWeight={300} color="#e5e5e5" className="li-padding">
                                        Crypto Analysis and Trading Strategies: An in-depth look into the crypto market, different types of analysis used to evaluate crypto assets, how to develop a trading strategy and how to use different trading tools.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="h6" fontWeight={300} color="#e5e5e5" className="li-padding">
                                        Stocks Analysis and Trading Strategies: Understanding the stock market, different methods of analysis, how to evaluate stocks and how to create a stock trading plan.
                                    </Typography>
                                </li>
                                <li>
                                    <Typography variant="h6" fontWeight={300} color="#e5e5e5">
                                        Risk Management and Portfolio construction: How to evaluate risk, the importance of diversification, how to create a balanced portfolio and how to manage a portfolio over time.
                                    </Typography>
                                </li>
                            </ul>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex' }}>
                        <Typography variant="h5" fontWeight={400} className="padding-course" textAlign="justify" color="white">
                            Each module will include a mix of video lectures, readings, and interactive activities. The video lectures will be taught by expert instructors and will provide a deep understanding of the topic. The readings will consist of articles, whitepapers, and books that will provide more detailed information on the subject. The interactive activities will include quizzes, simulations, and assignments that will help students to apply the concepts they have learned.
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex' }}>
                        <Typography variant="h5" fontWeight={400} className="padding-course" textAlign="justify" color="white">
                            Students will also have access to real-time market data and simulation tools to practice their skills, which will help them to better understand how the market works and how different strategies can be applied in real-world scenarios.
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex' }}>
                        <Typography variant="h5" fontWeight={400} className="padding-course" textAlign="justify" color="white">
                            The course will also include access to a community forum where students can ask questions, share insights and connect with other learners. This will provide an opportunity to learn from peers and to network with other individuals who have an interest in crypto and stock trading.
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex' }}>
                        <Typography variant="h5" fontWeight={400} className="padding-course" textAlign="justify" color="white">
                            In addition to all of this, the course will include personalized dashboard where students can track their progress, set goals and evaluate their performance. This will allow them to identify areas where they need more practice, plan their learning and measure their progress over time.
                        </Typography>
                    </Box>
                </Card>
            </Box>
        </Box>
    )
}

export default CourseDetails