import React, { useState, useRef } from 'react'
import {
    Box,
    Grid,
    Typography,
    Button,
    FormControl,
    FormControlLabel,
    RadioGroup,
    Radio,
    CircularProgress,
    Skeleton,
    useTheme,
} from '@mui/material'
import { red } from '@mui/material/colors';

const TakeQuiz = (props) => {
    const theme = useTheme()
    const { optionValue, handleOptionsChange, selectedQuizData, goBackToQuiz, submitQuiz, quizResult } = props

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
                                        sx={{
                                            color: red[900],
                                            '&.Mui-checked': {
                                                color: red[200],
                                            },
                                        }}
                                    />}
                                label={option.option}
                                sx={{ color: 'white' }}
                            />
                        )
                    })}
                </RadioGroup>
            </FormControl>
        )
    }

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
    // console.log("selected quiz data", selectedQuizData, quizQuestionCounter)

    return (
        <Box className='take-quiz-container'>
            {quizResult?.status ?
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
                                variant="text"
                                style={{ color: 'black', backgroundColor: 'white', border: '1px solid black', margin: '5px' }}
                            >Go Back</Button>
                        </Box>
                    </Grid>
                </Grid>
                :
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
                                            variant="text"
                                            style={{ color: 'black', backgroundColor: 'white', border: '1px solid black', margin: '5px' }}
                                        >Go Back</Button>
                                    </Box>
                                </Box>
                                <Box className='quiz-questions' ref={questionsRef} mt={2} sx={{ backgroundColor: `${theme.palette.primary.main}` }}>
                                    {selectedQuizData[0].questions.map((question, index) => {
                                        return (
                                            <Box key={index} className='quiz-question'>
                                                <Typography
                                                    variant='h6'
                                                    textAlign='start'
                                                    sx={{ color: 'white', padding: '4px 16px' }}
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
                                            variant="text"
                                            style={{ color: 'black', backgroundColor: 'white', border: '1px solid black', margin: '5px' }}
                                            disabled={quizQuestionCounter === 0}
                                        >Previous</Button>
                                        {selectedQuizData[0].questions.length === quizQuestionCounter + 1 ?
                                            <Box className='submit-quiz-button' display='flex' justifyContent='flex-end'>
                                                <Button
                                                    onClick={submitQuiz}
                                                    variant="text"
                                                    style={{ color: 'black', backgroundColor: 'white', border: '1px solid black', margin: '5px' }}
                                                >Submit</Button>
                                            </Box>
                                            :
                                            <Button
                                                onClick={incrementQuizQuestionCounter}
                                                variant="text"
                                                style={{ color: 'black', backgroundColor: 'white', border: '1px solid black', margin: '5px' }}
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