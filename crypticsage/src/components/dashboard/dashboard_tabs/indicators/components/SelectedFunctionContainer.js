import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Box, Typography, Accordion, AccordionSummary, AccordionDetails, AccordionActions, IconButton, Tooltip, TextField } from '@mui/material'
import { executeTalibFunction } from '../../../../../api/adminController'
import { setSelectedFunctions } from '../modules/CryptoStockModuleSlice'
import { MultiSelect } from './IndicatorDescription'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CreateIcon from '@mui/icons-material/Create';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const SelectedFunctionContainer = (props) => {
    const { func, histDataLength, fetchValues, name, hint } = props
    const dispatch = useDispatch()
    const token = useSelector(state => state.auth.accessToken);
    const funcCopy = Object.assign({}, func)
    // console.log(funcCopy)
    const { inputs, optInputs, outputs } = funcCopy

    const [selectedInputOptions, setSelectedInputOptions] = useState(inputs)
    const [defaultOptionalInputs, setDefaultOptionalInputs] = useState(optInputs)

    // handle generate query for each function
    const handleGenerateQuery = (func_name) => {
        let talibExecuteQuery = {}

        const transformedOptionalInputs = defaultOptionalInputs.reduce((result, item) => {
            result[item.name] = item.defaultValue
            return result;
        }, {})
        let tOITypes = {}

        defaultOptionalInputs.reduce((result, input) => {
            tOITypes[input.name] = input.type;
            return result;
        }, {});

        // console.log(outputs)
        let outputkeys = {}
        let outputsCopy = [...outputs]
        outputkeys = outputsCopy.reduce((result, output) => {
            result[output.name] = output.name;
            return result;
        }, {});

        const isFlagsAvailable = inputs[0].flags === undefined ? false : true
        let input = {}
        if (isFlagsAvailable) { // flags field available, so we can directly use the flags
            let flags = inputs[0].flags;
            let converted = {};

            // Use forEach to populate the converted object
            Object.keys(flags).forEach((key) => {
                // console.log(flags[key]);
                converted[flags[key]] = flags[key];
            });

            talibExecuteQuery['name'] = name;
            talibExecuteQuery['startIdx'] = 0;
            talibExecuteQuery['endIdx'] = histDataLength - 1;
            talibExecuteQuery = { ...talibExecuteQuery, ...converted, ...transformedOptionalInputs }

            delete fetchValues['items_per_page']
            delete fetchValues['page_no']
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

            console.log(payload)
            executeTalibFunction({ token, payload })
                .then((res) => {
                    console.log(res)
                    dispatch(setSelectedFunctions({ hint, name, inputs: selectedInputOptions, optInputs: defaultOptionalInputs, outputs, result: res.data.result }))
                })
                .catch(err => {
                    console.log(err)
                })
        } else { // flags not present in the input, so we have to take input from user
            let selectedInputOptionsCopy = [...selectedInputOptions]
            let checked = selectedInputOptionsCopy.map((item) => {
                if (item.value === '') {
                    return {
                        ...item,
                        errorFlag: true,
                        helperText: 'Please select a valid input',
                    };
                } else {
                    return {
                        ...item,
                        errorFlag: false,
                        helperText: '',
                    };
                }
            });

            let notNull = checked.every((item) => item.value !== '')

            if (!notNull) {
                setSelectedInputOptions(checked)
                return
            } else {
                setSelectedInputOptions(checked)
                Object.keys(selectedInputOptionsCopy).forEach((key) => {
                    // console.log(key)
                    input[selectedInputOptionsCopy[key].name] = selectedInputOptionsCopy[key].value;
                })

                talibExecuteQuery['name'] = name;
                talibExecuteQuery['startIdx'] = 0;
                talibExecuteQuery['endIdx'] = histDataLength - 1;
                talibExecuteQuery = { ...talibExecuteQuery, ...input, ...transformedOptionalInputs }

                delete fetchValues['items_per_page']
                delete fetchValues['page_no']
                let payload = {
                    func_query: talibExecuteQuery,
                    func_param_input_keys: input,
                    func_param_optional_input_keys: tOITypes,
                    func_param_output_keys: outputkeys,
                    db_query: {
                        ...fetchValues,
                        fetch_count: histDataLength
                    }
                }
                console.log(payload)
                executeTalibFunction({ token, payload })
                    .then((res) => {
                        dispatch(setSelectedFunctions({ hint, name, inputs: selectedInputOptions, optInputs: defaultOptionalInputs, outputs, result: res.data.result }))
                        console.log(res.data)
                    })
                    .catch(err => {
                        console.log(err)
                    })
            }
        }
    }

    // handle input options
    const handleInputOptions = (fieldName, newValue) => {
        // console.log(fieldName, newValue)
        let currentValue = [...selectedInputOptions]
        let inputToUpdate = currentValue.map((item) => {
            if (item.name === fieldName) {
                // Update the key based on fieldName and newValue
                return {
                    ...item,
                    value: newValue,
                    errorFlag: false,
                    helperText: '',
                };
            }
            return item; // Keep other items unchanged
        });

        setSelectedInputOptions(inputToUpdate)
        // console.log(inputToUpdate)
    }

    // handle optional input change
    const handleOptionalInputChange = (e) => {
        const { name, value } = e.target
        // Map through the defaultOptionalInputs and update values
        let defaultOptionsCopy = [...defaultOptionalInputs]

        const updatedOptionalInputs = defaultOptionsCopy.map((input) => {
            if (input.name === name) {
                const defaultValue = value; // Convert value to integer if needed
                const errorFlag = defaultValue === '' ? true : false;
                const helperText = errorFlag ? 'Default value cannot be null' : '';
                // console.log(value, defaultValue, errorFlag, helperText)
                return {
                    ...input,
                    defaultValue,
                    errorFlag,
                    helperText,
                };
            } else {
                return input;
            }
        });
        setDefaultOptionalInputs(updatedOptionalInputs)
        // console.log(name, value, updatedOptionalInputs)
    }

    // expand function accordian
    const [expanded, setExpanded] = React.useState(false);
    const handleChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    return (
        <Box width='100%' p={'5px'} className='indicator-function-box'>
            <Accordion TransitionProps={{ mountOnEnter: true }} className='function-accordian' expanded={expanded === `${name}`} onChange={handleChange(`${name}`)}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                    sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: '100%',
                        justifyContent: 'space-between',

                    }}
                >
                    <Box className='function-name' display='flex' flexDirection='row' alignItems='center' >
                        <Typography
                            variant='h6'
                            fontWeight={400}
                            sx={{
                                // Allow the text to overflow
                                maxWidth: '290px',
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

                <AccordionActions>
                    <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' width='100%' pl={1} pr={1}>
                        <Typography variant='h6' sx={{ textAlign: 'start' }}>{name}</Typography>
                        <IconButton size='small' aria-label="update" color="secondary" onClick={handleGenerateQuery.bind(null, { func_name: name })}>
                            <Tooltip title="Generate query" placement='top'>
                                <CreateIcon className='small-icon' />
                            </Tooltip>
                        </IconButton>
                    </Box>
                </AccordionActions>

                <AccordionDetails>
                    <Box pl={1} pr={1} pb={1} sx={{ backgroundColor: '#272727' }}>

                        <Box className='indicator-inputs' pt={'10px'} sx={{ textAlign: 'start' }}>
                            <Typography variant='h5'>INPUTS</Typography>
                            {selectedInputOptions.length > 0 && selectedInputOptions.map((input, index) => {
                                const { value, errorFlag, helperText } = input
                                return (
                                    <Box key={index} display='flex' flexDirection='column' pb={'5px'}>
                                        {input.flags ?
                                            (
                                                <Box>
                                                    <Typography><span style={{ fontWeight: '600' }}>Name : </span>{input.name}</Typography>
                                                    {/* <Typography><span style={{ fontWeight: '600' }}>Type : </span>{input.type}</Typography> */}
                                                    <Typography><span style={{ fontWeight: '600' }}>Flags : </span></Typography>
                                                    <Box pl={2}>
                                                        {Object.keys(input.flags).map((key, index) => {
                                                            return (
                                                                <Typography key={index}>{key} : {input.flags[key]}</Typography>
                                                            )
                                                        })}
                                                    </Box>
                                                </Box>
                                            ) :
                                            (
                                                <Box pt={1}>
                                                    <MultiSelect
                                                        inputLabel={input.name === 'inReal' ? 'flag' : input.name}
                                                        selectedInputOptions={value}
                                                        handleInputOptions={handleInputOptions}
                                                        fieldName={input.name}
                                                        errorFlag={errorFlag}
                                                        helperText={helperText}
                                                    />
                                                </Box>
                                            )
                                        }
                                    </Box>
                                )
                            })}
                        </Box>

                        <Box className='indicator-optional-inputs' pt={'10px'} sx={{ textAlign: 'start' }}>
                            <Typography variant='h5'>OPTIONAL INPUTS</Typography>
                            {defaultOptionalInputs.length === 0 ?
                                (
                                    <Typography>None</Typography>
                                )
                                :
                                (
                                    defaultOptionalInputs && defaultOptionalInputs.map((optionalInput, index) => {
                                        const { displayName, hint, name, defaultValue, errorFlag, helperText } = optionalInput
                                        return (
                                            <Box pt={'15px'} key={index} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
                                                <TextField
                                                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                                                    error={errorFlag}
                                                    helperText={helperText}
                                                    size='small'
                                                    id={`${name}-optional-input`}
                                                    label={displayName}
                                                    name={name}
                                                    value={defaultValue}
                                                    onChange={(handleOptionalInputChange)}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            '& fieldset': {
                                                                borderColor: 'white',
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

                        <Box className='indicator-outputs' pt={'10px'} sx={{ textAlign: 'start' }}>
                            <Typography variant='h5'>OUTPUTS</Typography>
                            {outputs && outputs.map((output, index) => {
                                return (
                                    <Box key={index} display='flex' flexDirection='column' gap='5px'>
                                        <Typography><span style={{ fontWeight: '600' }}>0 : </span>{output['0'] || 'N/A'}</Typography>
                                        <Typography><span style={{ fontWeight: '600' }}>Flags : </span>{JSON.stringify(output.flags) || 'N/A'}</Typography>
                                        <Typography><span style={{ fontWeight: '600' }}>Name : </span>{output.name || 'N/A'}</Typography>
                                        <Typography><span style={{ fontWeight: '600' }}>Type : </span>{output.type || 'N/A'}</Typography>
                                    </Box>
                                )
                            })}
                        </Box>

                    </Box>
                </AccordionDetails>
            </Accordion>
        </Box >
    )
}

export default SelectedFunctionContainer