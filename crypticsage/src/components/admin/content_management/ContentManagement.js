import React, { useState, useEffect } from 'react'
import { useOutletContext } from "react-router-dom";
import { useSelector } from 'react-redux';
import AdminHeader from '../global/AdminHeader';
import NewLessonDialog from './edit_components/addLesson/NewLessonDialog';
import { toast } from 'react-toastify';
import {
    Box,
    Typography,
    Skeleton,
    Button,
    useTheme,
    FormControl,
    MenuItem,
    Select,
    InputLabel,
    Divider
} from '@mui/material';
import './ContentManagement.css'
import { fetchSections, addSection, updateSection, fetchLessons, addLesson, updateLesson } from '../../../api/db';
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
    const [open, setOpen] = useState(false);

    // new lesson dialog box
    const handleNewLessonDialog = (e) => {
        setOpen(true)
    }

    const handleClose = () => {
        setOpen(false);
    };

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
    }

    //LESSON LEVEL : handling new lesson data. Saved based on editMode
    const [newLessonData, setNewLessonData] = useState(initialLessonData);
    const handleLessonDataChange = (e) => {
        const { name, value } = e.target;
        switch (editMode) {
            case 'add':
                setNewLessonData({ ...newLessonData, [name]: value });
                break;
            case 'edit':
                setLessonDataToUpdate({ ...lessonDataToUpdate, [name]: value })
                break;
            default:
                break;
        }
    }

    //HIGHLIGHT_WORD LEVEL : handling new highligh word data
    const [newHighlightWordData, setNewHighlightWordData] = useState([[initialHighlightWordData]]);
    const handleHighlightWordDataChange = (e) => {
        const { name, value } = e.target;
        const { id, parentId } = e.target.dataset;
        let newArray
        switch (editMode) {
            case 'add':
                newArray = [...newHighlightWordData];
                newArray[parentId][id][name] = value;
                setNewHighlightWordData(newArray);
                break;
            case 'edit':
                newArray = [...highlightWordDataToUpdate];
                newArray[parentId][id][name] = value;
                setHighlightWordDataToUpdate(newArray);
                break;
            default:
                break;
        }
    }

    //HIGHLIGHT_WORD LEVEL : additional highlight word component to be rendered
    const [highlightWordList, setHighlightWordList] = useState([[<HighLightWordBox key={0} count={0} />]])
    const handleAddHighlightWord = (e) => {
        const { id } = e.target
        let updatedHighLightWordList, updatedHighlightWordData
        switch (editMode) {
            case 'add':
                console.log("add : add highlight")
                updatedHighLightWordList = highlightWordList
                updatedHighlightWordData = [...newHighlightWordData]

                updatedHighLightWordList[id] = [...updatedHighLightWordList[id], <HighLightWordBox key={updatedHighLightWordList[id].length} count={updatedHighLightWordList[id].length} />]
                setHighlightWordList(updatedHighLightWordList)

                updatedHighlightWordData[id] = [initialHighlightWordData, ...updatedHighlightWordData[id]]
                setNewHighlightWordData(updatedHighlightWordData)
                break;
            case 'edit':
                console.log("edit : remove highlight")
                updatedHighLightWordList = highlightWordListToUpdate
                updatedHighlightWordData = [...highlightWordDataToUpdate]

                updatedHighLightWordList[id] = [...updatedHighLightWordList[id], <HighLightWordBox key={updatedHighLightWordList[id].length} count={updatedHighLightWordList[id].length} />]
                setHighlightWordListToUpdate(updatedHighLightWordList)

                updatedHighlightWordData[id] = [initialHighlightWordData, ...updatedHighlightWordData[id]]
                setHighlightWordDataToUpdate(updatedHighlightWordData)
                break;
            default:
                break;
        }
    }

    //HIGHLIGHT_WORD LEVEL : remove highlight word from slide
    const handleRemoveHighlightWord = (e) => {
        let parentId = e.target.dataset.parentId;
        let highlightWordToRemove = e.target.dataset.id;
        let updatedHighlightWordData, updatedHighlightWordList

        switch (editMode) {
            case 'add':
                console.log("add : remove highlight")
                updatedHighlightWordData = [...newHighlightWordData]
                updatedHighlightWordList = [...highlightWordList]

                updatedHighlightWordData[parentId].splice(highlightWordToRemove, 1)
                setNewHighlightWordData(updatedHighlightWordData)

                updatedHighlightWordList[parentId].splice(highlightWordToRemove, 1)

                const transformOne = () => {
                    return updatedHighlightWordList[parentId].map((item, index) => {
                        return React.cloneElement(item, { key: index, count: index })
                    })
                }

                updatedHighlightWordList[parentId] = transformOne()
                setHighlightWordList(updatedHighlightWordList)
                break;
            case 'edit':
                console.log("edit : remove highlight")
                updatedHighlightWordData = [...highlightWordDataToUpdate]
                updatedHighlightWordList = [...highlightWordListToUpdate]

                updatedHighlightWordData[parentId].splice(highlightWordToRemove, 1)
                setHighlightWordDataToUpdate(updatedHighlightWordData)

                updatedHighlightWordList[parentId].splice(highlightWordToRemove, 1)

                const transformTwo = () => {
                    return updatedHighlightWordList[parentId].map((item, index) => {
                        return React.cloneElement(item, { key: index, count: index })
                    })
                }

                updatedHighlightWordList[parentId] = transformTwo()
                setHighlightWordListToUpdate(updatedHighlightWordList)
                break;
            default:
                break;
        }


    }

    //SLIDE LEVEL : handling new slide data
    const [newSlideData, setNewSlideData] = useState([initialSlideData]);
    const handleSlideDataChange = (e) => {
        let name = e.target.name || e.target.dataset.name;
        let value = e.target.value || e.target.dataset.value;
        let id = e.target.id || e.target.dataset.id;
        let newArray
        switch (editMode) {
            case 'add':
                newArray = [...newSlideData];
                newArray[id][name] = value;
                setNewSlideData(newArray);
                break;
            case 'edit':
                newArray = [...slideDataToUpdate];
                newArray[id][name] = value;
                setSlideDataToUpdate(newArray);
                break;
            default:
                break;
        }

    }

    //SLIDE LEVEL : initial slide component to be rendered
    const [slideList, setSlideList] = useState([<SlideBox key={0} count={0} />]);

    //SLIDE LEVEL : add new slide to lesson
    const handleAddSlide = (e) => {
        let updatedHBoxList, updatedHighlightWordData, updatedSlideData, count
        switch (editMode) {
            case 'add':
                console.log("add mode slide")
                count = slideList.length
                updatedHBoxList = highlightWordList;
                updatedHighlightWordData = newHighlightWordData
                updatedSlideData = newSlideData

                updatedHBoxList[count] = [<HighLightWordBox key={0} count={0} />]
                setHighlightWordList(updatedHBoxList)

                updatedHighlightWordData[count] = [initialHighlightWordData]
                setNewHighlightWordData(updatedHighlightWordData)

                updatedSlideData[slideList.length] = initialSlideData
                setNewSlideData(updatedSlideData)
                setSlideList([...slideList, <SlideBox key={slideList.length} count={count} />])
                break;
            case 'edit':
                console.log("edit mode slide")
                count = slideListToUpdate.length
                updatedHBoxList = highlightWordListToUpdate;
                updatedHighlightWordData = highlightWordDataToUpdate
                updatedSlideData = slideDataToUpdate

                updatedHBoxList[count] = [<HighLightWordBox key={0} count={0} />]
                setHighlightWordListToUpdate(updatedHBoxList)

                updatedHighlightWordData[count] = [initialHighlightWordData]
                setHighlightWordDataToUpdate(updatedHighlightWordData)

                updatedSlideData[slideListToUpdate.length] = initialSlideData
                setSlideDataToUpdate(updatedSlideData)
                setSlideListToUpdate([...slideListToUpdate, <SlideBox key={slideListToUpdate.length} count={count} />])
                break;
            default:
                break;
        }
    }

    //SLIDE LEVEL : remove slide from lesson
    const handleRemoveSlide = (e) => {
        let id = e.target.id;
        let updatedSlideData, updatedHBoxList, updatedHighlightWordData
        switch (editMode) {
            case 'add':
                console.log("add mode remove")
                updatedSlideData = newSlideData
                updatedHBoxList = highlightWordList
                updatedHighlightWordData = newHighlightWordData

                updatedSlideData.splice(id, 1)
                setNewSlideData(updatedSlideData)

                updatedHBoxList.splice(id, 1)
                setHighlightWordList(updatedHBoxList)

                updatedHighlightWordData.splice(id, 1)
                setNewHighlightWordData(updatedHighlightWordData)

                setSlideList(prevList => {
                    const newList = [...prevList]
                    newList.splice(id, 1);
                    const udatedList = newList.map((component, index) =>
                        React.cloneElement(component, { key: index, count: index })
                    );
                    return udatedList;
                })
                break;
            case 'edit':
                console.log("edit mode remove")
                updatedSlideData = slideDataToUpdate
                updatedHBoxList = highlightWordListToUpdate
                updatedHighlightWordData = highlightWordDataToUpdate

                updatedSlideData.splice(id, 1)
                setSlideDataToUpdate(updatedSlideData)

                updatedHBoxList.splice(id, 1)
                setHighlightWordListToUpdate(updatedHBoxList)

                updatedHighlightWordData.splice(id, 1)
                setHighlightWordDataToUpdate(updatedHighlightWordData)

                setSlideListToUpdate(prevList => {
                    const newList = [...prevList]
                    newList.splice(id, 1);
                    const udatedList = newList.map((component, index) =>
                        React.cloneElement(component, { key: index, count: index })
                    );
                    return udatedList;
                })
                break;
            default:
                break;
        }
    }

    //save lesson to db
    const [lessonId, setLessonId] = useState('')
    const handlelessonSave = async () => {
        setOpen(false)
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


        if (lessonId === '') {
            console.log("initial save")
            let payload = {
                token: token,
                data: finalLessonData
            }
            try {
                let res = await addLesson(payload)
                if (res.data.message) {
                    setLessonId(res.data.lessonId)
                    successToast(res.data.message)
                }
            } catch (err) {
                if (err.response) {
                    errorToast(err.response.data.message)
                }
            }
        } else {
            console.log("update save")
            finalLessonData.lessonId = lessonId;
            let payload = {
                token: token,
                data: finalLessonData
            }
            try {
                let res = await updateLesson(payload)
                if (res.data.message) {
                    successToast(res.data.message)
                }
            } catch (err) {
                if (err.response) {
                    errorToast(err.response.data.message)
                }
            }
        }
        console.log('add : add lesson')
    }
    // ---> ADD ENTIRE LESSON DATA <--- //


    // ---> EDIT ENTIRE SECTION DATA <--- //
    const [editSectionName, setEditSectionName] = useState(''); //to be displayed in select box
    const [selectedSectionData, setSelectedSectionData] = useState({}); //to be used in db query

    const [sectionSkeletonFlag, setSectionSkeletonFlag] = useState(false); //to display skeleton loader

    //getting the sectionId from the section data, filtering based on id and passed to UpdateSection
    const handleEditGetSection = (e) => {
        setEditSectionName(e.target.value)
        setSectionSkeletonFlag(true)
        let selectedSectionData = sectionData.filter(section => section.title === e.target.value)[0];
        let sectionId = selectedSectionData.sectionId;
        delete selectedSectionData._id
        setSelectedSectionData(selectedSectionData)
        setSelectedLesson(null)
        setLessonDataToUpdate()
        setSlideListToUpdate([])
        setSlideDataToUpdate([])
        setHighlightWordListToUpdate([[]])
        setHighlightWordDataToUpdate([[]])
        viewLessons(sectionId)
        console.log(sectionId)
        const timer = setTimeout(() => {
            setSectionSkeletonFlag(false)
        }, 1000);
        return () => clearTimeout(timer);
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

    //all lessons associated with the section id
    const [lessonContent, setLessonContent] = useState(null);

    //fetches the lessons from db based on sectionID
    async function viewLessons(sectionId) {
        console.log("view lessons for section")
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
    const [selectedLesson, setSelectedLesson] = useState(null); //all lessons for a specific section
    const [lessonDataToUpdate, setLessonDataToUpdate] = useState() //1 lesson based on selected lesson
    const [slideListToUpdate, setSlideListToUpdate] = useState([]) //slide list for the selected lesson
    const [slideDataToUpdate, setSlideDataToUpdate] = useState([]) //slide data for the selected lesson
    const [highlightWordListToUpdate, setHighlightWordListToUpdate] = useState([[]]) //highlight word list for the selected lesson
    const [highlightWordDataToUpdate, setHighlightWordDataToUpdate] = useState([[]]) //highlight word data for the selected lesson

    const [skeletonFlag, setSkeletonFlag] = useState(false)

    //load the single lesson data and initialize the states
    const viewLessonContent = (e) => {
        setSkeletonFlag(true)
        setSelectedLesson(null)
        setLessonDataToUpdate()
        setSlideListToUpdate([])
        setSlideDataToUpdate([])
        setHighlightWordListToUpdate([[]])
        setHighlightWordDataToUpdate([[]])
        let param = e.target.value;
        const selectedLesson = lessonContent.find(lesson => lesson.lessonId === param)
        setSelectedLesson(selectedLesson)

        //change key values after updating db
        let lessonData = {
            'title': selectedLesson.lessonData.title,
            'lesson_video_url': selectedLesson.lessonData.lesson_video_url,
            'next_lesson_id': selectedLesson.lessonData.next_lesson_id,
            'prev_lesson_id': selectedLesson.lessonData.prev_lesson_id,
            'lesson_logo_url': selectedLesson.lessonData.lesson_logo_url,
            'sectionId': selectedLesson.sectionId,
        }
        setLessonDataToUpdate(lessonData)

        let newSlideList = []
        selectedLesson.lessonData.contents.slides.map((slide, index) => {
            return newSlideList.push(
                <SlideBox key={index} count={index} />
            )
        })
        setSlideListToUpdate(newSlideList)

        let newSlideData = []
        selectedLesson.lessonData.contents.slides.map((slide, index) => {
            return newSlideData.push({
                "heading": slide.heading,
                "content_text": slide.content_text,
                "media_type": slide.media_type,
                "start_timestamp": slide.start_timestamp,
                "end_timestamp": slide.end_timestamp,
                "media_url": slide.media_url,
            })
        })
        setSlideDataToUpdate(newSlideData)

        let newHighlightWordList = []
        selectedLesson.lessonData.contents.slides.map((slide) => {
            return newHighlightWordList.push(slide.highlightWords.map((word, index) => {
                return <HighLightWordBox key={index} count={index} />
            }))
        })
        setHighlightWordListToUpdate(newHighlightWordList)

        let newHighlightWordData = []
        selectedLesson.lessonData.contents.slides.map((slide) => {
            return newHighlightWordData.push(slide.highlightWords.map((word, index) => {
                return {
                    "keyword": word.keyword,
                    "explanation": word.explanation,
                    "id": word.id,
                }
            }))
        })
        setHighlightWordDataToUpdate(newHighlightWordData)

        const timer = setTimeout(() => {
            setSkeletonFlag(false)
        }, 1000);
        return () => clearTimeout(timer);
    }

    // handle save for edit tab data
    const handleUpdateLessonSave = async () => {
        const finalLessonData = {
            chapter_title: '',
            sectionId: '',
            lessonData: {},
            lessonId: selectedLesson.lessonId
        }
        finalLessonData.chapter_title = lessonDataToUpdate.title;
        finalLessonData.sectionId = lessonDataToUpdate.sectionId;

        let lessonData = lessonDataToUpdate;

        const updatedSlideInfo = slideDataToUpdate.map((slide, index) => {
            return {
                ...slide,
                highlightWords: highlightWordDataToUpdate[index]
            }
        })

        lessonData.contents = { slides: updatedSlideInfo };
        finalLessonData.lessonData = lessonData;
        let payload = {
            token: token,
            data: finalLessonData
        }
        try {
            let res = await updateLesson(payload)
            if (res.data.message) {
                successToast(res.data.message)
            }
        } catch (err) {
            if (err.response) {
                errorToast(err.response.data.message)
            }
        }
        console.log('edit : save lesson')

    }

    // ---> EDIT ENTIRE SECTION DATA <--- //    

    // reset add  lessons to initial state
    const resetAddSection = () => {
        setOpen(false)
        console.log("reset")
        setNewLessonData(initialLessonData);
        setNewHighlightWordData([[initialHighlightWordData]]);
        setHighlightWordList([[<HighLightWordBox key={0} count={0} />]]);
        setNewSlideData([initialSlideData]);
        setSlideList([<SlideBox key={0} count={0} />]);
        setLessonId('')
    }

    return (
        <Box className='admin-container' onClick={hide}>
            <Box height='100%' width='-webkit-fill-available'>
                <AdminHeader title={title} subtitle={subtitle} />
            </Box>
            <Box className='add-content'>
                <NewLessonDialog
                    open={open}
                    handleClose={handleClose}
                    resetAddSection={resetAddSection}
                />
                <Typography variant='h2'  textAlign='start' className='add-content-title'>Add Content</Typography>
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
                                                handleNewLessonDialog={handleNewLessonDialog}
                                                sectionData={sectionData}
                                                handleGetSection={handleGetSection}
                                                selectedSectionName={selectedSectionName}
                                                newLessonData={newLessonData}
                                                handleAddSlide={handleAddSlide}
                                                handleLessonDataChange={handleLessonDataChange}
                                                handlelessonSave={handlelessonSave}
                                                slideList={slideList}
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
                                        <Box>
                                            {sectionSkeletonFlag && <Skeleton variant="rectangular" width='100%' height='600px' />}
                                            {Object.keys(selectedSectionData).length !== 0 && !sectionSkeletonFlag &&
                                                <UpdateSection
                                                    selectedSectionData={selectedSectionData}
                                                    handleUpdateSectionData={handleUpdateSectionData}
                                                    handleUpdateSectionSubmit={handleUpdateSectionSubmit}
                                                />}
                                        </Box>
                                    </Box>
                                    {editSectionName &&
                                        <Box className='lessons-list-box'>
                                            <Divider sx={{ marginTop: '10px', marginBottom: '10px' }} />
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
                                                    })
                                                    }
                                                </Box>
                                            </Box>
                                            <Divider sx={{ marginTop: '10px', marginBottom: '10px' }} />
                                            <Box className='lesson-content-box'>
                                                <Box className='single-lesson-content'>
                                                    {skeletonFlag && <Skeleton variant="rectangular" width='100%' height='600px' />}
                                                    {selectedLesson && !skeletonFlag &&
                                                        <AddLesson
                                                            mode={editMode}
                                                            newLessonData={lessonDataToUpdate}
                                                            handleLessonDataChange={handleLessonDataChange}
                                                            handlelessonSave={handleUpdateLessonSave}
                                                            slideList={slideListToUpdate}
                                                            handleAddSlide={handleAddSlide}
                                                            handleRemoveSlide={handleRemoveSlide}
                                                            newSlideData={slideDataToUpdate}
                                                            handleSlideDataChange={handleSlideDataChange}
                                                            highlightWordList={highlightWordListToUpdate}
                                                            handleAddHighlightWord={handleAddHighlightWord}
                                                            handleRemoveHighlightWord={handleRemoveHighlightWord}
                                                            newHighlightWordData={highlightWordDataToUpdate}
                                                            handleHighlightWordDataChange={handleHighlightWordDataChange}
                                                        />
                                                    }
                                                </Box>
                                            </Box>
                                        </Box>
                                    }
                                </Box>
                            }
                        </Box>
                    </Box>
                </Box>
            </Box >
        </Box >
    )
}

export default Admin