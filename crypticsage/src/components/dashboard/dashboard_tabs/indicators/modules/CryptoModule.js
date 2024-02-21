import React, { useState, useEffect, useRef } from 'react'
import Header from '../../../global/Header';
import useWebSocket from './WebSocket';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Indicators } from '../components/IndicatorDescription';
import { useSelector } from 'react-redux'
import { Success, Info, Warning } from '../../../global/CustomToasts'
import { ResetOnModelChange } from '../components/crypto_components/modals';
import {
    Box
    , Typography
    , Grid
    , Skeleton
    , useTheme
    , useMediaQuery
    , Paper
} from '@mui/material'

import {
    getHistoricalTickerDataFroDb,
    fetchLatestTickerForUser,
    startModelTraining,
    getUserModels,
    saveModel,
    deleteModel
} from '../../../../../api/adminController'

import {
    setUserModels,
    setModelSavedToDb,
    setModelId,
    setModelType,
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
    setSelectedFunctions,
    setSelectedFlagInTalibDescription
} from './CryptoModuleSlice'

import {
    formatMillisecond,
    generateRandomModelName,
    checkForUniqueAndTransform,
    checkIfNewTickerFetchIsRequired
} from './CryptoModuleUtils'


import {
    MainChart,
    SelectedFunctionContainer,
    PredictionsChart,
    ModelHistoryChart,
    SavedModels,
    PredictionMetrics,
    PredictionScoresTable,
    TrainingLossTable,
    BatchProgress,
    EvaluationProgress,
    PredictionOptions,
    TrainingParameters,
    IndicatorSearch,
    MainChartOptions,
    CorelationMatrix,
    WGANGPProgress,
    WgangpMetricsChart,
    IntermediateForecastChart,
    WganFinalPredictionChart
} from '../components'

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

