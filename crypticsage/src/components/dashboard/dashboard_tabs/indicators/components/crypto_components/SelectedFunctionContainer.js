import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, AccordionActions, IconButton, Tooltip, TextField, Autocomplete, useTheme, CircularProgress } from '@mui/material'
import { executeTalibFunction } from '../../../../../../api/adminController'
import {
    setSelectedFunctions
    , setSelectedFunctionInputValues
    , setSelectedFunctionOptionalInputValues
    , toggleShowHideChartFlag
    , removeFromSelectedFunction
    , setFunctionInputErrorFlagAndMessage
    , setTalibResult
} from '../../modules/CryptoModuleSlice'
import { Dot } from '../../modules/CryptoModuleUtils'

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

const MAX_FUNCTION_DUPLICATES = 2

const MultiSelect = (props) => {
    const theme = useTheme()
    const { inputLabel, selectedInputOptions, handleInputOptions, fieldName, errorFlag, helperText, id } = props
    const inputOptions = [
        "",
        "high",
        "low",
        "open",
        "close",
    ]
    return (
        <Box className='selected-function-multiselect' display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' gap={'55px'} width='100%'>
            <Box sx={{ width: '100%' }}>
                <Autocomplete
                    fullWidth
                    size='small'
                    disableClearable
                    disablePortal={false}
                    id={`select-input-${fieldName}`}
                    options={inputOptions}
                    value={selectedInputOptions} // Set the selected value
                    onChange={(event, newValue) => handleInputOptions(fieldName, newValue, id)} // Handle value change
                    sx={{ width: 'auto' }}
                    renderInput={(params) => <TextField {...params}
                        variant="outlined"
                        error={errorFlag}
                        helperText={helperText}
                        sx={{
                            '& .MuiInputBase-input': {
                                height: '10px'
                            },
                            '& .MuiInputLabel-root': {
                                top: '-5px'
                            },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: `${theme.palette.text.secondary}`,
                                }
                            }
                        }}
                        label={`Select a ${inputLabel}`}
                        color="secondary"
                    />}
                />
            </Box>
            <Tooltip title={'Select one of the flags to be used for calculation'} placement='top' sx={{ cursor: 'pointer' }}>
                <InfoOutlinedIcon className='small-icon' />
            </Tooltip>
        </Box>
    )
}

