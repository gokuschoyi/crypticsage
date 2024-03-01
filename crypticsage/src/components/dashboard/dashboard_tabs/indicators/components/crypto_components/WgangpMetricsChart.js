import React, { useEffect, useRef } from 'react'
import { Box, useTheme } from '@mui/material'
import { createChart } from 'lightweight-charts';
const WgangpMetricsChart = (props) => {
    const { type, epochResults, predictionsPalette, totalEpochs } = props

    const theme = useTheme()
    const chartBackgroundColor = theme.palette.background.default
    const textColor = theme.palette.primary.newWhite
    const chartContainerRef = useRef()
    const chart = useRef(null)
    const metricLineSeriesRef = useRef({})

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

        const data = epochResults.map((epochResult, index) => {
            return epochResult[type]
        })

        const dataKeys = Object.keys(data[0])

        dataKeys.forEach((key, index) => {
            const lineData = data.map((epochResult, index) => {
                return { time: index + 1, value: epochResult[key] }
            })

            let lineSeries;
            if (type === 'training_metrics' || type === 'validation_metrics') {
                if (key === 'mape') {
                    lineSeries = chart.current.addLineSeries({
                        priceScaleId: 'left',
                        color: metricColors[index],
                        lineWidth: 2,
                        lineType: 0,
                        // title: key,
                        priceLineVisible: false,
                    })
                } else {
                    lineSeries = chart.current.addLineSeries({
                        color: metricColors[index],
                        lineWidth: 2,
                        lineType: 0,
                        // title: key,
                        priceLineVisible: false,
                    })
                    lineSeries.applyOptions({
                        priceFormat: {
                            type: 'price',
                            precision: 5,
                            minMove: 0.00001,
                        },
                    });
                }
            } else {
                lineSeries = chart.current.addLineSeries({
                    color: metricColors[index],
                    lineWidth: 2,
                    lineType: 0,
                    // title: key,
                    priceLineVisible: false,
                })
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
    }

    useEffect(() => {
        if (chart.current === null && (epochResults.length === 1 || epochResults.length === totalEpochs)) {
            // console.log('INIT : Chart not present and epoch = 1 or epoch = totalEpochs')
            render_chart()
        } else {
            // console.log('INIT : Chart present or epoch > 1 or epoch = totalEpochs')
            return
        }

        return () => {
            if (chart.current !== null) {
                console.log(`CLEANUP : Metrics chart UE 1 ${type}`)
                chart.current.remove()
                chart.current = null
                metricLineSeriesRef.current = {}
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [epochResults])

    // Update chart data when epochResults change
    useEffect(() => {
        if (chart.current !== null && epochResults.length > 1 && epochResults.length <= totalEpochs) {
            // console.log('UPDATE : Updating chart')
            const data = epochResults.map((epochResult, index) => {
                return epochResult[type]
            })

            const dataKeys = Object.keys(data[0])

            dataKeys.forEach((key, index) => {
                const lineData = data.map((epochResult, index) => {
                    return { time: index + 1, value: epochResult[key] }
                })

                const toUpdate = lineData.slice(-1)[0]
                // console.log('to update :', toUpdate)
                metricLineSeriesRef.current[key].update({ ...toUpdate })
            })
        } else if (chart.current === null && epochResults.length > 1) {
            // console.log('UPDATE : Chart not present or epoch = 1')
            render_chart()
            return
        }

        return () => {
            if (chart.current !== null) {
                console.log(`CLEANUP : Metrics chart UE 2 ${type}`)
                chart.current.remove()
                chart.current = null
                metricLineSeriesRef.current = {}
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [epochResults])

    useEffect(() => {
        if (chart.current !== null) {
            const metricColors = Object.keys(predictionsPalette).map(key => predictionsPalette[key])
            Object.keys(metricLineSeriesRef.current).forEach((key, i) => {
                // console.log('UPDATING COLORS', key, metricColors[i])
                metricLineSeriesRef.current[key].applyOptions({ color: metricColors[i] })
            })
        }
    }, [predictionsPalette])

    // set the tooltip for the chart
    useEffect(() => {
        let tooltip = null
        const metricColors = Object.keys(predictionsPalette).map(key => predictionsPalette[key])

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
                tooltip = document.querySelector(`.model-hist-tooltip_${type}`)
                tooltip.innerHTML = ''
                return;
            } else {
                let finalStr = ''
                let str = ''
                tooltip = document.querySelector(`.model-hist-tooltip_${type}`)
                let epoch = param.time
                Object.keys(metricLineSeriesRef.current).forEach((key, i) => {
                    const data = param.seriesData.get(metricLineSeriesRef.current[key]);
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

        if (chart.current) {
            chart.current.subscribeCrosshairMove(tooltipHandler)
        } else {
            return
        }

        return () => {
            if (chart.current) {
                // tooltip.innerHTML = ''
                chart.current.unsubscribeCrosshairMove(tooltipHandler)
            }
        }
    }, [epochResults, predictionsPalette, type])

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
    }, [chartBackgroundColor, epochResults, textColor])

    const resizeObserver = useRef();
    // Resize chart on container resizes.
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
            {epochResults.length > 0 && <Box display={'flex'} alignItems={'flex-start'}>{type.toUpperCase()}</Box>}

            <Box className='wgangp-metrics-chart-box' sx={{ height: epochResults.length > 0 ? '280px' : '0px' }}>
                <Box className={type === 'training_metrics' || type === 'validation_metrics' ? 'model-hist-legend offset-left-axis' : 'model-hist-legend'}>
                    <Box className={`model-hist-tooltip_${type}`}></Box>
                </Box>
                <Box ref={chartContainerRef} height='100%' width='100%'></Box>
            </Box>
        </Box>
    )
}

export default WgangpMetricsChart