import { InfoOutlinedIcon } from '../../../../global/Icons'
import { ErrorBoundary } from "react-error-boundary";
import { useSelector } from "react-redux";
import CustomSlider from './CustomSlider'
import React, { useEffect } from 'react'
import {
    Box,
    Paper,
    Typography,
    Tooltip
} from '@mui/material'

import {
    NoMaxWidthTooltip
    , ClassificationTable
    , calculateTolerance
} from "../../modules/CryptoModuleUtils";

const logError = (error, info) => {
    // Do something with the error, e.g. log to an external API
    console.log('error', error)
};

const tolerance = 1
const CRITERIA_DATA = [
    { Condition: 'TP', Criteria: `Prediction is within ${tolerance}%, class of interest belongs to - actual > predicted.` },
    { Condition: 'FP', Criteria: `Prediction is within ${tolerance}%, class of interest belongs to - actual < predicted.` },
    { Condition: 'FN', Criteria: `Prediction is outside ${tolerance}%, class of interest belongs to - actual > predicted.` },
    { Condition: 'TN', Criteria: `Prediction is outside ${tolerance}%, class of interest belongs to - actual < predicted.` },
]

const PredictionMetricsWganpg = ({
    predictionLookAhead
    , lookAhead
    , trainingStartedFlag
    , setPredictionLookAhead
}) => {
    const wgan_predictions = useSelector(state => state.cryptoModule.modelData.wgan_final_forecast.predictions)
    const wgan_rmse = useSelector(state => state.cryptoModule.modelData.wgan_final_forecast.rmse)
    const [allMetrics, setAllMetrics] = React.useState({})
    const [metrics, setMetrics] = React.useState({})
    const handelPredictionLookAheadSlider = (name, value) => {
        setPredictionLookAhead(value)
        // console.log(value)

        const rmse = wgan_rmse[`period_${value}`]
        // console.log(rmse)
        const final = {
            ...allMetrics[`${value - 1}`],
            rmse: parseFloat(rmse),
            mse: rmse * rmse
        }
        setMetrics(final)
    }

    const [tolerance, setTolerance] = React.useState(1)
    const handleToleranceChange = (event, newValue) => {
        console.log('tolerance', newValue)
        setTolerance(newValue)
    }

    useEffect(() => {
        if (wgan_predictions.length > 0) {
            const toleranceArray = {}
            let transformed = Object.keys(wgan_predictions[0]).filter((key) => key !== 'date' && key !== 'actual').map((key) => {
                return {
                    key: key,
                    data: []
                }
            })

            wgan_predictions.forEach((element) => {
                const actual = element.actual
                Object.keys(element).forEach((key) => {
                    if (key !== 'date' && key !== 'actual') {
                        const newObj = {
                            actual: actual,
                            predicted: element[key]
                        }
                        transformed[key].data.push(newObj)
                    }
                })
            })

            Object.keys(transformed).forEach((key) => {
                const metrics = calculateTolerance(transformed[key].data, tolerance)
                toleranceArray[key] = metrics
            })
            // console.log('toleranceArray', toleranceArray)
            setAllMetrics(toleranceArray)

            const rmse = wgan_rmse[`period_${1}`]
            const final = {
                ...toleranceArray[`${0}`],
                rmse: parseFloat(rmse),
                mse: rmse * rmse
            }
            setMetrics(final)
        } else if(wgan_predictions.length === 0) {
            setAllMetrics({})
            setMetrics({})
        }

        // return () => {
            // setAllMetrics({})
            // setMetrics({})
        // }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wgan_predictions, tolerance])



    return (
        <ErrorBoundary onError={logError} fallback={<div>Something went wrong</div>}>
            <Paper elevation={4} sx={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 4px' }}>
                {(predictionLookAhead && lookAhead > 1) &&
                    <Box gap={1} className='wgan-prediction-tolerance-slider'>
                        <Box className='prediction-lookahead-slider-box'>
                            <CustomSlider
                                sliderValue={predictionLookAhead}
                                name={'prediction_look_ahead'}
                                handleModelParamChange={handelPredictionLookAheadSlider}
                                label={'Pred Look Ahead'}
                                min={1}
                                max={lookAhead}
                                sliderMin={1}
                                sliderMax={lookAhead}
                                disabled={trainingStartedFlag} />
                        </Box>
                        <Box className='tolerance-slider-box'>
                            <CustomSlider
                                sliderValue={tolerance}
                                name={'tolerance'}
                                handleModelParamChange={handleToleranceChange}
                                label={'Tolerance Value'}
                                min={1}
                                max={20}
                                sliderMin={1}
                                sliderMax={20}
                                disabled={trainingStartedFlag} />
                        </Box>
                    </Box>
                }
                <Box display='flex' flexDirection='column' gap='5px'>
                    {Object.keys(metrics).length > 0 && (
                        <Box display='flex' flexDirection='column' gap='4px' className='model-metrics-calculated-box'>
                            <Box className='model-metrics-calculated-box-paper'>

                                <Box display='flex' flexDirection='row' justifyContent='space-between' width='100%' gap='5px'>
                                    <Box display='flex' flexDirection='row' gap='16px' width='95%' justifyContent='space-between' className='model-metrics'>
                                        <Paper className='metricpaper-indi' elevation={2}>
                                            <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>TP</span> : {metrics.TP}</Typography>
                                            <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>FP</span> : {metrics.FP}</Typography>
                                            <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>FN</span> : {metrics.FN}</Typography>
                                            <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>TN</span> : {metrics.TN}</Typography>
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
                                            <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>Accuracy</span> : {metrics.accuracy}</Typography>
                                            <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>Precision</span> : {metrics.precision}</Typography>
                                            <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>F1</span> : {metrics.f1}</Typography>
                                            <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>Recall</span> : {metrics.recall}</Typography>
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

                                <Box display='flex' flexDirection='row' justifyContent='space-between' width='100%' gap='5px'>
                                    <Box display='flex' flexDirection='row' gap='16px' width='95%' alignItems='center' justifyContent='space-between' className='model-metrics'>
                                        <Paper className='metricpaper-indi-two' elevation={2}>
                                            <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>MSE</span> : {metrics.rmse.toFixed(2)}</Typography>
                                            <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>RMSE</span> : {metrics.mse.toFixed(2)}</Typography>
                                        </Paper>
                                    </Box>
                                    <Tooltip title='Prediction chart RMSE and MSE'>
                                        <InfoOutlinedIcon className='small-icon' />
                                    </Tooltip>
                                </Box>

                            </Box>
                        </Box>
                    )}
                </Box>
            </Paper>
        </ErrorBoundary>
    )
}

export default PredictionMetricsWganpg