import React from 'react'
import { Tooltip, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText, Button, Slide } from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} />;
});
const DeleteSavedModel = ({ handleModelDeletFromSaved, model_id }) => {
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleYesDelete = () => {
        setOpen(false);
        handleModelDeletFromSaved({ model_id: model_id })
    }

    return (
        <React.Fragment>
            <Tooltip title={'Delete the saved model'} placement='top' style={{ cursor: 'pointer' }}>
                <span>
                    <IconButton sx={{ padding: '3px' }} onClick={handleClickOpen}>
                        <DeleteForeverIcon className='small-icon' />
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
                <DialogTitle>{"Delete the current model?"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-slide-description">
                        Deletes the current trained model. All data will be deleted permenantly.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button size='small' color='secondary' onClick={handleClose}>Cancel</Button>
                    <Button size='small' color='secondary' onClick={handleYesDelete}>Delete</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}

export default DeleteSavedModel