const SelectedFunctionContainer = (props) => {
    const theme = useTheme()
    const { funcRedux, fetchValues } = props
    const { hint, name, group_name, functions, outputs } = funcRedux
    // console.log('funcRes ', functions)
    const dispatch = useDispatch()
    const token = useSelector(state => state.auth.accessToken);
    const histDataLength = useSelector(state => state.cryptoModule.cryptoDataInDb).length
    const defaultTalibFunctionsCopy = useSelector(state => state.cryptoModule.talibDescriptionCopy)

    const handleAddIndicator = (param) => {
        // console.log(param.func_name)
        const func_name = param.func_name
        let defaultGroup = defaultTalibFunctionsCopy.find((group) => group.group_name === group_name)
        let defaultFunction = defaultGroup.functions.find((func) => func.name === func_name)
        // console.log(defaultFunction)
        const { name, inputs, optInputs } = defaultFunction
        dispatch(setSelectedFunctions(
            {
                name: name,
                inputs: inputs,
                optInputs: optInputs,
                result: []
            }
        ))
    }

    const handleDeleteQuery = (param) => {
        // console.log(param.id)
        const id = param.id
        dispatch(removeFromSelectedFunction({ id: id, name: name, group_name: group_name }))
    }

    const handleToggleShowHideChart = (param) => {
        const { id, name } = param
        // console.log(name, id)
        dispatch(toggleShowHideChartFlag({ id: id, name: name }))
    }

    const [talibExecuting, setTalibExecuting] = React.useState(false)

    // handle generate query for each function
    const handleGenerateQuery = (params) => {
        const { id } = params
        // console.log(id)
        const reduxFunctionsCopy = JSON.parse(JSON.stringify(functions))
        const functionTOGenerateQueryFor = reduxFunctionsCopy.find((func) => func.id === id)
        const { inputs, optInputs, name } = functionTOGenerateQueryFor
        let selectedInputOptions = [...inputs]
        // console.log(functionTOGenerateQueryFor)

        let talibExecuteQuery = {}
        let tOITypes = {}
        const transformedOptionalInputs = optInputs.reduce((result, item) => {
            result[item.name] = item.defaultValue
            tOITypes[item.name] = item.type;
            return result;
        }, {})

        let outputkeys = {}
        let outputsCopy = [...outputs]
        outputkeys = outputsCopy.reduce((result, output) => {
            result[output.name] = output.name;
            return result;
        }, {});

        let converted = {}
        let checked = selectedInputOptions.map((input) => {
            if (input.flags) {
                Object.keys(input.flags).forEach((key) => {
                    converted[input.flags[key]] = input.flags[key];
                })
                return input
            } else {
                if (input.value === '') {
                    return {
                        ...input,
                        errorFlag: true,
                        helperText: 'Please select a valid input',
                    };
                } else {
                    converted[input.name] = input.value;
                    return {
                        ...input,
                        errorFlag: false,
                        helperText: '',
                    };
                }
            }
        })

        // console.log(checked)
        const filtered = checked.filter((item) => !item.flags);
        let hasEmptyValues
        if (filtered.length > 0) {
            hasEmptyValues = filtered.every((item) => {
                if (!item.flags) {
                    // If there are no flags
                    return item.value === '';
                }
                return false; // If there are flags, we consider it as not having empty values
            });
        } else {
            hasEmptyValues = false
        }
        // console.log(hasEmptyValues)

        if (hasEmptyValues) {
            dispatch(setFunctionInputErrorFlagAndMessage({ name: name, id: id, inputs: checked }))
        } else {
            delete fetchValues['items_per_page']
            delete fetchValues['page_no']

            talibExecuteQuery['name'] = name;
            talibExecuteQuery['startIdx'] = 0;
            talibExecuteQuery['endIdx'] = histDataLength - 1;
            talibExecuteQuery = { ...talibExecuteQuery, ...converted, ...transformedOptionalInputs }

            let payload = {
                func_query: talibExecuteQuery,
                func_param_input_keys: converted,
                func_param_optional_input_keys: tOITypes,
                func_param_output_keys: outputkeys,
                db_query: {
                    ...fetchValues,
                    fetch_count: histDataLength
                }
            }

            // console.log(payload)
            setTalibExecuting(true)
            executeTalibFunction({ token, payload })
                .then((res) => {
                    // console.log(res.data)
                    dispatch(setTalibResult({ id: id, name: name, optInputs: optInputs, result: res.data.result }))
                    setTalibExecuting(false)
                })
                .catch(err => {
                    setTalibExecuting(false)
                    console.log(err)
                })
        }
    }

    // handle input options
    const handleInputOptions = (fieldName, newValue, id) => {
        dispatch(setSelectedFunctionInputValues({ fieldName, value: newValue, id, name }))
    }

    // handle optional input change
    const handleOptionalInputChange = (e) => {
        const { name: nm, value, id } = e.target
        // console.log(nm, value, id)
        dispatch(setSelectedFunctionOptionalInputValues({ fieldName: nm, value, id, name: name }))
    }

    // expand function accordian
    const [expanded, setExpanded] = React.useState(false);
    const handleChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    return (
        <Box width='100%' p={'5px'} className='indicator-function-box'>
            <Accordion
                sx={{
                    '& .MuiAccordionSummary-root.MuiButtonBase-root': {
                        height: '30px',
                        minHeight: '0px',
                        padding: '0px 8px',
                        transition: '0.3s ease-in-out'
                    },
                    '& .MuiAccordionSummary-content': {
                        margin: '0px'
                    },
                    '& .MuiAccordionSummary-content.Mui-expanded': {
                        minHeight: '34px',
                        margin: '4px 0px 4px 0px'
                    },
                    '& .MuiAccordionSummary-root.MuiButtonBase-root.Mui-expanded': {
                        height: '44px',
                        transition: '0.3s ease-in-out'
                    }
                }}
                TransitionProps={{ mountOnEnter: true }} className='function-accordian' expanded={expanded === `${name}`} onChange={handleChange(`${name}`)}>
                <AccordionSummary
                    className='accordian-summary-selected-functions'
                    expandIcon={<ExpandMoreIcon sx={{ color: `${theme.palette.primary.dark}` }} />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: '100%',
                        justifyContent: 'space-between',
                    }}
                >
                    <Box className='function-name' display='flex' flexDirection='row' gap='4px' alignItems='center' >
                        <Dot color={functions.every(func => func.outputAvailable) ? 'green' : 'red'} />
                        <Typography
                            variant='custom'
                            // fontWeight={400}
                            className='talib-func-hint'
                            sx={{
                                // Allow the text to overflow
                                textAlign: 'start',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis', // Add ellipsis (...) to indicate overflow
                                whiteSpace: expanded ? '' : 'nowrap', // Prevent text from wrapping
                                flex: 1, // Allow the text to take up available space
                                minWidth: 0, // Allow text to shrink beyond its minimum width
                                transition: 'all 0.3s ease-in-out',
                            }}
                        >{hint}</Typography>
                    </Box>
                </AccordionSummary>

                <AccordionActions sx={{ padding: '0px 6px 0px 12px' }}>
                    <Box display='flex' flexDirection='row' gap={1} alignItems='center' width='100%' pl={1} pr={1}>
                        <Typography variant='custom' fontWeight='bold' sx={{ textAlign: 'start' }}>{name}</Typography>
                        <IconButton sx={{ padding: '2px' }} disabled={functions[0].optInputs.length === 0 || functions.length === MAX_FUNCTION_DUPLICATES} size='small' aria-label="add query" color="secondary" onClick={handleAddIndicator.bind(null, { func_name: name })}>
                            <Tooltip title="Add query" placement='right'>
                                <AddIcon className='small-icon' />
                            </Tooltip>
                        </IconButton>
                    </Box>
                </AccordionActions>

                <AccordionDetails>
                    {functions.length > 0 && functions.map((func, index) => {
                        const { id, name, inputs, optInputs, outputAvailable, show_chart_flag } = func
                        return (
                            <Box key={index} mb={1} borderRadius={2} pl={1} pr={1} pb={1} sx={{ backgroundColor: `${theme.palette.background.paper}` }}>

                                <Box display='flex' justifyContent='space-between' alignItems='center' pl={1} flexDirection='row' pt={'5px'}>
                                    <Box>
                                        <Typography variant='custom'>{index + 1}</Typography>
                                    </Box>
                                    <Box className='function-action-box' display='flex' flexDirection='row' gap={'4px'}>

                                        {outputAvailable &&
                                            <IconButton sx={{ padding: '2px' }} size='small' aria-label="Hide shart" color="secondary" onClick={handleToggleShowHideChart.bind(null, { id: id, name: name })}>
                                                {show_chart_flag ?
                                                    <VisibilityIcon className='small-icon' />
                                                    :
                                                    <VisibilityOffIcon className='small-icon' />
                                                }
                                            </IconButton>
                                        }

                                        <IconButton sx={{ padding: '2px' }} size='small' aria-label="execute query" color="secondary" onClick={handleGenerateQuery.bind(null, { id: id })}>
                                            {
                                                outputAvailable
                                                    ? (talibExecuting ? <CircularProgress color="error" sx={{ margin: '2.5px' }} size={15} /> : <RestartAltIcon className='small-icon' />)
                                                    : (talibExecuting ? <CircularProgress color="error" sx={{ margin: '2.5px' }} size={15} /> : <PlayArrowIcon className='small-icon' />)
                                            }
                                        </IconButton>

                                        <IconButton sx={{ padding: '2px' }} size='small' aria-label="delete query" color="secondary" onClick={handleDeleteQuery.bind(null, { id: id })}>
                                            <Tooltip title="Delete query" placement='top'>
                                                <DeleteOutlineIcon className='small-icon' />
                                            </Tooltip>
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Box className='indicator-inputs-selected' sx={{ textAlign: 'start' }}>
                                    <Typography variant='h6' textAlign='start' fontWeight='500' sx={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>INPUTS</Typography>
                                    {inputs.length > 0 && inputs.map((input, index) => {
                                        const { value, errorFlag, helperText } = input
                                        return (
                                            <Box key={index} display='flex' flexDirection='column' pb={'5px'} alignItems='flex-start'>
                                                {input.flags ?
                                                    <Box sx={{ width: '100%' }} display='flex' flexDirection='column' className='text'>
                                                        <Typography variant='custom' style={{ paddingLeft: '16px', textAlign: 'start' }}><span style={{ fontWeight: '600' }}>Name : </span>{input.name}</Typography>
                                                        {/* <Typography><span style={{ fontWeight: '600' }}>Type : </span>{input.type}</Typography> */}
                                                        <Typography pl={2} variant='custom' textAlign='start'><span style={{ fontWeight: '600' }}>Flags : </span></Typography>
                                                        <Box pl={3} display='flex' flexDirection='column'>
                                                            {Object.keys(input.flags).map((key, index) => {
                                                                return (
                                                                    <Typography variant='custom' key={index} style={{ textAlign: 'start' }}>{key} : {input.flags[key]}</Typography>
                                                                )
                                                            })}
                                                        </Box>
                                                    </Box>
                                                    :
                                                    <Box pt={'14px'} width='100%'>
                                                        <MultiSelect
                                                            inputLabel={input.name === 'inReal' ? 'flag' : input.name}
                                                            selectedInputOptions={value}
                                                            handleInputOptions={handleInputOptions}
                                                            fieldName={input.name}
                                                            errorFlag={errorFlag}
                                                            helperText={helperText}
                                                            id={id}
                                                        />
                                                    </Box>
                                                }
                                            </Box>
                                        )
                                    })}
                                </Box>

                                <Box className='indicator-optional-inputs' pt={'10px'} sx={{ textAlign: 'start' }}>
                                    <Typography variant='h6' fontWeight='500' sx={{ textDecoration: 'underline', textUnderlineOffset: '3px' }}>OPTIONAL INPUTS</Typography>
                                    {optInputs.length === 0 ?
                                        (
                                            <Typography>None</Typography>
                                        )
                                        :
                                        (
                                            optInputs && optInputs.map((optionalInput, index) => {
                                                const { displayName, hint, name, defaultValue, errorFlag, helperText } = optionalInput
                                                return (
                                                    <Box pt={'14px'} key={index} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
                                                        <TextField
                                                            inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { height: '10px' } }}
                                                            error={errorFlag}
                                                            helperText={helperText}
                                                            size='small'
                                                            id={id}
                                                            label={displayName}
                                                            name={name}
                                                            value={defaultValue}
                                                            onChange={(handleOptionalInputChange)}
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': {
                                                                    '& fieldset': {
                                                                        borderColor: `${theme.palette.text.secondary}`,
                                                                    }
                                                                }
                                                            }}
                                                        />
                                                        {name === 'optInMAType' ?
                                                            (
                                                                <Tooltip
                                                                    title={`SMA = 0, EMA = 1, WMA = 2, DEMA = 3, TEMA = 4, TRIMA = 5, KAMA = 6, MAMA = 7, T3 = 8`}
                                                                    placement='top' sx={{ cursor: 'pointer' }}>
                                                                    <InfoOutlinedIcon className='small-icon' />
                                                                </Tooltip>
                                                            )
                                                            :
                                                            (
                                                                <Tooltip title={hint} placement='top' sx={{ cursor: 'pointer' }}>
                                                                    <InfoOutlinedIcon className='small-icon' />
                                                                </Tooltip>
                                                            )
                                                        }
                                                    </Box>
                                                )
                                            })
                                        )
                                    }
                                </Box>

                            </Box>
                        )
                    }
                    )}
                </AccordionDetails>
            </Accordion>
        </Box>
    )
}

export default SelectedFunctionContainer