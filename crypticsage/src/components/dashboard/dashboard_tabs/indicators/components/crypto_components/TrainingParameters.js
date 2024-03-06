import React, { useState } from 'react'
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
    useTheme
} from '@mui/material'
import MultiSelect from './MultiSelect'
import CustomSlider from './CustomSlider'
import ReorderList from './ReorderList'
import CustomInput from './CustomInput'
import ResetTrainedModelModal from './modals/ResetTrainedModelModal'
import { ArrowDropDownIcon, ArrowDropUpIcon } from '../../../../global/Icons'

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

const INTERMEDIATE_RESULT_STEP_OPTIONS = [
    "0",
    "2",
    "25",
    "50",
    "100",
    "200"
]

const TrainingParameters = ({
    model_data,
    modelParams,
    transformationOrder,
    noFuncSelected,
    trainingStartedFlag,
    setTransformationOrder,
    handleModelParamChange,
    handleStartModelTraining,
    handleClearModelData,
}) => {
    const theme = useTheme()
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    const [trainingParametersAccordianCollapse, setTrainingParametersAccordianCollapse] = useState(!sm)
    const handleParametersAccordianCollapse = () => {
        setTrainingParametersAccordianCollapse((prev) => !prev)
    }

    return (
        <Box>
            <Paper elevtion={4} className='model-parameter-expandd-collapse-box' sx={{ display: "flex", flexDirection: "row", justifyContent: 'space-between', alignItems: 'center', padding: '4px', boxShadow: `${trainingParametersAccordianCollapse && 'none'}` }}>
                <Typography variant='h5'>Edit training parameters</Typography>
                <IconButton sx={{ padding: '6px' }} onClick={handleParametersAccordianCollapse.bind(null, {})}>
                    {trainingParametersAccordianCollapse ? <ArrowDropUpIcon className='small-icon' /> : <ArrowDropDownIcon className='small-icon' />}
                </IconButton>
            </Paper>

            <Collapse in={trainingParametersAccordianCollapse}>
                <Box className='model-parameters-grid' pt={1}>
                    <Box display='flex' flexDirection='column' pb={2}>
                        <Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
                            <Typography variant='h5' textAlign='start'>Parameters</Typography>
                            <Box display='flex' alignItems='center' gap='10px'>
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
                                    {trainingStartedFlag ? 'Training' : 'TRAIN'}
                                </Button>
                                <ResetTrainedModelModal
                                    handleClearModelData={handleClearModelData}
                                    disabled={trainingStartedFlag}
                                    model_present={model_data.model_id === '' ? false : true} />
                            </Box>
                        </Box>
                        {noFuncSelected !== '' && <Typography variant='custom' textAlign='start' sx={{ color: 'red' }}>{noFuncSelected}</Typography>}
                    </Box>

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
                                        trainingStartedFlag={trainingStartedFlag}
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
                                        trainingStartedFlag={trainingStartedFlag}
                                    />

                                    {modelParams.modelType === 'WGAN-GP' &&
                                        <React.Fragment>
                                            <CustomInput
                                                tooltipMessage={'Input a number that represents the no of training inputs to take from the total available tickers.(Selects the last tickers)'}
                                                name={'to_train_count'}
                                                handleModelParamChange={handleModelParamChange}
                                                value={modelParams.to_train_count}
                                                disabled={trainingStartedFlag}
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
                                            control={<Switch disabled={trainingStartedFlag} size="small" color="secondary" />}
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
                                        disabled={trainingStartedFlag}
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
                                        disabled={trainingStartedFlag}
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
                                        disabled={trainingStartedFlag}
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
                                        disabled={trainingStartedFlag}
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
                </Box>
            </Collapse >
        </Box >
    )
}

export default TrainingParameters