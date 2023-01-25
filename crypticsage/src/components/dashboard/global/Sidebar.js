import { useEffect, useState } from "react";
import useMediaQuery from '@mui/material/useMediaQuery';
import { Sidebar, Menu, MenuItem, useProSidebar } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { Link } from "react-router-dom";
import { tokens } from "../../../themes/theme";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";

import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ScheduleIcon from '@mui/icons-material/Schedule';

import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ColorLensOutlinedIcon from '@mui/icons-material/ColorLensOutlined';
import AddCardOutlinedIcon from '@mui/icons-material/AddCardOutlined';
import QuizOutlinedIcon from '@mui/icons-material/QuizOutlined';
import ExitToAppOutlinedIcon from '@mui/icons-material/ExitToAppOutlined';

const SidebarC = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
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
                [`.ps-submenu-content`]: {
                    backgroundColor: `${theme.palette.primary.main}`,
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

                    <Box paddingLeft={collapsed ? undefined : "0%"}>
                        <MenuItem
                            active={selected === "dashboardTab"}
                            style={{
                                backgroundColor: selected === "dashboardTab" ? colors.colorTwo[300] : "transparent",
                                color: theme.palette.background,
                            }}
                            onClick={() => setSelected("dashboardTab")}
                            icon={<HomeOutlinedIcon />}
                            component={<Link to="dashboardTab" />}
                            className="menu-item"
                        >
                            <Typography>Dashboard</Typography>
                        </MenuItem>

                        <Typography
                            variant="h6"
                            sx={{ m: "15px 0 5px 20px", textAlign: 'left' }}
                        >
                            TOOLS
                        </Typography>

                        <MenuItem
                            active={selected === "lessons"}
                            style={{
                                backgroundColor: selected === "lessons" ? colors.colorTwo[300] : "transparent",
                                color: theme.palette.background,
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
                                backgroundColor: selected === "journal" ? colors.colorTwo[300] : "transparent",
                                color: theme.palette.background,
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
                                backgroundColor: selected === "quiz" ? colors.colorTwo[300] : "transparent",
                                color: theme.palette.background,
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
                                backgroundColor: selected === "glossary" ? colors.colorTwo[300] : "transparent",
                                color: theme.palette.background,
                            }}
                            onClick={() => setSelected("glossary")}
                            icon={<ListAltIcon />}
                            component={<Link to="/glossary" />}
                            className="menu-item"
                        >
                            <Typography>Glossary</Typography>
                        </MenuItem>

                        <MenuItem
                            active={selected === "schedule"}
                            style={{
                                backgroundColor: selected === "schedule" ? colors.colorTwo[300] : "transparent",
                                color: theme.palette.background,
                            }}
                            onClick={() => setSelected("schedule")}
                            icon={<ScheduleIcon />}
                            component={<Link to="/schedule" />}
                            className="menu-item"
                        >
                            <Typography>Schedule</Typography>
                        </MenuItem>

                        <Typography
                            variant="h6"
                            sx={{ m: "15px 0 5px 20px", textAlign: 'left' }}
                        >
                            ACCOUNT
                        </Typography>

                        <MenuItem
                            active={selected === "settings"}
                            style={{
                                backgroundColor: selected === "settings" ? colors.colorTwo[300] : "transparent",
                                color: theme.palette.background,
                            }}
                            onClick={() => setSelected("settings")}
                            icon={<SettingsOutlinedIcon />}
                            component={<Link to="/settings" />}
                            className="menu-item"
                        >
                            <Typography>Settings</Typography>
                        </MenuItem>

                        <MenuItem
                            active={selected === "theme"}
                            style={{
                                backgroundColor: selected === "theme" ? colors.colorTwo[300] : "transparent",
                                color: theme.palette.background,
                            }}
                            onClick={() => setSelected("theme")}
                            icon={<ColorLensOutlinedIcon />}
                            component={<Link to="/theme" />}
                            className="menu-item"
                        >
                            <Typography>Theme</Typography>
                        </MenuItem>

                        <MenuItem
                            active={selected === "Subscriptions"}
                            style={{
                                backgroundColor: selected === "Subscriptions" ? colors.colorTwo[300] : "transparent",
                                color: theme.palette.background,
                            }}
                            onClick={() => setSelected("Subscriptions")}
                            icon={<AddCardOutlinedIcon />}
                            component={<Link to="/subscriptions" />}
                            className="menu-item"
                        >
                            <Typography>Subscriptions</Typography>
                        </MenuItem>

                        <MenuItem
                            active={selected === "faq"}
                            style={{
                                backgroundColor: selected === "faq" ? colors.colorTwo[300] : "transparent",
                                color: theme.palette.background,
                            }}
                            onClick={() => setSelected("faq")}
                            icon={<QuizOutlinedIcon />}
                            component={<Link to="/faq" />}
                            className="menu-item"
                        >
                            <Typography>F.A.Q</Typography>
                        </MenuItem>

                        <MenuItem
                            active={selected === "logout"}
                            style={{
                                backgroundColor: selected === "logout" ? colors.colorTwo[300] : "transparent",
                                color: theme.palette.background,
                            }}
                            onClick={() => setSelected("logout")}
                            icon={<ExitToAppOutlinedIcon />}
                            component={<Link to="/logout" />}
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