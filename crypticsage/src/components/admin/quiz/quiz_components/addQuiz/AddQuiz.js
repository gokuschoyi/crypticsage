import React from 'react'
import './AddQuiz.css'
import {
    Box,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Button,
    useTheme,
    Skeleton
} from '@mui/material'
const AddQuiz = (props) => {
    const {
        mode, //done
        value, //done
        skeletonFlag, //done
        sectionData, //done
        selectedSection, //done
        handleSelectedSection, //done
        lessonData, //done
        selectedLesson, //done
        handleSelectedLesson, //done
        quizData, //done
        selectedQuiz, //done
        handleSelectedQuiz, //done
        titleAndDescription, //done
        handleTitleAndDescription, //done
        questionBoxList, //done
        addQuestion, //done
        removeQuestionBox, //done
        handleQuestionBoxData, //done
        questionData, //done
        optionBoxList, //done
        addNewOption, //done
        removeOptions, //done
        handleOptionsBoxData,
        optionData, //done
        handleLessonSave, //done
    } = props;
    const theme = useTheme();

    // console.log(questionBoxList)

    return (
        <Box>
            <Typography variant='h4' color='white' textAlign='start' >{value}</Typography>
            <Box>
                <Box className='select-section' sx={{ width: '50%', marginTop: '20px' }}>
                    <FormControl fullWidth>
                        <InputLabel id="document-type-label">Select Section</InputLabel>
                        <Select
                            onChange={(e) => handleSelectedSection(e)}
                            labelId="document-type"
                            id="document-type"
                            value={selectedSection}
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
                {lessonData && lessonData.length > 0 &&
                    <Box className='select-lesson' sx={{ width: '50%', marginTop: '20px' }}>
                        <FormControl fullWidth>
                            <InputLabel id="document-type-label">Select Lesson</InputLabel>
                            <Select
                                onChange={(e) => handleSelectedLesson(e)}
                                labelId="document-type"
                                id="document-type"
                                value={selectedLesson}
                                label="Media Type"
                            >
                                <MenuItem value='' >Select Lesson</MenuItem>
                                {lessonData && lessonData.map((lesson, index) => {
                                    return (
                                        <MenuItem key={index} value={`${lesson.chapter_title}`}>{lesson.chapter_title}</MenuItem>
                                    )
                                })}
                            </Select>
                        </FormControl>
                    </Box>
                }
                {quizData && quizData.length > 0 && mode === 'edit' &&
                    <Box className='select-quiz' sx={{ width: '50%', marginTop: '20px' }}>
                        <FormControl fullWidth>
                            <InputLabel id="document-type-label">Select Quiz</InputLabel>
                            <Select
                                onChange={(e) => handleSelectedQuiz(e)}
                                labelId="document-type"
                                id="document-type"
                                value={selectedQuiz}
                                label="Media Type"
                            >
                                <MenuItem value='' >Select Lesson</MenuItem>
                                {quizData && quizData.map((quiz, index) => {
                                    return (
                                        <MenuItem key={index} value={`${quiz.quizTitle}`}>{quiz.quizTitle}</MenuItem>
                                    )
                                })}
                            </Select>
                        </FormControl>
                    </Box>
                }
            </Box>
            {selectedLesson.length > 0 && mode === 'add' &&
                <Box>
                    <Box className='quiz-title'>
                        <Typography sx={{ width: '150px', paddingBottom: '10px' }} variant='h5' color='white' textAlign='start' >Quiz Title : </Typography>
                        <TextField
                            onChange={(e) => handleTitleAndDescription(e)}
                            value={titleAndDescription.quizTitle}
                            size='small'
                            name='quizTitle'
                            fullWidth />
                    </Box>
                    <Box className='quiz-title'>
                        <Typography sx={{ width: '150px', paddingBottom: '10px' }} variant='h5' color='white' textAlign='start' >Quiz Description : </Typography>
                        <TextField
                            onChange={(e) => handleTitleAndDescription(e)}
                            value={titleAndDescription.quizDescription}
                            size='small'
                            name='quizDescription'
                            fullWidth />
                    </Box>
                    <Box className='add-questions'>
                        <Typography variant='h5' color='white' textAlign='start' >Add Questions</Typography>
                        <Button
                            onClick={(e) => addQuestion(e)}
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
                        >Add Question</Button>
                    </Box>
                    {questionBoxList && questionBoxList.map((questionBox, index) => {
                        return (
                            React.cloneElement(questionBox, {
                                key: index,
                                removeQuestionBox: removeQuestionBox,
                                handleQuestionBoxData: handleQuestionBoxData,
                                questionData: questionData,
                                optionBoxList: optionBoxList,
                                addNewOption: addNewOption,
                                removeOptions: removeOptions,
                                handleOptionsBoxData: handleOptionsBoxData,
                                optionData: optionData,
                            })
                        )
                    })
                    }
                    <Box sx={{ marginTop: '40px' }}>
                        <Button
                            onClick={handleLessonSave}
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
            }
            <Box sx={{ paddingTop: '20px' }}>
                {skeletonFlag && <Skeleton variant="rectangular" width='100%' height='600px' />}
                {selectedQuiz && quizData.length > 0 && mode === 'edit' && !skeletonFlag &&
                    <Box>
                        <Box className='quiz-title'>
                            <Typography sx={{ width: '150px', paddingBottom: '10px' }} variant='h5' color='white' textAlign='start' >Quiz Title : </Typography>
                            <TextField
                                onChange={(e) => handleTitleAndDescription(e)}
                                value={titleAndDescription.quizTitle}
                                size='small'
                                name='quizTitle'
                                fullWidth />
                        </Box>
                        <Box className='quiz-title'>
                            <Typography sx={{ width: '150px', paddingBottom: '10px' }} variant='h5' color='white' textAlign='start' >Quiz Description : </Typography>
                            <TextField
                                onChange={(e) => handleTitleAndDescription(e)}
                                value={titleAndDescription.quizDescription}
                                size='small'
                                name='quizDescription'
                                fullWidth />
                        </Box>
                        <Box className='add-questions'>
                            <Typography variant='h5' color='white' textAlign='start' >Add Questions</Typography>
                            <Button
                                onClick={(e) => addQuestion(e)}
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
                            >Add Question</Button>
                        </Box>
                        {questionBoxList && questionBoxList.map((questionBox, index) => {
                            return (
                                React.cloneElement(questionBox, {
                                    key: index,
                                    removeQuestionBox: removeQuestionBox,
                                    handleQuestionBoxData: handleQuestionBoxData,
                                    questionData: questionData,
                                    optionBoxList: optionBoxList,
                                    addNewOption: addNewOption,
                                    removeOptions: removeOptions,
                                    handleOptionsBoxData: handleOptionsBoxData,
                                    optionData: optionData,
                                })
                            )
                        })
                        }
                        <Box sx={{ marginTop: '40px' }}>
                            <Button
                                onClick={handleLessonSave}
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
                }
            </Box>
        </Box>
    )
}

export default AddQuiz