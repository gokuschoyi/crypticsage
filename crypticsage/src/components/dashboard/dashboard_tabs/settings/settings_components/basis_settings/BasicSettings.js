import React, { useEffect } from 'react'
import './BasicSettings.css'
import { createCanvas } from 'canvas';
import { Box, Grid, Typography, Button, IconButton, TextField, InputAdornment } from '@mui/material'
import { CheckOutlinedIcon, CameraAltIcon, ClearOutlinedIcon, VisibilityOff, Visibility } from '../../../../global/Icons'
import { verifyPassword, updatePassword, updateProfileImage, updateUserData } from '../../../../../../api/user'
import { Success, Error, Info } from '../../../../global/CustomToasts'
import DefaultUser from '../../../../../../assets/user.png'
import { useSelector, useDispatch } from 'react-redux'
import { setNewProfileImage, setNewUserData } from '../../../../../../components/authorization/authSlice'
const BasicSettings = () => {
    const user = useSelector(state => state.auth)
    const dispatch = useDispatch()
    const [showPassword, setShowPassword] = React.useState(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    useEffect(() => {
        let image = null
        if (user.photoUrl === '' || user.photoUrl.startsWith('https://')) {
            image = document.getElementById("output");
            image.src = DefaultUser
        } else {
            image = document.getElementById("output");
            image.src = user.photoUrl
        }
    }, [user.photoUrl])

    const [file, setFile] = React.useState(null)
    const [currentPic, setCurrentPic] = React.useState(null)

    const loadFile = (e) => {
        var image = document.getElementById("output");
        setCurrentPic(image.src)
        setFile(e.target.files[0])
        image.src = URL.createObjectURL(e.target.files[0]);
    }

    const cancelChange = () => {
        var image = document.getElementById("output");
        image.src = currentPic
        setFile(null)
    }

    const saveChange = async () => {
        let base64 = await resizeAndConvertToBase64(file, 800, 600)
        try {
            let data = {
                token: user.accessToken,
                payload: {
                    uid: user.uid,
                    profileImage: base64
                }
            }
            let res = await updateProfileImage(data)
            dispatch(setNewProfileImage({ photoUrl: base64 }))
            setFile(null)
            Success(res.data.message)
        } catch (err) {
            if (err.response) {
                Error(err.response.data.message)
            }
        }
    }

    function resizeAndConvertToBase64(file, maxWidth, maxHeight) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const img = new Image();
                img.src = reader.result;
                img.onload = () => {
                    const canvas = createCanvas(maxWidth, maxHeight);
                    const ctx = canvas.getContext('2d');

                    // Get the image dimensions and calculate the scale factor
                    const scale = Math.min(maxWidth / img.width, maxHeight / img.height).toFixed(4);
                    const newWidth = (img.width * scale).toFixed(0);
                    const newHeight = (img.height * scale).toFixed(0);

                    // Set the canvas dimensions based on the scaled image
                    canvas.width = newWidth;
                    canvas.height = newHeight;

                    // Draw the image on the canvas
                    ctx.drawImage(img, 0, 0, newWidth, newHeight);

                    // Convert the canvas to a data URL
                    const dataURL = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataURL);
                };
            };
            reader.onerror = error => reject(error);
        });
    }

    const textFieldStyle = {
        marginTop: '10px',
        marginBotton: '10px',
        width: '100%',
        '& label.Mui-focused': {
            color: 'white',
            paddingBottom: '10px',
        },
        '& label': {
            color: 'white',
        },
        '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
                borderColor: 'red',
            },
        }
    }

    const currentPasswordData = {
        currentPassword: { value: '', error: false, helperText: '' }
    }

    const [passwordCorrect, setPasswordCorrect] = React.useState(false)
    const [currentPassword, setCurrentPassword] = React.useState(currentPasswordData)
    const handlePasswordChange = (e) => {
        const { name, value } = e.target
        setCurrentPassword({ ...currentPassword, [name]: { value: value, error: false, helperText: '' } })
    }
    const verifyCurrentPassword = async () => {
        console.log('clicked')
        if (currentPassword.currentPassword.value === '') {
            setCurrentPassword({ ...currentPassword, currentPassword: { value: '', error: true, helperText: 'Password cannot be empty' } })
            return
        } else {
            let data = {
                token: user.accessToken,
                payload: {
                    uid: user.uid,
                    password: currentPassword.currentPassword.value
                }
            }
            try {
                let res = await verifyPassword(data)
                setPasswordCorrect(res.data.validPassword)
                Success(res.data.message)

            } catch (err) {
                if (err.response) {
                    Error(err.response.data.message)
                    setPasswordCorrect(false)
                }
            }
        }
    }

    const newPasswordData = {
        newPassword: { value: '', error: false, helperText: '' },
        confirmPassword: { value: '', error: false, helperText: '' }
    }

    const [newPassword, setNewPassword] = React.useState(newPasswordData)
    const handleNewPasswordChange = (e) => {
        const { name, value } = e.target
        validatePassword(name, value)
    }

    function validatePassword(name, value) {
        if (name === 'newPassword') {
            if (value.length < 6) {
                setNewPassword({ ...newPassword, [name]: { value: value, error: true, helperText: 'Password must be atleast 8 characters long' } })
            } else {
                setNewPassword({ ...newPassword, [name]: { value: value, error: false, helperText: '' } })
            }
        } else {
            if (value !== newPassword.newPassword.value) {
                setNewPassword({ ...newPassword, [name]: { value: value, error: true, helperText: 'Passwords do not match' } })
            } else {
                setNewPassword({ ...newPassword, [name]: { value: value, error: false, helperText: '' } })
            }
        }
    }

    const handleNewPasswordSave = async () => {
        if (newPassword.newPassword.value === '') {
            setNewPassword({ ...newPassword, newPassword: { value: '', error: true, helperText: 'Password cannot be empty' } })
            return
        } else if (newPassword.confirmPassword.value === '') {
            setNewPassword({ ...newPassword, confirmPassword: { value: '', error: true, helperText: 'Re Entered Password cannot be empty' } })
            return
        }
        else if (newPassword.newPassword.error || newPassword.confirmPassword.error) {
            return
        } else {
            try {
                let data = {
                    token: user.accessToken,
                    payload: {
                        uid: user.uid,
                        password: newPassword.newPassword.value
                    }
                }
                let res = await updatePassword(data)
                setNewPassword(newPasswordData)
                setPasswordCorrect(false)
                Success(res.data.message)
            } catch (err) {
                if (err.response) {
                    Error(err.response.data.message)
                }
            }
        }
    }

    const userData = {
        displayName: { value: user.displayName, error: false, helperText: '' },
        mobileNumber: { value: user.mobile_number, error: false, helperText: '' },
    }

    const [userDetails, setUserDetails] = React.useState(userData)

    const handleUserDetailsChange = (e) => {
        const { name, value } = e.target
        setUserDetails({ ...userDetails, [name]: { value: value, error: false, helperText: '' } })
    }

    const handleUserDetailsSave = async () => {
        if (user.displayName !== userDetails.displayName.value) {
            if (userDetails.displayName.value === '') {
                setUserDetails({ ...userDetails, displayName: { value: '', error: true, helperText: 'Name cannot be empty' } })
                return
            } else {
                let data = {
                    token: user.accessToken,
                    payload: {
                        uid: user.uid,
                        userData: {
                            displayName: userDetails.displayName.value,
                            mobile_number: userDetails.mobileNumber.value
                        }
                    }
                }
                try {
                    let res = await updateUserData(data)
                    dispatch(setNewUserData(data.payload.userData))
                    Success(res.data.message)
                } catch (err) {
                    if (err.response) {
                        Error(err.response.data.message)
                    }
                }
                console.log(userDetails)
            }
        } else {
            Info('No changes made')
        }
    }

    return (
        <Box className='basic-settings-container' sx={{ backgroundColor: '#2e2e2e' }}>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={12} md={6} lg={6} xl={6}>
                    <Box display='flex' flexDirection='column' alignItems='start' className='user-name-box'>
                        <Typography variant='h4' color='secondary'>
                            Welcome, {user.displayName.toUpperCase()}
                        </Typography>
                        <Typography variant='h6' color='secondary'>
                            {user.email}
                        </Typography>
                    </Box>
                    <Box display='flex' flexDirection='row' alignItems='start' className='avatar-container'>
                        <Box className="profile-pic">
                            <label className="-label" htmlFor="file">
                                <span><CameraAltIcon /></span>
                                <span>Change Image</span>
                            </label>
                            <input id="file" type="file" onChange={(e) => loadFile(e)} />
                            <img id="output" src={''} alt="sdsd" />
                        </Box>
                        {file &&
                            <Box display='flex' flexDirection='column' marginLeft='20px'>
                                <IconButton
                                    onClick={cancelChange}
                                    size='small'
                                    variant="text"
                                    style={{
                                        color: `#000000`,
                                        backgroundColor: 'red',
                                        margin: '5px'
                                    }}
                                    sx={{
                                        ':hover': {
                                            color: `black !important`,
                                            backgroundColor: 'white !important',
                                        },
                                    }}><ClearOutlinedIcon className='basicsetting-icon' /></IconButton>

                                <IconButton
                                    onClick={saveChange}
                                    size='small'
                                    variant="text"
                                    style={{
                                        color: `#000000`,
                                        backgroundColor: 'red',
                                        margin: '5px'
                                    }}
                                    sx={{
                                        ':hover': {
                                            color: `black !important`,
                                            backgroundColor: 'white !important',
                                        },
                                    }}><CheckOutlinedIcon className='basicsetting-icon' />
                                </IconButton>
                            </Box>
                        }
                    </Box>
                    <Box marginTop="20px" className='basic-settings-input-box'>
                        <Box width='90%' className='basic-settings-input-container'>
                            <Box display='flex' alignItems='baseline' justifyContent='space-between'>
                                <TextField
                                    error={userDetails.displayName.error}
                                    helperText={userDetails.displayName.helperText}
                                    onChange={(e) => handleUserDetailsChange(e)}
                                    name='displayName'
                                    value={userDetails.displayName.value}
                                    sx={textFieldStyle}
                                    id="outlined-basic-username"
                                    size="small"
                                    label="User Name"
                                    variant="outlined"
                                />
                            </Box>
                            <Box display='flex' alignItems='baseline' justifyContent='space-between'>
                                <TextField sx={textFieldStyle}
                                    error={userDetails.mobileNumber.error}
                                    helperText={userDetails.mobileNumber.helperText}
                                    onChange={(e) => handleUserDetailsChange(e)}
                                    name='mobileNumber'
                                    value={userDetails.mobileNumber.value}
                                    id="outlined-basic-phoneNumber"
                                    size="small"
                                    label="Phone Number"
                                    variant="outlined"
                                />
                            </Box>
                            <Box sx={{ margin: '20px 0px 10px 0px' }}>
                                <Button
                                    onClick={(e) => handleUserDetailsSave(e)}
                                    size='small'
                                    variant="text"
                                    style={{ color: `#000000`, backgroundColor: 'red', margin: '5px', marginLeft: '10px' }}
                                    sx={{ ':hover': { color: `black !important`, backgroundColor: 'white !important', } }}
                                >
                                    Update</Button>
                            </Box>
                        </Box>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={12} md={6} lg={6} xl={6}>
                    <Box className='change-password-box'>
                        <Box className='change-password-box-info' display='flex' flexDirection='column' alignItems='start'>
                            <Typography variant='h5' color='secondary'>Change Password</Typography>
                            <Typography variant='body2' color='secondary'>Enter your current password to verify your identity</Typography>
                        </Box>
                        <Box className='basic-settings-input-container'>
                            <Box display='flex' alignItems='baseline' justifyContent='space-between'>
                                <TextField
                                    fullWidth
                                    onChange={(e) => handlePasswordChange(e)} name='currentPassword' value={currentPassword.currentPassword.value}
                                    id="outlined-adornment-password"
                                    type={showPassword ? 'text' : 'password'}
                                    error={currentPassword.currentPassword.error}
                                    helperText={currentPassword.currentPassword.helperText}
                                    label="Current Password"
                                    size='small'
                                    InputProps={{
                                        endAdornment:
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={handleClickShowPassword}
                                                    onMouseDown={handleMouseDownPassword}
                                                    edge="end"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                    }}
                                />

                                <Button
                                    onClick={verifyCurrentPassword} size='small'
                                    variant="text"
                                    style={{ color: `#000000`, backgroundColor: 'red', margin: '5px', marginLeft: '10px' }}
                                    sx={{ ':hover': { color: `black !important`, backgroundColor: 'white !important', } }}
                                >Submit</Button>
                            </Box>
                            {passwordCorrect &&
                                <Box className='reset-password-box'>
                                    <Box sx={{ marginTop: '10px', marginBottom: '10px' }}>
                                        <Typography textAlign='start' variant='h5' color='secondary'>Enter your new password</Typography>
                                    </Box>
                                    <Box className='new-pass-box'>
                                        <TextField
                                            fullWidth
                                            onChange={(e) => handleNewPasswordChange(e)} name='newPassword' value={newPassword.newPassword.value}
                                            id="outlined-adornment-password"
                                            type={showPassword ? 'text' : 'password'}
                                            error={newPassword.newPassword.error}
                                            helperText={newPassword.newPassword.helperText}
                                            label="New Password"
                                            size='small'
                                            InputProps={{
                                                endAdornment:
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            aria-label="toggle password visibility"
                                                            onClick={handleClickShowPassword}
                                                            onMouseDown={handleMouseDownPassword}
                                                            edge="end"
                                                        >
                                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                                        </IconButton>
                                                    </InputAdornment>
                                            }}
                                        />
                                        <TextField
                                            fullWidth
                                            onChange={(e) => handleNewPasswordChange(e)} name='confirmPassword' value={newPassword.confirmPassword.value}
                                            id="outlined-adornment-reenter-password"
                                            type={showPassword ? 'text' : 'password'}
                                            error={newPassword.confirmPassword.error}
                                            helperText={newPassword.confirmPassword.helperText}
                                            label="Re-Enter Password"
                                            size='small'
                                            InputProps={{
                                                endAdornment:
                                                    <InputAdornment position="end">
                                                        <IconButton
                                                            aria-label="toggle password visibility"
                                                            onClick={handleClickShowPassword}
                                                            onMouseDown={handleMouseDownPassword}
                                                            edge="end"
                                                        >
                                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                                        </IconButton>
                                                    </InputAdornment>
                                            }}
                                        />
                                    </Box>
                                    <Box className='reset-password-button'>
                                        <Button
                                            onClick={handleNewPasswordSave}
                                            size='small'
                                            variant="text"
                                            style={{ color: `#000000`, backgroundColor: 'red', margin: '5px', marginLeft: '10px' }}
                                            sx={{ ':hover': { color: `black !important`, backgroundColor: 'white !important', } }}
                                        >Save</Button>
                                    </Box>
                                </Box>
                            }
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    )
}

export default BasicSettings