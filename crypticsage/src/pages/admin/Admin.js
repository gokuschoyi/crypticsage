import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { useProSidebar } from "react-pro-sidebar";
import useMediaQuery from '@mui/material/useMediaQuery';
import 'react-toastify/dist/ReactToastify.css';
import AdminSidebar from '../../components/admin/global/AdminSidebar'
import AdminTopbar from '../../components/admin/global/AdminTopbar'
import { Outlet } from 'react-router-dom';
import './Admin.css'
import { Box, useTheme } from '@mui/material'
const Admin = (props) => {
    const [test, setTest] = useState(false)

    const toggleSmallScreenAdminSidebarState = useSelector(state => state.adminSidebar.toggleSmallScreenAdminSidebarState);
    // console.log(toggleSmallScreenAdminSidebarState)
    const { collapsed } = useProSidebar();
    const theme = useTheme();
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    const [toggleSmallScreenAdminSidebar, setToggleSmallScreenAdminSidebar] = useState(toggleSmallScreenAdminSidebarState)
    const handleToggleSmallScreenAdminSidebar = () => {
        setToggleSmallScreenAdminSidebar((prev) => !prev)
    }

    return (
        <Box className='admincontainer' >
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
            <AdminSidebar />
            <Box className='admin-content'
                style={{
                    backgroundColor: props.color,
                }}
                sx={{
                    flexGrow: 1,
                    marginLeft: sm ? (toggleSmallScreenAdminSidebar ? "0px !important" : "80px !important") : (collapsed ? "80px !important" : "300px !important"),
                    transition: "margin-left 0.7s ease",
                    overflow: "auto",
                }}
            >
                <AdminTopbar
                    toggleSmallScreenAdminSidebar={toggleSmallScreenAdminSidebar}
                    handleToggleSmallScreenAdminSidebar={handleToggleSmallScreenAdminSidebar}
                />
                <Box className='admin-content-box'>
                    <Outlet context={[setTest]} />
                </Box>
            </Box>
        </Box>
    )
}

export default Admin