import { Box, IconButton, useTheme, Button, Typography, Divider, Badge } from "@mui/material";
import { useContext, useEffect } from "react";
import { ColorModeContext } from "../../../themes/theme";
import InputBase from "@mui/material/InputBase";
import {
    LightModeOutlinedIcon,
    DarkModeOutlinedIcon,
    NotificationsOutlinedIcon,
    SettingsOutlinedIcon,
    PersonOutlinedIcon,
    SearchIcon,
    ExploreOutlinedIcon,
    AddReactionOutlinedIcon,
    AdminPanelSettingsOutlinedIcon,
    HeadphonesOutlinedIcon,
    HelpOutlineOutlinedIcon
} from './Icons'

import "./Global.css"

import { useNotificationCenter } from "react-toastify/addons/use-notification-center";
import Notifications from "./Notifications";

const Topbar = (props) => {
    const {
        notifications,
        clear,
        markAllAsRead,
        markAsRead,
        unreadCount
    } = useNotificationCenter();


    const {
        toggleUser,
        setToggleUser,
        toggleSettings,
        setToggleSettings,
        toggleNotifications,
        setToggleNotifications,
    } = props;

    const mountedStyle = { animation: "inAnimation 250ms ease-in" };
    const unmountedStyle = {
        animation: "outAnimation 270ms ease-out",
        animationFillMode: "forwards"
    };

    const theme = useTheme();
    const colorMode = useContext(ColorModeContext);
    // console.log(toggleNotifications);

    const userContainer = () => {
        return (
            <Box className="user-nav" style={toggleUser ? mountedStyle : unmountedStyle}>
                <Box mr={2} className="user-cta-small">
                    <Typography className='user-nav-title' variant="h6" sx={{ color: theme.palette.secondary.main }}>Profile Settings</Typography>
                    <Divider />
                    <Box className="user-nav-item-small" sx={{ color: `${theme.palette.secondary.main} !important` }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <PersonOutlinedIcon className="user-nav-icon-small" />
                            <span>View Profile</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small" sx={{ color: `${theme.palette.secondary.main} !important` }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <ExploreOutlinedIcon className="user-nav-icon-small" />
                            <span>Explore Creators</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small" sx={{ color: `${theme.palette.secondary.main} !important` }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <AddReactionOutlinedIcon className="user-nav-icon-small" />
                            <span>Invite</span>
                        </a>
                    </Box>
                    <Button variant="text" style={{ color: `#000000`, backgroundColor: 'red', margin: '5px' }} sx={{
                        ':hover': {
                            color: `black !important`,
                            backgroundColor: 'white !important',
                        },
                    }}>LOG OUT</Button>
                </Box>
            </Box>
        )
    }

    const settingsContainer = () => {
        return (
            <Box className="user-nav" style={toggleSettings ? mountedStyle : unmountedStyle}>
                <Box mr={2} className="user-cta-small">
                    <Typography className='user-nav-title' variant="h6" sx={{ color: theme.palette.secondary.main }}>Settings</Typography>
                    <Divider />
                    <Box className="user-nav-item-small" sx={{ color: `${theme.palette.secondary.main} !important` }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <SettingsOutlinedIcon className="user-nav-icon-small" />
                            <span>Basic Settings</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small" sx={{ color: `${theme.palette.secondary.main} !important` }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <AdminPanelSettingsOutlinedIcon className="user-nav-icon-small" />
                            <span>Privacy & Security</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small" sx={{ color: `${theme.palette.secondary.main} !important` }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <HeadphonesOutlinedIcon className="user-nav-icon-small" />
                            <span>Help & Support</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small" sx={{ color: `${theme.palette.secondary.main} !important` }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <HelpOutlineOutlinedIcon className="user-nav-icon-small" />
                            <span>About</span>
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
        <Box display="flex" justifyContent="space-between" p={2} backgroundColor={theme.palette.primary.dark}>
            {/* SEARCH BAR */}
            <Box
                display="flex"
                borderRadius="3px"
            >
                <InputBase
                    sx={{
                        ml: 2,
                        flex: 1,
                        backgroundColor: theme.palette.secondary.main,
                        color: theme.palette.primary.dark,
                        borderRadius: '20px',
                        ' .MuiInputBase-input': {
                            textIndent: '20px',
                        },
                    }}
                    placeholder="Search" />
                <IconButton type="button" sx={{ p: 1 }}>
                    <SearchIcon />
                </IconButton>
            </Box>

            {/* ICONS */}
            <Box display="flex">
                {theme.palette.mode === "dark" ?
                    (
                        <Box display='flex'>
                            <IconButton onClick={colorMode.toggleColorMode}>
                                <LightModeOutlinedIcon />
                            </IconButton>
                            <IconButton onClick={setToggleNotifications}>
                                <Badge badgeContent={unreadCount || 0}>
                                    <NotificationsOutlinedIcon />
                                </Badge>
                            </IconButton>
                            <IconButton onClick={setToggleSettings}>
                                <SettingsOutlinedIcon />
                            </IconButton>
                            <IconButton onClick={setToggleUser}>
                                <PersonOutlinedIcon />
                            </IconButton>
                        </Box>
                    )
                    :
                    (
                        <Box display='flex'>
                            <IconButton onClick={colorMode.toggleColorMode}>
                                <DarkModeOutlinedIcon sx={{ color: 'white' }} />
                            </IconButton>
                            <IconButton onClick={setToggleNotifications}>
                                <Badge badgeContent={unreadCount || 0} sx={{ color: 'white' }}>
                                    <NotificationsOutlinedIcon sx={{ color: 'white' }} />
                                </Badge>
                            </IconButton>
                            <IconButton onClick={setToggleSettings}>
                                <SettingsOutlinedIcon sx={{ color: 'white' }} />
                            </IconButton>
                            <IconButton onClick={setToggleUser}>
                                <PersonOutlinedIcon sx={{ color: 'white' }} />
                            </IconButton>
                        </Box>
                    )
                }
            </Box>
            {userContainer()}
            {settingsContainer()}
            {notificationCenter()}
        </Box>
    );
};

export default Topbar;