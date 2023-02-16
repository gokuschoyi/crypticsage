import React from 'react'
import './SettingSwitch.css'
import { useDispatch } from 'react-redux'
import { setSettingsState } from '../../SettingsSlice'
import { Box, Grid, Card, CardContent, Typography, useTheme, Button } from '@mui/material'
const SettingSwitch = (props) => {
    const dispatch = useDispatch()

    const SETTING_DATA = [
        {
            heading: 'Your Profile',
            subheading: 'Basic settings for your account'
        },
        {
            heading: 'Preferences',
            subheading: 'Manage your subscriptions'
        },
        {
            heading: 'Subscriptions',
            subheading: 'Frequently asked questions'
        },
        {
            heading: 'F.A.Q',
            subheading: 'Privacy policy for your account'
        },
        {
            heading: 'Privacy Policy',
            subheading: 'Help center for your account'
        },
        {
            heading: 'Support',
            subheading: 'Help center for your account'
        },
        
    ]

    const theme = useTheme()

    const SettingSwitchCard = ({ heading, subheading }) => {
        return (
            <Grid item xs={12} sm={6} md={4} lg={3} xl={2} className='grid-item-hover'>
                <Card sx={{
                    backgroundColor: 'red', height: '50px', width: 'fill-available', display: 'flex', justifyContent: 'center', alignItems: 'center', ':hover': {
                        color: `black !important`,
                        backgroundColor: 'white !important',
                    }
                }} >
                    <CardContent className='single-setting-card' sx={{ width: 'fill-available' }}>
                        <Typography sx={{ color: `${theme.palette.secondary.main}`, marginBottom: '0px' }} gutterBottom variant="h5" component="div">
                            {heading}
                        </Typography>
                        {/* <Typography sx={{ color: `${theme.palette.secondary.main}` }} variant="body2" color="text.secondary">
                            {subheading}
                        </Typography> */}
                    </CardContent>
                </Card>
            </Grid>
        )
    }

    const SettingSwitchCard2 = ({ heading, subheading }) => {
        return (
            <Grid item xs={12} sm={6} md={4} lg={3} xl={2} className='grid-item-hover'>
                <Button
                    onClick={(e) => dispatch(setSettingsState(e.target.textContent))}
                    variant="text"
                    style={{
                        color: `#000000`,
                        backgroundColor: 'red',
                        margin: '5px',
                        marginRight: '20px',
                        height: '40px',
                        width: '-webkit-fill-available'
                    }}
                    sx={{
                        fontSize: '16px',
                        ':hover': {
                            color: `black !important`,
                            backgroundColor: 'white !important',
                        },
                    }}>{heading}</Button>
            </Grid>
        )
    }

    return (
        <Box className='setting-switch-box' p={3} >
            <Grid container  sx={{  marginRight:'-16px' }}>
                {SETTING_DATA.map((data, index) => (
                    <SettingSwitchCard2 key={index} heading={data.heading} subheading={data.subheading} />
                ))}
            </Grid>
        </Box>
    )
}

export default SettingSwitch