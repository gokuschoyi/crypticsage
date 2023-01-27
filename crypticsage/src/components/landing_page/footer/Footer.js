import React from 'react'
import './Footer.css'
import Logo from '../../../assets/logoNew.png'
import { Box, Button, Typography, Card, Divider, IconButton, useTheme } from "@mui/material";
import useMediaQuery from '@mui/material/useMediaQuery';
import FacebookRoundedIcon from '@mui/icons-material/FacebookRounded';
import VideoLibraryRoundedIcon from '@mui/icons-material/VideoLibraryRounded';
import BurstModeRoundedIcon from '@mui/icons-material/BurstModeRounded';
const Footer = () => {
    const theme = useTheme();
    const md = useMediaQuery(theme.breakpoints.down('md'));
    return (
        <Box className="footer-container centering" >
            <Box sx={{ backgroundColor: `${theme.palette.primary.main}` }}>
                <Card sx={{
                    display: 'flex', justifyContent: 'center'
                }}>
                    <Box className="footer-firstpart" >
                        <Box pb={2}>
                            <Typography variant="h6" fontWeight={300} color="white">
                                JOIN OUR COURSE NOW
                            </Typography>
                        </Box>
                        <Box pb={1}>
                            <Typography variant="h1" fontWeight={300} color="white">
                                Request More Information
                            </Typography>
                        </Box>
                        <Box pb={2}>
                            <Typography variant="h5" fontWeight={300} color="white">
                                CrypticSage Media, LLC is a E-Learning platform which is developing a unique platform for learning stocks and trading.
                            </Typography>
                        </Box>
                        <Box pb={2}>
                            <Typography variant="h5" fontWeight={300} color="white">
                                <Button variant="outlined" style={{ color: 'white', backgroundColor: 'red', margin: '5px' }} sx={{
                                    ':hover': {
                                        color: 'black !important',
                                        backgroundColor: 'white !important'
                                    }
                                }}>
                                    Contact Us
                                </Button>
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight={300} color="white">
                                © 2023 CRYPTICSAGE, LLC
                            </Typography>
                        </Box>
                    </Box>
                </Card>
            </Box>
            <Divider />
            <Box className="footer-lower-container" sx={{ backgroundColor: `${theme.palette.primary.extraDark}`, flexDirection: md ? 'column' : 'row' }}>
                <Box className='logo-container'>
                    <img src={Logo} alt="logo" className="footer-logo" />
                </Box>
                <Box display="flex" flexDirection="row" className="footer-menu">
                    <ul className="footer-nav justify-content-center flex-grow-1" >
                        <li className="nav-item" >
                            <a className="nav-link" href="#team"><span>HOME</span></a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#CaseStudy"><span>WHAT IS</span></a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" href="#CaseStudy"><span>BLOGS</span></a>
                        </li>
                    </ul>
                </Box>
                <Box display="flex" flexDirection="row" className="social-icons">
                    <Box className="footer-icon">
                        <IconButton aria-label="facebook" sx={{ color: `${theme.palette.text.primary}` }}  >
                            <FacebookRoundedIcon />
                        </IconButton>
                    </Box>
                    <Box className="footer-icon">
                        <IconButton aria-label="facebook" sx={{ color: `${theme.palette.text.primary}` }}>
                            <VideoLibraryRoundedIcon />
                        </IconButton>
                    </Box>
                    <Box className="footer-icon">
                        <IconButton aria-label="facebook" sx={{ color: `${theme.palette.text.primary}` }}>
                            <BurstModeRoundedIcon />
                        </IconButton>
                    </Box>
                </Box>

            </Box>
        </Box>
    )
}

export default Footer