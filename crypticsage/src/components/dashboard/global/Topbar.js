import { useRef, useEffect } from "react";
import { Box, IconButton, useTheme, Button, Typography, Divider, Badge, Avatar } from "@mui/material";
import useMediaQuery from '@mui/material/useMediaQuery';
import { useContext } from "react";
import { ColorModeContext } from "../../../themes/theme";
import { resetSettingsState } from '../dashboard_tabs/settings/SettingsSlice'
import { resetSectionState } from '../dashboard_tabs/sections/SectionSlice';
import { handleReduxToggleSmallScreenSidebar, resetSidebarState } from "./SideBarSlice";
import { resetAuthState } from "../../authorization/authSlice";
import { resetStatsState } from '../dashboard_tabs/stats/StatsSlice.js';
import { resetTransformedData } from "../dashboard_tabs/quiz/QuizSlice";
import { resetIndicatorsState } from '../dashboard_tabs/indicators/IndicatorsSlice'
import { resetCryptoStockModule } from '../dashboard_tabs/indicators/modules/CryptoStockModuleSlice'
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
    ManageAccountsOutlinedIcon,
    ArrowForwardIcon
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
    const smallScreenToggleState = useSelector(state => state.sidebar.toggleSmallScreenSidebarState)

    const {
        toggleUser,
        setToggleUser,
        toggleSettings,
        setToggleSettings,
        toggleNotifications,
        setToggleNotifications,
        toggleSmallScreenSidebar,
        handleToggleSmallScreenSidebar,
    } = props;

    const mountedStyle = { animation: "inAnimation 250ms ease-in" };
    const unmountedStyle = {
        animation: "outAnimation 270ms ease-out",
        animationFillMode: "forwards"
    };

    const theme = useTheme();
    const mode = theme.palette.mode;
    const sm = useMediaQuery(theme.breakpoints.down('sm'));

    const smallScreenSidebarLoad = useRef(false)
    useEffect(() => {
        if (!smallScreenSidebarLoad.current) { // Only run if the component is mounted
            if (!toggleSmallScreenSidebar) {
                let sidebar = document.getElementsByClassName('sidebar')[0]
                let content = document.getElementsByClassName('content')[0]

                if (sidebar === undefined || content === undefined) {
                    smallScreenSidebarLoad.current = false
                    console.log("undefined")
                    return
                } else {
                    smallScreenSidebarLoad.current = true // Set the mount state to true after the first run

                    sidebar.classList.remove('show-sidebar');
                    content.style.setProperty('--marginLeft', '0px !important');
                    handleToggleSmallScreenSidebar()
                    dispatch(handleReduxToggleSmallScreenSidebar({ value: !toggleSmallScreenSidebar }))
                    console.log('hide sidebar');
                }
            } else { smallScreenSidebarLoad.current = true }
        }
    })

    const showSidebar = () => {
        if (toggleSmallScreenSidebar) {
            let sidebar = document.getElementsByClassName('sidebar')[0]
            let content = document.getElementsByClassName('content')[0]

            sidebar.classList.add('show-sidebar');
            content.style.setProperty('--marginLeft', '80px!important');
            handleToggleSmallScreenSidebar()
            dispatch(handleReduxToggleSmallScreenSidebar({ value: !toggleSmallScreenSidebar }))
            console.log('show sidebar');
        } else {
            let sidebar = document.getElementsByClassName('sidebar')[0]
            let content = document.getElementsByClassName('content')[0]

            sidebar.classList.remove('show-sidebar');
            content.style.setProperty('--marginLeft', '0px !important');
            handleToggleSmallScreenSidebar()
            dispatch(handleReduxToggleSmallScreenSidebar({ value: !toggleSmallScreenSidebar }))
            console.log('hide sidebar');
        }
    }


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
        dispatch(resetTransformedData());
        dispatch(resetIndicatorsState());
        dispatch(resetCryptoStockModule());
    }

    const userContainer = () => {
        return (
            <Box className="user-nav" style={toggleUser ? mountedStyle : unmountedStyle}>
                <Box mr={2} className="user-cta-small">
                    <Typography className='user-nav-title' variant="h6" sx={{ color: 'white' }}>Profile Settings</Typography>
                    <Divider />
                    <Box className="user-nav-item-small" sx={{ color: 'white' }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <ExploreOutlinedIcon className="user-nav-icon-small" />
                            <span>Explore Creators</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small" sx={{ color: 'white' }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <AddReactionOutlinedIcon className="user-nav-icon-small" />
                            <span>Invite</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small" sx={{ color: 'white' }}>
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
                    <Typography className='user-nav-title' variant="h6" sx={{ color: 'white' }}>Settings</Typography>
                    <Divider />
                    <Box className="user-nav-item-small" sx={{ color: 'white' }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <ManageAccountsOutlinedIcon className="user-nav-icon-small" />
                            <span>Your Profile</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small" sx={{ color: 'white' }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <RoomPreferencesOutlinedIcon className="user-nav-icon-small" />
                            <span>Preferences</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small" sx={{ color: 'white' }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <AddCardOutlinedIcon className="user-nav-icon-small" />
                            <span>Subscriptions</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small" sx={{ color: 'white' }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <QuizOutlinedIcon className="user-nav-icon-small" />
                            <span>F.A.Q</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small" sx={{ color: 'white' }}>
                        <a className="user-nav-link-small" href="#userprofile">
                            <AdminPanelSettingsOutlinedIcon className="user-nav-icon-small" />
                            <span>Privacy Policy</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small" sx={{ color: 'white' }}>
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
        <Box
            className="topbar"
            display="flex"
            sx={{ borderBottom: mode === 'light' ? '1px solid #000000' : '' }}
            justifyContent="flex-end"
            p={2}
            backgroundColor={theme.palette.primary.newBlack}
        >
            {sm && (
                <Box display="flex">
                    <IconButton
                        className={smallScreenToggleState ? 'remove-rotate-icon' : 'rotate-icon'}
                        sx={{ color: `${theme.palette.secondary.main}` }}
                        onClick={(e) => showSidebar(e)}>
                        <ArrowForwardIcon />
                    </IconButton>
                </Box>
            )}

            {/* SEARCH BAR 
            <Box
                display="flex"
                borderRadius="3px"
            >
                <InputBase
                    sx={{
                        ml: 2,
                        flex: 1,
                        backgroundColor: theme.palette.primary.newWhite,
                        color: theme.palette.primary.newBlack,
                        borderRadius: '20px',
                        ' .MuiInputBase-input': {
                            textIndent: '20px',
                        },
                    }}
                    placeholder="Search" />
                <IconButton type="button" sx={{ p: 1 }}>
                    <SearchIcon />
                </IconButton>
            </Box> */}

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
                                {profileImage ? <Avatar sx={{ width: 24, height: 24 }} src={profileImage} /> : <PersonOutlinedIcon />}
                            </IconButton>
                        </Box>
                    )
                    :
                    (
                        <Box display='flex'>
                            <IconButton onClick={colorMode.toggleColorMode}>
                                <DarkModeOutlinedIcon sx={{ color: `${theme.palette.primary.newWhite}` }} />
                            </IconButton>
                            <IconButton onClick={setToggleNotifications}>
                                <Badge badgeContent={unreadCount || 0} sx={{ color: `${theme.palette.primary.newWhite}` }}>
                                    <NotificationsOutlinedIcon sx={{ color: `${theme.palette.primary.newWhite}` }} />
                                </Badge>
                            </IconButton>
                            <IconButton onClick={setToggleSettings}>
                                <SettingsOutlinedIcon sx={{ color: `${theme.palette.primary.newWhite}` }} />
                            </IconButton>
                            <IconButton onClick={setToggleUser}>
                                {profileImage ? <Avatar sx={{ width: 24, height: 24 }} src={profileImage} /> : <PersonOutlinedIcon />}
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