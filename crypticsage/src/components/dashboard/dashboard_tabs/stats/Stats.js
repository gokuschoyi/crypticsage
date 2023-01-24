import React from 'react'
import Header from '../../global/Header';
import './Stats.css'
import { Box, CardContent, Typography, CardActions, Button, Card, useTheme, Grid } from '@mui/material';
const Stats = (props) => {
    const { title, subtitle } = props

    const theme = useTheme();

    const CustomCard = (props) => {
        const { title, subtitle, value, buttonName } = props
        return (
            <React.Fragment>
                <Card
                    className='card-holder'
                    sx={{ backgroundColor: `${theme.palette.secondary.main}` }}
                    variant="outlined"
                >
                    <CardContent>
                        <Typography sx={{ fontSize: 20, fontWeight: '300', textAlign: 'left' }} color="black" gutterBottom>
                            {title} :
                        </Typography>
                        <Typography sx={{ fontSize: 50, fontWeight: '300', textAlign: 'left', marginBottom: '0px' }} color="black" gutterBottom>
                            {value}
                        </Typography>
                        <Typography sx={{ fontSize: 16, fontWeight: '300', textAlign: 'left' }} color="black" gutterBottom>
                            {subtitle}
                        </Typography>
                    </CardContent>
                    <CardActions>
                        <Button className='card-button' sx={{
                            ':hover': {
                                color: 'black !important',
                                backgroundColor: 'white !important',
                                transition: '0.5s'
                            },
                            backgroundColor: `${theme.palette.primary.main}`
                        }} size="small">{buttonName}</Button>
                    </CardActions>
                </Card>
            </React.Fragment>
        )
    };

    const CustomLongCard = (props) => {
        const { title, content, subtitle, buttonName } = props
        return (
            <React.Fragment>
                <Card
                    className='card-holder'
                    sx={{ backgroundColor: `${theme.palette.secondary.main}` }}
                    variant="outlined"
                >
                    <CardContent>
                        <Typography sx={{ fontSize: 20, fontWeight: '300', textAlign: 'left' }} color="black" gutterBottom>
                            {title} :
                        </Typography>
                        <Typography sx={{ fontSize: 50, fontWeight: '300', textAlign: 'left', marginBottom: '0px' }} color="black" gutterBottom>
                            {content}
                        </Typography>
                        <Typography sx={{ fontSize: 16, fontWeight: '300', textAlign: 'left' }} color="black" gutterBottom>
                            {subtitle}
                        </Typography>
                    </CardContent>
                    <CardActions>
                        <Button className='card-button' sx={{
                            ':hover': {
                                color: 'black !important',
                                backgroundColor: 'white !important',
                                transition: '0.5s'
                            },
                            backgroundColor: `${theme.palette.primary.main}`
                        }} size="small">{buttonName}</Button>
                    </CardActions>
                </Card>
            </React.Fragment>
        )
    }

    const CustonTextCard = (props) => {
        const { title, content, buttonName } = props
        return (
            <React.Fragment>
                <Card
                    className='card-holder'
                    sx={{ backgroundColor: `${theme.palette.secondary.main}` }}
                    variant="outlined"
                >
                    <CardContent>
                        <Typography sx={{ fontSize: 20, fontWeight: '300', textAlign: 'left' }} color="black" gutterBottom>
                            {title} :
                        </Typography>


                        <Typography sx={{ fontSize: 35, fontWeight: '300', textAlign: 'left', marginBottom: '0px' }} color="black" gutterBottom>
                            {content}
                        </Typography>
                    </CardContent>
                    <CardActions>
                        <Button className='card-button' sx={{
                            ':hover': {
                                color: 'black !important',
                                backgroundColor: 'white !important',
                                transition: '0.5s'
                            },
                            backgroundColor: `${theme.palette.primary.main}`
                        }} size="small">{buttonName}</Button>
                    </CardActions>
                </Card>
            </React.Fragment>
        )
    }

    return (
        <Box className='stat-container'>
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
                    <Grid item xs={12} sm={12} md={12} lg={6}>
                        <CustomLongCard title='Word of the Day' subtitle='A currency pair is a price quote of the exchange rate for two different currencies traded in FX markets.' content='Currency Pair' buttonName="GO TO DEFINITION" />
                    </Grid>
                </Grid>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={6} lg={3}>
                        <CustonTextCard title='Weekly Challenge' content='New Challenge Available' buttonName="GO TO CHALLENGE" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={6} lg={3}>
                        <CustonTextCard title='Weekly Challenge' content='New Challenge Available' buttonName="GO TO CHALLENGE" />
                    </Grid>
                    <Grid item xs={12} sm={12} md={12} lg={6}>
                        <CustomLongCard title='IN-COMPLETE JOURNAL ENTRY' subtitle='20/10/2022' content='Complete your last entry' buttonName="GO TO JOURNAL" />
                    </Grid>
                </Grid>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={6} lg={3}>
                        <CustonTextCard title='Upload Trading-View data' content='Upload your Trading View data for analysis' buttonName="UPLOAD" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={6} lg={3}>

                    </Grid>
                    <Grid item xs={12} sm={12} md={12} lg={6}>
                        <CustomLongCard title='Journal entry' subtitle='20/10/2022' content='Make an entry to your Journal' buttonName="GO TO JOURNAL" />
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
            <Box display='flex'>
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
        </Box>
    )
}

export default Stats