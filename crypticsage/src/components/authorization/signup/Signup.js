import React from 'react'
import './Signup.css'
import { Box, Typography, TextField, Button, IconButton, Grid, Alert, useTheme } from '@mui/material'
import Collapse from '@mui/material/Collapse';
import Logo from '../../../assets/logoNew.png'
import { CloseIcon, FacebookIcon, GoogleIcon } from '../../dashboard/global/Icons';
import { useNavigate } from 'react-router-dom';
import Animation from '../animation/Animation';
import { SignupUser } from '../../../api/auth';
import { useDispatch } from 'react-redux';
import { setAuthState } from '../authSlice';
const Signup = (props) => {
    const { switchState } = props
    const theme = useTheme();
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const redirectToHome = () => {
        navigate('/')
    }
    const initialSignupData = {
        userName: '',
        password: '',
        email: '',
        mobile_number: '',
        reenterPassword: ''
    }

    const initialFormErrors = {
        userName: { error: false, helperText: '' },
        email: { error: false, helperText: '' },
        mobile_number: { error: false, helperText: '' },
        password: { error: false, helperText: '' },
        reenterPassword: { error: false, helperText: '' }
    }

    const [formErrors, setFormErrors] = React.useState(initialFormErrors)

    const [signupData, setSignupData] = React.useState(initialSignupData)

    function validateFields(fieldName, value) {
        if (value === '') {
            setFormErrors({ ...formErrors, [fieldName]: { error: false, helperText: `` } })
            return
        }
        switch (fieldName) {
            case 'email':
                var emailValid = value.match(/^([\w.%+-]+)@([\w-]+\.)+([\w]{2,})$/i);
                if (emailValid === null) {
                    setFormErrors({ ...formErrors, email: { error: true, helperText: ' is invalid' } })
                }
                else {
                    setFormErrors({ ...formErrors, email: { error: false, helperText: '' } })
                }
                break;
            case 'password':
                var passwordValid = value.length >= 6;
                if (!passwordValid) {
                    setFormErrors({ ...formErrors, password: { error: true, helperText: ' is too short' } })
                }
                else {
                    setFormErrors({ ...formErrors, password: { error: false, helperText: '' } })
                }
                break;
            case 'mobile_number':
                var mobileValid = value.length === 10;
                if (!mobileValid) {
                    setFormErrors({ ...formErrors, mobile_number: { error: true, helperText: ' is invalid' } })
                }
                else {
                    setFormErrors({ ...formErrors, mobile_number: { error: false, helperText: '' } })
                }
                break;
            case 'reenterPassword':
                console.log(signupData.password)
                if (value !== signupData.password) {
                    setFormErrors({ ...formErrors, reenterPassword: { error: true, helperText: 'password do not match' } })
                }
                else {
                    setFormErrors({ ...formErrors, reenterPassword: { error: false, helperText: '' } })
                }
                break;
            default:
                break;
        }
    }

    const handleSignupData = (e) => {
        const { name, value } = e.target
        validateFields(name, value)
        setSignupData({ ...signupData, [name]: value })
    }

    const { userName, password, email, mobile_number, reenterPassword } = signupData

    const signupUser = async () => {
        if (userName === '') {
            setFormErrors({ ...formErrors, userName: { error: true, helperText: 'User name is required' } })
        }
        if (email === '') {
            setFormErrors({ ...formErrors, email: { error: true, helperText: 'Email is required' } })
        }
        if (mobile_number === '') {
            setFormErrors({ ...formErrors, mobile_number: { error: true, helperText: 'Mobile number is required' } })
        }
        if (password === '') {
            setFormErrors({ ...formErrors, password: { error: true, helperText: 'Password is required' } })
        }
        if (userName !== '' && email !== '' && mobile_number !== '' && password !== '' && reenterPassword !== '') {
            const result = await SignupUser(signupData)
            if (result.data.code === 200) {
                const userData = {
                    'accessToken': result.data.data.accessToken,
                    'displayName': result.data.data.displayName,
                    'email': result.data.data.email,
                    'emailVerified': result.data.data.emailVerified,
                    'photoUrl': result.data.data.photoURL || '',
                    'uid': result.data.data.uid,
                }
                dispatch(setAuthState(userData))
                navigate('/dashboard')
            }
            if (result.data.code === 400) {
                setError(result.data.errorMessage)
            }
        }
        else {
            setError('Please fill all the fields')
        }
    }

    const [open, setOpen] = React.useState(false);
    const [error, setError] = React.useState('');

    const hideError = () => {
        setOpen(false);
        setError('')
    }

    React.useEffect(() => {
        if (error !== '') {
            setOpen(true)
        }
    }, [error])

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
                                    <Typography variant="h1" fontWeight="300" sx={{ letterSpacing: '4px', color: `${theme.palette.secondary.main}` }}>Signup</Typography>
                                </Box>
                                <Box className="input-filed-box" display="flex" flexDirection="column">
                                    <TextField
                                        error={formErrors.userName.error}
                                        helperText={formErrors.userName.helperText}
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
                                        }}
                                        onChange={(e) => handleSignupData(e)}
                                        name='userName'
                                        value={userName}
                                        id="outlined-username"
                                        label="Username"
                                        variant="outlined"
                                        type='text'
                                    />
                                    <TextField
                                        error={formErrors.email.error}
                                        helperText={formErrors.email.helperText}
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
                                        }}
                                        onChange={(e) => handleSignupData(e)}
                                        name='email'
                                        value={email}
                                        id="outlined-email"
                                        label="Email"
                                        variant="outlined"
                                        type='text'
                                    />
                                    <TextField
                                        error={formErrors.mobile_number.error}
                                        helperText={formErrors.mobile_number.helperText}
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
                                        }}
                                        onChange={(e) => handleSignupData(e)}
                                        name='mobile_number'
                                        value={mobile_number}
                                        id="outlined-mobileNumber"
                                        label="Mobile Number"
                                        variant="outlined"
                                        type='text'
                                    />
                                    <TextField
                                        error={formErrors.password.error}
                                        helperText={formErrors.password.helperText}
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
                                        }}
                                        onChange={(e) => handleSignupData(e)}
                                        name='password'
                                        value={password}
                                        id="outlined-password"
                                        label="Password"
                                        variant="outlined"
                                        type='password'
                                    />
                                    <TextField
                                        error={formErrors.reenterPassword.error}
                                        helperText={formErrors.reenterPassword.helperText}
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
                                        }}
                                        onChange={(e) => handleSignupData(e)}
                                        name='reenterPassword'
                                        value={reenterPassword}
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
                                <Box className="icon-box">
                                    <Box className="footer-icon">
                                        <IconButton aria-label="google">
                                            <GoogleIcon />
                                        </IconButton>
                                    </Box>
                                    <Box className="footer-icon">
                                        <IconButton aria-label="facebook">
                                            <FacebookIcon />
                                        </IconButton>
                                    </Box>
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