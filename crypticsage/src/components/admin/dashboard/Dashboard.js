import React from 'react'
import './Dashboard.css'
import { useOutletContext } from "react-router-dom";
import AdminHeader from '../global/AdminHeader'
import { Box } from '@mui/material'
const Dashboard = (props) => {
    const { title, subtitle } = props;
    const [setTest] = useOutletContext();
    const hide = () => {
        setTest(true);
    }
    return (
        <Box className='admin-dashboard-container' onClick={hide}>
            <AdminHeader title={title} subtitle={subtitle} />
        </Box>
    )
}

export default Dashboard