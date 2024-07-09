import React from 'react'
import {
    Box,
    Grid,
    Typography,
    Button,
    useTheme,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Skeleton
} from '@mui/material'
import Slide from '@mui/material/Slide';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { shortenDate } from '../../../../../utils/Utils';

const AllQuizzes = (props) => {
    const theme = useTheme()
    const navigate = useNavigate()
    const { qid, expanded, handleChange } = props
    const reduxTransformedData = useSelector(state => state.quiz.transformedData)

    //styles for dropdown
    const mountedStyle = { animation: "inAnimation 350ms ease-in" };
    const unmountedStyle = {
        animation: "outAnimation 370ms ease-out",
        animationFillMode: "forwards"
    };

    const loadQuiz = (quizId) => {
        let quizUrl = `/dashboard/quiz/${quizId}`
        navigate(quizUrl)
    }

    const Quiz = (props) => {
        const { title, quizScore, quizTotal, quizCompleted, quizCompletedDate, quizID, index } = props
        let formattedDate = ''
        if (quizCompletedDate === '') {
            formattedDate = ''
        } else {
            formattedDate = shortenDate(quizCompletedDate);
        }
        let score = ''
        if (quizTotal === undefined) {
            score = quizScore
        } else {
            score = `${quizScore}/${quizTotal}`
        }
        return (
            <Box className='quiz-question-holder' key={index}>
                <Box className='quiz-details-flex-box'>
                    <Box className='quiz-topic'>
                        <Typography variant='h6' sx={{ width: 'max-content' }}>{title}</Typography>
                    </Box>
                    <Box className='quiz-status-holder'>
                        <Box className='quiz-completed-status'>
                            <Typography variant='h6'>Completed : {quizCompleted ? 'Yes' : 'No'}</Typography>
                        </Box>
                        <Box className='quiz-number'>
                            <Typography variant='h6'>Score : {quizScore === '' ? '0' : score}</Typography>
                        </Box>
                        <Box className='quiz-date'>
                            <Typography variant='h6'>Date : {quizCompletedDate === '' ? 'Not Completed' : formattedDate}</Typography>
                        </Box>
                    </Box>
                </Box>
                <Box className='quiz-action'>
                    <Button
                        onClick={(e) => loadQuiz(quizID)}
                        variant="outlined"
                        size='small'
                        style={{
                            border: qid === quizID ? '1px solid white' : '',
                            margin: '5px'
                        }}
                        >{quizCompleted ? 'Retake' : 'Take Quiz'}</Button>
                </Box>
            </Box>
        )
    }
    // console.log(initialQuizData)
    return (
        <Box className='all-quizzez-container'>
            <Grid className='quiz-grid-container' container spacing={2} justifyContent='center'>
                <Grid className='quiz-grid-card' item xs={11} sm={11} md={10} lg={10} xl={10}>
                    {reduxTransformedData.length === 0 ?
                        <Box>
                            <Skeleton sx={{ bgcolor: '#585050' }} variant="rounded" width='100%' height='600px' />
                        </Box>
                        :
                        <Box>
                            {reduxTransformedData.map((section, index) => {
                                return (
                                    <Slide key={index} direction="up" timeout={500} in={true} >
                                        <Box className='quiz-collection'>
                                            <Box sx={{ backgroundColor: `${theme.palette.background.paper}` }} mb={1} pt={1} pb={1}>
                                                <Typography variant='h4' textAlign='start' sx={{ padding: '4px 16px' }}>{section.sectionName}</Typography>
                                            </Box>
                                            {section.lessons.map((lesson, index) => {
                                                return (
                                                    <Accordion
                                                        key={index}
                                                        TransitionProps={{ unmountOnExit: true }}
                                                        expanded={expanded === `panel${lesson.lessonID}`}
                                                        onChange={handleChange(`panel${lesson.lessonID}`)}
                                                    >
                                                        <AccordionSummary
                                                            sx={{
                                                                '.MuiAccordionSummary-content': {
                                                                    textAlign: 'start',
                                                                    alignItems: 'start',
                                                                    transition: 'all 0.3s ease-in-out',
                                                                }
                                                            }}
                                                            expandIcon={<ExpandMoreIcon sx={{ color: `${theme.palette.secondary.main}` }} />}
                                                            aria-controls="panel1bh-content"
                                                            id="panel1bh-header"
                                                        >
                                                            <Typography sx={{ flexShrink: 0 }}>
                                                                {lesson.lessonName}
                                                            </Typography>
                                                        </AccordionSummary>
                                                        <AccordionDetails style={expanded === `panel${lesson.lessonID}` ? mountedStyle : unmountedStyle}>
                                                            {lesson.allQuizzes.map((quiz, index) => {
                                                                return (
                                                                    <Quiz
                                                                        key={index}
                                                                        title={quiz.quizTitle}
                                                                        quizScore={quiz.quiz_score}
                                                                        quizTotal={quiz.quiz_total}
                                                                        quizCompleted={quiz.quiz_completed}
                                                                        quizCompletedDate={quiz.quiz_completed_date}
                                                                        quizID={quiz.quizId}
                                                                        index={index}
                                                                    />
                                                                )
                                                            })}
                                                        </AccordionDetails>
                                                    </Accordion>
                                                )
                                            })}
                                        </Box>
                                    </Slide>
                                )
                            })}
                        </Box>
                    }
                </Grid>
            </Grid>
        </Box>
    )
}

export default AllQuizzes