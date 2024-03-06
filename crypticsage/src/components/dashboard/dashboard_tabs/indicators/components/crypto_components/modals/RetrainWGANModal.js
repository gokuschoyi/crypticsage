import React, { useEffect, useState } from 'react'
import { Box, Paper, FormControlLabel, Switch, Tooltip, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, DialogContentText, Button, Slide } from '@mui/material';
import LoopIcon from '@mui/icons-material/Loop';
import { useSelector } from 'react-redux'
import { getModelCheckPoints, retrain_wgan_Model } from '../../../../../../../api/adminController'
import MultiSelect from '../MultiSelect'
import CustomSlider from '../CustomSlider';
import DownloadIcon from '@mui/icons-material/Download';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { generateTalibFunctionsForExecution } from '../../../modules/CryptoModuleUtils'

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

const RetrainWGANModal = ({ retrain_options_payload: { model_id, selectedTickerPeriod, selectedTickerName, selectedFunctions, tDataReduxL } }) => {
    const token = useSelector(state => state.auth.accessToken);
    const modelParams = useSelector(state => state.cryptoModule.modelData.training_parameters)
    const [retrainModel, setRetrainModel] = useState(false)
    const [checkpoints, setCheckpoints] = useState([])
    const [checkpointError, setCheckpointError] = useState(false)

    let retrain_params = {
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
    }
    const [reTrainParams, setReTrainParams] = useState(retrain_params)

    useEffect(() => {
        // console.log('Changing retrain params ...')
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
    }, [modelParams.intermediateResultStep, modelParams.modelSaveStep, modelParams.epoch, modelParams.discriminator_iteration, modelParams.earlyStopping])

    const loadModelCheckpoints = async () => {
        getModelCheckPoints({ token, model_id }).then(res => {
            const checkpoints = res.data.checkpoints
            setCheckpoints(checkpoints)
            checkpointError && setCheckpointError(false)
            setReTrainParams((prev) => ({ ...prev, checkpoint: checkpoints[0] }))
        })
    }

    const handleClickOpen = () => {
        setRetrainModel(true);
    };

    const handleClose = () => {
        setRetrainModel(false);
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
            checkpoint: checkpoints[0] || '',
            scaled_d_learningRate: scaledValue(retrain_params.d_learning_rate, 0.001),
            scaled_g_learningRate: scaledValue(retrain_params.g_learning_rate, 0.001)
        })
    }

    const handleRetrainModel = () => {
        console.log('Retraining model ...')
        if (reTrainParams.checkpoint === '') {
            console.log('Checkpoint not selected')
            setCheckpointError(true)
        } else {
            const re_train_parameters = JSON.parse(JSON.stringify(reTrainParams))
            delete re_train_parameters.d_learning_rate
            delete re_train_parameters.g_learning_rate
            re_train_parameters['model_id'] = model_id
            const fTalibExecuteQuery = generateTalibFunctionsForExecution({ selectedFunctions, tDataReduxL, selectedTickerPeriod, selectedTickerName })

            const fullRetrainParams = {
                batchSize: modelParams.batchSize,
                d_learning_rate: reTrainParams.scaled_d_learningRate,
                do_validation: modelParams.doValidation,
                early_stopping_flag: reTrainParams.earlyStopping,
                epochs: reTrainParams.epochs,
                g_learning_rate: reTrainParams.scaled_g_learningRate,
                intermediate_result_step: parseInt(reTrainParams.intermediate_result_step),
                look_ahead: modelParams.lookAhead,
                model_save_checkpoint: parseInt(reTrainParams.model_save_checkpoint),
                model_type: modelParams.modelType === "WGAN-GP" ? "GAN" : modelParams.modelType,
                n_critic: reTrainParams.n_critic,
                slice_index: modelParams.to_train_count,
                time_step: modelParams.timeStep,
                to_predict: modelParams.multiSelectValue,
                training_size: modelParams.trainingDatasetSize,
                transformation_order: modelParams.transformation_order,
            }
            const final_payload = {
                additional_data: {
                    model_id: model_id,
                    checkpoint: reTrainParams.checkpoint
                },
                fTalibExecuteQuery,
                fullRetrainParams
            }

            console.log('Talib + Full retrain params', final_payload)

            retrain_wgan_Model({ token, payload: final_payload })
                .then(res => {
                    console.log('Retrain model response', res.data)
                })
                .catch(err => {
                    console.log('Error retraining model', err)
                })
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
                    <DialogContentText id="alert-dialog-slide-description"></DialogContentText>
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
                    <Button size='small' color='secondary' onClick={handleRetrainModel.bind(null, {})}>GO</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    )
}

export default RetrainWGANModal