import React, { useEffect } from 'react'
import './BasicSettings.css'
import { Box, Typography, Avatar, Button, IconButton, TextField, FormControl, InputLabel, OutlinedInput, InputAdornment } from '@mui/material'
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Me from '../../../../../../assets/me.jpg'
import { DeleteOutlineOutlinedIcon, CheckOutlinedIcon, CameraAltIcon, ClearOutlinedIcon } from '../../../../global/Icons'
const BasicSettings = () => {
    const [showPassword, setShowPassword] = React.useState(false);
    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const [reset, setReset] = React.useState(false);

    const openResetPassword = () => {
        setReset((prev) => !prev)
    }

    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

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

    const saveChange = () => {
        var image = document.getElementById("output");
        setCurrentPic(image.src)
        setFile(null)
    }

    return (
        <Box className='basic-settings-container'>
            <Box display='flex' flexDirection='column' alignItems='start' className='user-name-box'>
                <Typography variant='h4' color='secondary'>
                    Gokul S Choyi
                </Typography>
                <Typography variant='body2' color='secondary'>
                    Edit your profile
                </Typography>
            </Box>
            <Box display='flex' flexDirection='row' alignItems='start' className='avatar-container'>
                <Box className="profile-pic">
                    <label className="-label" htmlFor="file">
                        <span><CameraAltIcon /></span>
                        <span>Change Image</span>
                    </label>
                    <input id="file" type="file" onChange={(e) => loadFile(e)} />
                    <img id="output" src={Me} alt="sdsd" />
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
                <Box className='basic-settings-input-container'>
                    <Box display='flex' alignItems='baseline' justifyContent='space-between'>
                        <TextField sx={{ marginTop: '10px', marginBotton: '10px', width: 'fill-available' }} id="outlined-basic-username" size="small" label="User Name" variant="outlined" />
                        <Button size='small' variant="text" style={{ color: `#000000`, backgroundColor: 'red', margin: '5px', marginLeft: '10px' }} sx={{ ':hover': { color: `black !important`, backgroundColor: 'white !important', } }}>Change</Button>
                    </Box>
                    <Box display='flex' alignItems='baseline' justifyContent='space-between'>
                        <TextField sx={{ marginTop: '10px', marginBotton: '10px', width: 'fill-available' }} id="outlined-basic-email" size="small" label="Email" variant="outlined" />
                        <Button size='small' variant="text" style={{ color: `#000000`, backgroundColor: 'red', margin: '5px', marginLeft: '10px' }} sx={{ ':hover': { color: `black !important`, backgroundColor: 'white !important', } }}>Change</Button>
                    </Box>
                    <Box display='flex' alignItems='baseline' justifyContent='space-between'>
                        <TextField sx={{ marginTop: '10px', marginBotton: '10px', width: 'fill-available' }} id="outlined-basic-phoneNumber" size="small" label="Phone Number" variant="outlined" />
                        <Button size='small' variant="text" style={{ color: `#000000`, backgroundColor: 'red', margin: '5px', marginLeft: '10px' }} sx={{ ':hover': { color: `black !important`, backgroundColor: 'white !important', } }}>Change</Button>
                    </Box>
                </Box>
            </Box>
            <Box marginTop='20px' marginBottom='10px' className='change-password-box'>
                <Box display='flex' flexDirection='column' alignItems='start'>
                    <Typography variant='h5' color='secondary'>Change Password</Typography>
                    <Typography variant='body2' color='secondary'>Enter your current password to verify your identity</Typography>
                </Box>
                <Box className='basic-settings-input-container'>
                    <Box display='flex' alignItems='baseline' justifyContent='space-between'>
                        <FormControl sx={{ width: 'fill-available', marginTop: '10px', marginBotton: '10px' }} size='small' variant="outlined">
                            <InputLabel htmlFor="outlined-adornment-password">Old Password</InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-password"
                                type={showPassword ? 'text' : 'password'}
                                endAdornment={
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
                                }
                                label="Password"
                            />
                        </FormControl>
                        <Button onClick={openResetPassword} size='small' variant="text" style={{ color: `#000000`, backgroundColor: 'red', margin: '5px', marginLeft: '10px' }} sx={{ ':hover': { color: `black !important`, backgroundColor: 'white !important', } }}>Submit</Button>
                    </Box>
                    {reset &&
                        <Box className='reset-password-box'>
                            <Box className='basic-settings-input-container'>
                                <Box display='flex' alignItems='baseline' justifyContent='space-between'>
                                    <FormControl sx={{ width: 'fill-available', marginTop: '15px', marginBotton: '15px' }} size='small' variant="outlined">
                                        <InputLabel htmlFor="outlined-adornment-password">New Password</InputLabel>
                                        <OutlinedInput
                                            id="outlined-adornment-password"
                                            type={showPassword ? 'text' : 'password'}
                                            endAdornment={
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
                                            }
                                            label="Password"
                                        />
                                    </FormControl>
                                </Box>
                                <Box display='flex' alignItems='baseline' justifyContent='space-between'>
                                    <FormControl sx={{ width: 'fill-available', marginTop: '15px', marginBotton: '15px' }} size='small' variant="outlined">
                                        <InputLabel htmlFor="outlined-adornment-password">Re-Enter New Password</InputLabel>
                                        <OutlinedInput
                                            id="outlined-adornment-password"
                                            type={showPassword ? 'text' : 'password'}
                                            endAdornment={
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
                                            }
                                            label="Password"
                                        />
                                    </FormControl>
                                </Box>
                            </Box>
                            <Box className='reset-password-button'>
                                <Button size='small' variant="text" style={{ color: `#000000`, backgroundColor: 'red', margin: '5px', marginLeft: '10px' }} sx={{ ':hover': { color: `black !important`, backgroundColor: 'white !important', } }}>Save</Button>
                            </Box>
                        </Box>
                    }
                </Box>
            </Box>
        </Box>
    )
}

export default BasicSettings