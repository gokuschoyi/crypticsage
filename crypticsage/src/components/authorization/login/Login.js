import React, { useEffect, useState } from 'react'
import './Login.css'
import { Box, Typography, TextField, Button, IconButton, Grid, Alert, useTheme } from '@mui/material'
import Collapse from '@mui/material/Collapse';
import { CloseIcon, FacebookIcon } from '../../dashboard/global/Icons';
import Logo from '../../../assets/logoNew.png'
import { useNavigate } from 'react-router-dom';
import Animation from '../animation/Animation';

import { LoginSocialFacebook } from "reactjs-social-login";
import { GoogleLogin } from '@react-oauth/google';

import { useDispatch } from 'react-redux';
import { setAuthState } from '../authSlice';
import { LoginUser } from '../../../api/auth';
const Login = (props) => {
    const { switchState } = props
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const theme = useTheme()
    const redirectToHome = () => {
        navigate('/')
    }

    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const [fPassword, setFPassword] = useState(false)

    const initialLoginData = {
        email: '',
        password: '',
    }

    const [loginData, setLoginData] = React.useState(initialLoginData)
    const { email, password } = loginData

    const hideError = () => {
        setOpen(false);
        setError('')
    }

    useEffect(() => {
        if (error !== '') {
            setOpen(true)
        }
    }, [error])

    const handleFPassword = () => {
        setFPassword(!fPassword)
    }

    const handleLoginData = (e) => {
        const { name, value } = e.target
        setLoginData({ ...loginData, [name]: value })
    }

    const signinUser = async () => {
        console.log("clicked")
        if (email === '' || password === '') {
            setError('Please fill all the fields')
        }
        else {
            try {
                let loginD = {
                    'login_type': 'emailpassword',
                    email,
                    password
                }
                const result = await LoginUser(loginD)
                const userData = {
                    'accessToken': result.data.data.accessToken,
                    'displayName': result.data.data.displayName,
                    'email': result.data.data.email,
                    'emailVerified': result.data.data.emailVerified,
                    'photoUrl': result.data.data.profile_image || '',
                    'uid': result.data.data.uid,
                    'preferences': result.data.data.preferences || {},
                    'mobile_number': result.data.data.mobile_number || '',
                    'admin_status': result.data.data.admin_status
                }
                dispatch(setAuthState(userData))
                navigate('/dashboard')
            } catch (err) {
                setError(err.response.data.message)
                console.log(err)
            }
        }
    }

    const googleLoginSuccess = async (response) => {
        const loginData = {
            'login_type': 'google',
            'credential': response.credential
        }
        try {
            const result = await LoginUser(loginData)
            const userData = {
                'accessToken': result.data.data.accessToken,
                'displayName': result.data.data.displayName,
                'email': result.data.data.email,
                'emailVerified': result.data.data.emailVerified,
                'photoUrl': result.data.data.profile_image || '',
                'uid': result.data.data.uid,
                'preferences': result.data.data.preferences || {},
                'mobile_number': result.data.data.mobile_number || '',
                'admin_status': result.data.data.admin_status
            }
            dispatch(setAuthState(userData))
            navigate('/dashboard')
        } catch (err) {
            console.log(err)
            if (err.response) {
                setError(err.response.data.message)
            }
        }
    };

    const facebookLoginSuccess = async (response) => {
        const loginData = {
            'login_type': 'facebook',
            'facebook_email': response.data.email
        }
        try {
            const result = await LoginUser(loginData)
            const userData = {
                'accessToken': result.data.data.accessToken,
                'displayName': result.data.data.displayName,
                'email': result.data.data.email,
                'emailVerified': result.data.data.emailVerified,
                'photoUrl': result.data.data.profile_image || '',
                'uid': result.data.data.uid,
                'preferences': result.data.data.preferences || {},
                'mobile_number': result.data.data.mobile_number || '',
                'admin_status': result.data.data.admin_status
            }
            console.log(result)
            dispatch(setAuthState(userData))
            navigate('/dashboard')
        } catch (err) {
            console.log(err)
            if (err.response) {
                setError(err.response.data.message)
            }
        }
        console.log(response);
    }

    const errorMessage = (error) => {
        console.log(error);
    };



    return (
        <Box className='login-container'>
            <Box className='logo-container' ml={2} mt={2}>
                <img src={Logo} alt="logo" className="logo" onClick={redirectToHome} />
            </Box>
            <Box className='alert-box-container' display='flex' justifyContent='center'>
                <Box className='alert-box' sx={{ width: '400px' }}>
                    <Collapse in={open}>
                        <Alert severity="error"
                            action={
                                <IconButton
                                    aria-label="close"
                                    color="inherit"
                                    size="small"
                                    onClick={() => hideError()}
                                >
                                    <CloseIcon fontSize="inherit" />
                                </IconButton>
                            }
                            sx={{ mb: 2 }}
                        >
                            {error}
                        </Alert>
                    </Collapse>
                </Box>
            </Box>
            <Box className='login-box'>
                <Grid className='grid-container' container spacing={2}>
                    <Grid item xs={12} sm={12} md={12} lg={6}>
                        <Box className='login-box'>
                            {!fPassword ?
                                <Box className="login-container-left">
                                    <Box className="login-title">
                                        <Typography variant="h1" fontWeight="300" sx={{ letterSpacing: '4px', color: `${theme.palette.secondary.main}` }}>Login</Typography>
                                    </Box>
                                    <Box className="input-filed-box" display="flex" flexDirection="column">
                                        <TextField onChange={(e) => handleLoginData(e)} name='email' value={email}
                                            sx={{
                                                padding: '10px', '& label.Mui-focused': {
                                                    color: 'white',
                                                },
                                                '& label': {
                                                    color: 'red',
                                                },
                                                '& .MuiOutlinedInput-root': {
                                                    '&:hover fieldset': {
                                                        borderColor: 'red',
                                                    },
                                                },
                                            }}
                                            id="outlined-login-email" label="Email" variant="outlined" type='text'
                                        />
                                        <TextField onChange={(e) => handleLoginData(e)} name='password' value={password}
                                            sx={{
                                                padding: '10px', '& label.Mui-focused': {
                                                    color: 'white',
                                                },
                                                '& label': {
                                                    color: 'red',
                                                },
                                                '& .MuiOutlinedInput-root': {
                                                    '&:hover fieldset': {
                                                        borderColor: 'red',
                                                    },
                                                },
                                            }}
                                            id="outlined-login-password" label="Password" variant="outlined" type='password'
                                        />
                                    </Box>
                                    <Box className='forgotpassword-box' justifyContent="end" display="flex">
                                        <Typography onClick={handleFPassword} className="forgot-password" variant='a' fontWeight="300" sx={{ letterSpacing: '4px', color: `${theme.palette.secondary.main}` }}>Forgot Password?</Typography>
                                    </Box>

                                    <Button onClick={signinUser} className='login-button' variant="contained" sx={{
                                        ':hover': {
                                            color: 'black !important',
                                            backgroundColor: 'white !important'
                                        }
                                    }}>LOGIN</Button>
                                    <Box className='login-box-noaccount' justifyContent="center" display="flex">
                                        <Typography className='signup-start' variant='div' fontWeight="300" sx={{ letterSpacing: '4px', color: `${theme.palette.secondary.main}` }}>Don't have an Account? <span className="signup" onClick={switchState} >Signup Now </span></Typography>
                                    </Box>
                                    <Box className="icon-box">
                                        <Box className="footer-icon" alignItems='center' display='flex'>
                                            <GoogleLogin shape='pill' type='icon' onSuccess={googleLoginSuccess} onError={errorMessage} state_cookie_domain='single-host-origin' />
                                        </Box>
                                        <Box className="footer-icon">
                                            <LoginSocialFacebook
                                                appId={process.env.REACT_APP_FACEBOOK_APP_ID}
                                                onResolve={facebookLoginSuccess}
                                                onReject={errorMessage}
                                            >
                                                <IconButton size='large' aria-label="facebook" >
                                                    <FacebookIcon sx={{ width: '40px', height: '40px' }} />
                                                </IconButton>
                                            </LoginSocialFacebook>
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
                                </Box>
                            }
                        </Box>
                    </Grid>
                    <Grid className='animation-grid' item xs={12} sm={12} md={12} lg={6}>
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