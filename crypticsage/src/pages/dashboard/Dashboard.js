import React from 'react'
import SidebarC from '../../components/dashboard/global/Sidebar';
import Topbar from '../../components/dashboard/global/Topbar';
import { Outlet } from 'react-router-dom';
import './Dashboard.css'
import { Box } from '@mui/material';
const Dashboard = (props) => {
    /* const colors = tokens(theme.palette.mode);
    console.log(colors.yellow[200]); */
    /* console.log(props.color); */

    return (
        <Box className="dashboard-container">
            <SidebarC />
            <main className="content"
                style={{
                    backgroundColor: props.color,
                }}
            >
                <Topbar />
                <Outlet />
            </main>
        </Box>
    )
}

export default Dashboard