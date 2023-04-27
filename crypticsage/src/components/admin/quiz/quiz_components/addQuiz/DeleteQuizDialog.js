import React from 'react'
import { useProSidebar } from "react-pro-sidebar";
import JC from '../../../../../assets/JC.gif'
import {
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
    Button
} from '@mui/material'
const DeleteQuizDialog = (props) => {
    const { open, heading, handleCloseDeleteQuiz, selectedQuizIdToDelete, removeQuizFromDb } = props
    const { collapsed } = useProSidebar();
    const theme = useTheme()
    const buttonStyle = {
        ':hover': {
            color: 'black !important',
            backgroundColor: '#d11d1d !important',
            transition: '0.5s'
        },
        backgroundColor: `${theme.palette.secondary.main}`
    }
    return (
        <Dialog
            sx={{
                '& .MuiDialog-paper': { width: '100%', minWidth: 300, maxHeight: 435, border: '1px solid white' },
                marginLeft: collapsed ? '80px' : '300px',
            }}
            open={open}
            keepMounted
            onClose={handleCloseDeleteQuiz}
            maxWidth='sm'
            aria-describedby="alert-dialog-slide-description"
        >
            <DialogTitle sx={{ color: `${theme.palette.secondary.main}`, textAlign: 'center' }}>{heading}</DialogTitle>
            <DialogContent>
                <Box sx={{ backgroundColor: 'white', display: 'flex', justifyContent: 'center' }}>
                    <img
                        src={JC}
                        alt='JC'
                        width='320px'
                        height='180px'
                    />
                </Box>
            </DialogContent>
            <DialogActions sx={{ paddingRight: '25px' }}>
                <Button sx={buttonStyle} id={selectedQuizIdToDelete} onClick={(e) => removeQuizFromDb(e)} >YES</Button>
                <Button sx={buttonStyle} onClick={handleCloseDeleteQuiz}>CLOSE</Button>
            </DialogActions>
        </Dialog>
    )
}

export default DeleteQuizDialog