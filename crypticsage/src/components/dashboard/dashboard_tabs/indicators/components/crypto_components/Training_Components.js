import React, { useEffect, useState, useCallback } from 'react'
import { BarChart, Bar, Cell, XAxis, Tooltip as RechartTooltip, ResponsiveContainer } from 'recharts';
import { useSelector, useDispatch } from 'react-redux'
import SelectedFunctionContainer from './SelectedFunctionContainer';

import {
    setSelectedFlagInTalibDescription
    , setSelectedFunctions
} from '../../modules/CryptoModuleSlice'

import {
    SaveCurrentModal
    , DeleteCurrentModal
    , RetrainWGANModal
} from './modals'

import {
    ExpandMoreIcon
    , InfoOutlinedIcon
    , CloseFullscreenIcon
    , OpenInFullIcon
    , AspectRatioIcon
} from '../../../../global/Icons'

import {
    ModelHistoryTable
    , getColorForValue
    , capitalizeFirstCharOfEachWord
    , cell_size
    , get_co_relation_styles
    , NoMaxWidthTooltip
    , PredictionMSETable
    , generateMSESteps
} from '../../modules/CryptoModuleUtils'

import {
    Box
    , useTheme
    , Paper
    , Autocomplete
    , TextField
    , Tooltip
    , Slider
    , Input
    , Typography
    , LinearProgress
    , Chip
    , Button
    , IconButton
    , Accordion
    , AccordionDetails
    , AccordionSummary
    , Grid
    , useMediaQuery
} from '@mui/material'

import { ErrorBoundary } from "react-error-boundary";

const logError = (error, info) => {
    // Do something with the error, e.g. log to an external API
    console.log('error', error)
};

const NEW_MODEL_DESCRIPTION = {
    "LSTM": {
        "model_type": "multi_input_single_output_step",
        "input": "multiple",
        "output": 'multiple',
        "chart_type": "line",
        "description": "The purpose of this model is to train on various input time series datasets, aiming to predict future values for look ahead values.",
        "step": true,
        "prediction_flag": true
    },
    "WGAN-GP": {
        "model_type": "multi_input_multi_output_step",
        "input": "multiple",
        "output": 'multiple',
        "chart_type": "candleStick",
        "description": "The purpose of this model is to train on various input time series datasets, aiming to predict future values for all input features, for look ahead values.",
        "step": true,
        "prediction_flag": false
    }
}

const LinearProgressWithLabel = (props) => {
    const color = 'red'
    return (
        <Box ref={props.cRef} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} id='custom-linear-progress'>
            <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress id='linear-progress' color='secondary' sx={{ backgroundColor: `${color}` }} variant="determinate" value={0} />
            </Box>
            <Box sx={{ minWidth: 140, textAlign: 'end' }}>
                <Typography variant="custom" sx={{ fontWeight: '600', fontSize: '0.7rem' }} color="text.secondary" id='batch-count'>{props.type} : </Typography>
            </Box>
        </Box>
    );
}

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p className="label">{`${label} : ${payload[0].value}`}</p>
            </div>
        );
    }

    return null;
};

export const MultiSelect = (props) => {
    const theme = useTheme()
    const { inputLabel, inputOptions, selectedInputOptions, handleInputOptions, fieldName, toolTipTitle, trainingStartedFlag, error = false } = props
    const [tooltipMessage, setTooltipMessage] = useState(toolTipTitle)
    useEffect(() => {
        if (inputLabel === 'Model type') {
            const model_data = NEW_MODEL_DESCRIPTION[selectedInputOptions]
            setTooltipMessage(model_data.description)
        }
    }, [inputLabel, selectedInputOptions])

    return (
        <Paper elevation={8} sx={{ width: '100%' }}>
            <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' gap={'40px'} pl={'4px'} pr={'4px'} pt={'7px'} pb={'7px'}>
                <Box sx={{ width: '100%' }}>
                    <Autocomplete
                        disabled={trainingStartedFlag}
                        size='small'
                        disableClearable={true}
                        disablePortal={false}
                        id={`select-input-${fieldName}`}
                        name='multiSelectValue'
                        options={inputOptions}
                        value={selectedInputOptions} // Set the selected value
                        onChange={(event, newValue) => handleInputOptions(newValue)} // Handle value change
                        sx={{ width: 'auto' }}
                        renderInput={(params) => <TextField {...params}
                            variant="standard"
                            error={error}
                            helperText={error ? 'Please select a checkpoint' : null}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: `${theme.palette.text.secondary}`,
                                    }
                                }
                            }}
                            label={`${inputLabel}`}
                            color="secondary"
                        />}
                    />
                </Box>
                <Tooltip title={tooltipMessage} placement='top' sx={{ cursor: 'pointer' }}>
                    <InfoOutlinedIcon className='small-icon' />
                </Tooltip>
            </Box>
        </Paper>
    )
}

