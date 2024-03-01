import React, { useEffect, useRef } from 'react'
import { Box, IconButton, useTheme, Typography } from '@mui/material'
import { createChart } from 'lightweight-charts';
import { useDispatch } from 'react-redux';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { toggleShowHideIntermediatePredictions } from '../../modules/CryptoModuleSlice'

const IntermediateForecastChart = (props) => {
    const { intermediate_forecasts, epochs, forecast_step } = props
    const dispatch = useDispatch()
    const forecast_count = Math.floor(epochs / parseInt(forecast_step))
    // const intermediate_forecasts = useSelector(state => state.cryptoModule.modelData.wgan_intermediate_forecast)

    const theme = useTheme()
    const chartBackgroundColor = theme.palette.background.default
    const textColor = theme.palette.primary.newWhite
    const chartContainerRef = useRef()
    const chart = useRef(null)
    const forecastSeriesRef = useRef({})

    const chart_options = {
        autoSize: true,
        rightPriceScale: {
            borderColor: 'rgba(197, 203, 206, 0.8)',
            axisLabelVisible: false,
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
            visible: true,
        },
        crosshair: {
            mode: 1
        }
    }

    const generate_forecast_data = (inter_forecast) => {
        let series_data = {}
        let actul_values = inter_forecast[0].forecast.map((pred) => {
            return { time: new Date(pred.date).getTime() / 1000, value: parseFloat(pred.actual) }
        })
        series_data['actual'] = { actual: actul_values, color: 'blue' }

        inter_forecast.forEach((forecast) => {
            let forecast_values = forecast.forecast.map((pred) => {
                return { time: new Date(pred.date).getTime() / 1000, value: parseFloat(pred['0']) }
            })
            series_data[forecast.epoch] = { pred: forecast_values, color: forecast.color, hide: forecast.show }
        })
        return series_data
    }

    const render_chart = (s_data) => {
        chart.current = createChart(chartContainerRef.current, chart_options)
        chart.current.timeScale().fitContent()

        Object.keys(s_data).forEach((key) => {
            // console.log(key)
            if (key === 'actual') {
                forecastSeriesRef.current[key] = {
                    line: chart.current.addLineSeries({ color: s_data[key].color, lineWidth: 2 }),
                    color: s_data[key].color,
                    visible: s_data[key].hide
                }
                forecastSeriesRef.current[key]['line'].setData(s_data[key].actual)
            } else {
                forecastSeriesRef.current[key] = {
                    line: chart.current.addLineSeries({ color: s_data[key].color, lineWidth: 2, visible: s_data[key].hide }),
                    color: s_data[key].color,
                    visible: s_data[key].hide,
                }
                forecastSeriesRef.current[key]['line'].setData(s_data[key].pred)
            }
        })
    }

    const HideIcon = ({ inter_key, show_chart_flag }) => {
        const handleToggleShowHideChart = ({ inter_key }) => {
            console.log('clicked to hide', inter_key, show_chart_flag)
            dispatch(toggleShowHideIntermediatePredictions({ key: inter_key }))
        }

        return (
            <IconButton
                size='small'
                sx={{ padding: '2px' }}
                aria-label="Hide chart"
                color="secondary"
                onClick={handleToggleShowHideChart.bind(null, { inter_key: inter_key })}>
                {show_chart_flag ?
                    <VisibilityIcon className='smaller-icon' />
                    :
                    <VisibilityOffIcon className='smaller-icon' />
                }
            </IconButton>
        )
    }

    const ToolTipComponent = React.memo(() => {
        return (
            <Box className='model-hist-legend'>
                <Box className='model-hist-main-box-wgan'>
                    <Box>
                        <Typography className='model-hist-tooltip-epoch' style={{ fontSize: '12px' }} id="prediction-date">Date : {tooltipState.date}</Typography>
                    </Box>

                    <Box className='model-hist-tooltip-item'>
                        <Box style={{ display: 'flex', flexDirection: 'row', justifyContent: "space-between", alignItems: 'center', gap: '4px' }}>
                            <Box style={{ width: '8px', height: '8px', borderRadius: '10px', backgroundColor: `blue` }}></Box>
                            <Typography className='model-hist-tooltip-item-key' id={`actual_key`} style={{ fontSize: '10px', paddingTop: '2px' }} variant='custom'>Actual</Typography>
                            <Typography className='model-hist-tooltip-item-value' id={`actual_value`} style={{ fontSize: '10px', paddingTop: '2px' }} variant='custom'>{tooltipState.actual}</Typography>
                        </Box>
                    </Box>

                    {intermediate_forecasts.map((forecast, i) => {
                        const { epoch, color, show } = forecast
                        return (
                            <Box className='model-hist-values' key={epoch}>
                                <Box className='model-hist-tooltip-item' sx={{ minWidth: '130px', justifyContent: 'space-between' }}>
                                    <Box style={{ display: 'flex', flexDirection: 'row', justifyContent: "space-between", alignItems: 'center', gap: '4px' }}>
                                        <Box style={{ width: '8px', height: '8px', borderRadius: '10px', backgroundColor: `${color}` }}></Box>
                                        <Typography className='model-hist-tooltip-item-key' id={`${epoch}_key`} style={{ fontSize: '10px', paddingTop: '2px' }} variant='custom'>E : {epoch}</Typography>
                                        <Typography className='model-hist-tooltip-item-value' id={`${epoch}_value`} style={{ fontSize: '10px', paddingTop: '2px' }} variant='custom'>{tooltipState[epoch]}</Typography>
                                    </Box>
                                    <HideIcon inter_key={epoch} show_chart_flag={show} />
                                </Box>
                            </Box>
                        )
                    })
                    }
                </Box>
            </Box>
        )
    }, [intermediate_forecasts])

    useEffect(() => {
        if (chart.current === null && (intermediate_forecasts.length === 1 || intermediate_forecasts.length === forecast_count)) {
            // console.log('INIT : Chart = null and forecast_count = 1 or forecast_count = total forecast_count')
            const s_data = generate_forecast_data(intermediate_forecasts)
            // console.log('INIT : ', forecast_count, s_data)
            render_chart(s_data)
        } else {
            // console.log('INIT : Chart present or forecast_count > 1 or forecast_count = total forecast_count')
            const all_keys = intermediate_forecasts.map((forecast) => `${forecast.epoch}`)
            const plotted_keys = Object.keys(forecastSeriesRef.current)
            const new_keys = all_keys.filter((key) => !plotted_keys.includes(key))
            // console.log(new_keys, plotted_keys, all_keys)

            if (new_keys.length === 0) {
                // console.log('INIT : show hide updates')
                all_keys.forEach((key) => {
                    forecastSeriesRef.current[key]['line'].applyOptions({ visible: intermediate_forecasts.find((forecast) => `${forecast.epoch}` === key).show })
                })
            }
            return
        }

        return () => {
            if (chart.current !== null) {
                console.log('CLEANUP : Intermediate Forecast Chart UE 1')
                chart.current.remove()
                chart.current = null
                forecastSeriesRef.current = {}
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [intermediate_forecasts])

    useEffect(() => {
        if (chart.current !== null && intermediate_forecasts.length > 1 && intermediate_forecasts.length <= forecast_count) {
            // console.log('UPDATE : Updating chart')
            const s_data = generate_forecast_data(intermediate_forecasts)

            // console.log('UPDATE', forecast_count, s_data)

            const all_keys = Object.keys(s_data)
            const plotted_keys = Object.keys(forecastSeriesRef.current)
            const new_keys = all_keys.filter((key) => !plotted_keys.includes(key))
            // console.log(new_keys, plotted_keys, all_keys)

            if (new_keys.length === 0) {
                // console.log('UPDATE : show hide updates')
                all_keys.forEach((key) => {
                    forecastSeriesRef.current[key]['line'].applyOptions({ visible: s_data[key].hide })
                })
            } else {
                new_keys.forEach((key) => {
                    forecastSeriesRef.current[key] = {
                        line: chart.current.addLineSeries({ color: s_data[key].color, lineWidth: 2, visible: s_data[key].hide }),
                        color: s_data[key].color,
                        visible: s_data[key].hide,
                    }
                    forecastSeriesRef.current[key]['line'].setData(s_data[key].pred)
                })
            }
        } else if (chart.current === null && intermediate_forecasts.length > 1) {
            // console.log('UPDATE : Chart not present or epoch = 1')
            const s_data = generate_forecast_data(intermediate_forecasts)
            render_chart(s_data)
        }

        return () => {
            if (chart.current !== null) {
                console.log('CLEANUP : Intermediate Forecast Chart UE 2')
                chart.current.remove()
                chart.current = null
                forecastSeriesRef.current = {}
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [intermediate_forecasts])



    let forecastSeriesKey = intermediate_forecasts.reduce((obj, key) => {
        return { ...obj, [`${key.epoch}`]: '' };
    }, {});

    forecastSeriesKey['actual'] = ''
    forecastSeriesKey['date'] = ''


    const [tooltipState, setTooltipStae] = React.useState(forecastSeriesKey)
    // console.log('tooltipState : ', tooltipState)

    const tooltipHandler = (param) => {
        if (
            param.point === undefined ||
            param.time === undefined ||
            param.point.x < 0 ||
            param.point.x > chartContainerRef.current.clientWidth ||
            param.point.y < 0 ||
            param.point.y > chartContainerRef.current.clientHeight ||
            param.paneIndex !== 0
        ) {
            return;
        } else {
            let obj = {}
            obj['date'] = new Date(param.time * 1000).toLocaleString()

            const all_keys = Object.keys(forecastSeriesRef.current)
            let to_be_hidden = intermediate_forecasts.filter((forecast) => forecast.show === false).map((forecast) => `${forecast.epoch}`)
            const for_tooltip = all_keys.filter((key) => !to_be_hidden.includes(key))

            for_tooltip.forEach((key, i) => {
                const data = param.seriesData.get(forecastSeriesRef.current[key]['line']);
                obj[key] = data.value.toFixed(2)
            })
            setTooltipStae(obj)
        }
    }

    // set the tooltip for the chart
    useEffect(() => {

        if (chart.current) {
            chart.current.subscribeCrosshairMove(tooltipHandler)
        } else {
            return
        }

        return () => {
            if (chart.current) {
                chart.current.unsubscribeCrosshairMove(tooltipHandler)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [intermediate_forecasts])

    // sets the background color of the chart based on theme
    useEffect(() => {
        // console.log('UE : Predctions Chart background')
        if (intermediate_forecasts.length === 0 || !chart.current) {
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
    }, [chartBackgroundColor, intermediate_forecasts, textColor])

    // Resize chart on container resizes.
    const resizeObserver = useRef();
    useEffect(() => {
        resizeObserver.current = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            // console.log(width, height);
            chart.current && chart.current.applyOptions({ width, height });
        });

        resizeObserver.current.observe(chartContainerRef.current);

        return () => resizeObserver.current.disconnect();
    }, []);

    return (
        <Box display='flex' flexDirection='column' gap='8px'>
            <Box display={'flex'} alignItems={'flex-start'}>INTERMEDIATE FORECAST</Box>
            <Box className='wgangp-metrics-chart-box' sx={{ height: intermediate_forecasts.length > 0 ? '280px' : '0px' }}>
                <ToolTipComponent />
                <Box ref={chartContainerRef} height='100%' width='100%'></Box>
            </Box>
        </Box>
    )
}

export default IntermediateForecastChart