import { ErrorBoundary } from "react-error-boundary";
import React, { useRef, useEffect, useState } from 'react'
import { createChart } from 'lightweight-charts';
import { Box, useTheme, IconButton, Typography, Skeleton, Paper } from '@mui/material'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';

const logError = (error, info) => {
    // Do something with the error, e.g. log to an external API
    console.log('error', error)
};


const lineColors = [
    '#D32F2F', // Red
    '#F57C00', // Orange
    '#1976D2', // Blue
    '#7B1FA2', // Purple
    '#00796B', // Teal
    '#689F38', // Light Green
    '#512DA8', // Deep Purple
    '#0097A7', // Cyan
    '#C2185B', // Pink
    '#388E3C', // Green
    '#303F9F', // Indigo
    '#AFB42B', // Lime
    '#FFA000', // Amber
    '#5D4037', // Brown
    '#616161', // Gray
    '#FBC02D', // Yellow
    '#E64A19', // Deep Orange
    '#0288D1', // Light Blue
    '#C0CA33', // Lime Green
    '#455A64', // Blue Gray
];

const WganFinalPredictionChart = (props) => {
    const { wgan_final_forecast, trainingStartedFlag } = props

    const theme = useTheme()
    const chartBackgroundColor = theme.palette.background.default
    const textColor = theme.palette.primary.newWhite

    const chartContainerRef = useRef()
    const chart = useRef(null)
    const predictionSeriesref = useRef({})

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

    const HideIcon = ({ inter_key, show_chart_flag }) => {
        const [toggled, setToggled] = useState(show_chart_flag)
        const handleToggleShowHideChart = ({ inter_key }) => {
            setToggled(!toggled)
            // console.log('clicked to hide', inter_key, show_chart_flag)
            predictionSeriesref.current[inter_key].visible = !predictionSeriesref.current[inter_key].visible;
            predictionSeriesref.current[inter_key].line.applyOptions({
                visible: predictionSeriesref.current[inter_key].visible
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
        const series_key = Object.keys(wgan_final_forecast[0]).filter(key => key !== "actual" && key !== "date")
        return (
            <Box className='model-hist-legend'>
                <Box className='model-hist-main-box-wgan'>
                    <Box>
                        <Typography className='model-hist-tooltip-epoch' style={{ fontSize: '12px' }} id="prediction-date">Date : </Typography>
                    </Box>

                    <Box className='model-hist-tooltip-item'>
                        <Box style={{ display: 'flex', flexDirection: 'row', justifyContent: "space-between", alignItems: 'center', gap: '4px' }}>
                            <Box style={{ width: '8px', height: '8px', borderRadius: '10px', backgroundColor: `blue` }}></Box>
                            <Typography className='model-hist-tooltip-item-key' id={`actual_key_pred`} style={{ fontSize: '10px', paddingTop: '2px' }} variant='custom'>Actual</Typography>
                            <Typography className='model-hist-tooltip-item-value' id={`actual_value_pred`} style={{ fontSize: '10px', paddingTop: '2px' }} variant='custom'></Typography>
                        </Box>
                    </Box>

                    {series_key.map((forecast, i) => {
                        const { color, visible } = predictionSeriesref.current[forecast]
                        return (
                            <Box className='model-hist-values' key={series_key[i]}>
                                <Box className='model-hist-tooltip-item' sx={{ minWidth: '130px', justifyContent: 'space-between' }}>
                                    <Box style={{ display: 'flex', flexDirection: 'row', justifyContent: "space-between", alignItems: 'center', gap: '4px' }}>
                                        <Box style={{ width: '8px', height: '8px', borderRadius: '10px', backgroundColor: `${color}` }}></Box>
                                        <Typography className='model-hist-tooltip-item-key' id={`${series_key[i]}_key_pred`} style={{ fontSize: '10px', paddingTop: '2px' }} variant='custom'>P : </Typography>
                                        <Typography className='model-hist-tooltip-item-value' id={`${series_key[i]}_value_pred`} style={{ fontSize: '10px', paddingTop: '2px' }} variant='custom'></Typography>
                                    </Box>
                                    <HideIcon inter_key={series_key[i]} show_chart_flag={visible} />
                                </Box>
                            </Box>
                        )
                    })
                    }
                </Box>
            </Box>
        )
    }, [wgan_final_forecast])


    useEffect(() => {
        if (chart.current === null && wgan_final_forecast.length > 0) {
            // console.log('UE predict vals',wgan_final_forecast)

            chart.current = createChart(chartContainerRef.current, chart_options)
            chart.current.timeScale().fitContent()

            const seriesBykey = Object.keys(wgan_final_forecast[0])
                .filter(key => key !== "date")
                .map((key, index) => ({
                    key,
                    data: wgan_final_forecast.map(obj => ({
                        time: new Date(obj.date).getTime() / 1000,
                        value: parseFloat(obj[key])
                    })),
                    visible: true,
                    color: key === 'actual' ? 'blue' : lineColors[index],
                }));

            // console.log('Series by key', seriesBykey)

            seriesBykey.forEach((item) => {
                predictionSeriesref.current[item.key] = {
                    line: chart.current.addLineSeries({
                        color: item.color,
                        visible: item.visible,
                        lineWidth: 2
                    }),
                    visible: item.visible,
                    color: item.color
                }
                predictionSeriesref.current[item.key]['line'].setData(item.data)
            })
        }

        return () => {
            // console.log('CLEANUP : WGAN GP final prediction chart cleanup')
            chart.current && chart.current.remove();
            chart.current = null;
            predictionSeriesref.current = {}

        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wgan_final_forecast])


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
            const pDate = document.getElementById('prediction-date')
            pDate.innerHTML = `Date : ${new Date(param.time * 1000).toLocaleString()}`
            const ttKeys = Object.keys(wgan_final_forecast[0]).filter(key => key !== "date")
            const toShow = ttKeys.filter(key => predictionSeriesref.current[key].visible)

            toShow.forEach(key => {
                const key_element = document.getElementById(`${key}_key_pred`)
                const value_element = document.getElementById(`${key}_value_pred`)
                key_element.innerHTML = key === 'actual' ? 'Actual : ' : `P : ${key}`
                const data = param.seriesData.get(predictionSeriesref.current[key]['line'])
                value_element.innerHTML = data.value.toFixed(2)
            })

        }
    }

    // set the tooltip for the chart
    useEffect(() => {
        if (chart.current && wgan_final_forecast.length > 0) {
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
    }, [wgan_final_forecast])


    // sets the background color of the chart based on theme
    useEffect(() => {
        // console.log('UE : Predctions Chart background')
        if (wgan_final_forecast.length === 0 || !chart.current) {
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
    }, [chartBackgroundColor, wgan_final_forecast, textColor])

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
        <ErrorBoundary onError={logError} fallback={<div>Something went wrong</div>}>
            <Box className='wgangp-final-predictions-box' display='flex' flexDirection='column' width="100%" height='300px' >
                {trainingStartedFlag ? (
                    <Box className='prediction-loader' position='relative' width='100%' height='100%'>
                        <Skeleton variant="rectangular" width="100%" height='100%' />
                        <Box position='absolute' top='42%' left='50%' sx={{ transform: 'translate(-50%, -50%)' }} width='fit-content' display='flex' flexDirection='row' justifyContent='center'>
                            <Typography variant='custom' id='loader-message-text' style={{ textAlign: 'center', whiteSpace: 'nowrap', textOverflow: 'ellipssis', overflow: 'hidden', maxWidth: '400px' }}>Training started</Typography>
                            <div className="center">
                                <div className="wave"></div>
                                <div className="wave"></div>
                                <div className="wave"></div>
                                <div className="wave"></div>
                                <div className="wave"></div>
                                <div className="wave"></div>
                                <div className="wave"></div>
                                <div className="wave"></div>
                                <div className="wave"></div>
                                <div className="wave"></div>
                                <div className="wave"></div>
                            </div>
                        </Box>
                    </Box>
                ) : (Object.keys(wgan_final_forecast).length > 0 ? '' :
                    <Box display='flex' height='100%' alignItems='center' justifyContent='center' p={1} >
                        <Paper elevation={4} style={{ padding: '5px' }}>Start training to view predictions</Paper>
                    </Box>
                )
                }

                <Box className='wgangp-final-predictions-box' >
                    {chart.current && wgan_final_forecast.length > 0 && <ToolTipComponent />}
                </Box>
                <Box ref={chartContainerRef} height='100%' width='100%'></Box>
            </Box>

        </ErrorBoundary>
    )
}

export default WganFinalPredictionChart