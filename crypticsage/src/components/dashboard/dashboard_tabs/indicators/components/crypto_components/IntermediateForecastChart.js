import React, { useEffect, useRef, useState } from 'react'
import { Box, IconButton, useTheme, Typography } from '@mui/material'
import { createChart } from 'lightweight-charts';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';

const IntermediateForecastChart = (props) => {
    const { intermediate_forecasts, for_, collapseResults } = props

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

    const generate_forecast_data = (inter_forecast, with_actual = true) => {
        let series_data = {}
        let actul_values = inter_forecast[0].forecast.map((pred) => {
            return { time: new Date(pred.date).getTime() / 1000, value: parseFloat(pred.actual) }
        })

        inter_forecast.forEach((forecast) => {
            let forecast_values = forecast.forecast.map((pred) => {
                return { time: new Date(pred.date).getTime() / 1000, value: parseFloat(pred['0']) }
            })
            series_data[forecast.epoch] = { pred: forecast_values, color: forecast.color, hide: forecast.show }
        })
        if (with_actual) {
            series_data['actual'] = { actual: actul_values, color: 'blue' }
        }
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
        const [toggled, setToggled] = useState(show_chart_flag)
        const handleToggleShowHideChart = ({ inter_key }) => {
            setToggled(!toggled)
            // console.log('clicked to hide', inter_key, show_chart_flag)
            forecastSeriesRef.current[inter_key].visible = !forecastSeriesRef.current[inter_key].visible
            forecastSeriesRef.current[inter_key].line.applyOptions({
                visible: forecastSeriesRef.current[inter_key].visible
            });
        }

        return (
            <IconButton
                size='small'
                sx={{ padding: '2px' }}
                aria-label="Hide chart"
                color="secondary"
                onClick={handleToggleShowHideChart.bind(null, { inter_key: inter_key })}>
                {toggled ?
                    <VisibilityIcon className='smaller-icon' />
                    :
                    <VisibilityOffIcon className='smaller-icon' />
                }
            </IconButton>
        )
    }

    const ToolTipComponent = React.memo(() => {
        const inter_forecast_keys = Object.keys(forecastSeriesRef.current).filter((key) => key !== 'actual')
        return (
            <Box className={collapseResults ? 'model-hist-legend show_intermediate' : 'model-hist-legend hide_intermediate'}>
                <Box className='model-hist-main-box-wgan'>
                    <Box>
                        <Typography className='model-hist-tooltip-epoch' style={{ fontSize: '12px' }} id={`intermediate-forecast-date_${for_}`}>Date :</Typography>
                    </Box>

                    <Box className='model-hist-tooltip-item'>
                        <Box style={{ display: 'flex', flexDirection: 'row', justifyContent: "space-between", alignItems: 'center', gap: '4px' }}>
                            <Box style={{ width: '8px', height: '8px', borderRadius: '10px', backgroundColor: `blue` }}></Box>
                            <Typography className='model-hist-tooltip-item-key' id={`actual_key_${for_}`} style={{ fontSize: '10px', paddingTop: '2px' }} variant='custom'>Actual</Typography>
                            <Typography className='model-hist-tooltip-item-value' id={`actual_value_${for_}`} style={{ fontSize: '10px', paddingTop: '2px' }} variant='custom'>{ }</Typography>
                        </Box>
                    </Box>

                    {inter_forecast_keys.map((forecast_key, i) => {
                        const { color, visible } = forecastSeriesRef.current[forecast_key]
                        return (
                            <Box className='model-hist-values' key={forecast_key}>
                                <Box className='model-hist-tooltip-item' sx={{ minWidth: '130px', justifyContent: 'space-between' }}>
                                    <Box style={{ display: 'flex', flexDirection: 'row', justifyContent: "space-between", alignItems: 'center', gap: '4px' }}>
                                        <Box style={{ width: '8px', height: '8px', borderRadius: '10px', backgroundColor: `${color}` }}></Box>
                                        <Typography className='model-hist-tooltip-item-key' id={`${forecast_key}_key_${for_}`} style={{ fontSize: '10px', paddingTop: '2px' }} variant='custom'>E : {forecast_key}</Typography>
                                        <Typography className='model-hist-tooltip-item-value' id={`${forecast_key}_value_${for_}`} style={{ fontSize: '10px', paddingTop: '2px' }} variant='custom'></Typography>
                                    </Box>
                                    <HideIcon inter_key={forecast_key} show_chart_flag={visible} />
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
        if (chart.current === null) {
            // console.log(`NEW INIT : Chart not present, creating chart...`)
            const s_data = generate_forecast_data(intermediate_forecasts)
            // console.log('INIT : ', s_data)
            render_chart(s_data)
        } else {
            // console.log('NEW UPDATE : Chart present, updating chart')
            const intermediateForecastToUpdate = intermediate_forecasts.slice(-1)
            const s_data = generate_forecast_data(intermediateForecastToUpdate, false)
            // console.log('UPDATE', s_data)

            Object.keys(s_data).forEach((key) => {
                forecastSeriesRef.current[key] = {
                    line: chart.current.addLineSeries({ color: s_data[key].color, lineWidth: 2, visible: s_data[key].hide }),
                    color: s_data[key].color,
                    visible: s_data[key].hide,
                }
                forecastSeriesRef.current[key]['line'].setData(s_data[key].pred)
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [intermediate_forecasts])

    // cleanup the chart
    useEffect(() => {
        return () => {
            if (chart.current) {
                // console.log(`NEW CLEANUP :Intermediate results & Predctions Chart tooltip unsubscription`);
                chart.current.unsubscribeCrosshairMove(tooltipHandler)
                chart.current.remove();
                chart.current = null;
                forecastSeriesRef.current = {};
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
            const iDate = document.getElementById(`intermediate-forecast-date_${for_}`)
            iDate.innerHTML = `Date : ${new Date(param.time * 1000).toLocaleString()}`
            const all_keys = Object.keys(forecastSeriesRef.current)
            const toShow = all_keys.filter((key) => forecastSeriesRef.current[key].visible === true)
            toShow.push('actual')

            toShow.forEach((key, i) => {
                const key_element = document.getElementById(`${key}_key_${for_}`)
                const value_element = document.getElementById(`${key}_value_${for_}`)
                key_element.innerHTML = key === 'actual' ? 'Actual' : `E : ${key}`
                const data = param.seriesData.get(forecastSeriesRef.current[key]['line']);
                value_element.innerHTML = data.value.toFixed(2)
            })
        }
    }

    // set the tooltip for the chart
    useEffect(() => {
        if (chart.current) {
            chart.current.subscribeCrosshairMove(tooltipHandler)
        } else {
            return
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

    return (
        <Box display='flex' flexDirection='column' gap='8px'>
            <Box display={'flex'} alignItems={'flex-start'}>
                <Typography variant={for_ === '' ? 'h6' : 'h5'}>
                    {for_ === '' ? "INTERMEDIATE FORECAST" : "Intermediate Forecast"}
                </Typography>
            </Box>
            <Box className='wgangp-metrics-chart-box' sx={{ height: intermediate_forecasts.length > 0 ? for_ === '' ? '280px' : '300px' : '0px' }}>
                <ToolTipComponent />
                <Box ref={chartContainerRef} height='100%' width='100%'></Box>
            </Box>
        </Box>
    )
}

export default IntermediateForecastChart