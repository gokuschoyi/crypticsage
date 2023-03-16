import React, { useEffect, useRef, useState } from 'react'
import { useOutletContext } from "react-router-dom";
import Header from '../../global/Header';
import { toast } from 'react-toastify';
import './Stats.css'
import { Box, Typography, Button, useTheme, Grid } from '@mui/material';

import { useSelector } from 'react-redux';
import axios from 'axios';

import { ArrowDropDownIcon, ArrowDropUpIcon } from '../../global/Icons';

import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/pagination";
import { Autoplay, Pagination } from "swiper";

const Stats = (props) => {
    const { title, subtitle } = props

    const [setTest] = useOutletContext();
    const hide = () => {
        setTest(true);
    }

    const theme = useTheme();

    const showToast = () => {
        toast.success('Hello World', {
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
        const { title, content, subtitle, buttonName } = props
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
                    <Button className='card-button' sx={{
                        ':hover': {
                            color: 'black !important',
                            backgroundColor: 'white !important',
                            transition: '0.5s'
                        },
                        backgroundColor: `${theme.palette.primary.main}`
                    }} size="small">{buttonName}</Button>
                </Box>
            </Box>
        )
    }

    const CustonTextCard = (props) => {
        const { title, price, image, price_change_24h, price_change_percentage_24h, market_cap_rank,high_24h, low_24h } = props
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
                            <img className='token-image' src={`${image}`} alt='crypto' />
                        </Box>
                    </Box>
                    <Typography sx={{ fontSize: 25, fontWeight: '300', textAlign: 'left', marginBottom: '0px' }} gutterBottom>
                        {price}
                    </Typography>
                    <Box className='token-diff-box'>
                        <Typography sx={{ fontSize: 16, fontWeight: '600', textAlign: 'left', color: 'green' }} gutterBottom>
                            {price_change_24h}
                        </Typography>
                        {price_change_24h > 0 ? <ArrowDropUpIcon sx={{ color: 'green' }} /> : <ArrowDropDownIcon />}
                        <Typography sx={{ fontSize: 16, fontWeight: '600', textAlign: 'left', color: 'green' }} gutterBottom>
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

    const [cryptoData, setCryptoData] = useState(null);
    const token = useSelector(state => state.auth.accessToken);

    /* useEffect(() => {
        const intervalId = setInterval(() => {
            const baseUrl = process.env.REACT_APP_BASEURL;
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };
            axios.post(`${baseUrl}/crypto/getCryptoData`, { withCredentials: true }, config)
                .then(response => {
                    setCryptoData(response.data.cryptoData);
                })
                .catch(error => {
                    console.error(error);
                });
        }, 60000);

        return () => {
            clearInterval(intervalId);
        };
    }, [token]); */

    //hover effect on tabs
    useEffect(() => {
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
    })

    function getWordsInSpans(sentence) {
        const words = sentence.split(' ');
        return words.map((word, index) => {
            return <span key={index}>{word} </span>;
        });
    }

    const [content, setContent] = useState([
        'This code wraps the entire HTML structure inside a parent div.',
        'The event listener listens for the Backspace key press and removes the selected words from the HTML structure. It also checks whether the selected words span across multiple spans and handles each case accordingly.',
        "In this implementation, when you select multiple words across multiple spans, it will only allow you to edit the selected words within a single span at a time. The input box will not appear when selecting the words.",
        "We're also using the useRef hook to get a ref to the div element inside the component. We'll use this ref later to get the editable text content when the user blurs the div.",
        "We're using the contentEditable attribute on the div element to make the entire text editable. We're also using the onBlur event to update the component's state when the user blurs the div."
    ]);
    const ref = useRef(null);

    const handleBlur = () => {
        const textContent = ref.current.textContent;
        setContent((content) => {
            const updatedContent = [...content];
            updatedContent[0] = textContent;
            return updatedContent;
        });
    };

    function handleChange(event) {
        const updatedContent = Array.from(event.target.childNodes[0].childNodes)
            .map((div) => div.innerText)
            .filter((text) => text.length > 0);
        setContent(updatedContent);
        console.log(updatedContent)
    }
    return (
        <Box className='stat-container' onClick={hide}>
            <Box height='100%' width='-webkit-fill-available'>
                <Header title={title} subtitle={subtitle} />
            </Box>
            <Box className='stat-cards-container'>
                <div className="item-bg"></div>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={6} lg={3} className='single-card-grid'>
                        <CustomCard title='Recent Chapter' subtitle='Features' value='6/30' buttonName="GO TO LESSON 6" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={6} lg={3}>
                        <CustomCard title='Recent Quiz' subtitle='Technical Analysis Quiz 2' value='8/45' buttonName="GO TO QUIZ" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={6} lg={3}>
                        <CustomCard title='New Challenge' subtitle='Technical Analysis Quiz 2' buttonName="GO TO CHALLENGE" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={6} lg={3}>
                        <Swiper
                            centeredSlides={true}
                            autoplay={{
                                delay: 2500,
                                disableOnInteraction: false,
                            }}
                            loop={true}
                            pagination={{
                                clickable: true,
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
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={12} md={12} lg={6}>
                        <CustomLongCard title='WORD OF THE DAY' subtitle='A currency pair is a price quote of the exchange rate for two different currencies traded in FX markets.' content='Currency Pair' buttonName="GO TO DEFINITION" />
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
            <Box className='leaderboard-conatiner'>
                {/* <DataGrid
                sx={{color:'white'}}
                    rows={rows}
                    columns={columns}
                    pageSize={5}
                    rowsPerPageOptions={[5]}
                    checkboxSelection
                    disableSelectionOnClick
                /> */}
            </Box>



            <Box
                className='span-selection-test'
                contentEditable={true}
                suppressContentEditableWarning={true}
            >
                <div>
                    {content.map((text, index) => (
                        <div
                            className='text-div'
                            key={index}
                            onBlur={handleBlur}
                            onInput={handleChange}
                        >
                            {getWordsInSpans(text)}
                        </div>
                    ))}
                </div>

            </Box>




            <Box display='flex' flexDirection='column'>
                <Box sx={{ backgroundColor: `${theme.palette.primary.main}` }}>
                    <h2>Primary</h2>
                </Box>
                <Box sx={{ backgroundColor: `${theme.palette.secondary.main}` }}>
                    <h2>Secondary</h2>
                </Box>
                <Box sx={{ backgroundColor: `${theme.palette.text.primary}` }}>
                    <h2>Text</h2>
                </Box>
                <Box sx={{ backgroundColor: `${theme.palette.background.default}` }}>
                    <h2>background</h2>
                </Box>
                <Box sx={{ backgroundColor: `${theme.palette.error.main}` }}>
                    <h2>error</h2>
                </Box>
                <Box sx={{ backgroundColor: `${theme.palette.warning.main}` }}>
                    <h2>warning</h2>
                </Box>
                <Box sx={{ backgroundColor: `${theme.palette.info.main}` }}>
                    <h2>info</h2>
                </Box>
                <Box sx={{ backgroundColor: `${theme.palette.success.main}` }}>
                    <h2>success</h2>
                </Box>
                <Box sx={{ backgroundColor: `${theme.palette.divider.main}` }}>
                    <h2>divider</h2>
                </Box>
            </Box>
        </Box >
    )
}

export default Stats