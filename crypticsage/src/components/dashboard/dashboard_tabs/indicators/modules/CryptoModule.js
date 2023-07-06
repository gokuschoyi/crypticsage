import React, { useState } from 'react'
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useParams } from 'react-router-dom';
import { ExpandMoreIcon } from '../../../global/Icons';
import {
    Box
    , Typography
    , Autocomplete
    , TextField
    , Grid
    , Accordion
    , AccordionSummary
    , AccordionDetails
} from '@mui/material'
const CryptoModule = () => {
    const params = useParams();
    const { cryptotoken } = params;

    // handle accordian collapse when data loads
    const [accordianOpenState, setAccordianOpenState] = React.useState(true);

    const top100Films = [
        'The Shawshank Redemption',
        'The Godfather',
        'The Godfather: Part II',
        'The Dark Knight',
        '12 Angry Men',
        "Schindler's List",
        'Pulp Fiction',
        'The Lord of the Rings: The Return of the King',
    ]

    // handles the change of the date picker
    // default options for the date picker start and end date
    const defaultOptions = {
        tickerStartDate: new Date().toLocaleString().split(',')[0],
        tickerEndDate: new Date().toLocaleString().split(',')[0],
    }

    // state for the date picker
    const [options, setOptions] = useState(defaultOptions);
    const {
        tickerStartDate,
        tickerEndDate,
    } = options;

    // handles and saves date to state
    const handleEntryDateChange = (newValue, param) => {
        if (newValue !== null) {
            const formattedDate = newValue.format('MM/DD/YYYY');
            if (param === 'entryDate') {
                setOptions({ ...options, tickerStartDate: formattedDate });
            } else {
                setOptions({ ...options, tickerEndDate: formattedDate });
            }
        }
        else {
            if (param === 'entryDate') {
                setOptions({ ...options, tickerStartDate: '' });
            } else {
                setOptions({ ...options, tickerEndDate: '' });
            }
        }
    }

    const [selectedToken, setSelectedToken] = useState(null);
    const [selectedTokenPeriod, setSelectedTokenPeriod] = useState(null);

    return (
        <Box className='crypto-module-container'>
            <Box>Crypto-Module for {cryptotoken}</Box>
            <Box className='accordian-box' pt={2} pr={4} pl={4}>
                <Accordion defaultExpanded={accordianOpenState} >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                    >
                        <Typography variant='h3' textAlign='start' pt={1} pb={1}>CRYPTO</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={2} className='indicator-data-container'>
                            <Grid item xs={12} sm={8} md={5} lg={4} xl={4}>
                                <Box className='indicator-data-main-box' >
                                    <Box className='autocomplete-select-box'>
                                        <Autocomplete
                                            size='small'
                                            disablePortal={false}
                                            id="selec-token-select"
                                            options={top100Films}
                                            value={selectedToken} // Set the selected value
                                            onChange={(event, newValue) => setSelectedToken(newValue)} // Handle value change
                                            sx={{ width: 'auto' }}
                                            renderInput={(params) => <TextField {...params}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        '& fieldset': {
                                                            borderColor: 'white',
                                                        }
                                                    }
                                                }} label="Select a token"
                                                color="secondary"
                                            />}
                                        />
                                        <Autocomplete
                                            size='small'
                                            disablePortal={false}
                                            id="selec-stock-select"
                                            options={top100Films}
                                            value={selectedTokenPeriod} // Set the selected value
                                            onChange={(event, newValue) => setSelectedTokenPeriod(newValue)} // Handle value change
                                            sx={{ width: 'auto' }}
                                            renderInput={(params) => <TextField {...params}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        '& fieldset': {
                                                            borderColor: 'white',
                                                        }
                                                    }
                                                }}
                                                label="Select a period"
                                                color="secondary"
                                            />}
                                        />
                                    </Box>
                                </Box>

                                <Box className='range-picker-box' pt={2}>
                                    <DatePicker
                                        className='date-picker'
                                        name="entryDate"
                                        openTo="year"
                                        views={['year', 'month', 'day']}
                                        value={tickerStartDate}
                                        onChange={(value) => handleEntryDateChange(value, "entryDate")}
                                        sx={{ width: 'auto' }}
                                        renderInput={(params) => <TextField {...params}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    '& fieldset': {
                                                        borderColor: 'white',
                                                    }
                                                }
                                            }}
                                            label="Start Date"
                                            color="secondary"
                                        />}
                                    />
                                    <DatePicker
                                        className='date-picker'
                                        name="exitDate"
                                        openTo="year"
                                        views={['year', 'month', 'day']}
                                        value={tickerEndDate}
                                        onChange={(value) => handleEntryDateChange(value, "exitDate")}
                                        renderInput={(params) => <TextField {...params}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    '& fieldset': {
                                                        borderColor: 'white',
                                                    }
                                                }
                                            }}
                                            label="End Date"
                                            color="secondary"
                                        />}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            </Box>
        </Box>
    )
}

export default CryptoModule