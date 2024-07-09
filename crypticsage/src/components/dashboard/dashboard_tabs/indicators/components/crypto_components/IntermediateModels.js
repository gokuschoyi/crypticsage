import React, { useState, useEffect, useRef } from 'react'
import { Box, Typography, Grid, Paper, IconButton, Collapse, TextField, Tooltip, LinearProgress } from '@mui/material'
import { useSelector } from 'react-redux'
import { formatMillisecond, returnColorCombinations, getProgressColorForValue } from '../../modules/CryptoModuleUtils'
import { getModelTrainingStatus, getWganCachedTrainingData } from '../../../../../../api/adminController'
import { setSelectedModelId, removeIntermediateModel, setCachedTrainingResults, setTrainingCompleted, setModelWSConnection } from '../../modules/IntermediateModelSlice'
import { useDispatch } from 'react-redux'
import WganFinalPredictionChart from './WganFinalPredictionChart'
import WgangpMetricsChart from './WgangpMetricsChart'
import IntermediateForecastChart from './IntermediateForecastChart'
import { SaveIntermediateModel } from '../crypto_components/modals'
import {
    ArrowDropDownIcon
    , ArrowDropUpIcon
    , PreviewIcon
    , InsightsIcon
    , CloseIcon
} from '../../../../global/Icons'

const colorCombinations = returnColorCombinations()

const LinearProgressWithLabel = (props) => {
    const color = 'red'
    return (
        <Box ref={props.cRef} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} id='custom-linear-progress'>
            <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress id='linear-progress' color='secondary' sx={{ backgroundColor: `${color}` }} variant="determinate" value={0} />
            </Box>
            <Box sx={{ minWidth: 140, textAlign: 'end' }}>
                <Typography variant="custom" sx={{ fontWeight: '600', fontSize: '0.7rem' }} color="text.secondary" id='batch-count'>{props.type} : </Typography>
            </Box>
        </Box>
    );
}

const useUpdateWebSocket = (model_id, url, webSocket, progressRef, dispatch) => {
    const ACTIONS = {
        EPOCH_BEGIN: 'epochBegin',
        EPOCH_END: 'epochEnd',
        BATCH_END: 'batchEnd',
        TRAINING_END: 'trainingEnd',
        PREDICTION_COMPLETED: 'prediction_completed',
        ERROR: 'error'
    };

    const startUpdateSocket = () => {
        if (webSocket.current && webSocket.current.readyState === 1) {
            console.log('WS U : WebSocket connection is already open')
        } else {
            console.log('WS U : Creating new WebSocket connection')
            webSocket.current = new WebSocket(url);
        }

        webSocket.current.onopen = () => {
            console.log('WS U : CONNECTION ESTABLISHED');
            webSocket.current.send(JSON.stringify({ action: 'Connected', message: 'Update socket connection established' })); // Now that the connection is open, you can send data.
        }

        webSocket.current.onclose = () => {
            console.log('WS U : CONNECTION CLOSED');
            webSocket.current = null
        }

        webSocket.current.onerror = (err) => {
            console.log('WS U : CONNECTION ERROR', err);
        }

        webSocket.current.onmessage = (e) => {
            const data = JSON.parse(e.data);
            let batchEndBox

            switch (data.action) {
                case ACTIONS.EPOCH_BEGIN:
                    let epoch = data.epoch
                    let epochs = data.epochs
                    batchEndBox = document.querySelector(`.batch-end-${model_id}`)
                    if (batchEndBox) {
                        batchEndBox.querySelector('#epoch').textContent = `E : ${epoch + 1}/${epochs}`
                    }
                    break;
                case ACTIONS.EPOCH_END: //  save the losses to some state and show small chart
                    break;
                case ACTIONS.BATCH_END:
                    let totalNoOfBatch = data.log.totalNoOfBatch
                    const percentageCompleted = parseFloat(((data.log.batch / totalNoOfBatch) * 100).toFixed(2)) || 0
                    const bgColor = getProgressColorForValue(percentageCompleted, 0, 100, '#C2185B', '#388E3C');
                    if (progressRef.current) {
                        const linearProgress = progressRef.current.querySelector('#linear-progress')
                        let progressBar = linearProgress.querySelector('span')

                        linearProgress.style.backgroundColor = bgColor;
                        const batchCount = progressRef.current.querySelector('#batch-count')

                        batchCount.innerHTML = `(${percentageCompleted}%) ${data.log.batch}/${totalNoOfBatch}`
                        progressBar.style.transform = `translateX(-${100 - percentageCompleted}%)`
                        batchEndBox = document.querySelector(`.batch-end-${model_id}`)
                        if (batchEndBox) {
                            if (data.log.model === 'discriminator') {
                                batchEndBox.querySelector('#model_type').textContent = `${data.log.model}`;
                                batchEndBox.querySelector('#n_critic').textContent = `Critic Iter : ${data.log.critic_iteration}`;
                                batchEndBox.querySelector('#loss').textContent = `Loss : ${data.log.loss}`;
                            } else {
                                batchEndBox.querySelector('#model_type').textContent = `${data.log.model}`;
                                batchEndBox.querySelector('#n_critic').textContent = ``;
                                batchEndBox.querySelector('#loss').textContent = `Loss : ${data.log.loss}`;
                            }
                        }
                    }
                    break;
                case ACTIONS.TRAINING_END:
                    // console.log('Training completed', data)
                    break;
                case ACTIONS.PREDICTION_COMPLETED:
                    dispatch(setModelWSConnection({ model_id, connect: false }))
                    dispatch(setTrainingCompleted({ model_id, model_train_end_time: data.model_train_end_time }))
                    break;
                case ACTIONS.ERROR:
                    dispatch(setModelWSConnection({ model_id, connect: false }))
                    console.log('Error', data.message)
                    break;
                default:
                    break;
            }
        }

    }

    return { startUpdateSocket }
}

