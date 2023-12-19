import React, { useState, useEffect, useRef } from 'react'
import Header from '../../../global/Header';
import useWebSocket from './WebSocket';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Indicators } from '../components/IndicatorDescription';
import { useSelector } from 'react-redux'
import { Success, Info } from '../../../global/CustomToasts'

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
    , CircularProgress
    , IconButton
    , Paper
    , Chip
    , useMediaQuery
    , Tooltip
    , Accordion
    , AccordionDetails
    , AccordionSummary
    , Collapse
} from '@mui/material'

import {
    getHistoricalTickerDataFroDb,
    fetchLatestTickerForUser,
    startModelTraining,
    getUserModels,
    saveModel,
    deleteModelForUser,
    deleteModel
} from '../../../../../api/adminController'

import {
    setUserModels,
    setModelSavedToDb,
    setModelId,
    setTrainingParameters,
    setPredictionPaletteId,
    setStartWebSocket,
    setModelStartTime,
    setModelEndTime,
    resetCurrentModelData,
    resetModelData,
    setCryptoDataInDbRedux,
    setSelectedTickerPeriod,
    resetStreamedTickerDataRedux,
    toggleToolTipSwitch,
    toggleShowPredictionSwitch,
    setSelectedFunctions,
    setSelectedFlagInTalibDescription
} from './CryptoModuleSlice'

import {
    Dot,
    NoMaxWidthTooltip,
    ClassificationTable,
    PredictionMSETable,
    ModelHistoryTable,
    formatMillisecond,
    generateMSESteps,
    generateRandomModelName,
    checkForUniqueAndTransform,
    checkIfNewTickerFetchIsRequired
} from './CryptoModuleUtils'

import {
    DeleteCurrentModal,
    SaveCurrentModal,
    ResetTrainedModelModal
} from '../components/crypto_components/modals';

import {
    MainChart,
    SelectedFunctionContainer,
    PredictionsChart,
    CustomSlider,
    LinearProgressWithLabel,
    MultiSelect,
    ReorderList,
    ModelHistoryChart
} from '../components'

import {
    InfoOutlinedIcon,
    DeleteForeverIcon,
    OpenInFullIcon,
    CloseFullscreenIcon,
    AspectRatioIcon,
    ExpandMoreIcon,
    ArrowDropDownIcon,
    ArrowDropUpIcon
} from '../../../global/Icons'

const colorCombinations = [
    {
        actual: '#0047AB', // Deep Blue
        predicted: '#FFA500', // Vibrant Orange
        forecast: '#FFD700', // Bright Yellow
        TP_up: '#FF69B4', // Hot Pink (for TP_up)
        TP_down: '#00FA9A' // Medium Spring Green (for TP_down)
    },
    {
        actual: '#B22222', // Classic Red
        predicted: '#008080', // Soft Teal
        forecast: '#BC8F8F', // Gentle Lavender
        TP_up: '#FFFF00', // Yellow (for TP_up)
        TP_down: '#FF6347' // Tomato (for TP_down)
    },
    {
        actual: '#228B22', // Forest Green
        predicted: '#800080', // Rich Purple
        forecast: '#87CEEB', // Sky Blue
        TP_up: '#FF4500', // Orange Red (for TP_up)
        TP_down: '#20B2AA' // Light Sea Green (for TP_down)
    },
    {
        actual: '#2F4F4F', // Dark Slate Gray
        predicted: '#FF7F50', // Bright Coral
        forecast: '#98FB98', // Pale Green
        TP_up: '#00CED1', // Dark Turquoise (for TP_up)
        TP_down: '#FFB6C1' // Light Pink (for TP_down)
    },
    {
        actual: '#1E90FF', // Dark Slate Gray
        predicted: '#32CD32', // Bright Coral
        forecast: '#9370DB', // Pale Green
        TP_up: '#FFD700', // Dark Turquoise (for TP_up)
        TP_down: '#FF69B4' // Hot Pink (for TP_down)
    }
];

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

const mO_Copy = [
    "Single Step Single Output",
    "Single Step Multiple Output",
    "Multi Step Single Output",
    "Multi Step Multiple Output"
]

const MODEL_OPTIONS = [
    "Multi Step Single Output",
]

const MODEL_OPTIONS_VALUE = {
    "Single Step Single Output": "multi_input_single_output_no_step",
    "Single Step Multiple Output": "multi_input_multi_output_no_step",
    "Multi Step Single Output": "multi_input_single_output_step",
    "Multi Step Multiple Output": "multi_input_multi_output_step"
}

