import React, { useState, useEffect, useRef } from 'react'
import { useOutletContext } from "react-router-dom";
import Header from '../../global/Header';
import { Box } from '@mui/material';
import './Quiz.css'
import TakeQuiz from './quiz_component/TakeQuiz';
import AllQuizzes from './quiz_component/AllQuizzes';
import { useSelector, useDispatch } from 'react-redux';
import { getInitialQuizDataForUser } from '../../../../api/user'
import { useParams, useNavigate } from 'react-router-dom';
import { setTransformedData } from './QuizSlice';

const Quiz = (props) => {
    const { accessToken } = useSelector(state => state.auth)
    const { title, subtitle } = props
    const dispatch = useDispatch()
    const navigate = useNavigate();
    const params = useParams()
    const { quizId } = params;
    const [titleDesc, setTitleDesc] = useState({ title: title, subtitle: subtitle })
    const [qid, setQid] = useState()

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

    //go back to quiz main page
    const goBackToQuiz = () => {
        setTitleDesc({ title: title, subtitle: subtitle })
        navigate(`/dashboard/quiz`)
    }

    //get initial quizzes data for user useRef to run the fetch only once
    const reduxTransformedData = useSelector(state => state.quiz.transformedData)
    const isLoaded = useRef(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!isLoaded.current && reduxTransformedData.length === 0) {
            isLoaded.current = true
            let data = {
                token: accessToken,
            }
            getInitialQuizDataForUser(data)
                .then((res) => {
                    dispatch(setTransformedData(res.data.transformedQuizData))
                })
                .catch((err) => {
                    console.log(err)
                })
        } else {
            return
        }
    })

    return (
        <Box className='quiz-container' onClick={hide}>
            <Box width='-webkit-fill-available'>
                <Header title={titleDesc.title} subtitle={titleDesc.subtitle} />
            </Box>
            <Box className='quiz-cards-container'>
                {quizId === undefined &&
                    <AllQuizzes
                        qid={qid}
                        expanded={expanded}
                        handleChange={handleChange}
                    />
                }
                {quizId !== undefined &&
                    <TakeQuiz
                        isLoaded={isLoaded}
                        setQid={setQid}
                        quizId={quizId}
                        setTitleDesc={setTitleDesc}
                        goBackToQuiz={goBackToQuiz}
                    />
                }
            </Box>
        </Box>
    )
}

export default Quiz