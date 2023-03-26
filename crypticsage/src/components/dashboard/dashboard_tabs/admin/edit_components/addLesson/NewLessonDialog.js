import React from 'react'
import { useProSidebar } from "react-pro-sidebar";
import JC from '../../../../../../assets/JC.gif'
import {
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Slide,
    useTheme,
    Button
} from '@mui/material'
const NewLessonDialog = (props) => {
    const {open, handleClose, resetAddSection} = props
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
    const Transition = React.forwardRef(function Transition(props, ref) {
        return <Slide direction="up" ref={ref} {...props} />;
    });
    return (
        <Dialog
            sx={{
                '& .MuiDialog-paper': { width: '100%', minWidth: 300, maxHeight: 435, border: '1px solid white' },
                marginLeft: collapsed ? '80px' : '300px',
            }}
            open={open}
            /* TransitionComponent={Transition} */
            keepMounted
            onClose={handleClose}
            maxWidth='sm'
            aria-describedby="alert-dialog-slide-description"
        >
            <DialogTitle sx={{ color: `${theme.palette.secondary.main}`, textAlign: 'center' }}>???????</DialogTitle>
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
                <Button sx={buttonStyle} onClick={(e) => resetAddSection(e)} >YES</Button>
                <Button sx={buttonStyle} onClick={handleClose}>CLOSE</Button>
            </DialogActions>
        </Dialog>
    )
}

export default NewLessonDialog