const thresholdLower = 1;
const thresholdUpper = 2
const tolerance = 1
/* const CRITERIA_DATA = [
    { Condition: 'TP', Range: `-${thresholdLower}% < x < +${thresholdLower}%`, Criteria: `All precent changes tha lie within ±${thresholdLower}% of the actual value` },
    { Condition: 'FP', Range: `x < -${thresholdLower}%`, Criteria: `All precent changes tha lie below -${thresholdLower}% than the actual value` },
    { Condition: 'TN', Range: `x > ${thresholdUpper}%`, Criteria: `All precent changes tha lie more than ${thresholdUpper}% than the actual value` },
    { Condition: 'FN', Range: `${thresholdLower}% < x < ${thresholdUpper}%`, Criteria: `All precent changes tha lie within ${thresholdLower}% and  ${thresholdUpper}% of the actual value` }
]; */
const CRITERIA_DATA = [
    { Condition: 'TP', Criteria: `Prediction is within ${tolerance}%, class of interest belongs to - actual > predicted.` },
    { Condition: 'FP', Criteria: `Prediction is within ${tolerance}%, class of interest belongs to - actual < predicted.` },
    { Condition: 'FN', Criteria: `Prediction is outside ${tolerance}%, class of interest belongs to - actual > predicted.` },
    { Condition: 'TN', Criteria: `Prediction is outside ${tolerance}%, class of interest belongs to - actual < predicted.` },
]

