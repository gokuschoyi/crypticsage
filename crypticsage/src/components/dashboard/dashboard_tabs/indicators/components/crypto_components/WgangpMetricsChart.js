import { ErrorBoundary } from "react-error-boundary";
import React, { useEffect, useRef } from 'react'
import { Box, useTheme, Typography, FormControlLabel, Switch } from '@mui/material'
import { createChart } from 'lightweight-charts';
import { useDispatch, useSelector } from "react-redux";
import { setPartialChartResetFlag } from '../../modules/CryptoModuleSlice'

const logError = (error, info) => {
    // Do something with the error, e.g. log to an external API
    console.log('error', error)
};

const WgangpMetricsChart = (props) => {
    const dispatch = useDispatch()
    const { type, epochResults, predictionsPalette, metricsChartReload, for_ } = props
    const { syncTooltip, setSyncTooltip, chart, metricLineSeriesRef } = props
    const retrainFlag = useSelector(state => state.cryptoModule.modelData.retraining_flag)
    const partialResetChartFlag = useSelector(state => state.cryptoModule.partial_chart_reset_flag)
    const theme = useTheme()
    const chartBackgroundColor = theme.palette.background.default
    const textColor = theme.palette.primary.newWhite
    const chartContainerRef = useRef()

    const chart_options = {
        autoSize: true,
        rightPriceScale: {
            borderColor: 'rgba(197, 203, 206, 0.8)',
            axisLabelVisible: false,
        },
        leftPriceScale: {
            visible: type === 'training_metrics' || type === 'validation_metrics',
        },
        layout: {
            background: {
                type: 'solid',
                color: chartBackgroundColor,
            },
            textColor: textColor,
        },
        grid: {
            vertLines: {
                visible: true,
                color: textColor,
                style: 4,
            },
            horzLines: {
                visible: false,
                color: textColor,
                style: 4
            },
        },
        timeScale: {
            visible: false,
        },
        crosshair: {
            mode: 1
        }
    }

    const render_chart = () => {
        const metricColors = Object.keys(predictionsPalette).map(key => predictionsPalette[key])
        chart.current = createChart(chartContainerRef.current, chart_options);
        chart.current.timeScale().fitContent()

        // const data = epochResults.map((epochResult, index) => {
        //     return epochResult[type]
        // })

        const testData = epochResults.map((epochResult, index) => {
            return ({
                ...epochResult[type],
                epoch: epochResult.epoch
            })
        })
        // console.log(testData)

        const dataKeys = Object.keys(testData[0]).filter(key => key !== 'epoch')
        let baseOptions = {
            lineWidth: 2,
            lineType: 0,
            priceLineVisible: false,
        };

        dataKeys.forEach((key, index) => {
            const lineData = testData.map((metric, index) => {
                return { time: metric.epoch, value: metric[key] }
            })
            // console.log(lineData)

            baseOptions = { ...baseOptions, color: metricColors[index] }

            if (type === 'training_metrics' || type === 'validation_metrics') {
                if (key === 'mape') {
                    baseOptions = {
                        ...baseOptions,
                        priceScaleId: 'left',
                    };
                }
            }

            const lineSeries = chart.current.addLineSeries(baseOptions);

            if (key !== 'mape') {
                lineSeries.applyOptions({
                    priceFormat: {
                        type: 'price',
                        precision: 5,
                        minMove: 0.00001,
                    },
                });
            }

            lineSeries.setData(lineData);
            metricLineSeriesRef.current[key] = lineSeries;
        })
        // console.log(`Hcart rendered ${type}`)
        chart.current.subscribeCrosshairMove(tooltipHandler)
    }

    const tooltipHandler = (param) => {
        let tooltip = null
        const metricColors = Object.keys(predictionsPalette).map(key => predictionsPalette[key])
        if (
            param.point === undefined ||
            param.time === undefined ||
            param.point.x < 0 ||
            param.point.x > chartContainerRef.current.clientWidth ||
            param.point.y < 0 ||
            param.point.y > chartContainerRef.current.clientHeight ||
            param.paneIndex !== 0
        ) {
            tooltip = document.querySelector(`.model-hist-tooltip_${type}_${for_}`)
            tooltip.innerHTML = ''
            return;
        } else {
            let finalStr = ''
            let str = ''
            tooltip = document.querySelector(`.model-hist-tooltip_${type}_${for_}`)
            let epoch = param.time
            Object.keys(metricLineSeriesRef.current).forEach((key, i) => {
                const data = param.seriesData.get(metricLineSeriesRef.current[key]);
                if (data === undefined) return
                str += `
                <div class='model-hist-tooltip-item'>
                    <div style="width:8px; height:8px; border-radius:10px; background-color:${metricColors[i]}"></div>
                    <span>&nbsp;</span>
                    <Typography class='model-hist-tooltip-item-key' style="display:flex; align-items:center; gap:4px;" variant='custom'>${key}</Typography>
                    <span>&nbsp;&nbsp</span>
                    <Typography class='model-hist-tooltip-item-value style="display:flex; align-items:center; gap:4px;" variant='custom'>${data.value.toFixed(7)}</Typography>
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

            tooltip.innerHTML = finalStr
        }
    }

    // cleanup the chart
    useEffect(() => {
        return () => {
            if (chart.current) {
                // console.log(`CLEANUP : Metrics chart UE ${type} & Tooltip unsubscription`);
                chart.current.unsubscribeCrosshairMove(tooltipHandler)
                chart.current.remove();
                chart.current = null;
                metricLineSeriesRef.current = {};
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (retrainFlag && metricsChartReload && chart.current !== null) {
            // console.log(`RETRAIN : Cleaning up chart ${type}`)
            chart.current.remove();
            chart.current = null;
            metricLineSeriesRef.current = {};
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [retrainFlag])

    useEffect(() => {
        if (partialResetChartFlag) {
            // console.log(`PARTIAL RESET : Cleaning up chart ${type}`)
            chart.current.remove();
            chart.current = null;
            metricLineSeriesRef.current = {};
            dispatch(setPartialChartResetFlag(false))
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [partialResetChartFlag])


    // Render the chart/Update the chart
    useEffect(() => {
        if (chart.current === null) {
            // console.log(`NEW INIT : Creating chart ${type}`)
            render_chart()
        } else {
            // console.log('NEW UPDATE : Updating chart')
            const last = epochResults.slice(-1)[0]
            const dataToUpdate = last[type]
            // console.log('dataToUpdate :', dataToUpdate)

            const keys = Object.keys(dataToUpdate)
            keys.forEach((key, index) => {
                const lineData = { time: last.epoch, value: dataToUpdate[key] }
                try {
                    metricLineSeriesRef.current[key].update({ ...lineData })
                } catch (e) {
                    console.log('Error updating chart', e)
                }
            })
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [epochResults])


    // update the colors of the chart based on the palette
    useEffect(() => {
        if (chart.current !== null) {
            // console.log('UPDATING COLORS')
            const metricColors = Object.keys(predictionsPalette).map(key => predictionsPalette[key])
            Object.keys(metricLineSeriesRef.current).forEach((key, i) => {
                metricLineSeriesRef.current[key].applyOptions({ color: metricColors[i] })
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [predictionsPalette])

    // sets the background color of the chart based on theme
    useEffect(() => {
        // console.log('UE : Predctions Chart background')
        if (epochResults.length === 0 || !chart.current) {
            return
        } else {
            chart.current.applyOptions({
                layout: {
                    background: {
                        type: 'solid',
                        color: chartBackgroundColor,
                    },
                    textColor: textColor,

                },
                grid: {
                    vertLines: {
                        color: textColor
                    },
                    horzLines: {
                        color: textColor
                    },
                }
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chartBackgroundColor, epochResults, textColor])

    return (
        <ErrorBoundary onError={logError} fallback={<div>Something went wrong</div>}>
            <Box display='flex' flexDirection='column' gap='8px'>
                {epochResults.length > 0 &&
                    <Box display={'flex'} alignItems={'center'} flexDirection={"row"} gap={1}>
                        <Typography variant={for_ === '' ? 'h6' : 'h5'}>
                            {for_ !== '' ?
                                type.split('_')
                                    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                                    .join(' ')
                                : type.toUpperCase()
                            }
                        </Typography>
                        {type === 'losses' &&
                            <FormControlLabel
                                value="start"
                                sx={{ marginLeft: '0px', marginRight: '0px' }}
                                control={<Switch size="small" color="secondary" />}
                                label={syncTooltip ? 'Unsync Tooltip' : 'Sync Tooltip'}
                                labelPlacement="end"
                                checked={syncTooltip}
                                onChange={() => setSyncTooltip(!syncTooltip)}
                            />
                        }
                    </Box>
                }
                <Box className='wgangp-metrics-chart-box' sx={{ height: epochResults.length > 0 ? for_ === '' ? '280px' : '300px' : '0px' }}>
                    <Box className={type === 'training_metrics' || type === 'validation_metrics' ? 'model-hist-legend offset-left-axis' : 'model-hist-legend'}>
                        <Box className={`model-hist-tooltip_${type}_${for_}`}></Box>
                    </Box>
                    <Box ref={chartContainerRef} height='100%' width='100%'></Box>
                </Box>
            </Box>
        </ErrorBoundary>
    )
}

export default WgangpMetricsChart