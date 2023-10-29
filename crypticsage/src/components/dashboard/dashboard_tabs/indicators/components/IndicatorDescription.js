import React, { useEffect, useState, useRef } from 'react'
import { getIndicatorDesc, executeTalibFunction } from '../../../../../api/adminController'
import { useSelector, useDispatch } from 'react-redux'
import { setTalibDescription, setSelectedFlagInTalibDescription, setSelectedFunctions } from '../modules/CryptoModuleSlice'
import {
    Box,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    AccordionActions,
    Typography,
    TextField,
    Grid,
    IconButton,
    Tooltip,
    Autocomplete,
    useTheme,
    Paper
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CreateIcon from '@mui/icons-material/Create';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckIcon from '@mui/icons-material/Check';

const MultiSelect = (props) => {
    const theme = useTheme()
    const { inputLabel, selectedInputOptions, handleInputOptions, fieldName, errorFlag, helperText } = props
    const inputOptions = [
        "",
        "high",
        "low",
        "open",
        "close",
    ]
    return (
        <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' gap={'40px'}>
            <Box sx={{ width: '100%' }}>
                <Autocomplete
                    size='small'
                    disableClearable
                    disablePortal={false}
                    id={`select-input-${fieldName}`}
                    options={inputOptions}
                    value={selectedInputOptions} // Set the selected value
                    onChange={(event, newValue) => handleInputOptions(fieldName, newValue)} // Handle value change

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

const input_types = {
    inReal: 'flag',
    inReal0: 'flag 1',
    inReal1: 'flag 2',
    inPeriods: 'periods',
}

const FunctionContainer = (props) => {
    const theme = useTheme()
    const { func, group_name, histDataLength, fetchValues } = props
    const dispatch = useDispatch()
    const token = useSelector(state => state.auth.accessToken);
    const funcCopy = Object.assign({}, func)
    // console.log(funcCopy)
    const { group, hint, name, inputs, optInputs, outputs, function_selected_flag, splitPane } = funcCopy

    const [selectedInputOptions, setSelectedInputOptions] = useState(inputs)
    const [defaultOptionalInputs, setDefaultOptionalInputs] = useState(optInputs)
    const functionSelectedRef = useRef(function_selected_flag)

    // handle generate query for each function
    const handleGenerateQuery = (func_name) => {
        // console.log("Split pane",splitPane)
        let talibExecuteQuery = {}
        let tOITypes = {}

        const transformedOptionalInputs = defaultOptionalInputs.reduce((result, item) => {
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
                });
                return input
            } else {
                if (input.value === '') {
                    return {
                        ...input,
                        errorFlag: true,
                        helperText: 'Please select a valid input',
                    }
                } else {
                    converted[input.name] = input.value;
                    return {
                        ...input,
                        errorFlag: false,
                        helperText: '',
                    }
                }
            }
        })

        // console.log(checked)
        const filtered = checked.filter((item) => !item.flags)
        // console.log(filtered)
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
            setSelectedInputOptions(checked)
            return
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

            console.log(payload)
            executeTalibFunction({ token, payload })
                .then((res) => {
                    console.log(res.data)
                    dispatch(setSelectedFlagInTalibDescription(
                        {
                            group,
                            name,
                            inputs: selectedInputOptions,
                            optInputs: defaultOptionalInputs
                        }
                    ))
                    dispatch(setSelectedFunctions(
                        {
                            hint,
                            name,
                            group_name,
                            inputs: selectedInputOptions,
                            optInputs: defaultOptionalInputs,
                            outputs,
                            function_selected_flag: true,
                            result: res.data.result,
                            splitPane
                        }
                    ))
                    functionSelectedRef.current = true
                })
                .catch(err => {
                    console.log(err)
                })
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

                <AccordionActions>
                    <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' width='100%' pl={1} pr={1}>
                        <Typography variant='h6' fontWeight='bold' sx={{ textAlign: 'start' }}>{name}</Typography>
                        {function_selected_flag ?
                            (
                                <Box>
                                    <Tooltip title="Function added" placement='top'>
                                        <CheckIcon color='success' className='small-icon' />
                                    </Tooltip>
                                </Box>
                            )
                            :
                            (
                                <IconButton size='small' aria-label="update" color="secondary" onClick={handleGenerateQuery.bind(null, { func_name: name })}>
                                    <Tooltip title="Generate query" placement='top'>
                                        <CreateIcon className='small-icon' />
                                    </Tooltip>
                                </IconButton>
                            )
                        }

                    </Box>
                </AccordionActions>

                <AccordionDetails>
                    <Paper elevation={4}>
                        <Box p={1}>
                            <Box className='indicator-inputs' sx={{ textAlign: 'start' }}>
                                <Typography variant='h6' textAlign='start' fontWeight='500' sx={{textDecoration:'underline', textUnderlineOffset:'3px'}}>INPUTS</Typography>
                                {selectedInputOptions.length > 0 && selectedInputOptions.map((input, index) => {
                                    const { value, errorFlag, helperText } = input
                                    return (
                                        <Box key={index} display='flex' flexDirection='column' pb={'5px'} alignItems='flex-start'>
                                            {input.flags ?
                                                (
                                                    <Box sx={{ width: '100%' }} display='flex' flexDirection='column'>
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
                                                ) :
                                                (
                                                    <Box pt={1} width='100%'>
                                                        <MultiSelect
                                                            inputLabel={input_types[input.name]}
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
                                <Typography variant='h6' fontWeight='500' sx={{textDecoration:'underline', textUnderlineOffset:'3px'}}>OPTIONAL INPUTS</Typography>
                                {defaultOptionalInputs.length === 0 ?
                                    (
                                        <Typography>None</Typography>
                                    )
                                    :
                                    (
                                        defaultOptionalInputs && defaultOptionalInputs.map((optionalInput, index) => {
                                            const { displayName, hint, name, defaultValue, errorFlag, helperText } = optionalInput
                                            return (
                                                <Box pt={'10px'} key={index} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
                                                    <TextField
                                                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { height: '10px' } }}
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

                            <Box className='indicator-outputs' pt={'10px'} sx={{ textAlign: 'start' }}>
                                <Typography variant='h6' fontWeight='500' sx={{textDecoration:'underline', textUnderlineOffset:'3px'}}>OUTPUTS</Typography>
                                {outputs && outputs.map((output, index) => {
                                    return (
                                        <Box key={index} display='flex' flexDirection='column' pt={'4px'}>
                                            <Typography variant='custom'><span style={{ fontWeight: '600' }}>0 : </span>{output['0'] || 'N/A'}</Typography>
                                            <Box pl={2} display='flex' flexDirection='column'>
                                                <Typography variant='custom'><span style={{ fontWeight: '600' }}>Name : </span>{output.name || 'N/A'}</Typography>
                                                <Typography variant='custom'><span style={{ fontWeight: '600' }}>Type : </span>{output.type || 'N/A'}</Typography>
                                                <Typography variant='custom'><span style={{ fontWeight: '600' }}>Flags : </span>{JSON.stringify(output.flags) || 'N/A'}</Typography>
                                            </Box>
                                        </Box>
                                    )
                                })}
                            </Box>
                        </Box>
                    </Paper>
                </AccordionDetails>
            </Accordion>
        </Box >
    )
}

const Indicators = (props) => {
    const { fetchValues } = props
    const token = useSelector(state => state.auth.accessToken);
    const dispatch = useDispatch()
    const histDataLength = useSelector(state => state.cryptoModule.cryptoDataInDb).length

    // const [copyRawTalibDesc, setCopyRawTalibDesc] = useState([])
    const talibDescriptionRedux = useSelector(state => state.cryptoModule.talibDescription);
    const [rawTalibDesc, setRawTalibDesc] = useState([]) // copy of grouped talib desc data
    const [talibDesc, setTalibDesc] = useState(talibDescriptionRedux) // grouped talib desc data

    // initial fetch talib descriptions
    useEffect(() => {
        if (talibDescriptionRedux.length === 0) {
            // console.log('UE : Fetching talib descriptions')
            getIndicatorDesc({ token })
                .then((res) => {
                    setRawTalibDesc(res.data.desc)
                    setTalibDesc(res.data.desc)
                    dispatch(setTalibDescription(res.data.desc))
                })
                .catch(err => {
                    console.log(err)
                })
        } else {
            // console.log('UE : Talib descriptions already present in redux')
            setRawTalibDesc(talibDescriptionRedux)
            setTalibDesc(talibDescriptionRedux)
        }
    }, [talibDescriptionRedux, dispatch, token])

    const [searchTicker, setSearchTicker] = useState('');
    const handleSearchTicker = (e) => {
        // console.log(e.target.value)
        setSearchTicker(e.target.value.toLowerCase())
    }

    const [expanded, setExpanded] = useState(false);
    const handleAccordianChange = (panel) => (event, isExpanded) => {
        console.log(panel, isExpanded)
        setExpanded(isExpanded ? panel : false);
    };

    // filtering/search logic
    useEffect(() => {
        // console.log('UE : New Filtering Logic')
        let updatedDataCopy = [...rawTalibDesc]
        const filteredGroups = [];

        for (const group of updatedDataCopy) {
            const filteredFunctions = group.functions.filter(func =>
                func.name.toLowerCase().includes(searchTicker)
            );

            if (filteredFunctions.length > 0) {
                const filteredGroup = {
                    group_name: group.group_name,
                    functions: filteredFunctions
                };
                filteredGroups.push(filteredGroup);
            }
        }

        if (filteredGroups.length === 1) {
            setExpanded(filteredGroups[0].group_name)
        }

        setTalibDesc(filteredGroups)
        // console.log(filteredGroups)
    }, [searchTicker, rawTalibDesc])

    return (
        <Box className='admin-indicator-container' >

            <Box className='talib-indicators-box'>
                <Box className='search-indicator-box' display='flex' flexDirection='row' alignItems='center' pt={2} pb={2} gap={2}>
                    <TextField
                        inputProps={{ style: { height: '10px' } }}
                        color='secondary'
                        label="Search indicator"
                        variant="outlined"
                        value={searchTicker}
                        onChange={(e) => handleSearchTicker(e)}
                        id="outlined-size-small"
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: '#E0E3E2',
                                }
                            },
                            '& .MuiInputLabel-root': {
                                top: '-5px'
                            },
                        }}
                    />
                </Box>

                <Box className='all-talib-functions' sx={{ minHeight: '500px' }}>
                    <Grid container spacing={1} >
                        {talibDesc && talibDesc.map((group, index) => {
                            const { group_name, functions } = group
                            return (
                                <Grid key={group_name} item xs={12} sm={12} md={12} lg={12} xl={6}>
                                    <Box width='100%' pt={1} pb={1}  >
                                        <Accordion TransitionProps={{ mountOnEnter: true }} >
                                            <AccordionSummary
                                                expandIcon={<ExpandMoreIcon />}
                                                aria-controls="panel1a-content"
                                                id="panel1a-header"
                                            >
                                                <Typography variant='h5'>({index + 1}) : {group_name} <span style={{ color: 'red' }}>({functions.length})</span></Typography>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <Grid container spacing={1} className='indicator-data-container'>
                                                    {functions && functions.map((func, index) => {
                                                        return (
                                                            <Grid key={func.name} item xs={12} sm={6} md={6} lg={4} xl={6}>
                                                                <FunctionContainer key={index} group_name={group_name} func={func} histDataLength={histDataLength} fetchValues={fetchValues} />
                                                            </Grid>
                                                        )
                                                    })}
                                                </Grid>
                                            </AccordionDetails>
                                        </Accordion>
                                    </Box>
                                </Grid>
                            )
                        })}
                    </Grid>
                </Box>
            </Box>
        </Box >
    )
}

export {
    Indicators,
    MultiSelect
}