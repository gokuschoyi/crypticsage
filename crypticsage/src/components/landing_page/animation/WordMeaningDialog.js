import React from 'react'
import {
    Box,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useTheme,
    Button,
    Typography
} from '@mui/material'
const WordMeaningDialog = (props) => {
    const { open, heading, wordMeaning, handleCloseWordMeaning } = props
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
            }}
            open={open}
            keepMounted
            onClose={handleCloseWordMeaning}
            maxWidth='sm'
            aria-describedby="alert-dialog-slide-description"
        >
            <DialogTitle sx={{ color: `${theme.palette.secondary.main}`, textAlign: 'start' }}>{heading}</DialogTitle>
            <DialogContent>
                <Box sx={{  display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50px' }}>
                    <Typography varient='h5' textAlign='start'>
                        {wordMeaning}
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions sx={{ paddingRight: '25px' }}>
                <Button size='small' sx={buttonStyle} onClick={handleCloseWordMeaning}>CLOSE</Button>
            </DialogActions>
        </Dialog>
    )
}

export default WordMeaningDialog