import React from 'react'
import {
    Box
    , Button
    , FormControlLabel
    , Switch
    , TextField
    , CircularProgress
    , useTheme
    , Autocomplete
    , Dialog
    , Typography
    , Tab
    , Tabs
    , Card
    , CardContent
    , CardActions
} from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import {
    toggleToolTipSwitch
    , toggleShowPredictionSwitch
    , setQuickForecasts
} from '../../modules/CryptoModuleSlice'
import { MultiSelect, CustomSlider, CountdownTimer } from '../crypto_components/Training_Components'
import SingleTicker from './SingleTicker'
import { quick_forecast } from '../../../../../../api/adminController'

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

const INPUT_OPTIONS = [
    "",
    "high",
    "low",
    "open",
    "close",
]

const a11yProps = (index) => {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const quick_forecasting_model_options = [
    {
        'model': 'chronos',
        'types': ['tiny', 'small'],
        'parameters': {
            "to_predict_flag": "close",
            "look_ahead": 12,
            "samples": 10,
            "top_k": 50,
            "temperature": 1.0,
            "top_p": 1.0,
            "scaled_temperature": 1.0,
            "scaled_top_p": 1.0
        }
    },
    {
        'model': 'prophet',
        'types': []
    }
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
    const token = useSelector(state => state.auth.accessToken);
    const showPredictionSwitchFlag = useSelector(state => state.cryptoModule.showPredictions)
    const selectedTokenPeriod = useSelector(state => state.cryptoModule.selectedTickerPeriod)
    const selectedTickerName = useSelector(state => state.cryptoModule.selectedTickerName)
    const ticker_expires_at = useSelector(state => state.cryptoModule.ticker_expiration)

    const predictiosn_available_for = useSelector(state => state.cryptoModule.quick_forecasts)[selectedTickerName]?.map((forecast) => { return forecast.model_type })
    // console.log(predictiosn_available_for)
    // const state = useSelector(state => state)
    // console.log(state)
    const [quickForecastDialogOpen, setQuickForecastDialogOpen] = React.useState(false)
    const [modelTabValue, setModelTabValue] = React.useState(0);
    const [modelTypeTabValue, setModelTypeTabValue] = React.useState(0)

    const handleQuickForecastDialog = () => {
        if (predictiosn_available_for) {
            const model_types = quick_forecasting_model_options[modelTabValue].types
            const is_predicted = model_types.map((type) => predictiosn_available_for.includes(type))
            const first_false_index = is_predicted.indexOf(false)
            setModelTypeTabValue(first_false_index >= 0 ? first_false_index : 0)
            console.log('model_types:', model_types, is_predicted, first_false_index)
        }
        setQuickForecastDialogOpen(true)
    }

    // handles the change of the tab
    const handleModelTabChange = (event, newValue) => {
        console.log('newValue', newValue)
        setModelTabValue(newValue);
        setToForecastOptions(quick_forecasting_model_options[newValue])
    };

    const handleModelTypeTabChange = (event, newValue) => {
        console.log('newValue', newValue)
        setModelTypeTabValue(newValue);
    };

    const [to_forecast_options, setToForecastOptions] = React.useState(quick_forecasting_model_options[modelTabValue])

    const handleModelParamChange = (name, value) => {
        // console.log('name:', name, 'value:', value)
        setToForecastOptions((prev) => {
            if (name === 'temperature' || name === 'top_p') {
                return {
                    ...prev,
                    parameters: {
                        ...prev.parameters,
                        [name === 'temperature' ? 'scaled_temperature' : 'scaled_top_p']: parseFloat(value / 100)
                    }
                }
            } else {
                return {
                    ...prev,
                    parameters: {
                        ...prev.parameters,
                        [name]: value
                    }
                }
            }
        })
    }

    const [quickForecastLoading, setQuickForecastLoading] = React.useState(false)
    const handleQuickForecast = () => {
        console.log('Quick Forecast Clicked')
        const payload = {
            module: 'crypto',
            symbol: selectedTickerName,
            period: selectedTokenPeriod,
            model_data: {
                forecasting_model: to_forecast_options.model,
                forecasting_model_type: to_forecast_options.types[modelTypeTabValue],
                parameters: to_forecast_options.parameters
            }
        }
        console.log('Quick Forecast Payload:', payload)
        setQuickForecastLoading(true)
        quick_forecast({ token, payload })
            .then((res) => {
                // console.log('Quick Forecast Response:', res)
                dispatch(setQuickForecasts({
                    symbol: selectedTickerName,
                    period: selectedTokenPeriod,
                    forecast: res.data.forecast,
                    forecasting_model: 'chronos',
                    model_type: to_forecast_options.types[modelTypeTabValue],
                    visible: true
                }))
                setQuickForecastLoading(false)
                setQuickForecastDialogOpen(false)
            })
            .catch((err) => {
                console.log('Quick Forecast Error:', err)
                setQuickForecastLoading(false)
            })
    }

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
                        {ticker_expires_at > 0 && <CountdownTimer endTime={ticker_expires_at} />}
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

                    <Button
                        size='small'
                        variant='outlined'
                        onClick={(e) => handleQuickForecastDialog()}
                        endIcon={
                            quickForecastLoading ?
                                <CircularProgress size={20} color='secondary' />
                                :
                                null
                        }>
                        Quick Forecast
                    </Button>

                    <Dialog
                        open={quickForecastDialogOpen}
                        onClose={() => setQuickForecastDialogOpen(false)}
                    >
                        <Card sx={{ width: 340, padding: '4px 8px' }}>
                            <CardContent sx={{ padding: '0px' }}>
                                <Box display='flex' flexDirection='row' justifyContent='space-between'>
                                    <Typography textAlign='start' gutterBottom variant="h6">
                                        QUICK FORECASTING
                                    </Typography>
                                    {quickForecastLoading ? <CircularProgress color="error" sx={{ margin: '2.5px' }} size={15} /> : ''}
                                </Box>

                                <Box className='qf-model-forecast-selection'>
                                    <Box boxShadow={4} pt={1} pl={1} display={'flex'} flexDirection={'row'} gap={1} alignItems={'center'}>
                                        <Typography sx={{ width: '60px' }} textAlign='start' gutterBottom variant="h5">Model</Typography>
                                        <Box className='model-select-tabs'>
                                            <Tabs sx={{
                                                minHeight: '36px',
                                                '& .MuiTabs-indicator': {
                                                    margin: '4px 0px',
                                                }
                                            }} className='quick-f-tabs' value={modelTabValue} onChange={handleModelTabChange} aria-label="basic tabs example" textColor="secondary" indicatorColor="primary">
                                                {Object.keys(quick_forecasting_model_options).map((model, index) => {
                                                    return (
                                                        <Tab
                                                            key={index}
                                                            className='tab-qf'
                                                            label={quick_forecasting_model_options[model]['model']}
                                                            {...a11yProps(index)}
                                                        />
                                                    )
                                                })}
                                            </Tabs>
                                        </Box>
                                    </Box>

                                    <Box boxShadow={4} pt={1} pl={1} >
                                        {to_forecast_options.types.length > 0 &&
                                            <Box display={'flex'} flexDirection={'row'} gap={1} alignItems={'center'}>
                                                <Typography sx={{ width: '60px' }} textAlign='start' gutterBottom variant="h5">Type </Typography>
                                                <Box className='type-select-tabs'>
                                                    <Tabs sx={{
                                                        minHeight: '36px',
                                                        '& .MuiTabs-indicator': {
                                                            margin: '4px 0px',
                                                        }
                                                    }} className='quick-f-tabs' value={modelTypeTabValue} onChange={handleModelTypeTabChange} aria-label="basic tabs example" textColor="secondary" indicatorColor="primary">
                                                        {to_forecast_options.types.map((type, index) => {
                                                            return (
                                                                <Tab
                                                                    key={index}
                                                                    className='tab-qf'
                                                                    label={type}
                                                                    disabled={predictiosn_available_for && predictiosn_available_for.includes(type) ? true : false}
                                                                    {...a11yProps(index)}
                                                                />
                                                            )
                                                        })}
                                                    </Tabs>
                                                </Box>
                                            </Box>
                                        }
                                    </Box>

                                    <Box className='model-options-box' pt={1}>
                                        {to_forecast_options.model === 'chronos' &&
                                            <Box display={'flex'} flexDirection={'column'} gap={1}>
                                                <MultiSelect
                                                    inputLabel={'Prediction flag'}
                                                    inputOptions={INPUT_OPTIONS}
                                                    selectedInputOptions={to_forecast_options.parameters.to_predict_flag}
                                                    handleInputOptions={(newValue) => {
                                                        handleModelParamChange('to_predict_flag', newValue)
                                                    }}
                                                    fieldName={'To predict'}
                                                    toolTipTitle={'Select one of the flags to be used to predict'}
                                                    trainingStartedFlag={quickForecastLoading}
                                                />

                                                <CustomSlider
                                                    sliderValue={to_forecast_options.parameters.look_ahead}
                                                    name={'look_ahead'}
                                                    handleModelParamChange={handleModelParamChange}
                                                    label={'Look Ahead'}
                                                    min={2}
                                                    max={50}
                                                    sliderMin={2}
                                                    sliderMax={50}
                                                    disabled={quickForecastLoading}
                                                />

                                                <CustomSlider
                                                    sliderValue={to_forecast_options.parameters.samples}
                                                    name={'samples'}
                                                    handleModelParamChange={handleModelParamChange}
                                                    label={'Samples'}
                                                    min={10}
                                                    max={50}
                                                    sliderMin={10}
                                                    sliderMax={50}
                                                    disabled={quickForecastLoading}
                                                />

                                                <CustomSlider
                                                    sliderValue={to_forecast_options.parameters.top_k}
                                                    name={'top_k'}
                                                    handleModelParamChange={handleModelParamChange}
                                                    label={'Top-K'}
                                                    min={1}
                                                    max={100}
                                                    sliderMin={1}
                                                    sliderMax={100}
                                                    disabled={quickForecastLoading}
                                                />

                                                <CustomSlider
                                                    sliderValue={to_forecast_options.parameters.temperature}
                                                    name={'temperature'}
                                                    handleModelParamChange={handleModelParamChange}
                                                    label={`Temperature`}
                                                    min={10}
                                                    max={100}
                                                    sliderMin={10}
                                                    sliderMax={100}
                                                    scaledLearningRate={to_forecast_options.parameters.scaled_temperature}
                                                    disabled={quickForecastLoading}
                                                />

                                                <CustomSlider
                                                    sliderValue={to_forecast_options.parameters.top_p}
                                                    name={'top_p'}
                                                    handleModelParamChange={handleModelParamChange}
                                                    label={`Top-P`}
                                                    min={10}
                                                    max={100}
                                                    sliderMin={10}
                                                    sliderMax={100}
                                                    scaledLearningRate={to_forecast_options.parameters.scaled_top_p}
                                                    disabled={quickForecastLoading}
                                                />
                                            </Box>
                                        }
                                    </Box>
                                </Box>
                            </CardContent>

                            <CardActions sx={{ padding: '16px 0px 8px 0px' }}>
                                <Button color='secondary' variant='outlined' size="small" onClick={handleQuickForecast}>
                                    Forecast
                                </Button>
                            </CardActions>
                        </Card>
                    </Dialog>

                </Box>
            </Box>
        </Box>
    )
}

export default MainChartOptions