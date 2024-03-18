import React, { useState, useEffect } from 'react'
import { Box, Paper, Typography, Tooltip, Button, Skeleton, useMediaQuery, IconButton, useTheme, Collapse, TextField, Grid } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import dayjs from "dayjs";
import { Dot } from '../../modules/CryptoModuleUtils';
import { DeleteSavedModel, RetrainWGANModal } from './modals';
import { Success, Error } from '../../../../global/CustomToasts'
import RMSEBarChart from './RMSEBarChart';
import InitialForecastLineChart from './InitialForecastLineChart';

import { ErrorBoundary } from "react-error-boundary";



import {
    AspectRatioIcon,
    ArrowDropDownIcon,
    ArrowDropUpIcon,
    InfoOutlinedIcon,
    CheckIcon,
    CloseIcon
} from '../../../../global/Icons'

import {
    checkIfModelDataExists,
    makeWganPrediction,
    renameModel,
    deleteModelForUser,
    getUserModels
} from '../../../../../../api/adminController'

import {
    setNewForecastData,
    renameModel as renameModelInRedux,
    setModelDataAvailableFlag,
    resetCurrentModelData,
    setUserModels
} from '../../modules/CryptoModuleSlice'

import {
    NoMaxWidthTooltip,
    formatMillisecond,
    periodToMilliseconds
} from '../../modules/CryptoModuleUtils'

const logError = (error, info) => {
    // Do something with the error, e.g. log to an external API
    console.log('error', error)
};

const generateMSESteps = (period) => {
    switch (period) {
        case '1m':
            return { value: 1, unit: 'm' };
        case '1h':
            return { value: 1, unit: 'h' };
        case '4h':
            return { value: 4, unit: 'h' };
        case '6h':
            return { value: 6, unit: 'h' };
        case '8h':
            return { value: 8, unit: 'h' };
        case '12h':
            return { value: 12, unit: 'h' };
        case '1d':
            return { value: 1, unit: 'd' };
        case '3d':
            return { value: 3, unit: 'd' };
        case '1w':
            return { value: 1, unit: 'w' };
        default:
            return { value: 24, unit: 'h' };
    }
};

