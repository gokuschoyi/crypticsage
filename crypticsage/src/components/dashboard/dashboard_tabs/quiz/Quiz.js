import React, { useState, useEffect, useRef } from 'react'
import { useOutletContext } from "react-router-dom";
import Header from '../../global/Header';
import { Box } from '@mui/material';
import './Quiz.css'
import TakeQuiz from './quiz_component/TakeQuiz';
import AllQuizzes from './quiz_component/AllQuizzes';
import { useSelector } from 'react-redux';
import { getInitialQuizDataForUser, getQuizQuestions, submitQuizResults } from '../../../../api/user'

const Quiz = (props) => {
    const { accessToken, uid } = useSelector(state => state.auth)
    const { title, subtitle } = props
    const [titleDesc, setTitleDesc] = useState({ title: title, subtitle: subtitle })

    //handles close of dri=opdown when clicked on main page
    const [setTest] = useOutletContext();
    const hide = () => {
        setTest(true);
    }

    //handle dropdown for each lesson
    const [expanded, setExpanded] = useState(false);
    const handleChange = (panel) => (event, isExpanded) => {
        setExpanded(isExpanded ? panel : false);
    };

    //switch between quiz main page and single quiz page
    const [showQuiz, setShowQuiz] = useState(false)
    const handleShowQuiz = () => {
        setShowQuiz((prev) => !prev)
    }

    //go back to quiz main page
    const goBackToQuiz = () => {
        setTitleDesc({ title: title, subtitle: subtitle })
        setShowQuiz(false)
        setQuizResult()
        setOptionsValue([])
        setSelectedQuizData([])
    }

    //get initial quizzes data for user useRef to run the fetch only once
    const isLoaded = useRef(false)
    const [initialQuizData, setInitialQuizData] = useState([])
    useEffect(() => {
        if (!isLoaded.current) {
            isLoaded.current = true
            let data = {
                token: accessToken,
                payload: {
                    uid: uid
                }
            }
            getInitialQuizDataForUser(data)
                .then((res) => {
                    setInitialQuizData(res.data.transformedQuizData)
                })
                .catch((err) => {
                    console.log(err)
                })
        }
    })

    //selected quiz data (1 quiz data). Transforms the data to add index to each question and creates a new optionsValue array
    //to store the selected option for each question
    const [qid, setQid] = useState()
    const [selectedQuizData, setSelectedQuizData] = useState([])

    const loadQuiz = (e) => {
        const { value } = e.target
        setQid(value)
        handleShowQuiz()
        const data = {
            token: accessToken,
            payload: {
                quizId: value
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

    // console.log("selected quiz data", selectedQuizData, optionValue)

    //submit quiz to db and get the score
    const [quizResult, setQuizResult] = useState()
    const submitQuiz = async () => {
        let data = {
            token: accessToken,
            payload: {
                uid: uid,
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
                    setQuizResult(res.data)
                    console.log("Quiz submitted successfully")
                }
            })
            .catch((err) => {
                console.log(err)
            })
        // console.log(optionValue, score)
    }

    return (
        <Box className='quiz-container' onClick={hide}>
            <Box height='100%' width='-webkit-fill-available'>
                <Header title={titleDesc.title} subtitle={titleDesc.subtitle} />
            </Box>
            <Box className='quiz-cards-container'>
                {!showQuiz &&
                    <AllQuizzes
                        loadQuiz={loadQuiz}
                        qid={qid}
                        initialQuizData={initialQuizData}
                        expanded={expanded}
                        handleChange={handleChange}
                    />
                }
                {showQuiz &&
                    <TakeQuiz
                        optionValue={optionValue}
                        handleOptionsChange={handleOptionsChange}
                        selectedQuizData={selectedQuizData}
                        goBackToQuiz={goBackToQuiz}
                        submitQuiz={submitQuiz}
                        quizResult={quizResult}
                    />
                }
            </Box>
        </Box>
    )
}

export default Quiz