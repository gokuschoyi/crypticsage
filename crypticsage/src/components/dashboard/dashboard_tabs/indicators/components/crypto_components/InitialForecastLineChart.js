import { ErrorBoundary } from "react-error-boundary";
import React, { useEffect, useRef } from 'react'
import { Box, useTheme } from '@mui/material';
import { createChart } from 'lightweight-charts';

const logError = (error, info) => {
    // Do something with the error, e.g. log to an external API
    console.log('error', error)
};


const InitialForecastLineChart = ({ data, tt_key }) => {
    const theme = useTheme()
    const chartBackgroundColor = theme.palette.background.default
    const textColor = theme.palette.primary.newWhite

    const chart = useRef(null)
    const chartboxRef = useRef();
    const lineSeriesRef = useRef({})

    const chartOptions = {
        autoSize: true,
        layout: {
            background: {
                type: 'solid',
                color: chartBackgroundColor,
            },
            textColor: textColor,
        },
        grid: {
            vertLines: {
                visible: false,
                color: 'rgba(197, 203, 206, 0.5)',
            },
            horzLines: {
                visible: false,
                color: 'rgba(197, 203, 206, 0.5)',
            },
        },
        crosshair: {
            mode: 'magnet',
        },
        rightPriceScale: {
            borderColor: 'rgba(197, 203, 206, 0.8)',
        },
        timeScale: {
            borderColor: 'rgba(197, 203, 206, 0.8)',
        }
    }

    const to_plot = ['actual', 'predicted']

    useEffect(() => {
        if (data.length === 0) {
            // console.log(`No data ${tt_key}`)
            return
        } else {
            // console.log(`Data found ${tt_key}`)
            // console.log(data)
            chart.current = createChart(chartboxRef.current, chartOptions)
            chart.current.timeScale().fitContent();

            to_plot.forEach((key) => {
                const lineData = data
                    .map((d) => ({ time: new Date(d.openTime) / 1000, value: d[key] === 'null' || d[key] === null ? '' : d[key] }))
                    .filter((d) => d.value !== '')
                    // console.log(lineData)
                const lineSeries = chart.current.addLineSeries({
                    color: key === 'actual' ? 'blue' : theme.palette.primary.main,
                    lineWidth: 2,
                    crossHairMarkerVisible: false,
                    priceLineVisible: false,
                    priceLineSource: false,
                    priceLineWidth: 1,
                    priceLineColor: theme.palette.primary.main,
                    baseLineColor: theme.palette.primary.main,
                    lastValueVisible: false,
                    lineStyle: 0,
                    lineType: 0,
                    crossHairMarkerRadius: 3,
                    crossHairMarkerBorderColor: theme.palette.primary.main,
                    crossHairMarkerBackgroundColor: theme.palette.primary.main,
                    crossHairMarkerBorderWidth: 1,
                })

                lineSeries.setData(lineData)
                lineSeriesRef.current[key] = lineSeries
            })
        }

        return () => {
            if (chart.current) {
                // console.log(`Chart present and removed ${tt_key}`)
                chart.current.remove()
                chart.current = null
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data])

    // sets the tooltip for the chart
    useEffect(() => {
        let tooltip = document.querySelector(`.saved-forecast-tooltip-${tt_key}`) || null
        const lossTooltipHandler = (param) => {
            if (
                param.point === undefined ||
                param.time === undefined ||
                param.point.x < 0 ||
                param.point.x > chartboxRef.current.clientWidth ||
                param.point.y < 0 ||
                param.point.y > chartboxRef.current.clientHeight ||
                param.paneIndex !== 0
            ) {
                // tooltip = document.querySelector('.tool-tip-indicators')
                tooltip.innerHTML = ''
                return;
            } else {
                // tooltip = document.querySelector(`.saved-forecast-tooltip-${tt_key}`)
                let tt_pred = ''
                let tt_actu = ''
                let dateStr = ''
                Object.keys(lineSeriesRef.current).forEach(key => {
                    const data = param.seriesData.get(lineSeriesRef.current[key]);
                    // console.log(data)
                    if (data) {
                        const value = data.value
                        const time = data.time
                        const date = new Date(time * 1000)
                        dateStr = date.toLocaleString()
                        const valueStr = value
                        if (key === 'actual') {
                            tt_actu = `${key} : ${valueStr}`
                        } else {
                            tt_pred = `${key} : ${valueStr}`
                        }
                    }
                    tooltip.innerHTML = `
                        <div class='initial-forecast-line-box'>
                            <div>
                                <Typography class='model-hist-tooltip-epoch' variant='custom'>Date ${dateStr}</Typography>
                            </div>
                            <div class='model-hist-values-initial'>
                                <div>
                                    ${tt_actu === '' ? '' : tt_actu}
                                </div>
                                <div>
                                    ${tt_pred === '' ? '' : tt_pred}
                                </div>
                            </div>
                        </div>
                    `
                })

            }
        }

        if (chart.current) {
            chart.current.subscribeCrosshairMove(lossTooltipHandler)
        } else {
            return
        }

        return () => {
            if (chart.current) {
                tooltip.innerHTML = ''
                chart.current.unsubscribeCrosshairMove(lossTooltipHandler)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data])


    const resizeObserver = useRef();
    // Resize chart on container resizes.
    useEffect(() => {
        resizeObserver.current = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            // console.log(width, height);
            chart.current && chart.current.applyOptions({ width, height });
        });

        resizeObserver.current.observe(chartboxRef.current);

        return () => resizeObserver.current.disconnect();
    }, []);

    // sets the background color of the chart based on theme
    useEffect(() => {
        // console.log('UE : Predctions Chart background')
        if (data.length === 0 || !chart.current) {
            return
        } else {
            chart.current.applyOptions({
                layout: {
                    background: {
                        type: 'solid',
                        color: chartBackgroundColor,
                    },
                    textColor: textColor,
                }
            })
        }
    }, [chartBackgroundColor, data, textColor])


    return (
        <ErrorBoundary onError={logError} fallback={<div>Something went wrong</div>}>
            <Box className='chart-cont-dom' width="100%" height="100%">
                <Box className='model-hist-legend'>
                    <Box className={`saved-forecast-tooltip-${tt_key}`}></Box>
                </Box>
                <Box ref={chartboxRef} width="100%" height="100%"></Box>
            </Box>
        </ErrorBoundary>
    )
}

export default InitialForecastLineChart