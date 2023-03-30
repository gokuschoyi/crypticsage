import React from 'react'
import { TextField, Grid, InputAdornment, IconButton } from '@mui/material'
import { DeleteOutlineOutlinedIcon } from '../../../../dashboard/global/Icons'
const OptionBox = (props) => {
    const { count, parentId, removeOptions, handleOptionsBoxData, optionValue } = props
    const slideStyle = {
        padding: '10px',
        '& .MuiOutlinedInput-root': {
            border: '1px solid #fff',
        }
    }
    return (
        <Grid item xs={12} sm={6} md={4} lg={4} xl={3}>
            <TextField
                inputProps={{ 'data-id': `${count}`, 'data-parent-id': `${parentId}` }}
                className='options-grid-item'
                fullWidth
                sx={slideStyle}
                value={optionValue}
                onChange={(e) => handleOptionsBoxData(e)}
                label={`option ${count + 1}`}
                name='option'
                size='small'
                InputProps={{
                    endAdornment:
                        <InputAdornment position="end">
                            <IconButton
                                onClick={removeOptions}
                                data-id={count}
                                data-parent-id={parentId}
                                aria-label="toggle password visibility"
                                edge="end"
                            >
                                <DeleteOutlineOutlinedIcon sx={{ pointerEvents: 'none' }} />
                            </IconButton>
                        </InputAdornment>
                }}
            />
        </Grid>
    )
}

export default OptionBox