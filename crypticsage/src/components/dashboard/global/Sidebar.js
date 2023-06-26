import { useEffect } from "react";
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSelector, useDispatch } from 'react-redux';
import { Sidebar, Menu, MenuItem, useProSidebar } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { Link } from "react-router-dom";
import CSLogo from '../../../assets/csLogo.png'
import {
    HomeOutlinedIcon,
    MenuOutlinedIcon,
    LibraryBooksOutlinedIcon,
    MenuBookOutlinedIcon,
    QuestionMarkIcon,
    ListAltIcon,
    ScheduleIcon,
    ExitToAppOutlinedIcon,
    SettingsOutlinedIcon,
    AdminPanelSettingsIcon,
    CandlestickChartIcon
} from "./Icons";
import { setSidebarState } from "./SideBarSlice";

const SidebarC = () => {
    const theme = useTheme();
    const mode = theme.palette.mode
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    const md = useMediaQuery(theme.breakpoints.down('md'));
    const dispatch = useDispatch();
    const { sidebarTab } = useSelector(state => state.sidebar);
    const { admin_status } = useSelector(state => state.auth);
    const userCollapsedSidebar = useSelector(state => state.auth.preferences.collapsedSidebar);
    const { collapseSidebar, collapsed } = useProSidebar();

    //add md to dep to triggrer collapseSidebar
    //adding collapsed prevetents opening the sidebar
    useEffect(() => {
        if (md) {
            if (!collapsed) {
                collapseSidebar();
            }
        }
        if (sm) {
            if (!collapsed) {
                collapseSidebar();
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [collapseSidebar, md, sm])

    const handleOnClick = (name) => {
        if (name === 'admin') {
            dispatch(setSidebarState('dashboardTab'));
        } else {
            dispatch(setSidebarState(name));
            console.log(name)
        }
    }

    return (
        <div className='sidebar' style={{ display: 'flex', height: '100%', position: 'fixed' }}>
            <Sidebar transitionDuration={700} defaultCollapsed={userCollapsedSidebar} width="300px" style={{ height: '100vh' }} rootStyles={{
                [`.ps-sidebar-container`]: {
                    backgroundColor: `${theme.palette.primary.newBlack}`,
                },
                [`.ps-menu-root`]: {
                    height: '100%',
                },
                [`.ps-menu-label`]: {
                    textAlign: 'left',
                },
            }}>
                <Menu iconshape="square">
                    {/* LOGO AND MENU ICON */}
                    {!collapsed ?
                        (
                            <Box
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                ml="15px"
                                sx={{ height: '72px' }}
                            >
                                <Typography variant="h3" color={theme.palette.secondary.main}>
                                    CRYPTICSAGE
                                </Typography>
                                <IconButton sx={{ color: `${theme.palette.secondary.main}` }} onClick={() => collapseSidebar()}>
                                    <MenuOutlinedIcon />
                                </IconButton>
                            </Box>
                        ) : (
                            <Box
                                backgroundColor={sm ? `${theme.palette.primary.newBlack}` : ''}
                                textAlign="center"
                                justifyContent='center'
                                alignItems='center'
                                display='flex'
                                sx={{ height: '72px' }}
                            >
                                {!sm ?
                                    (<IconButton style={{ color: `${theme.palette.text.primary}` }} onClick={() => collapseSidebar()}>
                                        <MenuOutlinedIcon />
                                    </IconButton>)
                                    :
                                    (
                                        <img 
                                        style={{filter: `${mode === 'dark' ? 'invert(1)' : ''}`}}
                                        className="smallscreen-logo" height="45px" alt='logo' src={CSLogo}></img>
                                    )
                                }
                            </Box>
                        )}

                    <Box className="menu-icon-holder" paddingLeft={collapsed ? undefined : "0%"} >
                        <MenuItem
                            active={sidebarTab === "dashboardTab"}
                            style={{
                                backgroundColor: sidebarTab === "dashboardTab" ? theme.palette.primary.newWhite : theme.palette.primary.newBlack,
                                color: sidebarTab === "dashboardTab" ? theme.palette.primary.newBlack : theme.palette.primary.newWhite,
                            }}
                            onClick={() => handleOnClick("dashboardTab")}
                            icon={<HomeOutlinedIcon />}
                            component={<Link to="/dashboard" />}
                            className="menu-item"
                        >
                            <Typography>Dashboard</Typography>
                        </MenuItem>

                        <Typography
                            className='sidebar-label'
                            variant="h6"
                            color='red'
                            sx={{
                                m: `${collapsed ? '5px 0px 5px 0px' : '15px 0 5px 20px'}`,
                                textAlign: `${collapsed ? 'center' : 'left'}`
                            }}
                        >
                            TOOLS
                        </Typography>

                        <MenuItem
                            active={sidebarTab === "sections"}
                            style={{
                                backgroundColor: sidebarTab === "sections" ? theme.palette.primary.newWhite : theme.palette.primary.newBlack,
                                color: sidebarTab === "sections" ? theme.palette.primary.newBlack : theme.palette.primary.newWhite,
                            }}
                            onClick={() => handleOnClick("sections")}
                            icon={<LibraryBooksOutlinedIcon />}
                            component={<Link to="sections" />}
                            className="menu-item"
                        >
                            <Typography>Lessons</Typography>
                        </MenuItem>

                        <MenuItem
                            active={sidebarTab === "journal"}
                            style={{
                                backgroundColor: sidebarTab === "journal" ? theme.palette.primary.newWhite : theme.palette.primary.newBlack,
                                color: sidebarTab === "journal" ? theme.palette.primary.newBlack : theme.palette.primary.newWhite,
                            }}
                            onClick={() => handleOnClick("journal")}
                            icon={<MenuBookOutlinedIcon />}
                            component={<Link to="journal" />}
                            className="menu-item"
                        >
                            <Typography>Journal</Typography>
                        </MenuItem>

                        <MenuItem
                            active={sidebarTab === "indicators"}
                            style={{
                                backgroundColor: sidebarTab === "indicators" ? theme.palette.primary.newWhite : theme.palette.primary.newBlack,
                                color: sidebarTab === "indicators" ? theme.palette.primary.newBlack : theme.palette.primary.newWhite,
                            }}
                            onClick={() => handleOnClick("indicators")}
                            icon={<CandlestickChartIcon />}
                            component={<Link to="indicators" />}
                            className="menu-item"
                        >
                            <Typography>Indicators</Typography>
                        </MenuItem>

                        <MenuItem
                            active={sidebarTab === "quiz"}
                            style={{
                                backgroundColor: sidebarTab === "quiz" ? theme.palette.primary.newWhite : theme.palette.primary.newBlack,
                                color: sidebarTab === "quiz" ? theme.palette.primary.newBlack : theme.palette.primary.newWhite,
                            }}
                            onClick={() => handleOnClick("quiz")}
                            icon={<QuestionMarkIcon />}
                            component={<Link to="quiz" />}
                            className="menu-item"
                        >
                            <Typography>Quiz</Typography>
                        </MenuItem>

                        <MenuItem
                            active={sidebarTab === "glossary"}
                            style={{
                                backgroundColor: sidebarTab === "glossary" ? theme.palette.primary.newWhite : theme.palette.primary.newBlack,
                                color: sidebarTab === "glossary" ? theme.palette.primary.newBlack : theme.palette.primary.newWhite,
                            }}
                            onClick={() => handleOnClick("glossary")}
                            icon={<ListAltIcon />}
                            component={<Link to="glossary" />}
                            className="menu-item"
                        >
                            <Typography>Glossary</Typography>
                        </MenuItem>

                        <MenuItem
                            active={sidebarTab === "schedule"}
                            style={{
                                backgroundColor: sidebarTab === "schedule" ? theme.palette.primary.newWhite : theme.palette.primary.newBlack,
                                color: sidebarTab === "schedule" ? theme.palette.primary.newBlack : theme.palette.primary.newWhite,
                            }}
                            onClick={() => handleOnClick("schedule")}
                            icon={<ScheduleIcon />}
                            component={<Link to="schedule" />}
                            className="menu-item"
                        >
                            <Typography>Schedule</Typography>
                        </MenuItem>

                        <Typography
                            className='sidebar-label'
                            variant="h6"
                            color='red'
                            sx={{ m: `${collapsed ? '5px 0px 5px 0px' : '15px 0 5px 20px'}`, textAlign: `${collapsed ? 'center' : 'left'}` }}
                        >
                            ACCOUNT
                        </Typography>

                        <MenuItem
                            active={sidebarTab === "settings"}
                            style={{
                                backgroundColor: sidebarTab === "settings" ? theme.palette.primary.newWhite : theme.palette.primary.newBlack,
                                color: sidebarTab === "settings" ? theme.palette.primary.newBlack : theme.palette.primary.newWhite,
                            }}
                            onClick={() => handleOnClick("settings")}
                            icon={<SettingsOutlinedIcon />}
                            component={<Link to="settings" />}
                            className="menu-item"
                        >
                            <Typography>Settings</Typography>
                        </MenuItem>

                        {admin_status && (
                            <MenuItem
                                active={sidebarTab === "admin"}
                                style={{
                                    backgroundColor: sidebarTab === "admin" ? theme.palette.primary.newWhite : theme.palette.primary.newBlack,
                                    color: sidebarTab === "admin" ? theme.palette.primary.newBlack : theme.palette.primary.newWhite,
                                }}
                                onClick={() => handleOnClick("admin")}
                                icon={<AdminPanelSettingsIcon />}
                                component={<Link to="/admin-dashboard" />}
                                className="menu-item"
                            >
                                <Typography>Admin</Typography>
                            </MenuItem>
                        )}

                        <MenuItem
                            active={sidebarTab === "logout"}
                            style={{
                                backgroundColor: sidebarTab === "logout" ? theme.palette.primary.newWhite : theme.palette.primary.newBlack,
                                color: sidebarTab === "logout" ? theme.palette.primary.newBlack : theme.palette.primary.newWhite,
                            }}
                            onClick={() => handleOnClick("logout")}
                            icon={<ExitToAppOutlinedIcon />}
                            component={<Link to="logout" />}
                            className="menu-item"
                        >
                            <Typography>Log Out</Typography>
                        </MenuItem>
                    </Box>
                </Menu>
            </Sidebar>
        </div>
    );
};

export default SidebarC;