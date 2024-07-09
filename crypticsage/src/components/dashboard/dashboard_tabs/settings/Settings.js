import React from 'react'
import './Settings.css'
import { useSelector } from 'react-redux'
import Header from '../../global/Header'
import { SettingSwitch, BasicSettings } from './settings_components'

import { Box } from '@mui/material'
const Settings = (props) => {
    const { title, subtitle } = props
    const { tabName } = useSelector(state => state.settings)

    // const [tabName, setTabName] = React.useState('Basic Settings')
    /* const handleSettingSwitch = (tabName) => {
        setTabName(tabName)
    } */

    const SettingTabSwitcher = (tabName) => {
        switch (tabName) {
            case 'Your Profile':
                return <BasicSettings />
            case 'Preferences':
                return <Box>Preferences</Box>
            case 'Subscriptions':
                return <Box>Subscriptions</Box>
            case 'F.A.Q':
                return <Box>F.A.Q</Box>
            case 'Privacy Policy':
                return <Box>Privacy Policy</Box>
            case 'Support':
                return <Box>Support</Box>
            default:
                return <Box>Your Profile</Box>
        }
    }

    // console.log(tabName)

    return (
        <Box className='settings-container'>
            <Box width='-webkit-fill-available'>
                <Header title={title} subtitle={subtitle} />
            </Box>
            <Box className='settings-content'>
                <SettingSwitch />
            </Box>
            <Box className='settings-tab-container'>
                {SettingTabSwitcher(tabName)}
            </Box>
        </Box>
    )
}

export default Settings