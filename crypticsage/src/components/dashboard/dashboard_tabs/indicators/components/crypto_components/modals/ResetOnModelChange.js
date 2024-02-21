import React from 'react'
import { Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText, Button, Slide } from '@mui/material';
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} />;
});
const ResetOnModelChange = ({ open, setOpen, handleRemove }) => {
    const handleClose = () => {
        setOpen(false);
    }

    return (
        <React.Fragment>
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
                        Previous model run has not been saved. Changing model type will remove all previous model parameters and predictions.
                        Do you want to continue?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button size='small' color='secondary' onClick={handleClose}>Cancel</Button>
                    <Button size='small' color='secondary' onClick={handleRemove}>YES</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}

export default ResetOnModelChange