const MODEL_OPTIONS_VALUE = {
    "LSTM": "multi_input_single_output_step",
    "WGAN-GP": "GAN"
}

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
                    let tC_inDb = res.data.fetchedResults.total_count_db
                    console.log(tC_inDb)
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
                                dispatch(setCryptoDataInDbRedux({ dataInDb: dataInDb, total_count_db: tC_inDb }))
                            })
                            .catch(err => {
                                console.log(err)
                            })
                    } else {
                        converted = checkForUniqueAndTransform(dataInDb)
                        console.log('Up to date : Fetched data length : ', converted.length)
                        setChartData(converted)
                        dispatch(setCryptoDataInDbRedux({ dataInDb: dataInDb, total_count_db: tC_inDb }))
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
            // eslint-disable-next-line no-unused-vars
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
    const [modelParams, setModelParams] = useState({ ...model_parameters })
    const [modelName, setModelName] = useState(model_data.model_name)

    const [modelTypeOpen, setModelTypeOpen] = useState(false)
    const [modelType, setModelTypeState] = useState('')

    const handleModelParamChange = (name, value) => {
        if (name === 'modelType') {
            if (model_data.model_id !== '' && !model_data.model_saved_to_db) {
                setModelTypeState(value)
                setModelTypeOpen(true)
            } else if (model_data.model_id !== '' && model_data.model_saved_to_db) {
                setModelParams(() => ({ ...model_parameters }))
                dispatch(resetModelData())
                dispatch(setModelType(value))
            } else if (JSON.stringify(model_parameters) !== JSON.stringify(modelParams)) {
                let { modelType, ...rest } = model_parameters
                setModelParams(() => ({ modelType: value, ...rest }))
            } else {
                setModelTypeState('')
                setModelParams((prev) => {
                    return {
                        ...prev,
                        [name]: value
                    }
                })
            }
        } else {
            setModelParams((prev) => {
                return {
                    ...prev,
                    [name]: value
                }
            })
        }
    }


    const [transformationOrder, setTransformationOrder] = useState(model_parameters.transformation_order)
    const [w_gan_error, setw_gan_error] = useState({})
    // console.log('Changed order list: ', transformationOrder.findIndex(elem=> elem.value === 'close'))
    // console.log(transformationOrder)

    // setting converted learning rate
    useEffect(() => {
        const scaledValue = (value, max) => {
            const scl = (value) / (100 - 1) * max
            const trucned_no = scl.toString().match(/^-?\d+(?:\.\d{0,5})?/)[0]
            return parseFloat(trucned_no)
        }
        if (modelParams.modelType === 'WGAN-GP') {
            const max = 0.001
            const d_scaled = scaledValue(modelParams.d_learningRate, max)
            const g_scaled = scaledValue(modelParams.g_learningRate, max)
            setModelParams((prev) => {
                return {
                    ...prev,
                    'scaled_d_learningRate': d_scaled,
                    'scaled_g_learningRate': g_scaled
                }
            })
        } else {
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
        }
    }, [modelParams.learningRate, modelParams.modelType, modelParams.d_learningRate, modelParams.g_learningRate])

    // Execute query to start model training
    const [noFuncSelected, setNoFuncSelected] = useState('')
    const handleStartModelTraining = () => {
        if (selectedFunctions.length === 0) {
            console.log('Select an indicator to plot')
            setNoFuncSelected('Select a function first to model')
        } else if (modelParams.to_train_count === '' || modelParams.to_train_count === 0) {
            setNoFuncSelected('Please select the number of data points to train')
        } else {
            console.log('Sending model training query...', modelParams)
            setTrainingStartedFlag(true)

            setw_gan_error({})

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

            if (modelParams.modelType === 'WGAN-GP') {
                delete model_training_parameters['learning_rate']
                delete model_training_parameters['hidden_layers']
                model_training_parameters['n_critic'] = modelParams.discriminator_iteration
                model_training_parameters['slice_index'] = modelParams.to_train_count
                model_training_parameters['d_learning_rate'] = modelParams.scaled_d_learningRate
                model_training_parameters['g_learning_rate'] = modelParams.scaled_g_learningRate
                model_training_parameters['intermediate_result_step'] = parseInt(modelParams.intermediateResultStep)
                model_training_parameters['model_save_checkpoint'] = parseInt(modelParams.modelSaveStep)
            }

            console.log('Execute query + Model parameters', fTalibExecuteQuery, model_training_parameters)
            dispatch(setModelStartTime(new Date().getTime()))
            dispatch(resetModelData())
            dispatch(setStartWebSocket(true))
            startModelTraining({
                token,
                payload: {
                    fTalibExecuteQuery,
                    model_training_parameters
                }
            }).then((res) => {

                dispatch(setModelEndTime(''))
                const modelId = res.data.job_id
                const model_name = generateRandomModelName(cryptotoken, selectedTokenPeriod)
                Success(res.data.message)
                setModelName(model_name)
                dispatch(setModelId({ model_id: modelId, model_name: model_name }))
                dispatch(setTrainingParameters({ model_params: modelParams, selected_functions: fTalibExecuteQuery, transformationOrder: transformationOrder }))
            }).catch((err) => {
                // console.log(err)
                console.log(err.response.data.message)
                setw_gan_error(err.response.data)
                const error_comp = (test_possible, train_possible) => {
                    return (
                        <Box>
                            <Typography variant='custom'>{err.response.data.message}</Typography>
                            <ul className='wgan_ul'>
                                {!test_possible.status && <li style={{ listStyleType: 'circle' }}>{`\u2043`}{test_possible.message}</li>}
                                {!train_possible.status && <li style={{ listStyleType: 'circle' }}>{`\u2043`}{train_possible.message}</li>}
                            </ul>
                        </Box>

                    )
                }
                Warning(error_comp(err.response.data.test_possible, err.response.data.train_possible))
                setTrainingStartedFlag(false)
            })
        }
    }

    // resetting the model training error prompt
    useEffect(() => {
        if (selectedFunctions.length > 0 && noFuncSelected !== '' && (modelParams.to_train_count !== '' || modelParams.to_train_count !== 0)) {
            setNoFuncSelected('')
        }
    }, [selectedFunctions, noFuncSelected, modelParams.to_train_count])

    // resetting entire training params and model data
    const handleClearModelData = () => {
        console.log(model_data.model_id, model_data.model_saved_to_db, modelParams.modelType)
        if (model_data.model_id !== '' && !model_data.model_saved_to_db) { // check if saved and then delete
            console.log('Model present and not saved, resetting Redux model and deleting from BE')
            deleteModel({ token, payload: { model_id: model_data.model_id, model_type: modelParams.modelType } })
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
        dispatch(setModelType(model_parameters.modelType))
        setModelTypeOpen(false)
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
            scores: model_data.score,
            model_id: model_data.model_id,
            model_name: modelName,
            ticker_name: selectedTickerName,
            ticker_period: selectedTickerPeriod,
            epoch_results: model_data.epoch_results,
            train_duration: model_data.modelEndTime - model_data.modelStartTime,
            correlation_data: model_data.correlation_data,
            predicted_result: model_data.predictedValues,
            training_parameters: model_data.training_parameters,
            talibExecuteQueries: model_data.talibExecuteQueries,
        }
        // console.log(saveModelPayload)

        saveModel({ token, payload: saveModelPayload })
            .then((res) => {
                // eslint-disable-next-line no-unused-vars
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
        deleteModel({ token, payload: { model_id, model_type: modelParams.modelType } })
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
    const wgangpProgressRef = useRef(null)
    const { webSocket, createModelProgressWebSocket } = useWebSocket(
        webSocketURL,
        userSelectedEpoch,
        notifyMessageBoxRef,
        batchResult,
        evaluating,
        batchLinearProgressRef,
        evalLinearProgressRef,
        wgangpProgressRef,
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

    const [modelMetrics, setModelMetrics] = useState({ metrics: {}, mse: {} })

    const paletteIdRedux = useSelector(state => state.cryptoModule.modelData.predictionPaletteId)
    const [predictionChartPalette, setPredictionChartPalette] = useState(colorCombinations[paletteIdRedux])
    const handlePredictionChartPalette = ({ id }) => {
        // console.log(id)
        dispatch(setPredictionPaletteId(id))
        setPredictionChartPalette(colorCombinations[id])
        // console.log(colorCombinations[id])
    }

    const intermediate_forecasts = useSelector(state => state.cryptoModule.modelData.wgan_intermediate_forecast)
    const wgan_final_forecast = useSelector(state => state.cryptoModule.modelData.wgan_final_forecast.predictions)

    return (
        <Box className='crypto-module-container'>
            <Box width='-webkit-fill-available'>
                <Header title={cryptotoken} />
            </Box>
            <ResetOnModelChange
                open={modelTypeOpen}
                setOpen={setModelTypeOpen}
                handleRemove={handleClearModelData}
            />

            <Box mr={2} mb={2} ml={2} className='crypto-module-container-box'>

                <Grid container className='indicator-chart-grid' pt={2} pb={2}>
                    <Grid item xs={12} sm={12} md={12} lg={9} xl={9}>
                        <MainChartOptions
                            selectedTokenPeriod={selectedTokenPeriod}
                            handlePeriodChange={handlePeriodChange}
                            toolTipSwitchFlag={toolTipSwitchFlag}
                            predictedVlauesRedux={predictedVlauesRedux}
                            showPredictionSwitchFlag={showPredictionSwitchFlag}
                            modelParams={modelParams}
                            predictionLookAhead={predictionLookAhead}
                            handleMainChartPredictionLookaAhead={handleMainChartPredictionLookaAhead}
                            actualFetchLength={actualFetchLength}
                            ohlcDataLength={ohlcData.length}
                        />
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
                            <IndicatorSearch
                                searchedFunctions={searchedFunctions}
                                selectedFunctions={selectedFunctions}
                                transformedFunctionsList={transformedFunctionsList}
                                handleSearchedFunctions={handleSearchedFunctions}
                                handleAddSelectedFunction={handleAddSelectedFunction}
                            />
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

                <Box mb={2} mt={2} className='model-training-container'>
                    <Box alignItems='start' display='flex' pl={2} pt={2} pb={1} className='trainmodel-title'>
                        <Typography variant='h4'>Model Training</Typography>
                    </Box>
                    {/* training parameters */}
                    <Grid container className='tensor-flow-grid'>
                        <Grid item xs={12} sm={12} md={12} lg={12} xl={12} p={2} >
                            <TrainingParameters
                                model_data={model_data}
                                modelParams={modelParams}
                                transformationOrder={transformationOrder}
                                trainingParametersAccordianCollapse={trainingParametersAccordianCollapse}
                                noFuncSelected={noFuncSelected}
                                trainingStartedFlag={trainingStartedFlag}
                                setTransformationOrder={setTransformationOrder}
                                handleModelParamChange={handleModelParamChange}
                                handleStartModelTraining={handleStartModelTraining}
                                handleClearModelData={handleClearModelData}
                                handleParametersAccordianCollapse={handleParametersAccordianCollapse}
                            />
                            {Object.keys(w_gan_error).length > 0 &&
                                <Box display={'flex'} flexDirection={'column'} alignItems={'start'} pt={2} pl={1} color={'red'}>
                                    <Typography variant='h6' fontWeight='600'>{w_gan_error.message}</Typography>
                                    <ul className='wgan-gp-ul' style={{ textAlign: 'left' }}>
                                        {!w_gan_error.train_possible.status && <li style={{ listStyleType: 'circle', fontSize: '12px', fontWeight: '500' }}>{w_gan_error.train_possible.message}</li>}
                                        {!w_gan_error.test_possible.status && <li style={{ listStyleType: 'circle', fontSize: '12px', fontWeight: '500' }}>{w_gan_error.test_possible.message}</li>}
                                    </ul>
                                </Box>
                            }
                        </Grid>
                    </Grid>

                    {modelParams.modelType === 'LSTM' ?
                        <Grid container className='tensor-flow-grid' > {/* lstm model training results */}
                            <Grid item md={12} lg={6} xl={6} p={2} sx={{ width: '100%' }}>
                                <Box gap={'8px'} display='flex' flexDirection='column'>
                                    <Box display='flex' flexDirection='column' alignItems='start'>
                                        <Typography variant={predictedVlauesRedux.length !== 0 ? 'h6' : 'h5'} textAlign='start'>
                                            Predictions {predictedVlauesRedux.length !== 0 ? predictionChartType === 'scaled' ? '- original' : `- ${predictionChartType}` : ''}
                                        </Typography>
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

                                    <PredictionOptions
                                        modelName={modelName}
                                        model_data={model_data}
                                        modelParams={modelParams}
                                        predictedVlauesRedux={predictedVlauesRedux}
                                        predictionChartType={predictionChartType}
                                        colorCombinations={colorCombinations}
                                        paletteIdRedux={paletteIdRedux}
                                        setModelName={setModelName}
                                        handleSaveModel={handleSaveModel}
                                        handleDeleteModel={handleDeleteModel}
                                        handlePredictionsChartType={handlePredictionsChartType}
                                        handlePredictionChartPalette={handlePredictionChartPalette}
                                    />
                                </Box>
                            </Grid>

                            <Grid item md={12} lg={6} xl={6} p={2} sx={{ width: '100%' }}>
                                <Box className='main-training-status-box' gap={'8px'} display='flex' flexDirection='column'>
                                    <Typography sx={{ textAlign: 'start' }} variant='h6'>{modelProcessDurationRef.current !== '' ? `Time taken : ${modelProcessDurationRef.current}` : ''}</Typography>

                                    {/* epoch end results plotting on chart */}
                                    {model_parameters.epoch > 2 &&
                                        <ModelHistoryChart
                                            epochResults={epochResults}
                                            predictionsPalette={predictionChartPalette}
                                            isValidatingOnTestSet={model_parameters.doValidation}
                                            totalEpochs={modelParams.epoch}
                                        />
                                    }

                                    <CorelationMatrix
                                        transformation_order={model_parameters.transformation_order}
                                    />

                                    {/* Prediction set metrics */}
                                    {(predictedVlauesRedux.length !== 0) &&
                                        <PredictionMetrics
                                            predictionLookAhead={predictionLookAhead}
                                            model_parameters={model_parameters}
                                            modelParams={modelParams}
                                            modelMetrics={modelMetrics}
                                            predictionChartType={predictionChartType}
                                            trainingStartedFlag={trainingStartedFlag}
                                            handelPredictionLookAheadSlider={handelPredictionLookAheadSlider}
                                        />
                                    }

                                    {/* epoch results in table */}
                                    {epochResults.length > 0 &&
                                        <TrainingLossTable
                                            epochResults={epochResults}
                                        />
                                    }

                                    {/* Prediction set RMSE results/scores */}
                                    {model_data.score.over_all_score !== 0 &&
                                        <PredictionScoresTable
                                            sm={sm}
                                            score={model_data.score}
                                            selectedTickerPeriod={selectedTickerPeriod}
                                        />
                                    }

                                    {/* epoch batch results */}
                                    {batchResult && (
                                        <BatchProgress
                                            batchLinearProgressRef={batchLinearProgressRef}
                                        />
                                    )
                                    }

                                    {/* Test set evaluating result */}
                                    {evaluating && (
                                        <EvaluationProgress
                                            evalLinearProgressRef={evalLinearProgressRef}
                                        />
                                    )
                                    }
                                </Box>
                            </Grid>
                        </Grid>
                        :
                        <Box className='tensor-flow-grid' display='flex' flexDirection='column'> {/* wgan-gp model training results */}
                            {trainingStartedFlag ?
                                <Box display='flex' justifyContent='flex-start' p={2}>
                                    <Typography
                                        variant='custom'
                                        id='loader-message-text'
                                        style={{
                                            textAlign: 'center',
                                            whiteSpace: 'nowrap',
                                            textOverflow: 'ellipssis',
                                            overflow: 'hidden',
                                            maxWidth: '400px'
                                        }}
                                    >Training started
                                    </Typography>
                                </Box>
                                :
                                <Box display='flex' height='100%' alignItems='center' justifyContent='flex-start' p={2} >
                                    <Paper elevation={4} style={{ padding: '5px' }}>Start training to view predictions</Paper>
                                </Box>
                            }

                            <Grid container>
                                <Grid item sm={12} md={6} lg={4} xl={4} p={2} sx={{ width: '100%' }}>
                                    <Typography sx={{ textAlign: 'start' }} variant='h6'>{modelProcessDurationRef.current !== '' ? `Time taken : ${modelProcessDurationRef.current}` : ''}</Typography>

                                    {/* epoch batch results */}
                                    {batchResult && (
                                        <WGANGPProgress
                                            wgangpProgressRef={wgangpProgressRef}
                                        />
                                    )
                                    }
                                    <CorelationMatrix
                                        transformation_order={transformationOrder}
                                    />
                                </Grid>
                            </Grid>

                            <Grid container>
                                <Grid item md={12} lg={6} xl={modelParams.doValidation ? 4 : 6} p={2} sx={{ width: '100%' }}> {/* training losses d and g */}
                                    <Box gap={'8px'} display='flex' flexDirection='column'>
                                        <WgangpMetricsChart
                                            epochResults={epochResults}
                                            type={'losses'}
                                            predictionsPalette={predictionChartPalette}
                                            totalEpochs={modelParams.epoch}
                                        />
                                    </Box>
                                </Grid>

                                <Grid item md={12} lg={6} xl={modelParams.doValidation ? 4 : 6} p={2} sx={{ width: '100%' }}> {/* training metrics g */}
                                    <Box gap={'8px'} display='flex' flexDirection='column'>
                                        <WgangpMetricsChart
                                            epochResults={epochResults}
                                            type={'training_metrics'}
                                            predictionsPalette={predictionChartPalette}
                                            totalEpochs={modelParams.epoch}
                                        />
                                    </Box>
                                </Grid>

                                {modelParams.doValidation &&
                                    <Grid item md={12} lg={6} xl={4} p={2} sx={{ width: '100%' }}>
                                        <Box gap={'8px'} display='flex' flexDirection='column'>
                                            <WgangpMetricsChart
                                                epochResults={epochResults}
                                                type={'validation_metrics'}
                                                predictionsPalette={predictionChartPalette}
                                                totalEpochs={modelParams.epoch}
                                            />
                                        </Box>
                                    </Grid>
                                }
                            </Grid>

                            <Grid container>
                                <Grid item sm={12} md={6} lg={6} xl={4} p={2} sx={{ width: '100%' }}>
                                    {intermediate_forecasts.length > 0 &&
                                        <IntermediateForecastChart
                                            intermediate_forecasts={intermediate_forecasts}
                                            epochs={modelParams.epoch}
                                            forecast_step={modelParams.intermediateResultStep}
                                        />
                                    }
                                </Grid>

                                <Grid item sm={12} md={6} lg={6} xl={4} p={2} sx={{ width: '100%' }}>
                                    {wgan_final_forecast.length > 0 &&
                                        <WganFinalPredictionChart
                                            wgan_final_forecast={wgan_final_forecast}
                                        />
                                    }
                                </Grid>
                            </Grid>

                        </Box>
                    }
                </Box>

                <Box className='user-saved-models-container'>
                    <Grid container>
                        <Grid item xs={12} sm={12} md={12} lg={12} xl={12} p={2} sx={{ minHeight: '300px' }}>
                            <Box className='saved-models-title' display='flex' flexDirection='column' pb={2}>
                                <Box height='32px' display='flex' alignItems='center'>
                                    <Typography variant='h4' textAlign='start'>Saved Models</Typography>
                                </Box>
                            </Box>
                            {userModels.length === 0 ?
                                <Box display='flex' alignItems='start'>
                                    <Typography>No Saved Models</Typography>
                                </Box>
                                :
                                <SavedModels
                                    selected_ticker_period={selectedTickerPeriod}
                                    selected_ticker_name={selectedTickerName}
                                />
                            }
                        </Grid>
                    </Grid>
                </Box>

                <Indicators symbol={cryptotoken} fetchValues={fetchValues} />
            </Box >
        </Box >
    )
}

export default CryptoModule