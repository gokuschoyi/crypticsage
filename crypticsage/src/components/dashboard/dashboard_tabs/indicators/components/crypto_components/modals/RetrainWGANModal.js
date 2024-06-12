import React, { useEffect, useState } from 'react'
import { Box, Paper, FormControlLabel, Switch, Tooltip, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText, Button, Slide, Typography } from '@mui/material';
import LoopIcon from '@mui/icons-material/Loop';
import { useSelector, useDispatch } from 'react-redux'
import { getModelCheckPoints } from '../../../../../../../api/adminController'
import { MultiSelect, CustomSlider } from '../Training_Components';
import DownloadIcon from '@mui/icons-material/Download';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
    setLoadingFromSavedModel
    , setRetrainParameters
    , setLoadedCheckpoints
    , resetModelData
} from '../../../modules/CryptoModuleSlice'
import { setInitialTrainingDone, setLastRunCheckpoint } from '../../../modules/ModelRunMetaSlice'

const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="left" ref={ref} {...props} />;
});

const INTERMEDIATE_RESULT_STEP_OPTIONS = [
    "",
    "0",
    "2",
    "25",
    "50",
    "100",
    "200"
]
const scaledValue = (value, max) => {
    const scl = (value) / (100 - 1) * max
    const trucned_no = scl.toString().match(/^-?\d+(?:\.\d{0,5})?/)[0]
    return parseFloat(trucned_no)
}

