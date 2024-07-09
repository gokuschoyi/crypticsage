import React from 'react'
import { Tooltip, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText, Button, Slide } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} />;
});
const ResetTrainedModelModal = ({ handleClearModelData, disabled, modelSavedToDb_ }) => {
    const [open, setOpen] = React.useState(false);
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleRemove = () => {
        handleClearModelData()
        setOpen(false)
    }

    return (
        <React.Fragment>
            <Tooltip title={'Reset training parameters & data.'} placement='top' sx={{ cursor: 'pointer', padding: '6px' }}>
                <span>
                    <IconButton disabled={disabled} onClick={handleClickOpen}>
                        <RestartAltIcon className='small-icon' />
                    </IconButton>
                </span>
            </Tooltip>

            <Dialog
                open={open}
                TransitionComponent={Transition}
                keepMounted
                onClose={handleClose}
                aria-describedby="alert-dialog-slide-description"
            >
                <DialogTitle>{"Reset everything?"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-slide-description">
                        {modelSavedToDb_ ?
                            'This will reset your entire model parameters to default.'
                            :
                            'Reset training data. This will reset your entire model parameters to default and remove all models and predictions (WARN -  Save before resetting)'
                        }
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button size='small' color='secondary' onClick={handleClose}>Cancel</Button>
                    <Button size='small' color='secondary' onClick={handleRemove}>{modelSavedToDb_ ? 'Yes' : 'Confirm'}</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}

export default ResetTrainedModelModal