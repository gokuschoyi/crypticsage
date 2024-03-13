import React from 'react'
import { Box, Grid } from '@mui/material'
import WgangpMetricsChart from './WgangpMetricsChart'
import IntermediateForecastChart from './IntermediateForecastChart'
import { useSelector } from 'react-redux'

const WganTrainingResults = ({
    predictionChartPalette
}) => {
    const epochResults = useSelector(state => state.cryptoModule.modelData.epoch_results)
    const intermediate_forecasts = useSelector(state => state.cryptoModule.modelData.wgan_intermediate_forecast)
    const doValidation = useSelector(state => state.cryptoModule.modelData.training_parameters.doValidation)
    return (
        <Box>
            {epochResults.length > 0 &&
                <Grid container>
                    <Grid item md={6} lg={6} xl={4} p={2} sx={{ width: '100%' }}> {/* training losses d and g */}
                        <Box gap={'8px'} display='flex' flexDirection='column'>
                            <WgangpMetricsChart
                                epochResults={epochResults}
                                type={'losses'}
                                predictionsPalette={predictionChartPalette}
                            />
                        </Box>
                    </Grid>
                    {/* training metrics g */}
                    <Grid item md={6} lg={6} xl={4} p={2} sx={{ width: '100%' }}>
                        <Box gap={'8px'} display='flex' flexDirection='column'>
                            <WgangpMetricsChart
                                epochResults={epochResults}
                                type={'training_metrics'}
                                predictionsPalette={predictionChartPalette}
                            />
                        </Box>
                    </Grid>

                    {doValidation &&
                        <Grid item md={6} lg={6} xl={4} p={2} sx={{ width: '100%' }}>
                            <Box gap={'8px'} display='flex' flexDirection='column'>
                                <WgangpMetricsChart
                                    epochResults={epochResults}
                                    type={'validation_metrics'}
                                    predictionsPalette={predictionChartPalette}
                                />
                            </Box>
                        </Grid>
                    }

                    {intermediate_forecasts.length > 0 &&
                        <Grid item md={6} lg={6} xl={4} p={2} sx={{ width: '100%' }}>
                            <IntermediateForecastChart
                                intermediate_forecasts={intermediate_forecasts}
                            />
                        </Grid>
                    }
                </Grid>
            }
        </Box>
    )
}

export default WganTrainingResults