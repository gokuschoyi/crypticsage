import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux';
import './Quiz.css'
import { useOutletContext } from "react-router-dom";
import AdminHeader from '../global/AdminHeader'
import AddQuiz from './quiz_components/addQuiz/AddQuiz'
import { Success, Error } from '../../dashboard/global/CustomToasts'
import QuestionBox from './quiz_components/addQuiz/QuestionBox';
import OptionBox from './quiz_components/addQuiz/OptionBox';
import NewQuizDialog from './quiz_components/addQuiz/NewQuizDialog';
import DeleteQuizDialog from './quiz_components/addQuiz/DeleteQuizDialog';
import {
    Box,
    useTheme,
    Typography,
} from '@mui/material'
import { fetchSections, fetchLessons, fetchQuizData, addQuizData, updateQuizData, deleteQuizData } from '../../../api/db';
const Quiz = (props) => {
    const { title, subtitle } = props;
    const theme = useTheme();
    const token = useSelector(state => state.auth.accessToken);

    const [setTest] = useOutletContext();
    const hide = () => {
        setTest(true);
    }

    // quiz mode toggle
    const [quizMode, setQuizMode] = useState('add');
    const handleEditState = (param) => (e) => {
        setQuizMode(param);
    }

    //initial fetch of all sections
    const isLoaded = useRef(false);
    useEffect(() => {
        if (!isLoaded.current) {
            isLoaded.current = true;
            let data = {
                token: token
            }
            fetchSections(data)
                .then(res => {
                    setSectionData(res.data.sections);
                    setSectionDataU(res.data.sections);
                })
                .catch(error => {
                    console.error(error);
                })
        }
    }, [token]);

    const [sectionData, setSectionData] = useState([]);
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedSectionId, setSelectedSectionId] = useState('');
    const [selectedSectionIdU, setSelectedSectionIdU] = useState('');

    const [lessonData, setLessonData] = useState([]);
    const [selectedLesson, setSelectedLesson] = useState('');

    const [selectedLessonId, setSelectedLessonId] = useState('');
    const [selectedLessonIdU, setSelectedLessonIdU] = useState('');

    // saving lessonID to state
    const handleSelectedLesson = async (e) => {
        let lessonId
        if (e.target.value === '') return;
        else {
            switch (quizMode) {
                case 'add':
                    setSelectedLesson(e.target.value);
                    setQuizId('')
                    lessonId = lessonData.filter(lesson => lesson.chapter_title === e.target.value)[0].lessonId
                    setSelectedLessonId(lessonId)
                    break;
                case 'edit':
                    setQuizDataU([])
                    setTitleAndDescriptionU({ 'quizTitle': '', 'quizDescription': '' })
                    setSelectedQuiz('')
                    setSelectedLessonU(e.target.value);
                    let name = e.target.value;
                    lessonId = lessonDataU.filter(lesson => lesson.chapter_title === name)[0].lessonId
                    setSelectedLessonIdU(lessonId)
                    try {
                        let data = {
                            token: token,
                            lessonId: lessonId
                        }
                        let res = await fetchQuizData(data);
                        if (res.data.status === false) {
                            Error(res.data.message)
                        } else {
                            setQuizDataU(res.data.quizQuestions);
                            Success(res.data.message)
                        }
                    } catch (error) {
                        if (error.response) {
                            Error(error.response.data.message)
                        }
                    }
                    break;
                default:
                    break;
            }
        }
    }

    // saving sectionID to state and fetching all lessons associated with sectionID
    const handleSelectedSection = async (e) => {
        let sectionId;
        let data;
        switch (quizMode) {
            case 'add':
                setSelectedSection(e.target.value);
                setSelectedLesson([])
                sectionId = sectionData.filter(section => section.title === e.target.value)[0].sectionId
                setSelectedSectionId(sectionId)
                data = {
                    token: token,
                    sectionId: sectionId
                }
                try {
                    let res = await fetchLessons(data);
                    setLessonData(res.data.lessons);
                    if (res.data.message) {
                        Success(res.data.message)
                    }
                } catch (error) {
                    if (error.response) {
                        Error(error.response.data.message)
                    }
                }
                break;
            case 'edit':
                setSelectedSectionU(e.target.value)
                setSelectedLessonU([])
                sectionId = sectionDataU.filter(section => section.title === e.target.value)[0].sectionId
                setSelectedSectionIdU(sectionId)
                data = {
                    token: token,
                    sectionId: sectionId
                }
                try {
                    let res = await fetchLessons(data);
                    setLessonDataU(res.data.lessons);
                    if (res.data.message) {
                        // Success(res.data.message)
                    }
                } catch (error) {
                    if (error.response) {
                        Error(error.response.data.message)
                    }
                }
                break;
            default:
                break;
        }
    }

    // ---> ADD ENTIRE QUESTION DATA <--- //

    const initialQuestionData = {
        'question': '',
        'options': [],
        'correctAnswer': ''
    }

    const [questionBoxList, setQuestionBoxList] = useState([<QuestionBox key={0} count={0} />]);
    const [questionData, setQuestionData] = useState([initialQuestionData]);

    const [optionBoxList, setOptionBoxList] = useState([[<OptionBox key={0} count={0} />, <OptionBox key={1} count={1} />, <OptionBox key={2} count={2} />]]);
    const [optionData, setOptionData] = useState([[{ 'option': '' }, { 'option': '' }, { 'option': '' }]]);

    const [titleAndDescription, setTitleAndDescription] = useState({ 'quizTitle': '', 'quizDescription': '' });

    //handle title and description for a quiz
    const handleTitleAndDescription = (e) => {
        const { name, value } = e.target;
        switch (quizMode) {
            case 'add':
                setTitleAndDescription({ ...titleAndDescription, [name]: value });
                break;
            case 'edit':
                setTitleAndDescriptionU({ ...titleAndDescriptionU, [name]: value });
                break;
            default:
        }
    }

    //handle question box data
    const handleQuestionBoxData = (e) => {
        const { name, value, id } = e.target;
        let newQuestionData
        switch (quizMode) {
            case 'add':
                newQuestionData = [...questionData];
                newQuestionData[id][name] = value;
                setQuestionData(newQuestionData);
                break;
            case 'edit':
                newQuestionData = [...questionDataU];
                newQuestionData[id][name] = value;
                setQuestionDataU(newQuestionData);
                break;
            default:
        }
    }

    //handle option box data
    const handleOptionsBoxData = (e) => {
        const { name, value } = e.target;
        const { id, parentId } = e.target.dataset;
        let newOptionData
        switch (quizMode) {
            case 'add':
                newOptionData = [...optionData];
                newOptionData[parentId][id][name] = value;
                setOptionData(newOptionData);
                break;
            case 'edit':
                newOptionData = [...optionDataU];
                newOptionData[parentId][id][name] = value;
                setOptionDataU(newOptionData);
                break;
            default:
                break;
        }

    }

    //add question box to list and data
    const addQuestion = (e) => {
        e.preventDefault();
        let newOptionBoxList, optionBoxData, newQuestionData, count;
        switch (quizMode) {
            case 'add':
                console.log("add question from add mode")
                count = questionBoxList.length;
                newOptionBoxList = optionBoxList
                optionBoxData = optionData
                newQuestionData = questionData

                newOptionBoxList[count] = [<OptionBox key={0} count={0} />, <OptionBox key={1} count={1} />, <OptionBox key={2} count={2} />]
                setOptionBoxList(newOptionBoxList)

                optionBoxData[count] = [{ 'option': '' }, { 'option': '' }, { 'option': '' }]
                setOptionData(optionBoxData)

                newQuestionData[count] = initialQuestionData
                setQuestionData(newQuestionData)

                setQuestionBoxList([...questionBoxList, <QuestionBox key={count} count={count} />])
                break;
            case 'edit':
                console.log("add question from edit mode")
                count = questionBoxListU.length;
                newOptionBoxList = [...optionBoxListU]
                optionBoxData = optionDataU
                newQuestionData = questionDataU

                newOptionBoxList[count] = [<OptionBox key={0} count={0} />, <OptionBox key={1} count={1} />, <OptionBox key={2} count={2} />]
                setOptionBoxListU(newOptionBoxList)

                optionBoxData[count] = [{ 'option': '' }, { 'option': '' }, { 'option': '' }]
                setOptionDataU(optionBoxData)

                newQuestionData[count] = initialQuestionData
                setQuestionDataU(newQuestionData)

                setQuestionBoxListU([...questionBoxListU, <QuestionBox key={count} count={count} />])
                break;
            default:
                break;
        }
    }

    //remove question box from list and data
    const removeQuestionBox = (e) => {
        console.log(e.target.dataset.id)
        let id = e.target.dataset.id;
        let newOptionBoxList, optionBoxData, newQuestionData;
        switch (quizMode) {
            case 'add':
                newQuestionData = questionData
                newOptionBoxList = optionBoxList
                optionBoxData = optionData

                newQuestionData.splice(id, 1);
                setQuestionData(newQuestionData)

                newOptionBoxList.splice(id, 1);
                setOptionBoxList(newOptionBoxList)

                optionBoxData.splice(id, 1);
                setOptionData(optionBoxData)

                setQuestionBoxList(prevList => {
                    const newList = [...prevList]
                    newList.splice(id, 1);
                    const udatedList = newList.map((component, index) =>
                        React.cloneElement(component, { key: index, count: index })
                    );
                    return udatedList;
                })
                break;
            case 'edit':
                newQuestionData = questionDataU
                newOptionBoxList = optionBoxListU
                optionBoxData = optionDataU

                newQuestionData.splice(id, 1);
                setQuestionDataU(newQuestionData)

                newOptionBoxList.splice(id, 1);
                setOptionBoxListU(newOptionBoxList)

                optionBoxData.splice(id, 1);
                setOptionDataU(optionBoxData)

                setQuestionBoxListU(prevList => {
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

    //add new option to question
    const addNewOption = (e) => {
        let id = e.target.dataset.id;
        let newOptionList, newOptionData;
        switch (quizMode) {
            case 'add':
                newOptionList = optionBoxList
                newOptionData = [...optionData]

                newOptionList[id] = [...newOptionList[id], <OptionBox key={newOptionList[id].length} count={newOptionList[id].length} />]
                setOptionBoxList(newOptionList)
                newOptionData[id] = [...newOptionData[id], { 'option': '' }]
                setOptionData(newOptionData)
                break;
            case 'edit':
                newOptionList = optionBoxListU
                newOptionData = [...optionDataU]

                newOptionList[id] = [...newOptionList[id], <OptionBox key={newOptionList[id].length} count={newOptionList[id].length} />]
                setOptionBoxListU(newOptionList)
                newOptionData[id] = [...newOptionData[id], { 'option': '' }]
                setOptionDataU(newOptionData)
                break;
            default:
                break;
        }

    }

    //remove option from question
    const removeOptions = (e) => {
        e.preventDefault();
        let id = e.target.dataset.id;
        let parentId = e.target.dataset.parentId;
        let newOptionList, newOptionData;
        switch (quizMode) {
            case 'add':
                newOptionData = [...optionData]
                newOptionList = [...optionBoxList]

                newOptionData[parentId].splice(id, 1);
                setOptionData(newOptionData)

                newOptionList[parentId].splice(id, 1);

                const transformOne = () => {
                    return newOptionList[parentId].map((item, index) => {
                        return React.cloneElement(item, { key: index, count: index })
                    })
                }

                newOptionList[parentId] = transformOne();
                setOptionBoxList(newOptionList)
                break;
            case 'edit':
                newOptionData = [...optionDataU]
                newOptionList = [...optionBoxListU]

                newOptionData[parentId].splice(id, 1);
                setOptionDataU(newOptionData)

                newOptionList[parentId].splice(id, 1);

                const transformTwo = () => {
                    return newOptionList[parentId].map((item, index) => {
                        return React.cloneElement(item, { key: index, count: index })
                    })
                }

                newOptionList[parentId] = transformTwo();
                setOptionBoxListU(newOptionList)
                break;
            default:
                break;
        }
    }

    const finalData = {
        'sectionId': '',
        'quizId': '',
        'lessonId': '',
        'quizTitle': '',
        'quizDescription': '',
        'questions': []
    }

    //save quiz data
    const [quizId, setQuizId] = useState('');
    const handleLessonSave = async (e) => {
        finalData.sectionId = selectedSectionId;
        finalData.lessonId = selectedLessonId;
        finalData.quizTitle = titleAndDescription.quizTitle;
        finalData.quizDescription = titleAndDescription.quizDescription;
        let combinedData = [];
        questionData.forEach((question, index) => {
            combinedData[index] = { ...question, 'options': optionData[index] }
        })
        finalData.questions = combinedData;
        let CombData = {
            "quizData": finalData
        }
        if (quizId === '') {
            console.log("quiz initial save")
            let data = {
                token: token,
                payload: CombData
            }
            console.log(selectedSectionU, selectedLessonU)
            try {
                let res = await addQuizData(data);
                setQuizId(res.data.quizId);
                Success(res.data.message);
                if (selectedSectionU !== '' && selectedLessonU !== '') {
                    let data = {
                        token: token,
                        lessonId: selectedLessonIdU
                    }
                    let resQuiz = await fetchQuizData(data);
                    setQuizDataU(resQuiz.data.quizQuestions);
                }
            } catch (err) {
                if (err.response) {
                    Error(err.response.data.message);
                }
            }
        } else {
            console.log("quiz update")
            finalData.quizId = quizId;	//update quiz
            let data = {
                token: token,
                payload: finalData
            }
            try {
                let res = await updateQuizData(data);
                Success(res.data.message);
            } catch (err) {
                if (err.response) {
                    Error(err.response.data.message);
                }
            }
        }
    }

    // ---> ADD ENTIRE QUESTION DATA <--- //

    // ---> EDIT ENTIRE QUESTION DATA <--- //

    const [sectionDataU, setSectionDataU] = useState([])
    const [selectedSectionU, setSelectedSectionU] = useState('')

    const [lessonDataU, setLessonDataU] = useState([])
    const [selectedLessonU, setSelectedLessonU] = useState('')

    const [quizDataU, setQuizDataU] = useState([])
    const [selectedQuiz, setSelectedQuiz] = useState('')

    const [titleAndDescriptionU, setTitleAndDescriptionU] = useState({ 'quizTitle': '', 'quizDescription': '' })

    const [questionBoxListU, setQuestionBoxListU] = useState([])
    const [questionDataU, setQuestionDataU] = useState([])

    const [optionBoxListU, setOptionBoxListU] = useState([])
    const [optionDataU, setOptionDataU] = useState([])

    const [quizIdU, setQuizIdU] = useState('');
    const [skeletonFlag, setSkeletonFlag] = useState(false);

    //set the initial data for selected quiz
    const handleSelectedQuiz = (e) => {
        setSkeletonFlag(true)
        setSelectedQuiz(e.target.value)
        console.log(e.target.value)
        let quizId = quizDataU.filter(quiz => quiz.quizTitle === e.target.value)[0].quizId
        setQuizIdU(quizId)
        let quizData = quizDataU.filter(quiz => quiz.quizTitle === e.target.value)
        setTitleAndDescriptionU({
            quizTitle: quizData[0].quizTitle,
            quizDescription: quizData[0].quizDescription
        })

        let questions = quizData[0].questions;
        let newQuestionBoxList = [];
        for (let i = 0; i < questions.length; i++) {
            newQuestionBoxList.push(<QuestionBox key={i} count={i} />)
        }
        setQuestionBoxListU(newQuestionBoxList)

        let newQuestionData = [];
        for (let i = 0; i < questions.length; i++) {
            newQuestionData.push({ 'question': questions[i].question, 'options': [], 'correctAnswer': questions[i].correctAnswer })
        }
        setQuestionDataU(newQuestionData)

        let newOptionBoxList = [];
        questions.map((question, index) => {
            return newOptionBoxList.push(question.options.map((option, index) => {
                return <OptionBox key={index} count={index} />
            }))
        })
        setOptionBoxListU(newOptionBoxList)

        let newOptionData = [];
        questions.map((question, index) => {
            return newOptionData.push(question.options.map((option, index) => {
                return { 'option': option.option }
            }))
        })

        setOptionDataU(newOptionData)
        const timer = setTimeout(() => {
            setSkeletonFlag(false)
        }, 1000);
        return () => clearTimeout(timer);
    }

    //save quiz data from update tab
    const handleLessonSaveU = async (e) => {
        finalData.quizTitle = titleAndDescriptionU.quizTitle;
        finalData.quizDescription = titleAndDescriptionU.quizDescription;
        let combinedData = [];
        questionDataU.forEach((question, index) => {
            combinedData[index] = { ...question, 'options': optionDataU[index] }
        })
        delete finalData.lessonId;
        finalData.quizId = quizIdU
        finalData.questions = combinedData;
        let data = {
            token: token,
            payload: finalData
        }
        try {
            let res = await updateQuizData(data);
            Success(res.data.message);
        } catch (err) {
            if (err.response) {
                Error(err.response.data.message);
            }
        }
    }

    // ---> EDIT ENTIRE QUESTION DATA <--- //

    const [open, setOpen] = useState(false);
    const handleNewQuizDialog = () => {
        setOpen(true);
    }
    const handleCloseQuiz = () => {
        setOpen(false);
    }

    const resetQuiz = ({ modeType, resetId }) => {
        if (modeType === 'add') {
            console.log("reset quiz", modeType)
            setOpen(false)
            setTitleAndDescription({ 'quizTitle': '', 'quizDescription': '' })
            setQuestionBoxList([<QuestionBox key={0} count={0} />])
            setQuestionData([initialQuestionData])
            setOptionBoxList([[<OptionBox key={0} count={0} />, <OptionBox key={1} count={1} />, <OptionBox key={2} count={2} />]])
            setOptionData([[{ 'option': '' }, { 'option': '' }, { 'option': '' }]])
            setQuizId('')
        } else if (modeType === 'edit') {
            console.log("reset quiz", modeType)
            if (quizIdU === resetId) {
                console.log("view id and delete id match")
                setDeleteOpen(false)
                setTitleAndDescriptionU({ 'quizTitle': '', 'quizDescription': '' })
                setQuestionBoxListU([])
                setQuestionDataU([])
                setOptionBoxListU([])
                setOptionDataU([])
                setQuizIdU('')
                setSelectedQuiz('')
            } else {
                console.log("view id and delete id dont match")
                setDeleteOpen(false)
            }
        }
    }

    const [selectedQuizIdToDelete, setSelectedQuizIdToDelete] = useState('')
    const [deleteOpen, setDeleteOpen] = useState(false);
    const handleOpenDeleteDialog = (e) => {
        // console.log(e.target.dataset.quizid)
        setSelectedQuizIdToDelete(e.target.dataset.quizid)
        setDeleteOpen(true);
    }
    const handleCloseDeleteQuiz = () => {
        setDeleteOpen((prev) => !prev);
    }
    const removeQuizFromDb = async (e) => {
        e.preventDefault();
        console.log("delete yes clicked")
        const deleteQuizAPIData = {
            "sectionId": selectedSectionIdU,
            "lessonId": selectedLessonIdU,
            "quizId": selectedQuizIdToDelete,
        }
        const payload = {
            token: token,
            data: deleteQuizAPIData
        }
        try {
            let res = await deleteQuizData(payload)
            if (res.data.message) {
                resetQuiz({ modeType: 'edit', resetId: selectedQuizIdToDelete })
                Success(res.data.message)
            }
        } catch (err) {
            if (err.response) {
                Error(err.response.data.message)
            }
        }
        let lessonDataAfterDelete = quizDataU.filter((quiz) => quiz.quizId !== selectedQuizIdToDelete)
        setQuizDataU(lessonDataAfterDelete)
        setDeleteOpen(false)
    }

    return (
        <Box className='admin-dashboard-container' onClick={hide}>
            <Box height='100%' width='-webkit-fill-available'>
                <AdminHeader title={title} subtitle={subtitle} />
            </Box>
            <Box className='quiz-editor-container' sx={{ backgroundColor: `${theme.palette.primary.dark}` }}>
                <Box className='quiz-toggle'>
                    <Box display='flex' justifyContent='center' className='ac-button' >
                        <Typography
                            sx={{ backgroundColor: quizMode === 'edit' ? `${theme.palette.primary.dark}` : '#383535' }}
                            onClick={(e) => handleEditState('add')(e)}
                            variant='h4'
                            color='white'
                            textAlign='start'
                            className='add-content-subtitle'
                        >Add</Typography>
                    </Box>
                    <Box display='flex' justifyContent='center' className='ac-button' sx={{ width: '100%' }}>
                        <Typography
                            sx={{ backgroundColor: quizMode === 'add' ? `${theme.palette.primary.dark}` : '#383535' }}
                            onClick={(e) => handleEditState('edit')(e)}
                            variant='h4'
                            color='white'
                            textAlign='start'
                            className='add-content-subtitle'
                        >Edit</Typography>
                    </Box>
                </Box>
                <Box className='quiz-add-edit-box'>
                    {quizMode === 'add' ?
                        <Box className='quiz-add-box'>
                            <NewQuizDialog
                                open={open}
                                heading="Are you sure"
                                handleCloseQuiz={handleCloseQuiz}
                                resetQuiz={resetQuiz}
                            />
                            <AddQuiz
                                value="Add Quiz"
                                mode={quizMode}
                                quizId={quizId}
                                sectionData={sectionData}
                                selectedSection={selectedSection}
                                handleSelectedSection={handleSelectedSection}
                                lessonData={lessonData}
                                selectedLesson={selectedLesson}
                                handleSelectedLesson={handleSelectedLesson}
                                handleNewQuizDialog={handleNewQuizDialog}
                                quizData={quizDataU}
                                titleAndDescription={titleAndDescription}
                                handleTitleAndDescription={handleTitleAndDescription}
                                questionBoxList={questionBoxList}
                                addQuestion={addQuestion}
                                removeQuestionBox={removeQuestionBox}
                                handleQuestionBoxData={handleQuestionBoxData}
                                questionData={questionData}
                                optionBoxList={optionBoxList}
                                addNewOption={addNewOption}
                                removeOptions={removeOptions}
                                handleOptionsBoxData={handleOptionsBoxData}
                                optionData={optionData}
                                handleLessonSave={handleLessonSave}
                            />
                        </Box>
                        :
                        <Box className='quiz-edit-box'>
                            <DeleteQuizDialog
                                open={deleteOpen}
                                heading='Are you sure, Irreversible action'
                                handleCloseDeleteQuiz={handleCloseDeleteQuiz}
                                selectedQuizIdToDelete={selectedQuizIdToDelete}
                                removeQuizFromDb={removeQuizFromDb}
                                quizIdToRemove={selectedQuizIdToDelete}
                            />
                            <AddQuiz
                                value="Update Quiz"
                                mode={quizMode}
                                skeletonFlag={skeletonFlag}
                                sectionData={sectionDataU}
                                selectedSection={selectedSectionU}
                                handleSelectedSection={handleSelectedSection}
                                lessonData={lessonDataU}
                                selectedLesson={selectedLessonU}
                                handleSelectedLesson={handleSelectedLesson}
                                quizData={quizDataU}
                                selectedQuiz={selectedQuiz}
                                handleSelectedQuiz={handleSelectedQuiz}
                                handleOpenDeleteDialog={handleOpenDeleteDialog}
                                titleAndDescription={titleAndDescriptionU}
                                handleTitleAndDescription={handleTitleAndDescription}
                                questionBoxList={questionBoxListU}
                                addQuestion={addQuestion}
                                removeQuestionBox={removeQuestionBox}
                                handleQuestionBoxData={handleQuestionBoxData}
                                questionData={questionDataU}
                                optionBoxList={optionBoxListU}
                                addNewOption={addNewOption}
                                removeOptions={removeOptions}
                                handleOptionsBoxData={handleOptionsBoxData}
                                optionData={optionDataU}
                                handleLessonSave={handleLessonSaveU}
                            />
                        </Box>
                    }
                </Box>
            </Box>
        </Box>
    )
}

export default Quiz