export const CustomSlider = (props) => {
    const { sliderValue, name, handleModelParamChange, label, min, max, sliderMin, sliderMax, scaledLearningRate, disabled } = props
    const [slideValue, setSlideValue] = useState(min)

    useEffect(() => {
        setSlideValue(sliderValue)
    }, [sliderValue])

    const handleChange = (e) => {
        const { value } = e.target
        if (value < min || value > max || value === slideValue) {
            return
        } else {
            setSlideValue(value)
        }

    }
    const handleInputChange = (event) => {
        const { value: val } = event.target;
        const value = parseInt(val)
        if (value < min || value > max || value === slideValue) {
            return
        } else { // if value is not a number, set it to empty string errorstill persists when value is nan (Check)
            if (isNaN(value)) {
                handleModelParamChange(name, '')
            } else {
                setSlideValue(value)
                handleModelParamChange(name, value)
            }
        }
    };

    const handleSliderValueChange = (e, value) => {
        if (value < min) {
            value = min
        } else if (value > max) {
            value = max
        }
        handleModelParamChange(name, value)
    }

    return (
        <Paper elevation={6}>
            <Box p={'4px 8px'} display='flex' flexDirection='column' alignItems='start'>
                <Box display='flex' flexDirection='row' justifyContent='space-between' width='100%'>
                    <Typography id="training-size-slider" variant='custom'>{label} : {scaledLearningRate === undefined ? `${sliderValue}${label === 'Training size' ? '%' : ''}` : scaledLearningRate}</Typography>
                    {name === 'g_learningRate' || name === 'd_learningRate'
                        ?
                        <Typography variant='custom'>({(min / 100000).toExponential()} to {(max / 100000).toExponential()})</Typography>
                        :
                        <Typography variant='custom'>(Min: {min}, Max: {max})</Typography>
                    }
                </Box>

                <Box sx={{ width: "100%", display: 'flex', flexDirection: 'row', gap: '16px' }}>
                    <Slider
                        size='small'
                        color='secondary'
                        disabled={disabled}
                        value={slideValue}
                        name={name}
                        id={name}
                        valueLabelDisplay={'auto'}
                        scale={(val) => {
                            if (scaledLearningRate !== undefined) {
                                return val / 100;
                            }
                            return val;
                        }}
                        step={1}
                        min={sliderMin}
                        max={sliderMax}
                        onChange={(e) => handleChange(e)}
                        onChangeCommitted={(e, val) => handleSliderValueChange(e, val)}
                    />
                    {(label === 'Epochs' || label === 'Batch Size') &&
                        <Input
                            value={sliderValue}
                            size="small"
                            onChange={handleInputChange}
                            inputProps={{
                                step: 1,
                                min: sliderMin,
                                max: sliderMax,
                                type: 'number',
                                'aria-labelledby': 'input-slider',
                            }}
                        />
                    }
                </Box>
            </Box>
        </Paper>
    )
}

