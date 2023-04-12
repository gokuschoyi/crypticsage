import React from 'react'
import { useNotificationCenter } from "react-toastify/addons/use-notification-center";
import Notifications from '../../dashboard/global/Notifications';
import { Box, IconButton, Badge, Typography, Divider, useTheme } from '@mui/material'
import {
    NotificationsOutlinedIcon,
    SettingsOutlinedIcon,
    ManageAccountsOutlinedIcon,
    RoomPreferencesOutlinedIcon,
    AddCardOutlinedIcon,
    QuizOutlinedIcon,
    AdminPanelSettingsOutlinedIcon,
    HeadphonesOutlinedIcon
} from '../../dashboard/global/Icons'
const AdminTopbar = (props) => {
    const {
        toggleSettings,
        setToggleSettings,
        toggleNotifications,
        setToggleNotifications
    } = props;

    const {
        notifications,
        clear,
        markAllAsRead,
        markAsRead,
        unreadCount
    } = useNotificationCenter();

    const theme = useTheme();

    const mountedStyle = { animation: "inAnimation 250ms ease-in" };
    const unmountedStyle = {
        animation: "outAnimation 270ms ease-out",
        animationFillMode: "forwards"
    };

    const settingsContainer = () => {
        return (
            <Box className="user-nav" style={toggleSettings ? mountedStyle : unmountedStyle}>
                <Box mr={2} className="user-cta-small">
                    <Typography className='user-nav-title' variant="h6" sx={{ color: theme.palette.secondary.main }}>Settings</Typography>
                    <Divider />
                    <Box className="user-nav-item-small" sx={{ color: `${theme.palette.secondary.main} !important` }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <ManageAccountsOutlinedIcon className="user-nav-icon-small" />
                            <span>Your Profile</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small" sx={{ color: `${theme.palette.secondary.main} !important` }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <RoomPreferencesOutlinedIcon className="user-nav-icon-small" />
                            <span>Preferences</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small" sx={{ color: `${theme.palette.secondary.main} !important` }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <AddCardOutlinedIcon className="user-nav-icon-small" />
                            <span>Subscriptions</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small" sx={{ color: `${theme.palette.secondary.main} !important` }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <QuizOutlinedIcon className="user-nav-icon-small" />
                            <span>F.A.Q</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small" sx={{ color: `${theme.palette.secondary.main} !important` }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <AdminPanelSettingsOutlinedIcon className="user-nav-icon-small" />
                            <span>Privacy Policy</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small" sx={{ color: `${theme.palette.secondary.main} !important` }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <HeadphonesOutlinedIcon className="user-nav-icon-small" />
                            <span>Support</span>
                        </a>
                    </Box>
                </Box>
            </Box>
        )
    }

    const notificationCenter = () => {
        return (
            <Box className="user-notification" style={toggleNotifications ? mountedStyle : unmountedStyle}>
                <Notifications
                    notifications={notifications}
                    clear={clear}
                    markAllAsRead={markAllAsRead}
                    markAsRead={markAsRead}
                    unreadCount={unreadCount}
                />
            </Box>
        )
    }

    return (
        <Box className='admin-topbar' display='flex' justifyContent='flex-end' width='100%'
            sx={{ backgroundColor: theme.palette.primary.newBlack }}
        >
            <Box display='flex' padding='10px'>
                <IconButton onClick={setToggleNotifications}>
                    <Badge badgeContent={unreadCount || 0}>
                        <NotificationsOutlinedIcon sx={{ color: `${theme.palette.primary.newWhite}`}}/>
                    </Badge>
                </IconButton>
                <IconButton onClick={setToggleSettings}>
                    <SettingsOutlinedIcon sx={{ color: `${theme.palette.primary.newWhite}`}}/>
                </IconButton>
            </Box>
            {settingsContainer()}
            {notificationCenter()}
        </Box>
    )
}

export default AdminTopbar