const RetrainWGANModal = ({ type, model_id: m_id, setMetricsChartReload }) => {
    const dispatch = useDispatch()
    const token = useSelector(state => state.auth.accessToken);

    const userModels = useSelector(state => state.cryptoModule.userModels).filter(model => model.model_id === m_id)[0]

    let modelParams, model_id
    const redux_model_id = useSelector(state => state.cryptoModule.modelData.model_id)
    const redux_model_saved_to_db = useSelector(state => state.cryptoModule.modelData.model_saved_to_db)
    const retrain_history_saved_to_db = useSelector(state => state.cryptoModule.modelData.retrain_history_saved)
    const wganFinalPred = useSelector(state => state.cryptoModule.modelData.wgan_final_forecast.predictions)

    modelParams = userModels.model_data.training_parameters
    model_id = userModels.model_id
    
    const [goAndLoadError, setGoAndLoadError] = useState('')

    const [retrainModel, setRetrainModel] = useState(false)
    const [checkpoints, setCheckpoints] = useState([])
    const [checkpointError, setCheckpointError] = useState(false)

    let retrain_params = {
        checkpoint: '',
        intermediate_result_step: '',
        model_save_checkpoint: '',
        epochs: 0,
        n_critic: 5,
        d_learning_rate: 40,
        g_learning_rate: 10,
        scaled_d_learningRate: 0.0004,
        scaled_g_learningRate: 0.0001,
        earlyStopping: false,
    }
    const [reTrainParams, setReTrainParams] = useState(retrain_params)

    useEffect(() => {
        // console.log('UE Changing retrain params ...')
        if (modelParams !== undefined) {
            // console.log('Changing retrain params AVAILABLE...')
            setReTrainParams((prev) => ({
                ...prev,
                checkpoint: '',
                intermediate_result_step: modelParams.intermediateResultStep,
                model_save_checkpoint: modelParams.modelSaveStep,
                epochs: modelParams.epoch,
                n_critic: modelParams.discriminator_iteration,
                d_learning_rate: 40,
                g_learning_rate: 10,
                scaled_d_learningRate: 0.0004,
                scaled_g_learningRate: 0.0001,
                earlyStopping: modelParams.earlyStopping,
            }))
            setCheckpoints([])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [modelParams.intermediateResultStep, modelParams.modelSaveStep, modelParams.epoch, modelParams.discriminator_iteration, modelParams.earlyStopping])

    const getLatestCheckpoint = (checkpoints) => {
        const latestCheckpoint = checkpoints.reduce((largest, checkpoint) => {
            const num = parseInt(checkpoint.split('_')[1]);
            return num > largest ? num : largest;
        }, 0);

        return `checkpoint_${latestCheckpoint}`
    }

    const loadModelCheckpoints = async () => {
        getModelCheckPoints({ token, model_id }).then(res => {
            const checkpoints = res.data.checkpoints
            setCheckpoints(checkpoints)
            const latestCheckpoint = getLatestCheckpoint(checkpoints)
            checkpointError && setCheckpointError(false)
            setReTrainParams((prev) => ({ ...prev, checkpoint: latestCheckpoint }))
        })
    }

    useEffect(() => {
        if (checkpoints.length > 0 && reTrainParams.checkpoint === '') {
            const cp_string = getLatestCheckpoint(checkpoints)
            setReTrainParams((prev) => ({ ...prev, checkpoint: cp_string }))
        }
    }, [checkpoints, reTrainParams.checkpoint])

    const handleClickOpen = () => {
        setRetrainModel(true);
    };

    const handleClose = () => {
        setRetrainModel(false);
        setGoAndLoadError('')
    };

    const handleReTrainParamChange = (name, value) => {
        if (name === 'd_learning_rate' || name === 'g_learning_rate') {
            const max = 0.001
            let scaled = scaledValue(value, max)
            setReTrainParams((prev) => ({ ...prev, [name === 'd_learning_rate' ? 'scaled_d_learningRate' : "scaled_g_learningRate"]: scaled }))
        }
        setReTrainParams((prev) => ({ ...prev, [name]: value }))
    }

    const handleRetrainParamReset = () => {
        setReTrainParams({
            ...retrain_params,
            epochs: modelParams.epoch,
            intermediate_result_step: modelParams.intermediateResultStep,
            model_save_checkpoint: modelParams.modelSaveStep,
            checkpoint: getLatestCheckpoint(checkpoints),
            scaled_d_learningRate: scaledValue(retrain_params.d_learning_rate, 0.001),
            scaled_g_learningRate: scaledValue(retrain_params.g_learning_rate, 0.001)
        })
    }

    const loadSavedParameters = () => {
        if (reTrainParams.checkpoint === '') {
            // console.log('Checkpoint not selected')
            setCheckpointError(true)
        } else if (redux_model_id !== '' && wganFinalPred.length > 0 && (redux_model_saved_to_db === false && retrain_history_saved_to_db === false)) {
            setGoAndLoadError('Cannot Load Parameters. Another model run present and not saved. Save or Reset the model and load again')
            return
        } else {
            setGoAndLoadError('')
            if (wganFinalPred.length > 0) {
                // console.log('Resetting previous run model data')
                dispatch(resetModelData())
            }
            // console.log("Loading saved parameters")
            let modelParams_copy = JSON.parse(JSON.stringify(userModels.model_data.training_parameters))

            // console.log('previous run parameters', modelParams_copy)
            // console.log('Changed parameters', reTrainParams)

            modelParams_copy = {
                ...modelParams_copy,
                d_learningRate: reTrainParams.d_learning_rate,
                earlyStopping: reTrainParams.earlyStopping,
                epoch: reTrainParams.epochs,
                g_learningRate: reTrainParams.g_learning_rate,
                intermediateResultStep: reTrainParams.intermediate_result_step,
                modelSaveStep: reTrainParams.model_save_checkpoint,
                discriminator_iteration: reTrainParams.n_critic,
                scaled_d_learningRate: reTrainParams.scaled_d_learningRate,
                scaled_g_learningRate: reTrainParams.scaled_g_learningRate
            }

            // console.log('Redux mParams', model_params)
            const model_name = userModels.model_name
            const savedModeId = userModels.model_id

            const total_model_runs = userModels.additional_training_run_results.length + 1
            // console.log(total_model_runs)

            dispatch(setLoadingFromSavedModel(true))
            dispatch(setRetrainParameters({
                retrainParams: modelParams_copy,
                model_name,
                model_id: savedModeId,
                model_saved_to_db: true
            }))
            dispatch(setInitialTrainingDone(total_model_runs))
            dispatch(setLastRunCheckpoint(reTrainParams.checkpoint))
            dispatch(setLoadedCheckpoints({ checkpoints: checkpoints, selectedCheckpoint: reTrainParams.checkpoint }))
            setRetrainModel(false)
        }
    }

    return (
        <React.Fragment>
            <Tooltip title={'Re Train the model'} placement='top' style={{ cursor: 'pointer', padding: '6px' }}>
                <span style={{ padding: '0px' }}>
                    <IconButton onClick={handleClickOpen}>
                        <LoopIcon className='small-icon' />
                    </IconButton>
                </span>
            </Tooltip>

            <Dialog
                fullWidth={true}
                maxWidth='xs'
                open={retrainModel}
                TransitionComponent={Transition}
                keepMounted
                onClose={handleClose}
                aria-describedby="alert-dialog-slide-description"
            >
                <DialogTitle>{"RETRAIN MODEL"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-slide-description">
                        {goAndLoadError !== '' && <Typography variant='custom' style={{ color: 'red' }}>{goAndLoadError}</Typography>}
                    </DialogContentText>
                    <Box display='flex' flexDirection='column' gap='8px'>
                        <Paper elevation={4} sx={{ padding: '4px' }}>
                            <FormControlLabel
                                value="start"
                                sx={{ marginLeft: '0px', marginRight: '0px', width: '100%', justifyContent: 'space-between' }}
                                control={<Switch disabled={false} size="small" color="secondary" />}
                                label='Perform Early Stopping'
                                labelPlacement="start"
                                checked={reTrainParams.earlyStopping}
                                onChange={() => handleReTrainParamChange('earlyStopping', !reTrainParams.earlyStopping)}
                            />
                        </Paper>

                        <Box sx={{ display: 'flex', flexDirection: 'row', gap: '8px', width: '100%' }}>
                            <MultiSelect
                                inputLabel={'Load Checkpoint'}
                                inputOptions={checkpoints}
                                selectedInputOptions={reTrainParams.checkpoint}
                                handleInputOptions={(newValue) => {
                                    handleReTrainParamChange('checkpoint', newValue)
                                }}
                                fieldName={'checkpoint'}
                                toolTipTitle={'Select the checkpoint for retraining'}
                                trainingStartedFlag={false}
                                error={checkpointError}
                            />
                            <Paper elevation={8} sx={{ width: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Tooltip title={checkpoints.length > 0 ? 'Checkpoints loaded' : 'Load the model saved checkpoints.'} placement='top' sx={{ cursor: 'pointer', padding: '6px' }}>
                                    <span>
                                        <IconButton disabled={checkpoints.length > 0} onClick={loadModelCheckpoints}>
                                            <DownloadIcon sx={{ color: checkpoints.length > 0 ? 'green' : 'red' }} className='small-icon' />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            </Paper>
                        </Box>

                        <MultiSelect
                            inputLabel={'Forecast step'}
                            inputOptions={INTERMEDIATE_RESULT_STEP_OPTIONS}
                            selectedInputOptions={reTrainParams.intermediate_result_step}
                            handleInputOptions={(newValue) => {
                                handleReTrainParamChange('intermediate_result_step', newValue)
                            }}
                            fieldName={'Intermediate Step'}
                            toolTipTitle={'Select a step at which point to send intermediate forecast. Select 0 for no intermediate forecast. If the step is greater than the total no of epochs, then the intermediate forecast will be sent at the end of the training as the final forecast.'}
                            trainingStartedFlag={false}
                        />

                        <MultiSelect
                            inputLabel={'Model save step'}
                            inputOptions={INTERMEDIATE_RESULT_STEP_OPTIONS}
                            selectedInputOptions={reTrainParams.model_save_checkpoint}
                            handleInputOptions={(newValue) => {
                                handleReTrainParamChange('model_save_checkpoint', newValue)
                            }}
                            fieldName={'Model Save Step'}
                            toolTipTitle={'Select a step at which point to save the generator model. Select 0 for no save. If the step is greater than the total no of epochs, then the model will be saved at the end of the training.'}
                            trainingStartedFlag={false}
                        />

                        <CustomSlider
                            sliderValue={reTrainParams.epochs}
                            name={'epochs'}
                            handleModelParamChange={handleReTrainParamChange}
                            label={'Epochs'}
                            min={1}
                            max={500}
                            sliderMin={1}
                            sliderMax={500}
                            disabled={false}
                        />

                        <CustomSlider
                            sliderValue={reTrainParams.n_critic}
                            name={'n_critic'}
                            handleModelParamChange={handleReTrainParamChange}
                            label={'Critic Iterator'}
                            min={1}
                            max={5}
                            sliderMin={1}
                            sliderMax={5}
                            disabled={false}
                        />
                        <CustomSlider
                            sliderValue={reTrainParams.d_learning_rate}
                            name={'d_learning_rate'}
                            handleModelParamChange={handleReTrainParamChange}
                            label={`L Rate (Disc)`}
                            min={10}
                            max={100}
                            sliderMin={10}
                            sliderMax={100}
                            scaledLearningRate={reTrainParams.scaled_d_learningRate}
                            disabled={false}
                        />

                        <CustomSlider
                            sliderValue={reTrainParams.g_learning_rate}
                            name={'g_learning_rate'}
                            handleModelParamChange={handleReTrainParamChange}
                            label={`L Rate (Gen)`}
                            min={10}
                            max={100}
                            sliderMin={10}
                            sliderMax={100}
                            scaledLearningRate={reTrainParams.scaled_g_learningRate}
                            disabled={false}
                        />
                    </Box>

                </DialogContent>
                <DialogActions>
                    <Tooltip title={'Reset training data.'} placement='top' sx={{ cursor: 'pointer', padding: '6px' }}>
                        <span>
                            <IconButton disabled={false} onClick={handleRetrainParamReset}>
                                <RestartAltIcon className='small-icon' />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Button size='small' color='secondary' onClick={handleClose}>Cancel</Button>
                    <Button size='small' color='secondary' onClick={loadSavedParameters}>Load</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    )
}

export default RetrainWGANModal