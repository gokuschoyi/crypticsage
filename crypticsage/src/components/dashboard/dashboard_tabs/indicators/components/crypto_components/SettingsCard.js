import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useSelector, useDispatch } from 'react-redux'
import React from 'react'
import {
    setSelectedFunctionInputValues
    , setSelectedFunctionOptionalInputValues
    , setFunctionInputErrorFlagAndMessage
    , setTalibResult
} from '../../modules/CryptoModuleSlice';

import { executeTalibFunction } from '../../../../../../api/adminController';
import {
    Box
    , Card
    , Autocomplete
    , TextField
    , Tooltip
    , CardContent
    , Typography
    , CircularProgress
    , CardActions
    , Button
    , useTheme
} from '@mui/material'

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
        <Box className='test-input' display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' gap={'40px'}>
            <Box sx={{ width: '100%' }}>
                <Autocomplete
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


const SettingsCard = (props) => {
    const { selectedFunctionNameAndId, fetchValues, setOpenSettings } = props
    const { slId, slName } = selectedFunctionNameAndId
    const token = useSelector(state => state.auth.accessToken);
    const histDataLength = useSelector(state => state.cryptoModule.cryptoDataInDb).length
    const selectedFunctionData = useSelector(state => state.cryptoModule.selectedFunctions)
    const functionData = selectedFunctionData.find((func) => func.name === slName)
    const selectedFunc = functionData.functions.find((func) => func.id === slId)
    const dispatch = useDispatch()
    const theme = useTheme()
    const { name, id, inputs, optInputs } = selectedFunc

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

    const [talibExecuting, setTalibExecuting] = React.useState(false)
    const handleExecuteTalibQuery = (param) => {
        const { name, id } = param

        const talibFuncType = selectedFunctionData.find((func) => func.name === name)
        const { outputs } = talibFuncType
        const functionTOGenerateQueryFor = talibFuncType.functions.find((func_) => func_.id === id)
        const { inputs, optInputs } = functionTOGenerateQueryFor

        let selectedInputOptions = [...inputs]

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

        console.log(name, id, checked)

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
        console.log(hasEmptyValues)

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

            console.log(payload)
            setTalibExecuting(true)
            executeTalibFunction({ token, payload })
                .then((res) => {
                    console.log(res.data)
                    dispatch(setTalibResult({ id: id, name: name, optInputs: optInputs, result: res.data.result }))
                    setTalibExecuting(false)
                    setOpenSettings(false)
                })
                .catch(err => {
                    setTalibExecuting(false)
                    console.log(err)
                })
        }

    }

    const handleCloseSettings = (param) => {
        const { name, id } = param
        console.log(name, id)
        setOpenSettings(false)
    }

    return (
        <Card sx={{ width: 265, padding: '4px 8px' }}>
            <CardContent sx={{ padding: '0px' }}>
                <Box display='flex' flexDirection='row' justifyContent='space-between'>
                    <Typography textAlign='start' gutterBottom variant="h6">
                        SETTINGS  : {name}
                    </Typography>
                    {talibExecuting ? <CircularProgress color="error" sx={{ margin: '2.5px' }} size={15} /> : ''}
                </Box>
                <Box>
                    <Box className='settings-inputs'>
                        <Typography variant='custom' textAlign='start' fontWeight='500'>INPUTS</Typography>
                        {inputs.length > 0 && inputs.map((input, index) => {
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
                                                    inputLabel={input.name === 'inReal' ? 'flag' : input.name}
                                                    selectedInputOptions={value}
                                                    handleInputOptions={handleInputOptions}
                                                    fieldName={input.name}
                                                    errorFlag={errorFlag}
                                                    helperText={helperText}
                                                    id={id}
                                                />
                                            </Box>
                                        )
                                    }
                                </Box>
                            )
                        })}
                    </Box>
                    <Box className='settings-optional-inputs' pt={1}>
                        <Typography variant='custom' textAlign='start' fontWeight='500'>OPTIONAL INPUTS</Typography>
                        {optInputs.length === 0 ?
                            (
                                <Box pt={1}>
                                    <Typography textAlign='start'>None</Typography>
                                </Box>
                            )
                            :
                            (
                                optInputs && optInputs.map((optionalInput, index) => {
                                    const { displayName, hint, name, defaultValue, errorFlag, helperText } = optionalInput
                                    return (
                                        <Box pt={'8px'} key={index} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
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
            </CardContent>
            <CardActions sx={{ padding: '16px 0px 8px 0px' }}>
                <Button color='secondary' variant='outlined' size="small" onClick={handleExecuteTalibQuery.bind(null, { id: id, name: name })}>Run</Button>
                <Button color='secondary' variant='outlined' size="small" onClick={handleCloseSettings.bind(null, { id: id, name: name })}>Close</Button>
            </CardActions>
        </Card>
    )
}

export default SettingsCard