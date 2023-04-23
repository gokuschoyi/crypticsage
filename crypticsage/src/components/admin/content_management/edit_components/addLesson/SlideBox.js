import React from 'react'
import {
    Box,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    useTheme
} from '@mui/material'
import { AddIcon } from '../../../../dashboard/global/Icons'
const SlideBox = (props) => {
    const theme = useTheme()
    const {
        count,
        handleRemoveSlide,
        newSlideData,
        handleSlideDataChange,
        highlightWordList,
        handleAddHighlightWord,
        handleRemoveHighlightWord,
        newHighlightWordData,
        handleHighlightWordDataChange
    } = props

    const slideStyle = {
        width: 'fill-available',
        marginTop: '15px',
        '& label.Mui-focused': {
            color: 'white !important',
        },
        '& label': {
            color: 'white',
        },
        '& .MuiOutlinedInput-root': {
            '& fieldset': {
                borderColor: 'white',
            },
        }
    }

    const handleChange = (e) => {
        handleSlideDataChange(e)
    }

    return (
        <Box className='slide-box slide-box-initial flex-column' name={`slide-${count + 1}`} id={count + 1
        }>
            <Box className='flex-row slide-padding slide-name'>
                <Typography sx={{ marginTop: '15px' }} variant='h5' color='white' textAlign='start' className='header-width slide-number'>Slide {`${count + 1}`} : </Typography>
                <TextField label='Enter slide name' size='small' id={`${count}`} name='heading' value={newSlideData[count].heading} onChange={(e) => handleChange(e)} fullWidth sx={slideStyle} className='slide-title-input' />
            </Box>
            <Box className='flex-row slide-padding slide-name' alignItems='flex-start'>
                <Typography variant='h5' color='white' textAlign='start' className='header-width margin-for-header'>Slide Content : </Typography>
                <TextField label='Enter slide content' size='small' id={`${count}`} name='content_text' value={newSlideData[count].content_text} onChange={(e) => handleChange(e)} fullWidth multiline={true} minRows='15' sx={slideStyle} className='slide-content-input content-width' />
            </Box>
            <Box className='flex-column ' sx={{ alignItems: 'flex-start', padding: '10px 0px' }}>
                <Box className='flex-row'>
                    <Typography variant='h5' color='white' textAlign='start' className='header-width '>Highlight Words </Typography>
                    <Box sx={{ width: '100%' }}>
                        <Box>
                            <Button color='secondary' onClick={(e) => handleAddHighlightWord(e)} id={`${count}`} sx={{ minWidth: 'auto' }}>
                                <AddIcon sx={{ pointerEvents: 'none' }} />
                            </Button>

                        </Box>
                    </Box>
                </Box>
                <Box sx={{ width: '100%', paddingTop: '10px' }} display='flex' justifyContent='flex-end'>
                    <Box className='highlightwordbox' sx={{ width: 'calc(100% - 160px)' }} >
                        <Box className='flex-row' sx={{ gap: '20px' }}>
                            <Box sx={{ width: '60%', paddingLeft: '10px' }}>
                                <Typography variant='h5' sx={{  }} color='white' textAlign='start' className='header-width'>Keyword</Typography>
                            </Box>
                            <Box sx={{ width: '100%' }}>
                                <Typography variant='h5' color='white' textAlign='start' className='header-width'>Explanation</Typography>
                            </Box>
                        </Box>
                        {highlightWordList[count] && highlightWordList[count].map((highlightword, index) => {
                            return (
                                React.cloneElement(highlightword, {
                                    handleRemoveHighlightWord: handleRemoveHighlightWord,
                                    handleHighlightWordDataChange: handleHighlightWordDataChange,
                                    keyword: newHighlightWordData[count][index].keyword,
                                    explanation: newHighlightWordData[count][index].explanation,
                                    parentIndex: count,
                                }
                                )
                            )
                        })}
                    </Box>
                </Box>
            </Box>
            <Box className='flex-row slide-padding slide-name' sx={{ alignItems: 'flex-start' }}>
                <Typography variant='h5' color='white' textAlign='start' className='header-width'>Media Type</Typography>
                <Box className='mediaTypePadding' sx={{ width: '100%' }}>

                    <Box className='flex-row' gap='20px'>
                        <Box sx={{ width: '60%' }}>
                            <FormControl fullWidth>
                                <InputLabel id="demo-simple-select-label" sx={{ top: '-20%' }}>Media Type</InputLabel>
                                <Select
                                    className='test'
                                    name='media_type'
                                    value={newSlideData[count].media_type}
                                    onClick={(e) => handleChange(e)}
                                    size='small'
                                    labelId="demo-simple-select-label"
                                    id={`${count}`}
                                    label="Media Type"
                                    sx={{ border: '1px solid white', marginTop: '15px' }}
                                >
                                    <MenuItem data-id={`${count}`} value="Image" data-name='media_type'>Image</MenuItem>
                                    <MenuItem data-id={`${count}`} value="Video" data-name='media_type'>Video</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ width: '100%' }}>
                            <TextField size='small' name='media_url' id={`${count}`} value={newSlideData[count].media_url} onChange={(e) => handleChange(e)} fullWidth sx={slideStyle} className='highlight-word-input' />
                        </Box>
                    </Box>
                </Box>
            </Box>
            <Box className='flex-row slide-padding slide-name' sx={{ alignItems: 'flex-start' }}>
                <Typography variant='h5' color='white' textAlign='start' className='header-width' sx={{ paddingTop: '17px' }}>Slide Times</Typography>
                <Box>
                    <Box className='flex-row'>
                        <Typography variant='h5' color='white' textAlign='start' className='header-width'>Start Time</Typography>
                        <TextField label='Time in seconds' name='start_timestamp' id={`${count}`} value={newSlideData[count].start_timestamp} onChange={(e) => handleChange(e)} size='small' sx={slideStyle} className='slide-title-input' />
                    </Box>
                    <Box className='flex-row'>
                        <Typography variant='h5' color='white' textAlign='start' className='header-width'>End Time</Typography>
                        <TextField label='Time in seconds' name='end_timestamp' id={`${count}`} value={newSlideData[count].end_timestamp} onChange={(e) => handleChange(e)} size='small' sx={slideStyle} className='slide-title-input' />
                    </Box>
                </Box>
            </Box>
            {
                count > 0 &&
                (<Box display='flex' justifyContent='flex-start'>
                    <Button
                        id={count}
                        onClick={(e) => handleRemoveSlide(e)}
                        size='small'
                        sx={{
                            width: '120px',
                            ':hover': {
                                color: 'black !important',
                                backgroundColor: '#d11d1d !important',
                                transition: '0.5s'
                            },
                            backgroundColor: `${theme.palette.secondary.main}`
                        }}
                    >REMOVE</Button>
                </Box>)
            }
        </Box >
    )
}

export default SlideBox