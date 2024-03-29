import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { useProSidebar } from "react-pro-sidebar";
import useMediaQuery from '@mui/material/useMediaQuery';
import 'react-toastify/dist/ReactToastify.css';
import SidebarC from '../../components/dashboard/global/Sidebar';
import Topbar from '../../components/dashboard/global/Topbar';
import { Outlet } from 'react-router-dom';
import './Dashboard.css'
import { Box, useTheme } from '@mui/material';
const Dashboard = (props) => {
    const [toggleUser, setToggleUser] = React.useState(false);
    const handleToggleUser = () => {
        setToggleUser(!toggleUser);
        if (toggleSettings || toggleNotifications) {
            setToggleSettings(false);
            setToggleNotifications(false);
        }
    }

    const [toggleSettings, setToggleSettings] = React.useState(false);
    const handleToggleSettings = () => {
        setToggleSettings(!toggleSettings);
        if (toggleUser || toggleNotifications) {
            setToggleUser(false);
            setToggleNotifications(false);
        }
    }

    const [toggleNotifications, setToggleNotifications] = React.useState(false);
    const handleToggleNotifications = () => {
        setToggleNotifications(!toggleNotifications);
        if (toggleUser || toggleSettings) {
            setToggleUser(false);
            setToggleSettings(false);
        }
    }

    const hide = () => {
        setToggleUser(false);
        setToggleSettings(false);
        setToggleNotifications(false);
        setTest(false);
    }

    const [test, setTest] = React.useState(false);

    useEffect(() => {
        if (test) {
            hide();
        }
    })
    const toggleSmallScreenSidebarState = useSelector(state => state.sidebar.toggleSmallScreenSidebarState);
    // console.log(toggleSmallScreenSidebarState)
    const { collapsed } = useProSidebar();
    const theme = useTheme();
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    const [toggleSmallScreenSidebar, setToggleSmallScreenSidebar] = useState(toggleSmallScreenSidebarState)
    const handleToggleSmallScreenSidebar = () => {
        setToggleSmallScreenSidebar((prev) => !prev)
    }

    return (
        <Box className="dashboard-container" >
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            <SidebarC />
            <Box className="content"
                style={{
                    backgroundColor: props.color,
                }}
                sx={{
                    flexGrow: 1,
                    marginLeft: sm ? (toggleSmallScreenSidebar ? "0px !important" : "80px !important") : (collapsed ? "80px !important" : "300px !important"),
                    transition: "margin-left 0.7s ease",
                    overflow: "auto",
                }}
            >
                <Topbar
                    toggleUser={toggleUser}
                    setToggleUser={handleToggleUser}
                    toggleSettings={toggleSettings}
                    setToggleSettings={handleToggleSettings}
                    toggleNotifications={toggleNotifications}
                    setToggleNotifications={handleToggleNotifications}
                    toggleSmallScreenSidebar={toggleSmallScreenSidebar}
                    handleToggleSmallScreenSidebar={handleToggleSmallScreenSidebar}
                />
                <Box className='content-box'>
                    <Outlet context={[setTest]} />
                </Box>
            </Box>
        </Box>
    )
}

export default Dashboard