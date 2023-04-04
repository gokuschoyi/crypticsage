import { Box, IconButton, useTheme, Button, Typography, Divider, Badge, Avatar } from "@mui/material";
import { useContext } from "react";
import { ColorModeContext } from "../../../themes/theme";
import { resetSettingsState } from '../dashboard_tabs/settings/SettingsSlice'
import { resetSectionState } from '../dashboard_tabs/sections/SectionSlice';
import { resetSidebarState } from "./SideBarSlice";
import { resetAuthState } from "../../authorization/authSlice";
import { resetStatsState } from '../dashboard_tabs/stats/StatsSlice.js';
import { useSelector, useDispatch } from 'react-redux';
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
    HelpOutlineOutlinedIcon,
    AddCardOutlinedIcon,
    QuizOutlinedIcon,
    RoomPreferencesOutlinedIcon,
    ManageAccountsOutlinedIcon
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

    const profileImage = useSelector(state => state.auth.photoUrl);

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
    const dispatch = useDispatch();
    const logOut = async () => {
        // localStorage.removeItem('userTheme');
        dispatch(resetAuthState());
        dispatch(resetSettingsState());
        dispatch(resetSectionState());
        dispatch(resetSidebarState());
        dispatch(resetStatsState());
    }

    const userContainer = () => {
        return (
            <Box className="user-nav" style={toggleUser ? mountedStyle : unmountedStyle}>
                <Box mr={2} className="user-cta-small">
                    <Typography className='user-nav-title' variant="h6" sx={{ color: theme.palette.secondary.main }}>Profile Settings</Typography>
                    <Divider />
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
                    <Box className="user-nav-item-small" sx={{ color: `${theme.palette.secondary.main} !important` }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <HelpOutlineOutlinedIcon className="user-nav-icon-small" />
                            <span>About</span>
                        </a>
                    </Box>
                    <Button onClick={logOut} variant="text" style={{ color: `#000000`, backgroundColor: 'red', margin: '5px' }} sx={{
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
                                {profileImage ? <Avatar  sx={{ width: 24, height: 24 }} src={profileImage} /> : <PersonOutlinedIcon />}
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