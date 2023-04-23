import React from 'react'
import { useProSidebar } from "react-pro-sidebar";
import useMediaQuery from '@mui/material/useMediaQuery';
import { useSelector } from 'react-redux';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    Button,
    useTheme
} from '@mui/material'

const DeleteDialog = (props) => {
    const { open, handleDelete, handleClose, id, type } = props
    const { collapsed } = useProSidebar();
    const theme = useTheme()
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    const smallScreenSidebarState = useSelector(state => state.sidebar.toggleSmallScreenSidebarState);
    // console.log(smallScreenSidebarState)
    return (
        <Dialog
            sx={{
                '& .MuiDialog-paper': {
                    width: '100%',
                    minWidth: 300,
                    maxHeight: 435,
                },
                marginLeft: sm ? (smallScreenSidebarState ? '0px' : '80px') : (collapsed ? '80px' : '300px')
            }}
            open={open}
            onClose={handleClose}
            maxWidth='sm'
            aria-describedby="alert-dialog-slide-description"
        >
            <DialogTitle sx={{ color: `${theme.palette.secondary.main}` }}>Are you sure you want to Delete?</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-slide-description">
                    This action is irreversible. {type === 'section' ? 'All lessons in this section will be deleted.' : ''}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    sx={{
                        backgroundColor: 'white', color: 'black',
                        ':hover': { backgroundColor: 'black', color: 'white' }
                    }}
                    onClick={handleDelete}
                    data-contentid={id}
                >DELETE</Button>
                <Button sx={{
                    backgroundColor: 'white', color: 'black',
                    ':hover': { backgroundColor: 'black', color: 'white' }
                }} onClick={handleClose}>CLOSE</Button>
            </DialogActions>
        </Dialog>
    )
}

export default DeleteDialog