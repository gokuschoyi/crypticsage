import React from 'react'
import { Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button, Slide } from '@mui/material'
import { SaveIcon, DeleteForeverIcon } from '../../../../../global/Icons'
import { getUserModels, saveModelSessions, addNewTrainingResults, getModelCheckPoints, deleteModel } from '../../../../../../../api/adminController';
import { Success } from '../../../../../global/CustomToasts';
import { useSelector, useDispatch } from 'react-redux';
import { setSelectedModelId, setCachedDataSavedToDb, removeIntermediateModel } from '../../../modules/IntermediateModelSlice'
import { setUserModels } from '../../../modules/CryptoModuleSlice'
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} />;
});

const SaveIntermediateModel = ({ type, model_data, modelName, re_train_flag }) => {
    const token = useSelector(state => state.auth.accessToken)
    const dispatch = useDispatch()
    const [open, setOpen] = React.useState(false);
    const handleClickOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    function generateCheckpoints(totalEpochs, modelSaveStep) {
        const checkpoints = [];

        // Loop through the epochs and add checkpoints at intervals of modelSaveStep
        for (let epoch = modelSaveStep; epoch <= totalEpochs; epoch += modelSaveStep) {
            checkpoints.push(`checkpoint_${epoch}`);
        }

        // If totalEpochs is not a multiple of modelSaveStep, add the final epoch checkpoint
        if (totalEpochs % modelSaveStep !== 0) {
            checkpoints.push(`checkpoint_${totalEpochs}`);
        }

        return checkpoints;
    }

    const handleSave = async () => { //change payload to match new api endpoint
        // console.log('Save Intermediate Model')

        const firstSaveMeta = {
            user_id: model_data.uid,
            model_id: model_data.model_id,
            model_name: modelName,
            model_type: model_data.model_type,
            model_created_date: model_data.model_train_end_time,
            ticker_name: model_data.ticker_name,
            ticker_period: model_data.period,
            model_data: {
                epoch_results: model_data.cachedModelResults.cached_data.epoch_results
                , train_duration: model_data.model_train_end_time - model_data.model_train_start_time
                , correlation_data: model_data.cachedModelResults.cached_data.feature_metrics
                , training_parameters: model_data.cachedModelResults.cached_data.training_parameters
                , talibExecuteQueries: model_data.cachedModelResults.talibExecuteQueries
                , wgan_final_forecast: {
                    predictions: model_data.cachedModelResults.cached_data.predictions
                    , rmse: model_data.cachedModelResults.cached_data.forecast_rmse
                }
                , wgan_intermediate_forecast: model_data.cachedModelResults.cached_data.intermediate_forecast
            }
        }
        const meta_data = {
            session: 1,
            data: firstSaveMeta,
            checkpoints: generateCheckpoints(model_data.cachedModelResults.cached_data.training_parameters.epoch, model_data.cachedModelResults.cached_data.training_parameters.modelSaveStep),
            selectedCheckpoint: ''
        }
        const payload = {
            save_type: 'initial',
            to_save: [meta_data],
            model_type: "WGAN-GP",
            from_: 'intermediate'
        }
        // console.log(payload)

        try {
            const saveResult = await saveModelSessions({ token, payload })
            // console.log(saveResult.data)
            if (saveResult.data.model_meta_result[0] && saveResult.data.session_save_result[0]) {
                Success(saveResult.data.message)
                dispatch(setSelectedModelId(''))
                dispatch(removeIntermediateModel(model_data.model_id))
                handleClose()

                // fetch the user models
                const userModelsRes = await getUserModels({ token });
                dispatch(setUserModels(userModelsRes.data.models));
            }
        } catch (err) {
            console.log(err.message)
        }
    }

    const handleUpdate = async () => {
        // console.log('Update Intermediate Model')

        const model_id = model_data.model_id
        const checkpointsRes = await getModelCheckPoints({ token, model_id })
        const additionalTrainMeta = {
            epoch_results: model_data.cachedModelResults.cached_data.epoch_results,
            train_duration: model_data.model_train_end_time - model_data.model_train_start_time,
            training_parameters: model_data.cachedModelResults.cached_data.training_parameters,
            wgan_intermediate_forecast: model_data.cachedModelResults.cached_data.intermediate_forecast,
            wgan_final_forecast: {
                predictions: model_data.cachedModelResults.cached_data.predictions,
                rmse: model_data.cachedModelResults.cached_data.forecast_rmse
            },
            model_created_date: model_data.model_train_end_time,
        }

        const additional_meta_data = {
            session: model_data.session_count + 1,
            data: additionalTrainMeta,
            checkpoints: checkpointsRes.data.checkpoints,
            selectedCheckpoint: model_data.last_checkpoint
        }

        const to_save = [additional_meta_data]

        // // new payload format
        const payload = {
            to_update: to_save,
            model_id: model_id,
            update_type: 'intermediate'
        }

        // console.log(payload)

        try {
            await addNewTrainingResults({ token, payload })

            Success('Training History updated successfully')
            dispatch(setCachedDataSavedToDb({ model_id: model_data.model_id }))
            handleClose()
            const userModels = await getUserModels({ token })
            dispatch(setUserModels(userModels.data.models))
        } catch (err) {
            console.log(err.message)
        }
    }


    const handleDelete = () => {
        // console.log('Delete Intermediate Model')
        const payload = {
            model_id: model_data.model_id,
            model_type: model_data.model_type,
            asset_type: model_data.asset_type,
            ticker_name: model_data.ticker_name,
            period: model_data.period,
            delete_type: 'intermediate',
            last_checkpoint: model_data.last_checkpoint
        }
        // console.log(payload)

        deleteModel({
            token, payload
        })
            .then((res) => {
                Success(res.data.message)
                dispatch(setSelectedModelId(''))
                dispatch(removeIntermediateModel(model_data.model_id))
            })
            .catch((err) => {
                console.log(err.message)
            })
    }

    return (
        <React.Fragment>
            <Tooltip title={type === 'save' ? re_train_flag ? 'Update Model' : 'Save Model' : 'Delete Model'} placement='top' style={{ cursor: 'pointer', padding: '6px' }}>
                <span style={{ padding: '0px' }}>
                    {type === 'save'
                        ?
                        <IconButton onClick={handleClickOpen} disabled={model_data.saved_to_db}>
                            <SaveIcon className='small-icon' />
                        </IconButton>
                        :
                        <IconButton onClick={handleClickOpen}>
                            <DeleteForeverIcon className='small-icon' />
                        </IconButton>
                    }
                </span>
            </Tooltip>

            <Dialog
                open={open}
                TransitionComponent={Transition}
                keepMounted
                onClose={handleClose}
                aria-describedby="alert-dialog-slide-description"
            >
                <DialogTitle>{type === 'save' ? "Save the current model?" : "Delete the current model?"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-slide-description">
                        {type === 'save'
                            ? "Saves the current model weights and data along with the predictions to the DB."
                            : "Deletes the current model weights and data along with the predictions from the DB."
                        }
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button size='small' color='secondary' onClick={handleClose}>Cancel</Button>
                    {type === 'save'
                        ? !re_train_flag
                            ? <Button size='small' color='secondary' onClick={handleSave}>Save</Button>
                            : <Button size='small' color='secondary' onClick={handleUpdate}>Update</Button>
                        : <Button size='small' color='secondary' onClick={handleDelete}>Delete</Button>
                    }
                </DialogActions>
            </Dialog>
        </React.Fragment>
    )
}

export default SaveIntermediateModel