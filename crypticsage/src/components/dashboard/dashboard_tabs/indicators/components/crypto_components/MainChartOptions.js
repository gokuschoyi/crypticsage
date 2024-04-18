import React from 'react'
import { Box, FormControlLabel, Switch, TextField, useTheme, Autocomplete, Typography } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import { toggleToolTipSwitch, toggleShowPredictionSwitch } from '../../modules/CryptoModuleSlice'
import SingleTicker from './SingleTicker'

const TICKER_PERIODS = [
    '1m',
    '1h',
    '4h',
    '6h',
    '8h',
    '12h',
    "1d",
    '3d',
    '1w',
]

const MainChartOptions = ({
    handlePeriodChange,
    toolTipSwitchFlag,
    predictedVlauesRedux,
    lookAhead,
    predictionLookAhead,
    setPredictionLookAhead,
    actualFetchLength,
    ohlcDataLength,
}) => {
    const theme = useTheme()
    const dispatch = useDispatch()
    const showPredictionSwitchFlag = useSelector(state => state.cryptoModule.showPredictions)
    const selectedTokenPeriod = useSelector(state => state.cryptoModule.selectedTickerPeriod)
    const selectedTickerName = useSelector(state => state.cryptoModule.selectedTickerName)
    return (
        <Box className='ticker-period-selector-top' pl={2} pr={2} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' gap='10px'>
            <Box display={'flex'} flexDirection={'row'} alignItems={'center'} gap={1}>
                <Box width={'125px'}>
                    <Typography variant='h4' sx={{ textAlign: 'justify' }}>{selectedTickerName}</Typography>
                    <SingleTicker />
                </Box>
                <Box className='autocomplete-select-box' width='150px'>
                    <Autocomplete
                        size='small'
                        disableClearable
                        disablePortal={false}
                        id="selec-stock-select"
                        options={TICKER_PERIODS}
                        value={selectedTokenPeriod} // Set the selected value
                        onChange={(event, newValue) => handlePeriodChange(newValue)} // Handle value change
                        sx={{ width: 'auto' }}
                        renderInput={(params) => <TextField size='small' {...params}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: `${theme.palette.primary.main} !important`,
                                    }
                                },
                                '& .MuiInputBase-input': {
                                    height: '10px'
                                },
                            }}
                            label="Select a period"
                            color="secondary"
                        />}
                    />
                </Box>
            </Box>
            <Box className='tooltip-prediction-box'>
                <Box className='tooltip-prediction-box-controls'>
                    <Box display={'flex'} flexDirection={'column'}>
                        <FormControlLabel
                            value="start"
                            sx={{ marginLeft: '0px', marginRight: '0px' }}
                            control={<Switch size="small" color="secondary" />}
                            label={toolTipSwitchFlag ? 'Hide Tooltips' : 'Show Tooltips'}
                            labelPlacement="start"
                            checked={toolTipSwitchFlag}
                            onChange={() => dispatch(toggleToolTipSwitch())}
                        />
                        <Typography sx={{ textAlign: 'justify', fontSize: '0.65rem', fontWeight: '600' }}>AF:{actualFetchLength}, R:{ohlcDataLength} / {Math.round(ohlcDataLength / 500)}</Typography>
                    </Box>
                    {predictedVlauesRedux &&
                        <Box className='prediction-days'>
                            <FormControlLabel
                                value="start"
                                sx={{ marginLeft: '0px' }}
                                control={<Switch size="small" color="secondary" />}
                                label={showPredictionSwitchFlag ? 'Hide Predictions' : 'Show Predictions'}
                                labelPlacement="start"
                                checked={showPredictionSwitchFlag}
                                onChange={() => dispatch(toggleShowPredictionSwitch())}
                            />
                            {showPredictionSwitchFlag &&
                                <Autocomplete
                                    size='small'
                                    disableClearable
                                    disablePortal={false}
                                    id="selec-look-ahead-period"
                                    options={Array.from({ length: lookAhead }, (_, i) => `+${i + 1}`)}
                                    value={`+${predictionLookAhead}`} // Set the selected value
                                    onChange={(event, newValue) => setPredictionLookAhead(parseInt(newValue.split('+')[1]))} // Handle value change
                                    sx={{ width: 'auto' }}
                                    renderInput={(params) => <TextField size='small' {...params}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                '& fieldset': {
                                                    borderColor: `${theme.palette.primary.newWhite} !important`,
                                                }
                                            },
                                            '& .MuiInputBase-input': {
                                                height: '10px'
                                            },
                                        }}
                                        label="LookAhead"
                                        color="secondary"
                                    />}
                                />
                            }
                        </Box>
                    }
                </Box>
            </Box>
        </Box>
    )
}

export default MainChartOptions