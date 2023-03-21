import React from 'react'
import './AddSection.css'
import {
    Box,
    Grid,
    Typography,
    TextField,
    Button,
    IconButton,
    useTheme
} from '@mui/material'
import { ReplayIcon } from '../../../../global/Icons'
const AddSection = (props) => {
    const { newSectionData, handleNewSectionData, handleSectionSubmit, sectionData } = props
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
        <Box className='add-section-box'>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={12} md={8} lg={8} order={{ xs: 2, md: 1 }}>
                    <Box className='add-section-data-header'>
                        <Typography variant='h4' color='white' textAlign='start' className='add-content-subtitle'>Add Sections</Typography>
                    </Box>
                    <Box className='add-section-data'>
                        <TextField
                            name='title'
                            value={newSectionData.title.value}
                            onChange={(e) => handleNewSectionData(e)}
                            error={newSectionData.title.error}
                            helperText={newSectionData.title.helperText}
                            sx={inputStyleSection}
                            id="outlined-basic"
                            label="Section Title"
                            variant="outlined"
                            className='add-section-data-title'
                        />
                        <TextField
                            name='content'
                            value={newSectionData.content.value}
                            onChange={(e) => handleNewSectionData(e)}
                            error={newSectionData.content.error}
                            helperText={newSectionData.content.helperText}
                            className='add-section-data-content'
                            size="small"
                            multiline={true}
                            fullWidth
                            minRows='8'
                            sx={inputStyleSection}
                            id="section-content"
                            label="Section Content"
                            variant="outlined"
                            type='text'
                        />
                        <TextField
                            name='url'
                            value={newSectionData.url.value}
                            onChange={(e) => handleNewSectionData(e)}
                            error={newSectionData.url.error}
                            helperText={newSectionData.url.helperText}
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
                            onClick={handleSectionSubmit}>Submit</Button>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={12} md={4} lg={4} order={{ xs: 1, md: 2 }}>
                    <Box className='refresh-sections'>
                        <Typography variant='h4' color='white' textAlign='start' className='add-content-subtitle'>Available Sections</Typography>
                        <IconButton className='refreshIcon'>
                            <ReplayIcon />
                        </IconButton>
                    </Box>
                    <Box className='add-content-sections'>
                        <ul>
                            {sectionData && sectionData.map((section, index) => {
                                return (
                                    <li key={index}>
                                        <Box className='available-section-box'>
                                            <Typography variant='h5' color='white' textAlign='start' className='add-content-sections-item'>{section.title}</Typography>
                                        </Box>
                                    </li>
                                )
                            })
                            }
                        </ul>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    )
}

export default AddSection