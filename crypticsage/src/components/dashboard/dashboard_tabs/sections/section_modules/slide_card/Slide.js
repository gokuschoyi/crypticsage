import React, { useEffect } from 'react'
import './Slide.css'
import { Box, Button, useTheme, CardMedia, Grid } from '@mui/material'
import TreeView from '@mui/lab/TreeView';
import TreeItem from '@mui/lab/TreeItem';
import { useOutletContext } from "react-router-dom";
import { ChevronRightIcon, ExpandMoreIcon } from '../../../../global/Icons';

import { useSelector, useDispatch } from 'react-redux';
import { incrementCounter, decrementCounter } from '../../SectionSlice'

import WordDialog from './WordDialog'

import Video from '../../../../../../assets/lessons/candleStick.mp4'

const SlideComponent = (props) => {
    const { lessons } = props
    const theme = useTheme();
    const dispatch = useDispatch();
    const { slides, counter } = useSelector(state => state.section);
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

    const chapterTitle = data[counter].heading
    const chapterContent = data[counter].content_text
    const highlightWords = data[counter].highlightWords

    var sTimes = data.map(item => item.start_timestamp)
    var ssTime = data.map(item => item.start_timestamp)
    var eTimes = data.map(item => item.end_timestamp)
    var startTimes = sTimes.splice(1, sTimes.length)
    var endTimes = eTimes.splice(1, eTimes.length)

    /* useEffect(() => {
        console.log("latest", counter)
    }, [counter]) */

    useEffect(() => {
        if (counter === 0 && videoContent !== null) {
            videoContent.currentTime = sTimes[0];
            videoContent.play();
            videoContent.ontimeupdate = function () {
                if (videoContent.currentTime >= eTimes[0]) {
                    videoContent.pause();
                }
            }
        }
    }, [counter, videoContent])

    const next = () => {
        if (counter <= data.length - 1 && counter >= 0) {
            dispatch(incrementCounter())
            videoContent.currentTime = startTimes[counter];
            videoContent.play();
            videoContent.ontimeupdate = function () {
                if (videoContent.currentTime >= endTimes[counter]) {
                    videoContent.pause();
                }
            }
        }
    }

    const prev = () => {
        if (counter >= 0) {
            dispatch(decrementCounter())
            videoContent.currentTime = ssTime[counter];
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
                        >
                        </CardMedia>
                    </Box>
                </Grid>
                <Grid item xs={12} sm={12} md={12} lg={12} xl={12}>
                    <Box>{counter + 1}</Box>
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