import React from 'react'
import './SettingSwitch.css'
import { useDispatch } from 'react-redux'
import { setSettingsState } from '../../SettingsSlice'
import { Box, Grid, Button } from '@mui/material'
const SettingSwitch = (props) => {
    const dispatch = useDispatch()

    const SETTING_DATA = [
        {
            heading: 'Your Profile',
            subheading: 'Basic settings for your account'
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

    const SettingSwitchCard2 = ({ heading, subheading }) => {
        return (
            <Grid item xs={12} sm={6} md={4} lg={3} xl={2} className='grid-item-hover'>
                <Button
                    onClick={(e) => dispatch(setSettingsState(e.target.textContent))}
                    variant="outlined"
                    size='small'
                    style={{
                        
                        margin: '5px',
                        marginRight: '20px',
                        height: '35px',
                        width: '-webkit-fill-available'
                    }}
                    >{heading}</Button>
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