export const CustomInput = (props) => {
    const { tooltipMessage, name, handleModelParamChange, value, disabled } = props
    const total_count_for_ticker_in_db = useSelector(state => state.cryptoModule.total_count_db)
    const [error, setError] = useState('')

    const handleChange = (event) => {
        const { name, value } = event.target
        // console.log(name, value)
        if (value.length === 0) {
            handleModelParamChange(name, value)
            setError('Value cannot be empty')
            return
        } else {
            const int_val = parseInt(value)
            if (int_val === 0) {
                setError('Value cannot be zero')
                handleModelParamChange(name, value)
                return
            } else if (int_val > total_count_for_ticker_in_db) {
                setError('Value cannot be greater than total count')
                handleModelParamChange(name, value)
                return
            } else if (isNaN(int_val)) {
                setError('Invalid value entered')
                handleModelParamChange(name, value)
                return
            } else {
                setError('')
                handleModelParamChange(name, int_val)
            }
        }
    }
    return (
        <Paper elevation={8}>
            <Box gap={'40px'} pl={'4px'} pr={'4px'} pt={'7px'} pb={'7.1px'} display='flex' flexDirection='row' alignItems='center' justifyContent={'space-between'}>
                <TextField
                    error={error.length > 0}
                    helperText={error}
                    disabled={disabled}
                    size='small'
                    id={`input-${name}`}
                    name={name}
                    value={value}
                    onChange={handleChange}
                    variant="standard"
                    label={`Avail count : ${total_count_for_ticker_in_db}`}
                />
                <Tooltip title={tooltipMessage} placement='top' sx={{ cursor: 'pointer' }}>
                    <InfoOutlinedIcon className='small-icon' />
                </Tooltip>
            </Box>
        </Paper>
    )
}

export const BatchProgress = ({ batchLinearProgressRef }) => {
    return (
        <Box className='batch-end-progress-box' pt={1}>
            <Box id='progress-line' sx={{ width: '100%' }}>
                <LinearProgressWithLabel value={0} type={'Batch'} cRef={batchLinearProgressRef} />
            </Box>
            <Box className={`epoch_{} epoch`} sx={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                <Box className={`model-progress_{}`} width='100%' variant='h6'>
                    <div className='batch-end'>
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '500', textAlign: 'start' }} id='epoch'></div>
                            <div className='batch-end-text' id='loss'>Loss : 0.04927649209355232</div>
                            <div className='batch-end-text' id='mse'>MSE : 0.04927649209355232</div>
                            <div className='batch-end-text' id='mae'>RMSE : 0.04927649209355232</div>
                        </div>
                    </div>
                </Box>
            </Box>
        </Box>
    )
}

export const EvaluationProgress = ({ evalLinearProgressRef }) => {
    return (
        <Box className='evaluating-set-progress-box' pt={1}>
            <Box id='progress-line' sx={{ width: '100%' }}>
                <LinearProgressWithLabel value={0} type={'Evaluating'} cRef={evalLinearProgressRef} />
            </Box>
        </Box>
    )
}

export const WGANGPProgress = ({ wgangpProgressRef }) => {
    return (
        <Box className='batch-end-progress-box' pt={1}>
            <Box id='progress-line' sx={{ width: '100%' }}>
                <LinearProgressWithLabel value={0} type={'Batch'} cRef={wgangpProgressRef} />
            </Box>
            <Box className={`epoch_{} epoch`} sx={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                <Box className={`model-progress_{}`} width='100%' variant='h6'>
                    <div className='batch-end'>
                        <div style={{ display: 'flex', flexDirection: 'row' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '500', textAlign: 'start', width: "60px" }} id='epoch'>E : 1</div>
                            <div className='batch-end-text' id='model_type'>DISC</div>
                            <div className='batch-end-text' id='n_critic'>Critic Iter : 1</div>
                            <div className='batch-end-text' id='loss'>Loss : 0.04927649209355232</div>
                        </div>
                    </div>
                </Box>
            </Box>
        </Box>
    )
}

export const IndicatorSearch = ({
    searchedFunctions,
    transformedFunctionsList,
    handleSearchedFunctions,
    handleAddSelectedFunction,
}) => {
    const theme = useTheme()
    const lg = useMediaQuery(theme.breakpoints.down('lg'));
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    return (
        <Box>
            <Box className='search-indicator-box' display='flex' flexDirection='row' alignItems='center' >
                <Box className='function-selector' width='100%' display={'flex'} flexDirection={'row'} gap={1}>
                    {transformedFunctionsList.length > 0 &&
                        <Autocomplete
                            sx={{ backgroundColor: `${theme.palette.background.paperOne}`, width: lg ? sm ? '100%' : '400px' : '100%' }}
                            disableCloseOnSelect={false}
                            value={searchedFunctions}
                            size='small'
                            multiple
                            limitTags={2}
                            id="tags-filled"
                            options={transformedFunctionsList.sort((a, b) => -b.group.localeCompare(a.group))}
                            getOptionDisabled={(option) => transformedFunctionsList.filter((item) => item.label === option.label)[0].func_selected || searchedFunctions.includes(option.label)}
                            groupBy={(option) => option.group}
                            freeSolo
                            onChange={(event, newValue) => {
                                handleSearchedFunctions(newValue)
                            }}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip variant="outlined" size='small' label={option.label} {...getTagProps({ index })} />
                                ))
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="filled"
                                    label="Search for a function"
                                    placeholder="Search..."
                                    size='small'
                                />
                            )}
                        />
                    }
                    {searchedFunctions.length > 0 &&
                        <Box display='flex' alignItems='start'>
                            <Button size='small' color='secondary' variant='outlined' onClick={handleAddSelectedFunction.bind(null)}>Add Functions</Button>
                        </Box>
                    }
                </Box>
            </Box>
        </Box>
    )
}

