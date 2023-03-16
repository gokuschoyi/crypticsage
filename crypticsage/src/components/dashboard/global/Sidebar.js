import { useEffect } from "react";
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSelector, useDispatch } from 'react-redux';
import { Sidebar, Menu, MenuItem, useProSidebar } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { Link } from "react-router-dom";
import {
    HomeOutlinedIcon,
    MenuOutlinedIcon,
    LibraryBooksOutlinedIcon,
    MenuBookOutlinedIcon,
    QuestionMarkIcon,
    ListAltIcon,
    ScheduleIcon,
    ExitToAppOutlinedIcon,
    SettingsOutlinedIcon
} from "./Icons";
import { setSidebarState } from "./SideBarSlice";

const SidebarC = () => {
    const theme = useTheme();
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    const dispatch = useDispatch();
    const { sidebarTab } = useSelector(state => state.sidebar);
    const { collapseSidebar, collapsed } = useProSidebar();
    
    //add sm to dep to triggrer collapseSidebar
    useEffect(() => {
        if (sm) {
            collapseSidebar();
        }
    }, [collapseSidebar])

    useEffect(() => {
        const content = document.getElementsByClassName('content')[0];
        if (!collapsed) {
            content.style.setProperty('--marginLeft', '300px')
        }
        else {
            content.style.setProperty('--marginLeft', '80px')
        }
    }, [collapsed])

    const handleOnClick = (name) => {
        dispatch(setSidebarState(name));
        console.log(name)
    }

    return (
        <div style={{ display: 'flex', height: '100%', position: 'fixed' }}>
            <Sidebar width="300px" style={{ height: '100vh' }} rootStyles={{
                [`.ps-sidebar-container`]: {
                    backgroundColor: `${theme.palette.background.default}`,
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
                    {!collapsed ? (
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
                            textAlign="center"
                            sx={{ height: '72px' }}
                        >
                            <IconButton sx={{ marginTop: '20%', color: `${theme.palette.secondary.main}` }} onClick={() => collapseSidebar()}>
                                <MenuOutlinedIcon />
                            </IconButton>
                        </Box>
                    )}

                    <Box className="menu-icon-holder" paddingLeft={collapsed ? undefined : "0%"} paddingTop={collapsed ? '20px' : '24px'}>
                        <MenuItem
                            active={sidebarTab === "dashboardTab"}
                            style={{
                                backgroundColor: sidebarTab === "dashboardTab" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: sidebarTab === "dashboardTab" ? theme.palette.primary.main : theme.palette.secondary.main,
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
                            active={sidebarTab === "lessons"}
                            style={{
                                backgroundColor: sidebarTab === "lessons" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: sidebarTab === "lessons" ? theme.palette.primary.main : theme.palette.secondary.main,
                            }}
                            onClick={() => handleOnClick("lessons")}
                            icon={<LibraryBooksOutlinedIcon />}
                            component={<Link to="lessons" />}
                            className="menu-item"
                        >
                            <Typography>Lessons</Typography>
                        </MenuItem>

                        <MenuItem
                            active={sidebarTab === "journal"}
                            style={{
                                backgroundColor: sidebarTab === "journal" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: sidebarTab === "journal" ? theme.palette.primary.main : theme.palette.secondary.main,
                            }}
                            onClick={() => handleOnClick("journal")}
                            icon={<MenuBookOutlinedIcon />}
                            component={<Link to="journal" />}
                            className="menu-item"
                        >
                            <Typography>Journal</Typography>
                        </MenuItem>

                        <MenuItem
                            active={sidebarTab === "quiz"}
                            style={{
                                backgroundColor: sidebarTab === "quiz" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: sidebarTab === "quiz" ? theme.palette.primary.main : theme.palette.secondary.main,
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
                                backgroundColor: sidebarTab === "glossary" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: sidebarTab === "glossary" ? theme.palette.primary.main : theme.palette.secondary.main,
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
                                backgroundColor: sidebarTab === "schedule" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: sidebarTab === "schedule" ? theme.palette.primary.main : theme.palette.secondary.main,
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
                                backgroundColor: sidebarTab === "settings" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: sidebarTab === "settings" ? theme.palette.primary.main : theme.palette.secondary.main,
                            }}
                            onClick={() => handleOnClick("settings")}
                            icon={<SettingsOutlinedIcon />}
                            component={<Link to="settings" />}
                            className="menu-item"
                        >
                            <Typography>Settings</Typography>
                        </MenuItem>

                        <MenuItem
                            active={sidebarTab === "logout"}
                            style={{
                                backgroundColor: sidebarTab === "logout" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: sidebarTab === "logout" ? theme.palette.primary.main : theme.palette.secondary.main,
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