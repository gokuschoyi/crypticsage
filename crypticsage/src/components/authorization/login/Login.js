import React from 'react'
import './Login.css'
import { Box, Typography, TextField, Button, IconButton, Grid, Alert, useTheme } from '@mui/material'
import Collapse from '@mui/material/Collapse';
import { CloseIcon, FacebookIcon, GoogleIcon } from '../../dashboard/global/Icons';
import Logo from '../../../assets/logoNew.png'
import { useNavigate } from 'react-router-dom';
import Animation from '../animation/Animation';
import { signInWithGooglePopup, signInWithFacebookPopup, createUserDocumentFromAuth } from '../../../utils/firebaseUtils';
import { GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { useDispatch } from 'react-redux';
import { setAuthState } from '../authSlice';
import { LoginUser } from '../../../api/auth';
const Login = (props) => {
    const { switchState } = props
    const navigate = useNavigate()
    const theme = useTheme()
    const redirectToHome = () => {
        navigate('/')
    }

    const [fPassword, setFPassword] = React.useState(false)
    const handleFPassword = () => {
        setFPassword(!fPassword)
    }

    const dispatch = useDispatch()

    const signInWithGoogle = async () => {
        await signInWithGooglePopup()
            .then((result) => {
                const user = result.user;
                const userData = {
                    'accessToken': user.accessToken,
                    'displayName': user.displayName,
                    'email': user.email,
                    'emailVerified': user.emailVerified,
                    'photoUrl': user.photoURL,
                    'uid': user.uid,
                }
                dispatch(setAuthState(userData))
                console.log(userData)
                createUserDocumentFromAuth(user);
                navigate('/dashboard')
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                const email = error.email;
                const credential = GoogleAuthProvider.credentialFromError(error);
                setError(errorCode)
                console.log(errorCode, errorMessage, email, credential)
            });
    }

    const signInWithFacebook = async () => {
        await signInWithFacebookPopup()
            .then((result) => {
                const credential = FacebookAuthProvider.credentialFromResult(result);
                const token = credential.accessToken;
                const user = result.user;
                console.log(token, user)
                createUserDocumentFromAuth(user);
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                const email = error.email;
                const credential = FacebookAuthProvider.credentialFromError(error);
                setError(errorCode + '. You already have an account with a google email. Please login with Google credentials')
                console.log(errorCode, errorMessage, email, credential)
            });
    }

    const initialLoginData = {
        email: '',
        password: '',
    }

    const [loginData, setLoginData] = React.useState(initialLoginData)

    const handleLoginData = (e) => {
        const { name, value } = e.target
        setLoginData({ ...loginData, [name]: value })
    }

    const { email, password } = loginData

    const signinUser = async () => {
        console.log("clicked")
        if (loginData.email !== '' && loginData.password !== '') {
            const result = await LoginUser(loginData)
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
            else {
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
                                        <Box className="footer-icon">
                                            <IconButton onClick={signInWithGoogle} aria-label="facebook" >
                                                <GoogleIcon />
                                            </IconButton>
                                        </Box>
                                        <Box className="footer-icon">
                                            <IconButton onClick={signInWithFacebook} aria-label="facebook" >
                                                <FacebookIcon />
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