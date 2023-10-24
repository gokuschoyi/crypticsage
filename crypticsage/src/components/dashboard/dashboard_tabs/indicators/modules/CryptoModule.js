import React, { useState, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import Header from '../../../global/Header';
import { Indicators } from '../components/IndicatorDescription';
import { getHistoricalTickerDataFroDb, fetchLatestTickerForUser, startModelTraining } from '../../../../../api/adminController'
import {
    setModelId,
    setTrainingParameters,
    setStartWebSocket,
    resetModelData,
    setCryptoDataInDbRedux,
    setSelectedTickerPeriod,
    resetStreamedTickerDataRedux,
    toggleToolTipSwitch
} from './CryptoModuleSlice'

import useWebSocket from './WebSocket';

import MainChart from '../components/MainChartCopy';
import SelectedFunctionContainer from '../components/SelectedFunctionContainer';
import { useSelector } from 'react-redux'
import {
    Box
    , Typography
    , Autocomplete
    , TextField
    , Grid
    , Skeleton
    , useTheme
    , Switch
    , FormControlLabel
    , Button
    , Tooltip
    , Slider
    , CircularProgress
    , IconButton
    , Paper
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

import PredictionsChart from '../components/PredictionsChart';

const MultiSelect = (props) => {
    const theme = useTheme()
    const { inputLabel, selectedInputOptions, handleInputOptions, fieldName } = props
    const inputOptions = [
        "",
        "high",
        "low",
        "open",
        "close",
    ]
    return (
        <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' gap={'40px'}>
            <Box sx={{ width: '100%' }}>
                <Autocomplete
                    size='small'
                    disableClearable
                    disablePortal={false}
                    id={`select-input-${fieldName}`}
                    name='multiSelectValue'
                    options={inputOptions}
                    value={selectedInputOptions} // Set the selected value
                    onChange={(event, newValue) => handleInputOptions(event, newValue)} // Handle value change
                    sx={{ width: 'auto' }}
                    renderInput={(params) => <TextField {...params}
                        variant="standard"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: `${theme.palette.text.secondary}`,
                                }
                            }
                        }}
                        label={`${inputLabel}`}
                        color="secondary"
                    />}
                />
            </Box>
            <Tooltip title={'Select one of the flags to be used to predict'} placement='top' sx={{ cursor: 'pointer' }}>
                <InfoOutlinedIcon className='small-icon' />
            </Tooltip>
        </Box>
    )
}

const periodToMilliseconds = (period) => {
    switch (period) {
        case '1m':
            return 1000 * 60;
        case '4h':
            return 1000 * 60 * 60 * 4;
        case '6h':
            return 1000 * 60 * 60 * 6;
        case '8h':
            return 1000 * 60 * 60 * 8;
        case '12h':
            return 1000 * 60 * 60 * 12;
        case '1d':
            return 1000 * 60 * 60 * 24;
        case '3d':
            return 1000 * 60 * 60 * 24 * 3;
        case '1w':
            return 1000 * 60 * 60 * 24 * 7;
        default:
            return 1000 * 60 * 60 * 24;
    }
}

const checkForUniqueAndTransform = (data) => {
    const uniqueData = [];
    const seenTimes = new Set();

    data.forEach((item) => {
        if (!seenTimes.has(item.openTime)) {
            uniqueData.push({
                time: (item.openTime / 1000),
                open: parseFloat(item.open),
                high: parseFloat(item.high),
                low: parseFloat(item.low),
                close: parseFloat(item.close),
                volume: parseFloat(item.volume),
            })
            seenTimes.add(item.openTime);
        } else {
            console.log('Duplicate found', item.openTime)
        }
    })
    return uniqueData
}

const checkIfNewTickerFetchIsRequired = ({ openTime, selectedTokenPeriod }) => {
    const periodInMilli = periodToMilliseconds(selectedTokenPeriod)
    const currentTime = new Date().getTime()

    let fetchLength = Math.floor((currentTime - openTime) / periodInMilli)

    let end
    switch (selectedTokenPeriod) {
        case '1m':
            end = new Date()
            end.setMinutes(end.getMinutes() - 1)
            end.setSeconds(59)
            break;
        default:
            let endAdded = new Date(openTime).getTime() + (fetchLength * periodInMilli) - 1000
            end = new Date(endAdded)
            break;
    }

    // console.log(new Date(openTime).toLocaleString(), new Date(end).toLocaleString())
    let finalDate = end.getTime()
    fetchLength = fetchLength - 1 // to avoid fetching the last ticker
    return [fetchLength, finalDate]
}