export const IndicatorSearchExecute = ({
    selectedFunctions
    , fetchValues
}) => {
    const dispatch = useDispatch()
    // search and add function feature
    const theme = useTheme()
    const md = useMediaQuery(theme.breakpoints.down('lg'));
    const talibFunctions = useSelector(state => state.cryptoModule.talibDescription)
    const [searchedFunctions, setSearchedFunction] = useState([]);
    const [transformedFunctionsList, setTransformedFunctionList] = useState([]);

    useEffect(() => {
        if (talibFunctions.length > 0) {
            const modified = talibFunctions.reduce((result, item) => {
                return [
                    ...result,
                    ...item.functions.map((func) => ({
                        func_selected: func.function_selected_flag,
                        group: func.group,
                        label: `${func.name} : ${func.hint}`,
                    }))
                ];
            }, [])
            setTransformedFunctionList(modified)
        }
    }, [talibFunctions])

    const handleSearchedFunctions = (newValue) => {
        setSearchedFunction(newValue)
    }

    const handleAddSelectedFunction = () => {
        console.log('Add functions to calculate')
        const functionNamesToAdd = searchedFunctions.map((func) => {
            // eslint-disable-next-line no-unused-vars
            const [func_name, func_hint] = func.label.split(':')
            return func_name.trim()
        })
        // console.log(functionNamesToAdd)

        functionNamesToAdd.forEach((func_name) => {
            const foundFunction = talibFunctions
                .map(group => group.functions)
                .flat()
                .find(func => func.name === func_name);
            // console.log(foundFunction)

            if (foundFunction) {
                dispatch(setSelectedFlagInTalibDescription(
                    {
                        group: foundFunction.group,
                        name: foundFunction.name,
                        inputs: foundFunction.inputs,
                        optInputs: foundFunction.optInputs,
                    }
                ))

                dispatch(setSelectedFunctions(
                    {
                        hint: foundFunction.hint,
                        name: foundFunction.name,
                        group_name: foundFunction.group,
                        inputs: foundFunction.inputs,
                        optInputs: foundFunction.optInputs,
                        outputs: foundFunction.outputs,
                        function_selected_flag: true,
                        result: [],
                        splitPane: foundFunction.splitPane
                    }
                ))
            }
        })
        setSearchedFunction((prev) => { return [] })

    }

    return (
        <Box pt={2} mb={!md && 2} mt={!md && '32px'} className='indicator-search-execute'>
            <Box pr={2} pl={md && 2}>
                <ErrorBoundary onError={logError} fallback={<div>Something went wrong</div>}>
                    <IndicatorSearch
                        searchedFunctions={searchedFunctions}
                        transformedFunctionsList={transformedFunctionsList}
                        handleSearchedFunctions={handleSearchedFunctions}
                        handleAddSelectedFunction={handleAddSelectedFunction}
                    />
                </ErrorBoundary>
            </Box>
            <Box pr={2} pl={md && 2}>
                {selectedFunctions.length > 0 &&
                    <Box pl={1} pt={1}>
                        <Typography variant='h5' sx={{ textAlign: 'start' }}>Selected Indicators</Typography>
                    </Box>
                }
                {selectedFunctions.length !== 0 &&
                    <Box className='fixed-height-box' sx={{ maxHeight: !md ? '480px' : '', overflowY: !md ? 'auto' : '', width: '100%' }}>
                        <Grid container className='indicator-data-container'>
                            {selectedFunctions.map((funcRedux, index) => {
                                const { name } = funcRedux
                                return (
                                    <Grid key={`${name}${index}`} item xs={12} sm={6} md={4} lg={12} xl={12}>
                                        <SelectedFunctionContainer key={index} funcRedux={funcRedux} fetchValues={fetchValues} />
                                    </Grid>
                                )
                            })}
                        </Grid>
                    </Box>
                }
            </Box>
        </Box>
    )
}

