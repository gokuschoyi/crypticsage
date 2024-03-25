import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Tooltip, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText, Button, Slide } from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { deleteModel } from '../../../../../../../api/adminController'
import { Success } from '../../../../../global/CustomToasts'
import { resetCurrentModelData } from '../../../modules/CryptoModuleSlice'

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} />;
});


const DeleteCurrentModal = ({ modelProcessDurationRef }) => {
    const dispatch = useDispatch()
    const token = useSelector(state => state.auth.accessToken);
    const model_id = useSelector(state => state.cryptoModule.modelData.model_id)
    const modelType = useSelector(state => state.cryptoModule.modelData.training_parameters.modelType)
    const period = useSelector(state => state.cryptoModule.selectedTickerPeriod)
    const ticker_name = useSelector(state => state.cryptoModule.selectedTickerName)
    const [deleteModelOpen, setDeleteModelOpen] = useState(false)
    const asset_type = window.location.href.split("/dashboard/indicators/")[1].split("/")[0]

    const handleClickOpen = () => {
        setDeleteModelOpen(true);
    };

    const handleClose = () => {
        setDeleteModelOpen(false);
    };


    const handleDeleteModel = () => {
        const payload = {
            model_id,
            model_type: modelType,
            asset_type: asset_type,
            ticker_name,
            period
        }
        
        deleteModel({
            token, payload
        })
            .then((res) => {
                Success(res.data.message)
                modelProcessDurationRef.current = ''
                dispatch(resetCurrentModelData())
                setDeleteModelOpen(false)
            })
            .catch((err) => {
                console.log(err.message)
                setDeleteModelOpen(false)
            })
    }

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