import React from 'react'
import { useOutletContext } from "react-router-dom";
import Header from '../../global/Header';
import { Box, Typography, Button, useTheme, Grid, Switch, FormControlLabel, TextField } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import './Journal.css'

import JournalGrid from './JournalGrid';

const Journal = (props) => {
    const theme = useTheme();
    const { title, subtitle } = props
    const [toggle, setToggle] = React.useState(true)

    const [setTest] = useOutletContext();
    const hide = () => {
        setTest(true);
    }

    const handleToggle = () => {
        setToggle(!toggle)
    }

    const toggleJournal = () => {
        handleToggle()
        console.log(toggle)
    }

    const defaultJournalValues = {
        tradeName: '',
        ticker: '',
        position: '',
        size: '',
        entryDate: Date(),
        exitDate: Date(),
        rewardRisk: '',
        points: '',
        entryRate: '',
        exitRate: '',
        conviction: '',
        strategy: '',
        success: '',
        influence: '',
        issue: '',
        sell: '',
        postTrade: '',
        journalEntryDate: '',
    }

    const [journalValues, setJournalValues] = React.useState(defaultJournalValues)
    const {
        tradeName,
        ticker,
        position,
        size,
        entryDate,
        exitDate,
        rewardRisk,
        points,
        entryRate,
        exitRate,
        conviction,
        strategy,
        success,
        influence,
        issue,
        sell,
        postTrade,
    } = journalValues

    const handleChange = (event) => {
        const { name, value } = event.target;
        setJournalValues({ ...journalValues, [name]: value });
    }

    const handleEntryDateChange = (newValue) => {
        if (newValue !== null) {
            setJournalValues({ ...journalValues, entryDate: newValue.format('MM/DD/YYYY HH:mm:ss A') });
        }
        else {
            setJournalValues({ ...journalValues, entryDate: '' });
        }
    }

    const handleExitDateChange = (newValue) => {
        if (newValue !== null) {
            setJournalValues({ ...journalValues, exitDate: newValue.format('MM/DD/YYYY HH:mm:ss A') });
        }
        else {
            setJournalValues({ ...journalValues, exitDate: '' });
        }
    }

    const resetJournal = () => {
        setJournalValues(defaultJournalValues)
    }

    const display = () => {
        const dayjs = require('dayjs')
        var now = dayjs()
        setJournalValues({ ...journalValues, journalEntryDate: now.format('MM/DD/YYYY HH:mm:ss A') })
        console.log(journalValues)
    }

    return (
        <Box className='journal-container' onClick={hide}>
            <Box width='100%' display='flex' flexDirection='row' justifyContent='space-between'>
                <Header title={title} subtitle={subtitle} />
                <Box className='journal-switch'>
                    <FormControlLabel
                        sx={{
                            backgroundColor: `${theme.palette.secondary.dark}`,
                            color: `${theme.palette.secondary.contrastText}`,
                            width: '120px',
                            height: '40px',
                            borderRadius: '10px',
                        }}
                        control={
                            <Switch
                                style={{ color: `${toggle ? theme.palette.secondary.main : theme.palette.text.primary}` }}
                                inputProps={{ 'aria-label': 'primary checkbox' }}
                                onChange={toggleJournal}
                            />
                        }
                        label={`${!toggle ? 'History' : 'Journal'}`}
                    />
                </Box>
            </Box>
            <Box className='journal-content-container'>
                {toggle ?
                    (<Box className='journal-content'>
                        <Grid container spacing={2}>
                            <Grid className='technical-marker' item xs={12} sm={12} md={12} lg={12}>
                                <Typography className='title' variant='h4' textAlign='start' pl={3}>TECHNICAL MARKER</Typography>
                                <Box className='technical-marker-layout'>
                                    <Box className='layout'>
                                        <TextField className='padding inputfield' name="tradeName" value={tradeName} onChange={handleChange} id="trade-name" label="TradeName" variant="standard" />
                                    </Box>
                                    <Box className='layout'>
                                        <TextField className='padding inputfield' name="ticker" value={ticker} onChange={handleChange} id="ticker" label="Ticker" variant="standard" />
                                    </Box>
                                    <Box className='layout'>
                                        <TextField className='padding inputfield' name="position" value={position} onChange={handleChange} id="position" label="Position" variant="standard" />
                                        <TextField className='padding inputfield' name="size" value={size} onChange={handleChange} id="size" label="Size" variant="standard" />
                                    </Box>
                                    <Box className='layout'>
                                        <DateTimePicker
                                            className='padding inputfield'
                                            label="Entry Date"
                                            name="entryDate"
                                            value={entryDate}
                                            onChange={handleEntryDateChange}
                                            renderInput={(params) => <TextField {...params} />}
                                        />
                                        <DateTimePicker
                                            className='padding inputfield'
                                            label="Exit Date"
                                            name="exitDate"
                                            value={exitDate}
                                            onChange={handleExitDateChange}
                                            renderInput={(params) => <TextField {...params} />}
                                        />
                                    </Box>
                                    <Box className='layout'>
                                        <TextField className='padding inputfield' name="rewardRisk" value={rewardRisk} onChange={handleChange} id="rewardrisk" label="Reward / Risk" variant="standard" />
                                        <TextField className='padding inputfield' name="points" value={points} onChange={handleChange} id="points" label="Points" variant="standard" />
                                    </Box>
                                    <Box className='layout'>
                                        <TextField className='padding inputfield' name="entryRate" value={entryRate} onChange={handleChange} id="entryrate" label="Entry Rate" variant="standard" />
                                        <TextField className='padding inputfield' name="exitRate" value={exitRate} onChange={handleChange} id="exitrate" label="Exit Rate" variant="standard" />
                                    </Box>
                                    <Box className='layout'>
                                        <TextField className='padding inputfield' name="conviction" value={conviction} onChange={handleChange} id="conviction" label="Conviction" variant="standard" />
                                        <TextField className='padding inputfield' name="strategy" value={strategy} onChange={handleChange} id="strategy" label="Strategy Used" variant="standard" />
                                    </Box>
                                    <Box className='layout'>
                                        <TextField className='padding inputfield' name="success" value={success} onChange={handleChange} id="success" label="Status" variant="standard" />
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid className='performance-marker' item xs={12} sm={12} md={12} lg={12}>
                                <Typography className='title' variant='h4' textAlign='start' pl={3} pb={4} pt={2}>PERFORMANCE MARKER</Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6} md={6} lg={4} xl={3}>
                                        <TextField
                                            id="influence"
                                            label="Influence"
                                            multiline
                                            rows={4}
                                            className='inputtextfield'
                                            name="influence"
                                            value={influence}
                                            onChange={handleChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={6} lg={4} xl={3}>
                                        <TextField
                                            id="issues"
                                            label="Where there issues?"
                                            multiline
                                            rows={4}
                                            className='inputtextfield'
                                            name="issue"
                                            value={issue}
                                            onChange={handleChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={6} lg={4} xl={3}>
                                        <TextField
                                            id="sell"
                                            label="What made you sell?"
                                            multiline
                                            rows={4}
                                            className='inputtextfield'
                                            name="sell"
                                            value={sell}
                                            onChange={handleChange}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={6} lg={4} xl={3}>
                                        <TextField
                                            id="posttrade"
                                            label="What happened after trade?"
                                            multiline
                                            rows={4}
                                            className='inputtextfield'
                                            name="postTrade"
                                            value={postTrade}
                                            onChange={handleChange}
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Box className='journal-submit-button'>
                            <Button
                                onClick={resetJournal}
                                variant="text"
                                style={{
                                    color: `#000000`,
                                    backgroundColor: 'red',
                                    margin: '5px'
                                }}
                                sx={{
                                    ':hover': {
                                        color: `black !important`,
                                        backgroundColor: 'white !important',
                                    },
                                }}>RESET</Button>
                            <Button
                                onClick={display}
                                variant="text"
                                style={{
                                    color: `#000000`,
                                    backgroundColor: 'red',
                                    margin: '5px'
                                }}
                                sx={{
                                    ':hover': {
                                        color: `black !important`,
                                        backgroundColor: 'white !important',
                                    },
                                }}>SAVE</Button>
                        </Box>
                    </Box>)
                    :
                    (<Box className='history-content'>
                        <Typography className='title' variant='h4' textAlign='start' pl={3} pb={4}>JOURNAL HISTORY</Typography>
                        <Box className='journal-history-grid-container'>
                            <JournalGrid />
                        </Box>
                    </Box>)
                }
            </Box>
        </Box >
    )
}

export default Journal