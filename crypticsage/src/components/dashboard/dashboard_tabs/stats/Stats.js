import React, { useEffect, useState, useRef } from 'react'
import { useOutletContext, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import {
    setCryptoDataAutoComplete,
    setWordOfTheDay
} from './StatsSlice.js';

import { setLessonFlag, setSectionFlag } from '../sections/SectionSlice'
import { setSidebarState } from '../../global/SideBarSlice'

import './Stats.css'

import { getCryptoData, getWordOfTheDay } from '../../../../api/crypto';

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper";
import "swiper/css/pagination";
import "swiper/css";

import CustomCard from './stat_components/CustomCard.js';
import CustomLongCard from './stat_components/CustomLongCard.js';
import CustomTokenCard from './stat_components/CustomTokenCard.js';
import UploadTradingViewDataCard from './stat_components/UploadTradingViewDataCard.js';
import Header from '../../global/Header';

import {
    Box,
    Typography,
    Button,
    useTheme,
    Grid,
    Autocomplete,
    TextField,
    FormControlLabel,
    Checkbox,
    Skeleton,
    Switch
} from '@mui/material';
import CoinChartBox from './stat_components/CoinChartBox';

const Stats = (props) => {
    const { title, subtitle } = props
    const theme = useTheme();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [setTest] = useOutletContext();
    const hide = () => {
        setTest(true);
    }

    const [cryptoData, setCryptoData] = useState(null);
    const token = useSelector(state => state.auth.accessToken);

    const CDAutoComplete = useSelector(state => state.stats.cryptoDataAutoComplete)
    const optionsLength = CDAutoComplete.length;

    //initial load of token data for charts ans token slider box
    const isMounted = useRef(false);
    useEffect(() => {
        if (!isMounted.current) { // Only run if the component is mounted
            isMounted.current = true; // Set the mount state to true after the first run
            if (optionsLength === 0) {
                console.log('initial load of token data for charts', optionsLength)
                let result;
                try {
                    let data = {
                        token: token
                    }
                    getCryptoData(data).then((res) => {
                        result = res.data.cryptoData;
                        setCryptoData(result);
                        dispatch(setCryptoDataAutoComplete(result))
                    })
                } catch (e) {
                    console.log(e)
                }
            } else {
                setCryptoData(CDAutoComplete);
            }
        }
    }, [optionsLength, dispatch, token, CDAutoComplete])

    //initial load of word of the day
    const WODMounted = useRef(false);
    const [wordOfTheDay, setWordOfTheDayL] = useState({});
    const wordData = useSelector(state => state.stats.wordOfTheDay)
    useEffect(() => {
        if (!WODMounted.current) { // Only run if the component is mounted
            WODMounted.current = true; // Set the mount state to true after the first run
            if (Object.keys(wordData).length === 0) {
                let result;
                try {
                    let data = {
                        token: token
                    }
                    getWordOfTheDay(data).then((res) => {
                        result = res.data.word;
                        setWordOfTheDayL(result);
                        dispatch(setWordOfTheDay(result));
                    })
                } catch (e) {
                    console.log(e)
                }
            } else {
                setWordOfTheDayL(wordData);
            }
        }
    }, [token, dispatch, wordData])


    //interval fetch of token for token slider // *** activate later ***
    /* useEffect(() => {
        const intervalId = setInterval(() => {
            let data = {
                token: token
            }
            try {
                getCryptoData(data).then(response => {
                    setCryptoData(response.data.cryptoData);
                })
            } catch (err) {
                console.log(err);
            }
        }, 30000);

        return () => {
            clearInterval(intervalId);
        };
    }, [token]); */

    //hover effect on tabs
    const hoverEffectPreference = useSelector(state => state.auth.preferences.dashboardHover)
    useEffect(() => {
        if (hoverEffectPreference) {
            var itemBg = document.getElementsByClassName('item-bg')
            var hoverBox = document.querySelectorAll('.hover');
            hoverBox.forEach((box) => {
                box.addEventListener('mouseover', () => {
                    let scrollTop = window.pageYOffset
                    const { left, top, width, height } = box.getBoundingClientRect();
                    itemBg[0].classList.add('active');
                    itemBg[0].style.width = `${width}px`;
                    itemBg[0].style.height = `${height}px`;
                    itemBg[0].style.transform = `translateX(${left}px) translateY(${top + scrollTop}px)`;
                })
                box.addEventListener('mouseout', () => {
                    itemBg[0].classList.remove('active');
                })
            })
        } else {
            var itemBgs = document.getElementsByClassName('item-bg')
            itemBgs[0].classList.remove('active');
        }
    })

    //set sectionId in redux store
    const redirectToLesson = () => {
        dispatch(setSidebarState("sections"))
        dispatch(setSectionFlag(false))
        dispatch(setLessonFlag(true))
        navigate('sections/5119f37b-ef44-4272-a536-04af51ef4bbc')
    };
    const redirectToQuiz = () => {
        dispatch(setSidebarState("quiz"))
        navigate('quiz/2c4a5ef5-8ab4-409c-8b0f-4d8b2c063fe1')
    }

    const recentLessonAndQuiz = useSelector(state => state.stats.recent_lesson_quiz)

    function isEmptyObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return true; // Treat non-object values as empty
        }
        return Object.keys(obj).length === 0;
    }

    const wsRef = useRef(false)
    const user_uid = useSelector(state => state.auth.uid)

    useEffect(() => {
        if (!wsRef.current) {
            wsRef.current = true
            console.log(user_uid)
            const ws = new WebSocket('ws://localhost:8081')
            ws.onmessage = (event) => {
                console.log(event)
                document.getElementById('w-socket').innerHTML +=
                    'Message from server: ' + event.data + "<br>";
            };
            setTimeout(() => {
                ws.send(`${user_uid}`);
            }, 1000)
        }
    })

    return (
        <Box className='stat-container' onClick={hide}>
            <Box height='100%' width='-webkit-fill-available'>
                <Header title={title} subtitle={subtitle} />
                <Box id="w-socket"></Box>
            </Box>
            <Box className='stat-cards-container'>
                <div className="item-bg"></div>
                <Grid container spacing={4}>
                    <Grid item xs={12} sm={12} md={12} lg={6} xl={12} display='flex' alignItems='center'>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={12} md={6} lg={6} xl={3} className='single-card-grid'>
                                {isEmptyObject(recentLessonAndQuiz.mostRecentLesson) === true
                                    ?
                                    <CustomCard
                                        title='Welcome to CrypticSage'
                                        value=""
                                        date={new Date().toLocaleString('au', { hour12: true })}
                                        buttonName="Start" />

                                    :
                                    <CustomCard
                                        title='Recent Chapter'
                                        value={recentLessonAndQuiz && recentLessonAndQuiz.mostRecentLesson.lesson_name}
                                        date={recentLessonAndQuiz && recentLessonAndQuiz.mostRecentLesson.lesson_completed_date}
                                        buttonName="NEXT LESSON"
                                        buttonHandler={redirectToLesson}
                                    />
                                }
                            </Grid>
                            <Grid item xs={12} sm={12} md={6} lg={6} xl={3}>
                                {isEmptyObject(recentLessonAndQuiz.mostRecentQuiz) === true
                                    ?
                                    <CustomCard
                                        title='Take your first Quiz'
                                        value=""
                                        date={new Date().toLocaleString('au', { hour12: true })}
                                        buttonName="START" />
                                    :
                                    <CustomCard
                                        title='Recent Quiz'
                                        value={recentLessonAndQuiz && recentLessonAndQuiz.mostRecentQuiz.quiz_name}
                                        date={recentLessonAndQuiz && recentLessonAndQuiz.mostRecentQuiz.quiz_completed_date}
                                        buttonName="GO TO QUIZ"
                                        buttonHandler={redirectToQuiz}
                                    />
                                }
                            </Grid>
                            <Grid item xs={12} sm={12} md={6} lg={6} xl={3}>
                                <UploadTradingViewDataCard title='Upload Trading-View Files' subtitle='Upload your Trading View Files' buttonName="UPLOAD" />
                            </Grid>
                            <Grid item xs={12} sm={12} md={6} lg={6} xl={3}>
                                <Swiper
                                    centeredSlides={true}
                                    /* autoplay={{
                                        delay: 2500,
                                        disableOnInteraction: false,
                                    }} */ /* weird ws call in network tab. Check Later*/
                                    loop={true}
                                    pagination={{
                                        clickable: true,
                                        dynamicBullets: true,
                                    }}
                                    navigation={false}
                                    modules={[Autoplay, Pagination]}
                                    className="mySwiper"
                                >
                                    {cryptoData && cryptoData.map((token, index) => {
                                        return (
                                            <SwiperSlide key={index}>
                                                <CustomTokenCard
                                                    title={token.symbol}
                                                    price={`$ ${token.current_price}`}
                                                    image={`${token.image_url}`}
                                                    price_change_24h={token.price_change_24h}
                                                    price_change_percentage_24h={token.price_change_percentage_24h}
                                                    market_cap_rank={token.market_cap_rank}
                                                    high_24h={token.high_24h}
                                                    low_24h={token.low_24h}
                                                />
                                            </SwiperSlide>
                                        )
                                    })}
                                </Swiper>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12} lg={6} xl={12} className='coin-chart-grid-box'>
                        <CoinChartBox />
                    </Grid>
                </Grid>
                <Grid container spacing={2} pt={4}>
                    <Grid item xs={12} sm={12} md={12} lg={12}>
                        {Object.keys(wordOfTheDay).length !== 0 &&
                            <CustomLongCard
                                title='WORD OF THE DAY'
                                content={wordOfTheDay.word}
                                subtitle={wordOfTheDay.meaning}
                                link={wordOfTheDay.url}
                            />
                        }
                    </Grid>
                    <Grid item xs={12} sm={12} md={6} lg={6}>
                        <CustomLongCard title='IN-COMPLETE JOURNAL ENTRY' subtitle='20/10/2022' content='Complete your last entry' buttonName="GO TO JOURNAL" />
                    </Grid>
                    <Grid item xs={12} sm={12} md={6} lg={6}>
                        <CustomLongCard title='JOURNAL ENTRY' subtitle='20/10/2022' content='Make an entry to your Journal' buttonName="GO TO JOURNAL" />
                    </Grid>
                </Grid>
            </Box>
        </Box >
    )
}

export default Stats