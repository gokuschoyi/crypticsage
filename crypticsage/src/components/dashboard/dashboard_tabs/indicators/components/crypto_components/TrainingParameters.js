import React from 'react'
import {
    Box,
    Button,
    Collapse,
    FormControlLabel,
    IconButton,
    Paper,
    Switch,
    Typography,
    CircularProgress
} from '@mui/material'
import MultiSelect from './MultiSelect'
import CustomSlider from './CustomSlider'
import ReorderList from './ReorderList'
import ResetTrainedModelModal from './modals/ResetTrainedModelModal'
import { ArrowDropDownIcon, ArrowDropUpIcon } from '../../../../global/Icons'

const INPUT_OPTIONS = [
    "",
    "high",
    "low",
    "open",
    "close",
]

const TrainingParameters = ({
    model_data,
    modelParams,
    transformationOrder,
    trainingParametersAccordianCollapse,
    noFuncSelected,
    trainingStartedFlag,
    setTransformationOrder,
    handleModelParamChange,
    handleMultiselectOptions,
    handleDoValidation,
    handleEarlyStopping,
    handleStartModelTraining,
    handleClearModelData,
    handleParametersAccordianCollapse,
}) => {
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
                                    {trainingStartedFlag ? 'Training' : 'Train'}
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
                        <Box display='flex' flexDirection='column' gap='8px' width='100%'>
                            <Paper elevation={4} sx={{ padding: '4px' }}>
                                <FormControlLabel
                                    value="start"
                                    sx={{ marginLeft: '0px', marginRight: '0px', width: '100%', justifyContent: 'space-between' }}
                                    control={<Switch disabled={trainingStartedFlag} size="small" color="secondary" />}
                                    label='Do validation on test set'
                                    labelPlacement="start"
                                    checked={modelParams.doValidation}
                                    onChange={() => handleDoValidation()}
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
                                    onChange={() => handleEarlyStopping()}
                                />
                            </Paper>
                            {/* <MultiSelect
                                                inputLabel={'Model type'}
                                                inputOptions={MODEL_OPTIONS}
                                                selectedInputOptions={modelParams.modelType}
                                                handleInputOptions={handleModelTypeOptions}
                                                fieldName={'Model type'}
                                                toolTipTitle={'Select a model type'}
                                                trainingStartedFlag={trainingStartedFlag}
                                            /> */}
                            {modelParams.modelType !== 'Single Step Multiple Output' &&
                                <MultiSelect
                                    inputLabel={'Prediction flag'}
                                    inputOptions={INPUT_OPTIONS}
                                    selectedInputOptions={modelParams.multiSelectValue}
                                    handleInputOptions={handleMultiselectOptions}
                                    fieldName={'To predict'}
                                    toolTipTitle={'Select one of the flags to be used to predict'}
                                    trainingStartedFlag={trainingStartedFlag}
                                />
                            }
                            <CustomSlider sliderValue={modelParams.trainingDatasetSize} name={'trainingDatasetSize'} handleModelParamChange={handleModelParamChange} label={'Training size'} min={50} max={95} sliderMin={0} sliderMax={100} disabled={trainingStartedFlag} />
                            <CustomSlider sliderValue={modelParams.timeStep} name={'timeStep'} handleModelParamChange={handleModelParamChange} label={'Step Size'} min={2} max={100} sliderMin={2} sliderMax={100} disabled={trainingStartedFlag} />
                            {(modelParams.modelType === 'Multi Step Single Output' || modelParams.modelType === 'Multi Step Multiple Output') &&
                                <CustomSlider sliderValue={modelParams.lookAhead} name={'lookAhead'} handleModelParamChange={handleModelParamChange} label={'Look Ahead'} min={1} max={30} sliderMin={1} sliderMax={30} disabled={trainingStartedFlag} />
                            }
                            <CustomSlider sliderValue={modelParams.epoch} name={'epoch'} handleModelParamChange={handleModelParamChange} label={'Epochs'} min={1} max={500} sliderMin={1} sliderMax={500} disabled={trainingStartedFlag} />
                            {modelParams.modelType !== 'Multi Step Single Output' &&
                                <CustomSlider sliderValue={modelParams.hiddenLayer} name={'hiddenLayer'} handleModelParamChange={handleModelParamChange} label={'Hidden Layers'} min={1} max={20} sliderMin={1} sliderMax={10} disabled={trainingStartedFlag} />
                            }
                            <CustomSlider sliderValue={modelParams.batchSize} name={'batchSize'} handleModelParamChange={handleModelParamChange} label={'Batch Size'} min={1} max={100} sliderMin={1} sliderMax={100} disabled={trainingStartedFlag} />
                            <CustomSlider sliderValue={modelParams.learningRate} name={'learningRate'} handleModelParamChange={handleModelParamChange} label={'L Rate'} min={1} max={100} sliderMin={1} sliderMax={100} scaledLearningRate={modelParams.scaledLearningRate} disabled={trainingStartedFlag} />
                        </Box>
                        <ReorderList orderList={transformationOrder} setOrderList={setTransformationOrder} disabled={trainingStartedFlag} />
                    </Box>
                </Box>
            </Collapse>
        </Box>
    )
}

export default TrainingParameters