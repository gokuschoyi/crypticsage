import React, { useState, useEffect, useRef } from 'react'
import {
    Box,
    Grid,
    Typography,
    Button,
    FormControl,
    FormControlLabel,
    RadioGroup,
    Radio,
    Skeleton,
    useTheme,
} from '@mui/material'
import { red } from '@mui/material/colors';
import { submitQuizResults, getLatestLessonAndQuizResults, getQuizQuestions } from '../../../../../api/user';
import { setRecentLessonAndQuizStatus } from '../../stats/StatsSlice'
import { resetTransformedData } from '../QuizSlice';
import { useSelector, useDispatch } from 'react-redux';

const TakeQuiz = (props) => {
    const theme = useTheme()
    const { isLoaded, setQid, quizId, setTitleDesc, goBackToQuiz } = props
    const { accessToken } = useSelector(state => state.auth)
    const dispatch = useDispatch()

    const [quizQuestionCounter, setQuizQuestionCounter] = useState(0)
    const questionsRef = useRef(null)
    const incrementQuizQuestionCounter = () => {
        setQuizQuestionCounter((prev) => prev + 1)
        const questionsList = questionsRef.current;
        questionsList.scrollBy(0, questionsList.offsetHeight);
    }
    const decrementQuizQuestionCounter = () => {
        setQuizQuestionCounter((prev) => prev - 1)
        const questionsList = questionsRef.current;
        questionsList.scrollBy(0, -questionsList.offsetHeight);
    }

    //selected quiz data (1 quiz data). useRef to run the fetch only once
    //timer is used to prevent mongodb from closing parallel connections
    const QQRef = useRef(false)
    const [selectedQuizData, setSelectedQuizData] = useState([])
    useEffect(() => {
        let timer;
        timer = setInterval(() => {
            if (!QQRef.current) {
                QQRef.current = true
                setQid(quizId)
                const data = {
                    token: accessToken,
                    payload: {
                        quizId: quizId
                    }
                }

                getQuizQuestions(data)
                    .then((res) => {
                        let quiz = res.data.selectedQuiz
                        let sortedQuestions = quiz[0].questions.sort(() => Math.random() - 0.5)
                        quiz[0] = { ...quiz[0], questions: sortedQuestions }
                        setSelectedQuizData(quiz)
                        setTitleDesc({ title: quiz[0].quizTitle, subtitle: '' })
                        let optionsData = quiz[0].questions.map((ques, ind) => {
                            const { question, question_id } = ques
                            return {
                                question_id,
                                question,
                                selectedOption: ''
                            }
                        })
                        setOptionsValue(optionsData)
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            }
        }, 200)
        return (() => {
            clearInterval(timer)
        })
    })

    //optionsValue array to store the selected option for each question
    const [optionValue, setOptionsValue] = useState([])
    const handleOptionsChange = (event) => {
        const { name, value } = event.target
        const updatedOptions = optionValue.map((option) => {
            if (option.question_id === name) {
                return { ...option, selectedOption: value };
            } else {
                return option;
            }
        });
        setOptionsValue(updatedOptions)
    };

    //submit quiz to db and get the score
    const [resultLoaderFlag, setResultLoaderFlag] = useState(false)
    const [quizResult, setQuizResult] = useState()
    const submitQuiz = async () => {
        setResultLoaderFlag(true)
        let data = {
            token: accessToken,
            payload: {
                sectionId: selectedQuizData[0].sectionId,
                lessonId: selectedQuizData[0].lessonId,
                quizId: selectedQuizData[0].quizId,
                quizData: {
                    userSelection: optionValue,
                }
            }
        }
        await submitQuizResults(data)
            .then((res) => {
                if (res.data.status) {
                    isLoaded.current = false
                    dispatch(resetTransformedData())
                    setQuizResult(res.data)
                    setResultLoaderFlag(false)
                    console.log("Quiz submitted successfully")
                }
            })
            .catch((err) => {
                console.log(err)
            })
        let updateStats = {
            token: accessToken,
        }
        await getLatestLessonAndQuizResults(updateStats)
            .then((res) => {
                dispatch(setRecentLessonAndQuizStatus(res.data.recentLessonQuizStatus))
                console.log(res.data)
            })
        // console.log(optionValue, score)
    }

    const OptionsBox = (props) => {
        const { options, questionId } = props
        return (
            <FormControl>
                <RadioGroup
                    aria-labelledby="demo-controlled-radio-buttons-group"
                    name={`${questionId}`}
                    value={optionValue.filter((option) => option.question_id === questionId)[0].selectedOption}
                    onChange={handleOptionsChange}
                >
                    {options.map((option, index) => {
                        return (
                            <FormControlLabel
                                key={index}
                                value={option.option}
                                control={
                                    <Radio
                                        color='primary'
                                        
                                    />}
                                label={option.option}
                            />
                        )
                    })}
                </RadioGroup>
            </FormControl>
        )
    }

    return (
        <Box className='take-quiz-container'>
            {resultLoaderFlag &&
                <Grid className='quiz-questions-container' container spacing={2} justifyContent='center'>
                    <Grid className='quiz-questions-card' item xs={11} sm={11} md={10} lg={10}>
                        <Typography variant='h3' textAlign='start' sx={{ color: `${theme.palette.secondary.main}`, padding: '4px 16px' }}>Your Quiz Results</Typography>
                        <Skeleton sx={{ bgcolor: '#585050', margin: '4px 16px' }} mb={1} variant="rounded" width={250} height={40} />
                        <Skeleton sx={{ bgcolor: '#585050', margin: '4px 16px' }} variant="rounded" width={200} height={40} />
                        <Box display='flex' justifyContent='center'>
                            <Skeleton sx={{ bgcolor: '#585050', margin: '4px 16px' }} variant="rounded" width={200} height={40} />
                        </Box>
                    </Grid>
                </Grid>
            }
            {quizResult?.status === true &&
                <Grid className='quiz-questions-container' container spacing={2} justifyContent='center'>
                    <Grid className='quiz-questions-card' item xs={11} sm={11} md={10} lg={10}>
                        <Box className='quiz-result-container'>
                            <Typography variant='h3' textAlign='start' sx={{ color: `${theme.palette.secondary.main}`, padding: '4px 16px' }}>Your Quiz Results</Typography>
                            <Typography variant='h5' textAlign='start' sx={{ color: `${theme.palette.secondary.main}`, padding: '4px 16px' }}>Quiz Name : {quizResult.data.quizTitle}</Typography>
                            <Typography
                                variant='h5'
                                textAlign='start'
                                sx={{ color: `${theme.palette.secondary.main}`, padding: '4px 16px' }}
                            >
                                Score : {quizResult.data.score} / {quizResult.data.total}
                            </Typography>
                        </Box>
                        <Box>
                            <Button
                                onClick={goBackToQuiz}
                                variant="outlined"
                                size='small'
                                style={{
                                    margin: '5px'
                                }}
                            >Go Back</Button>
                        </Box>
                    </Grid>
                </Grid>
            }
            {quizResult?.status === undefined && !resultLoaderFlag &&
                <Grid className='quiz-questions-container' container spacing={2} justifyContent='center'>
                    <Grid className='quiz-questions-card' item xs={11} sm={11} md={10} lg={10}>
                        {selectedQuizData.length === 0 ?
                            <Box>
                                <Box pb={1} display='flex' flexDirection='row' justifyContent='space-between'>
                                    <Skeleton sx={{ bgcolor: '#585050' }} variant="rounded" width={200} height={38} />
                                    <Skeleton sx={{ bgcolor: '#585050' }} variant="rounded" width={50} height={38} />
                                </Box>
                                <Skeleton sx={{ bgcolor: '#585050' }} variant="rounded" width='100%' height={250} />
                                <Box pt={1} display='flex' flexDirection='row' justifyContent='flex-end' gap='20px'>
                                    <Skeleton sx={{ bgcolor: '#585050' }} variant="rounded" width={70} height={38} />
                                    <Skeleton sx={{ bgcolor: '#585050' }} variant="rounded" width={70} height={38} />
                                </Box>
                            </Box>
                            :
                            <Box className='quiz-details-box'>
                                <Box className='quiz-title-description'>
                                    <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
                                        <Typography
                                            variant='h5'
                                            textAlign='start'
                                            sx={{ color: `${theme.palette.secondary.main}`, padding: '4px 16px' }}>{selectedQuizData[0].quizDescription}
                                        </Typography>
                                        <Button
                                            onClick={goBackToQuiz}
                                            variant="outlined"
                                            size='small'
                                            style={{
                                                margin: '5px',
                                            }}
                                        >Go Back</Button>
                                    </Box>
                                </Box>
                                <Box className='quiz-questions' ref={questionsRef} mt={2} sx={{ backgroundColor: `${theme.palette.background.paper}` }}>
                                    {selectedQuizData[0].questions.map((question, index) => {
                                        return (
                                            <Box key={index} className='quiz-question'>
                                                <Typography
                                                    variant='h6'
                                                    textAlign='start'
                                                    sx={{ padding: '4px 16px' }}
                                                >
                                                    {index + 1} - {question.question}
                                                </Typography>
                                                <Box className='user-quiz-options'>
                                                    <OptionsBox
                                                        options={question.options}
                                                        questionId={question.question_id}
                                                    />
                                                </Box>
                                            </Box>
                                        )
                                    })}
                                </Box>
                                <Box display='flex' justifyContent='flex-end' pt={4}>
                                    <Box className='quiz-navigation-buttons' display='flex' flexDirection='row' gap='20px' alignItems='center'>
                                        <Button
                                            onClick={decrementQuizQuestionCounter}
                                            variant="outlined"
                                            size='small'
                                            style={{ margin: '5px' }}
                                            disabled={quizQuestionCounter === 0}
                                        >Previous</Button>
                                        {selectedQuizData[0].questions.length === quizQuestionCounter + 1 ?
                                            <Box className='submit-quiz-button' display='flex' justifyContent='flex-end'>
                                                <Button
                                                    onClick={submitQuiz}
                                                    size='small'
                                                    variant="outlined"
                                                    style={{  margin: '5px' }}
                                                >Submit</Button>
                                            </Box>
                                            :
                                            <Button
                                                onClick={incrementQuizQuestionCounter}
                                                variant="outlined"
                                                size='small'
                                                style={{ margin: '5px' }}
                                                disabled={quizQuestionCounter === selectedQuizData[0].questions.length - 1}
                                            >Next</Button>
                                        }
                                    </Box>
                                </Box>
                            </Box>
                        }
                    </Grid>
                </Grid>
            }
        </Box>
    )
}

export default TakeQuiz