import React from 'react'
import {
    Box,
    Typography,
    TextField,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    useTheme
} from '@mui/material'
import { AddIcon, DeleteOutlineOutlinedIcon } from '../../../../global/Icons'
const SlideBox = (props) => {
    const theme = useTheme()
    const { count, handleRemoveSlide } = props
    const slideStyle = {
        padding: '10px',
        '& .MuiOutlinedInput-root': {
            border: '1px solid #fff',
        }
    }
    const HighlightWords = (props) => {
        const { slideStyle, count } = props
        return (
            <Box className='highlight-word-box flex-row' sx={{ gap: '5px' }}>
                <Box sx={{ width: '60%' }}>
                    <TextField size='small' fullWidth sx={slideStyle} className='highlight-word-input' />
                </Box>
                <Box sx={{ width: '100%' }}>
                    <TextField size='small' fullWidth sx={slideStyle} className='highlight-word-input' />
                </Box>
                {count > 0 &&
                    <IconButton sx={{ height: '24px', width: '24px' }} onClick={(e) => handleRemoveHighlightWord(e)} id={count}>
                        <DeleteOutlineOutlinedIcon />
                    </IconButton>
                }
            </Box>
        )
    }

    const [highlightWordList, setHighlightWordList] = React.useState([<HighlightWords key={0} count={0} slideStyle={slideStyle} />])
    const handleAddHighlightWord = () => {
        setHighlightWordList([...highlightWordList, <HighlightWords slideStyle={slideStyle} key={highlightWordList.length} count={highlightWordList.length} handleRemoveHighlightWord={handleRemoveHighlightWord} />])
    }

    const handleRemoveHighlightWord = (e) => {
        let highlightWordToRemove = e.target.id
        setHighlightWordList(prevList => {
            const newList = [...prevList]
            newList.splice(highlightWordToRemove, 1)
            const updatedList = newList.map((item, index) =>
                React.cloneElement(item, { count: index })
            );
            return updatedList
        })
    }

    return (
        <Box className='slide-box slide-box-initial flex-column' name={`slide-${count + 1}`} id={count + 1}>
            <Box className='flex-row slide-padding'>
                <Typography variant='h5' color='white' textAlign='start' className='header-width slide-number'>Slide {`${count + 1}`} : </Typography>
                <TextField size='small' sx={slideStyle} className='slide-title-input' />
            </Box>
            <Box className='flex-row slide-padding' alignItems='flex-start'>
                <Typography variant='h5' color='white' textAlign='start' className='header-width margin-for-header'>Slide Content : </Typography>
                <TextField size='small' fullWidth multiline={true} minRows='2' sx={slideStyle} className='slide-content-input content-width' />
            </Box>
            <Box className='flex-column slide-padding' sx={{ alignItems: 'flex-start' }}>
                <Box className='flex-row'>
                    <Typography variant='h5' color='white' textAlign='start' className='header-width '>Highlight Words </Typography>
                    <Box sx={{ width: '100%' }}>
                        <Box>
                            <IconButton onClick={handleAddHighlightWord} sx={{ height: '24px', width: '24px' }}>
                                <AddIcon />
                            </IconButton>
                        </Box>
                    </Box>
                </Box>
                <Box sx={{ width: '100%', paddingTop: '10px' }} display='flex' justifyContent='flex-end'>
                    <Box sx={{ width: 'calc(100% - 160px)' }} >
                        <Box className='flex-row' sx={{ paddingLeft: '10px', gap: '5px' }}>
                            <Box sx={{ width: '60%' }}>
                                <Typography variant='h5' color='white' textAlign='start' className='header-width'>Keyword</Typography>
                            </Box>
                            <Box sx={{ width: '100%' }}>
                                <Typography variant='h5' color='white' textAlign='start' className='header-width'>Explanation</Typography>
                            </Box>
                        </Box>
                        {highlightWordList && highlightWordList.map((highlightword, index) => {
                            return (
                                <Box key={index}>
                                    {highlightword}
                                </Box>
                            )
                        })}
                    </Box>
                </Box>
            </Box>
            <Box className='flex-row slide-padding' sx={{ alignItems: 'flex-start' }}>
                <Typography variant='h5' color='white' textAlign='start' className='header-width'>Media Type</Typography>
                <Box sx={{ width: '100%' }}>
                    <Box className='flex-row' sx={{ paddingLeft: '10px' }}>
                        <Box sx={{ width: '60%' }}>
                            <Typography variant='h5' color='white' textAlign='start' className='header-width'>Media Type</Typography>
                        </Box>
                        <Box sx={{ width: '100%' }}>
                            <Typography variant='h5' color='white' textAlign='start' className='header-width'>URL</Typography>
                        </Box>
                    </Box>
                    <Box className='flex-row' sx={{ paddingTop: '10px', paddingLeft: '10px' }}>
                        <Box sx={{ width: '60%' }}>
                            <FormControl fullWidth>
                                <InputLabel id="demo-simple-select-label" sx={{ top: '-20%' }}>Media Type</InputLabel>
                                <Select
                                    size='small'
                                    labelId="demo-simple-select-label"
                                    id="demo-simple-select"
                                    value=''
                                    label="Media Type"
                                    sx={{ border: '1px solid white' }}
                                >
                                    <MenuItem value="image">Image</MenuItem>
                                    <MenuItem value="video">Video</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ width: '100%' }}>
                            <TextField size='small' fullWidth sx={slideStyle} className='highlight-word-input' />
                        </Box>
                    </Box>
                </Box>
            </Box>
            <Box className='flex-row slide-padding' sx={{ alignItems: 'flex-start' }}>
                <Typography variant='h5' color='white' textAlign='start' className='header-width' sx={{ paddingTop: '17px' }}>Slide Times</Typography>
                <Box sx={{ paddingLeft: '10px' }}>
                    <Box className='flex-row'>
                        <Typography variant='h5' color='white' textAlign='start' className='header-width'>Start Time</Typography>
                        <TextField size='small' sx={slideStyle} className='slide-title-input' />
                    </Box>
                    <Box className='flex-row'>
                        <Typography variant='h5' color='white' textAlign='start' className='header-width'>End Time</Typography>
                        <TextField size='small' sx={slideStyle} className='slide-title-input' />
                    </Box>
                </Box>
            </Box>
            {count > 0 &&
                (<Box display='flex' justifyContent='flex-start'>
                    <Button
                        id={count}
                        onClick={(e) => handleRemoveSlide(e)}
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
                    >REMOVE</Button>
                </Box>)
            }
        </Box>
    )
}

export default SlideBox