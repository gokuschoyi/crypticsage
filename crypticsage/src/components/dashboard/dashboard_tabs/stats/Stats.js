import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import {
    setCryptoDataAutoComplete,
} from './StatsSlice.js';

import { setLessonFlag, setSectionFlag } from '../sections/SectionSlice'
import { setSidebarState } from '../../global/SideBarSlice'

import './Stats.css'

import { getCryptoData } from '../../../../api/crypto';

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation, Mousewheel } from "swiper";
import "swiper/css/pagination";
import 'swiper/css/navigation';
import "swiper/css";

import Header from '../../global/Header';

import {
    Box,
    Grid,
    Skeleton
} from '@mui/material';
import {
    CustomCard
    , CustomLongCard
    , CustomTokenCard
    , UploadTradingViewDataCard
    , CoinChartBox
    , InProgressCard
} from './stat_components';

const Stats = (props) => {
    const { title, subtitle } = props
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [cryptoData, setCryptoData] = useState(null);
    const token = useSelector(state => state.auth.accessToken);
    const wordData = useSelector(state => state.stats.wordOfTheDay)

    const CDAutoComplete = useSelector(state => state.stats.cryptoDataAutoComplete)
    const optionsLength = CDAutoComplete.length;

    //initial load of token data for charts ans token slider box
    const isMounted = useRef(false);
    useEffect(() => {
        if (!isMounted.current) { // Only run if the component is mounted
            isMounted.current = true; // Set the mount state to true after the first run
            if (optionsLength === 0) {
                // console.log('initial load of token data for charts', optionsLength)
                let result;
                try {
                    let data = {
                        token: token
                    }
                    getCryptoData(data).then((res) => {
                        result = res.data;
                        setCryptoData(result.cryptoData);
                        dispatch(setCryptoDataAutoComplete({ cryptoData: result.cryptoData, yf_ticker: result.yf_ticker }))
                    })
                } catch (e) {
                    console.log(e)
                }
            } else {
                setCryptoData(CDAutoComplete);
            }
        }
    }, [optionsLength, dispatch, token, CDAutoComplete])

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
                    const centerX = left + width / 2 - width / 2;
                    const centerY = top + height / 2 - height / 2;
                    itemBg[0].classList.add('active');
                    itemBg[0].style.width = `${width}px`;
                    itemBg[0].style.height = `${height}px`;
                    itemBg[0].style.transform = `translateX(${centerX}px) translateY(${centerY + scrollTop}px)`;
                })
                box.addEventListener('mouseout', () => {
                    const { left, top, width, height } = box.getBoundingClientRect();
                    let scrollTop = window.pageYOffset
                    const centerX = left + width / 2 - width / 2;
                    const centerY = top + height / 2 - height / 2;
                    itemBg[0].style.transform = `translateX(${centerX}px) translateY(${centerY + scrollTop}px)`;
                    itemBg[0].style.width = `${0}px`;
                    itemBg[0].style.height = `${0}px`;
                    itemBg[0].classList.remove('active');
                })
            })
        } else {
            var itemBgs = document.getElementsByClassName('item-bg')
            itemBgs[0].classList.remove('active');
        }
    })

    const recentLessonAndQuiz = useSelector(state => state.stats.recent_lesson_quiz)

    //set sectionId in redux store
    const redirectToLesson = ({ type }) => {
        if (type === 'initial') {
            console.log('redirect to lesson', type)
            dispatch(setSidebarState("sections"))
            dispatch(setSectionFlag(false))
            dispatch(setLessonFlag(true))
            const url = `sections/${recentLessonAndQuiz.nextLesson.section_id}`
            // console.log(url)
            navigate(url)
        } else {
            console.log('redirect to lesson', type)
            dispatch(setSidebarState("sections"))
            dispatch(setSectionFlag(false))
            dispatch(setLessonFlag(true))
            const url = `sections/${recentLessonAndQuiz.nextLesson.section_id}`
            // console.log(url)
            navigate(url)
        }
    };

    const redirectToQuiz = () => {
        console.log('redirect to quiz')
        const url = `quiz/${recentLessonAndQuiz.nextQuiz.quiz_id}`
        console.log(url)
        dispatch(setSidebarState("quiz"))
        navigate(url)
    }

    const initialRedirectToQuiz = () => {
        console.log('initial redirect to quiz')
        const url = `quiz/${recentLessonAndQuiz.nextQuiz.quiz_id}`
        console.log(url)
        dispatch(setSidebarState("quiz"))
        navigate(url)
    }

    function isEmptyObject(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return true; // Treat non-object values as empty
        }
        return Object.keys(obj).length === 0;
    }

    return (
        <Box className='stat-container'>
            <Box width='-webkit-fill-available'>
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
                                        cardType={'lesson'}
                                        title='Welcome to CSage'
                                        next={recentLessonAndQuiz && recentLessonAndQuiz.nextLesson}
                                        mostRecent={'initial_lesson'}
                                        buttonName="START"
                                        buttonHandler={redirectToLesson.bind(null, { type: 'initial' })}
                                    />
                                    :
                                    <CustomCard
                                        cardType={'lesson'}
                                        title='Lessons'
                                        next={recentLessonAndQuiz && recentLessonAndQuiz.nextLesson}
                                        mostRecent={recentLessonAndQuiz && recentLessonAndQuiz.mostRecentLesson}
                                        buttonName="NEXT LESSON"
                                        buttonHandler={redirectToLesson.bind(null, { type: 'not-initial' })}
                                    />
                                }
                            </Grid>
                            <Grid item xs={12} sm={12} md={6} lg={6} xl={3}>
                                {isEmptyObject(recentLessonAndQuiz.mostRecentQuiz) === true
                                    ?
                                    <CustomCard
                                        cardType={'quiz'}
                                        title='Take your first Quiz'
                                        next={recentLessonAndQuiz && recentLessonAndQuiz.nextQuiz}
                                        mostRecent={'initial_quiz'}
                                        buttonName="START"
                                        buttonHandler={initialRedirectToQuiz}
                                    />
                                    :
                                    <CustomCard
                                        cardType={'quiz'}
                                        title='Quizzes'
                                        next={recentLessonAndQuiz && recentLessonAndQuiz.nextQuiz}
                                        mostRecent={recentLessonAndQuiz && recentLessonAndQuiz.mostRecentQuiz}
                                        buttonName="NEXT QUIZ"
                                        buttonHandler={redirectToQuiz}
                                    />
                                }
                            </Grid>
                            <Grid item xs={12} sm={12} md={6} lg={6} xl={3}>
                                <InProgressCard />
                            </Grid>
                            <Grid item xs={12} sm={12} md={6} lg={6} xl={3}>
                                {cryptoData === null ? <Skeleton variant="rectangle" sx={{ borderRadius: '20px' }} width="100%" height='100%' /> :
                                    <Swiper
                                        centeredSlides={true}
                                        /* autoplay={{
                                            delay: 2500,
                                            disableOnInteraction: false,
                                        }} */ /* weird ws call in network tab. Check Later*/
                                        loop={true}
                                        spaceBetween={30}
                                        pagination={{
                                            clickable: true,
                                            dynamicBullets: true,
                                        }}
                                        navigation={true}
                                        mousewheel={true}
                                        modules={[Autoplay, Pagination, Navigation, Mousewheel]}

                                        className="mySwiper"
                                    >
                                        {cryptoData && cryptoData.map((token, index) => {
                                            return (
                                                <SwiperSlide key={index}>
                                                    <CustomTokenCard
                                                        key={index}
                                                        title={token.symbol}
                                                        price={token.current_price?.toFixed(2)}
                                                        image={token.image_url}
                                                        price_change_24h={token.price_change_24h}
                                                        price_change_percentage_24h={token.price_change_percentage_24h}
                                                        market_cap_rank={token.market_cap_rank}
                                                        high_24h={token.high_24h}
                                                        low_24h={token.low_24h}
                                                        symbol={token.matched}
                                                    />
                                                </SwiperSlide>
                                            )
                                        })}
                                    </Swiper>
                                }
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid item xs={12} sm={12} md={12} lg={6} xl={12} className='coin-chart-grid-box'>
                        <CoinChartBox />
                    </Grid>
                </Grid>
                <Grid container spacing={3} pt={4}>
                    <Grid item xs={12} sm={12} md={6} lg={4}>
                        <CustomLongCard title='IN-COMPLETE JOURNAL ENTRY' subtitle='20/10/2022' content='Complete your last entry' buttonName="GO TO JOURNAL" />
                    </Grid>
                    <Grid item xs={12} sm={12} md={6} lg={4}>
                        <CustomLongCard title='JOURNAL ENTRY' subtitle='20/10/2022' content='Make an entry to your Journal' buttonName="GO TO JOURNAL" />
                    </Grid>
                    <Grid item xs={12} sm={12} md={6} lg={4}>
                        <CustomLongCard title='GO TO MODELS' subtitle='20/10/2023' content='View your various models' buttonName="GO TO MODELS" />
                    </Grid>
                    <Grid item xs={12} sm={12} md={6} lg={6}>
                        <UploadTradingViewDataCard title='Upload Trading-View Files' subtitle='Upload your Trading View Files' buttonName="UPLOAD" />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12} lg={6}>
                        {Object.keys(wordData).length !== 0 &&
                            <CustomLongCard
                                title='WORD OF THE DAY'
                                content={wordData.word}
                                subtitle={wordData.meaning}
                                link={wordData.url}
                            />
                        }
                    </Grid>
                </Grid>
            </Box>
        </Box>
    )
}

export default Stats