import React from 'react'
import './AddLesson.css'
import {
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    IconButton
} from '@mui/material'
import { AddIcon } from '../../../../global/Icons'
import SlideBox from './SlideBox'
const AddLesson = (props) => {
    const {
        sectionData,
        handleGetSection,
        selectedSectionName,
        handleAddSlide,
        slideList
    } = props
    const inputStyleLesson = {
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
        <Box className='add-lesson-box'>
            <Box className='add-lesson-data-header'>
                <Typography variant='h4' color='white' textAlign='start' className='add-content-subtitle'>Add Lesson</Typography>
            </Box>
            <Box className='section-selector'>
                <Box sx={{ width: '60%' }}>
                    <FormControl fullWidth>
                        <InputLabel id="document-type-label">Select a Section</InputLabel>
                        <Select
                            onChange={(e) => handleGetSection(e)}
                            labelId="document-type"
                            id="document-type"
                            value={selectedSectionName}
                            label="Media Type"
                        >
                            {sectionData && sectionData.map((section, index) => {
                                return (
                                    <MenuItem key={index} value={`${section.title}`}>{section.title}</MenuItem>
                                )
                            })}
                        </Select>
                    </FormControl>
                </Box>
                <Box className='new-lwsson-box'>
                    <Box className='lesson-title flex-row'>
                        <Typography variant='h5' color='white' textAlign='start' className='header-width-lesson'>Lesson Title : </Typography>
                        <TextField size='small' sx={inputStyleLesson} className='lesson-title-input' />
                    </Box>
                    <Box className='flex-row'>
                        <Typography variant='h5' color='white' textAlign='start' className='header-width-lesson'>Slide Media URL : </Typography>
                        <TextField size='small' sx={inputStyleLesson} className='lesson-title-input' />
                    </Box>
                    <Box className='flex-row'>
                        <Typography variant='h5' color='white' textAlign='start' className='header-width-lesson'>Next Lesson ID : </Typography>
                        <TextField size='small' sx={inputStyleLesson} className='lesson-title-input' />
                    </Box>
                    <Box className='flex-row'>
                        <Typography variant='h5' color='white' textAlign='start' className='header-width-lesson'>Previous Lession ID : </Typography>
                        <TextField size='small' sx={inputStyleLesson} className='lesson-title-input' />
                    </Box>
                    <Box className='flex-row'>
                        <Typography variant='h5' color='white' textAlign='start' className='header-width-lesson'>Lesson Media (image) : </Typography>
                        <TextField size='small' sx={inputStyleLesson} className='lesson-title-input' />
                    </Box>
                    <Box className='flex-row'>
                        <Typography variant='h5' color='white' textAlign='start' className='header-width-lesson'>Slides : </Typography>
                        <Box>
                            <IconButton onClick={(e) => handleAddSlide(e)}>
                                <AddIcon />
                            </IconButton>
                        </Box>
                    </Box>
                    <Box className='slide flex-column'>
                        {slideList && slideList.map((slide, index) => {
                            return (
                                <Box key={index}>
                                    {slide}
                                </Box>
                            )
                        })}
                    </Box>
                </Box>
            </Box>
        </Box >
    )
}

export default AddLesson