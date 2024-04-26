import { useEffect } from "react";
import { Box, IconButton, useTheme, Button, Typography, Divider, Badge, Avatar } from "@mui/material";
import useMediaQuery from '@mui/material/useMediaQuery';
import { useContext } from "react";
import { ColorModeContext } from "../../../themes/theme";
import { resetSettingsState } from '../dashboard_tabs/settings/SettingsSlice'
import { resetSectionState } from '../dashboard_tabs/sections/SectionSlice';
import { handleReduxToggleSmallScreenSidebar, resetSidebarState } from "./SideBarSlice";
import { setUserTheme, resetAuthState } from "../../authorization/authSlice";
import { resetStatsState } from '../dashboard_tabs/stats/StatsSlice.js';
import { resetTransformedData } from "../dashboard_tabs/quiz/QuizSlice";
import { resetIndicatorsState } from '../dashboard_tabs/indicators/IndicatorsSlice'
import { resetCryptoStockModule } from '../dashboard_tabs/indicators/modules/CryptoModuleSlice'
import { resetStocksDataInDbRedux } from '../dashboard_tabs/indicators/modules/StockModuleSlice'
import { useSelector, useDispatch } from 'react-redux';
import {
    LightModeOutlinedIcon,
    DarkModeOutlinedIcon,
    NotificationsOutlinedIcon,
    SettingsOutlinedIcon,
    PersonOutlinedIcon,
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
import { signOutUser } from '../../../api/auth'
const notification_from_localStorage = JSON.parse(localStorage.getItem('user_notifications')) || []

const Topbar = () => {
    // console.log('notification data local storage : ', notification_from_localStorage)
    const {
        notifications,
        clear,
        remove,
        markAllAsRead,
        markAsRead,
        unreadCount
    } = useNotificationCenter(
        {
            data: notification_from_localStorage,
        }
    );

    const profileImage = useSelector(state => state.auth.photoUrl);
    const smallScreenToggleState = useSelector(state => state.sidebar.toggleSmallScreenSidebarState)
    const uid = useSelector(state => state.auth.uid);
    const theme = useTheme();
    const mode = theme.palette.mode;
    const sm = useMediaQuery(theme.breakpoints.down('sm'));

    const colorMode = useContext(ColorModeContext);

    const userTheme = useSelector(state => state.auth.preferences.theme);

    const toggleTheme = () => {
        dispatch(setUserTheme({ theme: !userTheme }))
        localStorage.setItem('userTheme', !userTheme)
    }

    useEffect(() => {
        // console.log('UE : theme setting', userTheme, mode)
        if (userTheme === true) {
            // console.log('user prefers dark mode')
            if (mode === 'dark') {
                // console.log('current mode dark', mode)
                return
            } else {
                // console.log('current mode light', mode)
                colorMode.toggleColorMode()
            }
        } else {
            // console.log('user prefers light mode')
            if (mode === 'light') {
                // console.log('current mode light', mode)
                return
            } else {
                // console.log('current mode dark', mode)
                colorMode.toggleColorMode()
            }
        }
    }, [userTheme, mode, colorMode])

    const showSidebar = () => {
        if (!smallScreenToggleState) {
            let sidebar = document.getElementsByClassName('sidebar')[0]
            // let content = document.getElementsByClassName('content')[0]

            sidebar.classList.add('show-sidebar');
            sidebar.classList.remove('hide-sidebar');
            // content.style.setProperty('--marginLeft', '80px!important');
            // handleToggleSmallScreenSidebar()
            dispatch(handleReduxToggleSmallScreenSidebar({ value: !smallScreenToggleState }))
            console.log('show sidebar');
        } else {
            let sidebar = document.getElementsByClassName('sidebar')[0]
            // let content = document.getElementsByClassName('content')[0]

            sidebar.classList.remove('show-sidebar');
            sidebar.classList.add('hide-sidebar');
            // content.style.setProperty('--marginLeft', '0px !important');
            // handleToggleSmallScreenSidebar()
            dispatch(handleReduxToggleSmallScreenSidebar({ value: !smallScreenToggleState }))
            console.log('hide sidebar');
        }
    }

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
        dispatch(resetStocksDataInDbRedux());
        localStorage.removeItem('user_notifications');
        signOutUser(uid)
            .then((res) => {
                console.log(res)
            })
            .catch((error) => {
                console.log(error)
            })
    }

    const userContainer = () => {
        return (
            <Box className="user-nav">
                <Box mr={2} className="bottom-arrow-user"></Box>
                <Box mr={2} className="user-cta-small">
                    <Typography className='user-nav-title' variant="h6" color={'primary'}>Profile Settings</Typography>
                    <Divider />
                    <Box className="user-nav-item-small">
                        <a className="user-nav-link-small" href="#userprofile">
                            <ExploreOutlinedIcon className="user-nav-icon-small" />
                            <span>Explore Creators</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small">
                        <a className="user-nav-link-small" href="#userprofile">
                            <AddReactionOutlinedIcon className="user-nav-icon-small" />
                            <span>Invite</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small">
                        <a className="user-nav-link-small" href="#userprofile">
                            <HelpOutlineOutlinedIcon className="user-nav-icon-small" />
                            <span>About</span>
                        </a>
                    </Box>
                    <Button onClick={logOut} size="small" variant="outlined" >LOG OUT</Button>
                </Box>
            </Box>
        )
    }

    const settingsContainer = () => {
        return (
            <Box className="user-settings">
                <Box mr={2} className="bottom-arrow-settings"></Box>
                <Box mr={2} className="user-cta-small">
                    <Typography className='user-nav-title' variant="h6" color={'primary'}>Settings</Typography>
                    <Divider />
                    <Box className="user-nav-item-small">
                        <a className="user-nav-link-small" href="#userprofile">
                            <ManageAccountsOutlinedIcon className="user-nav-icon-small" />
                            <span>Your Profile</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small">
                        <a className="user-nav-link-small" href="#userprofile">
                            <RoomPreferencesOutlinedIcon className="user-nav-icon-small" />
                            <span>Preferences</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small">
                        <a className="user-nav-link-small" href="#userprofile">
                            <AddCardOutlinedIcon className="user-nav-icon-small" />
                            <span>Subscriptions</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small">
                        <a className="user-nav-link-small" href="#userprofile">
                            <QuizOutlinedIcon className="user-nav-icon-small" />
                            <span>F.A.Q</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small">
                        <a className="user-nav-link-small" href="#userprofile">
                            <AdminPanelSettingsOutlinedIcon className="user-nav-icon-small" />
                            <span>Privacy Policy</span>
                        </a>
                    </Box>
                    <Box className="user-nav-item-small">
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
            <Box className="user-notification">
                <Box mr={2} className="bottom-arrow-notification"></Box>
                <Notifications
                    notifications={notifications}
                    clear={clear}
                    remove={remove}
                    markAllAsRead={markAllAsRead}
                    markAsRead={markAsRead}
                    unreadCount={unreadCount}
                />
            </Box>
        )
    }

    const toggleTopBarNotification = ({ type }) => {
        const notificationDropdown = document.getElementsByClassName('user-notification')[0];
        const settingsDropdown = document.getElementsByClassName('user-settings')[0];
        const userNavDropdown = document.getElementsByClassName('user-nav')[0];
        switch (type) {
            case 'notification':
                notificationDropdown.classList.toggle('show-notification')
                if (settingsDropdown.classList.contains('show-settings')) {
                    settingsDropdown.classList.toggle('show-settings');
                }

                if (userNavDropdown.classList.contains('show-user-nav')) {
                    userNavDropdown.classList.toggle('show-user-nav');
                }
                break;
            case 'settings':
                settingsDropdown.classList.toggle('show-settings')
                if (notificationDropdown.classList.contains('show-notification')) {
                    notificationDropdown.classList.toggle('show-notification');
                }

                if (userNavDropdown.classList.contains('show-user-nav')) {
                    userNavDropdown.classList.toggle('show-user-nav');
                }
                break;
            case 'user':
                userNavDropdown.classList.toggle('show-user-nav')
                if (notificationDropdown.classList.contains('show-notification')) {
                    notificationDropdown.classList.toggle('show-notification');
                }

                if (settingsDropdown.classList.contains('show-settings')) {
                    settingsDropdown.classList.toggle('show-settings');
                }
                break;
            default:
                if (notificationDropdown.classList.contains('show-notification')) {
                    notificationDropdown.classList.toggle('show-notification');
                }

                if (settingsDropdown.classList.contains('show-settings')) {
                    settingsDropdown.classList.toggle('show-settings');
                }

                if (userNavDropdown.classList.contains('show-user-nav')) {
                    userNavDropdown.classList.toggle('show-user-nav');
                }
                break;
        }
    }

    return (
        <Box
            className="topbar"
            sx={{ borderBottom: '#3f3f3f 1px solid' }}
            justifyContent={sm ? "space-between" : "flex-end"}
            p={2}
            backgroundColor={theme.palette.primary.newBlack}
        >
            {sm && (
                <Box display="flex">
                    <IconButton
                        className={smallScreenToggleState ? 'rotate-icon-topbar' : 'remove-rotate-icon'}
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
                            <IconButton onClick={toggleTheme}>
                                <LightModeOutlinedIcon />
                            </IconButton>
                            <IconButton onClick={toggleTopBarNotification.bind(null, { type: 'notification' })}>
                                <Badge badgeContent={unreadCount || 0}>
                                    <NotificationsOutlinedIcon />
                                </Badge>
                            </IconButton>
                            <IconButton onClick={toggleTopBarNotification.bind(null, { type: 'settings' })}>
                                <SettingsOutlinedIcon />
                            </IconButton>
                            <IconButton onClick={toggleTopBarNotification.bind(null, { type: 'user' })}>
                                {profileImage ? <Avatar sx={{ width: 24, height: 24 }} src={profileImage} /> : <PersonOutlinedIcon />}
                            </IconButton>
                        </Box>
                    )
                    :
                    (
                        <Box display='flex'>
                            <IconButton onClick={toggleTheme}>
                                <DarkModeOutlinedIcon sx={{ color: `${theme.palette.primary.newWhite}` }} />
                            </IconButton>
                            <IconButton onClick={toggleTopBarNotification.bind(null, { type: 'notification' })}>
                                <Badge badgeContent={unreadCount || 0} sx={{ color: `${theme.palette.primary.newWhite}` }}>
                                    <NotificationsOutlinedIcon sx={{ color: `${theme.palette.primary.newWhite}` }} />
                                </Badge>
                            </IconButton>
                            <IconButton onClick={toggleTopBarNotification.bind(null, { type: 'settings' })}>
                                <SettingsOutlinedIcon sx={{ color: `${theme.palette.primary.newWhite}` }} />
                            </IconButton>
                            <IconButton onClick={toggleTopBarNotification.bind(null, { type: 'user' })}>
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