import React from 'react'
import './Login.css'
import { Box, Typography, TextField, Button, IconButton, Grid } from '@mui/material'
import FacebookIcon from '@mui/icons-material/Facebook';
import GoogleIcon from '@mui/icons-material/Google';
import Logo from '../../../assets/logoNew.png'
import { useNavigate } from 'react-router-dom';
import Animation from '../animation/Animation';
import { signInWithGooglePopup, signInWithFacebookPopup, createUserDocumentFromAuth } from '../../../utils/firebaseUtils';
import { GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
const Login = (props) => {
    const { switchState } = props
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

    const signInWithGoogle = async () => {
        await signInWithGooglePopup()
        .then((result) => {
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            const user = result.user;
            console.log(token, user)
            createUserDocumentFromAuth(user);
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            const email = error.email;
            const credential = GoogleAuthProvider.credentialFromError(error);
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
            console.log(errorCode, errorMessage, email, credential)
        });
    }

    return (
        <Box className='login-container'>
            <Box className='logo-container' ml={2} mt={2}>
                <img src={Logo} alt="logo" className="logo" onClick={redirectToHome} />
            </Box>
            <Box className='login-box'>
                <Grid className='grid-container' container spacing={2}>
                    <Grid item xs={12} sm={12} md={12} lg={6}>
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

                                    <Button onClick={toDashboard} className='login-button' variant="contained" sx={{
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
                                    {/* <Box className="icon-box">
                                        <Box className="footer-icon">
                                            <IconButton aria-label="facebook">
                                                <FacebookIcon />
                                            </IconButton>
                                        </Box>
                                        <Box className="footer-icon">
                                            <IconButton onClick={signInWithGoogle} aria-label="facebook">
                                                <GoogleIcon />
                                            </IconButton>
                                        </Box>
                                    </Box> */}
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