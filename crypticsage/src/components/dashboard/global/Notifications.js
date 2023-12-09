import React, { useState } from 'react'
import 'react-toastify/dist/ReactToastify.css';
import CheckIcon from '@mui/icons-material/Check';
import MarkAsUnreadOutlinedIcon from '@mui/icons-material/MarkAsUnreadOutlined';
import { Box, Typography, FormControlLabel, Switch, useTheme, Button, Alert, IconButton } from '@mui/material';
const Notifications = (props) => {
    const { notifications, clear, markAllAsRead, markAsRead, unreadCount } = props
    const theme = useTheme();

    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const toggleFilter = (e) => {
        setShowUnreadOnly(!showUnreadOnly);
    };
    return (
        <Box className='notification-container'>
            <Box className='notification-header' display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
                <Typography className='notification-title' variant="h6" color={'primary'}>Notifications</Typography>
                <FormControlLabel
                    control={
                        <Switch
                            onChange={toggleFilter}
                            style={{ color: `${theme.palette.primary.main}` }}
                        />
                    }
                    label="UnRead"
                    
                />
            </Box>

            <Box className='notification-body' >
                {(!notifications.length ||
                    (unreadCount === 0 && showUnreadOnly)) && (
                        <h4>
                            No new Notifications!
                        </h4>
                    )}
                {(showUnreadOnly
                    ? notifications.filter((v) => !v.read)
                    : notifications
                ).map((notification, key) => {
                    return (
                        <Alert
                            className='notification-alert'
                            key={key}
                            severity={(notification.type) || "info"}
                            action={
                                notification.read ? (
                                    <CheckIcon />
                                ) : (
                                    <IconButton
                                        color="primary"
                                        aria-label="upload picture"
                                        component="span"
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        <MarkAsUnreadOutlinedIcon />
                                    </IconButton>
                                )
                            }
                        >
                            {notification.content}
                        </Alert>
                    );
                })}
            </Box>

            <Box className='notification-footer' display='flex' flexDirection='row' justifyContent='space-between'>
                <Button onClick={clear} variant="outlined" size='small' >CLEAR</Button>
                <Button onClick={markAllAsRead} variant="outlined" size='small' >MARK All AS READ</Button>
            </Box>
        </Box>
    )
}

export default Notifications