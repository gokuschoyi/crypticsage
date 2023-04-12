import React, { useState, useEffect } from 'react'
import './Signup.css'
import { Box, Typography, TextField, Button, IconButton, Grid, Alert, useTheme } from '@mui/material'
import Collapse from '@mui/material/Collapse';
import Logo from '../../../assets/logoNew.png'
import { CloseIcon, FacebookIcon } from '../../dashboard/global/Icons';
import { useNavigate } from 'react-router-dom';
import Animation from '../animation/Animation';
import { SignupUser } from '../../../api/auth';
import { useDispatch } from 'react-redux';
import { setAuthState } from '../authSlice';

import { LoginSocialFacebook } from "reactjs-social-login";
import { GoogleLogin } from '@react-oauth/google';

const Signup = (props) => {
    const { switchState } = props
    const theme = useTheme();
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const [open, setOpen] = React.useState(false);
    const [error, setError] = React.useState('');

    const redirectToHome = () => {
        navigate('/')
    }

    const initialSignupData = {
        userName: { value: '', error: false, helperText: '' },
        password: { value: '', error: false, helperText: '' },
        email: { value: '', error: false, helperText: '' },
        mobile_number: { value: '', error: false, helperText: '' },
        reenterPassword: { value: '', error: false, helperText: '' }
    }

    const [signupData, setSignupData] = useState(initialSignupData)

    const handleSignupData = (e) => {
        const { name, value } = e.target
        validateFields(name, value)
    }

    function validateFields(name, value) {
        switch (name) {
            case 'userName':
                var userNameValid = value.length >= 3;
                if (!userNameValid) {
                    setSignupData({
                        ...signupData, [name]: { value: value, error: true, helperText: ' is too short' }
                    })
                }
                else {
                    setSignupData({
                        ...signupData, [name]: { value: value, error: false, helperText: '' }
                    })
                }
                break;
            case 'email':
                var emailValid = value.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i);
                if (emailValid === null) {
                    setSignupData({
                        ...signupData, [name]: { value: value, error: true, helperText: ' is invalid' }
                    })
                }
                else {
                    setSignupData({
                        ...signupData, [name]: { value: value, error: false, helperText: '' }
                    })
                }
                break;
            case 'mobile_number':
                var mobileValid = value.length === 10;
                if (!mobileValid) {
                    setSignupData({
                        ...signupData, [name]: { value: value, error: true, helperText: ' is invalid' }
                    })
                }
                else {
                    setSignupData({
                        ...signupData, [name]: { value: value, error: false, helperText: '' }
                    })
                }
                break;
            case 'password':
                var passwordValid = value.length >= 6;
                if (!passwordValid) {
                    setSignupData({
                        ...signupData, [name]: { value: value, error: true, helperText: ' is too short' }
                    })
                }
                else {
                    setSignupData({
                        ...signupData, [name]: { value: value, error: false, helperText: '' }
                    })
                }
                break;
            case 'reenterPassword':
                if (value !== signupData.password.value) {
                    setSignupData({
                        ...signupData, [name]: { value: value, error: true, helperText: 'password do not match' }
                    })
                }
                else {
                    setSignupData({
                        ...signupData, [name]: { value: value, error: false, helperText: '' }
                    })
                }
                break;
            default:
                break;
        }
    }

    function allErrorsFalse(obj) {
        for (const key in obj) {
            if (obj[key].error) {
                return false;
            }
        }
        return true;
    }
    const hideError = () => {
        setOpen(false);
        setError('')
    }

    useEffect(() => {
        if (error !== '') {
            setOpen(true)
        }
    }, [error])

    const signupUser = async () => {
        const formFields = Object.keys(signupData)
        let newSignupData = { ...signupData }
        formFields.forEach(field => {
            if (signupData[field].value === '') {
                newSignupData = {
                    ...newSignupData, [field]: { ...signupData[field], error: true, helperText: ' is required' }
                }
            }
        })
        setSignupData(newSignupData)
        const isNotEmpty = Object.values(newSignupData).every(field => field.value !== '')
        const isAllValid = allErrorsFalse(signupData)
        // console.log(isNotEmpty, isAllValid)
        if (isNotEmpty && isAllValid) {
            try {
                const userData = {}
                formFields.forEach(field => {
                    userData[field] = signupData[field].value
                })
                userData.signup_type = 'registration'
                // console.log(userData)
                const result = await SignupUser(userData)
                const userDataRedux = {
                    'accessToken': result.data.data.accessToken,
                    'displayName': result.data.data.displayName,
                    'email': result.data.data.email,
                    'emailVerified': result.data.data.emailVerified,
                    'photoUrl': result.data.data.profile_image || '',
                    'uid': result.data.data.uid,
                    'preferences': result.data.data.preferences,
                }
                dispatch(setAuthState(userDataRedux))
                navigate('/dashboard')
            } catch (error) {
                console.log(error)
                if (error.response) {
                    setError(error.response.data.message)
                } else {
                    setError('Something went wrong')
                }
            }
        } else {
            setError('Please check all the fields')
        }
    }

    const googleSignUpSuccess = async (response) => {
        const userData = {
            credentials: response.credential,
            signup_type: 'google',
        }
        try {
            const result = await SignupUser(userData)
            const userDataRedux = {
                'accessToken': result.data.data.accessToken,
                'displayName': result.data.data.displayName,
                'email': result.data.data.email,
                'emailVerified': result.data.data.emailVerified,
                'photoUrl': result.data.data.profile_image || '',
                'uid': result.data.data.uid,
                'preferences': result.data.data.preferences,
            }
            dispatch(setAuthState(userDataRedux))
            navigate('/dashboard')
        } catch (error) {
            console.log(error)
            if (error.response) {
                setError(error.response.data.message)
            } else {
                setError('Something went wrong')
            }
        }
    };

    const facebookSignUpSuccess = async (response) => {
        const userData = {
            signup_type: 'facebook',
            userInfo: response.data
        }
        try {
            const result = await SignupUser(userData)
            const userDataRedux = {
                'accessToken': result.data.data.accessToken,
                'displayName': result.data.data.displayName,
                'email': result.data.data.email,
                'emailVerified': result.data.data.emailVerified,
                'photoUrl': result.data.data.profile_image || '',
                'uid': result.data.data.uid,
                'preferences': result.data.data.preferences,
            }
            dispatch(setAuthState(userDataRedux))
            navigate('/dashboard')
        } catch (error) {
            console.log(error)
            if (error.response) {
                setError(error.response.data.message)
            } else {
                setError('Something went wrong')
            }
        }
    };

    const errorMessage = (error) => {
        console.log(error);
        setError(error)
    };

    return (
        <Box className='signup-container'>
            <Box className='logo-container'>
                <Box display="flex" justifyContent="start">
                    <Box pt={2} ml={2}>
                        <img src={Logo} alt="logo" className="logo" onClick={redirectToHome} />
                    </Box>
                </Box>
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
            <Box className='signup-box'>
                <Grid className='signup-grid-container' container spacing={2}>
                    <Grid className="animation-grid-signup" item xs={12} sm={12} md={12} lg={6}>
                        <Box className="signup-box">
                            <Box className="signup-container-left">
                                <Box className="login-title">
                                    <Typography variant="h1" fontWeight="300" sx={{ letterSpacing: '4px', color: 'white' }}>Signup</Typography>
                                </Box>
                                <Box className="input-filed-box" display="flex" flexDirection="column">
                                    <TextField
                                        error={signupData.userName.error}
                                        helperText={signupData.userName.helperText}
                                        sx={{
                                            padding: '10px',
                                            '& label.Mui-focused': {
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
                                            '& .MuiInputBase-input': {
                                                color: 'white',
                                            }
                                        }}
                                        onChange={(e) => handleSignupData(e)}
                                        name='userName'
                                        value={signupData.userName.value}
                                        id="outlined-username"
                                        label="Username"
                                        variant="outlined"
                                        type='text'
                                    />
                                    <TextField
                                        error={signupData.email.error}
                                        helperText={signupData.email.helperText}
                                        sx={{
                                            padding: '10px',
                                            '& label.Mui-focused': {
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
                                            '& .MuiInputBase-input': {
                                                color: 'white',
                                            }
                                        }}
                                        onChange={(e) => handleSignupData(e)}
                                        name='email'
                                        value={signupData.email.value}
                                        id="outlined-email"
                                        label="Email"
                                        variant="outlined"
                                        type='text'
                                    />
                                    <TextField
                                        error={signupData.mobile_number.error}
                                        helperText={signupData.mobile_number.helperText}
                                        sx={{
                                            padding: '10px',
                                            '& label.Mui-focused': {
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
                                            '& .MuiInputBase-input': {
                                                color: 'white',
                                            }
                                        }}
                                        onChange={(e) => handleSignupData(e)}
                                        name='mobile_number'
                                        value={signupData.mobile_number.value}
                                        id="outlined-mobileNumber"
                                        label="Mobile Number"
                                        variant="outlined"
                                        type='text'
                                    />
                                    <TextField
                                        error={signupData.password.error}
                                        helperText={signupData.password.helperText}
                                        sx={{
                                            padding: '10px',
                                            '& label.Mui-focused': {
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
                                            '& .MuiInputBase-input': {
                                                color: 'white',
                                            }
                                        }}
                                        onChange={(e) => handleSignupData(e)}
                                        name='password'
                                        value={signupData.password.value}
                                        id="outlined-password"
                                        label="Password"
                                        variant="outlined"
                                        type='password'
                                    />
                                    <TextField
                                        error={signupData.reenterPassword.error}
                                        helperText={signupData.reenterPassword.helperText}
                                        sx={{
                                            padding: '10px',
                                            '& label.Mui-focused': {
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
                                            '& .MuiInputBase-input': {
                                                color: 'white',
                                            }
                                        }}
                                        onChange={(e) => handleSignupData(e)}
                                        name='reenterPassword'
                                        value={signupData.reenterPassword.value}
                                        id="reenter-outlined-password"
                                        label="Re-Enter Password"
                                        variant="outlined"
                                        type='password'
                                    />
                                </Box>
                                <Button onClick={signupUser} className='signup-button' variant="contained" sx={{
                                    ':hover': {
                                        color: 'black !important',
                                        backgroundColor: 'white !important'
                                    }
                                }}>SIGN UP</Button>
                                <Box className='signup-box-already' justifyContent="center" display="flex">
                                    <Typography className='signup-start' variant='div' fontWeight="300" sx={{ letterSpacing: '4px', color: `${theme.palette.secondary.main}` }}>Already have an account? <span className="signup" onClick={switchState} > Login </span></Typography>
                                </Box>
                                <Box className="icon-box" >
                                    <Box className="footer-icon" alignItems='center' display='flex'>
                                        <GoogleLogin shape='pill' type='icon' size='medium' onSuccess={googleSignUpSuccess} onError={errorMessage} state_cookie_domain='single-host-origin' />
                                    </Box>
                                    <LoginSocialFacebook
                                        appId={process.env.REACT_APP_FACEBOOK_APP_ID}
                                        onResolve={facebookSignUpSuccess}
                                        onReject={errorMessage}
                                    >
                                        <IconButton size='large' aria-label="facebook" sx={{ color: 'white' }}>
                                            <FacebookIcon sx={{ width: '40px', height: '40px' }} />
                                        </IconButton>
                                    </LoginSocialFacebook>
                                </Box>
                            </Box>
                        </Box>
                    </Grid>
                    <Grid className='animation-grid-signup' item xs={12} sm={12} md={12} lg={6}>
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