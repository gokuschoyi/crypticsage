import { Indicators } from '../components/IndicatorDescription';
import { setPredictionPaletteId } from './CryptoModuleSlice'
import React, { useState, useEffect, useRef } from 'react'
import { formatMillisecond } from './CryptoModuleUtils'
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import useWebSocket from './WebSocket';

import {
    Box
    , Typography
    , Grid
    , useTheme
    , useMediaQuery
} from '@mui/material'

import {
    TrainingParameters
    , PredictionOptions
    , PredictionsChart
    , CorelationMatrix
    , WGANGPProgress
    , WgangpOptions
    , MainChartNew
    , WganTrainingResults
    , LstmTrainingResults
    , WganFinalPredictionChart
    , PredictionMetricsWganpg
    , SavedModelForecasting
} from '../components'

const colorCombinations = {
    "LSTM": [
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
    ],
    "WGAN-GP": [
        {
            actual: '#C200FB',
            two: '#EC0868',
            three: '#FC2F00',
            four: '#EC7D10',
            five: '#FFBC0A',
        },
        {
            actual: '#DF2935',
            two: '#86BA90',
            three: '#F5F3BB',
            four: '#CE506E',
            five: '#DEA000',
        },
        {
            actual: '#F46036',
            two: '#2E294E',
            three: '#1B998B',
            four: '#E71D36',
            five: '#C5D86D',
        },
        {
            one: '#053225',
            actual: '#E34A6F',
            three: '#F7B2BD',
            four: '#B21198',
            five: '#60A561',
        },
        {
            actual: '#F72585',
            two: '#7209B7',
            three: '#3A0CA3',
            four: '#32CD75',
            five: '#4CC9F0',
        },
        {
            actual: '#713E5A',
            two: '#63A375',
            three: '#EDC79B',
            four: '#D57A66',
            five: '#CA6680',
        }
    ]
};

const MODEL_OPTIONS_VALUE = {
    "LSTM": "multi_input_single_output_step",
    "WGAN-GP": "GAN"
}

