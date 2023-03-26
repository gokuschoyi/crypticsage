import React from 'react'
import './UpdateSection.css'
import { Box, Typography, TextField, Button, useTheme } from '@mui/material'
const UpdateSection = (props) => {
    const {selectedSectionData, handleUpdateSectionData, handleUpdateSectionSubmit} = props
    const theme = useTheme()
    const inputStyleSection = {
        width: 'fill-available',
        padding: '10px',
        '& label.Mui-focused': {
            color: 'white !important',
        },
        '& label': {
            color: 'red',
        }
    }
    return (
        <Box className='update-section-box'>
            <Box className='add-section-data-header'>
                <Typography variant='h4' color='white' textAlign='start' className='add-content-subtitle'>Edit Sections</Typography>
            </Box>
            <Box className='add-section-data'>
                <TextField
                    name='title'
                    value={selectedSectionData.title}
                    onChange={(e) => handleUpdateSectionData(e)}
                    sx={inputStyleSection}
                    id="outlined-basic"
                    label="Section Title"
                    variant="outlined"
                    className='add-section-data-title'
                />
                <TextField
                    name='content'
                    value={selectedSectionData.content}
                    onChange={(e) => handleUpdateSectionData(e)}
                    className='add-section-data-content'
                    size="small"
                    multiline={true}
                    fullWidth
                    minRows='12'
                    sx={inputStyleSection}
                    id="section-content"
                    label="Section Content"
                    variant="outlined"
                    type='text'
                />
                <TextField
                    name='url'
                    value={selectedSectionData.url}
                    onChange={(e) => handleUpdateSectionData(e)}
                    sx={inputStyleSection}
                    id="outlined-basic"
                    label="Section Image URL"
                    variant="outlined"
                    className='add-section-data-image'
                />
                <Button
                    size='small'
                    sx={{
                        width: '200px',
                        ':hover': {
                            color: 'black !important',
                            backgroundColor: '#d11d1d !important',
                            transition: '0.5s'
                        },
                        backgroundColor: `${theme.palette.secondary.main}`
                    }}
                    onClick={handleUpdateSectionSubmit}>Save Section</Button>
            </Box>
        </Box>
    )
}

export default UpdateSection