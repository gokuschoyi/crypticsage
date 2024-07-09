import React, { useEffect } from 'react'
import { Tooltip, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText, Button, Slide } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useDispatch, useSelector } from 'react-redux';
import { getUserModels, saveModelSessions, addNewTrainingResults, retrain_wgan_Model } from '../../../../../../../api/adminController';
import { Success } from '../../../../../global/CustomToasts';
import {
    setModelSavedToDb
    , setRetrainHistorySavedToDb
    , setUserModels
    , setStartWebSocket
    , setRetrainingFlag
    , sliceEpochResults
    , setRetrainParameters
    , setLoadedCheckpoints
    , setTaskId
} from '../../../modules/CryptoModuleSlice'

import { setTrainingSessionMeta, setLastRunCheckpoint, setSessionsSaved, resetModelRunMeta } from '../../../modules/ModelRunMetaSlice'

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} />;
});

const generateSaveOrUpdatePayload = ({ type, model_data, modelName, selectedTickerName, selectedTickerPeriod, modelEndTime }) => {
    let payload = {}
    if (type === 'save') {
        payload = {
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
            delete payload['scores']
            delete payload['predicted_result']
            payload['wgan_intermediate_forecast'] = model_data.wgan_intermediate_forecast
            payload['wgan_final_forecast'] = model_data.wgan_final_forecast
        }
    } else if (type === 'update') {
        payload = {
            model_created_date: modelEndTime,
            model_id: model_data.model_id,
            epoch_results: model_data.epoch_results,
            train_duration: model_data.modelEndTime - model_data.modelStartTime,
            training_parameters: model_data.training_parameters,
            wgan_final_forecast: model_data.wgan_final_forecast,
            wgan_intermediate_forecast: model_data.wgan_intermediate_forecast,
        }
    }

    return payload
}

