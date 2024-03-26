import React, { useEffect, useState } from 'react'
import { Box, useTheme, Paper, Autocomplete, TextField, Tooltip, } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

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

const MultiSelect = (props) => {
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

export default MultiSelect