const ModelInfo = ({ model, handleLoadTrainingResults, handleViewTrainingProgress }) => {
    const {
        model_type
        , model_id
        , ticker_name
        , period
        , model_train_start_time
        , model_train_end_time
        , training_completed
    } = model

    return (
        <Box>
            <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                <Typography variant='custom' fontWeight='600'>Type :</Typography>
                <Typography variant='custom' textAlign='start'>
                    {model_type}
                </Typography>
            </Box>
            <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                <Typography variant='custom' fontWeight='600'>Ticker :</Typography>
                <Typography variant='custom' textAlign='start'>
                    {ticker_name}
                </Typography>
            </Box>
            <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                <Typography variant='custom' fontWeight='600'>Period :</Typography>
                <Typography variant='custom' textAlign='start'>
                    {period}
                </Typography>
            </Box>
            <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                <Typography variant='custom' fontWeight='600'>Start time :</Typography>
                <Typography variant='custom' textAlign='start'>
                    {new Date(model_train_start_time).toLocaleString()}
                </Typography>
            </Box>
            {model_train_end_time &&
                <React.Fragment>
                    <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                        <Typography variant='custom' fontWeight='600'>End time :</Typography>
                        <Typography variant='custom' textAlign='start'>
                            {new Date(model_train_end_time).toLocaleString()}
                        </Typography>
                    </Box>
                    <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                        <Typography variant='custom' fontWeight='600'>Time taken :</Typography>
                        <Typography variant='custom' textAlign='start'>
                            {formatMillisecond(model_train_end_time - model_train_start_time)}
                        </Typography>
                    </Box>
                </React.Fragment>
            }
            <Box display={'flex'} flexDirection={'row'} alignItems={'center'} gap={'4px'}>
                <Typography variant='custom' fontWeight='600'>Training Completed :</Typography>
                <Typography variant='custom' textAlign='start'>
                    {training_completed ? 'Yes' : 'No'}
                </Typography>
                {training_completed ?
                    <Box>
                        <IconButton size='small' aria-label="update" color="secondary" onClick={handleLoadTrainingResults.bind(null, { model_id })}>
                            <Tooltip title="View Results" placement='top'>
                                <InsightsIcon className='smaller-icon' />
                            </Tooltip>
                        </IconButton>
                    </Box>
                    :
                    <Box>
                        <IconButton size='small' aria-label="update" color="secondary" onClick={handleViewTrainingProgress.bind(null, { model_id })}>
                            <Tooltip title="View Training progress" placement='top'>
                                <PreviewIcon className='smaller-icon' />
                            </Tooltip>
                        </IconButton>
                    </Box>
                }
            </Box>
        </Box>
    )
}

