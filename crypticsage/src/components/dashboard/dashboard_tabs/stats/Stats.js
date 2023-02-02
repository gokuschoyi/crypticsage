import React from 'react'
import { useOutletContext } from "react-router-dom";
import Header from '../../global/Header';
import { toast } from 'react-toastify';
import './Stats.css'
import { Box, Typography, Button, useTheme, Grid } from '@mui/material';
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
            <Box
                className='card-holder'
                sx={{ background: `${theme.palette.secondary.dark}` }}
            >
                <Box className='info-box'>
                    <Typography sx={{ fontSize: 20, fontWeight: '500', textAlign: 'left' }} color="black" gutterBottom>
                        {title} :
                    </Typography>
                    <Typography sx={{ fontSize: 50, fontWeight: '300', textAlign: 'left', marginBottom: '0px' }} color="black" gutterBottom>
                        {value}
                    </Typography>
                    <Typography sx={{ fontSize: 16, fontWeight: '300', textAlign: 'left' }} color="black" gutterBottom>
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
                className='card-holder'
                sx={{ backgroundColor: `${theme.palette.secondary.dark}` }}
                variant="outlined"
            >
                <Box className='info-box'>
                    <Typography sx={{ fontSize: 20, fontWeight: '500', textAlign: 'left' }} color="black" gutterBottom>
                        {title} :
                    </Typography>
                    <Typography sx={{ fontSize: 40, fontWeight: '300', textAlign: 'left', marginBottom: '0px' }} color="black" gutterBottom>
                        {content}
                    </Typography>
                    <Typography sx={{ fontSize: 16, fontWeight: '300', textAlign: 'left' }} color="black" gutterBottom>
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
        const { title, content, buttonName } = props
        return (
            <Box
                className='card-holder'
                sx={{ backgroundColor: `${theme.palette.secondary.dark}` }}
                variant="outlined"
            >
                <Box className='info-box'>
                    <Typography sx={{ fontSize: 20, fontWeight: '500', textAlign: 'left' }} color="black" gutterBottom>
                        {title} :
                    </Typography>
                    <Typography sx={{ fontSize: 25, fontWeight: '300', textAlign: 'left', marginBottom: '0px' }} color="black" gutterBottom>
                        {content}
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

    return (
        <Box className='stat-container' onClick={hide}>
            <Box height='100%' width='-webkit-fill-available'>
                <Header title={title} subtitle={subtitle} />
            </Box>

            <Box className='stat-cards-container'>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={6} lg={3}>
                        <CustomCard title='Recent Chapter' subtitle='Features' value='6/30' buttonName="GO TO LESSON 6" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={6} lg={3}>
                        <CustomCard title='Recent Quiz' subtitle='Technical Analysis Quiz 2' value='8/45' buttonName="GO TO QUIZ" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={6} lg={3}>
                        <CustonTextCard title='New Challenge Available' content='Weekly Challenge' buttonName="GO TO CHALLENGE" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={6} lg={3}>
                        <CustonTextCard title='New Challenge Available' content='Weekly Challenge' buttonName="GO TO CHALLENGE" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={6} lg={3}>
                        <CustonTextCard title='Upload Trading-View data' content='Upload your Trading View data for analysis' buttonName="UPLOAD" />
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