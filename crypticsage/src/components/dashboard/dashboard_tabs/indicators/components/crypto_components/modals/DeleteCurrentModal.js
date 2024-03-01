import React from 'react'
import { Tooltip, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText, Button, Slide } from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} />;
});
const DeleteCurrentModal = ({ handleDeleteModel, deleteModelOpen, setDeleteModelOpen }) => {

    const handleClickOpen = () => {
        setDeleteModelOpen(true);
    };

    const handleClose = () => {
        setDeleteModelOpen(false);
    };

    return (
        <React.Fragment>
            <Tooltip title={'Delete the current model'} placement='top' style={{ cursor: 'pointer', padding: '6px' }}>
                <span style={{ padding: '0px' }}>
                    <IconButton onClick={handleClickOpen}>
                        <DeleteForeverIcon className='small-icon' />
                    </IconButton>
                </span>
            </Tooltip>

            <Dialog
                open={deleteModelOpen}
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
                    <Button size='small' color='secondary' onClick={handleDeleteModel.bind(null, {})}>Delete</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}

export default DeleteCurrentModal