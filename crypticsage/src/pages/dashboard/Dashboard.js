import React, { useEffect } from 'react'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SidebarC from '../../components/dashboard/global/Sidebar';
import Topbar from '../../components/dashboard/global/Topbar';
import { Outlet } from 'react-router-dom';
import './Dashboard.css'
import { Box } from '@mui/material';
const Dashboard = (props) => {
    /* const colors = tokens(theme.palette.mode);
    console.log(colors.yellow[200]); */
    /* console.log(props.color); */

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
        if(test){
            hide();
        }
    })

    console.log(test)
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
            <main className="content"
                style={{
                    backgroundColor: props.color,
                }}
            >
                <Topbar
                    toggleUser={toggleUser}
                    setToggleUser={handleToggleUser}
                    toggleSettings={toggleSettings}
                    setToggleSettings={handleToggleSettings}
                    toggleNotifications={toggleNotifications}
                    setToggleNotifications={handleToggleNotifications}
                />
                <Outlet context={[ setTest]} />
            </main>
        </Box>
    )
}

export default Dashboard