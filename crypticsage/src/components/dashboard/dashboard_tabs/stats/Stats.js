import React, { useEffect, useState, useRef } from 'react'
import { useOutletContext } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import {
    setCryptoDataAutoComplete,
    setSelectedCoinData,
    setSelectedCoinName,
    setTimePeriod,
    setWordOfTheDay
} from './StatsSlice.js';
import { toast } from 'react-toastify';

import './Stats.css'

import { ArrowDropDownIcon, ArrowDropUpIcon } from '../../global/Icons';
import { getCryptoData, getHistoricalData, getWordOfTheDay } from '../../../../api/crypto';

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper";
import "swiper/css/pagination";
import "swiper/css";

import CoinChart from './CoinChart';
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
    Skeleton
} from '@mui/material';

const Stats = (props) => {
    const { title, subtitle } = props
    const theme = useTheme();
    const dispatch = useDispatch();
    const [setTest] = useOutletContext();
    const hide = () => {
        setTest(true);
    }

    const [cryptoData, setCryptoData] = useState(null);
    const token = useSelector(state => state.auth.accessToken);

    // const [chartTokens, setChartTokens] = useState([]);
    const [options, setOptions] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [selectedTokenName, setSelectedTokenName] = useState('');

    const CDAutoComplete = useSelector(state => state.stats.cryptoDataAutoComplete)
    const optionsLength = CDAutoComplete.length;
    const SCData = useSelector(state => state.stats.selectedCoinData)
    const SCName = useSelector(state => state.stats.selectedCoinName)
    const SCToken = useSelector(state => state.stats.selectedTokenName)
    const timePeriod = useSelector(state => state.stats.timePeriod)
    // console.log(CDAutoComplete)

    //initial load of token data for charts
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
            }
        }
    }, [optionsLength, dispatch, token])

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

    const [skWidth, setSkWidth] = useState(0);
    const [skHeight, setSkHeight] = useState(0);

    //set height ofchart container and skeleton
    useEffect(() => {
        let coinChartGridBox = document.getElementsByClassName('coin-chart-grid-box')[0];
        let tokenSelector = document.getElementsByClassName('token-selector-box')[0];
        let height = (coinChartGridBox.clientHeight - tokenSelector.clientHeight) - 40;
        if(height < 0) {
            height = 500;
        }
        let coinChartBox = document.getElementsByClassName('coin-chart-box')[0];
        let sHeight = coinChartBox.clientHeight * 0.8;
        let sWidth = coinChartBox.clientWidth * 0.8;
        setSkHeight(sHeight)
        setSkWidth(sWidth)
        coinChartBox.style.setProperty('--height', `${height}px`)
    }, [])

    //resize event for chart container and skeleton
    const handleResize = () => {
        let coinChartGridBox = document.getElementsByClassName('coin-chart-grid-box')[0];
        let tokenSelector = document.getElementsByClassName('token-selector-box')[0];
        let height = (coinChartGridBox.clientHeight - tokenSelector.clientHeight) - 40;
        let coinChartBox = document.getElementsByClassName('coin-chart-box')[0];
        let sHeight = coinChartBox.clientHeight * 0.8;
        let sWidth = coinChartBox.clientWidth * 0.8;
        setSkHeight(sHeight)
        setSkWidth(sWidth)
        coinChartBox.style.setProperty('--height', `${height}px`)
    }
    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        }
    })


    //setting initial values for MUI autocomplete and value and options states
    useEffect(() => {
        if (CDAutoComplete.length > 0) {
            setCryptoData(CDAutoComplete) /// *** remove later ***
            let newOptions = CDAutoComplete.map((option) => option.name)
            if (SCName !== '' && SCToken !== '') {
                let inputValue = SCName
                let tokenName = SCToken
                setOptions(newOptions)
                setInputValue(inputValue)
                setSelectedTokenName(tokenName)
            } else {
                let inputValue = CDAutoComplete[0].name
                let tokenName = CDAutoComplete[0].symbol
                setOptions(newOptions)
                setInputValue(inputValue)
                setSelectedTokenName(tokenName)
            }
        }
    }, [CDAutoComplete, SCName, SCToken])

    //handling input change for MUI autocomplete
    const handleInputChange = (event, newInputValue) => {
        setError(false)
        setErrorMessage('')
        setChartData([])
        setInputValue(newInputValue);
        let tokenSymbol = CDAutoComplete.filter((token) => token.name === newInputValue)
        setSelectedTokenName(tokenSymbol[0].symbol)
    }

    //handling MUI autocomplete initial checkbox and initial chart load
    useEffect(() => {
        if (selectedTokenName !== '') {
            if (SCToken !== selectedTokenName) {
                let checked;
                for (let key in timePeriod) {
                    if (timePeriod[key].checked) {
                        checked = key
                    }
                }
                let data = {
                    token: token,
                    tokenName: selectedTokenName,
                    timePeriod: timePeriod[checked].timePeriod,
                    timeFrame: timePeriod[checked].timeFrame
                }
                try {
                    getHistoricalData(data).then((res) => {
                        dispatch(setSelectedCoinName({ coinName: inputValue, tokenName: selectedTokenName }))
                        setChartData(res.data.historicalData.Data.Data)
                        dispatch(setSelectedCoinData(res.data.historicalData.Data.Data))
                    })

                } catch (e) {
                    console.log(e)
                }
            } else {
                setChartData(SCData)
            }
        } else return;

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTokenName, SCData, SCToken, SCName, dispatch])


    const [chartData, setChartData] = useState([])
    const [error, setError] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    //handling time period checkbox and fetch data for chart
    const handleTimePeriodChange = async (event) => {
        if (selectedTokenName === '') { setError(true); setErrorMessage("Please fill this field"); return }
        else {
            setError(false);
            setErrorMessage("")
            setChartData([])
            const { name } = event.target
            //check if any timePeriodState is checked and uncheck it and set checked for event.name to true
            const newTimePeriodState = {};
            let foundChecked = false;
            for (const [k, v] of Object.entries(timePeriod)) {
                if (k === name) {
                    newTimePeriodState[k] = {
                        ...v,
                        checked: !v.checked
                    };
                    foundChecked = true;
                } else if (v.checked) {
                    newTimePeriodState[k] = {
                        ...v,
                        checked: false
                    };
                } else {
                    newTimePeriodState[k] = v;
                }
            }
            if (!foundChecked) {
                newTimePeriodState[name] = {
                    ...newTimePeriodState[name],
                    checked: true
                };
            }

            dispatch(setTimePeriod(newTimePeriodState))

            let data = {
                token: token,
                tokenName: selectedTokenName,
                timePeriod: newTimePeriodState[name].timePeriod,
                timeFrame: newTimePeriodState[name].timeFrame
            }
            try {
                let res = await getHistoricalData(data)
                setChartData(res.data.historicalData.Data.Data)
                dispatch(setSelectedCoinData(res.data.historicalData.Data.Data))
            } catch (e) {
                console.log(e)
            }
        }
    }

    const showToast = () => {
        toast.success('Hello World jdjdj', {
            data: {
                title: 'Hello World Again',
                text: 'We are here again with another article'
            },
            toastId: `hello-world${String.fromCharCode(Math.floor(Math.random() * 26) + 65)}`,
        });
    };

    const CustomCard = (props) => {
        const { title, subtitle, value, buttonName } = props
        return (
            <Box className='card-holder hover'>
                <Box className='info-box'>
                    <Typography sx={{ fontSize: 20, fontWeight: '500', textAlign: 'left' }} gutterBottom>
                        {title} :
                    </Typography>
                    <Typography sx={{ fontSize: 50, fontWeight: '300', textAlign: 'left', marginBottom: '0px' }} gutterBottom>
                        {value}
                    </Typography>
                    <Typography sx={{ fontSize: 16, fontWeight: '300', textAlign: 'left' }} gutterBottom>
                        {subtitle}
                    </Typography>
                </Box>
                <Box className='action-box'>
                    <Button onClick={showToast} className='card-button' sx={{
                        ':hover': {
                            color: 'black !important',
                            backgroundColor: 'red !important',
                            transition: '0.5s'
                        },
                        backgroundColor: `${theme.palette.primary.main}`
                    }} size="small">{buttonName}</Button>
                </Box>
            </Box>
        )
    };

    const CustomLongCard = (props) => {
        const { title, content, subtitle, link } = props
        return (
            <Box
                className='card-holder-long hover'
            >
                <Box className='info-box'>
                    <Typography sx={{ fontSize: 20, fontWeight: '500', textAlign: 'left' }} gutterBottom>
                        {title} :
                    </Typography>
                    <Typography sx={{ fontSize: 40, fontWeight: '300', textAlign: 'left', marginBottom: '0px' }} gutterBottom>
                        {content}
                    </Typography>
                    <Typography sx={{ fontSize: 16, fontWeight: '300', textAlign: 'left' }} gutterBottom>
                        {subtitle}
                    </Typography>
                </Box>
                <Box className='action-box'>
                    <a href={link} target='_blank' rel="noreferrer">Read More</a>
                </Box>
            </Box>
        )
    }

    const CustonTextCard = (props) => {
        const { title, price, image, price_change_24h, price_change_percentage_24h, market_cap_rank, high_24h, low_24h } = props
        return (
            <Box className='card-holder-slider' >
                <Box className='info-box'>
                    <Box className='token-box'>
                        <Typography sx={{ fontSize: 20, fontWeight: '500', textAlign: 'left' }} gutterBottom>
                            {title.toUpperCase()}
                        </Typography>
                        <Box display='flex' flexBasis='row' gap='1rem'>
                            {market_cap_rank &&
                                <Box>
                                    <Typography sx={{ fontSize: 16, fontWeight: '300', textAlign: 'left' }} gutterBottom>
                                        {market_cap_rank}
                                    </Typography>
                                </Box>
                            }
                            <img className='token-image' loading='lazy' src={`${image}`} alt='crypto' />
                        </Box>
                    </Box>
                    <Typography sx={{ fontSize: 25, fontWeight: '300', textAlign: 'left', marginBottom: '0px' }} gutterBottom>
                        {price}
                    </Typography>
                    <Box className='token-diff-box'>
                        <Typography className='price_change_24h' sx={{ fontSize: 16, fontWeight: '600', textAlign: 'left', color: price_change_24h > 0 ? 'green' : 'red' }} gutterBottom>
                            {price_change_24h.toFixed(5)}
                        </Typography>
                        {price_change_24h > 0 ? <ArrowDropUpIcon sx={{ color: 'green' }} /> : <ArrowDropDownIcon sx={{ color: 'red' }} />}
                        <Typography sx={{ fontSize: 16, fontWeight: '600', textAlign: 'left', color: price_change_percentage_24h < 0 ? 'red' : 'green' }} gutterBottom>
                            {`${price_change_percentage_24h.toFixed(2)}%`}
                        </Typography>
                    </Box>
                    <Box className='high-low-box'>
                        <Box className='center-col'>
                            <Typography sx={{ fontSize: 14, fontWeight: '300', textAlign: 'left' }} gutterBottom>
                                H 24h
                            </Typography>
                            <Typography sx={{ fontSize: 12, fontWeight: '300', textAlign: 'left' }} gutterBottom>
                                {high_24h}
                            </Typography>
                        </Box>
                        <Box className='center-col'>
                            <Typography sx={{ fontSize: 14, fontWeight: '300', textAlign: 'left' }} gutterBottom>
                                L 24h
                            </Typography>
                            <Typography sx={{ fontSize: 12, fontWeight: '300', textAlign: 'left' }} gutterBottom>
                                {low_24h}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
                <Box className='action-box'>

                </Box>
            </Box>
        )
    }

    return (
        <Box className='stat-container' onClick={hide}>
            <Box height='100%' width='-webkit-fill-available'>
                <Header title={title} subtitle={subtitle} />
            </Box>
            <Box className='stat-cards-container'>
                <div className="item-bg"></div>
                <Grid container spacing={4}>
                    <Grid item xs={12} sm={12} md={12} lg={6} xl={12}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={12} md={6} lg={6} xl={3} className='single-card-grid'>
                                <CustomCard title='Recent Chapter' subtitle='Features' value='6/30' buttonName="GO TO LESSON 6" />
                            </Grid>
                            <Grid item xs={12} sm={12} md={6} lg={6} xl={3}>
                                <CustomCard title='Recent Quiz' subtitle='Technical Analysis Quiz 2' value='8/45' buttonName="GO TO QUIZ" />
                            </Grid>
                            <Grid item xs={12} sm={12} md={6} lg={6} xl={3}>
                                <CustomCard title='New Challenge' subtitle='Technical Analysis Quiz 2' buttonName="GO TO CHALLENGE" />
                            </Grid>
                            <Grid item xs={12} sm={12} md={6} lg={6} xl={3}>
                                <Swiper
                                    centeredSlides={true}
                                    autoplay={{
                                        delay: 2500,
                                        disableOnInteraction: false,
                                    }}
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
                                                <CustonTextCard
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
                        <Box className='token-selector-box'>
                            <Box className='token-selector'>
                                <Typography sx={{ fontSize: 26, fontWeight: '600', textAlign: 'left', color: `${theme.palette.secondary.main}`, marginBottom: '0px' }} gutterBottom>Coin</Typography>
                                {options && options.length > 0 &&
                                    <Box>
                                        <Autocomplete
                                            size='small'
                                            disableClearable={true}
                                            className='tokenSelector-autocomplete'
                                            value={inputValue}
                                            onChange={(event, newInputValue) => handleInputChange(event, newInputValue)}
                                            id="controllable-states-demo"
                                            options={options}
                                            sx={{ width: 300 }}
                                            renderInput={(params) => <TextField
                                                error={error}
                                                helperText={errorMessage}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        '& fieldset': {
                                                            borderColor: 'white',
                                                        }
                                                    }
                                                }}
                                                {...params}
                                                label="Select a Token"
                                                color="secondary"
                                            />}
                                        />
                                    </Box>
                                }
                            </Box>
                            <Box className='time-period-checkbox'>
                                <FormControlLabel
                                    value="30m"
                                    control={<Checkbox name='thirtyM' onChange={handleTimePeriodChange} checked={timePeriod.thirtyM.checked} color='secondary' />}
                                    label="30m"
                                    labelPlacement="start"
                                />
                                <FormControlLabel
                                    value="2h"
                                    control={<Checkbox name='twoH' onChange={handleTimePeriodChange} checked={timePeriod.twoH.checked} color='secondary' />}
                                    label="2h"
                                    labelPlacement="start"
                                />
                                <FormControlLabel
                                    value="4h"
                                    control={<Checkbox name='fourH' onChange={handleTimePeriodChange} checked={timePeriod.fourH.checked} color='secondary' />}
                                    label="4h"
                                    labelPlacement="start"
                                />
                                <FormControlLabel
                                    value="1D"
                                    control={<Checkbox name='oneD' onChange={handleTimePeriodChange} checked={timePeriod.oneD.checked} color='secondary' />}
                                    label="1D"
                                    labelPlacement="start"
                                />
                            </Box>
                        </Box>
                        {chartData.length === 0 ?
                            <Box className='coin-chart-box' alignItems='center' justifyContent='center' display='flex'>
                                <Skeleton variant="rounded" width={skWidth} height={skHeight} />
                            </Box>
                            :
                            <Box className='coin-chart-box'>
                                <CoinChart chartData={chartData} />
                            </Box>
                        }
                    </Grid>
                </Grid>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={12} md={12} lg={6}>
                        {Object.keys(wordOfTheDay).length !== 0 &&
                            <CustomLongCard
                                title='WORD OF THE DAY'
                                content={wordOfTheDay.word}
                                subtitle={wordOfTheDay.meaning}
                                link={wordOfTheDay.url}
                            />
                        }
                    </Grid>
                    <Grid item xs={12} sm={12} md={12} lg={6}>
                        <CustomLongCard title='IN-COMPLETE JOURNAL ENTRY' subtitle='20/10/2022' content='Complete your last entry' buttonName="GO TO JOURNAL" />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12} lg={6}>
                        <CustomLongCard title='JOURNAL ENTRY' subtitle='20/10/2022' content='Make an entry to your Journal' buttonName="GO TO JOURNAL" />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12} lg={6}>
                        <CustomLongCard title='Upload Trading-View data' subtitle='Upload your Trading View data for analysis' content='Make an entry to your Journal' buttonName="UPLOAD" />
                    </Grid>
                </Grid>
            </Box>
        </Box >
    )
}

export default Stats