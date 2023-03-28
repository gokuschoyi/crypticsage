import React from 'react'
import { Box, TextField, Button } from '@mui/material'
const HighLightWordBox = (props) => {
    const slideStyle = {
        padding: '10px',
        '& .MuiOutlinedInput-root': {
            border: '1px solid #fff',
        }
    }
    const { count, parentIndex, handleRemoveHighlightWord, handleHighlightWordDataChange, keyword, explanation } = props
    // console.log(keyword, explanation)
    return (
        <Box className='highlight-word-box flex-row' sx={{ gap: '5px' }}>
            <Box sx={{ width: '60%' }}>
                <TextField
                    inputProps={{ 'data-id': `${count}`, 'data-parent-id': `${parentIndex}` }}
                    size='small'
                    id={`${count}`}
                    name='keyword'
                    value={keyword}
                    onChange={(e) => handleHighlightWordDataChange(e)}
                    fullWidth
                    sx={slideStyle}
                    className='highlight-word-input'
                />
            </Box>
            <Box sx={{ width: '100%' }}>
                <TextField
                    inputProps={{ 'data-id': `${count}`, 'data-parent-id': `${parentIndex}` }}
                    size='small'
                    id={`${count}`}
                    name='explanation'
                    value={explanation}
                    onChange={(e) => handleHighlightWordDataChange(e)}
                    fullWidth
                    sx={slideStyle}
                    className='highlight-word-input'
                />
            </Box>
            {count > 0 &&
                <Button
                    color='secondary'
                    onClick={(e) => handleRemoveHighlightWord(e)}
                    id={`${count}`}
                    data-id={count}
                    data-parent-id={parentIndex}
                    sx={{ minWidth: 'auto' }}
                >
                    DEL
                </Button>
            }
        </Box>
    )
}

export default HighLightWordBox