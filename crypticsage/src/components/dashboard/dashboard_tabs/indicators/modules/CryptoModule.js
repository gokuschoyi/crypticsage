import React, { useState } from 'react'
import { useParams } from 'react-router-dom';
import Header from '../../../global/Header';
import IndicatorDescription from '../components/IndicatorDescription';
import {
    Box
    , Typography
    , Autocomplete
    , TextField
} from '@mui/material'
const CryptoModule = () => {
    const params = useParams();
    const { cryptotoken } = params;

    const periods = [
        '1m',
        '4h',
        '6h',
        '8h',
        '12h',
        "1d",
        '3d',
        '1w',
    ]

    const [selectedTokenPeriod, setSelectedTokenPeriod] = useState(null);
    console.log(selectedTokenPeriod)

    return (
        <Box className='crypto-module-container'>
            <Box height='100%' width='-webkit-fill-available'>
                <Header title='Details' />
            </Box>

            <Box pl={4} display='flex' flexDirection='row' alignItems='center' gap='10px'>
                <Typography variant='h3' textAlign='start' pt={1} pb={1}>{cryptotoken}</Typography>
                <Box className='autocomplete-select-box' width='200px'>
                    <Autocomplete
                        size='small'
                        disablePortal={false}
                        id="selec-stock-select"
                        options={periods}
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

            <IndicatorDescription symbol={cryptotoken}/>
        </Box>
    )
}

export default CryptoModule