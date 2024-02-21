import React, { useState } from 'react'
import { Box, TextField, Paper, Tooltip } from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useSelector } from 'react-redux'

const CustomInput = (props) => {
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

export default CustomInput