const CustomSlider = (props) => {
    const { sliderValue, name, handleModelParamChange, label, min, max, sliderMin, sliderMax, scaledLearningRate, disabled } = props

    const handleSliderValueChange = (e) => {
        const { name, value } = e.target
        if (value < min || value > max) {
            return
        } else {
            if (value === sliderValue) {
                return
            } else {
                handleModelParamChange(name, value)
            }
        }
    }
    return (
        <Box display='flex' flexDirection='column' alignItems='start'>
            <Box display='flex' flexDirection='row' justifyContent='space-between' width='100%'>
                <Typography id="training-size-slider" variant='custom' gutterBottom>{label} : {scaledLearningRate === undefined ? `${sliderValue}${label === 'Training size' ? '%' : ''}` : scaledLearningRate}</Typography>
                <Typography variant='custom'>(Min: {min}, Max: {max})</Typography>
            </Box>

            <Box sx={{ width: 300 }}>
                <Slider
                    size='small'
                    color='secondary'
                    disabled={disabled}
                    value={sliderValue}
                    name={name}
                    valueLabelDisplay={scaledLearningRate === undefined ? "auto" : "off"}
                    step={1}
                    min={sliderMin}
                    max={sliderMax}
                    onChange={(e) => handleSliderValueChange(e)}
                />
            </Box>
        </Box>
    )
}

