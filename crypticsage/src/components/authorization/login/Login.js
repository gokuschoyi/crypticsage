import React, { useEffect, useState } from 'react'
import './Login.css'
import { Box, Typography, TextField, Button, IconButton, Grid, Alert, CircularProgress, useTheme } from '@mui/material'
import Collapse from '@mui/material/Collapse';
import { CloseIcon, FacebookIcon } from '../../dashboard/global/Icons';
import Logo from '../../../assets/logoNew.png'
import { useNavigate } from 'react-router-dom';
// import Animation from '../animation/Animation';

import { LoginSocialFacebook } from "reactjs-social-login";
import { GoogleLogin } from '@react-oauth/google';

import { useDispatch } from 'react-redux';
import { setAuthState } from '../authSlice';
// import { setUserModels } from '../../dashboard/dashboard_tabs/indicators/modules/CryptoModuleSlice'
import { LoginUser } from '../../../api/auth';
import { setRecentLessonAndQuizStatus, setWordOfTheDay } from '../../dashboard/dashboard_tabs/stats/StatsSlice'

const process_login = (result) => {
    return {
        'accessToken': result.data.data.accessToken,
        'displayName': result.data.data.displayName,
        'email': result.data.data.email,
        'emailVerified': result.data.data.emailVerified,
        'passwordEmptyFlag': result.data.data.passwordEmptyFlag,
        'uid': result.data.data.uid,
        'preferences': result.data.data.preferences || {},
        'mobile_number': result.data.data.mobile_number || '',
        'admin_status': result.data.data.admin_status,
        'user_lesson_status': result.data.data.lesson_status || {},
        'photoUrl': result.data.data.profile_image || '',
    }
}

