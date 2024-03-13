import { ErrorBoundary } from "react-error-boundary";
import React from 'react'
import { Box, useTheme, useMediaQuery } from '@mui/material'
import { useSelector } from 'react-redux'
import ModelHistoryChart from './ModelHistoryChart'
import CorelationMatrix from './CorelationMatrix'
import PredictionMetrics from './PredictionMetrics'
import TrainingLossTable from './TrainingLossTable'
import PredictionScoresTable from './PredictionScoresTable'
import BatchProgress from './BatchProgress'
import EvaluationProgress from './EvaluationProgress'

const logError = (error, info) => {
    // Do something with the error, e.g. log to an external API
    console.log('error', error)
};


const TrainingResultsLSTM = ({
    predictionChartPalette,
    predictionLookAhead,
    modelMetrics,
    predictionChartType,
    trainingStartedFlag,
    setPredictionLookAhead,
    batchResult,
    batchLinearProgressRef,
    evaluating,
    evalLinearProgressRef
}) => {
    const theme = useTheme()
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    const model_data = useSelector(state => state.cryptoModule.modelData)
    const selectedTickerPeriod = useSelector(state => state.cryptoModule.selectedTickerPeriod)
    const model_parameters = useSelector(state => state.cryptoModule.modelData.training_parameters)
    const epochResults = model_data.epoch_results
    const correlation_data_redux = model_data.correlation_data
    const predictedVlauesRedux = model_data.predictedValues.dates

    const handelPredictionLookAheadSlider = (name, value) => {
        setPredictionLookAhead(value)
    }
    
    return (
        <ErrorBoundary onError={logError} fallback={<div>Something went wrong</div>}>
            <Box display='flex' flexDirection={'column'} gap={'4px'}>
                {/* epoch end results plotting on chart */}
                {model_parameters.epoch > 2 &&
                    <ModelHistoryChart
                        epochResults={epochResults}
                        predictionsPalette={predictionChartPalette}
                        isValidatingOnTestSet={model_parameters.doValidation}
                        totalEpochs={model_parameters.epoch}
                    />
                }

                {(correlation_data_redux && correlation_data_redux.length > 0) &&
                    <CorelationMatrix
                        transformation_order={model_parameters.transformation_order}
                        correlation_data_redux={correlation_data_redux}
                    />
                }

                {/* Prediction set metrics */}
                {(predictedVlauesRedux.length !== 0) &&
                    <PredictionMetrics
                        predictionLookAhead={predictionLookAhead}
                        model_parameters={model_parameters}
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
        </ErrorBoundary>
    )
}

export default TrainingResultsLSTM