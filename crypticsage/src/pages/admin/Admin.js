import React, { useState, useEffect } from 'react'
import { ToastContainer } from 'react-toastify';
import './Admin.css'
import AdminSidebar from '../../components/admin/global/AdminSidebar'
import AdminTopbar from '../../components/admin/global/AdminTopbar'
import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom';
const Admin = (props) => {
    const [test, setTest] = useState(false)
    const hide = () => {
        setToggleSettings(false)
        setToggleNotifications(false)
        setTest(false)
    }
    useEffect(() => {
        if (test) {
            hide();
        }
    })

    const [toggleSettings, setToggleSettings] = React.useState(false);
    const handleToggleSettings = () => {
        setToggleSettings(!toggleSettings);
        if (toggleNotifications) {
            setToggleNotifications(false);

        }
    }
    const [toggleNotifications, setToggleNotifications] = React.useState(false);
    const handleToggleNotifications = () => {
        setToggleNotifications(!toggleNotifications);
        if (toggleSettings) {
            setToggleSettings(false)
        }
    }

    return (
        <Box className='admin-container' >
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
            <main className='admin-content'>
                <AdminTopbar
                    toggleSettings={toggleSettings}
                    setToggleSettings={handleToggleSettings}
                    toggleNotifications={toggleNotifications}
                    setToggleNotifications={handleToggleNotifications}
                />
                <Outlet context={[setTest]} />
            </main>
        </Box>
    )
}

export default Admin