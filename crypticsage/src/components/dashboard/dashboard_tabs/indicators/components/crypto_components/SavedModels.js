import React, { useEffect, useState } from 'react'
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
    Skeleton
} from '@mui/material'
import '../../modules/module.css'
import dayjs from "dayjs";
import { useSelector, useDispatch } from 'react-redux';
import { updatePredictedValues } from '../../modules/CryptoModuleSlice'
import { Dot } from '../../modules/CryptoModuleUtils';
import { checkIfModelDataExists, getModelResult } from '../../../../../../api/adminController'
import { NoMaxWidthTooltip, formatMillisecond } from '../../modules/CryptoModuleUtils'
import { AspectRatioIcon, DeleteForeverIcon, ArrowDropDownIcon, ArrowDropUpIcon, InfoOutlinedIcon } from '../../../../global/Icons'
import RMSEBarChart from './RMSEBarChart';
import InitialForecastLineChart from './InitialForecastLineChart';

const calculateOriginalPrice = ({ value, variance, mean }) => {
    if (value === null) return null;
    return parseFloat(((value * Math.sqrt(variance)) + mean).toFixed(2));
};


const SavedModels = ({
    selected_ticker_period,
    open,
    token,
    userModels,
    handleModelDeletFromSaved,
    handleExpandSelectedModel,
    selectedSavedModelData,
    handleExpandedSelectedModelClose
}) => {
    const {
        model_created_date = null,
        ticker_name = null,
        ticker_period = null,
        model_data = {}
    } = selectedSavedModelData || {};

    const {
        training_parameters = null,
        talibExecuteQueries = null,
        predicted_result = null,
        scores = null,
        epoch_resuts = null,
        train_duration = null,
    } = model_data;

    const dispatch = useDispatch()
    const theme = useTheme();
    const sm = useMediaQuery(theme.breakpoints.down('sm'));

    const [openIndicator, setOpenIndicator] = useState('');
    const [toShowModelId, setToShowModelId] = useState(null);
    const handleShowModelDetails = ({ modelId }) => {
        if (modelId === toShowModelId && open === true) {
            setToShowModelId(null)
            setModelStatusColor('red')
            handleExpandSelectedModel({ model_id: modelId })
            setSelectedRMSEIndex(0)
        } else {
            setToShowModelId(modelId)
            setModelStatusColor('red')
            handleExpandSelectedModel({ model_id: modelId })
            setSelectedRMSEIndex(0)
        }
    }

    const handleLocalClose = () => {
        setToShowModelId(null)
        handleExpandedSelectedModelClose()
    }

    const [modelStatusColor, setModelStatusColor] = useState('red')
    useEffect(() => {
        // console.log('UE from saved model Check')
        if (toShowModelId !== null) {
            const payload = {
                model_id: toShowModelId
            }

            checkIfModelDataExists({
                token, payload
            })
                .then((res) => {
                    // console.log(res.data.message, res.data.status)
                    if (res.data.status) {
                        setModelStatusColor('green')
                    } else {
                        setModelStatusColor('red')
                    }
                })
                .catch((err) => {
                    console.log(err)
                })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toShowModelId])

    const user_models_redux = useSelector(state => state.cryptoModule.userModels)
    const [modelRMSE, setModelRMSE] = useState([])
    const [initialPredictionsDates, setInitialPredictionsDates] = useState([])

    const [dataLoadingFlag, setDataLoadingFlag] = useState(false)
    useEffect(() => {
        // console.log('UE from saved model Initial Check')
        if (user_models_redux.length > 0 && toShowModelId !== null) {
            const selectedModel = user_models_redux.find((model) => model.model_id === toShowModelId)
            if (selectedModel && Object.keys(selectedModel.model_data.predicted_result).length === 2) {
                // console.log('Model data does not exists')
                const payload = {
                    model_id: toShowModelId
                }
                setDataLoadingFlag(true)
                getModelResult({
                    token, payload
                })
                    .then((res) => {
                        const model_result = res.data.model_data
                        dispatch(updatePredictedValues(
                            {
                                model_id: toShowModelId,
                                rmse: model_result.rmse,
                                forecast: model_result.forecast,
                                predictions_array: model_result.predictions_array,
                                initial_forecast: model_result.initial_forecast
                            }
                        ))
                        setModelRMSE(model_result.rmse)
                        setInitialPredictionsDates(model_result.initial_forecast)
                        setDataLoadingFlag(false)
                        // console.log('Model result', model_result, rmse)
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            } else {
                // console.log('Model data exists')
                setModelRMSE(selectedModel.model_data.predicted_result.rmse)
                setInitialPredictionsDates(selectedModel.model_data.predicted_result.initial_forecast)
                // console.log(rmse)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, toShowModelId, token, user_models_redux])


    const [selectedRMSEIndex, setSelectedRMSEIndex] = useState(0)
    const [initialPredictions, setInitialPredictions] = useState([])

    const barChartOnClickHandler = (e) => {
        const model_period = parseInt(ticker_period.match(/(\d+)(\w+)/)[1]);
        let parts = e.name.match(/(\+|-)?(\d+)(\w+)/);
        const selectedRMSEIdx = parseInt(parts[2]) / model_period;
        // console.log(selectedRMSEIdx)
        setSelectedRMSEIndex(selectedRMSEIdx - 1)
    }
    const ohlcData = useSelector(state => state.cryptoModule.cryptoDataInDb)
    useEffect(() => {
        if (initialPredictionsDates.length !== 0) {
            const selectedModel = user_models_redux.find((model) => model.model_id === toShowModelId)
            const forecast = selectedModel.model_data.predicted_result.forecast
            // console.log(selectedModel)
            let toPlotData = []
            if (selectedRMSEIndex === 0) {
                forecast.forEach((prediction, index) => {
                    toPlotData.push({
                        openTime: initialPredictionsDates[index].openTime,
                        predicted: calculateOriginalPrice({ value: prediction[0], variance: predicted_result.label_variance, mean: predicted_result.label_mean })
                    })
                })
            } else {
                const last_prediction = selectedModel.model_data.predicted_result.predictions_array.slice(-selectedRMSEIndex)
                // console.log(last_prediction)

                const prediction_to_add = last_prediction.map((prediction) => { return prediction[selectedRMSEIndex] })
                // console.log(prediction_to_add)

                let forecast_sliced_from_start = forecast.slice(0, -selectedRMSEIndex)
                let finalForecast = [...prediction_to_add, ...forecast_sliced_from_start]
                // console.log(forecast_sliced_from_start)
                // console.log(finalForecast)

                finalForecast.forEach((prediction, index) => {
                    toPlotData.push({
                        openTime: initialPredictionsDates[index].openTime,
                        predicted: calculateOriginalPrice({ value: prediction[0], variance: predicted_result.label_variance, mean: predicted_result.label_mean })
                    })
                })
            }

            const firstDate = new Date(toPlotData[0].openTime).getTime()
            const lastDate = new Date(toPlotData[toPlotData.length - 1].openTime).getTime()
            const toCompareActualValues = ohlcData.filter(ticker => ticker.openTime >= firstDate && ticker.openTime <= lastDate)
            // console.log(toCompareActualValues)
            // console.log(toPlotData)

            const finalData = toPlotData.map((prediction, index) => {
                let actual = null;
                if (toCompareActualValues[index] && new Date(prediction?.openTime).getTime() === toCompareActualValues[index].openTime) {
                    actual = toCompareActualValues[index].close;
                }
                return {
                    ...prediction,
                    actual: parseFloat(parseFloat(actual).toFixed(2))
                };
            });

            // console.log(finalData)

            setInitialPredictions(finalData)

        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRMSEIndex, initialPredictionsDates])

    const [trainingParamsCollapse, setTrainingParamsCollapse] = useState(false)
    const handleTrainingParametersCollapse = () => {
        setTrainingParamsCollapse(!trainingParamsCollapse)
    }

    useEffect(() => {
        if (!sm && !trainingParamsCollapse) {
            setTrainingParamsCollapse(true)
        }
    }, [sm, trainingParamsCollapse])

    return (
        <Box className='saved-models-body'>
            <Box display='flex' flexDirection='column' gap='5px' className='all-saved-model' width='fit-content'>
                {userModels.filter(model => model.ticker_period === selected_ticker_period).map((model, index) => {
                    const { model_name, model_id } = model
                    return (
                        <Paper key={index} elevation={4} className='single-saved-model' sx={{ color: toShowModelId === model_id ? `${theme.palette.primary.main}` : `${theme.palette.text.primary}` }}>
                            <Box display='flex' alignItems='center' justifyContent='space-between' pl={'5px'} pr={'5px'}>
                                <Typography className='saved-model-name' sx={{ fontWeight: toShowModelId === model_id ? '600' : '400' }}>{model_name}</Typography>
                                <Box display='flex'>
                                    <Tooltip
                                        placement='top'
                                        sx={{ cursor: 'pointer', padding: '6px' }}
                                        title={
                                            (
                                                <Box display='flex' flexDirection='row' gap='5px'>
                                                    <Button color='error' variant='contained' size='small' onClick={handleModelDeletFromSaved.bind(null, { model_id: model_id })}>Yes</Button>
                                                    <Button color='warning' variant='contained' size='small' onClick={() => console.log('No')}>No</Button>
                                                </Box>
                                            )
                                        }
                                    >
                                        <span>
                                            <IconButton sx={{ padding: '6px' }}>
                                                <DeleteForeverIcon className='small-icon' />
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                    <Tooltip placement='top' sx={{ cursor: 'pointer', padding: '6px' }}>
                                        <span>
                                            <IconButton onClick={handleShowModelDetails.bind(null, { modelId: model_id })} sx={{ padding: '6px', color: toShowModelId === model_id ? `${theme.palette.primary.main}` : `${theme.palette.text.primary}` }} >
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
                    {selectedSavedModelData &&
                        <Paper elevation={4} className='saved-model-details' sx={{ display: 'flex', flexDirection: 'column', padding: '8px', gap: '8px' }}>
                            <Box display='flex' flexDirection='column' alignItems='start'>
                                <Box display='flex' flexDirection='row' alignItems='center' gap={1} >
                                    <Dot color={modelStatusColor} />
                                    <Typography variant='h6' sx={{ fontWeight: '600' }}>Details</Typography>
                                </Box>
                                <Box className='basic-details'>
                                    <Typography variant='body2'><span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>Date created</span> : {dayjs(model_created_date).format('lll')}</Typography>
                                    <Typography variant='body2'><span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>Ticker name</span> : {ticker_name}</Typography>
                                    <Typography variant='body2'><span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>Period</span> : {ticker_period}</Typography>
                                    <Typography variant='body2'><span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>Time taken</span> : {formatMillisecond(train_duration)}</Typography>
                                    <Typography variant='body2'><span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>MSE (Test)</span> : {scores.over_all_score * scores.over_all_score}</Typography>
                                    <Typography variant='body2'><span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>RMSE (Test)</span> : {scores.over_all_score}</Typography>
                                </Box>
                            </Box>

                            <Box display='flex' flexDirection='column' alignItems='start' gap={2}>
                                <Box className='three-diff-params'>
                                    <Box>
                                        {sm && <Paper elevtion={4} className='model-parameter-expandd-collapse-box' sx={{ display: "flex", flexDirection: "row", justifyContent: 'space-between', alignItems: 'center', boxShadow: `${trainingParamsCollapse && 'none'}` }}>
                                            <Typography variant='h6' sx={{ fontWeight: '600' }}>{trainingParamsCollapse ? 'Hide Parameters' : 'Show Parameters'}</Typography>
                                            <IconButton sx={{ padding: '6px' }} onClick={handleTrainingParametersCollapse.bind(null, {})}>
                                                {trainingParamsCollapse ? <ArrowDropUpIcon className='small-icon' /> : <ArrowDropDownIcon className='small-icon' />}
                                            </IconButton>
                                        </Paper>}
                                        <Collapse in={trainingParamsCollapse} >
                                            <Box className='temp-flex'>
                                                <Box className='mt-params' display={'flex'} flexDirection='column' alignItems={'start'}>
                                                    {!sm && <Typography variant='h6' sx={{ fontWeight: '600', marginBottom: '6px' }}>Parameters</Typography>}
                                                    <Box className='model-training-parameters'>
                                                        <Typography variant='body2'><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Training size</span> : {training_parameters.trainingDatasetSize}</Typography>
                                                        <Typography variant='body2'><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Time Step</span> : {training_parameters.timeStep}</Typography>
                                                        <Typography variant='body2'><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Look Ahead</span> : {training_parameters.lookAhead}</Typography>
                                                        <Typography variant='body2'><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Epoch</span> : {training_parameters.epoch}</Typography>
                                                        <Typography variant='body2'><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Hidden Layer</span> : {training_parameters.hiddenLayer}</Typography>
                                                        <Typography variant='body2'><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>To Predict</span> : {training_parameters.multiSelectValue}</Typography>
                                                        <Typography variant='body2'><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Batch Size</span> : {training_parameters.batchSize}</Typography>
                                                        <Typography variant='body2'><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Do Validation</span> : {training_parameters.doValidation === true ? 'true' : 'false'}</Typography>
                                                        <Typography variant='body2'><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Early Stopping</span> : {training_parameters.earlyStopping === true ? 'true' : 'false'}</Typography>
                                                        <Typography variant='body2'><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Learning Rate</span> : {training_parameters.scaledLearningRate}</Typography>
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

                                                <Box className='selected-indicators-saved' display={'flex'} flexDirection={'column'} gap={1} alignItems={'start'}>
                                                    <Typography variant='h6' sx={{ fontWeight: '600' }}>Indicators</Typography>
                                                    <Box className='selected-indicators-saved-box'>
                                                        {talibExecuteQueries.map((query, index) => {
                                                            const { payload } = query
                                                            const { func_query, func_param_input_keys, func_param_optional_input_keys } = payload
                                                            const { name } = func_query
                                                            return (
                                                                <Paper elevation={4} key={index} className='single-indicator-saved'>
                                                                    <Box display='flex' flexDirection='row' alignItems='center' justifyContent={'space-between'}>
                                                                        <Box display='flex' flexDirection='row' alignItems='center' gap={'6px'} pl={1}>
                                                                            <Dot color='red' />
                                                                            <Typography key={index} variant='body2'>{name}</Typography>
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
                                                            )
                                                        })}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Collapse>
                                    </Box>

                                    <Box className='charts-predictions-box'>
                                        <Box className='saved-model-prediction-chart'>
                                            <Box display='flex' flexDirection='column' alignItems='start' pb={'4px'}>
                                                <Typography variant='h6' sx={{ fontWeight: '600' }}>Forecast RMSE</Typography>
                                            </Box>
                                            <Box height='220px' width='250px' pt={1} sx={{ fontSize: '12px' }} className='rechart-chart'>
                                                {
                                                    dataLoadingFlag ?
                                                        <Skeleton variant="rectangular" width='100%' height='100%' />
                                                        :
                                                        modelRMSE.length !== 0 && <RMSEBarChart data={modelRMSE} barChartOnClickHandler={barChartOnClickHandler} />
                                                }
                                            </Box>
                                        </Box>

                                        <Box className='saved-model-prediction-chart'>
                                            <Box display='flex' flexDirection='column' alignItems='start' pb={'4px'}>
                                                <Typography variant='h6' sx={{ fontWeight: '600' }}>Predictions +{(selectedRMSEIndex + 1) * ticker_period.match(/(\d+)(\w+)/)[1]}{ticker_period.match(/(\d+)(\w+)/)[2]}</Typography>
                                            </Box>
                                            <Box height='220px' width='250px' pt={'4px'} sx={{ fontSize: '12px' }} className='rechart-chart'>
                                                {
                                                    dataLoadingFlag ?
                                                        <Skeleton variant="rectangular" width='100%' height='100%' />
                                                        :
                                                        initialPredictions.length !== 0 && <InitialForecastLineChart data={initialPredictions} />
                                                }
                                            </Box>
                                        </Box>
                                    </Box>

                                </Box>
                                <Box className='new-prediction'>
                                    <Box display='flex' flexDirection='column' alignItems='start'>
                                        <Typography variant='h6' sx={{ fontWeight: '600' }}>New Prediction</Typography>
                                    </Box>
                                    <Box display={'flex'} flexDirection={'row'} gap={1}>
                                        <Button size='small' variant='outlined' >Make Prediction</Button>
                                    </Box>
                                </Box>
                            </Box>
                            <Box>
                                <Button size='small' variant='outlined' onClick={handleLocalClose}>Close</Button>
                            </Box>
                        </Paper>
                    }
                </Collapse>
            </Box>
        </Box>
    )
}

export default SavedModels