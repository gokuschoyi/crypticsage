import React from 'react'
import './Signup.css'
import { Box, Typography, TextField, Button, IconButton, useTheme, Grid } from '@mui/material'
import Logo from '../../../assets/logoNew.png'
import FacebookIcon from '@mui/icons-material/Facebook';
import GoogleIcon from '@mui/icons-material/Google';
import { useNavigate } from 'react-router-dom';
import Animation from '../animation/Animation';
const Signup = (props) => {
    const { switchState } = props
    const navigate = useNavigate()
    const theme = useTheme()
    const redirectToHome = () => {
        navigate('/')
    }
    return (
        <Box className='signup-container'>
            <Box className='logo-container'>
                <Box display="flex" justifyContent="start">
                    <Box pt={2} ml={2}>
                        <img src={Logo} alt="logo" className="logo" onClick={redirectToHome} />
                    </Box>
                </Box>
            </Box>
            <Box className='signup-box'>
                <Grid className='grid-container' container spacing={2}>
                    <Grid className="animation-grid-signup"item xs={12} sm={6}>
                        <Box className="signup-box">
                            <Box className="signup-container-left">
                                <Box className="login-title">
                                    <Typography variant="h1" fontWeight="300" sx={{ letterSpacing: '4px' }}>Signup</Typography>
                                </Box>
                                <Box className="input-filed-box" display="flex" flexDirection="column">
                                    <TextField sx={{ padding: '10px' }} id="outlined-username" label="Username" variant="outlined" type='text' />
                                    <TextField sx={{ padding: '10px' }} id="outlined-email" label="Email" variant="outlined" type='text' />
                                    <TextField sx={{ padding: '10px' }} id="outlined-mobileNumber" label="Mobile Number" variant="outlined" type='text' />
                                    <TextField sx={{ padding: '10px' }} id="outlined-password" label="Password" variant="outlined" type='password' />
                                </Box>


                                <Button className='signup-button' variant="contained" sx={{
                                    ':hover': {
                                        color: 'black !important',
                                        backgroundColor: 'white !important'
                                    }
                                }}>SIGN UP</Button>
                                <Box className='signup-box' justifyContent="center" display="flex">
                                    <Typography className='signup-start' variant='div' fontWeight="300" sx={{ letterSpacing: '4px' }}>Already have an account? <span className="signup" onClick={switchState} > Login </span></Typography>
                                </Box>
                                <Box className="icon-box">
                                    <Box className="footer-icon">
                                        <IconButton aria-label="facebook" sx={{ color: `${theme.palette.text.primary}` }}>
                                            <FacebookIcon />
                                        </IconButton>
                                    </Box>
                                    <Box className="footer-icon">
                                        <IconButton aria-label="facebook" sx={{ color: `${theme.palette.text.primary}` }}>
                                            <GoogleIcon />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid className='animation-grid-signup' item xs={12} sm={6}>
                        <Box className='login-model-signup'>
                            <Animation />
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </Box>
    )
}

export default Signup