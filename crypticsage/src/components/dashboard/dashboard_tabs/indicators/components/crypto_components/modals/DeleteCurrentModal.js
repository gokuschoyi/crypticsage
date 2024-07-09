import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Tooltip, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText, Button, Slide } from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { deleteModel } from '../../../../../../../api/adminController'
import { Success } from '../../../../../global/CustomToasts'
import {
    setLoadedCheckpoints
    , setRetrainParameters
    , setLoadingFromSavedModel
    , setLastSessionData
    , resetCurrentModelData
    , setPartialChartResetFlag
} from '../../../modules/CryptoModuleSlice'
import { removeLastRunData } from '../../../modules/ModelRunMetaSlice'
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
    const currentRunningModel = useSelector(state => state.cryptoModule.userModels).find(model => model.model_id === model_id) || {}
    const firstSave = useSelector(state => state.cryptoModule.modelData.first_save)
    const lastCheckpoint = useSelector(state => state.modelRunMeta.last_run_checkpoint)

    const trainingSessions = useSelector(state => state.modelRunMeta.training_sessions)
    // console.log(currentRunningModel)
    const handleClickOpen = () => {
        setDeleteModelOpen(true);
    };

    const handleClose = () => {
        setDeleteModelOpen(false);
    };


    const handleDeleteModel = async () => {
        const payload = {
            model_id,
            model_type: modelType,
            asset_type: asset_type,
            ticker_name,
            period
        }

        if (!firstSave && trainingSessions.length === 0) { // Initial training & not saved
            payload['last_checkpoint'] = ''
        } else {
            payload['last_checkpoint'] = lastCheckpoint
        }

        // console.log(payload)

        const deleteModelPromise = await deleteModel({ token, payload })
        if (deleteModelPromise.status === 200) {
            Success(deleteModelPromise.data.message)
            modelProcessDurationRef.current = ''
        }

        if (trainingSessions.length > 0) {
            const session_copy = trainingSessions.map(session => session)
            const lastRun = session_copy.pop()
            // console.log(lastRun)
            dispatch(setLastSessionData({ ...lastRun }))
            dispatch(setPartialChartResetFlag(true))
            dispatch(removeLastRunData({ cp: lastRun.selectedCheckpoint, saved: lastRun.saved }))
        } else if (firstSave && trainingSessions.length === 0) {
            dispatch(resetCurrentModelData())
            dispatch(setRetrainParameters({
                model_id: currentRunningModel.model_id,
                model_name: currentRunningModel.model_name,
                model_saved_to_db: false,
                retrainParams: currentRunningModel.model_data.training_parameters
            }))
            dispatch(setLoadingFromSavedModel(true))
            setLoadedCheckpoints({ checkpoints: [], selectedCheckpoint: '' })
        } else {
            dispatch(resetCurrentModelData())
        }
        setDeleteModelOpen(false)

    }

    return (
        <React.Fragment>
            <Tooltip title={'Delete the model session'} placement='top' style={{ cursor: 'pointer', padding: '6px' }}>
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