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
    IconButton,
    Button,
    useTheme
} from '@mui/material'
import { AddIcon } from '../../../../dashboard/global/Icons'

const AddLesson = (props) => {
    const {
        mode, //working
        handleNewLessonDialog,
        sectionData, // for add mode
        selectedSectionLessonNames, // for add mode
        handleGetSection, // for add mode
        selectedSectionName, // for add mode
        newLessonData, //working
        handleLessonDataChange, //working
        handlelessonSave,
        slideList, //working
        handleAddSlide,  //working
        handleRemoveSlide, //working
        newSlideData, //working
        handleSlideDataChange,
        highlightWordList, //working
        handleAddHighlightWord, //working
        handleRemoveHighlightWord,
        newHighlightWordData, //working
        handleHighlightWordDataChange //working
    } = props
    const theme = useTheme()
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
                <Typography variant='h4' color='white' textAlign='start' className='add-content-subtitle'>{mode === 'add' ? 'Add Lesson' : `Edit Lesson ${newLessonData.title}`}</Typography>
                {mode === 'add' &&
                    <Box display='flex' flexDirection='row' gap='20px'>
                        <Button
                            onClick={(e) => handlelessonSave(e)}
                            size='small'
                            sx={{
                                width: '100px',
                                ':hover': {
                                    color: 'black !important',
                                    backgroundColor: '#d11d1d !important',
                                    transition: '0.5s'
                                },
                                backgroundColor: `${theme.palette.secondary.main}`
                            }}
                        >Save</Button>
                        <Button
                            value="addlesson"
                            onClick={(e) => handleNewLessonDialog(e)}
                            size='small'
                            sx={{
                                width: '100px',
                                ':hover': {
                                    color: 'black !important',
                                    backgroundColor: '#d11d1d !important',
                                    transition: '0.5s'
                                },
                                backgroundColor: `${theme.palette.secondary.main}`
                            }}
                        >New Lesson</Button>
                    </Box>
                }
            </Box>
            <Box className='section-selector'>
                {mode === 'add' &&
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box className='formcontrol-select-box'>
                            <FormControl fullWidth >
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

                        {selectedSectionName &&
                            <Box className='add-lessontab-lesson-names'>
                                <Typography variant='h4' color='white' textAlign='start' className='add-content-subtitle'>All lessons in this section</Typography>
                                <Box>
                                    <ul>
                                        {selectedSectionLessonNames && selectedSectionLessonNames.map((lesson, index) => {
                                            return (
                                                <Box key={index} className='lesson-name-box'>
                                                    <li key={index}>
                                                        <Box className='available-lesson-box'>
                                                            <Typography variant='h5' color='white' textAlign='start' className='add-content-lesson-item'>{lesson}</Typography>
                                                        </Box>
                                                    </li>
                                                </Box>
                                            )
                                        })}
                                    </ul>
                                </Box>
                            </Box>
                        }
                    </Box>
                }
                <Box className='new-lwsson-box'>
                    <Box className='lesson-title flex-row'>
                        <Typography variant='h5' color='white' textAlign='start' className='header-width-lesson'>Lesson Title : </Typography>
                        <TextField size='small' variant='outlined' name='title' value={newLessonData.title} onChange={(e) => handleLessonDataChange(e)} sx={inputStyleLesson} className='lesson-title-input' />
                    </Box>
                    <Box className='flex-row'>
                        <Typography variant='h5' color='white' textAlign='start' className='header-width-lesson'>Slide Media URL : </Typography>
                        <TextField size='small' name='lesson_video_url' value={newLessonData.lesson_video_url} onChange={(e) => handleLessonDataChange(e)} sx={inputStyleLesson} className='lesson-title-input' />
                    </Box>
                    <Box className='flex-row'>
                        <Typography variant='h5' color='white' textAlign='start' className='header-width-lesson'>Next Lesson ID : </Typography>
                        <TextField size='small' name='next_lesson_id' value={newLessonData.next_lesson_id} onChange={(e) => handleLessonDataChange(e)} sx={inputStyleLesson} className='lesson-title-input' />
                    </Box>
                    <Box className='flex-row'>
                        <Typography variant='h5' color='white' textAlign='start' className='header-width-lesson'>Previous Lession ID : </Typography>
                        <TextField size='small' name='prev_lesson_id' value={newLessonData.prev_lesson_id} onChange={(e) => handleLessonDataChange(e)} sx={inputStyleLesson} className='lesson-title-input' />
                    </Box>
                    <Box className='flex-row'>
                        <Typography variant='h5' color='white' textAlign='start' className='header-width-lesson'>Lesson Media (image) : </Typography>
                        <TextField size='small' name='lesson_logo_url' value={newLessonData.lesson_logo_url} onChange={(e) => handleLessonDataChange(e)} sx={inputStyleLesson} className='lesson-title-input' />
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
                        {slideList && slideList.map((slide) => {
                            return (
                                React.cloneElement(slide, {
                                    handleRemoveSlide: handleRemoveSlide,
                                    newSlideData: newSlideData,
                                    handleSlideDataChange: handleSlideDataChange,
                                    highlightWordList: highlightWordList,
                                    handleAddHighlightWord: handleAddHighlightWord,
                                    handleRemoveHighlightWord: handleRemoveHighlightWord,
                                    newHighlightWordData: newHighlightWordData,
                                    handleHighlightWordDataChange: handleHighlightWordDataChange
                                })
                            )
                        })}
                    </Box>
                </Box>
                <Box sx={{ marginTop: '40px' }}>
                    <Button
                        onClick={handlelessonSave}
                        size='small'
                        sx={{
                            width: '150px',
                            ':hover': {
                                color: 'black !important',
                                backgroundColor: '#d11d1d !important',
                                transition: '0.5s'
                            },
                            backgroundColor: `${theme.palette.secondary.main}`
                        }}
                    >Save</Button>
                </Box>
            </Box>
        </Box >
    )
}

export default AddLesson