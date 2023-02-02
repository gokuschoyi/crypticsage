import React from 'react'
import { useOutletContext } from "react-router-dom";
import Header from '../../global/Header';
import { Box, Typography, Button, useTheme, Grid, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import './Quiz.css'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import QUIZ_DATA from './QuizData';

import Slide from '@mui/material/Slide';

const Quiz = (props) => {
    const theme = useTheme();
    const { title, subtitle } = props

    const [setTest] = useOutletContext();
    const hide = () => {
        setTest(true);
    }

    const [expanded, setExpanded] = React.useState(false);

    const handleChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    const mountedStyle = { animation: "inAnimation 350ms ease-in" };
    const unmountedStyle = {
        animation: "outAnimation 370ms ease-out",
        animationFillMode: "forwards"
    };

    const [qid, setQid] = React.useState()

    const takeQuiz = (e) => {
        const { value } = e.target
        setQid(JSON.parse(value))
    }
    // console.log(qid)

    const Quiz = (props) => {
        const { title, quizID, index } = props
        const value = {
            'quizID': quizID,
            'lesson': title
        }
        return (
            <Box className='quiz-question-holder' key={index}>
                <Box className='quiz-topic'>
                    <Typography variant='h6'>{title}</Typography>
                </Box>
                <Box className='quiz-number'>
                    <Typography variant='h6'>{quizID} : {index + 1}</Typography>
                </Box>
                <Box className='quiz-action'>
                    <Button
                        value={JSON.stringify(value)}
                        onClick={(e) => takeQuiz(e)}
                        variant="text"
                        style={{
                            color: `#000000`,
                            backgroundColor: 'red',
                            margin: '5px'
                        }}
                        sx={{
                            ':hover': {
                                color: `black !important`,
                                backgroundColor: 'white !important',
                            },
                        }}>Take Quiz</Button>
                </Box>
            </Box>
        )
    }

    return (
        <Box className='quiz-container' onClick={hide}>
            <Box height='100%' width='-webkit-fill-available'>
                <Header title={title} subtitle={subtitle} />
            </Box>
            <Box className='quiz-cards-container'>
                <Grid className='quiz-grid-container' container spacing={2} justifyContent='center'>
                    <Grid className='quiz-grid-card' item xs={11} sm={11} md={10} lg={10}>
                        {QUIZ_DATA.map((lessons, index) => {
                            return (
                                <Slide key={index} direction="up" timeout={500} in={true} >
                                    <Accordion
                                        TransitionProps={{ unmountOnExit: true }}
                                        expanded={expanded === `panel${index}`}
                                        onChange={handleChange(`panel${index}`)}
                                    >
                                        <AccordionSummary
                                            sx={{
                                                color: `${theme.palette.secondary.main}`,
                                                '.MuiAccordionSummary-content': {
                                                    textAlign: 'start',
                                                    alignItems: 'center',
                                                    transition: 'all 0.3s ease-in-out',
                                                }
                                            }}
                                            expandIcon={<ExpandMoreIcon />}
                                            aria-controls="panel1bh-content"
                                            id="panel1bh-header"
                                        >
                                            <Typography sx={{ width: '33%', flexShrink: 0 }}>
                                                {lessons.lesson}
                                            </Typography>

                                        </AccordionSummary>
                                        <AccordionDetails style={expanded === `panel${index}` ? mountedStyle : unmountedStyle}>
                                            {lessons.chapters.map((lesson, index) => {
                                                return (
                                                    <Quiz key={index} title={lesson.title} quizID={lesson.quizID} index={index} />
                                                )
                                            })}
                                        </AccordionDetails>
                                    </Accordion>
                                </Slide>
                            )
                        })}
                    </Grid>
                </Grid>
            </Box>
        </Box>
    )
}

export default Quiz