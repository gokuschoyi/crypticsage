import React from 'react'
import CustomSlider from './CustomSlider'
import { InfoOutlinedIcon } from '../../../../global/Icons'
import { NoMaxWidthTooltip, ClassificationTable } from '../../modules/CryptoModuleUtils'
import {
    Box,
    Paper,
    Typography,
    Tooltip
} from '@mui/material'
const tolerance = 1
const CRITERIA_DATA = [
    { Condition: 'TP', Criteria: `Prediction is within ${tolerance}%, class of interest belongs to - actual > predicted.` },
    { Condition: 'FP', Criteria: `Prediction is within ${tolerance}%, class of interest belongs to - actual < predicted.` },
    { Condition: 'FN', Criteria: `Prediction is outside ${tolerance}%, class of interest belongs to - actual > predicted.` },
    { Condition: 'TN', Criteria: `Prediction is outside ${tolerance}%, class of interest belongs to - actual < predicted.` },
]
const PredictionMetrics = ({
    predictionLookAhead,
    model_parameters,
    modelMetrics,
    predictionChartType,
    trainingStartedFlag,
    handelPredictionLookAheadSlider
}) => {
    return (
        <Paper elevation={4} sx={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 4px' }}>
            {(predictionLookAhead && model_parameters.lookAhead > 1) &&
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
                                            <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>MSE</span> : {predictionChartType === 'scaled' ? modelMetrics.mse.mse.toFixed(2) : modelMetrics.mse.mse}</Typography>
                                            <Typography variant='custom' textAlign='start'><span style={{ fontWeight: 'bold' }}>RMSE</span> : {predictionChartType === 'scaled' ? modelMetrics.mse.rmse.toFixed(2) : modelMetrics.mse.rmse}</Typography>
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
    )
}

export default PredictionMetrics