const CryptoModule = () => {
    const params = useParams();
    const token = useSelector(state => state.auth.accessToken);
    const tokenPeriod = useSelector(state => state.cryptoModule.selectedTickerPeriod)
    const toolTipSwitchFlag = useSelector(state => state.cryptoModule.toolTipOn)
    const ohlcData = useSelector(state => state.cryptoModule.cryptoDataInDb)
    // console.log('toolTipSwitchFlag', toolTipSwitchFlag)
    const theme = useTheme()
    const { cryptotoken } = params;
    const module = window.location.href.split("/dashboard/indicators/")[1].split("/")[0]

    const dispatch = useDispatch();
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

    const [selectedTokenPeriod, setSelectedTokenPeriod] = useState(tokenPeriod);
    // console.log(selectedTokenPeriod)

    const handlePeriodChange = (newValue) => {
        dispatch(setSelectedTickerPeriod(newValue))
        setChartData([])
        setSelectedTokenPeriod(newValue);
        setFetchValues({
            asset_type: module,
            ticker_name: cryptotoken,
            period: newValue,
            page_no: 1,
            items_per_page: 500
        })
        tickerDataRef.current = false
    }

    // to fetch ticker data
    const [ticker_name] = useState(cryptotoken) // remains constant throughout the page
    let defaultFetchValues = {
        asset_type: module,
        ticker_name: ticker_name,
        period: selectedTokenPeriod,
        page_no: 1,
        items_per_page: 500
    }

    // default fetch data
    const [chartData, setChartData] = useState([]) // data to be passed to chart
    const [fetchValues, setFetchValues] = useState(defaultFetchValues)
    const [newTickerLength, setNewTickerLength] = useState(0)

    // to fetch ticker data
    const tickerDataRef = useRef(false)
    useEffect(() => {

        if (!tickerDataRef.current && ohlcData.length === 0) {
            // console.log('UE : Fetching ticker data from DB')
            tickerDataRef.current = true
            let converted = []
            // dispatch(setCryptoDataInDbRedux([]))
            dispatch(resetStreamedTickerDataRedux())
            getHistoricalTickerDataFroDb({
                token,
                payload: {
                    asset_type: fetchValues.asset_type,
                    ticker_name: fetchValues.ticker_name,
                    period: fetchValues.period,
                    page_no: fetchValues.page_no,
                    items_per_page: fetchValues.items_per_page
                }
            })
                .then((res) => {
                    const dataInDb = res.data.fetchedResults.ticker_data
                    const latestOpenTime = dataInDb[dataInDb.length - 1].openTime
                    let [fetchLength, end] = checkIfNewTickerFetchIsRequired({ openTime: latestOpenTime, selectedTokenPeriod })
                    setNewTickerLength(fetchLength)
                    if (fetchLength > 0) {
                        // console.log('UE : Fetching new tickers from binance')


                        const updateQueries = {
                            ticker_name: cryptotoken,
                            period: selectedTokenPeriod,
                            start: latestOpenTime,
                            end: end,
                        }

                        fetchLatestTickerForUser({
                            token,
                            updateQueries
                        })
                            .then((res) => {
                                const newData = res.data.newTickers
                                dataInDb.push(...newData)
                                converted = checkForUniqueAndTransform(dataInDb)
                                console.log('Total fetched data length : ', converted.length, 'New tickers to fetch', fetchLength, 'Fetched : ', newData.length)
                                setChartData(converted)
                                dispatch(setCryptoDataInDbRedux(dataInDb))
                            })
                            .catch(err => {
                                console.log(err)
                            })
                    } else {
                        converted = checkForUniqueAndTransform(dataInDb)
                        console.log('Up to date : Fetched data length : ', converted.length)
                        setChartData(converted)
                        dispatch(setCryptoDataInDbRedux(dataInDb))
                    }
                })
                .catch(err => {
                    console.log(err)
                })
        } else {
            // console.log('UE : Fetching ticker data from redux')
            const dataInDb = ohlcData
            const converted = checkForUniqueAndTransform(dataInDb)
            setChartData(converted)
        }
    }, [ohlcData, fetchValues, token, cryptotoken, selectedTokenPeriod, dispatch])

    const selectedTickerPeriod = useSelector(state => state.cryptoModule.selectedTickerPeriod)
    const selectedTickerName = useSelector(state => state.cryptoModule.selectedTickerName)
    const selectedFunctions = useSelector(state => state.cryptoModule.selectedFunctions)
    const tDataRedux = useSelector(state => state.cryptoModule.cryptoDataInDb)

    // Model training parameters
    const model_parameters = useSelector(state => state.cryptoModule.modelData.training_parameters)
    const [modelParams, setModelParams] = useState(model_parameters)

    const handleModelParamChange = (name, value) => {
        setModelParams((prev) => {
            return {
                ...prev,
                [name]: value
            }
        })
    }

    const handleMultiselectOptions = (event, newValue) => {
        setModelParams((prev) => {
            return {
                ...prev,
                'multiSelectValue': newValue
            }
        })
    }

    // setting converted learning rate
    useEffect(() => {
        setModelParams((prev) => {
            return {
                ...prev,
                'scaledLearningRate': modelParams.learningRate / 100
            }
        })
    }, [modelParams.learningRate])

    const userId = useSelector(state => state.auth.uid)

    // websocket to get model training progress
    const webSocketURL = process.env.NODE_ENV === 'development' ? `${process.env.REACT_APP_BASE_WEB_SOCKET_URL}/?user_id=${userId}` : `${process.env.REACT_APP_DEV_WEBSOCKET_URL}/?user_id=${userId}`;
    const startWebSocket = useSelector(state => state.cryptoModule.modelData.startWebSocket)

    const progressMessage = useSelector(state => state.cryptoModule.modelData.progress_message)
    const epochResults = useSelector(state => state.cryptoModule.modelData.epoch_results)
    const epochNo = useSelector(state => state.cryptoModule.modelData.epoch_no)

    const [batchResult, setBatchResult] = useState(null)

    const [trainingStartedFlag, setTrainingStartedFlag] = useState(false)

    const { webSocket, createModelProgressWebSocket } = useWebSocket(webSocketURL, setBatchResult, setTrainingStartedFlag, dispatch)

    // WebSocket connection
    useEffect(() => {
        console.log('UE : Socket start')
        if (startWebSocket) {
            if (webSocket.current === null) {
                console.log('Starting socket, flag = true and socket = null')
                createModelProgressWebSocket()
            } else {
                console.log('WS already present, socket not null')
            }
        } else {
            console.log('Socket flag = false')
            if (webSocket.current !== null) {
                console.log('Closing socket, flag = false and socket not null')
                webSocket.current.close();
                webSocket.current = null
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startWebSocket])

    // Execute query to start model training
    const [noFuncSelected, setNoFuncSelected] = useState('')
    const handleStartModelTraining = () => {
        if (selectedFunctions.length === 0) {
            console.log('Select an indicator to plot')
            setNoFuncSelected('Select an indicator to model')
        } else {
            console.log('Sending model training query...')
            setTrainingStartedFlag(true)

            let fTalibExecuteQuery = []
            selectedFunctions.forEach((unique_func) => {
                const { outputs } = unique_func;
                const func = unique_func.functions;
                func.forEach((f) => {
                    const { inputs, optInputs, name, id } = f;
                    let inputEmpty = false;
                    let talibExecuteQuery = {}
                    let tOITypes = {}
                    const transformedOptionalInputs = optInputs.reduce((result, item) => {
                        result[item.name] = item.defaultValue
                        tOITypes[item.name] = item.type;
                        return result;
                    }, {})

                    let outputkeys = {}
                    let outputsCopy = [...outputs]
                    outputkeys = outputsCopy.reduce((result, output) => {
                        result[output.name] = output.name;
                        return result;
                    }, {});

                    let converted = {}
                    inputs.map((input) => {
                        if (input.flags) {
                            Object.keys(input.flags).forEach((key) => {
                                converted[input.flags[key]] = input.flags[key];
                            })
                            return input
                        } else {
                            if (input.value === '') {
                                inputEmpty = true;
                                converted[input.name] = "";
                                return {
                                    ...input,
                                    errorFlag: true,
                                    helperText: 'Please select a valid input',
                                };
                            } else {
                                converted[input.name] = input.value;
                                return {
                                    ...input,
                                    errorFlag: false,
                                    helperText: '',
                                };
                            }
                        }
                    })

                    talibExecuteQuery['name'] = name;
                    talibExecuteQuery['startIdx'] = 0;
                    talibExecuteQuery['endIdx'] = tDataRedux.length - 1;
                    talibExecuteQuery = { ...talibExecuteQuery, ...converted, ...transformedOptionalInputs }


                    let payload = {
                        func_query: talibExecuteQuery,
                        func_param_input_keys: converted,
                        func_param_optional_input_keys: tOITypes,
                        func_param_output_keys: outputkeys,
                        db_query: {
                            asset_type: 'crypto',
                            fetch_count: tDataRedux.length,
                            period: selectedTickerPeriod,
                            ticker_name: selectedTickerName
                        }
                    }
                    fTalibExecuteQuery.push({ id, payload, inputEmpty })
                })
            })
            fTalibExecuteQuery = fTalibExecuteQuery.filter((item) => !item.inputEmpty)
            let model_training_parameters = {
                training_size: modelParams.trainingDatasetSize,
                time_step: modelParams.timeStep,
                look_ahead: modelParams.lookAhead,
                epochs: modelParams.epoch,
                hidden_layers: modelParams.hiddenLayer,
                learning_rate: modelParams.scaledLearningRate,
                to_predict: modelParams.multiSelectValue
            }
            console.log('Execute query + Model parameters', fTalibExecuteQuery, model_training_parameters)
            dispatch(setStartWebSocket(true))

            startModelTraining({
                token,
                payload: {
                    fTalibExecuteQuery,
                    model_training_parameters
                }
            }).then((res) => {
                dispatch(resetModelData())
                const modelId = res.data.job_id
                dispatch(setModelId(modelId))
                dispatch(setTrainingParameters(modelParams))
            }).catch((err) => {
                console.log(err.message)
                setTrainingStartedFlag(false)
            })
        }
    }

    // resetting the model training error prompt
    useEffect(() => {
        if (selectedFunctions.length > 0 && noFuncSelected !== '') {
            setNoFuncSelected('')
        }
    }, [selectedFunctions, noFuncSelected])

    const handleClearModelData = () => {
        dispatch(resetModelData())
        dispatch(setStartWebSocket(false))
    }

    return (
        <Box className='crypto-module-container'>
            <Box width='-webkit-fill-available'>
                <Header title={cryptotoken} />
            </Box>

            <Box m={2}>
                <Grid container className='indicator-chart-grid-box' >
                    <Grid item xs={12} sm={12} md={12} lg={12} xl={12} pt={2}>
                        <Box display='flex' flexDirection='column' height='100%'>
                            <Box className='ticker-period-selector-top' pl={2} pr={2} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' gap='10px'>
                                <Box className='autocomplete-select-box' width='200px'>
                                    <Autocomplete
                                        size='small'
                                        disableClearable
                                        disablePortal={false}
                                        id="selec-stock-select"
                                        options={periods}
                                        value={selectedTokenPeriod} // Set the selected value
                                        onChange={(event, newValue) => handlePeriodChange(newValue)} // Handle value change
                                        sx={{ width: 'auto' }}
                                        renderInput={(params) => <TextField size='small' {...params}
                                            sx={{
                                                '& .MuiOutlinedInput-root': {
                                                    '& fieldset': {
                                                        borderColor: `${theme.palette.primary.newWhite} !important`,
                                                    }
                                                }
                                            }}
                                            label="Select a period"
                                            color="secondary"
                                        />}
                                    />
                                </Box>
                                <Box>
                                    <Typography>{ohlcData.length} / {ohlcData.length / 500}</Typography>
                                    <FormControlLabel
                                        value="start"
                                        control={<Switch size="small" color="secondary" />}
                                        label={toolTipSwitchFlag ? 'Hide Tooltips' : 'Show Tooltips'}
                                        labelPlacement="start"
                                        checked={toolTipSwitchFlag}
                                        onChange={() => dispatch(toggleToolTipSwitch())}
                                    />
                                </Box>
                            </Box>

                            <Grid container className='indicator-chart-grid'>
                                <Grid item xs={12} sm={12} md={12} lg={9} xl={9}>
                                    <Box className='chart-container' display='flex' flexDirection='column' height='100%' m={2}>
                                        {chartData.length === 0 ?
                                            (
                                                <Box className='token-chart-box' minHeight="100%" alignItems='center' justifyContent='center' display='flex'>
                                                    <Skeleton variant="rounded" sx={{ bgcolor: '#3f3f40' }} width="80%" height="80%" />
                                                </Box>
                                            )
                                            :
                                            (
                                                <Box className='token-chart-box' minHeight="100%">
                                                    <MainChart
                                                        latestTime={chartData[chartData.length - 1].time * 1000 + 60000}
                                                        new_fetch_offset={newTickerLength}
                                                        symbol={cryptotoken}
                                                        selectedTokenPeriod={selectedTokenPeriod}
                                                        module={module}
                                                        fetchValues={fetchValues}
                                                    />
                                                </Box>
                                            )
                                        }
                                    </Box>
                                </Grid>

                                <Grid item xs={12} sm={12} md={12} lg={3} xl={3}>
                                    placeholder
                                </Grid>
                            </Grid>
                        </Box>
                    </Grid>
                </Grid >

                <Grid container className='tensor-flow-grid'>
                    <Grid item xs={12} sm={12} md={3} lg={3} xl={3}>
                        <Box className='selected-function-value-displaybox' display='flex' flexDirection='column' alignItems='start' gap='10px' pl={2} pr={2} pt={4} pb={2}>
                            <Box display='flex' flexDirection='column' gap='5px'>
                                <CustomSlider sliderValue={modelParams.trainingDatasetSize} name={'trainingDatasetSize'} handleModelParamChange={handleModelParamChange} label={'Training size'} min={50} max={95} sliderMin={0} sliderMax={100} disabled={trainingStartedFlag} />
                                <CustomSlider sliderValue={modelParams.timeStep} name={'timeStep'} handleModelParamChange={handleModelParamChange} label={'Step Size'} min={14} max={100} sliderMin={1} sliderMax={100} disabled={trainingStartedFlag} />
                                <CustomSlider sliderValue={modelParams.lookAhead} name={'lookAhead'} handleModelParamChange={handleModelParamChange} label={'Look Ahead'} min={1} max={5} sliderMin={1} sliderMax={5} disabled={trainingStartedFlag} />
                                <CustomSlider sliderValue={modelParams.epoch} name={'epoch'} handleModelParamChange={handleModelParamChange} label={'Epochs'} min={1} max={20} sliderMin={1} sliderMax={20} disabled={trainingStartedFlag} />
                                <CustomSlider sliderValue={modelParams.hiddenLayer} name={'hiddenLayer'} handleModelParamChange={handleModelParamChange} label={'Hidden Layers'} min={1} max={20} sliderMin={1} sliderMax={10} disabled={trainingStartedFlag} />
                                <CustomSlider sliderValue={modelParams.learningRate} name={'learningRate'} handleModelParamChange={handleModelParamChange} label={'Learning Rate'} min={0} max={100} sliderMin={0} sliderMax={100} scaledLearningRate={modelParams.scaledLearningRate} disabled={trainingStartedFlag} />
                                <MultiSelect
                                    inputLabel={'Prediction flag'}
                                    selectedInputOptions={modelParams.multiSelectValue}
                                    handleInputOptions={handleMultiselectOptions}
                                    fieldName={'To predict'}
                                />
                            </Box>

                            <Box display='flex' alignItems='center' gap='10px'>
                                <Button
                                    variant='outlined'
                                    size='small'
                                    color='secondary'
                                    disabled={trainingStartedFlag}
                                    onClick={(e) => handleStartModelTraining()}
                                    endIcon={trainingStartedFlag && <CircularProgress style={{ width: '20px', height: '20px' }} color='secondary' />}
                                >
                                    {trainingStartedFlag ? 'Training' : 'Start Training'}
                                </Button>
                                <Tooltip title={'Reset data'} placement='top' sx={{ cursor: 'pointer' }}>
                                    <IconButton onClick={handleClearModelData.bind(null)}>
                                        <RestartAltIcon className='small-icon' />
                                    </IconButton>
                                </Tooltip>
                                {noFuncSelected !== '' && <Typography variant='custom' sx={{ color: 'red' }}>{noFuncSelected}</Typography>}
                            </Box>

                            {/* progress message */}
                            {progressMessage.length > 0 && (
                                <Paper elevation={6} sx={{ backgroundColor: `${theme.palette.background.paperOne}` }}>
                                    <Box p={'5px'} className='progress-update-notify-ws' id="messageDiv" display='flex' flexDirection='column' alignItems='start' height='180px' overflow='auto'>
                                        {progressMessage.map((message, index) => {
                                            return (
                                                <p key={index} className='socket-message'>{message.message}</p>
                                            )
                                        })}

                                    </Box>
                                </Paper>
                            )}

                            {/* epoch end results */}
                            {epochResults.length > 0 && epochResults.map((result, index) => {
                                return (
                                    <Box key={index} className={`epoch_${index} epoch`} sx={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                                        <span className='epoch-no' style={{ fontWeight: '600', fontSize: '0.75rem', width: '70px', textAlign: 'start' }}>Epoch : {result.epoch}</span>
                                        <Box className={`model-progress_${index}`} variant='h6'>
                                            <div className='epoch-end'>
                                                <div className='batch-end-text'>Loss : {result.loss}</div>
                                                <div className='batch-end-text'>MSE : {result.mse}</div>
                                                <div className='batch-end-text'>MAE : {result.mae}</div>
                                            </div>
                                        </Box>
                                    </Box>
                                )
                            })}

                            {/* epoch batch results */}
                            {batchResult && (
                                <Box className={`epoch_{} epoch`} sx={{ display: batchResult ? 'flex' : 'none', flexDirection: 'row', gap: '10px' }}>
                                    <span className='epoch-no' style={{ fontWeight: '600', fontSize: '0.75rem', width: '70px', textAlign: 'start' }}>Epoch : {epochNo}</span>
                                    <Box className={`model-progress_{}`} variant='h6'>
                                        <div className='batch-end'>
                                            <div style={{ fontWeight: '600', fontSize: '0.75rem', width: '70px', textAlign: 'start' }}>Batch : {batchResult.batch}</div>
                                            <div className='batch-end-text'>Loss : {batchResult.loss}</div>
                                            <div className='batch-end-text'>MSE : {batchResult.mse}</div>
                                            <div className='batch-end-text'>MAE : {batchResult.mae}</div>
                                        </div>
                                    </Box>
                                </Box>
                            )
                            }

                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={12} md={6} lg={8} xl={6}>
                        <PredictionsChart />
                    </Grid>
                    <Grid item xs={12} sm={12} md={3} lg={3} xl={3}>
                        <Box className='saved-models' pt={4}>
                            Saved models
                        </Box>
                    </Grid>
                </Grid>


                <Box ml={2} mr={2} mb={2} mt={2}>
                    <Box pl={1}>
                        <Typography variant='h4' sx={{ textAlign: 'start' }}>Selected Indicators</Typography>
                    </Box>
                    {selectedFunctions.length === 0 ?
                        (
                            <Box display='flex' flexDirection='row' justifyContent='flex-start'>
                                <Typography variant='h6' pl={1} sx={{ textAlign: 'start' }}>Select an indicator to plot</Typography>
                            </Box>
                        )
                        :
                        (
                            <Grid container className='indicator-data-container'>
                                {selectedFunctions && selectedFunctions.map((funcRedux, index) => {
                                    const { name } = funcRedux
                                    return (
                                        <Grid key={`${name}${index}`} item xs={12} sm={12} md={6} lg={4} xl={3}>
                                            <SelectedFunctionContainer key={index} funcRedux={funcRedux} fetchValues={fetchValues} />
                                        </Grid>
                                    )
                                })}
                            </Grid>
                        )
                    }
                </Box>

            </Box >

            <Indicators symbol={cryptotoken} fetchValues={fetchValues} />
        </Box >
    )
}

export default CryptoModule