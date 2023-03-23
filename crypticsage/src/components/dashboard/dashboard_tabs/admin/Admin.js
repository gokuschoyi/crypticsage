import React, { useState, useEffect } from 'react'
import { useOutletContext } from "react-router-dom";
import { useSelector } from 'react-redux';
import Header from '../../global/Header';
import { toast } from 'react-toastify';
import {
    Box,
    Typography,
    TextField,
    Button,
    useTheme,
    FormControl,
    MenuItem,
    Select,
    InputLabel,
    Divider
} from '@mui/material';
import './Admin.css'
import { addSection, fetchSections, fetchLessons, updateSection } from '../../../../api/db';
import { AddSection, AddLesson } from './edit_components';
import SlideBox from './edit_components/addLesson/SlideBox';
import HighLightWordBox from './edit_components/addLesson/HighLightWordBox';
import UpdateSection from './edit_components/updateSection/UpdateSection';
const Admin = (props) => {
    const { title, subtitle } = props
    const theme = useTheme();

    const [setTest] = useOutletContext();
    const hide = () => {
        setTest(true);
    }

    const [editMode, setEditMode] = useState('add');
    const [documentType, setDocumentType] = useState('lesson');
    const [sectionData, setSectionData] = useState(null);
    const token = useSelector(state => state.auth.accessToken);

    const handleDocumentType = (e) => {
        setDocumentType(e.target.value);
    }

    const handleEditState = (param) => (e) => {
        setEditMode(param);
    }

    const successToast = (message) => {
        toast.success(message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            toastId: `addedit${String.fromCharCode(Math.floor(Math.random() * 26) + 65)}`,
            type: alert.type,
            onClose: () => refreshSection()
        })
    }

    const errorToast = (message) => {
        toast.error(message, {
            position: "top-right",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            toastId: `addedit${String.fromCharCode(Math.floor(Math.random() * 26) + 65)}`,
            type: alert.type,
        })
    }

    const refreshSection = async () => {
        try {
            let data = {
                token: token
            }
            let res = await fetchSections(data);
            setSectionData(res.data.sections);
            setNewSectionData(initialSectionData);
        } catch (error) {
            console.log(error)
            errorToast('Error refreshing section data')
        }
    }

    // ---> ADD ENTIRE LESSON DATA <--- //
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
                    successToast(res.data.message)
                }
            } catch (error) {
                if (error.response) {
                    errorToast(error.response.data.message)
                }
            }
        }
        else {
            console.log('empty fields')
        }
    }

    //refresh section data
    const refreshSectionData = async () => {
        try {
            let data = {
                token: token
            }
            let res = await fetchSections(data);
            setSectionData(res.data.sections);
            successToast('Section data refreshed')
        } catch (error) {
            console.log(error)
            errorToast('Error refreshing section data')
        }
    }

    //GETTING SECTION ID FROM ADD LESSONS TAB
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [selectedSectionName, setSelectSectionName] = useState('');

    //getting the section id from add lessons tab
    const handleGetSection = (e) => {
        setSelectSectionName(e.target.value); //set section name to selectSectionName
        let sectionId = sectionData.filter(section => section.title === e.target.value)[0].sectionId;  //get sectionId from sectionData
        setSelectedSectionId(sectionId); //set sectionId to selectedSectionId
        // console.log(selectedSectionId)
    }

    //initial data when add lesson is rendered
    const initialHighlightWordData = {
        keyword: '',
        explanation: '',
        id: '',
    }

    const initialSlideData = {
        heading: '',
        content_text: '',
        media_type: '',
        start_timestamp: '',
        end_timestamp: '',
        media_url: '',
    }

    const initialLessonData = {
        title: '',
        lesson_video_url: '',
        next_lesson_id: '',
        prev_lesson_id: '',
        lesson_logo_url: '',
        content: {}
    }

    //LESSON LEVEL : handling new lesson data
    const [newLessonData, setNewLessonData] = useState(initialLessonData);
    const handleLessonDataChange = (e) => {
        const { name, value } = e.target;
        // console.log(name, value)
        setNewLessonData({ ...newLessonData, [name]: value });
    }

    //HIGHLIGHT_WORD LEVEL : handling new highligh word data
    const [newHighlightWordData, setNewHighlightWordData] = useState([[initialHighlightWordData]]);
    const handleHighlightWordDataChange = (e) => {
        // console.log(e)
        const { name, value } = e.target;
        const { id, parentId } = e.target.dataset;
        // console.log(name, value, id, parentId)
        let newArray = [...newHighlightWordData];
        newArray[parentId][id][name] = value;
        setNewHighlightWordData(newArray);
    }

    //HIGHLIGHT_WORD LEVEL : additional highlight word component to be rendered
    const [highlightWordList, setHighlightWordList] = useState([[<HighLightWordBox key={0} count={0} />]])
    const handleAddHighlightWord = (e) => {
        const { id } = e.target
        console.log(id)

        let updatedHighLightWordList = highlightWordList
        updatedHighLightWordList[id] = [...updatedHighLightWordList[id], <HighLightWordBox key={updatedHighLightWordList[id].length} count={updatedHighLightWordList[id].length} />]
        // console.log(updatedHighLightWordList)
        setHighlightWordList(updatedHighLightWordList)

        let updatedHighlightWordData = [...newHighlightWordData]
        updatedHighlightWordData[id] = [initialHighlightWordData, ...updatedHighlightWordData[id]]
        setNewHighlightWordData(updatedHighlightWordData)
    }

    //HIGHLIGHT_WORD LEVEL : remove highlight word from slide
    const handleRemoveHighlightWord = (e) => {
        let parentId = e.target.dataset.parentId;
        let highlightWordToRemove = e.target.dataset.id;
        console.log(parentId, highlightWordToRemove)

        let updatedHighlightWordData = [...newHighlightWordData]
        updatedHighlightWordData[parentId].splice(highlightWordToRemove, 1)
        setNewHighlightWordData(updatedHighlightWordData)

        let updatedHighlightWordList = [...highlightWordList]
        updatedHighlightWordList[parentId].splice(highlightWordToRemove, 1)
        const transform = () => {
            return updatedHighlightWordList[parentId].map((item, index) => {
                return React.cloneElement(item, { key: index, count: index })
            })
        }
        updatedHighlightWordList[parentId] = transform()
        setHighlightWordList(updatedHighlightWordList)
    }

    //SLIDE LEVEL : handling new slide data
    const [newSlideData, setNewSlideData] = useState([initialSlideData]);
    const handleSlideDataChange = (e) => {
        let name = e.target.name || e.target.dataset.name;
        let value = e.target.value || e.target.dataset.value;
        let id = e.target.id || e.target.dataset.id;

        let newArray = [...newSlideData];
        newArray[id][name] = value;
        setNewSlideData(newArray);
    }

    //SLIDE LEVEL : initial slide component to be rendered
    const [slideList, setSlideList] = useState([<SlideBox key={0} count={0} />]);

    //SLIDE LEVEL : add new slide to lesson
    const handleAddSlide = (e) => {
        let count = slideList.length

        let updatedHBoxList = highlightWordList;
        updatedHBoxList[count] = [<HighLightWordBox key={0} count={0} />]
        setHighlightWordList(updatedHBoxList)

        let updatedHighlightWordData = newHighlightWordData
        updatedHighlightWordData[count] = [initialHighlightWordData]
        setNewHighlightWordData(updatedHighlightWordData)

        let updatedSlideData = newSlideData
        updatedSlideData[slideList.length] = initialSlideData
        setNewSlideData(updatedSlideData)
        setSlideList([...slideList, <SlideBox key={slideList.length} count={count} />])
    }

    //SLIDE LEVEL : remove slide data from newSlideData helper function
    const removeSlideData = (id) => {
        // console.log("remove slide data", id)
        let updatedSlideData = newSlideData
        updatedSlideData.splice(id, 1)
        setNewSlideData(updatedSlideData)

        let updatedHBoxList = highlightWordList;
        updatedHBoxList.splice(id, 1)
        setHighlightWordList(updatedHBoxList)

        let updatedHighlightWordData = newHighlightWordData
        updatedHighlightWordData.splice(id, 1)
        setNewHighlightWordData(updatedHighlightWordData)
        // setNewSlideData(updatedSlideData)
    }

    //SLIDE LEVEL : remove slide from lesson
    const handleRemoveSlide = (e) => {
        let slideToRemove = e.target.id;
        // console.log(slideToRemove)
        removeSlideData(slideToRemove)
        // console.log(newSlideData)
        setSlideList(prevList => {
            const newList = [...prevList]
            newList.splice(slideToRemove, 1);
            const udatedList = newList.map((component, index) =>
                React.cloneElement(component, { key: index, count: index })
            );
            return udatedList;
        })
    }

    //save lesson to db
    const handlelessonSave = () => {
        const finalLessonData = {
            chapter_title: '',
            sectionId: '',
            lessonData: {}
        }
        finalLessonData.chapter_title = newLessonData.title;
        finalLessonData.sectionId = selectedSectionId;

        let lessonData = newLessonData;

        const updatedSlideInfo = newSlideData.map((slide, index) => {
            return {
                ...slide,
                highlightWords: newHighlightWordData[index]
            }
        })

        lessonData.contents = { slides: updatedSlideInfo };
        finalLessonData.lessonData = lessonData;
        console.log(finalLessonData)
        console.log('save lesson')
    }
    // ---> ADD ENTIRE LESSON DATA <--- //


    // ---> EDIT ENTIRE SECTION DATA <--- //
    const [editSectionName, setEditSectionName] = useState(''); //to be displayed in select box
    const [selectedSectionData, setSelectedSectionData] = useState({}); //to be used in db query

    //getting the sectionId from the section data, filtering based on id and passed to UpdateSection
    const handleEditGetSection = (e) => {
        setEditSectionName(e.target.value)
        let selectedSectionData = sectionData.filter(section => section.title === e.target.value)[0];
        let sectionId = selectedSectionData.sectionId;
        delete selectedSectionData._id
        setSelectedSectionData(selectedSectionData)
        viewLessons(sectionId)
        console.log(sectionId)
        // console.log(lessonContent)
    }

    //handles the changes in the input fields
    const handleUpdateSectionData = (e) => {
        const { name, value } = e.target;
        setSelectedSectionData(prevState => ({
            ...prevState, [name]: value
        }))
        console.log(name, value)
    }

    //handles the submit button to save the section datato db
    const handleUpdateSectionSubmit = async () => {
        console.log('saved to db ')
        if (selectedSectionData === {}) {
            console.log('no data')
        } else {
            try {
                let data = {
                    token: token,
                    payload: selectedSectionData
                }
                let res = await updateSection(data)
                if (res.data.message) {
                    successToast(res.data.message)
                }
            } catch (err) {
                if (err.response) {
                    errorToast(err.response.data.message)
                }
            }
        }
    }

    // ---> EDIT ENTIRE SECTION DATA <--- //


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

    //all lessons associated with the section id
    const [lessonContent, setLessonContent] = useState(null);

    //fetches the lessons from db based on sectionID
    async function viewLessons(sectionId) {
        console.log("view lessons")
        let data = {
            token: token,
            sectionId: sectionId
        }
        try {
            let res = await fetchLessons(data);
            setLessonContent(res.data.lessons);
            if (res.data.message) {
                successToast(res.data.message)
            }
        } catch (error) {
            if (error.response) {
                errorToast(error.response.data.message)
            }
        }
    }

    //setting the selected lesson data to be displayed in the edit lesson section
    const [seletctedLesson, setSelectedLesson] = useState(null);
    const viewLessonContent = (e) => {
        let param = e.target.value;
        const selectedLesson = lessonContent.find(lesson => lesson.lessonId === param)
        setSelectedLesson(selectedLesson)
    }

    return (
        <Box className='admin-container' onClick={hide}>
            <Box height='100%' width='-webkit-fill-available'>
                <Header title={title} subtitle={subtitle} />
            </Box>
            <Box className='add-content'>
                <Typography variant='h2' color='white' textAlign='start' className='add-content-title'>Add Content</Typography>
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
                                                refreshSectionData={refreshSectionData}
                                            />
                                            :
                                            <AddLesson
                                                mode={editMode}
                                                sectionData={sectionData}
                                                handleGetSection={handleGetSection}
                                                selectedSectionName={selectedSectionName}
                                                handleAddSlide={handleAddSlide}
                                                slideList={slideList}
                                                handlelessonSave={handlelessonSave}
                                                newLessonData={newLessonData}
                                                handleLessonDataChange={handleLessonDataChange}
                                                count={slideList.length}
                                                handleRemoveSlide={handleRemoveSlide}
                                                newSlideData={newSlideData}
                                                handleSlideDataChange={handleSlideDataChange}
                                                highlightWordList={highlightWordList}
                                                handleAddHighlightWord={handleAddHighlightWord}
                                                handleRemoveHighlightWord={handleRemoveHighlightWord}
                                                newHighlightWordData={newHighlightWordData}
                                                handleHighlightWordDataChange={handleHighlightWordDataChange}
                                            />
                                        }
                                    </Box>
                                </Box>
                                :
                                <Box className='edit-items-container'>
                                    <Typography variant='h4' color='white' textAlign='start' className='add-content-title'>Edit</Typography>
                                    <Box sx={{ marginTop: '20px' }}>
                                        <Box sx={{ width: '60%' }}>
                                            <FormControl fullWidth>
                                                <InputLabel id="select-section-edit-label">Select a Section</InputLabel>
                                                <Select
                                                    onChange={(e) => handleEditGetSection(e)}
                                                    labelId="select-section-edit"
                                                    id="select-section-edit"
                                                    value={editSectionName}
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
                                        {Object.keys(selectedSectionData).length !== 0 &&
                                            <UpdateSection
                                                selectedSectionData={selectedSectionData}
                                                handleUpdateSectionData={handleUpdateSectionData}
                                                handleUpdateSectionSubmit={handleUpdateSectionSubmit}
                                            />}
                                    </Box>
                                    <Divider sx={{ marginTop: '10px', marginBottom: '10px' }} />
                                    <Box className='lessons-list-box'>
                                        <Box className='lessons-list-box-action'>
                                            <Typography variant='h4' color='white' textAlign='start' className='add-content-title'>Lessons for {selectedSectionData.title}</Typography>
                                        </Box>
                                        <Box className='lesson-title'>
                                            <Box className='all-lesson'>
                                                {lessonContent && lessonContent.map((lesson, index) => {
                                                    return (
                                                        <Box key={index} className='single-lesson-box'>
                                                            <Typography variant='h5' color='white' textAlign='start' >{lesson.chapter_title}</Typography>
                                                            <Button
                                                                value={lesson.lessonId}
                                                                onClick={(e) => viewLessonContent(e)}
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
                                                            >View </Button>
                                                        </Box>
                                                    )
                                                })}
                                            </Box>
                                            <Box className='single-lesson-content'>
                                                
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            }
                        </Box>
                    </Box>


                    {/* <Box sx={{ marginTop: '40px' }} className='edit-add-box'>
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
                    </Box> */}
                </Box>
            </Box>
        </Box >
    )
}

export default Admin