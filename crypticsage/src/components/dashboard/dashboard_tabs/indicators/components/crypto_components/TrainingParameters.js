import React, { useState, useRef, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom';
import MultiSelect from './MultiSelect'
import CustomSlider from './CustomSlider'
import ReorderList from './ReorderList'
import CustomInput from './CustomInput'
import ResetTrainedModelModal from './modals/ResetTrainedModelModal'
import CorelationMatrix from './CorelationMatrix'
import { ResetOnModelChange } from './modals';
// import DownloadIcon from '@mui/icons-material/Download';
import {
    Box,
    Button,
    Collapse,
    FormControlLabel,
    IconButton,
    Paper,
    Switch,
    Typography,
    CircularProgress,
    Grid,
    useMediaQuery,
    useTheme,
    // Tooltip
} from '@mui/material'

import {
    resetModelData
    , setStartWebSocket
    , setModelId
    , setTrainingParameters
    , setModelType
    , setRetrainingFlag
    , setRetrainHistorySavedToDb
    , sliceEpochResults
    , setRetrainParameters
} from '../../modules/CryptoModuleSlice'

import {
    ArrowDropDownIcon
    , ArrowDropUpIcon
    , DeleteForeverIcon
} from '../../../../global/Icons'

import {
    Success
    , Warning_train
} from '../../../../global/CustomToasts'

import {
    generateTalibFunctionsForExecution
    , generateRandomModelName
} from '../../modules/CryptoModuleUtils'

import {
    getCorelationMatrix
    , startModelTraining
    , deleteModel
    // , getModelCheckPoints
    , retrain_wgan_Model
} from '../../../../../../api/adminController'

const INPUT_OPTIONS = [
    "",
    "high",
    "low",
    "open",
    "close",
]

const MODEL_OPTIONS = [
    "LSTM",
    "WGAN-GP"
]

const MODEL_OPTIONS_VALUE = {
    "LSTM": "multi_input_single_output_step",
    "WGAN-GP": "GAN"
}

const INTERMEDIATE_RESULT_STEP_OPTIONS = [
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

const TPAction = (props) => {
    const {
        loadingFromSaved
        , trainingStartedFlag
        , handleModelReTraining
        , handleStartModelTraining
        , handleClearModelData
        , model_id
        , noFuncSelected
    } = props
    return (
        <Box display='flex' flexDirection='column' pb={2}>
            <Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
                <Typography variant='h5' textAlign='start'>Parameters</Typography>
                <Box display='flex' alignItems='center' gap='10px'>
                    {loadingFromSaved ?
                        <Button
                            sx={{
                                height: '26px',
                            }}
                            variant='outlined'
                            size='small'
                            color='secondary'
                            disabled={trainingStartedFlag}
                            onClick={(e) => handleModelReTraining()}
                            endIcon={trainingStartedFlag && <CircularProgress style={{ width: '20px', height: '20px' }} color='secondary' />}
                        >
                            {trainingStartedFlag ? 'TRAINING' : 'RE-TRAIN'}
                        </Button>
                        :
                        <Button
                            sx={{
                                height: '26px',
                            }}
                            variant='outlined'
                            size='small'
                            color='secondary'
                            disabled={trainingStartedFlag}
                            onClick={(e) => handleStartModelTraining()}
                            endIcon={trainingStartedFlag && <CircularProgress style={{ width: '20px', height: '20px' }} color='secondary' />}
                        >
                            {trainingStartedFlag ? 'TRAINING' : 'TRAIN'}
                        </Button>
                    }
                    <ResetTrainedModelModal
                        handleClearModelData={handleClearModelData}
                        disabled={trainingStartedFlag}
                        model_present={model_id === '' ? false : true} />
                </Box>
            </Box>
            {noFuncSelected !== '' && <Typography variant='custom' textAlign='start' sx={{ color: 'red' }}>{noFuncSelected}</Typography>}
        </Box>
    )
}

const TrainingParameters = ({
    modelParams,
    setModelParams,
    transformationOrder,
    setTransformationOrder,
    trainingStartedFlag,
    setTrainingStartedFlag,
    modelProcessDurationRef,
    setRetrainHistSavePrompt,
    setMetricsChartReload
}) => {
    const theme = useTheme()
    const dispatch = useDispatch()
    const token = useSelector(state => state.auth.accessToken);
    const model_id = useSelector(state => state.cryptoModule.modelData.model_id)
    const model_saved_to_db = useSelector(state => state.cryptoModule.modelData.model_saved_to_db)
    const asset_type = window.location.href.split("/dashboard/indicators/")[1].split("/")[0]
    const selectedFunctions = useSelector(state => state.cryptoModule.selectedFunctions)
    const selectedTickerPeriod = useSelector(state => state.cryptoModule.selectedTickerPeriod)
    const selectedTickerName = useSelector(state => state.cryptoModule.selectedTickerName)
    const model_parameters = useSelector(state => state.cryptoModule.modelData.training_parameters)

    const loadingFromSaved = useSelector(state => state.cryptoModule.modelData.loading_from_saved_model)
    const savedModelName = useSelector(state => state.cryptoModule.modelData.model_name)
    const userModels = useSelector(state => state.cryptoModule.userModels)
    const retrainHistSaved = useSelector(state => state.cryptoModule.modelData.retrain_history_saved)
    const wganFinalPred = useSelector(state => state.cryptoModule.modelData.wgan_final_forecast.predictions)

    const [modelTypeOpen, setModelTypeOpen] = useState(false)
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    const tDataRedux = 500
    const { cryptotoken } = useParams();

    const [trainingParametersAccordianCollapse, setTrainingParametersAccordianCollapse] = useState(!sm)

    const handleParametersAccordianCollapse = () => {
        setTrainingParametersAccordianCollapse((prev) => !prev)
    }

    const handleModelParamChange = (name, value) => {
        if (name === 'modelType') {
            if (model_id !== '' && !model_saved_to_db) { // Training has been done and model is not saved
                setModelTypeOpen(true)
            } else if (model_id !== '' && model_saved_to_db) { // Training has been done and model is saved. 
                setModelParams(() => ({ ...model_parameters }))
                dispatch(resetModelData())
                dispatch(setModelType(value))
            } else {
                dispatch(setModelType(value))
                setModelParams((prev) => {
                    return {
                        ...prev,
                        [name]: value
                    }
                })
            }
        } else {
            if (name === 'd_learningRate' || name === 'g_learningRate') {
                const max = 0.001
                let scaled = scaledValue(value, max)
                setModelParams((prev) => ({ ...prev, [name === 'd_learningRate' ? 'scaled_d_learningRate' : "scaled_g_learningRate"]: scaled }))
            } else if (name === 'learningRate') {
                const minValue = 0.0001;
                const maxValue = 0.01;

                // Calculate the exponentially scaled value
                const normalizedValue = (value - 1) / (100 - 1);
                const scaledValue = minValue * Math.pow(maxValue / minValue, normalizedValue);
                setModelParams((prev) => {
                    return {
                        ...prev,
                        'scaledLearningRate': parseFloat(scaledValue.toFixed(4))
                    }
                })
            }

            setModelParams((prev) => {
                return {
                    ...prev,
                    [name]: value
                }
            })
        }
    }

    const [w_gan_error, setw_gan_error] = useState({})
    const transformation_order_ref = useRef(transformationOrder)
    const [corelation_matrix, setCorelation_matrix] = useState([])
    const [corelation_matrix_error, setCorelation_matrix_error] = useState('')

    const handleCalculateCorrelationMatrix = () => {
        // console.log('Calculate Correlation clicked...', transformationOrder)
        // console.log('Old state..', transformation_order_ref.current)
        if (transformationOrder.length === 5) {
            setCorelation_matrix_error('Select a function from below...')
            return
        }
        const checkOrder = (old, new_) => {
            if (old.length !== new_.length) return false;
            for (let i = 0; i < old.length; i++) {
                if (old[i].id !== new_[i].id) {
                    // console.log(old[i].id, new_[i].id)
                    return false;
                }
            }
            return true;
        }

        const payload = {
            transformation_order: transformationOrder,
            talibExecuteQueries: generateTalibFunctionsForExecution({ selectedFunctions, tDataReduxL: tDataRedux.lenght, selectedTickerPeriod, selectedTickerName })
        }

        const order = checkOrder(transformation_order_ref.current, transformationOrder)
        if (!order) {
            // console.log('Order changed or new func added.')
            setCorelation_matrix_error('')
            // console.log(order)
            getCorelationMatrix({ token, payload })
                .then((res) => {
                    // console.log(res.data)
                    setCorelation_matrix(res.data.corelation_matrix)
                })
                .catch((err) => {
                    console.log(err)
                })
        } else if (order && corelation_matrix.length === 0) {
            // console.log('Order is same but no data.')
            setCorelation_matrix_error('')
            getCorelationMatrix({ token, payload })
                .then((res) => {
                    // console.log(res.data)
                    setCorelation_matrix(res.data.corelation_matrix)
                })
                .catch((err) => {
                    console.log(err)
                })
        } else {
            // console.log('Order is not changed.')
            setCorelation_matrix_error('Order has not changed or same data.')
        }

        transformation_order_ref.current = transformationOrder
    }

    const [noFuncSelected, setNoFuncSelected] = useState('')
    // resetting corelation matrix error prompt
    useEffect(() => {
        if (selectedFunctions.length > 0 && noFuncSelected !== '' && (modelParams.to_train_count !== '' || modelParams.to_train_count !== 0)) {
            setNoFuncSelected('')
        }
        if (selectedFunctions.length > 0) {
            setCorelation_matrix_error('')
        }
    }, [selectedFunctions, noFuncSelected, modelParams.to_train_count])
    const [unsavedTrain, setUnsavedTrain] = useState(false)
    const handleStartModelTraining = () => {
        if (selectedFunctions.length === 0) {
            console.log('Select an indicator to plot')
            setNoFuncSelected('Select a function first to model')
        } else if (modelParams.to_train_count === '' || modelParams.to_train_count === 0) {
            setNoFuncSelected('Please select the number of data points to train')
        } else if (model_id !== '' && !model_saved_to_db && !unsavedTrain) {
            console.log('Training done for last model, but not saved')
            setUnsavedTrain(true)
        } else {
            // console.log('Sending model training query...', modelParams)
            setTrainingStartedFlag(true)
            setw_gan_error({})
            setUnsavedTrain(false)
            const fTalibExecuteQuery = generateTalibFunctionsForExecution({ selectedFunctions, tDataReduxL: tDataRedux.lenght, selectedTickerPeriod, selectedTickerName })

            let model_training_parameters = {
                model_type: MODEL_OPTIONS_VALUE[modelParams.modelType],
                to_predict: modelParams.multiSelectValue,
                training_size: modelParams.trainingDatasetSize,
                time_step: modelParams.timeStep,
                look_ahead: modelParams.lookAhead,
                epochs: modelParams.epoch,
                batchSize: modelParams.batchSize,
                learning_rate: modelParams.scaledLearningRate,
                hidden_layers: modelParams.hiddenLayer,
                transformation_order: transformationOrder,
                do_validation: modelParams.doValidation,
                early_stopping_flag: modelParams.earlyStopping
            }

            if (modelParams.modelType === 'WGAN-GP') {
                delete model_training_parameters['learning_rate']
                delete model_training_parameters['hidden_layers']
                model_training_parameters['n_critic'] = modelParams.discriminator_iteration
                model_training_parameters['slice_index'] = modelParams.to_train_count
                model_training_parameters['d_learning_rate'] = modelParams.scaled_d_learningRate
                model_training_parameters['g_learning_rate'] = modelParams.scaled_g_learningRate
                model_training_parameters['intermediate_result_step'] = parseInt(modelParams.intermediateResultStep)
                model_training_parameters['model_save_checkpoint'] = parseInt(modelParams.modelSaveStep)
            }

            console.log('Execute query + Model parameters', fTalibExecuteQuery, model_training_parameters)
            dispatch(resetModelData())
            dispatch(setStartWebSocket(true))
            startModelTraining({
                token,
                payload: {
                    fTalibExecuteQuery,
                    model_training_parameters
                }
            }).then((res) => {
                setCorelation_matrix([])
                const modelId = res.data.job_id
                const model_name = generateRandomModelName(cryptotoken, selectedTickerPeriod)
                Success(res.data.message)
                dispatch(setModelId({ model_id: modelId, model_name: model_name }))
                dispatch(setTrainingParameters({ model_params: modelParams, selected_functions: fTalibExecuteQuery, transformationOrder: transformationOrder }))
            }).catch((err) => {
                // console.log(err)
                console.log(err.response.data.message)
                setw_gan_error(err.response.data)
                Warning_train({
                    error_message: err.response.data.message,
                    test_possible: err.response.data.test_possible,
                    train_possible: err.response.data.train_possible
                })
                setTrainingStartedFlag(false)
                dispatch(setStartWebSocket(false))
            })
        }
    }

    const loadedCheckpoints = useSelector(state => state.cryptoModule.modelData.loaded_chekpoints)
    // console.log(loadedCheckpoints)
    const [checkpoints, setCheckpoints] = useState(loadedCheckpoints.checkpoints)
    const [selectedCheckpoint, setSelectedCheckpoint] = useState(loadedCheckpoints.selectedCheckpoint)
    const [checkpointError, setCheckpointError] = useState(false)

    // const loadModelCheckpoints = async () => {
    //     getModelCheckPoints({ token, model_id }).then(res => {
    //         const checkpoints = res.data.checkpoints
    //         setCheckpoints(checkpoints)
    //         const latestCheckpoint = checkpoints.reduce((largest, checkpoint) => {
    //             const num = parseInt(checkpoint.split('_')[1]);
    //             return num > largest ? num : largest;
    //         }, 0);
    //         checkpointError && setCheckpointError(false)
    //         setSelectedCheckpoint(`checkpoint_${latestCheckpoint}`)
    //     })
    // }

    useEffect(() => {
        if (loadedCheckpoints.checkpoints.length > 0) {
            setCheckpoints(loadedCheckpoints.checkpoints)
            setSelectedCheckpoint(loadedCheckpoints.selectedCheckpoint)
        }
    }, [loadedCheckpoints])


    const handleModelReTraining = () => { // Only if model is loaded from saved models
        if (selectedCheckpoint === '') {
            setCheckpointError(true)
            return
        } else if (!retrainHistSaved && wganFinalPred.length > 0) {
            console.log('cp')
            setRetrainHistSavePrompt({ flag: true, retrain_checkpoint: selectedCheckpoint, checkpoints, modelParams })
            return
        }

        // Checking if the selected checkpoint is the latestes one or not.
        // If not slice the epochResults for the metricsChart
        const last_saved_model_checkpoint_no = checkpoints.reduce((largest, checkpoint) => {
            const num = parseInt(checkpoint.split('_')[1]);
            return num > largest ? num : largest;
        }, 0);
        const selected_checkpoint_no = parseInt(selectedCheckpoint.split('_').pop())
        if (last_saved_model_checkpoint_no !== selected_checkpoint_no) {
            console.log('TP : Checkpoint other than last one selected', last_saved_model_checkpoint_no, selected_checkpoint_no)
            setMetricsChartReload(true)
            dispatch(sliceEpochResults({ selected_cp_no: selected_checkpoint_no, from_: 'training_params' }))
        } else {
            setMetricsChartReload(false)
            console.log('TP : Checkpoint selected is the latest one and Retraining model...')
        }

        // First training after loading the saved model. 
        // If model runs are not saved the flow goes to the SaveCurrentModal from above
        console.log('From TP component', model_id, retrainHistSaved, modelParams)
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
                checkpoint: selectedCheckpoint
            },
            fTalibExecuteQuery,
            fullRetrainParams
        }
        console.log(final_payload)

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

    // resetting entire training params and model data
    const handleClearModelData = () => {
        console.log(model_id, model_saved_to_db, modelParams.modelType)
        if (model_id !== '' && !model_saved_to_db) { // check if saved and then delete
            console.log('Model present and not saved, resetting Redux model and deleting from BE')
            const payload = {
                model_id: model_id,
                model_type: modelParams.modelType,
                asset_type: asset_type,
                ticker_name: selectedTickerName,
                period: selectedTickerPeriod
            }

            deleteModel({
                token, payload
            })
                .then((res) => {
                    Success(res.data.message)
                })
                .catch((err) => {
                    console.log(err.message)
                })
            modelProcessDurationRef.current = ''
        } else {
            console.log('No model present or model has been saved')
        }
        dispatch(resetModelData())
        dispatch(setStartWebSocket(false))
        dispatch(setModelType(modelParams.modelType))
        setModelParams(() => ({ ...model_parameters, modelType: modelParams.modelType, }))
        setModelTypeOpen(false)
    }



    return (
        <React.Fragment>
            <ResetOnModelChange
                open={modelTypeOpen}
                setOpen={setModelTypeOpen}
                handleRemove={handleClearModelData}
                type={'modelType_change'}
            />
            <ResetOnModelChange
                open={unsavedTrain}
                setOpen={setUnsavedTrain}
                handleRemove={handleStartModelTraining}
                type={'training_clicked'}
            />
            <Box alignItems='start' display='flex' pb={1} className='trainmodel-title'>
                <Typography variant='h4'>{loadingFromSaved ? 'Model Re-Training' : 'Model Training'}</Typography>
            </Box>

            <Box>
                <Paper elevtion={12} className='model-parameter-expandd-collapse-box' sx={{ display: "flex", flexDirection: "row", justifyContent: 'space-between', alignItems: 'center', boxShadow: `${trainingParametersAccordianCollapse && 'none'}` }}>
                    <Box className='tp-loader-when-collapsed'>
                        <Box className='training-param-name'>
                            <Typography variant='h5'>Edit training parameters {loadingFromSaved ? 'for' : ''}</Typography>
                            <Typography variant='h5' fontWeight={900} sx={{ textDecoration: 'underline' }}>{loadingFromSaved ? `${savedModelName}` : ''}</Typography>
                        </Box>
                        <Box display='flex' justifyContent='center' alignItems='center' gap='8px'>
                            {!trainingParametersAccordianCollapse && trainingStartedFlag &&
                                <React.Fragment>
                                    <Typography variant='custom' textAlign='start' sx={{ color: `${theme.palette.error.main}` }}>Training in progress</Typography>
                                    <CircularProgress style={{ width: '20px', height: '20px' }} color='secondary' />
                                </React.Fragment>
                            }
                            {/* <Button onClick={(e) => dispatch(setRetrainingFlag(false))}>clr</Button> */}
                        </Box>
                    </Box>
                    <IconButton sx={{ padding: '6px' }} onClick={handleParametersAccordianCollapse.bind(null, {})}>
                        {trainingParametersAccordianCollapse ? <ArrowDropUpIcon className='small-icon' /> : <ArrowDropDownIcon className='small-icon' />}
                    </IconButton>
                </Paper>

                <Collapse in={trainingParametersAccordianCollapse}>
                    <Box className='model-parameters-grid' pt={1}>
                        <TPAction
                            loadingFromSaved={loadingFromSaved}
                            trainingStartedFlag={trainingStartedFlag}
                            handleModelReTraining={handleModelReTraining}
                            handleStartModelTraining={handleStartModelTraining}
                            handleClearModelData={handleClearModelData}
                            model_id={model_id}
                            noFuncSelected={noFuncSelected}
                        />

                        <Box className='selected-function-value-displaybox' display='flex' flexDirection='column' alignItems='start' gap='8px'>
                            <Grid container spacing={1}>
                                <Grid item xs={12} sm={6} md={4} lg={4} xl={3}>
                                    <Box display='flex' flexDirection='column' gap='8px' width='100%'>
                                        <MultiSelect
                                            inputLabel={'Model type'}
                                            inputOptions={MODEL_OPTIONS}
                                            selectedInputOptions={modelParams.modelType}
                                            handleInputOptions={(newValue) => {
                                                handleModelParamChange('modelType', newValue)
                                            }}
                                            fieldName={'Model type'}
                                            toolTipTitle={'Select a model type'}
                                            trainingStartedFlag={loadingFromSaved ? true : trainingStartedFlag}
                                        />

                                        <MultiSelect
                                            inputLabel={'Prediction flag'}
                                            inputOptions={INPUT_OPTIONS}
                                            selectedInputOptions={modelParams.multiSelectValue}
                                            handleInputOptions={(newValue) => {
                                                handleModelParamChange('multiSelectValue', newValue)
                                            }}
                                            fieldName={'To predict'}
                                            toolTipTitle={'Select one of the flags to be used to predict'}
                                            trainingStartedFlag={loadingFromSaved ? true : trainingStartedFlag}
                                        />

                                        {modelParams.modelType === 'WGAN-GP' &&
                                            <React.Fragment>
                                                <CustomInput
                                                    tooltipMessage={'Input a number that represents the no of training inputs to take from the total available tickers.(Selects the last tickers)'}
                                                    name={'to_train_count'}
                                                    handleModelParamChange={handleModelParamChange}
                                                    value={modelParams.to_train_count}
                                                    disabled={loadingFromSaved ? true : trainingStartedFlag}
                                                />

                                                <MultiSelect
                                                    inputLabel={'Forecast step'}
                                                    inputOptions={INTERMEDIATE_RESULT_STEP_OPTIONS}
                                                    selectedInputOptions={modelParams.intermediateResultStep}
                                                    handleInputOptions={(newValue) => {
                                                        handleModelParamChange('intermediateResultStep', newValue)
                                                    }}
                                                    fieldName={'Intermediate Step'}
                                                    toolTipTitle={'Select a step at which point to send intermediate forecast. Select 0 for no intermediate forecast. If the step is greater than the total no of epochs, then the intermediate forecast will be sent at the end of the training as the final forecast.'}
                                                    trainingStartedFlag={trainingStartedFlag}
                                                />

                                                <MultiSelect
                                                    inputLabel={'Model save step'}
                                                    inputOptions={INTERMEDIATE_RESULT_STEP_OPTIONS}
                                                    selectedInputOptions={modelParams.modelSaveStep}
                                                    handleInputOptions={(newValue) => {
                                                        handleModelParamChange('modelSaveStep', newValue)
                                                    }}
                                                    fieldName={'Model Save Step'}
                                                    toolTipTitle={'Select a step at which point to save the generator model. Select 0 for no save. If the step is greater than the total no of epochs, then the model will be saved at the end of the training.'}
                                                    trainingStartedFlag={trainingStartedFlag}
                                                />
                                            </React.Fragment>
                                        }

                                        <Paper elevation={4} sx={{ padding: '4px' }}>
                                            <FormControlLabel
                                                value="start"
                                                sx={{ marginLeft: '0px', marginRight: '0px', width: '100%', justifyContent: 'space-between' }}
                                                control={<Switch disabled={loadingFromSaved ? true : trainingStartedFlag} size="small" color="secondary" />}
                                                label='Do validation on test set'
                                                labelPlacement="start"
                                                checked={modelParams.doValidation}
                                                onChange={() => handleModelParamChange('doValidation', !modelParams.doValidation)}
                                            />
                                        </Paper>

                                        <Paper elevation={4} sx={{ padding: '4px' }}>
                                            <FormControlLabel
                                                value="start"
                                                sx={{ marginLeft: '0px', marginRight: '0px', width: '100%', justifyContent: 'space-between' }}
                                                control={<Switch disabled={trainingStartedFlag} size="small" color="secondary" />}
                                                label='Perform Early Stopping'
                                                labelPlacement="start"
                                                checked={modelParams.earlyStopping}
                                                onChange={() => handleModelParamChange('earlyStopping', !modelParams.earlyStopping)}
                                            />
                                        </Paper>
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6} md={4} lg={4} xl={3}>
                                    <Box display='flex' flexDirection='column' gap='8px' width='100%'>
                                        <CustomSlider
                                            sliderValue={modelParams.trainingDatasetSize}
                                            name={'trainingDatasetSize'}
                                            handleModelParamChange={handleModelParamChange}
                                            label={'Training size'}
                                            min={50}
                                            max={95}
                                            sliderMin={0}
                                            sliderMax={100}
                                            disabled={loadingFromSaved ? true : trainingStartedFlag}
                                        />
                                        <CustomSlider
                                            sliderValue={modelParams.timeStep}
                                            name={'timeStep'}
                                            handleModelParamChange={handleModelParamChange}
                                            label={'Step Size'}
                                            min={2}
                                            max={100}
                                            sliderMin={2}
                                            sliderMax={100}
                                            disabled={loadingFromSaved ? true : trainingStartedFlag}
                                        />
                                        <CustomSlider
                                            sliderValue={modelParams.lookAhead}
                                            name={'lookAhead'}
                                            handleModelParamChange={handleModelParamChange}
                                            label={'Look Ahead'}
                                            min={1}
                                            max={30}
                                            sliderMin={1}
                                            sliderMax={30}
                                            disabled={loadingFromSaved ? true : trainingStartedFlag}
                                        />

                                        {modelParams.modelType === 'WGAN-GP' &&
                                            <CustomSlider
                                                sliderValue={modelParams.epoch}
                                                name={'epoch'}
                                                handleModelParamChange={handleModelParamChange}
                                                label={'Epochs'}
                                                min={1}
                                                max={2000}
                                                sliderMin={1}
                                                sliderMax={2000}
                                                disabled={trainingStartedFlag}
                                            />
                                        }

                                        {loadingFromSaved &&
                                            <Box sx={{ display: 'flex', flexDirection: 'row', gap: '8px', width: '100%' }}>
                                                <MultiSelect
                                                    inputLabel={'Load Checkpoint'}
                                                    inputOptions={checkpoints}
                                                    selectedInputOptions={selectedCheckpoint}
                                                    handleInputOptions={(newValue) => {
                                                        setSelectedCheckpoint(newValue)
                                                    }}
                                                    fieldName={'checkpoint'}
                                                    toolTipTitle={'Select the checkpoint for retraining. Selecting any other checkpoint other than the latest one will remove all saved model after the selected checkpoint.'}
                                                    trainingStartedFlag={trainingStartedFlag}
                                                    error={checkpointError}
                                                />
                                                {/* <Paper elevation={8} sx={{ width: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Tooltip title={checkpoints.length > 0 ? 'Checkpoints loaded' : 'Load the model saved checkpoints.'} placement='top' sx={{ cursor: 'pointer', padding: '6px' }}>
                                                        <span>
                                                            <IconButton disabled={checkpoints.length > 0} onClick={loadModelCheckpoints}>
                                                                <DownloadIcon sx={{ color: checkpoints.length > 0 ? 'green' : 'red' }} className='small-icon' />
                                                            </IconButton>
                                                        </span>
                                                    </Tooltip>
                                                </Paper> */}
                                            </Box>
                                        }
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6} md={4} lg={4} xl={3}>
                                    <Box display='flex' flexDirection='column' gap='8px' width='100%'>
                                        {modelParams.modelType === 'LSTM' &&
                                            <CustomSlider
                                                sliderValue={modelParams.epoch}
                                                name={'epoch'}
                                                handleModelParamChange={handleModelParamChange}
                                                label={'Epochs'}
                                                min={1}
                                                max={500}
                                                sliderMin={1}
                                                sliderMax={500}
                                                disabled={trainingStartedFlag}
                                            />
                                        }
                                        {/* {modelParams.modelType !== 'Multi Step Single Output' &&
                                        <CustomSlider sliderValue={modelParams.hiddenLayer} name={'hiddenLayer'} handleModelParamChange={handleModelParamChange} label={'Hidden Layers'} min={1} max={20} sliderMin={1} sliderMax={10} disabled={trainingStartedFlag} />
                                    } */}

                                        <CustomSlider
                                            sliderValue={modelParams.batchSize}
                                            name={'batchSize'}
                                            handleModelParamChange={handleModelParamChange}
                                            label={'Batch Size'}
                                            min={1}
                                            max={modelParams.modelType === 'WGAN-GP' ? 1000 : 100}
                                            sliderMin={1}
                                            sliderMax={modelParams.modelType === 'WGAN-GP' ? 1000 : 100}
                                            disabled={loadingFromSaved ? true : trainingStartedFlag}
                                        />

                                        {modelParams.modelType === 'LSTM' &&
                                            <CustomSlider
                                                sliderValue={modelParams.learningRate}
                                                name={'learningRate'}
                                                handleModelParamChange={handleModelParamChange}
                                                label={`L Rate`}
                                                min={1}
                                                max={100}
                                                sliderMin={1}
                                                sliderMax={100}
                                                scaledLearningRate={modelParams.scaledLearningRate}
                                                disabled={trainingStartedFlag}
                                            />
                                        }

                                        {modelParams.modelType === 'WGAN-GP' &&
                                            <React.Fragment>
                                                <CustomSlider
                                                    sliderValue={modelParams.discriminator_iteration}
                                                    name={'discriminator_iteration'}
                                                    handleModelParamChange={handleModelParamChange}
                                                    label={'Critic Iterator'}
                                                    min={1}
                                                    max={5}
                                                    sliderMin={1}
                                                    sliderMax={5}
                                                    disabled={trainingStartedFlag}
                                                />
                                                <CustomSlider
                                                    sliderValue={modelParams.d_learningRate}
                                                    name={'d_learningRate'}
                                                    handleModelParamChange={handleModelParamChange}
                                                    label={`L Rate (Disc)`}
                                                    min={10}
                                                    max={100}
                                                    sliderMin={10}
                                                    sliderMax={100}
                                                    scaledLearningRate={modelParams.scaled_d_learningRate}
                                                    disabled={trainingStartedFlag}
                                                />

                                                <CustomSlider
                                                    sliderValue={modelParams.g_learningRate}
                                                    name={'g_learningRate'}
                                                    handleModelParamChange={handleModelParamChange}
                                                    label={`L Rate (Gen)`}
                                                    min={10}
                                                    max={100}
                                                    sliderMin={10}
                                                    sliderMax={100}
                                                    scaledLearningRate={modelParams.scaled_g_learningRate}
                                                    disabled={trainingStartedFlag}
                                                />

                                            </React.Fragment>
                                        }
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={6} md={4} lg={4} xl={3}>
                                    <ReorderList
                                        orderList={transformationOrder}
                                        setOrderList={setTransformationOrder}
                                        disabled={trainingStartedFlag}
                                    />
                                </Grid>
                            </Grid>
                        </Box>

                        {sm &&
                            <Box pt={'8px'}>
                                <TPAction
                                    loadingFromSaved={loadingFromSaved}
                                    trainingStartedFlag={trainingStartedFlag}
                                    handleModelReTraining={handleModelReTraining}
                                    handleStartModelTraining={handleStartModelTraining}
                                    handleClearModelData={handleClearModelData}
                                    model_id={model_id}
                                    noFuncSelected={noFuncSelected}
                                />
                            </Box>
                        }
                    </Box>
                </Collapse >

                {Object.keys(w_gan_error).length > 0 &&
                    <Box display={'flex'} flexDirection={'column'} alignItems={'start'} pt={2} pl={1} color={'red'}>
                        <Typography variant='h6' fontWeight='600'>{w_gan_error.message}</Typography>
                        <ul className='wgan-gp-ul' style={{ textAlign: 'left' }}>
                            {!w_gan_error.train_possible.status && <li style={{ listStyleType: 'circle', fontSize: '12px', fontWeight: '500' }}>{w_gan_error.train_possible.message}</li>}
                            {!w_gan_error.test_possible.status && <li style={{ listStyleType: 'circle', fontSize: '12px', fontWeight: '500' }}>{w_gan_error.test_possible.message}</li>}
                        </ul>
                    </Box>
                }

                <Box pt={2}>
                    <Box display='flex' flexDirection='column' justifyContent='space-between'>
                        <Box display='flex' gap='8px' alignItems='center' width='320px' justifyContent='space-between'>
                            <Typography variant='h5' textAlign='start'>Corelation Matrix</Typography>
                            <Box display='flex' gap='8px' alignItems='center'>
                                <Button
                                    sx={{
                                        height: '26px',
                                    }}
                                    variant='outlined'
                                    size='small'
                                    color='secondary'
                                    disabled={trainingStartedFlag}
                                    onClick={(e) => handleCalculateCorrelationMatrix()}
                                >
                                    MATRIX
                                </Button>
                                <IconButton disabled={trainingStartedFlag} onClick={(e) => setCorelation_matrix([])}>
                                    <DeleteForeverIcon className='small-icon' />
                                </IconButton>
                            </Box>
                        </Box>
                        <Box display='flex' gap='8px' alignItems='center'>
                            {corelation_matrix_error !== '' && <Typography variant='custom' textAlign='start' sx={{ color: 'red' }}>{corelation_matrix_error}</Typography>}
                        </Box>
                    </Box>
                    <Box pt={1}>
                        {(corelation_matrix && corelation_matrix.length > 0) &&
                            <CorelationMatrix
                                transformation_order={transformation_order_ref.current}
                                correlation_data_redux={corelation_matrix}
                            />
                        }
                    </Box>
                </Box>
            </Box >
        </React.Fragment>
    )
}

export default TrainingParameters