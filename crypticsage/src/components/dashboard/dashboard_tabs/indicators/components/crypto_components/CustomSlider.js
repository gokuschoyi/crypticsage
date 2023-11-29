import React, { useState, useEffect } from 'react'
import { Paper, Box, Typography, Slider, Input } from '@mui/material'

const CustomSlider = (props) => {
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
        } else {
            setSlideValue(value)
            handleModelParamChange(name, value)
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

    /* const handleBlur = () => {
        if (slideValue < sliderMin) {
            setSlideValue(sliderMin);
        } else if (slideValue > sliderMax) {
            setSlideValue(sliderMax);
        }
    } */


    return (
        <Paper elevation={6}>
            <Box p={'4px 8px'} display='flex' flexDirection='column' alignItems='start'>
                <Box display='flex' flexDirection='row' justifyContent='space-between' width='100%'>
                    <Typography id="training-size-slider" variant='custom'>{label} : {scaledLearningRate === undefined ? `${sliderValue}${label === 'Training size' ? '%' : ''}` : scaledLearningRate.toExponential(2)}</Typography>
                    <Typography variant='custom'>(Min: {min}, Max: {max})</Typography>
                </Box>

                <Box sx={{ width: "100%", display: 'flex', flexDirection: 'row', gap:'16px' }}>
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
                    {label === 'Epochs' &&
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

export default CustomSlider