const SaveCurrentModal = ({ modelName, retrainHistSavePrompt, setRetrainHistSavePrompt, setMetricsChartReload }) => {
    const dispatch = useDispatch()
    const token = useSelector(state => state.auth.accessToken);
    const uid = useSelector(state => state.auth.uid);
    const selectedTickerPeriod = useSelector(state => state.cryptoModule.selectedTickerPeriod)
    const loadingFromSaved = useSelector(state => state.cryptoModule.modelData.loading_from_saved_model)
    const selectedTickerName = useSelector(state => state.cryptoModule.selectedTickerName)
    const model_data = useSelector(state => state.cryptoModule.modelData)
    const modelEndTime = useSelector(state => state.cryptoModule.modelData.modelEndTime)
    const modelSavedToDb = useSelector(state => state.cryptoModule.modelData.model_saved_to_db)
    const retrainHistorySavedFlag = useSelector(state => state.cryptoModule.modelData.retrain_history_saved)
    const first_save = useSelector(state => state.cryptoModule.modelData.first_save)
    const model_id = useSelector(state => state.cryptoModule.modelData.model_id)
    const userModels = useSelector(state => state.cryptoModule.userModels)
    const disable_save = loadingFromSaved ? retrainHistorySavedFlag : modelSavedToDb
    // console.log(disable_save)
    const loadedCheckpoints = useSelector(state => state.cryptoModule.modelData.loaded_checkpoints)

    const initialRunMetaFlag = useSelector(state => state.modelRunMeta.initial_run_data_present)
    const session_count = useSelector(state => state.modelRunMeta.run_count)
    const all_sessions = useSelector(state => state.modelRunMeta.training_sessions)

    const lastRunCP = useSelector(state => state.modelRunMeta.last_run_checkpoint)

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

    const handleNewSave = async () => {
        let payload = {}
        let meta_data = {}
        if (!first_save && model_data.training_parameters.modelType === 'WGAN-GP') {
            if (session_count === 0) { // initial train session
                // console.log('First train session save')
                const pld = generateSaveOrUpdatePayload({ type: 'save', model_data, modelName, selectedTickerName, selectedTickerPeriod })
                const { model_id, model_name, model_type, ticker_name, ticker_period, epoch_results, train_duration, correlation_data,
                    training_parameters, talibExecuteQueries, wgan_final_forecast, wgan_intermediate_forecast
                } = pld
                const firstSaveMeta = {
                    user_id: uid,
                    model_id,
                    model_name,
                    model_type,
                    model_created_date: modelEndTime,
                    ticker_name,
                    ticker_period,
                    model_data: {
                        epoch_results
                        , train_duration
                        , correlation_data
                        , training_parameters
                        , talibExecuteQueries
                        , wgan_final_forecast
                        , wgan_intermediate_forecast
                    }
                }
                meta_data = {
                    session: 1,
                    data: firstSaveMeta,
                    checkpoints: [],
                    selectedCheckpoint: ''
                }

                payload = {
                    save_type: 'initial',
                    to_save: [meta_data],
                    model_type: "WGAN-GP"
                }
            } else { // multiple train sessions
                // console.log('Multiple train sessions save')
                let to_save = all_sessions.map((session) => session)

                const pld = generateSaveOrUpdatePayload({ type: 'update', model_data, modelEndTime })
                const { epoch_results, model_created_date, train_duration, training_parameters, wgan_final_forecast, wgan_intermediate_forecast } = pld
                const lastCpNo = parseInt(lastRunCP.split('_').pop())
                // console.log(lastCpNo)
                const filteredEpochs = epoch_results.filter((epoch_result) => epoch_result.epoch > lastCpNo)

                const additionalTrainMeta = {
                    epoch_results: filteredEpochs
                    , train_duration
                    , training_parameters
                    , wgan_intermediate_forecast
                    , wgan_final_forecast
                    , model_created_date
                }
                const additional_meta_data = {
                    session: session_count + 1,
                    data: additionalTrainMeta,
                    checkpoints: loadedCheckpoints.checkpoints,
                    selectedCheckpoint: lastRunCP
                }

                to_save.push(additional_meta_data)

                payload = {
                    save_type: 'bulk',
                    to_save,
                    model_type: "WGAN-GP"
                }

                // clear the saved data
            }
        } else {
            // console.log('Saving', model_data.training_parameters.modelType)
            const pld = generateSaveOrUpdatePayload({ type: 'save', model_data, modelName, selectedTickerName, selectedTickerPeriod })
            const to_save = {
                ...pld,
                model_created_date: modelEndTime
            }
            payload = {
                save_type: 'initial',
                to_save,
                model_type: model_data.training_parameters.modelType
            }
        }
        // console.log(payload)
        setRetrainHistSavePrompt((prev) => ({ ...prev, flag: false }))
        try {
            const saveResult = await saveModelSessions({ token, payload })
            // console.log(saveResult.data)
            if (saveResult.data.model_meta_result[0] && saveResult.data.session_save_result[0]) {
                Success(saveResult.data.message)
                dispatch(setModelSavedToDb({ status: true, model_name: modelName }));
                dispatch(setSessionsSaved())
                if (session_count === 0) {
                    dispatch(setTrainingSessionMeta({ type: 'initial', meta: { ...meta_data, saved: true } }))
                }

                // fetch the user models
                const userModelsRes = await getUserModels({ token });
                dispatch(setUserModels(userModelsRes.data.models));
            }
        } catch (err) {

            console.log(err.message)
        }
    }

    const handleNewUpdateTrainingHistory = async () => {
        // call the new save api to update the training history
        let to_save = all_sessions.map((session) => session).filter((session) => session.saved === false || session.saved === undefined)
        const pld = generateSaveOrUpdatePayload({ type: 'update', model_data, modelEndTime })
        const { epoch_results, model_created_date, train_duration, training_parameters, wgan_final_forecast, wgan_intermediate_forecast } = pld
        const lastCpNo = parseInt(lastRunCP.split('_').pop())
        // console.log(lastCpNo)
        const filteredEpochs = epoch_results.filter((epoch_result) => epoch_result.epoch > lastCpNo)

        const additionalTrainMeta = {
            epoch_results: filteredEpochs
            , train_duration
            , training_parameters
            , wgan_intermediate_forecast
            , wgan_final_forecast
            , model_created_date
        }
        const additional_meta_data = {
            session: session_count + 1,
            data: additionalTrainMeta,
            checkpoints: retrainHistSavePrompt.checkpoints !== undefined
                ? retrainHistSavePrompt.checkpoints
                : loadedCheckpoints.checkpoints,
            selectedCheckpoint: lastRunCP
        }

        to_save.push(additional_meta_data)
        // console.log(to_save)

        const payload = {
            to_update: to_save,
            model_id: model_id,
            update_type: ''
        }
        setRetrainHistSavePrompt((prev) => ({ ...prev, flag: false }))

        try {
            // Add new training results
            await addNewTrainingResults({ token, payload });

            // Success message and dispatch actions
            Success('Training History updated successfully');
            dispatch(setRetrainHistorySavedToDb(true));
            dispatch(setSessionsSaved())
            dispatch(setTrainingSessionMeta({ type: 'additional', meta: { ...additional_meta_data, saved: true } }))

            // Fetch and update user models
            const res = await getUserModels({ token });
            dispatch(setUserModels(res.data.models));
        } catch (err) {
            console.log(err)
        }
        // dispatch(setTrainingSessionMeta({ type: 'additional', meta: additional_meta_data }))
    }

    const handleSave = async () => {
        if (!first_save) {
            // console.log('Saving the model')
            setOpen(false)
            // await handleSaveModel()
            await handleNewSave()
        } else {
            // console.log('Updating the training history')
            setOpen(false)
            await handleNewUpdateTrainingHistory()
        }
    }

    // console.log(retrainHistSavePrompt)
    const handleModelReTraining = () => {
        // console.log('(RETRAIN) Component save modal')
        const { retrain_checkpoint, checkpoints, modelParams, type } = retrainHistSavePrompt

        // Checking if the selected checkpoint is the latestes one or not.
        // If not slice the epochResults for the metricsChart
        const last_saved_model_checkpoint_no = checkpoints.reduce((largest, checkpoint) => {
            const num = parseInt(checkpoint.split('_')[1]);
            return num > largest ? num : largest;
        }, 0);
        const selected_checkpoint_no = parseInt(retrain_checkpoint.split('_').pop())
        if (last_saved_model_checkpoint_no !== selected_checkpoint_no) {
            // console.log('Checkpoint other than last one selected', last_saved_model_checkpoint_no, selected_checkpoint_no)
            setMetricsChartReload(true)
            dispatch(sliceEpochResults({ selected_cp_no: selected_checkpoint_no, from_: 'training_params' }))
        } else {
            setMetricsChartReload(false)
            // console.log('Checkpoint selected is the latest one and Retraining model...')
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

        let fTalibExecuteQuery = []
        if (type === 'current') {
            fTalibExecuteQuery = model_data.talibExecuteQueries
        } else {
            fTalibExecuteQuery = userModels.find((model) => model.model_id === model_id).model_data.talibExecuteQueries
        }

        const final_payload = {
            additional_data: {
                model_id: model_id,
                checkpoint: retrainHistSavePrompt.retrain_checkpoint
            },
            fTalibExecuteQuery,
            fullRetrainParams
        }
        // console.log(final_payload)

        setRetrainHistSavePrompt((prev) => ({ ...prev, flag: false }))
        dispatch(setRetrainHistorySavedToDb(false))
        dispatch(setStartWebSocket(true))
        dispatch(setRetrainingFlag(true))
        dispatch(setRetrainParameters({ retrainParams: modelParams, model_saved_to_db: false }))
        dispatch(setLoadedCheckpoints({ checkpoints: checkpoints, selectedCheckpoint: retrain_checkpoint }))

        retrain_wgan_Model({ token, payload: final_payload })
            .then(res => {
                Success(res.data.message)
                dispatch(setTaskId({ task_id: res.data.task_id }))
                dispatch(setLastRunCheckpoint(retrainHistSavePrompt.retrain_checkpoint))
                // console.log('Retrain model response', res.data)
            })
            .catch(err => {
                console.log('Error retraining model', err)
            })
    }

    const reTrainingOnly = async () => {
        // console.log('Training only', first_save)
        if (!first_save && !initialRunMetaFlag) {
            // console.log('Initial run meta not present')
            const pld = generateSaveOrUpdatePayload({ type: 'save', model_data, modelName, selectedTickerName, selectedTickerPeriod })
            const { model_id, model_name, model_type, ticker_name, ticker_period, epoch_results, train_duration, correlation_data,
                training_parameters, talibExecuteQueries, wgan_final_forecast, wgan_intermediate_forecast
            } = pld
            const firstSaveMeta = {
                user_id: uid,
                model_id,
                model_name,
                model_type,
                model_created_date: modelEndTime,
                ticker_name,
                ticker_period,
                model_data: {
                    epoch_results
                    , train_duration
                    , correlation_data
                    , training_parameters
                    , talibExecuteQueries
                    , wgan_final_forecast
                    , wgan_intermediate_forecast
                }
            }
            const meta_data = {
                session: 1,
                data: firstSaveMeta,
                checkpoints: retrainHistSavePrompt.checkpoints,
                selectedCheckpoint: ''
            }
            // console.log(meta_data)
            dispatch(setTrainingSessionMeta({ type: 'initial', meta: meta_data }))
        } else if (!first_save && initialRunMetaFlag) {
            // console.log('Initial run meta present, Saving additional runs')
            const pld = generateSaveOrUpdatePayload({ type: 'update', model_data, modelEndTime })
            const { epoch_results, model_created_date, train_duration, training_parameters, wgan_final_forecast, wgan_intermediate_forecast } = pld
            const lastCpNo = parseInt(lastRunCP.split('_').pop())
            // console.log(lastCpNo)
            const filteredEpochs = epoch_results.filter((epoch_result) => epoch_result.epoch > lastCpNo)

            const additionalTrainMeta = {
                epoch_results: filteredEpochs
                , train_duration
                , training_parameters
                , wgan_intermediate_forecast
                , wgan_final_forecast
                , model_created_date
            }
            const additional_meta_data = {
                session: session_count + 1,
                data: additionalTrainMeta,
                checkpoints: retrainHistSavePrompt.checkpoints,
                selectedCheckpoint: lastRunCP
            }
            // console.log(additional_meta_data)
            dispatch(setTrainingSessionMeta({ type: 'additional', meta: additional_meta_data }))
        } else if (first_save && initialRunMetaFlag && !retrainHistorySavedFlag) { // check retrain saved flag
            // console.log('Updating the training history, Loaded form saved and retrain')
            const pld = generateSaveOrUpdatePayload({ type: 'update', model_data, modelEndTime })
            const { epoch_results, model_created_date, train_duration, training_parameters, wgan_final_forecast, wgan_intermediate_forecast } = pld
            const lastCpNo = parseInt(lastRunCP.split('_').pop())
            // console.log(lastCpNo)
            const filteredEpochs = epoch_results.filter((epoch_result) => epoch_result.epoch > lastCpNo)

            const additionalTrainMeta = {
                epoch_results: filteredEpochs
                , train_duration
                , training_parameters
                , wgan_intermediate_forecast
                , wgan_final_forecast
                , model_created_date
            }
            const additional_meta_data = {
                session: session_count + 1,
                data: additionalTrainMeta,
                checkpoints: retrainHistSavePrompt.checkpoints,
                selectedCheckpoint: lastRunCP
            }
            // console.log(additional_meta_data)
            dispatch(setTrainingSessionMeta({ type: 'additional', meta: additional_meta_data }))
        }
        handleModelReTraining()
        setOpen(false)
        // setRetrainHistSavePrompt((prev) => ({ ...prev, flag: false }))
    }

    // const saveAndStartTraining = async () => {
    //     console.log('Save and start training')
    //     await handleSave()
    //     handleModelReTraining()
    //     setOpen(false)
    // }

    return (
        <React.Fragment>
            <Tooltip title={!first_save ? 'Save Model' : 'Update History'} placement='top' style={{ cursor: 'pointer', padding: '6px' }}>
                <span style={{ padding: '0px' }}>
                    <IconButton disabled={disable_save} onClick={handleClickOpen}>
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
                <DialogTitle>{!first_save ? "Save the current model?" : "Update training history"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-slide-description">
                        {!first_save
                            ? "Saves the current model weights and data along with the predictions to the DB."
                            : 'Update the current predictions, losses and metrics to DB'}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button size='small' color='secondary' onClick={handleClose}>Cancel</Button>
                    {retrainHistSavePrompt.flag ?
                        <React.Fragment>
                            <Button size='small' color='secondary' onClick={handleSave}>{retrainHistSavePrompt.type === 'current' ? 'Save' : 'Update'}</Button>
                            {/* <Button size='small' color='secondary' onClick={saveAndStartTraining}>{retrainHistSavePrompt.type === 'current' ? 'Save' : 'Update'} & Run</Button> */}
                            <Button size='small' color='secondary' onClick={reTrainingOnly}>Run Only</Button>
                        </React.Fragment>
                        :
                        <Button size='small' color='secondary' onClick={handleSave}>{!first_save ? 'Save' : 'Update'}</Button>
                    }
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}

export default SaveCurrentModal