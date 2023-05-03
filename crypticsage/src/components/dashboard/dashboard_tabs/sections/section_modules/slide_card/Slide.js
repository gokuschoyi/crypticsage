import React, { useEffect } from 'react'
import './Slide.css'
import { Box, Button, useTheme, CardMedia, Grid } from '@mui/material'
import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';
import { useOutletContext } from "react-router-dom";
import { ChevronRightIcon, ExpandMoreIcon } from '../../../../global/Icons';

import { useSelector, useDispatch } from 'react-redux';
import { setSections, setLessons, setCounter, incrementCounter, decrementCounter, setLessonStartedFlag, setLessonCompleteFlag } from '../../SectionSlice'
import { setUserLessonStatus } from '../../../../../authorization/authSlice'
import WordDialog from './WordDialog'
import { updatUserLessonStatus } from '../../../../../../api/user'

import Video from '../../../../../../assets/lessons/candleStick.mp4'

const SlideComponent = (props) => {
    const { lessons } = props
    const theme = useTheme();
    const dispatch = useDispatch();
    const token = useSelector(state => state.auth.accessToken)
    const uid = useSelector(state => state.auth.uid)
    const { slides, counter } = useSelector(state => state.section);
    const sectionData = useSelector(state => state.section.sections)
    const lessonsData = useSelector(state => state.section.lessons)
    const [setTest] = useOutletContext();
    const videoContent = document.getElementById('slide-video')
    const hide = () => {
        setTest(true);
    }
    const slideData = slides.lessonData
    const renderTree = () => {
        return (
            <TreeView
                aria-label="file system navigator"
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpandIcon={<ChevronRightIcon />}
                sx={{ maxHeight: 240, flexGrow: 1, overflowY: 'auto' }}
            >
                <TreeItem nodeId="0" label="Introduction To the Market">
                    {lessons.map((lesson, index) => {
                        return (
                            <TreeItem nodeId={lesson.lessonId} label={lesson.chapter_title} key={index} />
                        )
                    }
                    )}
                </TreeItem>
            </TreeView>
        )
    }

    const [started, setStarted] = React.useState(true);
    const [finished, setFinished] = React.useState(false);

    const data = slideData.contents.slides

    // ----------------- Counter Test ----------------- //
    const [slideCounter, setSlideCounter] = React.useState(0);

    const chapterTitle = data[slideCounter].heading
    const chapterContent = data[slideCounter].content_text
    const highlightWords = data[slideCounter].highlightWords

    const slideVideoStartTime = data.map(slide => slide.start_timestamp)
    const slideVideoEndTime = data.map(slide => slide.end_timestamp)

    //renders twice here on first render
    useEffect(() => {
        console.log("slideCounter useEffect", slideCounter);
        dispatch(setCounter({ slideCounter: slideCounter }));

        if (slideCounter === 1) {
            dispatch(setLessonStartedFlag(true))
        }
    }, [slideCounter, dispatch]);

    const next = () => {
        if (slideCounter >= 0 && slideCounter <= data.length - 1) {
            setSlideCounter((prev) => prev + 1)
        }
    }

    const prev = () => {
        if (slideCounter >= 0) {
            setSlideCounter((prev) => prev - 1)
        }
    }

    useEffect(() => {
        if (slideCounter === 0 && videoContent !== null) {
            console.log(slideVideoStartTime, slideVideoEndTime)
            videoContent.currentTime = 0;
            videoContent.play();
            videoContent.ontimeupdate = function () {
                if (videoContent.currentTime >= slideVideoEndTime[0]) {
                    videoContent.pause();
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slideCounter, videoContent])

    useEffect(() => {
        if (slideCounter >= 1 && videoContent !== null) {
            videoContent.currentTime = slideVideoStartTime[slideCounter];
            videoContent.play();
            videoContent.ontimeupdate = function () {
                if (videoContent.currentTime >= slideVideoEndTime[slideCounter]) {
                    videoContent.pause();
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slideCounter, videoContent])

    // ----------------- Counter Test ----------------- //

    const sectionId = useSelector(state => state.section.slides.lesson_status.section_id)
    const completeLesson = async (e) => {
        e.preventDefault()
        console.log("Lesson Completed")
        dispatch(setLessonCompleteFlag(true))
        let lessonState = { ...slides.lesson_status }
        lessonState.lesson_completed = true
        let data = {
            token: token,
            payload: {
                "lesson_status": lessonState,
            }
        }
        try {
            await updatUserLessonStatus(data)
                .then((res) => {
                    let lesson_status = res.data.lessonStatus;
                    dispatch(setUserLessonStatus(lesson_status))
                    let sectionRaw = [...sectionData]
                    sectionRaw.map(({ lesson_status, ...rest }) => rest);
                    const combinedSectionArray = sectionRaw.map(section => {
                        const sectionId = section.sectionId;
                        if (lesson_status[sectionId]) {
                            return {
                                ...section,
                                section_status: lesson_status[sectionId]
                            };
                        } else {
                            return section;
                        }
                    });
                    dispatch(setSections(combinedSectionArray))

                    let selectedLS = lesson_status[sectionId]
                    let lessonRaw = [...lessonsData]
                    lessonRaw.map(({ lesson_status, ...rest }) => rest);
                    const combinedLessonArray = lessonRaw.map((lesson, index) => {
                        const lessonId = lesson.lessonId;
                        if (selectedLS[index].lesson_id === lessonId) {
                            return {
                                ...lesson,
                                lesson_status: selectedLS[index]
                            };
                        } else {
                            return lesson;
                        }
                    })
                    dispatch(setLessons(combinedLessonArray))
                })
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        if (counter === data.length - 1) {
            setFinished(true)
        }
        if (counter === 0) {
            setStarted(true)
        }
        if (counter > 0) {
            setStarted(false)
        }
        if (counter < data.length - 1) {
            setFinished(false)
        }
    }, [counter, data.length])

    const addHighlight = (props) => {
        const { chapterContent, highlightWords } = props

        const highlightedContent = `${chapterContent.replace(new RegExp(`(${highlightWords.map(word => word.keyword).join("|")})`, 'gi'), (match) => {
            return `<span class='highlight'>${match}</span>`;
        })}`;

        const contentDiv = document.getElementsByClassName('chapter-slide-content')
        contentDiv[0].innerHTML = highlightedContent

        const highlights = document.getElementsByClassName("highlight");
        for (const highlight of highlights) {
            highlight.style.color = `red`
            highlight.addEventListener("mouseover", function () {
                this.style.backgroundColor = "white";
                this.style.color = "black";
            });
            highlight.addEventListener("mouseout", function () {
                this.style.backgroundColor = "";
                this.style.color = "red";
            });
            highlight.addEventListener("click", event => {
                var word = event.target.textContent
                var meaning = highlightWords.filter(item => item.keyword === word)[0].explanation
                setWords(word, meaning)
                setOpen(true)
            });
        }
    }

    const wordPackage = {
        word: '',
        meaning: ''
    }
    const [clickedWord, setClickedWord] = React.useState(wordPackage)
    const setWords = (word, meaning) => {
        setClickedWord({ word, meaning })
    }

    const [open, setOpen] = React.useState(false);

    const handleClose = () => {
        setOpen(false);
    };

    useEffect(() => {
        addHighlight({ chapterContent, highlightWords })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chapterContent, highlightWords])

    const ChapterSlide = (props) => {
        const { chapterTitle } = props
        return (
            <Box className='chapter-slide'>
                <Box className='chapter-slide-title'>
                    {chapterTitle}
                </Box>
                <Box className='chapter-slide-content'>
                </Box>
            </Box>
        )
    }

    // const currentLessonStatus = slides.lesson_status
    // console.log("currentLessonStatus", currentLessonStatus)

    return (
        <Box className='introduction-container' onClick={hide}>
            <Box className='lesson-tree' sx={{ color: `${theme.palette.secondary.main}` }}>
                {renderTree()}
            </Box>
            <WordDialog open={open} handleClose={handleClose} word={clickedWord.word} meaning={clickedWord.meaning} />
            <Grid container spacing={{ xs: 4, sm: 3, md: 2 }} className='slide-container'>
                <Grid item xs={12} sm={12} md={12} lg={6} xl={6} display='flex' alignItems='center'>
                    <Box className='chapter-slide-container' sx={{ color: `${theme.palette.secondary.main}` }}>
                        {ChapterSlide({ chapterTitle })}
                    </Box>
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={6} xl={6}>
                    <Box className='slide-video-box'>
                        <CardMedia
                            id='slide-video'
                            component='video'
                            src={`${Video}`}
                            controls
                        >
                        </CardMedia>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                    <Box>{slideCounter + 1}</Box>
                    <Box className='slide-actions'>
                        {started ? null :
                            <Button
                                onClick={prev}
                                variant="text"
                                style={{ color: `#000000`, backgroundColor: 'red', margin: '5px', marginRight: '25px', height: '30px' }}
                                sx={{
                                    ':hover': {
                                        color: `black !important`,
                                        backgroundColor: 'white !important',
                                    },
                                }}>PREV</Button>
                        }
                        {finished
                            ?
                            <Button
                                onClick={(e) => completeLesson(e)}
                                variant="text"
                                style={{ color: `#000000`, backgroundColor: 'red', margin: '5px', marginRight: '25px', height: '30px' }}
                                sx={{
                                    ':hover': {
                                        color: `black !important`,
                                        backgroundColor: 'white !important',
                                    },
                                }}>COMPLETE
                            </Button>
                            :
                            <Button
                                onClick={next}
                                variant="text"
                                style={{ color: `#000000`, backgroundColor: 'red', margin: '5px', marginRight: '25px', height: '30px' }}
                                sx={{
                                    ':hover': {
                                        color: `black !important`,
                                        backgroundColor: 'white !important',
                                    },
                                }}>NEXT
                            </Button>
                        }
                    </Box>
                </Grid>
            </Grid>
        </Box>
    )
}

export default SlideComponent