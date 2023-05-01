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

const AllQuizzes = (props) => {
    const theme = useTheme()
    const { loadQuiz, qid, initialQuizData, expanded, handleChange } = props

    //styles for dropdown
    const mountedStyle = { animation: "inAnimation 350ms ease-in" };
    const unmountedStyle = {
        animation: "outAnimation 370ms ease-out",
        animationFillMode: "forwards"
    };

    function shortenDate(dateString) {
        const [date, time] = dateString.split(", ");
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        // eslint-disable-next-line no-unused-vars
        const [amPm, timeZone] = time.split(" ");
        const [day, month] = date.split("/");
        let MM = months[(parseInt(month) - 1)]
        const [hour, minute] = time.split(/:| /);
        const formattedDate = `${day} ${MM} : ${hour}:${minute} ${timeZone.toUpperCase()}`;
        return formattedDate;
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
                        value={quizID}
                        onClick={(e) => loadQuiz(e)}
                        variant="text"
                        style={{
                            color: qid === quizID ? 'white' : 'black',
                            backgroundColor: qid === quizID ? 'black' : 'white',
                            border: qid === quizID ? '1px solid white' : '',
                            margin: '5px'
                        }}
                        sx={{
                            ':hover': {
                                color: `black !important`,
                                backgroundColor: 'red !important',
                            },
                        }}>{quizCompleted ? 'Retake' : 'Take Quiz'}</Button>
                </Box>
            </Box>
        )
    }
    console.log(initialQuizData)
    return (
        <Box className='all-quizzez-container'>
            <Grid className='quiz-grid-container' container spacing={2} justifyContent='center'>
                <Grid className='quiz-grid-card' item xs={11} sm={11} md={10} lg={10} xl={10}>
                    {initialQuizData.length === 0 ?
                        <Box>
                            <Skeleton sx={{ bgcolor: '#585050' }} variant="rounded" width='100%' height='600px' />
                        </Box>
                        :
                        <Box>
                            {initialQuizData.map((section, index) => {
                                return (
                                    <Slide key={index} direction="up" timeout={500} in={true} >
                                        <Box className='quiz-collection'>
                                            <Box sx={{ backgroundColor: `${theme.palette.primary.main}` }}>
                                                <Typography variant='h4' textAlign='start' sx={{ color: '#ffffff', padding: '4px 16px' }}>{section.sectionName}</Typography>
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
                                                                color: '#ffffff',
                                                                '.MuiAccordionSummary-content': {
                                                                    textAlign: 'start',
                                                                    alignItems: 'start',
                                                                    transition: 'all 0.3s ease-in-out',
                                                                }
                                                            }}
                                                            expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
                                                            aria-controls="panel1bh-content"
                                                            id="panel1bh-header"
                                                        >
                                                            <Typography sx={{ width: '33%', flexShrink: 0 }}>
                                                                {lesson.lessonName}
                                                            </Typography>
                                                        </AccordionSummary>
                                                        <AccordionDetails style={expanded === `panel${lesson.lessonID}` ? mountedStyle : unmountedStyle}>
                                                            {lesson.allQuizzes.map((quiz, index) => {
                                                                return (
                                                                    <Quiz
                                                                        key={index}
                                                                        title={quiz.quizTitle}
                                                                        quizScore={quiz.quizScore}
                                                                        quizTotal={quiz.quizTotal}
                                                                        quizCompleted={quiz.quizCompleted}
                                                                        quizCompletedDate={quiz.quizCompletedDate}
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