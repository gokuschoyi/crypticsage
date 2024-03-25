import React, { useEffect } from 'react'
import { Tooltip, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText, Button, Slide } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useDispatch, useSelector } from 'react-redux';
import { getUserModels, saveModel, addNewTrainingResults, retrain_wgan_Model } from '../../../../../../../api/adminController';
import { Info, Success } from '../../../../../global/CustomToasts';
import { setModelSavedToDb, setRetrainHistorySavedToDb, setUserModels, setStartWebSocket, setRetrainingFlag, sliceEpochResults, setRetrainParameters } from '../../../modules/CryptoModuleSlice'

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} />;
});

const SaveCurrentModal = ({ modelName, retrainHistSavePrompt, setRetrainHistSavePrompt, setMetricsChartReload }) => {
    const dispatch = useDispatch()
    const token = useSelector(state => state.auth.accessToken);
    const selectedTickerPeriod = useSelector(state => state.cryptoModule.selectedTickerPeriod)
    const loadingFromSaved = useSelector(state => state.cryptoModule.modelData.loading_from_saved_model)
    const selectedTickerName = useSelector(state => state.cryptoModule.selectedTickerName)
    const model_data = useSelector(state => state.cryptoModule.modelData)
    const modelEndTime = useSelector(state => state.cryptoModule.modelData.modelEndTime)
    const retrainHistorySavedFlag = useSelector(state => state.cryptoModule.modelData.retrain_history_saved)
    const [open, setOpen] = React.useState(false);

    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setRetrainHistSavePrompt((prev) => ({ ...prev, flag: false }))
    };

    useEffect(() => {
        if (retrainHistSavePrompt.flag && retrainHistSavePrompt.flag) {
            handleClickOpen()
        }
    }, [retrainHistSavePrompt.flag])

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
                    getUserModels({ token })
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

    const handleUpdateTrainingHistory = async () => {
        const updatePayload = {
            model_created_date: modelEndTime,
            model_id: model_data.model_id,
            epoch_results: model_data.epoch_results,
            train_duration: model_data.modelEndTime - model_data.modelStartTime,
            training_parameters: model_data.training_parameters,
            wgan_final_forecast: model_data.wgan_final_forecast,
            wgan_intermediate_forecast: model_data.wgan_intermediate_forecast,
        }

        console.log(updatePayload)
        setRetrainHistSavePrompt((prev) => ({ ...prev, flag: false }))

        await addNewTrainingResults({ token, payload: updatePayload })
            .then((res) => {
                Success('Training History updated successfully')
                dispatch(setRetrainHistorySavedToDb(true))
                getUserModels({ token })
                    .then((res) => {
                        dispatch(setUserModels(res.data.models))
                    })
            })
            .catch((err) => {
                console.log(err.message)
            })
    }

    const handleSave = async () => {
        if (!loadingFromSaved) {
            handleSaveModel()
            setOpen(false)
        } else {
            console.log('Updating the training history')
            await handleUpdateTrainingHistory()
            setOpen(false)
        }
    }

    const model_id = useSelector(state => state.cryptoModule.modelData.model_id)
    // const modelParams = useSelector(state => state.cryptoModule.modelData.training_parameters)
    const userModels = useSelector(state => state.cryptoModule.userModels)
    const handleModelReTraining = () => {
        console.log('Retraining model... from save modal')
        const { retrain_checkpoint, checkpoints, modelParams } = retrainHistSavePrompt
        // Checking if the selected checkpoint is the latestes one or not.
        // If not slice the epochResults for the metricsChart
        const last_saved_model_checkpoint_no = checkpoints.reduce((largest, checkpoint) => {
            const num = parseInt(checkpoint.split('_')[1]);
            return num > largest ? num : largest;
        }, 0);
        const selected_checkpoint_no = parseInt(retrain_checkpoint.split('_').pop())
        if (last_saved_model_checkpoint_no !== selected_checkpoint_no) {
            console.log('Checkpoint other than last one selected', last_saved_model_checkpoint_no, selected_checkpoint_no)
            setMetricsChartReload(true)
            dispatch(sliceEpochResults({ selected_cp_no: selected_checkpoint_no, from_: 'training_params' }))
        } else {
            setMetricsChartReload(false)
            console.log('Checkpoint selected is the latest one and Retraining model...')
        }

        const fullRetrainParams = {
            batchSize: modelParams.batchSize,
            d_learning_rate: modelParams.scaled_d_learningRate,
            do_validation: modelParams.doValidation,
            early_stopping_flag: modelParams.earlyStopping,
            epochs: modelParams.epoch,
            g_learning_rate: modelParams.scaled_g_learningRate,
            intermediate_result_step: parseInt(modelParams.intermediateResultStep),
            look_ahead: modelParams.lookAhead,
            model_save_checkpoint: parseInt(modelParams.modelSaveStep),
            model_type: modelParams.modelType === "WGAN-GP" ? "GAN" : modelParams.modelType,
            n_critic: modelParams.discriminator_iteration,
            slice_index: modelParams.to_train_count,
            time_step: modelParams.timeStep,
            to_predict: modelParams.multiSelectValue,
            training_size: modelParams.trainingDatasetSize,
            transformation_order: modelParams.transformation_order,
        }

        const fTalibExecuteQuery = userModels.find((model) => model.model_id === model_id).model_data.talibExecuteQueries
        const final_payload = {
            additional_data: {
                model_id: model_id,
                checkpoint: retrainHistSavePrompt.retrain_checkpoint
            },
            fTalibExecuteQuery,
            fullRetrainParams
        }
        console.log(final_payload)

        setRetrainHistSavePrompt((prev) => ({ ...prev, flag: false }))
        dispatch(setRetrainHistorySavedToDb(false))
        dispatch(setStartWebSocket(true))
        dispatch(setRetrainingFlag(true))
        dispatch(setRetrainParameters({ retrainParams: modelParams }))

        retrain_wgan_Model({ token, payload: final_payload })
            .then(res => {
                Success('Model retraining started')
                console.log('Retrain model response', res.data)
            })
            .catch(err => {
                console.log('Error retraining model', err)
            })
    }

    const saveAndStartTraining = async () => {
        console.log('Save and start training')
        await handleUpdateTrainingHistory()
        handleModelReTraining()
        setOpen(false)
    }

    return (
        <React.Fragment>
            <Tooltip title={!loadingFromSaved ? 'Save Model' : 'Update History'} placement='top' style={{ cursor: 'pointer', padding: '6px' }}>
                <span style={{ padding: '0px' }}>
                    <IconButton disabled={retrainHistorySavedFlag} onClick={handleClickOpen}>
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
                <DialogTitle>{!loadingFromSaved ? "Save the current model?" : "Update training history"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-slide-description">
                        {!loadingFromSaved
                            ? "Saves the current model weights and data along with the predictions to the DB."
                            : 'Save the current predictions, losses and metrics to DB'}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button size='small' color='secondary' onClick={handleClose}>Cancel</Button>
                    {retrainHistSavePrompt.flag ?
                        <React.Fragment>
                            <Button size='small' color='secondary' onClick={handleSave}>Update</Button>
                            <Button size='small' color='secondary' onClick={saveAndStartTraining}>Update & Run</Button>
                            <Button size='small' color='secondary' onClick={handleModelReTraining}>Run Only</Button>
                        </React.Fragment>
                        :
                        <Button size='small' color='secondary' onClick={handleSave}>Save</Button>
                    }
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}

export default SaveCurrentModal