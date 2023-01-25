import React from 'react'
import './Login.css'
import { Box, Typography, TextField, Button, IconButton, useTheme, Grid } from '@mui/material'
import FacebookIcon from '@mui/icons-material/Facebook';
import GoogleIcon from '@mui/icons-material/Google';
import Logo from '../../../assets/logoNew.png'
import { useNavigate } from 'react-router-dom';
import Animation from '../animation/Animation';
const Login = (props) => {
    const { switchState } = props
    const theme = useTheme()
    const navigate = useNavigate()
    
    const redirectToHome = () => {
        navigate('/')
    }

    const toDashboard = () => {
        navigate('/dashboard')
    }

    const [fPassword, setFPassword] = React.useState(false)
    const handleFPassword = () => {
        setFPassword(!fPassword)
    }

    return (
        <Box className='login-container'>
            <Box className='logo-container'>
                <Box display="flex" justifyContent="start">
                    <Box pt={2} ml={2}>
                        <img src={Logo} alt="logo" className="logo" onClick={redirectToHome} />
                    </Box>
                </Box>
            </Box>
            <Box className='login-box'>
                <Grid className='grid-container' container spacing={2}>
                    <Grid item xs={12} sm={12} md={12}  lg={6}>
                        <Box className='login-box'>
                            {!fPassword ?
                                <Box className="login-container-left">
                                    <Box className="login-title">
                                        <Typography variant="h1" fontWeight="300" sx={{ letterSpacing: '4px' }}>Login</Typography>
                                    </Box>
                                    <Box className="input-filed-box" display="flex" flexDirection="column">
                                        <TextField sx={{ padding: '10px' }} id="outlined-username" label="Username" variant="outlined" type='text' />
                                        <TextField sx={{ padding: '10px' }} id="outlined-basic" label="Password" variant="outlined" type='password' />
                                    </Box>
                                    <Box className='forgotpassword-box' justifyContent="end" display="flex">
                                        <Typography onClick={handleFPassword} className="forgot-password" variant='a' fontWeight="300" sx={{ letterSpacing: '4px' }}>Forgot Password?</Typography>
                                    </Box>

                                    <Button onClick = {toDashboard}className='login-button' variant="contained" sx={{
                                        ':hover': {
                                            color: 'black !important',
                                            backgroundColor: 'white !important'
                                        }
                                    }}>LOGIN</Button>
                                    <Box className='signup-box' justifyContent="center" display="flex">
                                        <Typography className='signup-start' variant='div' fontWeight="300" sx={{ letterSpacing: '4px' }}>Don't have an Account? <span className="signup" onClick={switchState} >Signup Now </span></Typography>
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
                                :
                                <Box className="login-container-left">
                                    <Box className="login-title">
                                        <Typography variant="h1" fontWeight="300" sx={{ letterSpacing: '4px' }}>Forgot Password</Typography>
                                    </Box>
                                    <Box className="input-filed-box" display="flex" flexDirection="column">
                                        <TextField sx={{ padding: '10px' }} id="outlined-basic" label="Enter your Email" variant="outlined" type='email' />
                                    </Box>
                                    <Box className='forgotpassword-box' justifyContent="end" display="flex">
                                        <Typography onClick={handleFPassword} className="forgot-password" variant='a' fontWeight="300" sx={{ letterSpacing: '4px' }}>Login</Typography>
                                    </Box>
                                    <Button className='reset-button' variant="contained" sx={{
                                        ':hover': {
                                            color: 'black !important',
                                            backgroundColor: 'white !important'
                                        }
                                    }}>Submit</Button>
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
                            }
                        </Box>
                    </Grid>
                    <Grid className='animation-grid' item xs={12} sm={12} md ={12} lg={6}>
                        <Box className='login-model'>
                            <Animation />
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </Box >
    )
}

export default Login