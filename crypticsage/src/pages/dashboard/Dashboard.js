import React, { useEffect, useRef, createContext, useContext } from 'react'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SidebarC from '../../components/dashboard/global/Sidebar';
import Topbar from '../../components/dashboard/global/Topbar';
import { useOnlineStatus } from '../../utils/Utils';
import { Outlet } from 'react-router-dom';
import './Dashboard.css'
import { Box } from '@mui/material';

const SocketContext = createContext()

const Dashboard = (props) => {
    const isOnline = useOnlineStatus();

    const isOnlineCheckRef = React.useRef(false);
    useEffect(() => {
        if (isOnlineCheckRef.current) {
            // Subsequent checks after the initial render
            if (isOnline) {
                console.log('Connection is back'); // Replace with your Info function or notification
                // Info('Connection is back')
            } else {
                // console.log('No internet'); // Replace with your Error function or notification
                // Error('No internet') // Some bullshit error popping up causing random crashes
                console.log('No Internet')
            }
        } else {
            // Skip the first check on initial render
            isOnlineCheckRef.current = true;
        }
    }, [isOnline]);

    useEffect(() => {
        const outsideClickHandler = () => {
            const notificationDropdown = document.getElementsByClassName('user-notification')[0];
            const settingsDropdown = document.getElementsByClassName('user-settings')[0];
            const userNavDropdown = document.getElementsByClassName('user-nav')[0];

            if (notificationDropdown.classList.contains('show-notification')) {
                notificationDropdown.classList.toggle('show-notification');
            }
            if (settingsDropdown.classList.contains('show-settings')) {
                settingsDropdown.classList.toggle('show-settings');
            }

            if (userNavDropdown.classList.contains('show-user-nav')) {
                userNavDropdown.classList.toggle('show-user-nav');
            }
        }

        const content = document.getElementsByClassName('content-box')[0];
        content.addEventListener('click', outsideClickHandler);

        return () => {
            content.removeEventListener('click', outsideClickHandler);
        }
    })

    const w_socket = useRef(null) // global training socket reference

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
                    overflow: "auto",
                }}
            >
                <SocketContext.Provider value={w_socket}>
                    <Topbar />
                    <Box className='content-box'>
                        <Outlet />
                    </Box>
                </SocketContext.Provider>
            </Box>
        </Box>
    )
}

// Create a custom hook to access the ref from Topbar
export const useSocketRef = () => {
    return useContext(SocketContext);
}

export default Dashboard