import React, { useEffect, useState } from 'react'
import dayjs from "dayjs";
import { Dot } from '../../modules/CryptoModuleUtils';
import RMSEBarChart from './RMSEBarChart';
import InitialForecastLineChart from './InitialForecastLineChart';
import { DeleteSavedModel } from './modals';
import { Success, Error } from '../../../../global/CustomToasts'
import '../../modules/module.css'
import {
    Box,
    Typography,
    Paper,
    IconButton,
    Tooltip,
    Collapse,
    Button,
    useTheme,
    useMediaQuery,
    Skeleton,
    Grid,
    TextField,
} from '@mui/material'
import {
    useSelector,
    useDispatch
} from 'react-redux';
import {
    setNewForecastData,
    renameModel as renameModelInRedux,
    resetCurrentModelData,
    setUserModels
} from '../../modules/CryptoModuleSlice'
import {
    makeNewPrediction,
    renameModel,
    deleteModelForUser,
    getUserModels
} from '../../../../../../api/adminController'
import {
    NoMaxWidthTooltip,
    formatMillisecond,
    periodToMilliseconds
} from '../../modules/CryptoModuleUtils'
import {
    AspectRatioIcon,
    ArrowDropDownIcon,
    ArrowDropUpIcon,
    InfoOutlinedIcon,
    CheckIcon,
    CloseIcon
} from '../../../../global/Icons'


function calculateMSE(actual, predicted) {
    // Filter out null values from actual
    actual = actual.filter(value => value !== null && value !== 'null');

    // Slice predicted to match the length of actual
    predicted = predicted.slice(0, actual.length);

    if (actual.length !== predicted.length) {
        throw new Error("Arrays should be of equal length");
    }

    let sum = 0;
    for (let i = 0; i < actual.length; i++) {
        sum += Math.pow(predicted[i] - actual[i], 2);
    }

    let mse = sum / actual.length;
    let rmse = Math.sqrt(mse);
    // console.log(mse, rmse)
    return { mse, rmse };
}

const calculateOriginalPrice = ({ value, variance, mean }) => {
    if (value === null) return null;
    return parseFloat(((value * Math.sqrt(variance)) + mean).toFixed(2));
};