const ProgressBar = ({ model_id, batchResult }) => {
    const progressRef = useRef(null)
    const webSocket = useRef(null)
    const dispatch = useDispatch()
    const url = process.env.NODE_ENV === 'development'
        ? `${process.env.REACT_APP_BASE_WEB_SOCKET_URL}/?model_id=${model_id}&type=update`
        : `${process.env.REACT_APP_DEV_WEBSOCKET_URL}/?model_id=${model_id}&type=update`;
    const { startUpdateSocket } = useUpdateWebSocket(model_id, url, webSocket, progressRef, dispatch)

    useEffect(() => {
        if (batchResult) {
            if (webSocket.current === null) {
                startUpdateSocket()
            } else { }
        } else {
            // console.log('Closing the socket')
            if (webSocket.current) {
                webSocket.current.close()
                webSocket.current = null
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [batchResult])

    return (
        <Box>
            {batchResult &&
                <Box className='batch-end-progress-box' pt={1}>
                    <Box id='progress-line' sx={{ width: '100%' }}>
                        <LinearProgressWithLabel value={0} type={'Batch'} cRef={progressRef} />
                    </Box>
                    <Box className={`epoch_{} epoch`} sx={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                        <Box className={`model-progress_{}`} width='100%' variant='h6'>
                            <div className={`batch-end-${model_id}`}>
                                <div style={{ display: 'flex', flexDirection: 'row' }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: '500', textAlign: 'start', width: "60px" }} id='epoch'>E : 1</div>
                                    <div className='batch-end-text' id='model_type'>DISC</div>
                                    <div className='batch-end-text' id='n_critic'>Critic Iter : 1</div>
                                    <div className='batch-end-text' id='loss'>Loss : 0.04927649209355232</div>
                                </div>
                            </div>
                        </Box>
                    </Box>
                </Box>
            }
        </Box>
    )
}

const ModelNameInput = ({ model_name, handleModeNameChange, re_train_flag }) => {
    return (
        <Box>
            {!re_train_flag ?

                <TextField
                    size='small'
                    inputProps={{ style: { height: '10px', width: '100%' } }}
                    id="outlined-controlled"
                    label="Model name"
                    value={model_name}
                    onChange={(event) => {
                        handleModeNameChange(event)
                    }}
                    sx={{
                        '& .MuiInputLabel-root': {
                            top: '-5px'
                        },
                    }}
                />
                :
                <Box>
                    {model_name}
                </Box>
            }
        </Box>
    )
}

const ModelRunInfo = ({
    selected_model_id
    , model
    , handleLoadTrainingResults
    , handleViewTrainingProgress
    , cachedModelResults
    , selected_model
}) => {
    const dispatch = useDispatch()
    const {
        model_id
        , model_name
        , re_train_flag
        , saved_to_db
        , training_completed
        , batchResult
    } = model
    const [m_name, setMName] = useState(model_name)
    const handleModeNameChange = (event) => {
        setMName(event.target.value)
    }

    const handleCacheCloseAndRemove = () => {
        // console.log('Close and remove', selected_model_id)
        dispatch(setSelectedModelId(''))
        dispatch(removeIntermediateModel(selected_model_id))
    }

    return (
        <Box className='stats-in-progress'>
            <Box display={'flex'} flexDirection={'row'} gap={1}>
                <Box sx={{
                    width: '8.82px',
                    height: '8px',
                    borderRadius: '8px',
                    backgroundColor: selected_model_id === model_id ? 'green' : 'red',
                    margin: '7px 0px 0px 4px'
                }}>
                </Box>

                <ModelInfo
                    model={model}
                    handleLoadTrainingResults={handleLoadTrainingResults}
                    handleViewTrainingProgress={handleViewTrainingProgress}
                />

                <ProgressBar model_id={model_id} batchResult={batchResult} />

                <Box>
                    {training_completed && Object.keys(cachedModelResults).length > 0 && selected_model_id === model_id &&
                        <Box display={'flex'} flexDirection={'row'} gap={1} alignItems={'center'}>
                            <ModelNameInput model_name={m_name} handleModeNameChange={handleModeNameChange} re_train_flag={re_train_flag} />

                            <Box>
                                <SaveIntermediateModel type={"save"} re_train_flag={re_train_flag} model_data={selected_model} modelName={m_name} />
                            </Box>
                            <Box>
                                <SaveIntermediateModel type={"delete"} re_train_flag={re_train_flag} model_data={selected_model} />
                            </Box>
                        </Box>
                    }
                </Box>
            </Box>

            {saved_to_db &&
                <Box>
                    <IconButton sx={{ padding: '6px' }} onClick={handleCacheCloseAndRemove.bind(null, {})}>
                        <CloseIcon className='small-icon' />
                    </IconButton>
                </Box>
            }
        </Box>
    )
}

const IntermediateModels = () => {
    const dispatch = useDispatch()
    const token = useSelector(state => state.auth.accessToken)
    const intermediateModels = useSelector(state => state.intermediateModel.models_in_progress)
    const selected_model_id = useSelector(state => state.intermediateModel.selected_model_id)
    const selected_model = intermediateModels.find(model => model.model_id === selected_model_id) || {}

    const [predictionChartPalette, setPredictionChartPalette] = useState(
        colorCombinations[selected_model?.model_type] === undefined
            ? {}
            : colorCombinations[selected_model?.model_type][0]
    )

    // Global refs for the charts/syncing tooltips
    const loss_chart_ref = useRef(null)
    const training_metrics_chart_ref = useRef(null)
    const validation_metrics_chart_ref = useRef(null)

    const l_chart_series_ref = useRef({})
    const tm_chart_series_ref = useRef({})
    const vm_chart_series_ref = useRef({})

    const [syncTooltip, setSyncTooltip] = useState(false)

    // Collapse results charts
    const [collapseResults, setCollapseResults] = useState(false)
    const toggleCollapseResults = () => {
        setCollapseResults(!collapseResults)
    }

    const [cachedModelResults, setCachedModelResults] = useState(selected_model?.cachedModelResults || {})

    const loadedRef = useRef(false)
    useEffect(() => {
        if (selected_model_id !== '' && !loadedRef.current) {
            // console.log('ID present')
            loadedRef.current = true
            const cached_data = selected_model.cachedModelResults
            if (cached_data === undefined) {
                // console.log('Cached data not present')
                const payload = {
                    uid: selected_model.uid,
                    model_id: selected_model.model_id,
                }
                getWganCachedTrainingData(token, payload)
                    .then(response => {
                        if (response.data.f_result === null) {
                            setCachedModelResults(null)
                            dispatch(setCachedTrainingResults({ model_id: selected_model_id, data: null }))
                            return
                        } else {
                            setPredictionChartPalette(colorCombinations[selected_model.model_type][0])
                            dispatch(setCachedTrainingResults({ model_id: selected_model_id, data: response.data.f_result }))
                            // setModelName(generateRandomModelName(selected_model.ticker_name, selected_model.period))
                        }
                    })
                    .catch(error => {
                        console.log(error)
                    })
            } else if (cached_data === null) {
                console.log('Cached training result lost. Train again?')
            } else {
                // console.log('Cached data present')
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected_model_id])

    useEffect(() => {
        if (selected_model.cachedModelResults !== undefined) {
            setCachedModelResults(selected_model.cachedModelResults)
            setPredictionChartPalette(colorCombinations[selected_model.model_type][0])
            // setModelName(generateRandomModelName(selected_model.ticker_name, selected_model.period))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected_model.cachedModelResults])

    const syncVisibleRange = (param) => {
        const { from, to } = param
        const refs = [training_metrics_chart_ref, validation_metrics_chart_ref]
        refs.forEach((chartRef) => {
            if (chartRef.current) {
                chartRef.current.timeScale().setVisibleLogicalRange({ from, to });
                chartRef.current.clearCrosshairPosition();
            }
        });
    }

    const prevIndex = useRef(-1)
    const syncCrossHair = (param) => {
        if (
            param.point === undefined ||
            param.time === undefined ||
            param.point.x < 0 ||
            param.point.y < 0 ||
            param.paneIndex !== 0
        ) {
            [training_metrics_chart_ref, validation_metrics_chart_ref].forEach((chartRef) => {
                if (chartRef.current) {
                    chartRef.current.clearCrosshairPosition();
                    const tooltip = document.querySelector(`.model-hist-tooltip_${chartRef === training_metrics_chart_ref ? 'training_metrics' : 'validation_metrics'}_intermediate`);
                    if (tooltip) tooltip.innerHTML = '';
                }
            });
            prevIndex.current = -1
        } else {
            const idx = param.logical === 0 ? 0 : param.logical
            if (prevIndex.current !== idx) {
                // console.log('Crosshair move : INTER', idx, prevIndex.current)
                prevIndex.current = idx;
                [training_metrics_chart_ref, validation_metrics_chart_ref].forEach((chartRef) => {
                    if (chartRef.current) {
                        const tt = document.querySelector(`.model-hist-tooltip_${chartRef === training_metrics_chart_ref ? 'training_metrics' : 'validation_metrics'}_intermediate`)
                        const data = getChartDataByIndex(chartRef, idx)
                        chartRef.current.setCrosshairPosition(data['mape'].value, param.time, chartRef === training_metrics_chart_ref ? tm_chart_series_ref.current['mape'] : vm_chart_series_ref.current['mape'])
                        const tt_string = generateTooltipContent(param.time, data)
                        tt.innerHTML = tt_string
                    }
                })
            }
        }
    }

    // generates the tooltip content
    const generateTooltipContent = (epoch, data) => {
        const metricColors = Object.keys(predictionChartPalette).map(key => predictionChartPalette[key])

        let str = ''
        let finalStr = ''
        Object.keys(data).forEach((key, i) => {
            const { value: val } = data[key]
            str += `
                <div class='model-hist-tooltip-item'>
                    <div style="width:8px; height:8px; border-radius:10px; background-color:${metricColors[i]}"></div>
                    <span>&nbsp;</span>
                    <Typography class='model-hist-tooltip-item-key' style="display:flex; align-items:center; gap:4px;" variant='custom'>${key}</Typography>
                    <span>&nbsp;&nbsp</span>
                    <Typography class='model-hist-tooltip-item-value style="display:flex; align-items:center; gap:4px;" variant='custom'>${val.toFixed(7)}</Typography>
                </div>
                `
        })

        finalStr = `
            <div class='model-hist-main-box-wgan'>
                <div>
                    <Typography class='model-hist-tooltip-epoch' variant='custom'>Epoch ${epoch}</Typography>
                </div>
                <div class='model-hist-values'>
                    <div>
                        ${str === '' ? '' : str}
                    </div>
                </div>
            </div>
            `
        return finalStr
    }

    // Gets the chart data by index 
    const getChartDataByIndex = (chart, index) => {
        const seriesMap = chart.current._private__seriesMap
        // console.log(seriesMap)
        const keys = ['mse', 'sign', 'rmse', 'mae', 'mape']
        const result = {}
        let count = 0
        seriesMap.forEach((key, value) => {
            const data = value.dataByIndex(index)
            result[keys[count++]] = data
        })
        return result
    }

    // Syncing the tooltip
    useEffect(() => {
        if (syncTooltip && loss_chart_ref.current) {
            // console.log('UE : INTER Sync tooltip')
            loss_chart_ref.current.timeScale().subscribeVisibleLogicalRangeChange(syncVisibleRange)
            loss_chart_ref.current.subscribeCrosshairMove(syncCrossHair)
        } else {
            // console.log('UE : INER Un-sync tooltip')
            loss_chart_ref.current && loss_chart_ref.current.timeScale().unsubscribeVisibleLogicalRangeChange(syncVisibleRange)
            loss_chart_ref.current && loss_chart_ref.current.unsubscribeCrosshairMove(syncCrossHair)
        }

        return () => {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            loss_chart_ref.current && loss_chart_ref.current.timeScale().unsubscribeVisibleLogicalRangeChange(syncVisibleRange)
            // eslint-disable-next-line react-hooks/exhaustive-deps
            loss_chart_ref.current && loss_chart_ref.current.unsubscribeCrosshairMove(syncCrossHair)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [syncTooltip])

    // Handles model name change
    // const [modelName, setModelName] = useState('')
    // const handleModeNameChange = (event) => {
    //     setModelName(event.target.value)
    // }

    const handleLoadTrainingResults = ({ model_id }) => {
        // console.log('To load : ', model_id)
        if (selected_model_id === model_id) return

        dispatch(setSelectedModelId(model_id))
        setCachedModelResults({})
        loadedRef.current = false
    }

    const handleViewTrainingProgress = ({ model_id }) => {
        // console.log('View training progress : ', model_id)

        getModelTrainingStatus(token, model_id)
            .then(response => {
                // console.log(response.data)
                if (response.data.training_completed) {
                    dispatch(setTrainingCompleted({ model_id, model_train_end_time: response.data.model_train_end_time }))
                } else {
                    dispatch(setModelWSConnection({ model_id, connect: true }))
                }
            })
            .catch(error => {
                console.log(error)
            })
    }

    // Make a seperate component for the progress bar and include the socket code inside that. 

    return (
        <Box>
            {intermediateModels.length > 0 &&
                <Box p={2} display={'flex'} flexDirection={'column'} gap={1}>
                    <Typography variant='h4' textAlign='start'>Previous Runs</Typography>
                    {intermediateModels.map((model, index) => {
                        return (
                            <ModelRunInfo
                                key={index}
                                selected_model_id={selected_model_id}
                                model={model}
                                handleLoadTrainingResults={handleLoadTrainingResults}
                                handleViewTrainingProgress={handleViewTrainingProgress}
                                cachedModelResults={cachedModelResults}
                                selected_model={selected_model}
                            />
                        )
                    })}
                </Box>
            }
            {selected_model_id !== '' && Object.keys(cachedModelResults).length === 2 &&
                <Box p={2}>
                    <Paper
                        elevtion={12}
                        className='model-parameter-expandd-collapse-box'
                        sx={{
                            marginTop: '8px',
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            boxShadow: `${collapseResults && 'none'}`,
                            paddingLeft: '4px'
                        }}
                    >
                        <Typography variant='h5'>Result Charts</Typography>
                        <IconButton sx={{ padding: '6px' }} onClick={toggleCollapseResults.bind(null, {})}>
                            {collapseResults ? <ArrowDropUpIcon className='small-icon' /> : <ArrowDropDownIcon className='small-icon' />}
                        </IconButton>
                    </Paper>
                    <Collapse in={collapseResults} timeout='auto'>

                        <Grid container spacing={1} pt={2} >
                            <Grid item md={6} lg={6} xl={4} sx={{ width: '100%' }}>
                                <Box display={'flex'} flexDirection={'column'} gap={'8px'}>
                                    <Box display={'flex'} justifyContent={'flex-start'}>
                                        <Typography variant='h5'>Prediction Chart</Typography>
                                    </Box>

                                    <WganFinalPredictionChart
                                        wgan_final_forecast={cachedModelResults.cached_data.predictions}
                                        trainingStartedFlag={false}
                                        for_='intermediate'
                                    />
                                </Box>
                            </Grid>

                            {cachedModelResults.cached_data?.intermediate_forecast.length > 0 &&
                                <Grid item md={6} lg={6} xl={4} sx={{ width: '100%' }}>
                                    <Box display='flex' flexDirection='column'>
                                        <IntermediateForecastChart
                                            intermediate_forecasts={cachedModelResults.cached_data.intermediate_forecast}
                                            for_='intermediate'
                                            collapseResults={collapseResults}
                                        />
                                    </Box>
                                </Grid>
                            }

                            <Grid item xl={4} sx={{ width: '100%' }}></Grid>

                            <Grid item md={6} lg={6} xl={4} sx={{ width: '100%' }}>
                                <Box gap={'8px'} display='flex' flexDirection='column'>
                                    <WgangpMetricsChart
                                        type={'losses'}
                                        epochResults={cachedModelResults.cached_data.epoch_results}
                                        predictionsPalette={predictionChartPalette}
                                        metricsChartReload={false}
                                        for_='intermediate'
                                        chart={loss_chart_ref}
                                        metricLineSeriesRef={l_chart_series_ref}
                                        syncTooltip={syncTooltip}
                                        setSyncTooltip={setSyncTooltip}
                                    />
                                </Box>
                            </Grid>

                            <Grid item md={6} lg={6} xl={4} sx={{ width: '100%' }}>
                                <Box gap={'8px'} display='flex' flexDirection='column'>
                                    <WgangpMetricsChart
                                        epochResults={cachedModelResults.cached_data.epoch_results}
                                        type={'training_metrics'}
                                        predictionsPalette={predictionChartPalette}
                                        metricsChartReload={false}
                                        for_='intermediate'
                                        chart={training_metrics_chart_ref}
                                        metricLineSeriesRef={tm_chart_series_ref}
                                        syncTooltip={syncTooltip}
                                    />
                                </Box>
                            </Grid>

                            {cachedModelResults.cached_data.training_parameters.do_validation &&
                                <Grid item md={6} lg={6} xl={4} sx={{ width: '100%' }}>
                                    <Box display='flex' flexDirection='column'>
                                        <WgangpMetricsChart
                                            epochResults={cachedModelResults.cached_data.epoch_results}
                                            type={'validation_metrics'}
                                            predictionsPalette={predictionChartPalette}
                                            metricsChartReload={false}
                                            for_='intermediate'
                                            chart={validation_metrics_chart_ref}
                                            metricLineSeriesRef={vm_chart_series_ref}
                                            syncTooltip={syncTooltip}
                                        />
                                    </Box>
                                </Grid>
                            }

                        </Grid>
                    </Collapse>
                </Box>
            }
        </Box>
    )
}

export default IntermediateModels