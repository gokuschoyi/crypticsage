import React, { useState, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import Header from '../../../global/Header';
import { Indicators } from '../components/IndicatorDescription';
import { getHistoricalTickerDataFroDb, fetchLatestTickerForUser, startModelTraining, getUserModels, saveModel, deleteModel } from '../../../../../api/adminController'
import {
    setUserModels,
    setModelSavedToDb,
    setModelId,
    setTrainingParameters,
    setStartWebSocket,
    resetCurrentModelData,
    resetModelData,
    setCryptoDataInDbRedux,
    setSelectedTickerPeriod,
    resetStreamedTickerDataRedux,
    toggleToolTipSwitch,
    setSelectedFunctions,
    setSelectedFlagInTalibDescription
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
    , Chip
    , Avatar
} from '@mui/material'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SaveIcon from '@mui/icons-material/Save';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';

import { Success, Info, Error } from '../../../global/CustomToasts'

import PredictionsChart from '../components/PredictionsChart';

const TICKER_PERIODS = [
    '1m',
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

const MODEL_OPTIONS = [
    "",
    "Multiple Input Series",
    "Multiple Parallel Series",
]

const MultiSelect = (props) => {
    const theme = useTheme()
    const { inputLabel, inputOptions, selectedInputOptions, handleInputOptions, fieldName, toolTipTitle } = props

    return (
        <Paper elavation={6}>
            <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' gap={'40px'} pl={'4px'} pr={'4px'} pt={1} pb={1}>
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
                <Tooltip title={toolTipTitle} placement='top' sx={{ cursor: 'pointer' }}>
                    <InfoOutlinedIcon className='small-icon' />
                </Tooltip>
            </Box>
        </Paper>
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

// model name state management for saved model,, currently the model name in predictions shart changes on each render after save ...
// save the model name to redux,

const generateRandomModelName = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 10;
    let modelName = 'model_';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        modelName += characters.charAt(randomIndex);
    }

    return modelName;
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
    const [slideValue, setSlideValue] = useState(min)

    useEffect(() => {
        setSlideValue(sliderValue)
    }, [sliderValue])

    const handleChange = (e) => {
        const { value } = e.target
        if (value < min || value > max || value === slideValue) {
            return
        } else {
            setSlideValue(value)
        }
    }

    const handleSliderValueChange = (e, value) => {
        if (value < min) {
            value = min
        } else if (value > max) {
            value = max
        }
        handleModelParamChange(name, value)
    }

    return (
        <Paper elevation={6}>
            <Box p={'4px 8px'} display='flex' flexDirection='column' alignItems='start'>
                <Box display='flex' flexDirection='row' justifyContent='space-between' width='100%'>
                    <Typography id="training-size-slider" variant='custom'>{label} : {scaledLearningRate === undefined ? `${sliderValue}${label === 'Training size' ? '%' : ''}` : scaledLearningRate}</Typography>
                    <Typography variant='custom'>(Min: {min}, Max: {max})</Typography>
                </Box>

                <Box sx={{ width: "100%" }}>
                    <Slider
                        size='small'
                        color='secondary'
                        disabled={disabled}
                        value={slideValue}
                        name={name}
                        id={name}
                        valueLabelDisplay={'auto'}
                        scale={(val) => {
                            if (scaledLearningRate !== undefined) {
                                return val / 100;
                            }
                            return val;
                        }}
                        step={1}
                        min={sliderMin}
                        max={sliderMax}
                        onChange={(e) => handleChange(e)}
                        onChangeCommitted={(e, val) => handleSliderValueChange(e, val)}
                    />
                </Box>
            </Box>
        </Paper>
    )
}

const CryptoModule = () => {
    const dispatch = useDispatch();
    const theme = useTheme()
    const params = useParams();
    const token = useSelector(state => state.auth.accessToken);
    const tokenPeriod = useSelector(state => state.cryptoModule.selectedTickerPeriod)
    const toolTipSwitchFlag = useSelector(state => state.cryptoModule.toolTipOn)
    const ohlcData = useSelector(state => state.cryptoModule.cryptoDataInDb)
    // console.log('toolTipSwitchFlag', toolTipSwitchFlag)

    const { cryptotoken } = params;
    const module = window.location.href.split("/dashboard/indicators/")[1].split("/")[0]

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
    const [actualFetchLength, setActualFetchLength] = useState(0)
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
                    setActualFetchLength(dataInDb.length)
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


    // search and add function feature
    const talibFunctions = useSelector(state => state.cryptoModule.talibDescription)
    const [transformedFunctionsList, setTransformedFunctionList] = useState([]);

    useEffect(() => {
        if (talibFunctions.length > 0) {
            const modified = talibFunctions.reduce((result, item) => {
                return [
                    ...result,
                    ...item.functions.map((func) => ({
                        func_selected: func.function_selected_flag,
                        group: func.group,
                        label: `${func.name} : ${func.hint}`,
                    }))
                ];
            }, [])
            setTransformedFunctionList(modified)
        }
    }, [talibFunctions])

    const [searchedFunctions, setSearchedFunction] = useState([]);
    const handleSearchedFunctions = (newValue) => {
        setSearchedFunction(newValue)
    }

    const handleAddSelectedFunction = () => {
        console.log('Add functions to calculate')
        const functionNamesToAdd = searchedFunctions.map((func) => {
            const [func_name, func_hint] = func.label.split(':')
            return func_name.trim()
        })
        // console.log(functionNamesToAdd)

        functionNamesToAdd.forEach((func_name) => {
            const foundFunction = talibFunctions
                .map(group => group.functions)
                .flat()
                .find(func => func.name === func_name);
            console.log(foundFunction)

            if (foundFunction) {
                dispatch(setSelectedFlagInTalibDescription(
                    {
                        group: foundFunction.group,
                        name: foundFunction.name,
                        inputs: foundFunction.inputs,
                        optInputs: foundFunction.optInputs,
                    }
                ))

                dispatch(setSelectedFunctions(
                    {
                        hint: foundFunction.hint,
                        name: foundFunction.name,
                        group_name: foundFunction.group,
                        inputs: foundFunction.inputs,
                        optInputs: foundFunction.optInputs,
                        outputs: foundFunction.outputs,
                        function_selected_flag: true,
                        result: [],
                        splitPane: foundFunction.splitPane
                    }
                ))
            }
        })
        setSearchedFunction((prev) => { return [] })

    }


    // Model training parameters
    const model_parameters = useSelector(state => state.cryptoModule.modelData.training_parameters)
    const userModels = useSelector(state => state.cryptoModule.userModels)
    const model_data = useSelector(state => state.cryptoModule.modelData)
    const [modelParams, setModelParams] = useState(model_parameters)
    const [modelName, setModelName] = useState(model_data.model_name)

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

    const handleModelTypeOptions = (event, newValue) => {
        setModelParams((prev) => {
            return {
                ...prev,
                'modelType': newValue
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

    // Execute query to start model training
    const [noFuncSelected, setNoFuncSelected] = useState('')
    const handleStartModelTraining = () => {
        if (selectedFunctions.length === 0) {
            console.log('Select an indicator to plot')
            setNoFuncSelected('Select a function first to model')
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
                to_predict: modelParams.multiSelectValue,
                model_type: modelParams.modelType,
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
                const model_name = generateRandomModelName()
                setModelName(model_name)
                dispatch(setModelId({ model_id: modelId, model_name: model_name }))
                dispatch(setTrainingParameters({ model_params: modelParams, selected_functions: fTalibExecuteQuery }))
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
        for (const key of Object.keys(model_parameters)) {
            if (model_parameters[key] !== modelParams[key]) {
                setModelParams(model_parameters)
                break
            }
        }
    }

    const handleSaveModel = () => {
        const saveModelPayload = {
            model_id: model_data.model_id,
            model_name: modelName,
            ticker_name: selectedTickerName,
            ticker_period: selectedTickerPeriod,
            training_parameters: model_data.training_parameters,
            talibExecuteQueries: model_data.talibExecuteQueries,
            predicted_result: model_data.predictedValues
        }
        // console.log(saveModelPayload)

        saveModel({ token, payload: saveModelPayload })
            .then((res) => {
                const { model_save_status, modelSaveResult, user_id } = res.data
                if (model_save_status) {
                    Success('Model saved')
                    dispatch(setModelSavedToDb({ status: true, model_name: modelName }))
                    getUserModels({ token, payload: { user_id } })
                        .then((res) => {
                            dispatch(setUserModels(res.data.models))
                        })
                } else {
                    Info('Model already saved')
                    console.log('Saving the same modle')
                    return
                }
            })
            .catch((err) => {
                console.log(err.message)
            })
    }

    const handleDeleteModel = () => {
        const model_id = model_data.model_id
        deleteModel({ token, payload: { model_id } })
            .then((res) => {
                Success(res.data.message)
                dispatch(resetCurrentModelData())
            })
            .catch((err) => {
                console.log(err.message)
            })
    }

    const predictedVlauesRedux = useSelector(state => state.cryptoModule.modelData.predictedValues)
    const [predictionChartType, setPredictionChartType] = React.useState('standardized')

    const handlePredictionsChartType = (param) => {
        const { type } = param;
        // console.log(type)
        setPredictionChartType(type)
    }


    // websocket to get model training progress
    const userId = useSelector(state => state.auth.uid)
    const webSocketURL = process.env.NODE_ENV === 'development' ? `${process.env.REACT_APP_BASE_WEB_SOCKET_URL}/?user_id=${userId}` : `${process.env.REACT_APP_DEV_WEBSOCKET_URL}/?user_id=${userId}`;
    const startWebSocket = useSelector(state => state.cryptoModule.modelData.startWebSocket)

    const notifyMessageBoxRef = useRef(null)
    const epochResults = useSelector(state => state.cryptoModule.modelData.epoch_results)

    const [batchResult, setBatchResult] = useState(false)
    const [trainingStartedFlag, setTrainingStartedFlag] = useState(startWebSocket)
    const { webSocket, createModelProgressWebSocket } = useWebSocket(webSocketURL, notifyMessageBoxRef, batchResult, setBatchResult, setTrainingStartedFlag, dispatch)

    // WebSocket connection
    useEffect(() => {
        // console.log('UE : Socket start')
        if (startWebSocket) {
            if (webSocket.current === null) {
                // console.log('Starting socket, flag = true and socket = null')
                createModelProgressWebSocket()
            } else {
                // console.log('WS already present, socket not null')
            }
        } else {
            // console.log('Socket flag = false')
            if (webSocket.current !== null) {
                // console.log('Closing socket, flag = false and socket not null')
                webSocket.current.close();
                webSocket.current = null
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [startWebSocket])


    const handleModelDeletFromSaved = ({ model_id }) => {
        console.log('clicked',model_id)
    }

    const handleExpandSelectedModel = ({ model_id }) => {
        console.log(model_id)
    }

    return (
        <Box className='crypto-module-container'>
            <Box width='-webkit-fill-available'>
                <Header title={cryptotoken} />
            </Box>

            <Box m={2} className='crypto-module-container-box'>

                <Grid container className='indicator-chart-grid' pt={2} pb={2}>
                    <Grid item xs={12} sm={12} md={12} lg={9} xl={9}>
                        <Box className='ticker-period-selector-top' pl={3} pr={3} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' gap='10px'>
                            <Box className='autocomplete-select-box' width='200px'>
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
                                                    borderColor: `${theme.palette.primary.newWhite} !important`,
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
                            <Box display='flex' flexDirection='column' alignItems='start'>
                                <Typography variant='custom' style={{ marginLeft: '16px' }}>AF:{actualFetchLength}, R:{ohlcData.length} / {ohlcData.length / 500}</Typography>
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
                        <Box className='chart-container' display='flex' flexDirection='column' height='100%' pl={2} pr={2} pt={2}>
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
                        <Box className='search-indicator-box' display='flex' flexDirection='row' alignItems='center' pl={2} pr={2} pt={1}>
                            <Box className='function-selector' width='100%'>
                                {transformedFunctionsList.length > 0 &&
                                    <Autocomplete
                                        sx={{ backgroundColor: `${theme.palette.background.paperOne}` }}
                                        disableCloseOnSelect={true}
                                        value={searchedFunctions}
                                        size='small'
                                        multiple
                                        limitTags={2}
                                        id="tags-filled"
                                        options={transformedFunctionsList.sort((a, b) => -b.group.localeCompare(a.group))}
                                        getOptionDisabled={(option) => transformedFunctionsList.filter((item) => item.label === option.label)[0].func_selected || searchedFunctions.includes(option.label)}
                                        groupBy={(option) => option.group}
                                        freeSolo
                                        onChange={(event, newValue) => {
                                            handleSearchedFunctions(newValue)
                                        }}
                                        renderTags={(value, getTagProps) =>
                                            value.map((option, index) => (
                                                <Chip variant="outlined" label={option.label} {...getTagProps({ index })} />
                                            ))
                                        }
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                variant="filled"
                                                label="Search for a function"
                                                placeholder="Search..."
                                            />
                                        )}
                                    />
                                }
                                {searchedFunctions.length > 0 &&
                                    <Box display='flex' alignItems='start' pt={1}>
                                        <Button size='small' color='secondary' variant='outlined' onClick={handleAddSelectedFunction.bind(null)}>Add Functions</Button>
                                    </Box>
                                }
                            </Box>
                        </Box>
                    </Grid>
                </Grid>

                <Box mb={2} mt={2} className='selected-functions-box'>
                    {selectedFunctions.length === 0 ?
                        (
                            <Box display='flex' flexDirection='row' justifyContent='flex-start'>
                                <Typography variant='h4' pl={1} sx={{ textAlign: 'start' }}>Select an indicator to plot</Typography>
                            </Box>
                        )
                        :
                        (
                            <React.Fragment>
                                <Box pl={2} pt={2}>
                                    <Typography variant='h4' sx={{ textAlign: 'start' }}>Selected Indicators</Typography>
                                </Box>
                                <Grid pl={1} container className='indicator-data-container'>
                                    {selectedFunctions && selectedFunctions.map((funcRedux, index) => {
                                        const { name } = funcRedux
                                        return (
                                            <Grid key={`${name}${index}`} item xs={12} sm={6} md={4} lg={4} xl={3}>
                                                <SelectedFunctionContainer key={index} funcRedux={funcRedux} fetchValues={fetchValues} />
                                            </Grid>
                                        )
                                    })}
                                </Grid>
                            </React.Fragment>
                        )
                    }
                </Box>

                <Box className='model-training-container'>
                    <Box alignItems='start' display='flex' pl={2} pt={2} pb={1} className='trainmodel-title'>
                        <Typography variant='h4'>Model Training</Typography>
                    </Box>
                    <Grid container className='tensor-flow-grid'>
                        <Grid item xs={12} sm={12} md={4} lg={3} xl={3} pl={2} pr={2} pb={2}>
                            <Box display='flex' flexDirection='column' pb={2}>
                                <Box display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
                                    <Typography variant='h5' textAlign='start'>Parameters</Typography>
                                    <Box display='flex' alignItems='center' gap='10px'>
                                        <Button
                                            sx={{
                                                height: '26px',
                                            }}
                                            variant='outlined'
                                            size='small'
                                            color='secondary'
                                            disabled={trainingStartedFlag}
                                            onClick={(e) => handleStartModelTraining()}
                                            endIcon={trainingStartedFlag && <CircularProgress style={{ width: '20px', height: '20px' }} color='secondary' />}
                                        >
                                            {trainingStartedFlag ? 'Training' : 'Train'}
                                        </Button>
                                        <Tooltip title={'Reset training data. (This will reset your entire model parameters to default and remove all models and predictions) WARN -  Save before resetting '} placement='top' sx={{ cursor: 'pointer', padding: '6px' }}>
                                            <span>
                                                <IconButton disabled={trainingStartedFlag} onClick={handleClearModelData.bind(null)}>
                                                    <RestartAltIcon className='small-icon' />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </Box>
                                </Box>
                                {noFuncSelected !== '' && <Typography variant='custom' textAlign='start' sx={{ color: 'red' }}>{noFuncSelected}</Typography>}
                            </Box>

                            <Box className='selected-function-value-displaybox' display='flex' flexDirection='column' alignItems='start' gap='10px'>
                                <Box display='flex' flexDirection='column' gap='5px' width='100%'>
                                    <CustomSlider sliderValue={modelParams.trainingDatasetSize} name={'trainingDatasetSize'} handleModelParamChange={handleModelParamChange} label={'Training size'} min={50} max={95} sliderMin={0} sliderMax={100} disabled={trainingStartedFlag} />
                                    <CustomSlider sliderValue={modelParams.timeStep} name={'timeStep'} handleModelParamChange={handleModelParamChange} label={'Step Size'} min={14} max={100} sliderMin={1} sliderMax={100} disabled={trainingStartedFlag} />
                                    <CustomSlider sliderValue={modelParams.lookAhead} name={'lookAhead'} handleModelParamChange={handleModelParamChange} label={'Look Ahead'} min={1} max={5} sliderMin={1} sliderMax={5} disabled={trainingStartedFlag} />
                                    <CustomSlider sliderValue={modelParams.epoch} name={'epoch'} handleModelParamChange={handleModelParamChange} label={'Epochs'} min={1} max={20} sliderMin={1} sliderMax={20} disabled={trainingStartedFlag} />
                                    <CustomSlider sliderValue={modelParams.hiddenLayer} name={'hiddenLayer'} handleModelParamChange={handleModelParamChange} label={'Hidden Layers'} min={1} max={20} sliderMin={1} sliderMax={10} disabled={trainingStartedFlag} />
                                    <CustomSlider sliderValue={modelParams.learningRate} name={'learningRate'} handleModelParamChange={handleModelParamChange} label={'Learning Rate'} min={0} max={100} sliderMin={0} sliderMax={100} scaledLearningRate={modelParams.scaledLearningRate} disabled={trainingStartedFlag} />
                                    <MultiSelect
                                        inputLabel={'Prediction flag'}
                                        inputOptions={INPUT_OPTIONS}
                                        selectedInputOptions={modelParams.multiSelectValue}
                                        handleInputOptions={handleMultiselectOptions}
                                        fieldName={'To predict'}
                                        toolTipTitle={'Select one of the flags to be used to predict'}
                                    />
                                    <MultiSelect
                                        inputLabel={'Model type'}
                                        inputOptions={MODEL_OPTIONS}
                                        selectedInputOptions={modelParams.modelType}
                                        handleInputOptions={handleModelTypeOptions}
                                        fieldName={'Model type'}
                                        toolTipTitle={'Select a model type'}
                                    />
                                </Box>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={12} md={8} lg={6} xl={6} pl={2} pr={2} pb={2} className='predictions-chart-grid'>
                            <Box display='flex' flexDirection='column' pb={2}>
                                <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' className='prediction-chart-header'>
                                    <Typography variant='h5' textAlign='start'>Predictions Chart</Typography>
                                    {Object.keys(predictedVlauesRedux).length !== 0 &&
                                        <Box display='flex' flexDirection='row' gap={'4px'} alignItems='center' className='model-chart-action-container'>
                                            <TextField
                                                size='small'
                                                inputProps={{ style: { height: '10px' } }}
                                                id="outlined-controlled"
                                                label="Model name"
                                                value={modelName}
                                                onChange={(event) => {
                                                    setModelName(event.target.value);
                                                }}
                                            />
                                            <Box className='model-chart-action-box'>
                                                <Tooltip title={'Save Model'} placement='top' sx={{ cursor: 'pointer', padding: '6px' }}>
                                                    <IconButton onClick={handleSaveModel.bind(null, {})}>
                                                        <SaveIcon className='small-icon' />
                                                    </IconButton>
                                                </Tooltip>
                                                {!model_data.model_saved_to_db &&
                                                    <Tooltip title={'Delete the current model'} placement='top' sx={{ cursor: 'pointer', padding: '6px' }}>
                                                        <IconButton onClick={handleDeleteModel.bind(null, {})}>
                                                            <DeleteForeverIcon className='small-icon' />
                                                        </IconButton>
                                                    </Tooltip>
                                                }
                                                <Tooltip title={'Normalized values'} placement='top' sx={{ cursor: 'pointer', padding: '6px' }}>
                                                    <span>
                                                        <IconButton sx={{ padding: '6px' }} disabled={predictionChartType === "standardized" ? true : false} onClick={handlePredictionsChartType.bind(null, { type: 'standardized' })}>
                                                            <OpenInFullIcon className='small-icon' />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                                <Tooltip title={'Scaled values'} placement='top' sx={{ cursor: 'pointer', padding: '6px' }}>
                                                    <span>
                                                        <IconButton sx={{ padding: '6px' }} disabled={predictionChartType === "scaled" ? true : false} onClick={handlePredictionsChartType.bind(null, { type: 'scaled' })}>
                                                            <CloseFullscreenIcon className='small-icon' />
                                                        </IconButton>
                                                    </span>
                                                </Tooltip>
                                            </Box>
                                        </Box>
                                    }
                                </Box>
                            </Box>

                            <PredictionsChart
                                predictionChartType={predictionChartType}
                                trainingStartedFlag={startWebSocket}
                            />

                            <Box className='main-training-status-box' pt={1}>
                                {/* epoch end results */}
                                <Box className='epoch-end-progress-box' pt={1}>
                                    {epochResults.length > 0 && epochResults.map((result, index) => {
                                        return (
                                            <Box key={index} className={`epoch_${index} epoch`} sx={{ display: 'flex', flexDirection: 'row', gap: '10px', justifyContent: 'space-between' }}>
                                                <div className='epoch-no' style={{ fontWeight: '600', fontSize: '0.75rem', minWidth: '60px', textAlign: 'start' }}>E : {result.epoch}</div>
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
                                </Box>

                                {/* epoch batch results */}
                                <Box className='batch-end-progress-box' pt={1}>
                                    {batchResult && (
                                        <Box className={`epoch_{} epoch`} sx={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                                            <Box className={`model-progress_{}`} variant='h6'>
                                                <div className='batch-end'>
                                                    <div style={{ fontWeight: '600', fontSize: '0.75rem', width: '70px', textAlign: 'start' }} id='batch-no'></div>
                                                    <div className='batch-end-text' id='loss'></div>
                                                    <div className='batch-end-text' id='mse'></div>
                                                    <div className='batch-end-text' id='mae'></div>
                                                </div>
                                            </Box>
                                        </Box>
                                    )
                                    }
                                </Box>

                                {/* progress message */}
                                {/* <Box className='checkpoint-progress-box'>
                                    {startWebSocket === true ?
                                        <Paper elevation={6} sx={{ backgroundColor: `${theme.palette.background.paperOne}` }}>
                                            <Box p={'5px'} className='progress-update-notify-ws' id="messageDiv" display='flex' flexDirection='column' alignItems='start' height='100px' overflow='auto'>

                                            </Box>
                                        </Paper>
                                        :
                                        <Box>
                                            {progressMessage.length > 0 && (
                                                <Paper elevation={6} sx={{ backgroundColor: `${theme.palette.background.paperOne}` }}>
                                                    <Box p={'5px'} className='progress-update-notify-ws' id="messageDiv" display='flex' flexDirection='column' alignItems='start' height='100px' overflow='auto'>
                                                        {progressMessage.map((message, index) => {
                                                            return (
                                                                <p key={index} className='socket-message'>{message.message}</p>
                                                            )
                                                        })}

                                                    </Box>
                                                </Paper>
                                            )}
                                        </Box>
                                    }
                                </Box> */}
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={12} md={12} lg={3} xl={3} pl={2} pr={2} pb={2}>
                            <Box className='saved-models' display='flex' flexDirection='column' pb={2}>
                                <Box height='32px' display='flex' alignItems='center'>
                                    <Typography variant='h5' textAlign='start'>Saved Models</Typography>
                                </Box>
                            </Box>
                            <Box>
                                {userModels.length === 0 ?
                                    <Box display='flex' alignItems='start'>
                                        <Typography>No Saved Models</Typography>
                                    </Box>
                                    :
                                    <Box display='flex' flexDirection='column' gap='5px'>
                                        {userModels.map((model, index) => {
                                            const {model_name,model_id}=model
                                            return (
                                                <Paper key={index} elevation={4}>
                                                    <Box display='flex' alignItems='center' justifyContent='space-between' pl={'5px'} pr={'5px'}>
                                                        <Typography>{model_name}</Typography>
                                                        <Box>
                                                            <Tooltip title={'View Model Data'} placement='top' sx={{ cursor: 'pointer', padding: '6px' }}>
                                                                <span>
                                                                    <IconButton onClick={handleModelDeletFromSaved.bind(null, { model_id: model_id })} sx={{ padding: '6px' }} disabled={predictionChartType === "scaled" ? true : false} >
                                                                        <AspectRatioIcon className='small-icon' />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                            <Tooltip title={'Delete Model'} placement='top' sx={{ cursor: 'pointer', padding: '6px' }}>
                                                                <span>
                                                                    <IconButton onClick={handleExpandSelectedModel.bind(null, { model_id: model_id })} sx={{ padding: '6px' }} disabled={predictionChartType === "scaled" ? true : false} >
                                                                        <DeleteForeverIcon className='small-icon' />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                        </Box>
                                                    </Box>
                                                </Paper>
                                            )
                                        })}
                                    </Box>
                                }
                            </Box>
                        </Grid>
                    </Grid>
                </Box>

                <Indicators symbol={cryptotoken} fetchValues={fetchValues} />
            </Box >
        </Box >
    )
}

export default CryptoModule