import React from 'react'
import { useProSidebar } from "react-pro-sidebar";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText,
    Button,
    useTheme
} from '@mui/material'

const WordModal = (props) => {
    const { word, meaning, open, handleClose } = props
    const { collapsed } = useProSidebar();
    const theme = useTheme()

    
    return (
        <Dialog
            sx={{
                '& .MuiDialog-paper': { width: '100%', minWidth: 300, maxHeight: 435, }, marginLeft: collapsed ? '80px' : '300px',
            }}
            open={open}
            onClose={handleClose}
            maxWidth='sm'
            aria-describedby="alert-dialog-slide-description"
        >
            <DialogTitle sx={{ color: `${theme.palette.secondary.main}` }}>{`${word}`}</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-slide-description">
                    {`${meaning}`}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button sx={{
                    backgroundColor: 'white', color: 'black',
                    ':hover': { backgroundColor: 'black', color: 'white' }
                }} onClick={handleClose}>CLOSE</Button>
            </DialogActions>
        </Dialog>
    )
}

export default WordModal