export const RMSEBarChart = ({ data, selectedRMSEIndex, setSelectedRMSEIndex }) => {
    const theme = useTheme();
    const localBarChartHandler = useCallback((entry, index) => {
        setSelectedRMSEIndex(index)
    }, [setSelectedRMSEIndex])
    return (
        <ResponsiveContainer width='100%' height={220}>
            <BarChart
                data={data}
                margin={{
                    bottom: -2,
                    top: 8,
                }}
            >
                <XAxis dataKey="name" />
                <RechartTooltip content={<CustomTooltip />} />
                <Bar dataKey="rmse" onClick={localBarChartHandler} style={{ cursor: 'pointer' }}>
                    {
                        data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === selectedRMSEIndex ? `${theme.palette.primary.dark}` : `${theme.palette.secondary.main}`} />
                        ))
                    }
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}

export const TrainingLossTable = ({ epochResults }) => {
    const theme = useTheme()
    return (
        <Accordion defaultExpanded={false} sx={{ overflowX: 'auto', backgroundColor: `${theme.palette.background.paperOne}`, borderRadius: '5px' }}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1bh-content"
                id="panel1bh-header"
            >
                <Typography sx={{ color: 'text.secondary', width: '33%', flexShrink: 0, textAlign: 'start' }}>
                    Training Loss
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <ModelHistoryTable data={epochResults} />
            </AccordionDetails>
        </Accordion>
    )
}

