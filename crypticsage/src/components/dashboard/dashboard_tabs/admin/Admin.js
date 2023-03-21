import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux';
import Header from '../../global/Header';
import {
    Box,
    Typography,
    Collapse,
    Alert,
    IconButton,
    TextField,
    Button,
    useTheme,
    FormControl,
    MenuItem,
    Select,
    InputLabel
} from '@mui/material';
import { CloseIcon } from '../../global/Icons';
import './Admin.css'
import { addSection, fetchSections, fetchLessons } from '../../../../api/db';
import { AddSection, AddLesson } from './edit_components';
import SlideBox from './edit_components/addLesson/SlideBox';
const Admin = (props) => {
    const { title, subtitle } = props
    const theme = useTheme();

    const [editMode, setEditMode] = useState('add');
    const [documentType, setDocumentType] = useState('sections');
    const [sectionData, setSectionData] = useState(null);
    const token = useSelector(state => state.auth.accessToken);


    const handleDocumentType = (e) => {
        setDocumentType(e.target.value);
    }

    const handleEditState = (param) => (e) => {
        setEditMode(param);
    }

    //initial load of section data
    useEffect(() => {
        let data = {
            token: token
        }
        fetchSections(data)
            .then(res => {
                setSectionData(res.data.sections);
            })
            .catch(error => {
                console.error(error);
            })

    }, [token]);

    //initial data for new section
    const initialSectionData = {
        title: { value: '', error: false, helperText: '' },
        content: { value: '', error: false, helperText: '' },
        url: { value: '', error: false, helperText: '' },
    }

    const [newSectionData, setNewSectionData] = useState(initialSectionData);

    //handling new section data
    const handleNewSectionData = (e) => {
        const { name, value } = e.target;
        setNewSectionData({ ...newSectionData, [name]: { value: value, error: false, helperText: '' } });
    }

    //saving new section to db
    const handleSectionSubmit = async () => {
        const formFields = Object.keys(newSectionData)
        let updatedSectionData = { ...newSectionData }
        formFields.forEach(field => {
            if (newSectionData[field].value === '') {
                updatedSectionData = {
                    ...updatedSectionData,
                    [field]: {
                        ...newSectionData[field],
                        error: true,
                        helperText: 'This field is required'
                    }
                }
            } else {
                updatedSectionData = {
                    ...updatedSectionData,
                    [field]: {
                        ...newSectionData[field],
                        error: false,
                        helperText: ''
                    }
                }
            }
        })
        setNewSectionData(updatedSectionData)
        const isNotEmpty = Object.values(newSectionData).every(field => field.value !== '')

        if (isNotEmpty) {
            try {
                const sectionD = {}
                formFields.forEach((field) => {
                    sectionD[field] = newSectionData[field].value
                })
                let res = await addSection(sectionD);
                if (res.data.message) {
                    setMessage(res.data.message)
                }
            } catch (error) {
                if (error.response) {
                    setMessage(error.response.data.message)
                    console.log(error.response.data)
                }
            }
        }
        else {
            console.log('empty fields')
        }
    }

    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [selectedSectionName, setSelectSectionName] = useState('');

    //getting the section id from add lessons tab
    const handleGetSection = (e) => {
        setSelectSectionName(e.target.value); //set section name to selectSectionName
        let sectionId = sectionData.filter(section => section.title === e.target.value)[0].sectionId;  //get sectionId from sectionData
        setSelectedSectionId(sectionId); //set sectionId to selectedSectionId
        // console.log(selectedSectionId)
    }

    //initial data for new lessons slides
    const [slideList, setSlideList] = useState([<SlideBox key={0} count={0} />]);

    //add new slide to lesson
    const handleAddSlide = () => {
        setSlideList([...slideList, <SlideBox key={slideList.length} count={slideList.length} handleRemoveSlide={handleRemoveSlide} />])
    }

    //remove slide from lesson
    const handleRemoveSlide = (e) => {
        let slideToRemove = e.target.id;
        setSlideList(prevList => {
            const newList = [...prevList]
            newList.splice(slideToRemove, 1);
            const udatedList = newList.map((component, index) =>
                React.cloneElement(component, { key: index, count: index })
            );
            return udatedList;
        })
    }

    const [open, setOpen] = React.useState(false);
    const [message, setMessage] = React.useState('');

    const inputStyleLesson = {
        width: '400px',
        padding: '10px',
        color: 'white',
        '& label.Mui-focused': {
            color: 'white',
        },
        '& label': {
            color: 'red',
        },
        '& .MuiOutlinedInput-root': {
            border: '1px solid #dd2727',
        },
    }

    const highlightStyleLesson = {
        padding: '10px',
        color: 'white',
        '& label.Mui-focused': {
            color: 'white',
        },
        '& label': {
            color: 'red',
        },
        '& .MuiOutlinedInput-root': {
            border: '1px solid #dd2727',
        },
    }

    useEffect(() => {
        if (message !== '') {
            setOpen(true)
        }
    }, [message])

    const hideMessage = async () => {
        setOpen(false);
        setMessage('')
        try {
            let data = {
                token: token
            }
            let res = await fetchSections(data);
            setSectionData(res.data.sections);
        } catch (error) {
            console.log(error)
            setMessage(error.response.data.message)
        }
    }

    const [lessonContent, setLessonContent] = useState(null);

    const viewLessons = (param) => async () => {
        let data = {
            token: token,
            sectionId: param
        }
        try {
            let res = await fetchLessons(data);
            setLessonContent(res.data.lessons);
        } catch (error) {
            console.log(error)
        }
    }

    const [seletctedLesson, setSelectedLesson] = useState(null);
    const viewLessonContent = (param) => () => {
        const selected = lessonContent.find(lesson => lesson.lessonId === param)
        setSelectedLesson(selected)
    }
    // console.log(seletctedLesson)
    return (
        <Box className='admin-container'>
            <Box height='100%' width='-webkit-fill-available'>
                <Header title={title} subtitle={subtitle} />
            </Box>
            <Box className='add-content'>
                <Typography variant='h2' color='white' textAlign='start' className='add-content-title'>Add Content</Typography>
                <Box height='50px'>
                    <Collapse in={open}>
                        <Alert severity="info"
                            action={
                                <IconButton
                                    aria-label="close"
                                    color="inherit"
                                    size="small"
                                    onClick={() => hideMessage()}
                                >
                                    <CloseIcon fontSize="inherit" />
                                </IconButton>
                            }
                            sx={{ mb: 2 }}
                        >
                            {message}
                        </Alert>
                    </Collapse>
                </Box>
                <Box className='add-content-box'>
                    <Box className='edit-add-box'>
                        <Box className='add-edit-button-box'>
                            <Box display='flex' justifyContent='center' className='ac-button' >
                                <Typography
                                    sx={{ backgroundColor: editMode === 'edit' ? `${theme.palette.primary.dark}` : '#383535' }}
                                    onClick={(e) => handleEditState('add')(e)}
                                    variant='h4'
                                    color='white'
                                    textAlign='start'
                                    className='add-content-subtitle'
                                >Add</Typography>
                            </Box>
                            <Box display='flex' justifyContent='center' className='ac-button' sx={{ width: '100%' }}>
                                <Typography
                                    sx={{ backgroundColor: editMode === 'add' ? `${theme.palette.primary.dark}` : '#383535' }}
                                    onClick={(e) => handleEditState('edit')(e)}
                                    variant='h4'
                                    color='white'
                                    textAlign='start'
                                    className='add-content-subtitle'
                                >Edit</Typography>
                            </Box>
                        </Box>
                        <Box className='add-edit-content-box'>
                            {editMode === 'add' ?
                                <Box className='add-items-container'>
                                    <Box className='flex-row document-type-box' sx={{ width: '60%' }}>
                                        <Typography variant='h4' color='white' textAlign='start' className='add-content-title'>Select Type</Typography>
                                        <Box sx={{ width: '100%' }}>
                                            <FormControl fullWidth>
                                                <InputLabel id="document-type-label">Select Type</InputLabel>
                                                <Select
                                                    onChange={(e) => handleDocumentType(e)}
                                                    labelId="document-type"
                                                    id="document-type"
                                                    value={documentType}
                                                    label="Media Type"
                                                >
                                                    <MenuItem value="sections">Sections</MenuItem>
                                                    <MenuItem value="lesson">Lessons</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Box>
                                    </Box>
                                    <Box className='slected-type-box'>
                                        {documentType === 'sections' ?
                                            <AddSection
                                                newSectionData={newSectionData}
                                                handleNewSectionData={handleNewSectionData}
                                                handleSectionSubmit={handleSectionSubmit}
                                                sectionData={sectionData}
                                            />
                                            :
                                            <AddLesson
                                                sectionData={sectionData}
                                                handleGetSection={handleGetSection}
                                                selectedSectionName={selectedSectionName}
                                                handleAddSlide={handleAddSlide}
                                                slideList={slideList}
                                            />
                                        }
                                    </Box>
                                </Box>
                                :
                                <Box className='edit-items-container'>
                                    <Typography variant='h4' color='white' textAlign='start' className='add-content-title'>Edit</Typography>
                                </Box>
                            }
                        </Box>
                    </Box>

                    <Box className='lesson-title'>
                        <Box className='all-lesson'>
                            {lessonContent && lessonContent.map((lesson, index) => {
                                return (
                                    <Box key={index} className='single-lesson-box'>
                                        <Typography variant='h5' color='white' textAlign='start' >{lesson.chapter_title}</Typography>
                                        <Button
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
                                            onClick={(e) => viewLessonContent(lesson.lessonId)(e)}>View Lesson</Button>
                                    </Box>
                                )
                            })}
                        </Box>
                    </Box>
                    <Box className='edit-add-box'>
                        <Box className='add-edit-button-box'>
                            <Box display='flex' justifyContent='center' sx={{ width: '100%' }}>
                                <Button
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
                                >Edit</Button>
                            </Box>
                            <Box display='flex' justifyContent='center' sx={{ width: '100%' }}>
                                <Button
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
                                >Add</Button>
                            </Box>
                        </Box>
                        {seletctedLesson &&
                            <Box className='lesson-values'>
                                <Box className='lesson-title flex-row'>
                                    <Typography variant='h5' color='white' textAlign='start' className='header-width'>Lesson Title : </Typography>
                                    <TextField size='small' sx={inputStyleLesson} className='lesson-title-input' value={seletctedLesson.chapter_title} />
                                </Box>
                                <Box className='flex-row'>
                                    <Typography variant='h5' color='white' textAlign='start' className='header-width'>Media URL : </Typography>
                                    <TextField size='small' sx={inputStyleLesson} className='lesson-title-input' value={seletctedLesson.video_url} />
                                </Box>
                                <Box className='slide-content'>
                                    {seletctedLesson.lessonData.contents.slides.map((slide, index) => {
                                        return (
                                            <Box key={index} className='slide-box flex-column'>
                                                <Box className='flex-row slide-padding'>
                                                    <Typography variant='h5' color='white' textAlign='start' className='header-width'>Slide {index + 1} : </Typography>
                                                    <TextField size='small' sx={inputStyleLesson} className='slide-title-input' value={slide.heading} />
                                                </Box>
                                                <Box className='flex-row slide-padding' alignItems='flex-start'>
                                                    <Typography variant='h5' color='white' textAlign='start' className='header-width margin-for-header'>Slide Content : </Typography>
                                                    <TextField size='small' fullWidth multiline={true} minRows='2' sx={inputStyleLesson} className='slide-content-input content-width' value={slide.content_text} />
                                                </Box>
                                                <Box className='flex-row slide-padding' sx={{ alignItems: 'flex-start' }}>
                                                    <Typography variant='h5' color='white' textAlign='start' className='header-width '>Highlight Words </Typography>
                                                    <Box sx={{ width: '100%' }}>
                                                        <Box className='flex-row' sx={{ paddingLeft: '10px' }}>
                                                            <Box sx={{ width: '60%' }}>
                                                                <Typography variant='h5' color='white' textAlign='start' className='header-width'>Keyword</Typography>
                                                            </Box>
                                                            <Box sx={{ width: '100%' }}>
                                                                <Typography variant='h5' color='white' textAlign='start' className='header-width'>Explanation</Typography>
                                                            </Box>
                                                        </Box>
                                                        {slide.highlightWords.map((word, index) => {
                                                            return (
                                                                <Box key={index} className='highlight-word-box flex-row'>
                                                                    <Box sx={{ width: '60%' }}>
                                                                        <TextField size='small' fullWidth sx={highlightStyleLesson} className='highlight-word-input' value={word.keyword} />
                                                                    </Box>
                                                                    <Box sx={{ width: '100%' }}>
                                                                        <TextField size='small' fullWidth sx={highlightStyleLesson} className='highlight-word-input' value={word.explanation} />
                                                                    </Box>
                                                                </Box>
                                                            )
                                                        })}
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
                                                        <Box className='flex-row' sx={{ paddingTop: '10px' }}>
                                                            <Box sx={{ width: '60%' }}>
                                                                <FormControl fullWidth>
                                                                    <InputLabel id="demo-simple-select-label">Media Type</InputLabel>
                                                                    <Select
                                                                        labelId="demo-simple-select-label"
                                                                        id="demo-simple-select"
                                                                        value={slide.media_type}
                                                                        label="Media Type"
                                                                    >
                                                                        <MenuItem value="image">Image</MenuItem>
                                                                        <MenuItem value="video">Video</MenuItem>
                                                                    </Select>
                                                                </FormControl>
                                                            </Box>
                                                            <Box sx={{ width: '100%' }}>
                                                                <TextField size='small' fullWidth sx={highlightStyleLesson} className='highlight-word-input' value={slide.url} />
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                                <Box className='flex-row slide-padding' sx={{ alignItems: 'flex-start' }}>
                                                    <Typography variant='h5' color='white' textAlign='start' className='header-width' sx={{ paddingTop: '17px' }}>Slide Times</Typography>
                                                    <Box>
                                                        <Box className='flex-row'>
                                                            <Typography variant='h5' color='white' textAlign='start' className='header-width'>Start Time</Typography>
                                                            <TextField size='small' sx={inputStyleLesson} className='slide-title-input' value={slide.start_timestamp} />
                                                        </Box>
                                                        <Box className='flex-row'>
                                                            <Typography variant='h5' color='white' textAlign='start' className='header-width'>End Time</Typography>
                                                            <TextField size='small' sx={inputStyleLesson} className='slide-title-input' value={slide.end_timestamp} />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        )
                                    })}
                                </Box>
                            </Box>
                        }
                    </Box>
                </Box>
            </Box>
        </Box >
    )
}

export default Admin