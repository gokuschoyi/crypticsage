import React, { useEffect, useState, useReducer, useRef } from 'react'
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import 'react-toastify/dist/ReactToastify.css';
import { MarkEmailReadOutlinedIcon, CheckIcon, InfoOutlinedIcon, ThumbUpOutlinedIcon, ReportProblemIcon, ReportOutlinedIcon, DeleteForeverIcon } from './Icons'
import { Box, Typography, FormControlLabel, Switch, useTheme, Button, Paper, IconButton } from '@mui/material';
import { motion, AnimatePresence } from "framer-motion";

dayjs.extend(duration);
dayjs.extend(relativeTime);
const TimeTracker = ({ createdAt }) => {
    const [, forceUpdate] = useReducer((x) => x + 1, 0);
    const intervalRef = useRef();
    useEffect(() => {
        intervalRef.current = setInterval(() => {
            forceUpdate();
        }, 1000);

        return () => {
            clearInterval(intervalRef.current);
        };
    }, []);
    return (
        <Box>
            <Typography variant='body2'>{dayjs(createdAt).fromNow()}</Typography>
        </Box>
    );
}

const Notifications = (props) => {
    const { notifications, clear, remove, markAllAsRead, markAsRead, unreadCount } = props
    const theme = useTheme();

    // console.log('notifications OG : ', notifications)

    useEffect(() => {
        if (notifications.length > 0) {
            // console.log('new notifications or updated notifications ')
            localStorage.setItem('user_notifications', JSON.stringify(notifications))
        }
    }, [notifications])

    const markNotificationAsRead = ({ id }) => {
        console.log(id)
        markAsRead(id)
    }

    const markAllNotificationsAsRead = () => {
        console.log('marking all as read')
        markAllAsRead()
    }

    const removeNotification = ({ id }) => {
        console.log('removing notification', id)
        remove(id)
    }

    const clearNotifications = () => {
        console.log('clearing notifications')
        clear()
        localStorage.setItem('user_notifications', JSON.stringify([]))
    }

    const [showUnreadOnly, setShowUnreadOnly] = useState(false);
    const toggleFilter = (e) => {
        setShowUnreadOnly(!showUnreadOnly);
    };



    return (
        <Box className='notification-container'>
            <Box className='notification-header' display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
                <Typography className='notification-title' variant="h6" fontWeight={600} color={'primary'}>NOTIFICATIONS</Typography>
                <FormControlLabel
                    control={
                        <Switch
                            onChange={toggleFilter}
                            color='secondary'
                            size='small'
                            sx={{
                                '& .MuiSwitch-track': {
                                    backgroundColor: `${theme.palette.secondary.main}`,
                                }
                            }}
                        />
                    }
                    label="UnRead"
                />
            </Box>

            <Box className='notification-body' >
                <AnimatePresence>
                    {(!notifications.length ||
                        (unreadCount === 0 && showUnreadOnly)) && (
                            <motion.div
                                key='no-notifications'
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                style={{ display: 'flex', height: '20%', alignItems: 'center', justifyContent: 'center', marginLeft: '10px', backgroundColor: `${theme.palette.background.paperOne}` }}
                            >
                                No new Notifications!
                            </motion.div>
                        )}
                    <AnimatePresence>
                        {(showUnreadOnly
                            ? notifications.filter((v) => !v.read)
                            : notifications
                        ).map((notification, key) => {
                            return (
                                <motion.div
                                    key={notification.id}
                                    layout
                                    initial={{ scale: 0.4, opacity: 0, y: 50 }}
                                    exit={{
                                        scale: 0,
                                        opacity: 0,
                                        transition: { duration: 0.2 }
                                    }}
                                    animate={{ scale: 1, opacity: 1, y: 0 }}
                                >
                                    <Paper elevtion={2} className='notification-alert'>
                                        <Box display={'flex'} flexDirection={'row'} justifyContent={'space-between'} width='100%' sx={{ color: `${theme.palette[notification.type].main}` }}>
                                            <Box display={'flex'} flexDirection={'row'} gap='4px' alignItems={'center'}>
                                                <Typography variant='custom'>{notifications.length - key}</Typography>
                                                {notification.type === 'success' && <ThumbUpOutlinedIcon size='small' className='small-icon-notification' />}
                                                {notification.type === 'warning' && <ReportProblemIcon size='small' className='small-icon-notification' />}
                                                {notification.type === 'error' && <ReportOutlinedIcon size='small' className='small-icon-notification' />}
                                                {notification.type === 'info' && <InfoOutlinedIcon size='small' className='small-icon-notification' />}
                                            </Box>
                                            <TimeTracker createdAt={notification.createdAt} />
                                        </Box>

                                        <Box pt={'2px'} display={'flex'} flexDirection={'row'} justifyContent={'space-between'} width={'100%'} alignItems={'center'}>
                                            <Typography variant='body2'>
                                                {notification.content}
                                            </Typography>
                                            <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                                                <IconButton
                                                    className='small-icon-notification'
                                                    color="primary"
                                                    aria-label="check"
                                                    component="span"
                                                    onClick={removeNotification.bind(null, { id: notification.id })}
                                                >
                                                    <DeleteForeverIcon size='small' className='small-icon-notification' />
                                                </IconButton>
                                                {notification.read ?
                                                    (
                                                        <CheckIcon size='small' className='small-icon-notification' color='success' />
                                                    )
                                                    :
                                                    (
                                                        <IconButton
                                                            className='small-icon-notification'
                                                            color="primary"
                                                            aria-label="check"
                                                            component="span"
                                                            onClick={markNotificationAsRead.bind(null, { id: notification.id })}
                                                        >
                                                            <MarkEmailReadOutlinedIcon size='small' className='small-icon-notification' />
                                                        </IconButton>
                                                    )
                                                }
                                            </Box>
                                        </Box>
                                    </Paper>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </AnimatePresence>
            </Box>

            <Box className='notification-footer' display='flex' flexDirection='row' justifyContent='space-between'>
                <Button onClick={clearNotifications} color='secondary' variant="outlined" size='small' >CLEAR ALL</Button>
                <Button onClick={markAllNotificationsAsRead} color='secondary' variant="outlined" size='small' >MARK All AS READ</Button>
            </Box>
        </Box>
    )
}

export default Notifications