const TalibFuncSummary = ({ query }) => {
    const { payload } = query
    const { func_query, func_param_input_keys, func_param_optional_input_keys } = payload
    const { name } = func_query

    const [openIndicator, setOpenIndicator] = useState(''); // for opening and closing the indicator details
    return (
        <Grid item xs={12} sm={6} md={6} lg={6} xl={3}>
            <Paper elevation={4} className='single-indicator-saved'>
                <Box display='flex' flexDirection='row' alignItems='center' justifyContent={'space-between'}>
                    <Box display='flex' flexDirection='row' alignItems='center' gap={'6px'} pl={1}>
                        <Dot color='red' />
                        <Typography variant='body2'>{name}</Typography>
                    </Box>
                    <IconButton size='small' aria-label="update" className='small-icon' color="secondary" onClick={() => setOpenIndicator((prev) => { if (prev === name) { return '' } else { return name } })}>
                        {openIndicator === name ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                    </IconButton>
                </Box>
                <Collapse in={openIndicator === name}>
                    <Box display='flex' flexDirection='column' alignItems={'start'} pl={2}>
                        {Object.keys(func_param_input_keys).map((key, index) => (
                            <Typography key={index} variant='body2'>{key}</Typography>
                        ))}
                        {Object.keys(func_param_optional_input_keys).map((key, index) => {
                            const value = func_query[key];
                            return (
                                <Typography key={index} variant='body2'>
                                    {key} : {value !== undefined ? value : 'Not available'}
                                </Typography>
                            );
                        })}
                    </Box>
                </Collapse>
            </Paper>
        </Grid>
    )
}

const defaultselectedSavedModelData = {
    model_created_date: null,
    ticker_name: null,
    model_name: null,
    ticker_period: null,
    model_data: {
        training_parameters: null,
        talibExecuteQueries: null,
        scores: null,
        epoch_results: null,
        train_duration: null,
    }
}

const transformLSTMPredictionData = (selectedModel, ohlcData) => {
    // console.log('From transform lstm func')
    let final = {}
    const { model_data: { predicted_result, training_parameters: { multiSelectValue, lookAhead } } } = selectedModel

    const forecast = predicted_result.forecast
    const initialForecast = predicted_result.initial_forecast // only for the dates

    const firstDate = new Date(initialForecast[0].open * 1000).getTime()
    const lastDate = new Date(initialForecast[initialForecast.length - 1].open * 1000).getTime()
    const toCompareActualValues = ohlcData.filter(ticker => ticker.openTime >= firstDate && ticker.openTime <= lastDate)

    const first_key = initialForecast.map((fCast, index) => {
        return {
            openTime: fCast.open * 1000,
            predicted: calculateOriginalPrice({ value: forecast[index], variance: predicted_result.label_variance, mean: predicted_result.label_mean }),
            actual: toCompareActualValues[index] !== undefined ? toCompareActualValues[index][multiSelectValue] : null
        }
    })

    final['0'] = first_key

    for (let i = 1; i < lookAhead; i++) {
        const last_prediction = predicted_result.predictions_array.slice(-i)
        const prediction_to_add = last_prediction.map((prediction) => { return prediction[i] })
        const forecast_sliced_from_start = forecast.slice(i)
        let finalForecast = [...prediction_to_add, ...forecast_sliced_from_start]

        let intermediate = []
        finalForecast.forEach((prediction, index) => {
            let tempKey = {
                openTime: initialForecast[index].open * 1000,
                predicted: calculateOriginalPrice({ value: prediction[0], variance: predicted_result.label_variance, mean: predicted_result.label_mean }),
                actual: toCompareActualValues[index] !== undefined ? toCompareActualValues[index][multiSelectValue] : null
            }
            intermediate.push(tempKey)
        })
        final[`${i}`] = intermediate
    }

    return final
}

const SavedModels = ({
    selected_ticker_period,
    selected_ticker_name,
}) => {
    const dispatch = useDispatch()
    const theme = useTheme();
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    const token = useSelector(state => state.auth.accessToken);
    const userId = useSelector(state => state.auth.uid)
    const user_models_redux = useSelector(state => state.cryptoModule.userModels).filter(model => model.model_type === 'LSTM')
    // const c_module = useSelector(state => state.cryptoModule.userModels)
    // console.log(c_module)

    const [open, setOpen] = useState(false);
    const [selectedSavedModelData, setSelectedSavedModelData] = useState(defaultselectedSavedModelData);

    const {
        model_created_date,
        ticker_name,
        model_name,
        ticker_period,
        model_data
    } = selectedSavedModelData || {};

    const {
        epoch_results,
        training_parameters,
        talibExecuteQueries,
        scores,
        train_duration,
    } = model_data;


    const [toShowModelId, setToShowModelId] = useState(null);
    const [modelStatusColor, setModelStatusColor] = useState('red')
    const [modelRMSE, setModelRMSE] = useState([])
    const [initialPredictionsDate, setInitialPredictionsDate] = useState(null)

    const ohlcData = useSelector(state => state.cryptoModule.cryptoDataInDb)


    const [allPredictions, setAllPredictions] = useState({})
    const [selectedPrediction, setSelectedPrediction] = useState([])
    const [selectedRMSEIndex, setSelectedRMSEIndex] = useState(0)

    const handleShowSavedModelDetails = ({ modelId, m_name }) => {
        if (modelId === toShowModelId) {
            setOpen(false);
            setToShowModelId(null);
        } else {
            setToShowModelId(modelId);
            setOpen(true);
            setSelectedRMSEIndex(0)
        }
    }

    useEffect(() => {
        if (toShowModelId !== null) {
            console.log('Loading selected saved model data...')
            const selectedModel = user_models_redux.find((model) => model.model_id === toShowModelId)
            if (selectedModel) {
                const modelAvailableInDb = selectedModel.model_data_available
                setModelStatusColor(modelAvailableInDb ? 'green' : 'red')

                const transformed_predictions = transformLSTMPredictionData(selectedModel, ohlcData)
                // console.log('final', transformed_predictions, selectedRMSEIndex)
                setAllPredictions(transformed_predictions)
                setSelectedPrediction(transformed_predictions[`${selectedRMSEIndex}`])

                setDefaultModelName(selectedModel.model_name)
                setSelectedSavedModelData(selectedModel)
                setModelRMSE(selectedModel.model_data.predicted_result.rmse);
                setInitialPredictionsDate(selectedModel.model_data.predicted_result.initial_forecast[0].open);
                setLatestForecastData(selectedModel.model_data.latest_forecast_result);
            }
        }

        return () => {
            console.log('cleaning up ...')
            // setOpen(false)
            // setToShowModelId(null)
            setDefaultModelName('')
            setSelectedSavedModelData(defaultselectedSavedModelData)
            setModelRMSE([])
            setInitialPredictionsDate(null)
            setLatestForecastData({})
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toShowModelId])

    const handleLocalClose = () => {
        setToShowModelId(null)
        setOpen(false)
        // handleExpandedSelectedModelClose()
    }

    useEffect(() => {
        if (selectedRMSEIndex !== null) {
            setSelectedPrediction(allPredictions[`${selectedRMSEIndex}`])
        }
    }, [selectedRMSEIndex, allPredictions])

    const [trainingParamsCollapse, setTrainingParamsCollapse] = useState(false)
    const handleTrainingParametersCollapse = () => {
        setTrainingParamsCollapse(!trainingParamsCollapse)
    }

    // To make new prediction
    const [forecastLoadingFlag, setForecastLoadingFlag] = useState(false)
    const [latestForecastData, setLatestForecastData] = useState({})
    const [selectedForecastData, setSelectedForecastData] = useState([])
    const [newForecastMetrics, setNewForecastMetrics] = useState({ mse: 0, rmse: 0 })

    const handleMakeNewPrediction = () => {
        console.log('Making new prediction')
        const selectedModelData = user_models_redux.find((model) => model.model_id === toShowModelId).model_data
        const { training_parameters, talibExecuteQueries, predicted_result: { initial_forecast } } = selectedModelData
        console.log(initial_forecast)
        const payload = {
            training_parameters,
            talibExecuteQueries,
            model_id: toShowModelId,
            model_first_prediction_date: initial_forecast[0].open * 1000,
            model_train_period: ticker_period,
            mean_array: selectedModelData.predicted_result.mean_array,
            variance_array: selectedModelData.predicted_result.variance_array
        }
        // console.log(payload)

        setForecastLoadingFlag(true)
        makeNewPrediction({ token, payload })
            .then((res) => {
                // console.log(res.data)
                const { result } = res.data
                // console.log(result)

                const final_forecast = {}

                Object.keys(result[0])
                    .filter((key) => key !== 'date' && key !== 'actual')
                    .forEach((key) => (
                        final_forecast[key] = result.map((obj) =>
                        ({
                            openTime: obj.date,
                            predicted: obj[key],
                            actual: obj.actual
                        })
                        )))
                // console.log(final_forecast)
                setLatestForecastData(final_forecast)
                const selected_forecastData = final_forecast[`${selectedRMSEIndex}`]

                const { mse, rmse } = calculateMSE(selected_forecastData.map((data) => data.actual), selected_forecastData.map((data) => data.predicted))
                // console.log(mse, rmse)
                setNewForecastMetrics({ mse, rmse })

                setSelectedForecastData(selected_forecastData)

                // save to redux for both lstm and wgan forecast
                dispatch(setNewForecastData({
                    model_id: toShowModelId,
                    final_forecast: final_forecast
                }))
                setForecastLoadingFlag(false)
            })
            .catch((err) => {
                const errorMessage = err.response.data.error
                console.log(err.response.data)
                setForecastLoadingFlag(false)
                if (errorMessage === 'TIMEOUT') {
                    Error('Celery Worker un-available (Request Timed out). Try later.')
                } else {
                    Error('Error making new prediction')
                }
            })
    }

    useEffect(() => {
        if (selectedRMSEIndex !== null && Object.keys(latestForecastData).length !== 0) {
            // console.log('Selected RMSE Index, forecast available', selectedRMSEIndex)
            const selected_forecastData = latestForecastData[`${selectedRMSEIndex}`]
            const { mse, rmse } = calculateMSE(selected_forecastData.map((data) => data.actual), selected_forecastData.map((data) => data.predicted))
            // console.log(mse, rmse)
            setNewForecastMetrics({ mse, rmse })
            setSelectedForecastData(selected_forecastData)
        } else { return }
    }, [selectedRMSEIndex, latestForecastData])

    // calculates the remaining time for the next prediction after initial model creation only
    const [remainingTime, setRemainingTime] = useState(10);
    useEffect(() => {
        let intervalId = null

        const calculateRemainingTime = () => {
            console.log('Calculating remaining time')
            const periodInMilliSecond = periodToMilliseconds(ticker_period);
            const end = initialPredictionsDate * 1000 + periodInMilliSecond
            const now = new Date().getTime()
            const remaining = Math.floor((end - now) / 1000)

            setRemainingTime(remaining > 0 ? remaining : 0);
            // console.log(periodInMilliSecond, end, now, 'Remaining time :', remaining)

            // Check if the remaining time is positive to start the interval
            if (remaining > 0 && intervalId === null) {
                intervalId = setInterval(calculateRemainingTime, 30000);
            }

            // Check if the remaining time becomes negative to clear the interval
            if (remaining <= 0 && intervalId !== null) {
                clearInterval(intervalId);
                intervalId = null;
            }
        };

        if (initialPredictionsDate !== null) {
            // console.log('First date available', initialPredictionsDate * 1000)
            calculateRemainingTime(); // calculate remaining time immediately
        }

        return () => {
            // console.log('Clearing interval')
            clearInterval(intervalId); // cleanup on unmount
            intervalId = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialPredictionsDate]);

    // console.log('remaining Time :', remainingTime)

    // handles the model name change
    const [defaultModelName, setDefaultModelName] = useState('')
    const [showModelNameChangeAction, setShowModelNameChangeAction] = useState(false)
    // console.log('default value', defaultModelName)
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

    const handleNewModelName = (e) => {
        // console.log(e.target.value)
        setDefaultModelName(e.target.value)
    }

    const saveNewModelName = () => {
        console.log('New modelName: ', defaultModelName)
        const payload = {
            model_id: toShowModelId,
            model_name: defaultModelName
        }

        renameModel({
            token, payload
        })
            .then((res) => {
                if (res.data.status) {
                    // console.log('name change success')
                    dispatch(renameModelInRedux({ model_id: toShowModelId, newModelName: defaultModelName }))
                    setShowModelNameChangeAction(false)
                }
            })
            .catch((err) => {
                console.log(err)
            })
    }

    const revertModelNameChange = () => {
        console.log('Revert modelName: ', model_name)
        setDefaultModelName(model_name)
    }

    useEffect(() => {
        // console.log('UE dft name check', model_name, defaultModelName)
        if (toShowModelId !== null && model_name !== null && defaultModelName !== null) {
            if (model_name === defaultModelName) {
                // console.log('case 1')
                setShowModelNameChangeAction(false)
            } else {
                // console.log('case 2')
                setShowModelNameChangeAction(true)
            }
        }
    }, [defaultModelName, model_name, toShowModelId])

    return (
        <Box className='saved-models-body'>
            <Box display='flex' flexDirection='column' gap='5px' className='all-saved-model' width='fit-content'>
                {user_models_redux.filter(model => model.ticker_period === selected_ticker_period && model.ticker_name === selected_ticker_name).map((model, index) => {
                    const { model_name, model_id, model_created_date } = model
                    return (
                        <Paper key={index} elevation={4} className='single-saved-model' sx={{ color: toShowModelId === model_id && open ? `${theme.palette.primary.main}` : `${theme.palette.text.primary}` }}>
                            <Box display='flex' alignItems='center' justifyContent='space-between' pl={'5px'} pr={'5px'} title={`Model created on ${dayjs(model_created_date).format('lll')}`}>
                                <Typography className='saved-model-name' sx={{ fontWeight: toShowModelId === model_id ? '600' : '400' }}>{model_name}</Typography>
                                <Box display='flex'>
                                    <Tooltip placement='top' sx={{ cursor: 'pointer', padding: '6px' }}>
                                        <span>
                                            <IconButton onClick={handleShowSavedModelDetails.bind(null, { modelId: model_id, m_name: model_name })} sx={{ padding: '6px', color: toShowModelId === model_id && open ? `${theme.palette.primary.main}` : `${theme.palette.text.primary}` }} >
                                                <AspectRatioIcon className='small-icon' />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </Box>
                            </Box>
                        </Paper>
                    )
                })}
            </Box>

            <Box className='saved-model-data' width='100%'>
                <Collapse in={open} >
                    {selectedSavedModelData.model_created_date !== null &&
                        <Paper elevation={4} className='saved-model-details' sx={{ display: 'flex', flexDirection: 'column', padding: '8px', gap: '8px' }}>
                            <Box display='flex' flexDirection='column' alignItems='start'>
                                <Box display='flex' flexDirection='row' justifyContent='space-between' width="100%">
                                    <Box className='model-name-changer'>
                                        <Box className='dot-details'>
                                            <Dot color={modelStatusColor} />
                                            <Typography variant='h6' sx={{ fontWeight: '600' }}>Details,</Typography>
                                        </Box>
                                        <Box className='name-changer-textfield' title={'Change the model name'}>
                                            <TextField
                                                inputProps={{ style: { height: '10px' } }}
                                                hiddenLabel
                                                fullWidth
                                                id="saved-model-name-change"
                                                variant="filled"
                                                size='small'
                                                value={defaultModelName}
                                                onChange={(e) => handleNewModelName(e)}
                                            />
                                            {showModelNameChangeAction &&
                                                <Box display='flex' flexDirection='row' alignItems='center' gap={1}>
                                                    <IconButton size='small' sx={{ padding: '3px' }} onClick={saveNewModelName}>
                                                        <CheckIcon className='small-icon' />
                                                    </IconButton>
                                                    <IconButton size='small' sx={{ padding: '3px' }} onClick={revertModelNameChange}>
                                                        <CloseIcon className='small-icon' />
                                                    </IconButton>
                                                </Box>
                                            }
                                        </Box>
                                    </Box>
                                    <Box className='opend-model-actions' display='flex' gap={1} alignItems='center'>
                                        <DeleteSavedModel
                                            handleModelDeletFromSaved={handleModelDeletFromSaved}
                                            model_id={toShowModelId}
                                        />
                                        <IconButton size='small' sx={{ padding: '3px' }} onClick={handleLocalClose}>
                                            <CloseIcon className='small-icon' />
                                        </IconButton>
                                    </Box>
                                </Box>

                                <Box className='basic-details'>
                                    <Typography variant='body2'><span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>Ticker name</span> : {ticker_name}</Typography>
                                    <Typography variant='body2'><span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>Period</span> : {ticker_period}</Typography>
                                    <Typography variant='body2'><span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>Time taken</span> : {formatMillisecond(train_duration)}</Typography>
                                    <Typography variant='body2'><span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>Date created</span> : {dayjs(model_created_date).format('lll')}</Typography>
                                </Box>

                                <Box className='basic-details2'>
                                    <Typography variant='body2'><span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>MSE (Train)</span> : {epoch_results[epoch_results.length - 1].mse}</Typography>
                                    <Typography variant='body2'><span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>RMSE (Train)</span> : {Math.sqrt(epoch_results[epoch_results.length - 1].mse)}</Typography>
                                    <Typography variant='body2'><span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>MSE (Test)</span> : {scores.over_all_score * scores.over_all_score}</Typography>
                                    <Typography variant='body2'><span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>RMSE (Test)</span> : {scores.over_all_score}</Typography>
                                </Box>
                            </Box>

                            <Box className='three-diff-params'>
                                <Box>
                                    <Paper elevtion={4} className='model-parameter-expandd-collapse-box' sx={{ display: "flex", flexDirection: "row", justifyContent: 'space-between', alignItems: 'center', boxShadow: `${trainingParamsCollapse && 'none'}` }}>
                                        <Typography variant='h6' sx={{ fontWeight: '600' }}>Training Parameters</Typography>
                                        <IconButton sx={{ padding: '6px' }} onClick={handleTrainingParametersCollapse.bind(null, {})}>
                                            {trainingParamsCollapse ? <ArrowDropUpIcon className='small-icon' /> : <ArrowDropDownIcon className='small-icon' />}
                                        </IconButton>
                                    </Paper>
                                    <Collapse in={trainingParamsCollapse} >
                                        <Box className='temp-flex'>
                                            <Box className='mt-params' display={'flex'} flexDirection='column' alignItems={'start'}>
                                                <Box className='model-training-parameters'>
                                                    <Typography variant='body2' sx={{ width: 'max-content' }}><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Training size</span> : {training_parameters.trainingDatasetSize}</Typography>
                                                    <Typography variant='body2' sx={{ width: 'max-content' }}><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Time Step</span> : {training_parameters.timeStep}</Typography>
                                                    <Typography variant='body2' sx={{ width: 'max-content' }}><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Look Ahead</span> : {training_parameters.lookAhead}</Typography>
                                                    <Typography variant='body2' sx={{ width: 'max-content' }}><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Epoch</span> : {training_parameters.epoch}</Typography>
                                                    <Typography variant='body2' sx={{ width: 'max-content' }}><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Hidden Layer</span> : {training_parameters.hiddenLayer}</Typography>
                                                    <Typography variant='body2' sx={{ width: 'max-content' }}><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>To Predict</span> : {training_parameters.multiSelectValue}</Typography>
                                                    <Typography variant='body2' sx={{ width: 'max-content' }}><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Batch Size</span> : {training_parameters.batchSize}</Typography>
                                                    <Typography variant='body2' sx={{ width: 'max-content' }}><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Do Validation</span> : {training_parameters.doValidation === true ? 'true' : 'false'}</Typography>
                                                    <Typography variant='body2' sx={{ width: 'max-content' }}><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Early Stopping</span> : {training_parameters.earlyStopping === true ? 'true' : 'false'}</Typography>
                                                    <Typography variant='body2' sx={{ width: 'max-content' }}><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Learning Rate</span> : {training_parameters.scaledLearningRate}</Typography>
                                                    {!sm &&
                                                        <Typography variant='body2' sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500', marginRight: '4px' }}>Transform Order</span> :
                                                            <NoMaxWidthTooltip
                                                                title={(
                                                                    <table className="mse-table-main" style={{ fontWeight: '600', fontSize: '11px' }}>
                                                                        <thead className='table-group'>
                                                                            <tr className='table-row'>
                                                                                <th className='mse-table-head'>Order</th>
                                                                                <th className='mse-table-head'>Name</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className='table-body'>
                                                                            {training_parameters.transformation_order.map((key) => (
                                                                                <tr className='table-row' key={key.name}>
                                                                                    <td className='table-data'>{key.id}</td>
                                                                                    <td className='table-data'>{key.name}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                )}
                                                                placement='top'
                                                                arrow
                                                            >
                                                                <InfoOutlinedIcon sx={{ width: '16px', height: '16px', cursor: 'pointer', marginLeft: '4px' }} />
                                                            </NoMaxWidthTooltip>
                                                        </Typography>
                                                    }
                                                </Box>
                                            </Box>

                                            {sm &&
                                                <Box display='flex' flexDirection='column' alignItems='start'>
                                                    <Typography variant='h6' sx={{ fontWeight: '600' }}>Transformation Order</Typography>
                                                    {training_parameters.transformation_order.map((key) => (
                                                        <Typography key={key.name} variant='body2'><span style={{ display: 'inline-block', width: '80px', textAlign: 'start' }}>Order : {key.id}</span> Name : {key.name}</Typography>
                                                    ))}
                                                </Box>
                                            }

                                            <Box className='selected-indicators-saved' width='100%'>
                                                <Typography variant='body2' sx={{ width: 'max-content' }}>
                                                    <span style={{ display: 'inline-block', width: '180px', textAlign: 'start', fontWeight: '500' }}>Technical Indicators</span>
                                                </Typography>
                                                <Box className='selected-indicators-saved-box'>
                                                    <Grid container spacing={1}>
                                                        {talibExecuteQueries.map((query, index) =>
                                                            <TalibFuncSummary key={index} query={query} />
                                                        )}
                                                    </Grid>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Collapse>
                                </Box>


                                <Grid container spacing={1} sx={{ width: '100%' }}>
                                    <Grid item xs={12} md={6} lg={6} xl={4}>
                                        <Box className='saved-model-prediction-chart'>
                                            <Box display='flex' flexDirection='column' alignItems='start' pb={'4px'}>
                                                <Typography variant='h6' sx={{ fontWeight: '600' }}>Prediction RMSE</Typography>
                                            </Box>
                                            <Box pt={1} sx={{ fontSize: '12px' }} className='rechart-chart' height='220px'>
                                                {
                                                    modelRMSE.length !== 0 && <RMSEBarChart data={modelRMSE} selectedRMSEIndex={selectedRMSEIndex} setSelectedRMSEIndex={setSelectedRMSEIndex} />
                                                }
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} md={6} lg={6} xl={4}>
                                        <Box className='saved-model-prediction-chart'>
                                            <Box display='flex' flexDirection='column' alignItems='start' pb={'4px'}>
                                                <Typography variant='h6' sx={{ fontWeight: '600' }}>Predictions
                                                    <span style={{ color: `${theme.palette.primary.main}` }}> +{(selectedRMSEIndex + 1) * ticker_period.match(/(\d+)(\w+)/)[1]}{ticker_period.match(/(\d+)(\w+)/)[2]}</span>
                                                </Typography>
                                            </Box>
                                            <Box pt={'4px'} sx={{ fontSize: '12px' }} className='rechart-chart' height='220px'>
                                                {
                                                    selectedPrediction.length !== 0 && <InitialForecastLineChart data={selectedPrediction} tt_key={'prediction'} />
                                                }
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} md={12} lg={12} xl={4}>
                                        {remainingTime === 0 &&
                                            <Box className='saved-model-prediction-chart'>
                                                <Box display='flex' flexDirection='column' alignItems='start' pb={'4px'}>
                                                    <Typography variant='h6' sx={{ fontWeight: '600', alignItems: 'center' }}>
                                                        Forecast
                                                        <span style={{ color: `${theme.palette.primary.main}` }}> +{(selectedRMSEIndex + 1) * ticker_period.match(/(\d+)(\w+)/)[1]}{ticker_period.match(/(\d+)(\w+)/)[2]}</span>
                                                        {newForecastMetrics.mse !== 0 &&
                                                            <span style={{ color: `${theme.palette.secondary.main}` }}> RMSE : {newForecastMetrics.rmse.toFixed(2)}</span>}
                                                    </Typography>
                                                </Box>
                                                <Box pt={'4px'} sx={{ fontSize: '12px' }} className='rechart-chart' height='220px'>
                                                    {(Object.keys(latestForecastData).length === 0 && !forecastLoadingFlag) ?
                                                        <Box display='flex' justifyContent='center' alignItems='center' height='100%'>
                                                            <Button size='small' variant='outlined' onClick={handleMakeNewPrediction} >Make Prediction</Button>
                                                        </Box>
                                                        :
                                                        forecastLoadingFlag
                                                            ? <Skeleton variant="rectangular" width='100%' height='100%' />
                                                            : <InitialForecastLineChart data={selectedForecastData} tt_key={'forecast'} />
                                                    }
                                                </Box>
                                            </Box>
                                        }
                                    </Grid>
                                </Grid>

                            </Box>
                            <Box>
                                <Button size='small' variant='outlined' onClick={handleLocalClose}>Close</Button>
                            </Box>
                        </Paper>
                    }
                </Collapse>
            </Box>
        </Box >
    )
}

export default SavedModels