const CryptoModule = () => {
    const dispatch = useDispatch();
    const theme = useTheme()
    const params = useParams();
    const token = useSelector(state => state.auth.accessToken);
    const tokenPeriod = useSelector(state => state.cryptoModule.selectedTickerPeriod)
    const toolTipSwitchFlag = useSelector(state => state.cryptoModule.toolTipOn)
    const showPredictionSwitchFlag = useSelector(state => state.cryptoModule.showPredictions)
    const ohlcData = useSelector(state => state.cryptoModule.cryptoDataInDb)
    // console.log('showPredictionSwitchFlag', showPredictionSwitchFlag)

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

    const handleMainChartPredictionLookaAhead = (newValue) => {
        const lookAhead = parseInt(newValue.split('+')[1])
        setPredictionLookAhead(lookAhead)
        // console.log(lookAhead)
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

    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    const [trainingParametersAccordianCollapse, setTrainingParametersAccordianCollapse] = useState(!sm)
    const handleParametersAccordianCollapse = () => {
        setTrainingParametersAccordianCollapse((prev) => !prev)
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

    /* const handleModelTypeOptions = (event, newValue) => {
        setModelParams((prev) => {
            return {
                ...prev,
                'modelType': newValue
            }
        })
    } */

    const handleDoValidation = () => {
        console.log('toggle validation')
        setModelParams((prev) => {
            return {
                ...prev,
                'doValidation': !prev.doValidation
            }
        })
    }

    const handleEarlyStopping = () => {
        console.log('toggle early stopping')
        setModelParams((prev) => {
            return {
                ...prev,
                'earlyStopping': !prev.earlyStopping
            }
        })
    }

    const [transformationOrder, setTransformationOrder] = useState(model_parameters.transformation_order)
    // console.log('Changed order list: ', transformationOrder.findIndex(elem=> elem.value === 'close'))
    // console.log(transformationOrder)

    // setting converted learning rate
    useEffect(() => {
        const minValue = 0.0001;
        const maxValue = 0.01;

        // Calculate the exponentially scaled value
        const normalizedValue = (modelParams.learningRate - 1) / (100 - 1);
        const scaledValue = minValue * Math.pow(maxValue / minValue, normalizedValue);

        // Calculate the exponentially scaled value
        // console.log(parseFloat(scaledValue.toFixed(4)))

        setModelParams((prev) => {
            return {
                ...prev,
                'scaledLearningRate': parseFloat(scaledValue.toFixed(4))
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
            console.log('Sending model training query...', modelParams)
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
                model_type: MODEL_OPTIONS_VALUE[modelParams.modelType],
                to_predict: modelParams.multiSelectValue,
                training_size: modelParams.trainingDatasetSize,
                time_step: modelParams.timeStep,
                look_ahead: modelParams.lookAhead,
                epochs: modelParams.epoch,
                batchSize: modelParams.batchSize,
                learning_rate: modelParams.scaledLearningRate,
                hidden_layers: modelParams.hiddenLayer,
                transformation_order: transformationOrder,
                do_validation: modelParams.doValidation,
                early_stopping_flag: modelParams.earlyStopping
            }
            console.log('Execute query + Model parameters', fTalibExecuteQuery, model_training_parameters)
            dispatch(setStartWebSocket(true))
            dispatch(setModelStartTime(new Date().getTime()))
            startModelTraining({
                token,
                payload: {
                    fTalibExecuteQuery,
                    model_training_parameters
                }
            }).then((res) => {
                dispatch(resetModelData())
                dispatch(setModelEndTime(''))
                const modelId = res.data.job_id
                const model_name = generateRandomModelName(cryptotoken, selectedTokenPeriod)
                Success(res.data.message)
                setModelName(model_name)
                dispatch(setModelId({ model_id: modelId, model_name: model_name }))
                dispatch(setTrainingParameters({ model_params: modelParams, selected_functions: fTalibExecuteQuery, transformationOrder: transformationOrder }))
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

    // resetting entire training params and model data
    const handleClearModelData = () => {
        console.log(model_data.model_id, model_data.model_saved_to_db)
        if (model_data.model_id !== '' && !model_data.model_saved_to_db) { // check if saved and then delete
            console.log('Model present and not saved, resetting Redux model and deleting from BE')
            deleteModel({ token, payload: { model_id: model_data.model_id } })
                .then((res) => {
                    Success(res.data.message)
                })
                .catch((err) => {
                    console.log(err.message)
                })
            modelProcessDurationRef.current = ''
        } else {
            console.log('No model present or model has been saved')
        }
        setModelParams(() => ({ ...model_parameters }))
        dispatch(resetModelData())
        dispatch(setStartWebSocket(false))
    }

    useEffect(() => {
        // console.log('UE : setting model parameters')
        setModelParams(() => ({ ...model_parameters }))
    }, [model_parameters])

    const modelProcessDurationRef = useRef('')
    useEffect(() => {
        // console.log('UE : Calculating model training time')
        // console.log(model_data.modelStartTime)
        if (model_data.modelEndTime !== '' && model_data.modelStartTime !== '') {
            const diff = model_data.modelEndTime - model_data.modelStartTime
            modelProcessDurationRef.current = formatMillisecond(diff)
        } else {
            // console.log('Process tome not available')
            modelProcessDurationRef.current = ''
        }
    }, [model_data.modelEndTime, model_data.modelStartTime])

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
                modelProcessDurationRef.current = ''
                dispatch(resetCurrentModelData())
            })
            .catch((err) => {
                console.log(err.message)
            })
    }

    const predictedVlauesRedux = useSelector(state => state.cryptoModule.modelData.predictedValues.dates)
    const [predictionChartType, setPredictionChartType] = React.useState('standardized')

    const handlePredictionsChartType = (param) => {
        const { type } = param;
        // console.log(type)
        setPredictionChartType(type)
    }

    const [predictionLookAhead, setPredictionLookAhead] = useState(1) //for slider
    const handelPredictionLookAheadSlider = (name, value) => {
        setPredictionLookAhead(value)
    }


    // websocket to get model training progress
    const userId = useSelector(state => state.auth.uid)
    const webSocketURL = process.env.NODE_ENV === 'development' ? `${process.env.REACT_APP_BASE_WEB_SOCKET_URL}/?user_id=${userId}` : `${process.env.REACT_APP_DEV_WEBSOCKET_URL}/?user_id=${userId}`;
    const startWebSocket = useSelector(state => state.cryptoModule.modelData.startWebSocket)

    const notifyMessageBoxRef = useRef(null)
    const epochResults = useSelector(state => state.cryptoModule.modelData.epoch_results)

    const [batchResult, setBatchResult] = useState(false)
    const [evaluating, setEvaluating] = useState(false)
    const [trainingStartedFlag, setTrainingStartedFlag] = useState(startWebSocket)
    const userSelectedEpoch = modelParams.epoch
    const batchLinearProgressRef = useRef(null)
    const evalLinearProgressRef = useRef(null)
    const { webSocket, createModelProgressWebSocket } = useWebSocket(
        webSocketURL,
        userSelectedEpoch,
        notifyMessageBoxRef,
        batchResult,
        evaluating,
        batchLinearProgressRef,
        evalLinearProgressRef,
        setBatchResult,
        setEvaluating,
        setTrainingStartedFlag,
        dispatch
    )
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
        console.log('clicked', model_id)
        deleteModelForUser({ token, model_id })
            .then((res) => {
                Success(res.data.message)
                if (model_id === model_data.model_id) {
                    dispatch(resetCurrentModelData())
                }
                getUserModels({ token, payload: { user_id: userId } })
                    .then((res) => {
                        dispatch(setUserModels(res.data.models))
                    })
            })
            .catch((err) => {
                console.log(err)
            })
    }

    const handleExpandSelectedModel = ({ model_id }) => {
        console.log(model_id)
    }

    const [modelMetrics, setModelMetrics] = useState({ metrics: {}, mse: {} })

    const paletteIdRedux = useSelector(state => state.cryptoModule.modelData.predictionPaletteId)
    const [predictionChartPalette, setPredictionChartPalette] = useState(colorCombinations[paletteIdRedux])
    const handlePredictionChartPalette = ({ id }) => {
        // console.log(id)
        dispatch(setPredictionPaletteId(id))
        setPredictionChartPalette(colorCombinations[id])
        // console.log(colorCombinations[id])
    }

    return (
        <Box className='crypto-module-container'>
            <Box width='-webkit-fill-available'>
                <Header title={cryptotoken} />
            </Box>

            <Box mr={2} mb={2} ml={2} className='crypto-module-container-box'>

                <Grid container className='indicator-chart-grid' pt={2} pb={2}>
                    <Grid item xs={12} sm={12} md={12} lg={9} xl={9}>
                        <Box className='ticker-period-selector-top' pl={2} pr={2} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between' gap='10px'>
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
                            <Box className='tooltip-prediction-box'>
                                <Box className='tooltip-prediction-box-controls'>
                                    <FormControlLabel
                                        value="start"
                                        sx={{ marginLeft: '0px', marginRight: '0px' }}
                                        control={<Switch size="small" color="secondary" />}
                                        label={toolTipSwitchFlag ? 'Hide Tooltips' : 'Show Tooltips'}
                                        labelPlacement="start"
                                        checked={toolTipSwitchFlag}
                                        onChange={() => dispatch(toggleToolTipSwitch())}
                                    />
                                    {predictedVlauesRedux.length !== 0 &&
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
                                                    options={Array.from({ length: modelParams.lookAhead }, (_, i) => `+${i + 1}`)}
                                                    value={`+${predictionLookAhead}`} // Set the selected value
                                                    onChange={(event, newValue) => handleMainChartPredictionLookaAhead(newValue)} // Handle value change
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
                                <Typography variant='custom' sx={{ textAlign: 'justify' }}>AF:{actualFetchLength}, R:{ohlcData.length} / {Math.round(ohlcData.length / 500)}</Typography>
                            </Box>
                        </Box>
                        <Box className='chart-container' display='flex' flexDirection='column' width='100%' pl={2} pr={2} pt={2}>
                            {chartData.length === 0 ?
                                (
                                    <Box className='token-chart-box' alignItems='center' justifyContent='center' display='flex'>
                                        <Skeleton variant="rounded" sx={{ bgcolor: '#3f3f40' }} width="95%" height="95%" />
                                    </Box>
                                )
                                :
                                (
                                    <MainChart
                                        latestTime={chartData[chartData.length - 1].time * 1000 + 60000}
                                        new_fetch_offset={newTickerLength}
                                        symbol={cryptotoken}
                                        selectedTokenPeriod={selectedTokenPeriod}
                                        module={module}
                                        fetchValues={fetchValues}
                                    />
                                )
                            }
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={12} md={12} lg={3} xl={3}>
                        {/* PlaceHolder */}
                    </Grid>
                </Grid>

                <Box mb={2} mt={2} className='selected-functions-box'>
                    <Grid container pt={2} pb={2}>
                        <Grid item xs={12} sm={12} md={12} lg={3} xl={3} pl={2} pr={2}>
                            <Box className='search-indicator-box' display='flex' flexDirection='row' alignItems='center' >
                                <Box className='function-selector' width='350px'>
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
                            {selectedFunctions.length !== 0 &&
                                <Box display='flex' flexDirection='column' alignItems='start' pt={1} pb={2}>
                                    {selectedFunctions.map((funcRedux, index) => {
                                        const { hint, functions } = funcRedux;
                                        return (
                                            <Box key={index}>
                                                {functions.map((func, funcIndex) => {
                                                    const { outputAvailable } = func;
                                                    return (
                                                        <Box key={funcIndex} display='flex' flexDirection='row' gap='4px' alignItems='center'>
                                                            <Dot color={outputAvailable ? 'green' : 'red'} />
                                                            <Typography className='selected-function-hint' variant='custom' sx={{ textAlign: 'start' }}>{hint}</Typography>
                                                        </Box>
                                                    );
                                                })}
                                            </Box>
                                        );
                                    })}
                                </Box>
                            }
                        </Grid>

                        <Grid item xs={12} sm={12} md={12} lg={9} xl={9} pl={2} pr={2}>
                            {selectedFunctions.length === 0 ?
                                (
                                    <Box display='flex' flexDirection='row' justifyContent='flex-start'>
                                        <Typography variant='h5' pl={1} pt={1} pb={1} sx={{ textAlign: 'start' }}>Select an indicator to plot</Typography>
                                    </Box>
                                )
                                :
                                (
                                    <React.Fragment>
                                        <Box pl={1}>
                                            <Typography variant='h5' sx={{ textAlign: 'start' }}>Selected Indicators</Typography>
                                        </Box>
                                    </React.Fragment>
                                )
                            }
                            {selectedFunctions.length !== 0 &&
                                <Grid container className='indicator-data-container'>
                                    {selectedFunctions.map((funcRedux, index) => {
                                        const { name } = funcRedux
                                        return (
                                            <Grid key={`${name}${index}`} item xs={12} sm={6} md={4} lg={4} xl={3}>
                                                <SelectedFunctionContainer key={index} funcRedux={funcRedux} fetchValues={fetchValues} />
                                            </Grid>
                                        )
                                    })}
                                </Grid>
                            }
                        </Grid>
                    </Grid>
                </Box>

                <Box className='model-training-container'>
                    <Box alignItems='start' display='flex' pl={2} pt={2} pb={1} className='trainmodel-title'>
                        <Typography variant='h4'>Model Training</Typography>
                    </Box>
                    <Grid container className='tensor-flow-grid'>
                        <Grid item xs={12} sm={12} md={4} lg={3} xl={3} p={2} >
                            <Paper elevtion={4} className='model-parameter-expandd-collapse-box' sx={{ display: "flex", flexDirection: "row", justifyContent: 'space-between', alignItems: 'center', padding: '4px', boxShadow: `${trainingParametersAccordianCollapse && 'none'}` }}>
                                <Typography variant='h5'>Edit training parameters</Typography>
                                <IconButton sx={{ padding: '6px' }} onClick={handleParametersAccordianCollapse.bind(null, {})}>
                                    {trainingParametersAccordianCollapse ? <ArrowDropUpIcon className='small-icon' /> : <ArrowDropDownIcon className='small-icon' />}
                                </IconButton>
                            </Paper>

                            <Collapse in={trainingParametersAccordianCollapse}>
                                <Box className='model-parameters-grid' pt={1}>
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
                                                <ResetTrainedModelModal
                                                    handleClearModelData={handleClearModelData}
                                                    disabled={trainingStartedFlag}
                                                    model_present={model_data.model_id === '' ? false : true} />
                                            </Box>
                                        </Box>
                                        {noFuncSelected !== '' && <Typography variant='custom' textAlign='start' sx={{ color: 'red' }}>{noFuncSelected}</Typography>}
                                    </Box>

                                    <Box className='selected-function-value-displaybox' display='flex' flexDirection='column' alignItems='start' gap='8px'>
                                        <Box display='flex' flexDirection='column' gap='8px' width='100%'>
                                            <Paper elevation={4} sx={{ padding: '4px' }}>
                                                <FormControlLabel
                                                    value="start"
                                                    sx={{ marginLeft: '0px', marginRight: '0px', width: '100%', justifyContent: 'space-between' }}
                                                    control={<Switch disabled={trainingStartedFlag} size="small" color="secondary" />}
                                                    label='Do validation on test set'
                                                    labelPlacement="start"
                                                    checked={modelParams.doValidation}
                                                    onChange={() => handleDoValidation()}
                                                />
                                            </Paper>

                                            <Paper elevation={4} sx={{ padding: '4px' }}>
                                                <FormControlLabel
                                                    value="start"
                                                    sx={{ marginLeft: '0px', marginRight: '0px', width: '100%', justifyContent: 'space-between' }}
                                                    control={<Switch disabled={trainingStartedFlag} size="small" color="secondary" />}
                                                    label='Perform Early Stopping'
                                                    labelPlacement="start"
                                                    checked={modelParams.earlyStopping}
                                                    onChange={() => handleEarlyStopping()}
                                                />
                                            </Paper>
                                            {/* <MultiSelect
                                                inputLabel={'Model type'}
                                                inputOptions={MODEL_OPTIONS}
                                                selectedInputOptions={modelParams.modelType}
                                                handleInputOptions={handleModelTypeOptions}
                                                fieldName={'Model type'}
                                                toolTipTitle={'Select a model type'}
                                                trainingStartedFlag={trainingStartedFlag}
                                            /> */}
                                            {modelParams.modelType !== 'Single Step Multiple Output' &&
                                                <MultiSelect
                                                    inputLabel={'Prediction flag'}
                                                    inputOptions={INPUT_OPTIONS}
                                                    selectedInputOptions={modelParams.multiSelectValue}
                                                    handleInputOptions={handleMultiselectOptions}
                                                    fieldName={'To predict'}
                                                    toolTipTitle={'Select one of the flags to be used to predict'}
                                                    trainingStartedFlag={trainingStartedFlag}
                                                />
                                            }
                                            <CustomSlider sliderValue={modelParams.trainingDatasetSize} name={'trainingDatasetSize'} handleModelParamChange={handleModelParamChange} label={'Training size'} min={50} max={95} sliderMin={0} sliderMax={100} disabled={trainingStartedFlag} />
                                            <CustomSlider sliderValue={modelParams.timeStep} name={'timeStep'} handleModelParamChange={handleModelParamChange} label={'Step Size'} min={2} max={100} sliderMin={2} sliderMax={100} disabled={trainingStartedFlag} />
                                            {(modelParams.modelType === 'Multi Step Single Output' || modelParams.modelType === 'Multi Step Multiple Output') &&
                                                <CustomSlider sliderValue={modelParams.lookAhead} name={'lookAhead'} handleModelParamChange={handleModelParamChange} label={'Look Ahead'} min={1} max={30} sliderMin={1} sliderMax={30} disabled={trainingStartedFlag} />
                                            }
                                            <CustomSlider sliderValue={modelParams.epoch} name={'epoch'} handleModelParamChange={handleModelParamChange} label={'Epochs'} min={1} max={500} sliderMin={1} sliderMax={500} disabled={trainingStartedFlag} />
                                            {modelParams.modelType !== 'Multi Step Single Output' &&
                                                <CustomSlider sliderValue={modelParams.hiddenLayer} name={'hiddenLayer'} handleModelParamChange={handleModelParamChange} label={'Hidden Layers'} min={1} max={20} sliderMin={1} sliderMax={10} disabled={trainingStartedFlag} />
                                            }
                                            <CustomSlider sliderValue={modelParams.batchSize} name={'batchSize'} handleModelParamChange={handleModelParamChange} label={'Batch Size'} min={1} max={100} sliderMin={1} sliderMax={100} disabled={trainingStartedFlag} />
                                            <CustomSlider sliderValue={modelParams.learningRate} name={'learningRate'} handleModelParamChange={handleModelParamChange} label={'L Rate'} min={1} max={100} sliderMin={1} sliderMax={100} scaledLearningRate={modelParams.scaledLearningRate} disabled={trainingStartedFlag} />
                                        </Box>
                                        <ReorderList orderList={transformationOrder} setOrderList={setTransformationOrder} disabled={trainingStartedFlag}/>
                                    </Box>
                                </Box>
                            </Collapse>
                        </Grid>

                        <Grid item xs={12} sm={12} md={8} lg={6} xl={6} p={2} className='predictions-chart-grid'>
                            <Box display='flex' flexDirection='column' pb={1}>
                                <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='flex-start' className='prediction-chart-header'>
                                    <Box display='flex' flexDirection='column' alignItems='start'>
                                        <Typography variant={predictedVlauesRedux.length !== 0 ? 'h6' : 'h5'} textAlign='start'>Predictions - {predictedVlauesRedux.length !== 0 && predictionChartType === 'scaled' ? 'original' : predictionChartType}</Typography>
                                    </Box>
                                    {predictedVlauesRedux.length !== 0 &&
                                        <Box className='chart-action-box'>
                                            <Box display='flex' flexDirection='row' gap={'4px'} alignItems='center' className='model-chart-action-container'>
                                                <TextField
                                                    size='small'
                                                    inputProps={{ style: { height: '10px', width:'150px' } }}
                                                    id="outlined-controlled"
                                                    label="Model name"
                                                    value={modelName}
                                                    onChange={(event) => {
                                                        setModelName(event.target.value);
                                                    }}
                                                />
                                                <Box className='model-chart-action-box'>
                                                    <SaveCurrentModal handleSaveModel={handleSaveModel} />

                                                    {!model_data.model_saved_to_db &&
                                                        <DeleteCurrentModal handleDeleteModel={handleDeleteModel} />
                                                    }

                                                    {modelParams.modelType !== 'Single Step Multiple Output' &&
                                                        <React.Fragment>
                                                            <Tooltip title={'Standardized values'} placement='top' sx={{ cursor: 'pointer', padding: '6px' }}>
                                                                <span>
                                                                    <IconButton sx={{ padding: '6px' }} disabled={predictionChartType === "standardized" ? true : false} onClick={handlePredictionsChartType.bind(null, { type: 'standardized' })}>
                                                                        <CloseFullscreenIcon className='small-icon' />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                            <Tooltip title={'Original values'} placement='top' sx={{ cursor: 'pointer', padding: '6px' }}>
                                                                <span>
                                                                    <IconButton sx={{ padding: '6px' }} disabled={predictionChartType === "scaled" ? true : false} onClick={handlePredictionsChartType.bind(null, { type: 'scaled' })}>
                                                                        <OpenInFullIcon className='small-icon' />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                        </React.Fragment>
                                                    }
                                                </Box>
                                            </Box>

                                            <Box display='flex' flexDirection='row' gap='17px' paddingRight='6px' paddingLeft='6px'>
                                                {colorCombinations.map((palette, index) => (
                                                    <Box key={index} sx={{
                                                        width: "10px",
                                                        height: "10px",
                                                        borderRadius: "50%",
                                                        backgroundColor: `${palette.actual}`,
                                                        cursor: 'pointer',
                                                        border: `${paletteIdRedux === index ? '1px solid #fff' : 'none'}`,
                                                    }}
                                                        onClick={handlePredictionChartPalette.bind(null, { id: index })}
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    }
                                </Box>
                            </Box>

                            <PredictionsChart
                                predictionChartType={predictionChartType}
                                trainingStartedFlag={startWebSocket}
                                model_type={MODEL_OPTIONS_VALUE[modelParams.modelType]}
                                lookAhead={model_parameters.lookAhead}
                                predictionLookAhead={predictionLookAhead}
                                setModelMetrics={setModelMetrics}
                                predictionsPalette={predictionChartPalette}
                            />

                            <Box className='main-training-status-box' pt={1} gap={'12px'} display='flex' flexDirection='column'>
                                <Typography sx={{ textAlign: 'start' }} variant='custom'>{modelProcessDurationRef.current !== '' ? `Time taken : ${modelProcessDurationRef.current}` : ''}</Typography>

                                {/* Prediction set metrics */}
                                {(predictedVlauesRedux.length !== 0) &&
                                    <Paper elevation={4} sx={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 4px' }}>
                                        {(predictionLookAhead && modelParams.lookAhead > 1) &&
                                            <Box className='prediction-lookahead-slider-box'>
                                                <CustomSlider
                                                    sliderValue={predictionLookAhead}
                                                    name={'prediction_look_ahead'}
                                                    handleModelParamChange={handelPredictionLookAheadSlider}
                                                    label={'Prediction Look Ahead'}
                                                    min={1}
                                                    max={model_parameters.lookAhead}
                                                    sliderMin={1}
                                                    sliderMax={model_parameters.lookAhead}
                                                    disabled={trainingStartedFlag} />
                                            </Box>
                                        }
                                        <Box display='flex' flexDirection='column' gap='5px'>
                                            {Object.keys(modelMetrics.metrics).length > 0 && (
                                                <Box display='flex' flexDirection='column' gap='4px' className='model-metrics-calculated-box'>
                                                    <Paper elevation={4} style={{ justifyContent: 'space-between', display: 'flex', flexDirection: 'row', gap: '4px', padding: '0px 10px', width: 'fit-content' }}>
                                                        <Typography variant='custom' textAlign='start'>{predictionChartType}</Typography>
                                                    </Paper>
                                                    <Box className='model-metrics-calculated-box-paper'>

                                                        <Box display='flex' flexDirection='row' justifyContent='space-between' width='100%' gap='5px'>
                                                            <Box display='flex' flexDirection='row' gap='16px' width='95%' justifyContent='space-between' className='model-metrics'>
                                                                <Paper className='metricpaper-indi' elevation={2}>
                                                                    <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>TP</span> : {modelMetrics.metrics.TP}</Typography>
                                                                    <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>FP</span> : {modelMetrics.metrics.FP}</Typography>
                                                                    <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>FN</span> : {modelMetrics.metrics.FN}</Typography>
                                                                    <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>TN</span> : {modelMetrics.metrics.TN}</Typography>
                                                                </Paper>
                                                            </Box>
                                                            <NoMaxWidthTooltip
                                                                arrow
                                                                className='metrics-tooltip'
                                                                title=
                                                                {(
                                                                    <Box>
                                                                        <ClassificationTable title={"Classification Criteria"} data={CRITERIA_DATA} />
                                                                    </Box>
                                                                )}
                                                                placement='top' sx={{ cursor: 'pointer' }}>
                                                                <InfoOutlinedIcon className='small-icon' />
                                                            </NoMaxWidthTooltip>
                                                        </Box>

                                                        <Box display='flex' flexDirection='row' justifyContent='space-between' width='100%' gap='5px'>
                                                            <Box display='flex' flexDirection='row' gap='16px' width='95%' alignItems='center' justifyContent='space-between' className='model-metrics'>
                                                                <Paper className='metricpaper-indi' elevation={2}>
                                                                    <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>Accuracy</span> : {modelMetrics.metrics.accuracy}</Typography>
                                                                    <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>Precision</span> : {modelMetrics.metrics.precision}</Typography>
                                                                    <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>F1</span> : {modelMetrics.metrics.f1}</Typography>
                                                                    <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>Recall</span> : {modelMetrics.metrics.recall}</Typography>
                                                                </Paper>
                                                            </Box>
                                                            <NoMaxWidthTooltip
                                                                arrow
                                                                className='metrics-tooltip'
                                                                title=
                                                                {(
                                                                    <Box>
                                                                        <ClassificationTable title={"Metrics"} data={[
                                                                            { "Condition": "Accuracy", "Criteria": "(TP + TN) / (TP + FP + TN + FN)" },
                                                                            { "Condition": "Precision", "Criteria": "TP / (TP + FP)" },
                                                                            { "Condition": "F1", "Criteria": "TP / (TP + FN)" },
                                                                            { "Condition": "Recall", "Criteria": "(2 * prec * recall) / (prec + recall)" }]} />
                                                                    </Box>
                                                                )}
                                                                placement='top' sx={{ cursor: 'pointer' }}>
                                                                <InfoOutlinedIcon className='small-icon' />
                                                            </NoMaxWidthTooltip>
                                                        </Box>

                                                        {(Object.keys(modelMetrics.mse).length > 0) &&
                                                            <Box display='flex' flexDirection='row' justifyContent='space-between' width='100%' gap='5px'>
                                                                <Box display='flex' flexDirection='row' gap='16px' width='95%' alignItems='center' justifyContent='space-between' className='model-metrics'>
                                                                    <Paper className='metricpaper-indi-two' elevation={2}>
                                                                        <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>RMSE</span> : {predictionChartType === 'scaled' ? modelMetrics.mse.rmse.toFixed(2) : modelMetrics.mse.rmse}</Typography>
                                                                        <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>MSE</span> : {predictionChartType === 'scaled' ? modelMetrics.mse.mse.toFixed(2) : modelMetrics.mse.mse}</Typography>
                                                                    </Paper>
                                                                </Box>
                                                                <Tooltip title='Prediction chart RMSE and MSE'>
                                                                    <InfoOutlinedIcon className='small-icon' />
                                                                </Tooltip>
                                                            </Box>
                                                        }
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    </Paper>
                                }

                                {/* epoch end results plotting on chart */}
                                {model_parameters.epoch > 2 &&
                                    <ModelHistoryChart
                                        epochResults={epochResults}
                                        predictionsPalette={predictionChartPalette}
                                        isValidatingOnTestSet={model_parameters.doValidation}
                                        totalEpochs={modelParams.epoch}
                                    />
                                }

                                {/* epoch results in table */}
                                {epochResults.length > 0 &&
                                    <Accordion defaultExpanded={false} sx={{ overflowX: 'auto', backgroundColor: `${theme.palette.background.paperOne}`, borderRadius: '5px' }}>
                                        <AccordionSummary
                                            expandIcon={<ExpandMoreIcon />}
                                            aria-controls="panel1bh-content"
                                            id="panel1bh-header"
                                        >
                                            <Typography sx={{ color: 'text.secondary', width: '33%', flexShrink: 0, textAlign: 'start' }}>
                                                Training Loss
                                            </Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <ModelHistoryTable data={epochResults} />
                                        </AccordionDetails>
                                    </Accordion>
                                }

                                {/* Prediction set RMSE results */}
                                {model_data.score.over_all_score !== 0 &&
                                    <Paper elevation={4} sx={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 4px' }}>
                                        <Box width='100%' className='test-set-prediction-result' display='flex' flexDirection='column' gap='5px'>
                                            <table width='100%' className="table-main" style={{ fontWeight: '600', fontSize: '11px' }}>
                                                <thead className='table-group'>
                                                    <tr className='table-row'>
                                                        <th className='table-head'>Type</th>
                                                        <th className='table-head'>MSE</th>
                                                        <th className='table-head'>RMSE</th>
                                                    </tr>
                                                </thead>
                                                <tbody className='table-body'>
                                                    <tr className='table-row'>
                                                        <td className='table-data' style={{ textAlign: 'start' }}>
                                                            <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
                                                                Test Set
                                                                {!sm &&
                                                                    <NoMaxWidthTooltip
                                                                        title={(
                                                                            <PredictionMSETable data={model_data.score.scores.map((item, index) => {
                                                                                const { value, unit } = generateMSESteps(selectedTickerPeriod);
                                                                                return (
                                                                                    {
                                                                                        date: `+${value * (index + 1)}${unit}`,
                                                                                        rmse: item
                                                                                    }
                                                                                )
                                                                            })} />
                                                                        )}
                                                                        placement='right'
                                                                        arrow
                                                                    >
                                                                        <AspectRatioIcon sx={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                                                    </NoMaxWidthTooltip>
                                                                }
                                                            </Box>
                                                        </td>
                                                        <td className='table-data'>{model_data.score.over_all_score * model_data.score.over_all_score}</td>
                                                        <td className='table-data'>{model_data.score.over_all_score}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            {sm &&
                                                <PredictionMSETable data={model_data.score.scores.map((item, index) => {
                                                    const { value, unit } = generateMSESteps(selectedTickerPeriod);
                                                    return (
                                                        {
                                                            date: `+${value * (index + 1)}${unit}`,
                                                            rmse: item
                                                        }
                                                    )
                                                })} />
                                            }
                                        </Box>
                                    </Paper>
                                }

                                {/* epoch batch results */}
                                {batchResult && (
                                    <Box className='batch-end-progress-box' pt={1}>
                                        <Box id='progress-line' sx={{ width: '100%' }}>
                                            <LinearProgressWithLabel value={0} type={'Batch'} cRef={batchLinearProgressRef} />
                                        </Box>
                                        <Box className={`epoch_{} epoch`} sx={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                                            <Box className={`model-progress_{}`} width='100%' variant='h6'>
                                                <div className='batch-end'>
                                                    <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                                                        <div style={{ fontSize: '0.7rem', fontWeight: '500', textAlign: 'start' }} id='epoch'></div>
                                                        <div className='batch-end-text' id='loss'>Loss : 0.04927649209355232</div>
                                                        <div className='batch-end-text' id='mse'>MSE : 0.04927649209355232</div>
                                                        <div className='batch-end-text' id='mae'>RMSE : 0.04927649209355232</div>
                                                    </div>
                                                </div>
                                            </Box>
                                        </Box>
                                    </Box>
                                )
                                }

                                {/* Test set evaluating result */}
                                {evaluating && (
                                    <Box className='evaluating-set-progress-box' pt={1}>
                                        <Box id='progress-line' sx={{ width: '100%' }}>
                                            <LinearProgressWithLabel value={0} type={'Evaluating'} cRef={evalLinearProgressRef} />
                                        </Box>
                                    </Box>
                                )
                                }

                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={12} md={12} lg={3} xl={3} p={2}>
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
                                            const { model_name, model_id } = model
                                            return (
                                                <Paper key={index} elevation={4}>
                                                    <Box display='flex' alignItems='center' justifyContent='space-between' pl={'5px'} pr={'5px'}>
                                                        <Typography className='saved-model-name'>{model_name}</Typography>
                                                        <Box display='flex'>
                                                            <Tooltip title={'View Model Data'} placement='top' sx={{ cursor: 'pointer', padding: '6px' }}>
                                                                <span>
                                                                    <IconButton onClick={handleExpandSelectedModel.bind(null, { model_id: model_id })} sx={{ padding: '6px' }} disabled={predictionChartType === "scaled" ? true : false} >
                                                                        <AspectRatioIcon className='small-icon' />
                                                                    </IconButton>
                                                                </span>
                                                            </Tooltip>
                                                            <Tooltip
                                                                placement='top'
                                                                sx={{ cursor: 'pointer', padding: '6px' }}
                                                                title={
                                                                    (
                                                                        <Box
                                                                            display='flex' flexDirection='row' gap='5px'
                                                                        >
                                                                            <Button color='error' variant='contained' size='small' onClick={handleModelDeletFromSaved.bind(null, { model_id: model_id })}>Yes</Button>
                                                                            <Button color='warning' variant='contained' size='small' onClick={() => console.log('No')}>No</Button>
                                                                        </Box>
                                                                    )
                                                                }
                                                            >
                                                                <span>
                                                                    <IconButton sx={{ padding: '6px' }} disabled={predictionChartType === "scaled" ? true : false} >
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