const Login = (props) => {
    const { switchState, setSignupSuccessMessage, signupSuccessMessage } = props
    const navigate = useNavigate()
    const dispatch = useDispatch()
    
    const theme = useTheme()
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const [fPassword, setFPassword] = useState(false)
    const [forgotEmail, setForgotEmail] = useState('')
    
    const initialLoginData = {
        email: '',
        password: '',
    }
    
    const redirectToHome = () => {
        navigate('/')
    }

    const [loginData, setLoginData] = React.useState(initialLoginData)
    const { email, password } = loginData

    const hideError = () => {
        setSignupSuccessMessage('')
        setError('')
        setOpen(false);
    }

    useEffect(() => {
        if (signupSuccessMessage !== '') {
            setError(signupSuccessMessage)
        }
    }, [signupSuccessMessage])

    useEffect(() => {
        if (error !== '') {
            setOpen(true)
        }
    }, [error])

    const handleFPassword = () => {
        setFPassword(!fPassword)
    }

    const handleForgotPassword = async () => {
        console.log(forgotEmail)
    }

    const handleLoginData = (e) => {
        const { name, value } = e.target
        setLoginData({ ...loginData, [name]: value })
    }

    const [isLodaing, setIsLoading] = useState(false)

    const signinUser = async () => {
        // console.log("clicked")
        if (email === '' || password === '') {
            setError('Please fill all the fields')
        }
        else {
            setIsLoading(true)
            try {
                let loginD = {
                    'login_type': 'emailpassword',
                    email,
                    password
                }
                const result = await LoginUser(loginD)
                const userData = process_login(result)
                localStorage.setItem('userTheme', userData.preferences.theme)
                dispatch(setAuthState(userData))
                dispatch(setRecentLessonAndQuizStatus(result.data.recent_lesson_quiz))
                dispatch(setWordOfTheDay(result.data.word))
                setIsLoading(false)
                navigate('/dashboard')
            } catch (err) {
                setIsLoading(false)
                if (err.response) {
                    setError(err.response.data.message)
                } else if (err.name === 'AxiosError') {
                    setError("Server is down. Please try again later")
                }
            }
        }
    }

    const googleLoginSuccess = async (response) => {
        const loginData = {
            'login_type': 'google',
            'credential': response.credential
        }
        try {
            setIsLoading(true)
            const result = await LoginUser(loginData)
            const userData = process_login(result)
            localStorage.setItem('userTheme', userData.preferences.theme)
            dispatch(setAuthState(userData))
            dispatch(setRecentLessonAndQuizStatus(result.data.recent_lesson_quiz))
            dispatch(setWordOfTheDay(result.data.word))
            setIsLoading(false)
            navigate('/dashboard')
        } catch (err) {
            setIsLoading(false)
            if (err.response) {
                setError(err.response.data.message)
            } else if (err.name === 'AxiosError') {
                setError("Server is down. Please try again later")
            }
        }
    };

    const facebookLoginSuccess = async (response) => {
        const loginData = {
            'login_type': 'facebook',
            'facebook_email': response.data.email
        }
        try {
            setIsLoading(true)
            const result = await LoginUser(loginData)
            const userData = process_login(result)
            localStorage.setItem('userTheme', userData.preferences.theme)
            dispatch(setAuthState(userData))
            dispatch(setRecentLessonAndQuizStatus(result.data.recent_lesson_quiz))
            dispatch(setWordOfTheDay(result.data.word))
            setIsLoading(false)
            navigate('/dashboard')
        } catch (err) {
            setIsLoading(false)
            if (err.response) {
                setError(err.response.data.message)
            } else if (err.name === 'AxiosError') {
                setError("Server is down. Please try again later")
            }
        }
    }

    const errorMessage = (error) => {
        console.log(error);
    };

    return (
        <Box className='login-container'>
            <Box className='logo-container' sx={{ marginLeft: '31px', marginTop: '22px' }}>
                <img src={Logo} alt="logo" className="logo" onClick={redirectToHome} />
            </Box>
            <Box className='alert-box-container' display='flex' justifyContent='center'>
                <Box className='alert-box' sx={{ width: '400px' }}>
                    <Collapse in={open}>
                        <Alert severity={signupSuccessMessage === '' ? 'error' : 'success'}
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
                                        <Typography variant="h1" fontWeight="300" sx={{ letterSpacing: '4px', color: 'white' }}>Login</Typography>
                                        <CircularProgress color="secondary" size='30px' style={{ display: isLodaing ? 'block' : 'none' }} />
                                    </Box>
                                    <Box className="input-filed-box" display="flex" flexDirection="column" gap={2}>
                                        <TextField onChange={(e) => handleLoginData(e)} name='email' value={email}
                                            size='small'
                                            sx={{
                                                '& label.Mui-focused': {
                                                    color: 'white',
                                                },
                                                '& label': {
                                                    color: 'red',
                                                },
                                                '& .MuiOutlinedInput-root': {
                                                    '& fieldset': {
                                                        borderColor: `${theme.palette.text.secondary}`,
                                                    },
                                                    '&:hover fieldset': {
                                                        borderColor: 'red',
                                                    },
                                                },
                                                '& .MuiInputBase-input': {
                                                    color: 'white',
                                                }
                                            }}
                                            id="outlined-login-email" label="Email" variant="outlined" type='text'
                                        />
                                        <TextField onChange={(e) => handleLoginData(e)} name='password' value={password}
                                            size='small'
                                            sx={{
                                                '& label.Mui-focused': {
                                                    color: 'white',
                                                },
                                                '& label': {
                                                    color: 'red',
                                                },
                                                '& .MuiOutlinedInput-root': {
                                                    '& fieldset': {
                                                        borderColor: `${theme.palette.text.secondary}`,
                                                    },
                                                    '&:hover fieldset': {
                                                        borderColor: 'red',
                                                    },
                                                },
                                                '& .MuiInputBase-input': {
                                                    color: 'white',
                                                }
                                            }}
                                            id="outlined-login-password" label="Password" variant="outlined" type='password'
                                        />
                                    </Box>
                                    <Box className='forgotpassword-box' justifyContent="end" display="flex">
                                        <Typography onClick={handleFPassword} className="forgot-password" variant='a' fontWeight="300" sx={{ letterSpacing: '4px', color: 'white' }}>Forgot Password?</Typography>
                                    </Box>

                                    <Button onClick={signinUser} className='login-button' variant="contained" sx={{
                                        ':hover': {
                                            color: 'black !important',
                                            backgroundColor: 'white !important'
                                        }
                                    }}>LOGIN</Button>

                                    <Box className='login-box-noaccount' justifyContent="center" display="flex">
                                        <Typography className='signup-start' variant='div' fontWeight="300" sx={{ letterSpacing: '4px', color: 'white' }}>Don't have an Account? <span className="signup" onClick={switchState} >Signup Now </span></Typography>
                                    </Box>
                                    <Box className="icon-box">
                                        <GoogleLogin shape='pill' type='icon' size='medium' onSuccess={googleLoginSuccess} onError={errorMessage} state_cookie_domain='https://localhost:3001' allowed_parent_origin='https://localhost:3001/dashboard' />
                                        <LoginSocialFacebook
                                            appId={process.env.REACT_APP_FACEBOOK_APP_ID}
                                            onResolve={facebookLoginSuccess}
                                            onReject={errorMessage}
                                            children={<FacebookIcon sx={{ color: 'white', cursor: 'pointer', width: '35px', height: '35px' }} />}
                                        />
                                    </Box>
                                </Box>
                                :
                                <Box className="login-container-left">
                                    <Box className="login-title">
                                        <Typography variant="h1" fontWeight="300" sx={{ letterSpacing: '4px', color: 'white' }}>Forgot Password</Typography>
                                    </Box>
                                    <Box className="input-filed-box" display="flex" flexDirection="column">
                                        <TextField name='email'
                                            size='small'
                                            sx={{
                                                '& label.Mui-focused': {
                                                    color: 'white',
                                                },
                                                '& label': {
                                                    color: 'red',
                                                },
                                                '& .MuiOutlinedInput-root': {
                                                    '& fieldset': {
                                                        borderColor: `${theme.palette.text.secondary}`,
                                                    },
                                                    '&:hover fieldset': {
                                                        borderColor: 'red',
                                                    },
                                                },
                                                '& .MuiInputBase-input': {
                                                    color: 'white',
                                                }
                                            }}
                                            value={forgotEmail}
                                            onChange={(event) => {
                                                setForgotEmail(event.target.value);
                                            }}
                                            id="outlined-basic-forgot-email" label="Enter your Email" variant="outlined" type='email' />
                                    </Box>
                                    <Box className='forgotpassword-box' justifyContent="end" display="flex">
                                        <Button size='small' className='reset-button' variant="contained" onClick={handleForgotPassword} sx={{
                                            ':hover': {
                                                color: 'black !important',
                                                backgroundColor: 'white !important'
                                            }
                                        }}>Submit</Button>
                                        <Button size='small' onClick={handleFPassword} className='reset-button' variant="contained" sx={{}}>Go Back</Button>
                                    </Box>
                                </Box>
                            }
                        </Box>
                    </Grid>
                    {/* <Grid className='animation-grid' item xs={12} sm={12} md={12} lg={6}>
                        <Box className='login-model'>
                            <Animation />
                        </Box>
                    </Grid> */}
                </Grid>
            </Box>
        </Box >
    )
}

export default Login