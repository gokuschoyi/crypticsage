import React from 'react'
import { Tooltip, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText, Button, Slide } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useDispatch, useSelector } from 'react-redux';
import { getUserModels, saveModel } from '../../../../../../../api/adminController';
import { Info, Success } from '../../../../../global/CustomToasts';
import { setModelSavedToDb, setUserModels } from '../../../modules/CryptoModuleSlice'


const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} />;
});

const SaveCurrentModal = ({ modelName }) => {
    const dispatch = useDispatch()
    const token = useSelector(state => state.auth.accessToken);
    const selectedTickerPeriod = useSelector(state => state.cryptoModule.selectedTickerPeriod)
    const selectedTickerName = useSelector(state => state.cryptoModule.selectedTickerName)
    const model_data = useSelector(state => state.cryptoModule.modelData)
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleSaveModel = () => {
        let saveModelPayload = {
            model_type: model_data.training_parameters.modelType,
            scores: model_data.score,
            model_id: model_data.model_id,
            model_name: modelName,
            ticker_name: selectedTickerName,
            ticker_period: selectedTickerPeriod,
            epoch_results: model_data.epoch_results,
            train_duration: model_data.modelEndTime - model_data.modelStartTime,
            correlation_data: model_data.correlation_data,
            predicted_result: model_data.predictedValues,
            training_parameters: model_data.training_parameters,
            talibExecuteQueries: model_data.talibExecuteQueries,
        }
        if (model_data.training_parameters.modelType === 'WGAN-GP') {
            delete saveModelPayload['scores']
            delete saveModelPayload['predicted_result']
            saveModelPayload['wgan_intermediate_forecast'] = model_data.intermediate_forecasts
            saveModelPayload['wgan_final_forecast'] = model_data.wgan_final_forecast
        }
        console.log(saveModelPayload)

        saveModel({ token, payload: saveModelPayload })
            .then((res) => {
                // eslint-disable-next-line no-unused-vars
                const { model_save_status, modelSaveResult, user_id } = res.data
                if (model_save_status) {
                    Success('Model saved')
                    dispatch(setModelSavedToDb({ status: true, model_name: modelName }))
                    getUserModels({ token, payload: { user_id } })
                        .then((res) => {
                            dispatch(setUserModels(res.data.models))
                        })
                } else {
                    Info('Model already saved')
                    console.log('Saving the same modle')
                    return
                }
            })
            .catch((err) => {
                console.log(err.message)
            })
    }

    const handleSave = () => {
        handleSaveModel()
        setOpen(false)
    }

    return (
        <React.Fragment>
            <Tooltip title={'Save Model'} placement='top' style={{ cursor: 'pointer', padding: '6px' }}>
                <span style={{ padding: '0px' }}>
                    <IconButton onClick={handleClickOpen}>
                        <SaveIcon className='small-icon' />
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
                <DialogTitle>{"Save the current model?"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-slide-description">
                        Saves the current model weights and data along with the predictions to the DB.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button size='small' color='secondary' onClick={handleClose}>Cancel</Button>
                    <Button size='small' color='secondary' onClick={handleSave}>Save</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}

export default SaveCurrentModal