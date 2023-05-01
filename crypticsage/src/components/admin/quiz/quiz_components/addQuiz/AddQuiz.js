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
    Skeleton,
    IconButton,
    Grid,
    Divider
} from '@mui/material'
import { DeleteOutlineOutlinedIcon } from '../../../../dashboard/global/Icons'
const AddQuiz = (props) => {
    const {
        mode, //done
        quizId,
        value, //done
        skeletonFlag, //done
        sectionData, //done
        selectedSection, //done
        handleSelectedSection, //done
        lessonData, //done
        selectedLesson, //done
        handleSelectedLesson, //done
        handleNewQuizDialog,
        quizData, //done
        selectedQuiz, //done
        handleSelectedQuiz, //done
        handleOpenDeleteDialog,
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

    // console.log(selectedQuiz)

    return (
        <Box>
            <Typography variant='h3' color='white' textAlign='start' mb={4} >{value}</Typography>
            <Box>
                {mode === 'add' &&
                    <Box className='add-quiz-box'>
                        <Box className='select-section' sx={{ marginTop: '20px' }}>
                            <Typography variant='h4' color='white' textAlign='start' mb={2} >Select a section</Typography>
                            <Grid container spacing={2}>
                                {sectionData && sectionData.map((section, index) => {
                                    return (
                                        <Grid item key={index} sm={12} md={6} lg={6} sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                                            <Button
                                                sx={{
                                                    backgroundColor: selectedSection === section.title ? `${theme.palette.secondary.main} !important` : `${theme.palette.primary.main} !important`,
                                                    color: selectedSection === section.title ? 'black !important' : 'white !important',
                                                }}
                                                key={index}
                                                variant='contained'
                                                value={`${section.title}`}
                                                onClick={(e) => handleSelectedSection(e)}
                                            >
                                                {section.title}
                                            </Button>
                                        </Grid>
                                    )
                                })}
                            </Grid>
                        </Box>
                        {lessonData && lessonData.length > 0 &&
                            <Box>
                                <Divider sx={{ margin: '20px 0px', color: 'white' }} />
                                <Box className='select-lesson' sx={{ marginTop: '20px' }}>
                                    <Typography variant='h4' color='white' textAlign='start' mb={2} >Select a lesson</Typography>
                                    <Grid container spacing={2}>
                                        {lessonData && lessonData.map((lesson, index) => {
                                            return (
                                                <Grid item key={index} sm={12} md={6} lg={6} sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                                                    <Button
                                                        sx={{
                                                            backgroundColor: selectedLesson === lesson.chapter_title ? `${theme.palette.secondary.main} !important` : `${theme.palette.primary.main} !important`,
                                                            color: selectedLesson === lesson.chapter_title ? 'black !important' : 'white !important',
                                                        }}
                                                        key={index}
                                                        variant='contained'
                                                        value={`${lesson.chapter_title}`}
                                                        onClick={(e) => handleSelectedLesson(e)}
                                                    >
                                                        {lesson.chapter_title}
                                                    </Button>
                                                </Grid>
                                            )
                                        })}
                                    </Grid>
                                </Box>
                            </Box>
                        }
                        {selectedLesson.length > 0 &&
                            <Box>
                                <Divider sx={{ margin: '20px 0px', color: 'white' }} />
                                <Box pt={1} pb={2} display='flex' flexDirection='row' justifyContent='space-between'>
                                    <Typography variant='h4' color='white' textAlign='start' >{selectedLesson}</Typography>
                                    <Box display='flex' flexDirection='row' gap='20px'>
                                        <Button
                                            onClick={handleLessonSave}
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
                                        >{quizId === '' ? 'Save' : 'Update'}</Button>
                                        <Button
                                            value="addlesson"
                                            onClick={handleNewQuizDialog}
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
                                        >New Quiz</Button>
                                    </Box>
                                </Box>
                                <Box>
                                    <Box p={2}>
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
                                </Box>
                            </Box>
                        }
                    </Box>
                }
                {mode === 'edit' &&
                    <Box className='edit-quiz-box'>
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
                        {quizData && quizData.length > 0 &&
                            <Box className='select-quiz' sx={{ width: '50%', marginTop: '20px' }}>
                                <Box>
                                    <Typography variant='h4' color='white' textAlign='start' pb={4} >Available Quizzes</Typography>
                                    {quizData && quizData.map((quiz, index) => {
                                        return (
                                            <Box key={index} display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' gap='20px' mb={1} mt={1}>
                                                <Box>
                                                    <Typography variant='h6' color='white' textAlign='start' >{quiz.quizTitle}</Typography>
                                                </Box>
                                                <Box display='flex' flexDirection='row' gap='20px' alignItems='center'>
                                                    <Button
                                                        className='view-section-details-button'
                                                        onClick={(e) => handleSelectedQuiz(e)}
                                                        value={quiz.quizTitle}
                                                        size='small'
                                                        id={index}
                                                        sx={{
                                                            width: '120px',
                                                            ':hover': {
                                                                color: 'black !important',
                                                                backgroundColor: '#d11d1d !important',
                                                                transition: '0.5s'
                                                            },
                                                            backgroundColor: selectedQuiz === quiz.quizTitle ? 'white !important' : 'black !important',
                                                            color: selectedQuiz === quiz.quizTitle ? 'black !important' : 'white !important',
                                                        }}
                                                    >View Details</Button>
                                                    <Box>
                                                        <IconButton
                                                            onClick={(e) => handleOpenDeleteDialog(e)}
                                                            data-quizid={quiz.quizId}
                                                            sx={{ height: '25px', width: '25px' }}
                                                        >
                                                            <DeleteOutlineOutlinedIcon sx={{ pointerEvents: 'none' }} />
                                                        </IconButton>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        )
                                    })}
                                </Box>
                            </Box>
                        }
                        <Box sx={{ paddingTop: '20px' }}>
                            {skeletonFlag && <Skeleton variant="rectangular" width='100%' height='600px' />}
                            {selectedQuiz && quizData.length > 0 && !skeletonFlag &&
                                <Box>
                                    <Box p={2}>
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
                }
            </Box>
        </Box>
    )
}

export default AddQuiz