const CryptoModule = () => {
    const dispatch = useDispatch();
    const { cryptotoken } = useParams();
    const module = window.location.href.split("/dashboard/indicators/")[1].split("/")[0]
    const modelProcessDurationRef = useRef('')
    const theme = useTheme();
    const sm = useMediaQuery(theme.breakpoints.down('sm'));

    const selectedTickerPeriod = useSelector(state => state.cryptoModule.selectedTickerPeriod)
    // const selectedTickerName = useSelector(state => state.cryptoModule.selectedTickerName)
    const selectedFunctions = useSelector(state => state.cryptoModule.selectedFunctions)

    let defaultFetchValues = {
        asset_type: module,
        ticker_name: cryptotoken,
        period: selectedTickerPeriod,
        page_no: 1,
        items_per_page: 500
    }

    const [fetchValues, setFetchValues] = useState(defaultFetchValues)
    useEffect(() => {
        setFetchValues({
            asset_type: module,
            ticker_name: cryptotoken,
            period: selectedTickerPeriod,
            page_no: 1,
            items_per_page: 500
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTickerPeriod])

    // Model training parameters
    const model_data = useSelector(state => state.cryptoModule.modelData)
    // const userModels = useSelector(state => state.cryptoModule.userModels)
    const model_parameters = model_data.training_parameters
    const [modelParams, setModelParams] = useState({ ...model_parameters })
    const [transformationOrder, setTransformationOrder] = useState(model_parameters.transformation_order)

    const [modelMetrics, setModelMetrics] = useState({ metrics: {}, mse: {} }) // only for LSTM model
    const [predictionChartType, setPredictionChartType] = React.useState('standardized') // only for LSTM model

    useEffect(() => { // resetting to default on any reset button click
        // console.log('UE : setting model parameters')
        setModelParams(() => ({ ...model_parameters }))
    }, [model_parameters])


    useEffect(() => { // Calculates the model training time
        // console.log('UE : Calculating model training time')
        if (model_data.modelEndTime !== '' && model_data.modelStartTime !== '') {
            const diff = model_data.modelEndTime - model_data.modelStartTime
            modelProcessDurationRef.current = formatMillisecond(diff)
        } else {
            // console.log('Process tome not available')
            modelProcessDurationRef.current = ''
        }
    }, [model_data.modelEndTime, model_data.modelStartTime])

    // Elapsed time since model training started
    // const [elapsed, setElapsed] = useState(0)
    // useEffect(() => {
    //     let interval
    //     if (model_data.modelStartTime !== '' && model_data.modelEndTime === '') {
    //         // console.log('Training started')
    //         interval = setInterval(() => {
    //             const currentTime = new Date().getTime()
    //             const diff = currentTime - model_data.modelStartTime
    //             setElapsed(formatMillisecond(diff))
    //         }, 100)
    //     } else if (model_data.modelStartTime !== '' && model_data.modelEndTime !== '') {
    //         // console.log('Training completed or not started yet')
    //         setElapsed(0)
    //         clearInterval(interval)
    //     }

    //     return () => clearInterval(interval);
    // }, [model_data.modelStartTime, model_data.modelEndTime])

    const predictedVlauesRedux = useSelector(state => state.cryptoModule.modelData.predictedValues.dates)


    const [predictionLookAhead, setPredictionLookAhead] = useState(1) //for slider

    const paletteIdRedux = useSelector(state => state.cryptoModule.modelData.predictionPaletteId)
    const [predictionChartPalette, setPredictionChartPalette] = useState(colorCombinations[modelParams.modelType][paletteIdRedux])
    const handlePredictionChartPalette = ({ id }) => {
        // console.log(id)
        dispatch(setPredictionPaletteId(id))
        setPredictionChartPalette(colorCombinations[modelParams.modelType][id])
    }

    // websocket to get model training progress
    const userId = useSelector(state => state.auth.uid)
    const webSocketURL = process.env.NODE_ENV === 'development' ? `${process.env.REACT_APP_BASE_WEB_SOCKET_URL}/?user_id=${userId}` : `${process.env.REACT_APP_DEV_WEBSOCKET_URL}/?user_id=${userId}`;
    const startWebSocket = useSelector(state => state.cryptoModule.modelData.startWebSocket)

    const notifyMessageBoxRef = useRef(null)
    const wgan_final_forecast = useSelector(state => state.cryptoModule.modelData.wgan_final_forecast.predictions)
    const correlation_data_redux = useSelector(state => state.cryptoModule.modelData.correlation_data)

    const retrainigFlag = useSelector(state => state.cryptoModule.modelData.retraining_flag)

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
        retrainigFlag,
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

    const [metricsChartReload, setMetricsChartReload] = useState(true)
    useEffect(() => {
        if (retrainigFlag) {
            // console.log('Retraining flag is true')
            setTrainingStartedFlag(true)
        } else {
            // console.log('Retraining flag is false')
            setTrainingStartedFlag(false)
        }
    }, [retrainigFlag])

    const [retrainHistSavePrompt, setRetrainHistSavePrompt] = useState({ flag: false, retrain_checkpoint: '' })

    return (
        <Box className='crypto-module-container'>
            <Box m={sm ? 1 : 2} className='crypto-module-container-box'>

                <Box className='indicator-chart-grid'> {/* Main chart */}
                    <MainChartNew
                        predictedVlauesRedux={predictedVlauesRedux.length > 0 ? true : false}
                        lookAhead={model_parameters.lookAhead}
                        predictionLookAhead={predictionLookAhead}
                        setPredictionLookAhead={setPredictionLookAhead}
                        selectedFunctions={selectedFunctions}
                    />
                </Box>

                {/* Model training parameters */}
                <Box mb={2} mt={2} className='model-training-container'>
                    <Box className='tensor-flow-grid' p={2} >
                        <TrainingParameters
                            modelParams={modelParams}
                            setModelParams={setModelParams}
                            transformationOrder={transformationOrder}
                            setTransformationOrder={setTransformationOrder}
                            trainingStartedFlag={trainingStartedFlag}
                            setTrainingStartedFlag={setTrainingStartedFlag}
                            modelProcessDurationRef={modelProcessDurationRef}
                            setRetrainHistSavePrompt={setRetrainHistSavePrompt}
                            setMetricsChartReload={setMetricsChartReload}
                        />
                    </Box>
                </Box>

                <Box mb={2} mt={2} className='model-training-results'> {/* Model training results LSTM and WGAN-GP */}
                    {modelParams.modelType === 'LSTM' ?
                        <Grid container className='tensor-flow-grid' > {/* lstm model training results */}
                            <Grid item md={12} lg={6} xl={6} p={2} sx={{ width: '100%' }}>
                                <Box gap={'8px'} display='flex' flexDirection='column'>
                                    <Box display='flex' flexDirection='column' alignItems='start'>
                                        <Typography variant={predictedVlauesRedux.length !== 0 ? 'h6' : 'h5'} textAlign='start'>
                                            Predictions {predictedVlauesRedux.length !== 0 ? predictionChartType === 'scaled' ? '- original' : `- ${predictionChartType}` : ''}
                                        </Typography>
                                    </Box>

                                    <PredictionsChart // Prediction chart LSTM
                                        predictionChartType={predictionChartType}
                                        trainingStartedFlag={startWebSocket}
                                        model_type={MODEL_OPTIONS_VALUE[modelParams.modelType]}
                                        lookAhead={model_parameters.lookAhead}
                                        predictionLookAhead={predictionLookAhead}
                                        setModelMetrics={setModelMetrics}
                                        predictionsPalette={predictionChartPalette}
                                    />
                                    {predictedVlauesRedux.length !== 0 &&
                                        <PredictionOptions // Prediction options for LSTM
                                            colorCombinations={colorCombinations[modelParams.modelType]}
                                            paletteIdRedux={paletteIdRedux}
                                            handlePredictionChartPalette={handlePredictionChartPalette}
                                            savedToDb={model_data.model_saved_to_db}
                                            modelProcessDurationRef={modelProcessDurationRef}
                                            predictionChartType={predictionChartType}
                                            setPredictionChartType={setPredictionChartType}
                                            retrainHistSavePrompt={retrainHistSavePrompt}
                                            setRetrainHistSavePrompt={setRetrainHistSavePrompt}
                                        />
                                    }
                                </Box>
                            </Grid>

                            <Grid item md={12} lg={6} xl={6} p={2} sx={{ width: '100%' }}> {/* lstm model training results */}
                                <Box className='main-training-status-box' gap={'8px'} display='flex' flexDirection='column'>
                                    <Typography sx={{ textAlign: 'start' }} variant='h6'>
                                        {modelProcessDurationRef.current !== '' ? `Time taken : ${modelProcessDurationRef.current}` : ''}
                                    </Typography>

                                    <LstmTrainingResults // LSTM model training results
                                        predictionChartPalette={predictionChartPalette}
                                        predictionLookAhead={predictionLookAhead}
                                        modelMetrics={modelMetrics}
                                        predictionChartType={predictionChartType}
                                        trainingStartedFlag={trainingStartedFlag}
                                        setPredictionLookAhead={setPredictionLookAhead}
                                        batchResult={batchResult}
                                        batchLinearProgressRef={batchLinearProgressRef}
                                        evaluating={evaluating}
                                        evalLinearProgressRef={evalLinearProgressRef}
                                    />
                                </Box>
                            </Grid>
                        </Grid>
                        :
                        <Box className='tensor-flow-grid' display='flex' flexDirection='column'> {/* wgan-gp model training results */}
                            <Grid container className='tensor-flow-grid'>
                                <Grid item md={6} lg={6} xl={6} p={2} sx={{ width: '100%' }}> {/* wgan-gp model training results */}
                                    <Box display={'flex'} flexDirection={'column'} gap={'8px'}>
                                        <Box display='flex' flexDirection='column' alignItems='start'>
                                            <Typography variant={wgan_final_forecast.length !== 0 ? 'h5' : 'h4'} textAlign='start'>
                                                Predictions
                                            </Typography>
                                        </Box>

                                        <WganFinalPredictionChart // Prediction chart WGAN-GP
                                            wgan_final_forecast={wgan_final_forecast}
                                            trainingStartedFlag={trainingStartedFlag}
                                        />

                                        {wgan_final_forecast.length > 0 &&
                                            <WgangpOptions // Prediction options for WGAN-GP
                                                colorCombinations={colorCombinations[modelParams.modelType]}
                                                paletteIdRedux={paletteIdRedux}
                                                handlePredictionChartPalette={handlePredictionChartPalette}
                                                savedToDb={model_data.model_saved_to_db}
                                                modelProcessDurationRef={modelProcessDurationRef}
                                                setMetricsChartReload={setMetricsChartReload}
                                                retrainHistSavePrompt={retrainHistSavePrompt}
                                                setRetrainHistSavePrompt={setRetrainHistSavePrompt}
                                            />
                                        }
                                    </Box>
                                </Grid>

                                <Grid item md={6} lg={6} xl={6} p={2} sx={{ width: '100%' }}> {/* wgan-gp model training results */}
                                    <Typography
                                        sx={{ textAlign: 'start', padding: '4px 0px 4px 4px' }}
                                        variant='h6'>
                                        {modelProcessDurationRef.current !== '' ? `Time taken : ${modelProcessDurationRef.current}` : ''}
                                    </Typography>

                                    {(correlation_data_redux && correlation_data_redux.length === model_parameters.transformation_order.length) &&
                                        <CorelationMatrix
                                            transformation_order={model_parameters.transformation_order}
                                            correlation_data_redux={correlation_data_redux}
                                        />
                                    }
                                    {wgan_final_forecast.length > 0 &&
                                        <PredictionMetricsWganpg
                                            predictionLookAhead={predictionLookAhead}
                                            lookAhead={model_parameters.lookAhead}
                                            trainingStartedFlag={trainingStartedFlag}
                                            setPredictionLookAhead={setPredictionLookAhead}
                                        />
                                    }

                                    {/* epoch batch results */}
                                    {batchResult &&
                                        <WGANGPProgress
                                            wgangpProgressRef={wgangpProgressRef}
                                        />
                                    }
                                </Grid>
                            </Grid>

                            <WganTrainingResults predictionChartPalette={predictionChartPalette} metricsChartReload={metricsChartReload} /> {/* WGAN-GP model training results charts */}
                        </Box>
                    }
                </Box>

                {/* User saved models both LSTM & WGAN-GP */}
                <Box className='user-saved-models-container'>
                    <SavedModelForecasting />
                </Box>

                <Indicators symbol={cryptotoken} fetchValues={fetchValues} />
            </Box >
        </Box >
    )
}

export default CryptoModule