const SavedModelsWGANGP = ({
    selected_ticker_period,
    selected_ticker_name,
}) => {
    const theme = useTheme()
    const dispatch = useDispatch()
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    const token = useSelector(state => state.auth.accessToken);
    const ohlcData = useSelector(state => state.cryptoModule.cryptoDataInDb)
    const user_models_redux = useSelector(state => state.cryptoModule.userModels).filter(model => model.model_type === 'WGAN-GP')
    const [toShowModelId, setToShowModelId] = useState(null);
    const [open, setOpen] = useState(false);
    const [openIndicator, setOpenIndicator] = useState(''); // for opening and closing the indicator details


    const defaultselectedSavedModelData = {
        model_id: null,
        model_created_date: null,
        ticker_name: null,
        model_name: null,
        ticker_period: null,
        model_data: {
            epoch_results: null,
            train_duration: null,
            correlation_data: null,
            training_parameters: null,
            talibExecuteQueries: null,
            wgan_intermediate_forecast: null,
            wgan_final_forecast: null,
        }
    }

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
        train_duration,
        correlation_data,
        training_parameters,
        talibExecuteQueries,
        wgan_intermediate_forecast,
        wgan_final_forecast,
    } = model_data;

    const [modelRMSE, setModelRMSE] = useState([])
    const [selectedRMSEIndex, setSelectedRMSEIndex] = useState(0)
    const [allPredictions, setAllPredictions] = useState({})
    const [selectedPrediction, setSelectedPrediction] = useState([])

    const [forecastLoadingFlag, setForecastLoadingFlag] = useState(false)
    const [latestForecastData, setLatestForecastData] = useState({})
    const [selectedForecastData, setSelectedForecastData] = useState([])

    // console.log(latestForecastData)

    const handleShowModelDetails = ({ modelId, m_name }) => {
        const modelData = user_models_redux.find((model) => model.model_id === modelId);

        if (selectedSavedModelData?.model_id === modelId) {
            setOpen((prevOpen) => !prevOpen);
        } else {
            setOpen(true);
        }

        setSelectedSavedModelData({ ...modelData });

        if (modelId === toShowModelId && open === true) {
            setToShowModelId(null)
            setDefaultModelName('')
            setModelStatusColor('red')
            setModelRMSE([])
            // setLatestForecastData({})
            // setSelectedForecastData([])
        } else {
            // console.log('modelData', modelId, m_name, modelData)
            setToShowModelId(modelId)
            setDefaultModelName(m_name)
            setModelStatusColor('red')

            setLatestForecastData(modelData.model_data.latest_forecast_result)
            setSelectedForecastData([])
            const { value, unit } = generateMSESteps(selected_ticker_period)
            const rmse = []
            const res_rmse = modelData.model_data.wgan_final_forecast.rmse
            Object.keys(res_rmse).forEach((key) => {
                const new_key = key.split('_')[1]
                rmse.push({
                    name: `+${value * (parseInt(new_key))}${unit}`,
                    rmse: res_rmse[key]
                })
            })
            setModelRMSE(rmse)

            const lookAhead = modelData.model_data.training_parameters.lookAhead
            const predictionFlag = modelData.model_data.training_parameters.multiSelectValue

            const forecast = modelData.model_data.wgan_final_forecast.predictions.slice(-lookAhead) // the forecast made at the end of the training
            const firstDate = new Date(forecast[0].date).getTime()
            const lastDate = new Date(forecast[forecast.length - 1].date).getTime()
            const toCompareActualValues = ohlcData.filter(ticker => ticker.openTime >= firstDate && ticker.openTime <= lastDate) // actual values for the forecast period

            const actualValuesAdded = forecast.map((obj, index) => {
                return {
                    ...obj,
                    actual: toCompareActualValues[index] !== undefined ? toCompareActualValues[index][predictionFlag] : null
                }
            })

            const final = {}
            Object.keys(forecast[0])
                .filter(key => key !== "date" && key !== 'actual')
                .forEach((key, index) => (
                    final[key] = forecast.map((obj, i) =>
                    ({
                        openTime: obj.date,
                        predicted: obj[key],
                        actual: actualValuesAdded[i].actual
                    })
                    ))
                )
            setAllPredictions(final)
            setSelectedPrediction(final[`${selectedRMSEIndex}`])
        }
    }

    useEffect(() => {
        if (selectedRMSEIndex !== null) {
            setSelectedPrediction(allPredictions[`${selectedRMSEIndex}`])
        }
    }, [selectedRMSEIndex, allPredictions])

    const [modelStatusColor, setModelStatusColor] = useState('red')
    useEffect(() => {
        // console.log('UE from saved model Check')
        const selectedModel = user_models_redux.find((model) => model.model_id === toShowModelId)
        if (toShowModelId !== null) {
            const modelAvailableInDb = selectedModel?.model_data_available
            // console.log(modelAvailableInDb)

            if (modelAvailableInDb === undefined) {
                const payload = {
                    model_id: toShowModelId,
                    modelType: 'WGAN-GP',
                }

                checkIfModelDataExists({
                    token, payload
                })
                    .then((res) => {
                        // console.log(res.data.message, res.data.status)
                        dispatch(setModelDataAvailableFlag({ model_id: toShowModelId, status: res.data.status }))
                        if (res.data.status) {
                            setModelStatusColor('green')
                        } else {
                            setModelStatusColor('red')
                        }
                    })
                    .catch((err) => {
                        console.log(err)
                    })
            } else {
                if (modelAvailableInDb) {
                    setModelStatusColor('green')
                } else {
                    setModelStatusColor('red')
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [toShowModelId])

    const [defaultModelName, setDefaultModelName] = useState('')
    const [showModelNameChangeAction, setShowModelNameChangeAction] = useState(false)
    const userId = useSelector(state => state.auth.uid)

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

    const [trainingParamsCollapse, setTrainingParamsCollapse] = useState(false)
    const handleTrainingParametersCollapse = () => {
        setTrainingParamsCollapse(!trainingParamsCollapse)
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

    const handleLocalClose = () => {
        setToShowModelId(null)
        setOpen(false)
        // handleExpandedSelectedModelClose()
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



    const handleMakeNewPrediction = () => {
        console.log('Making new prediction')
        setForecastLoadingFlag(true)
        const selectedModelData = user_models_redux.find((model) => model.model_id === toShowModelId).model_data
        // console.log(selectedModelData)
        const { training_parameters, talibExecuteQueries } = selectedModelData
        const lookAhead = selectedModelData.training_parameters.lookAhead

        const forecast = selectedModelData.wgan_final_forecast.predictions.slice(-lookAhead)
        const startDate = new Date(forecast[0].date).getTime()
        const payload = {
            training_parameters,
            talibExecuteQueries,
            model_id: toShowModelId,
            model_first_prediction_date: startDate,
            model_train_period: ticker_period,
        }
        console.log(payload)

        makeWganPrediction({ token, payload })
            .then((res) => {
                const final_forecast = {}
                const new_predictions = res.data.result
                // console.log(new_predictions)
                Object.keys(new_predictions[0])
                    .filter(key => key !== 'date' && key !== 'actual')
                    .forEach((key) => (
                        final_forecast[key] = new_predictions.map((obj, i) =>
                        ({
                            openTime: obj.date,
                            predicted: obj[key],
                            actual: obj.actual
                        })
                        )))

                // console.log(final_forecast[`${selectedRMSEIndex}`])
                setLatestForecastData(final_forecast)
                setSelectedForecastData(final_forecast[`${selectedRMSEIndex}`])
                dispatch(setNewForecastData({
                    model_id: toShowModelId,
                    final_forecast: final_forecast
                }))
                setForecastLoadingFlag(false)
            })
            .catch((err) => {
                setForecastLoadingFlag(false)
                const errorMessage = err.response.data.error
                console.log(err.response.data)
                if (errorMessage === 'TIMEOUT') {
                    Error('Celery Worker un-available (Request Timed out). Try later.')
                } else {
                    Error('Error making new prediction')
                }
            })
    }

    // console.log(Object.keys(latestForecastData).length)

    useEffect(() => {
        if (selectedRMSEIndex !== null && Object.keys(latestForecastData).length !== 0) {
            console.log('Selected RMSE Index, forecast available', selectedRMSEIndex)
            setSelectedForecastData(latestForecastData[`${selectedRMSEIndex}`])
        } else { return }
    }, [selectedRMSEIndex, latestForecastData])

    // console.log(selectedForecastData)

    // calculates the remaining time for the next prediction after initial model creation only
    const [remainingTime, setRemainingTime] = useState(10);
    useEffect(() => {
        let intervalId

        const calculateRemainingTime = (startDate) => {
            const periodInMilliSecond = periodToMilliseconds(ticker_period);
            const start = new Date(startDate).getTime()
            const end = start + periodInMilliSecond

            const now = new Date().getTime()
            const remaining = Math.floor((end - now) / 1000)
            // console.log(start, end, 'remaining', remaining)

            setRemainingTime(remaining > 0 ? remaining : 0);
        };

        const modelData = user_models_redux.find((model) => model.model_id === toShowModelId);
        if (toShowModelId !== '' && modelData) {
            const lookAhead = modelData.model_data.training_parameters.lookAhead

            const forecast = modelData.model_data.wgan_final_forecast.predictions.slice(-lookAhead)
            const startDate = new Date(forecast[0].date).getTime()
            calculateRemainingTime(startDate); // calculate remaining time immediately
            intervalId = setInterval(calculateRemainingTime(startDate), 10000); // update every second
        }

        return () => clearInterval(intervalId); // cleanup on unmount
    }, [toShowModelId, user_models_redux, ticker_period]);

    return (
        <Box className='saved-models-body'>
            <Box display='flex' flexDirection='column' gap='5px' className='all-saved-model' width='fit-content'>
                {user_models_redux.filter(model => model.ticker_period === selected_ticker_period && model.ticker_name === selected_ticker_name).map((model, index) => {
                    const { model_name, model_id, model_created_date } = model
                    return (
                        <Paper key={index} elevation={4} className='single-saved-model' sx={{ color: toShowModelId === model_id ? `${theme.palette.primary.main}` : `${theme.palette.text.primary}` }}>
                            <Box display='flex' alignItems='center' minWidth={'300px'} justifyContent='space-between' pl={'5px'} pr={'5px'} title={`Model created on ${dayjs(model_created_date).format('lll')}`}>
                                <Typography className='saved-model-name' sx={{ fontWeight: toShowModelId === model_id ? '600' : '400' }}>{model_name}</Typography>
                                <Box display='flex'>
                                    <Tooltip placement='top' sx={{ cursor: 'pointer', padding: '6px' }}>
                                        <span>
                                            <IconButton onClick={(e) => handleShowModelDetails({ modelId: model_id, m_name: model_name })} sx={{ padding: '6px', color: toShowModelId === model_id ? `${theme.palette.primary.main}` : `${theme.palette.text.primary}` }} >
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
                <Collapse in={open}>
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
                                        {toShowModelId && <RetrainWGANModal type={'from_saved'} model_id={toShowModelId} />}
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
                                    <Typography variant='body2'>
                                        <span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>Ticker name</span> : {ticker_name}
                                    </Typography>
                                    <Typography variant='body2'>
                                        <span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>Period</span> : {ticker_period}
                                    </Typography>
                                    <Typography variant='body2'>
                                        <span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>Time taken</span> : {formatMillisecond(train_duration)}
                                    </Typography>
                                    <Typography variant='body2'>
                                        <span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>Date created</span> : {dayjs(model_created_date).format('lll')}
                                    </Typography>
                                </Box>
                                <Box className='basic-details2'>
                                    <Typography variant='body2'>
                                        <span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>MSE (Train)</span> : {epoch_results[epoch_results.length - 1].training_metrics.mse}
                                    </Typography>
                                    <Typography variant='body2'>
                                        <span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>RMSE (Train)</span> : {epoch_results[epoch_results.length - 1].training_metrics.rmse}
                                    </Typography>
                                    {training_parameters.doValidation &&
                                        <React.Fragment>
                                            <Typography variant='body2'>
                                                <span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>MSE (Val)</span> : {epoch_results[epoch_results.length - 1].validation_metrics.mse}
                                            </Typography>
                                            <Typography variant='body2'>
                                                <span style={{ display: 'inline-block', width: '80px', textAlign: 'start', fontWeight: '500' }}>RMSE (Val)</span> : {epoch_results[epoch_results.length - 1].validation_metrics.rmse}
                                            </Typography>
                                        </React.Fragment>
                                    }
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
                                                    <Typography variant='body2' sx={{ width: 'max-content' }}><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Batch Size</span> : {training_parameters.batchSize}</Typography>
                                                    <Typography variant='body2' sx={{ width: 'max-content' }}><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>To Predict</span> : {training_parameters.multiSelectValue}</Typography>
                                                    <Typography variant='body2' sx={{ width: 'max-content' }}><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Do Validation</span> : {training_parameters.doValidation === true ? 'true' : 'false'}</Typography>
                                                    <Typography variant='body2' sx={{ width: 'max-content' }}><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Early Stopping</span> : {training_parameters.earlyStopping === true ? 'true' : 'false'}</Typography>
                                                    <Typography variant='body2' sx={{ width: 'max-content' }}><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Critic Iterator</span> : {training_parameters.discriminator_iteration}</Typography>
                                                    <Typography variant='body2' sx={{ width: 'max-content' }}><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>G-Learning Rate</span> : {training_parameters.scaled_g_learningRate}</Typography>
                                                    <Typography variant='body2' sx={{ width: 'max-content' }}><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>D-Learning Rate</span> : {training_parameters.scaled_d_learningRate}</Typography>
                                                    <Typography variant='body2' sx={{ width: 'max-content' }}><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Model Save Step</span> : {training_parameters.modelSaveStep}</Typography>
                                                    <Typography variant='body2' sx={{ width: 'max-content' }}><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Interm Res Step</span> : {training_parameters.intermediateResultStep}</Typography>
                                                    <Typography variant='body2' sx={{ width: 'max-content' }}><span style={{ display: 'inline-block', width: '110px', textAlign: 'start', fontWeight: '500' }}>Slice index</span> : {training_parameters.to_train_count}</Typography>
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
                                                        {talibExecuteQueries.map((query, index) => {
                                                            const { payload } = query
                                                            const { func_query, func_param_input_keys, func_param_optional_input_keys } = payload
                                                            const { name } = func_query
                                                            return (
                                                                <Grid item xs={12} sm={6} md={6} lg={6} xl={3} key={index}>
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
                                                                </Grid>
                                                            )
                                                        })}
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
                                                <RMSEBarChart data={modelRMSE} selectedRMSEIndex={selectedRMSEIndex} setSelectedRMSEIndex={setSelectedRMSEIndex} />
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid item xs={12} md={6} lg={6} xl={4}>
                                        <Box className='saved-model-prediction-chart'>
                                            <Box display='flex' flexDirection='column' alignItems='start' pb={'4px'}>
                                                <Typography variant='h6' sx={{ fontWeight: '600' }}>Predictions
                                                    <span
                                                        style={{
                                                            color: `${theme.palette.primary.main}`
                                                        }}> +{(selectedRMSEIndex + 1) * ticker_period.match(/(\d+)(\w+)/)[1]}{ticker_period.match(/(\d+)(\w+)/)[2]}
                                                    </span>
                                                </Typography>
                                            </Box>
                                            <Box pt={1} sx={{ fontSize: '12px' }} className='rechart-chart' height='220px'>
                                                <InitialForecastLineChart data={selectedPrediction} tt_key={'prediction'} />
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <ErrorBoundary onError={logError} fallback={<div>Something went wrong</div>}>
                                        {<Grid item xs={12} md={12} lg={12} xl={4}>
                                            {remainingTime === 0 &&
                                                <Box className='saved-model-prediction-chart'>
                                                    <Box display='flex' flexDirection='column' alignItems='start' pb={'4px'}>
                                                        <Typography variant='h6' sx={{ fontWeight: '600', alignItems: 'center' }}>
                                                            Forecast
                                                            <span style={{ color: `${theme.palette.primary.main}` }}> +{(selectedRMSEIndex + 1) * ticker_period.match(/(\d+)(\w+)/)[1]}{ticker_period.match(/(\d+)(\w+)/)[2]}</span>
                                                            {/* {newForecastMetrics.mse !== 0 &&
                                                            <span style={{ color: `${theme.palette.secondary.main}` }}> RMSE : {newForecastMetrics.rmse.toFixed(2)}</span>} */}
                                                        </Typography>
                                                    </Box>
                                                    <Box pt={'4px'} sx={{ fontSize: '12px' }} className='rechart-chart' height='220px'>
                                                        {(selectedForecastData.length === 0 && !forecastLoadingFlag) ?
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
                                        </Grid>}
                                    </ErrorBoundary>
                                </Grid>
                            </Box>
                        </Paper>
                    }
                </Collapse>
            </Box>
        </Box>
    )
}

export default SavedModelsWGANGP