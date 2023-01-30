import { useEffect, useState } from "react";
import useMediaQuery from '@mui/material/useMediaQuery';
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
    ColorLensOutlinedIcon,
    AddCardOutlinedIcon,
    QuizOutlinedIcon,
    ExitToAppOutlinedIcon,
    SettingsOutlinedIcon
} from "./Icons";

const SidebarC = () => {
    const theme = useTheme();
    const [selected, setSelected] = useState("");
    const sm = useMediaQuery(theme.breakpoints.down('sm'));

    const { collapseSidebar, collapsed } = useProSidebar();
    /* console.log(theme.palette.mode); */
    /* console.log(colors.colorTwo[400]) */
    /* let pathname = useLocation().pathname */

    useEffect(() => {
        if (sm) {
            collapseSidebar();
        }
    }, [sm, collapseSidebar])

    useEffect(() => {
        const content = document.getElementsByClassName('content')[0];
        if (!collapsed) {
            content.style.setProperty('--marginLeft', '300px')
        }
        else {
            content.style.setProperty('--marginLeft', '80px')
        }
    }, [collapsed])

    return (
        <div style={{ display: 'flex', height: '100%', position: 'fixed' }}>
            <Sidebar width="300px" style={{ height: '100vh' }} rootStyles={{
                [`.ps-sidebar-container`]: {
                    backgroundColor: `${theme.palette.background.default}`,
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
                            active={selected === "dashboardTab"}
                            style={{
                                backgroundColor: selected === "dashboardTab" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: selected === "dashboardTab" ? theme.palette.primary.main : theme.palette.secondary.main,
                            }}
                            onClick={() => setSelected("dashboardTab")}
                            icon={<HomeOutlinedIcon />}
                            component={<Link to="dashboardTab" />}
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
                            active={selected === "lessons"}
                            style={{
                                backgroundColor: selected === "lessons" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: selected === "lessons" ? theme.palette.primary.main : theme.palette.secondary.main,
                            }}
                            onClick={() => setSelected("lessons")}
                            icon={<LibraryBooksOutlinedIcon />}
                            component={<Link to="lessons" />}
                            className="menu-item"
                        >
                            <Typography>Lessons</Typography>
                        </MenuItem>

                        <MenuItem
                            active={selected === "journal"}
                            style={{
                                backgroundColor: selected === "journal" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: selected === "journal" ? theme.palette.primary.main : theme.palette.secondary.main,
                            }}
                            onClick={() => setSelected("journal")}
                            icon={<MenuBookOutlinedIcon />}
                            component={<Link to="journal" />}
                            className="menu-item"
                        >
                            <Typography>Journal</Typography>
                        </MenuItem>

                        <MenuItem
                            active={selected === "quiz"}
                            style={{
                                backgroundColor: selected === "quiz" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: selected === "quiz" ? theme.palette.primary.main : theme.palette.secondary.main,
                            }}
                            onClick={() => setSelected("quiz")}
                            icon={<QuestionMarkIcon />}
                            component={<Link to="quiz" />}
                            className="menu-item"
                        >
                            <Typography>Quiz</Typography>
                        </MenuItem>

                        <MenuItem
                            active={selected === "glossary"}
                            style={{
                                backgroundColor: selected === "glossary" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: selected === "glossary" ? theme.palette.primary.main : theme.palette.secondary.main,
                            }}
                            onClick={() => setSelected("glossary")}
                            icon={<ListAltIcon />}
                            component={<Link to="glossary" />}
                            className="menu-item"
                        >
                            <Typography>Glossary</Typography>
                        </MenuItem>

                        <MenuItem
                            active={selected === "schedule"}
                            style={{
                                backgroundColor: selected === "schedule" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: selected === "schedule" ? theme.palette.primary.main : theme.palette.secondary.main,
                            }}
                            onClick={() => setSelected("schedule")}
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
                            active={selected === "settings"}
                            style={{
                                backgroundColor: selected === "settings" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: selected === "settings" ? theme.palette.primary.main : theme.palette.secondary.main,
                            }}
                            onClick={() => setSelected("settings")}
                            icon={<SettingsOutlinedIcon />}
                            component={<Link to="settings" />}
                            className="menu-item"
                        >
                            <Typography>Settings</Typography>
                        </MenuItem>

                        <MenuItem
                            active={selected === "theme"}
                            style={{
                                backgroundColor: selected === "theme" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: selected === "theme" ? theme.palette.primary.main : theme.palette.secondary.main,
                            }}
                            onClick={() => setSelected("theme")}
                            icon={<ColorLensOutlinedIcon />}
                            component={<Link to="theme" />}
                            className="menu-item"
                        >
                            <Typography>Theme</Typography>
                        </MenuItem>

                        <MenuItem
                            active={selected === "Subscriptions"}
                            style={{
                                backgroundColor: selected === "Subscriptions" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: selected === "Subscriptions" ? theme.palette.primary.main : theme.palette.secondary.main,
                            }}
                            onClick={() => setSelected("Subscriptions")}
                            icon={<AddCardOutlinedIcon />}
                            component={<Link to="subscriptions" />}
                            className="menu-item"
                        >
                            <Typography>Subscriptions</Typography>
                        </MenuItem>

                        <MenuItem
                            active={selected === "faq"}
                            style={{
                                backgroundColor: selected === "faq" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: selected === "faq" ? theme.palette.primary.main : theme.palette.secondary.main,
                            }}
                            onClick={() => setSelected("faq")}
                            icon={<QuizOutlinedIcon />}
                            component={<Link to="faq" />}
                            className="menu-item"
                        >
                            <Typography>F.A.Q</Typography>
                        </MenuItem>

                        <MenuItem
                            active={selected === "logout"}
                            style={{
                                backgroundColor: selected === "logout" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: selected === "logout" ? theme.palette.primary.main : theme.palette.secondary.main,
                            }}
                            onClick={() => setSelected("logout")}
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