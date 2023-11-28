import React, { useEffect, useState } from 'react'
import { Box, useTheme, Paper, Autocomplete, TextField, Tooltip, } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const NEW_MODEL_DESCRIPTION = {
    "Single Step Single Output": {
        "model_type": "multi_input_single_output_no_step",
        "input": "multiple",
        "output": 'single',
        "chart_type": "line",
        "description": "This model is designed to train on multiple input time series datasets with the goal of predicting a single value (Predictions flag), one step ahead. It's important to note that this model focuses on predicting a single value one time-step ahead",
        "step": false,
        "prediction_flag": true
    },
    "Single Step Multiple Output": {
        "model_type": "multi_input_multi_output_no_step",
        "input": "multiple",
        "output": 'multiple',
        "chart_type": "candleStick",
        "description": "The purpose of this model is to train on various input time series datasets, aiming to predict future values for all input features, one step ahead. It's crucial to understand that this model concentrates on predicting all the features for a single step in the future.",
        "step": false,
        "prediction_flag": false
    },
    "Multi Step Single Output": {
        "model_type": "multi_input_single_output_step",
        "input": "multiple",
        "output": 'multiple',
        "chart_type": "line",
        "description": "The purpose of this model is to train on various input time series datasets, aiming to predict future values for look ahead values.",
        "step": true,
        "prediction_flag": true
    },
    "Multi Step Multiple Output": {
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
    const { inputLabel, inputOptions, selectedInputOptions, handleInputOptions, fieldName, toolTipTitle } = props
    const [tooltipMessage, setTooltipMessage] = useState(toolTipTitle)
    useEffect(() => {
        if (inputLabel === 'Model type') {
            const model_data = NEW_MODEL_DESCRIPTION[selectedInputOptions]
            setTooltipMessage(model_data.description)
        }
    }, [inputLabel, selectedInputOptions])

    return (
        <Paper elevation={8}>
            <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' gap={'40px'} pl={'4px'} pr={'4px'} pt={1} pb={1}>
                <Box sx={{ width: '100%' }}>
                    <Autocomplete
                        size='small'
                        disableClearable
                        disablePortal={false}
                        id={`select-input-${fieldName}`}
                        name='multiSelectValue'
                        options={inputOptions}
                        value={selectedInputOptions} // Set the selected value
                        onChange={(event, newValue) => handleInputOptions(event, newValue)} // Handle value change
                        sx={{ width: 'auto' }}
                        renderInput={(params) => <TextField {...params}
                            variant="standard"
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