import { useEffect } from "react";
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSelector, useDispatch } from 'react-redux';
import { Sidebar, Menu, MenuItem, useProSidebar } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import './GolbalStyle.css'
import {
    HomeOutlinedIcon,
    MenuOutlinedIcon,
    LibraryBooksOutlinedIcon,
    QuestionMarkIcon,
    SettingsOutlinedIcon,
} from "../../dashboard/global/Icons";
import { setAdminSidebarState } from "./AdminSidebarSiice";

const AdminSidebar = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    const dispatch = useDispatch();
    const { adminSidebarTab } = useSelector(state => state.adminSidebar);
    const { collapseSidebar, collapsed } = useProSidebar();

    //add sm to dep to triggrer collapseSidebar
    useEffect(() => {
        if (sm) {
            collapseSidebar();
        }
    }, [collapseSidebar])

    useEffect(() => {
        const content = document.getElementsByClassName('admin-content')[0];
        if (!collapsed) {
            content.style.setProperty('--marginLeft', '300px')
        }
        else {
            content.style.setProperty('--marginLeft', '80px')
        }
    }, [collapsed])

    useEffect(() => {
        if (adminSidebarTab === 'adminDashboard') {
            navigate('/admin-dashboard')
        } else if (adminSidebarTab === 'sections&lessons') {
            navigate('/admin-dashboard/content_management')
        } else if (adminSidebarTab === 'quiz') {
            navigate('/admin-dashboard/quiz')
        }
    }, [adminSidebarTab, navigate])

    const handleOnClick = (name) => {
        dispatch(setAdminSidebarState(name));
        console.log(name)
    }

    return (
        <div style={{ display: 'flex', height: '100%', position: 'fixed' }}>
            <Sidebar defaultCollapsed={true} width="300px" style={{ height: '100vh' }} rootStyles={{
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
                            <Typography variant="h3" >
                                <Link style={{ textDecoration: 'none', color: `${theme.palette.secondary.main}` }} to='/dashboard'>CRYPTICSAGE</Link>
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
                            <IconButton sx={{ marginTop: '20%', color: `${theme.palette.text.primary}` }} onClick={() => collapseSidebar()}>
                                <MenuOutlinedIcon />
                            </IconButton>
                        </Box>
                    )}

                    <Box className="admin-menu-icon-holder" paddingLeft={collapsed ? undefined : "0%"} paddingTop={collapsed ? '20px' : '24px'}>
                        <MenuItem
                            active={adminSidebarTab === "adminDashboard"}
                            style={{
                                backgroundColor: adminSidebarTab === "adminDashboard" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: adminSidebarTab === "adminDashboard" ? theme.palette.primary.main : theme.palette.secondary.main,
                            }}
                            onClick={() => handleOnClick("adminDashboard")}
                            icon={<HomeOutlinedIcon />}
                            component={<Link to="/admin-dashboard" />}
                            className="admin-menu-item"
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
                            active={adminSidebarTab === "sections&lessons"}
                            style={{
                                backgroundColor: adminSidebarTab === "sections&lessons" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: adminSidebarTab === "sections&lessons" ? theme.palette.primary.main : theme.palette.secondary.main,
                                ':hover': {
                                    color: 'red'
                                }
                            }}
                            onClick={() => handleOnClick("sections&lessons")}
                            icon={<LibraryBooksOutlinedIcon />}
                            component={<Link to="content_management" />}
                            className="admin-menu-item"
                        >
                            <Typography>Sec & Les</Typography>
                        </MenuItem>

                        <MenuItem
                            active={adminSidebarTab === "quiz"}
                            style={{
                                backgroundColor: adminSidebarTab === "quiz" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: adminSidebarTab === "quiz" ? theme.palette.primary.main : theme.palette.secondary.main,
                            }}
                            onClick={() => handleOnClick("quiz")}
                            icon={<QuestionMarkIcon />}
                            component={<Link to="quiz" />}
                            className="admin-menu-item"
                        >
                            <Typography>Quiz</Typography>
                        </MenuItem>


                        <MenuItem
                            active={adminSidebarTab === "settings"}
                            style={{
                                backgroundColor: adminSidebarTab === "settings" ? theme.palette.secondary.main : theme.palette.primary.extraDark,
                                color: adminSidebarTab === "settings" ? theme.palette.primary.main : theme.palette.secondary.main,
                            }}
                            onClick={() => handleOnClick("settings")}
                            icon={<SettingsOutlinedIcon />}
                            component={<Link to="admin_settings" />}
                            className="admin-menu-item"
                        >
                            <Typography>Settings</Typography>
                        </MenuItem>

                    </Box>
                </Menu>
            </Sidebar>
        </div>
    );
};

export default AdminSidebar;