export const PredictionOptions = ({
    colorCombinations,
    paletteIdRedux,
    savedToDb,
    handlePredictionChartPalette,
    modelProcessDurationRef,
    predictionChartType,
    setPredictionChartType,
    retrainHistSavePrompt,
    setRetrainHistSavePrompt
}) => {
    const model_name = useSelector(state => state.cryptoModule.modelData.model_name)
    const [modelName, setModelName] = useState(model_name)

    const handlePredictionsChartType = (param) => {
        const { type } = param;
        setPredictionChartType(type)
    }
    return (
        <Box display='flex' flexDirection='column'>
            <Box display='flex' flexDirection='column' justifyContent='space-between' alignItems='flex-start' className='prediction-chart-header'>
                <Box className='chart-action-box' pt={1}>
                    <Box display='flex' flexDirection='row' gap={'4px'} alignItems='center' className='model-chart-action-container'>
                        <TextField
                            size='small'
                            inputProps={{ style: { height: '10px', width: '150px' } }}
                            id="outlined-controlled"
                            label="Model name"
                            value={modelName}
                            onChange={(event) => {
                                setModelName(event.target.value);
                            }}
                        />
                        <Box className='model-chart-action-box'>
                            <SaveCurrentModal
                                modelName={modelName}
                                retrainHistSavePrompt={retrainHistSavePrompt}
                                setRetrainHistSavePrompt={setRetrainHistSavePrompt}
                            />

                            {!savedToDb &&
                                <DeleteCurrentModal modelProcessDurationRef={modelProcessDurationRef} />
                            }

                            <Tooltip title={'Standardized values'} placement='top' style={{ cursor: 'pointer', padding: '6px' }}>
                                <span style={{ padding: '0px' }}>
                                    <IconButton sx={{ padding: '6px' }} disabled={predictionChartType === "standardized" ? true : false} onClick={handlePredictionsChartType.bind(null, { type: 'standardized' })}>
                                        <CloseFullscreenIcon className='small-icon' />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title={'Original values'} placement='top' style={{ cursor: 'pointer', padding: '6px' }}>
                                <span style={{ padding: '0px' }}>
                                    <IconButton sx={{ padding: '6px' }} disabled={predictionChartType === "scaled" ? true : false} onClick={handlePredictionsChartType.bind(null, { type: 'scaled' })}>
                                        <OpenInFullIcon className='small-icon' />
                                    </IconButton>
                                </span>
                            </Tooltip>

                        </Box>
                    </Box>

                    <Box display='flex' flexDirection='row' gap='17px' paddingRight='6px' paddingLeft='6px'>
                        {colorCombinations.map((palette, index) => (
                            <Box key={index} sx={{
                                width: "10px",
                                height: "10px",
                                borderRadius: "50%",
                                backgroundColor: `${palette.actual}`,
                                cursor: 'pointer',
                                border: `${paletteIdRedux === index ? '1px solid #fff' : 'none'}`,
                            }}
                                onClick={handlePredictionChartPalette.bind(null, { id: index })}
                            />
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}

export const WgangpOptions = ({
    colorCombinations,
    paletteIdRedux,
    handlePredictionChartPalette,
    savedToDb,
    modelProcessDurationRef,
    setMetricsChartReload,
    retrainHistSavePrompt,
    setRetrainHistSavePrompt
}) => {
    const model_name = useSelector(state => state.cryptoModule.modelData.model_name)
    const [modelName, setModelName] = useState(model_name)
    return (
        <Box className='model-chart-action-container wgan'>
            <TextField
                size='small'
                inputProps={{ style: { height: '10px', width: '100%' } }}
                id="outlined-controlled"
                label="Model name"
                value={modelName}
                onChange={(event) => {
                    setModelName(event.target.value);
                }}
            />
            <Box className='wgan-options'>
                <Box display='flex' flexDirection='row' gap='17px' paddingRight='6px' paddingLeft='6px'>
                    {colorCombinations.map((palette, index) => (
                        <Box key={index} sx={{
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            backgroundColor: `${palette.actual}`,
                            cursor: 'pointer',
                            border: `${paletteIdRedux === index ? '1px solid #fff' : 'none'}`,
                        }}
                            onClick={handlePredictionChartPalette.bind(null, { id: index })}
                        />
                    ))}
                </Box>

                <SaveCurrentModal
                    modelName={modelName}
                    retrainHistSavePrompt={retrainHistSavePrompt}
                    setRetrainHistSavePrompt={setRetrainHistSavePrompt}
                    setMetricsChartReload={setMetricsChartReload}
                />
                {!savedToDb &&
                    <DeleteCurrentModal modelProcessDurationRef={modelProcessDurationRef} />
                }
            </Box>

        </Box>
    )
}

export const CorelationMatrix = ({ transformation_order, correlation_data_redux }) => {
    const theme = useTheme()
    const style = get_co_relation_styles(cell_size)
    return (
        <Box style={{ display: '-webkit-box' }}>
            <Box pb={1} display={'flex'}>
                <Box className='corelation-matrix-box'>
                    {/* Row for top labels */}
                    <Grid container>
                        <Grid item>
                            <Box style={{ width: cell_size, flex: 1, margin: '2px', height: cell_size }} /> {/* Empty box for corner */}
                        </Grid>
                        {transformation_order.slice(0, correlation_data_redux.length).map(order => (
                            <Grid item key={order.id}>
                                <Box style={{ ...style.cell, flex: 1, margin: '2px' }} title={`${order.name}`}>
                                    <Typography
                                        variant='custom'
                                        style={{ ...style.legend, backgroundColor: `${theme.palette.background.default}` }}>
                                        {capitalizeFirstCharOfEachWord(order.name, order.key)}
                                    </Typography>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Rows for matrix and side labels */}
                    {correlation_data_redux.map((row, rowIndex) => (
                        <Grid container key={rowIndex}>
                            {/* Side label */}
                            <Grid item>
                                <Box style={{ ...style.cell, flex: 1, margin: '2px' }} title={`${transformation_order[rowIndex].name}`}>
                                    <Typography variant='custom' style={{ ...style.legend, backgroundColor: `${theme.palette.background.default}` }}>{capitalizeFirstCharOfEachWord(transformation_order[rowIndex].name, transformation_order[rowIndex].key)}</Typography>
                                </Box>
                            </Grid>

                            {/* Data cells */}
                            {row.map((value, colIndex) => (
                                <Grid item key={colIndex}>
                                    <Box
                                        className='tooltip'
                                        key={colIndex}
                                        data-index={colIndex}
                                        style={{
                                            ...style.cell,
                                            backgroundColor: getColorForValue(value.r),
                                            flex: 1
                                        }}
                                    >
                                        <span className="tooltiptext"
                                            style={{
                                                transform: colIndex > (row.length / 2) - 1 ? 'translateX(-55%)' : 'translateX(55%)',
                                                top: rowIndex > (correlation_data_redux.length / 2) - 1 ? '-65px' : '55%',
                                            }}
                                        >
                                            {`R    : ${value.r.toFixed(3)} `}
                                            <br />
                                            {`P    : ${value.p}`}
                                            <br />
                                            {`COV  : ${value.cov}`}
                                            <br />
                                            {`STAT : ${value.stat}`}
                                        </span>
                                        {/* <Typography variant='custom' style={{ color: `${theme.palette.primary.newWhite}` }}>{value.r.toFixed(3)}</Typography> */}
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    ))}
                </Box>

                {/* Color scale */}
                <Box display="flex" flexDirection={'row'}>
                    <Box style={{ ...style.scale }}>
                        <span style={{ ...style.scaleLabel, color: `${theme.palette.primary.newWhite}` }}>-1</span>
                        <span style={{ ...style.scaleLabel, color: `${theme.palette.primary.newWhite}` }}>0</span>
                        <span style={{ ...style.scaleLabel, color: `${theme.palette.primary.newWhite}` }}>1</span>
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}

export const PredictionScoresTable = ({ sm, score, selectedTickerPeriod }) => {
    return (
        <Paper elevation={4} sx={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 4px' }}>
            <Box width='100%' className='test-set-prediction-result' display='flex' flexDirection='column' gap='5px'>
                <table width='100%' className="table-main" style={{ fontWeight: '600', fontSize: '11px' }}>
                    <thead className='table-group'>
                        <tr className='table-row'>
                            <th className='table-head'>Type</th>
                            <th className='table-head'>MSE</th>
                            <th className='table-head'>RMSE</th>
                        </tr>
                    </thead>
                    <tbody className='table-body'>
                        <tr className='table-row'>
                            <td className='table-data' style={{ textAlign: 'start' }}>
                                <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
                                    Test Set
                                    {!sm &&
                                        <NoMaxWidthTooltip
                                            title={(
                                                <PredictionMSETable data={score.scores.map((item, index) => {
                                                    const { value, unit } = generateMSESteps(selectedTickerPeriod);
                                                    return (
                                                        {
                                                            date: `+${value * (index + 1)}${unit}`,
                                                            rmse: item
                                                        }
                                                    )
                                                })} />
                                            )}
                                            placement='right'
                                            arrow
                                        >
                                            <AspectRatioIcon sx={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                        </NoMaxWidthTooltip>
                                    }
                                </Box>
                            </td>
                            <td className='table-data'>{score.over_all_score * score.over_all_score}</td>
                            <td className='table-data'>{score.over_all_score}</td>
                        </tr>
                    </tbody>
                </table>
                {sm &&
                    <PredictionMSETable data={score.scores.map((item, index) => {
                        const { value, unit } = generateMSESteps(selectedTickerPeriod);
                        return (
                            {
                                date: `+${value * (index + 1)}${unit}`,
                                rmse: item
                            }
                        )
                    })} />
                }
            </Box>
        </Paper>
    )
}

export const CountdownTimer = ({ endTime }) => {
    const calculateTimeLeft = () => {
        const difference = endTime - new Date().getTime();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60)
            };
        }

        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    });

    return (
        <Box display={'flex'} flexDirection={'row'} alignItems={'flex-start'}>
            <Typography variant='custom'  sx={{ textAlign: 'start', fontSize: '0.65rem', fontWeight: '600' }}>
                New Ticker in: {timeLeft.days}:{timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
            </Typography>
        </Box>
    );
};