import React, { useState, useEffect, useRef } from 'react'
import { Box, Grid } from '@mui/material'
import WgangpMetricsChart from './WgangpMetricsChart'
import IntermediateForecastChart from './IntermediateForecastChart'
import { useSelector } from 'react-redux'

const WganTrainingResults = ({
    predictionChartPalette,
    metricsChartReload
}) => {
    const epochResults = useSelector(state => state.cryptoModule.modelData.epoch_results)
    const intermediate_forecasts = useSelector(state => state.cryptoModule.modelData.wgan_intermediate_forecast)
    const doValidation = useSelector(state => state.cryptoModule.modelData.training_parameters.doValidation)

    const loss_chart_ref = useRef(null)
    const training_metrics_chart_ref = useRef(null)
    const validation_metrics_chart_ref = useRef(null)

    const l_chart_series_ref = useRef({})
    const tm_chart_series_ref = useRef({})
    const vm_chart_series_ref = useRef({})

    const [syncTooltip, setSyncTooltip] = useState(false)

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

    const syncVisibleRange = (param) => {
        const { from, to } = param
        // console.log(from, to)
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
                    const tooltip = document.querySelector(`.model-hist-tooltip_${chartRef === training_metrics_chart_ref ? 'training_metrics' : 'validation_metrics'}_`);
                    if (tooltip) tooltip.innerHTML = '';
                }
            });
            prevIndex.current = -1
        } else {
            const idx = param.logical === 0 ? 0 : param.logical
            if (prevIndex.current !== idx) {
                // console.log('Crosshair move : PRED', idx, prevIndex.current)
                prevIndex.current = idx;
                [training_metrics_chart_ref, validation_metrics_chart_ref].forEach((chartRef) => {
                    if (chartRef.current) {
                        const tt = document.querySelector(`.model-hist-tooltip_${chartRef === training_metrics_chart_ref ? 'training_metrics' : 'validation_metrics'}_`)
                        const data = getChartDataByIndex(chartRef, idx)
                        chartRef.current.setCrosshairPosition(data['mape'].value, param.time, chartRef === training_metrics_chart_ref ? tm_chart_series_ref.current['mape'] : vm_chart_series_ref.current['mape'])
                        const tt_string = generateTooltipContent(param.time, data)
                        tt.innerHTML = tt_string
                    }
                })
            }
        }
    }

    useEffect(() => {
        if (syncTooltip && loss_chart_ref.current) {
            // console.log('UE : PRED Sync tooltip')
            loss_chart_ref.current.timeScale().subscribeVisibleLogicalRangeChange(syncVisibleRange)
            loss_chart_ref.current.subscribeCrosshairMove(syncCrossHair)
        } else {
            // console.log('UE : PRED Un-sync tooltip')
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
                                metricsChartReload={metricsChartReload}
                                for_=''
                                chart={loss_chart_ref}
                                metricLineSeriesRef={l_chart_series_ref}
                                syncTooltip={syncTooltip}
                                setSyncTooltip={setSyncTooltip}
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
                                metricsChartReload={metricsChartReload}
                                for_=''
                                chart={training_metrics_chart_ref}
                                metricLineSeriesRef={tm_chart_series_ref}
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
                                    metricsChartReload={metricsChartReload}
                                    for_=''
                                    chart={validation_metrics_chart_ref}
                                    metricLineSeriesRef={vm_chart_series_ref}
                                />
                            </Box>
                        </Grid>
                    }

                    {intermediate_forecasts.length > 0 &&
                        <Grid item md={6} lg={6} xl={4} p={2} sx={{ width: '100%' }}>
                            <IntermediateForecastChart
                                intermediate_forecasts={intermediate_forecasts}
                                for_=''
                                collapseResults={true}
                            />
                        </Grid>
                    }
                </Grid>
            }
        </Box>
    )
}

export default WganTrainingResults