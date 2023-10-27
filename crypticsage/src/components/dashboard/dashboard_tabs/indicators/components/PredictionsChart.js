import React, { useEffect, useRef } from 'react'
import { Box, useTheme, Skeleton, Typography } from '@mui/material'
import { createChart } from 'lightweight-charts';
import { useSelector } from 'react-redux';
const PredictionsChart = (props) => {
    const { predictionChartType, trainingStartedFlag } = props
    const theme = useTheme()
    const chartBackgroundColor = theme.palette.background.default

    const chartData = useSelector(state => state.cryptoModule.modelData.predictedValues)

    const [predictedValueRedux, setPredictedValue] = React.useState([]) // chart not removed on reset

    const predictionsChartRef = useRef(null)
    const chart = useRef(null)
    const actualValueRef = useRef(null)
    const predictedValueRef = useRef(null)

    // updates the predicted value based on the chart type
    useEffect(() => {
        // console.log('UE : Predctions Chart')
        if (Object.keys(chartData).length === 0) {
            setPredictedValue([])
            return
        }
        else {
            setPredictedValue(chartData[predictionChartType])
        }
    }, [chartData, predictionChartType])

    useEffect(() => {
        // console.log('UE : Predctions Chart')
        const chartGrid = document.getElementsByClassName('predictions-chart-grid')[0]
        let cWidth = chartGrid.clientWidth - 30

        const handleResize = () => {
            cWidth = chartGrid.clientWidth - 30;
            // console.log(cWidth)
            chart.current.applyOptions({ width: cWidth });
        };

        if (predictedValueRedux.length === 0 || !predictionsChartRef.current) {
            return
        } else {
            chart.current = createChart(predictionsChartRef.current, {
                width: cWidth,
                height: 300,
                layout: {
                    background: {
                        type: 'solid',
                        color: '#000000',
                    },
                    textColor: 'rgba(255, 255, 255, 0.9)',
                },
                grid: {
                    vertLines: {
                        color: 'rgba(197, 203, 206, 0.5)',
                    },
                    horzLines: {
                        color: 'rgba(197, 203, 206, 0.5)',
                    },
                },
                crosshair: {
                    mode: 'normal',
                },
                rightPriceScale: {
                    borderColor: 'rgba(197, 203, 206, 0.8)',
                },
                timeScale: {
                    borderColor: 'rgba(197, 203, 206, 0.8)',
                },
            });
            chart.current.timeScale().fitContent();

            const actual_values = predictedValueRedux.map((prediction) => {
                return {
                    time: prediction.open,
                    value: prediction.actual
                }
            })
            const predicted_values = predictedValueRedux.map((prediction) => {
                return {
                    time: prediction.open,
                    value: prediction.predicted
                }
            })

            actualValueRef.current = chart.current.addLineSeries({
                color: '#00ff00',
                lineWidth: 2,
            });
            actualValueRef.current.setData(actual_values);

            predictedValueRef.current = chart.current.addLineSeries({
                color: '#ff0000',
                lineWidth: 2,
            });
            predictedValueRef.current.setData(predicted_values);

            window.addEventListener('resize', handleResize);
        }

        return () => {
            // console.log('UE Return : Predctions Chart')
            window.removeEventListener('resize', handleResize);
            chart.current.remove()
            chart.current = null
        }
    }, [predictedValueRedux])

    // tooltip to show the actual and predicted values
    useEffect(() => {
        let predictionsBox = document.getElementsByClassName('predictions-value-box')[0]
        const predictionsCrossHairHandler = (param) => {
            if (
                param.point === undefined ||
                !param.time ||
                param.point.x < 0 ||
                param.point.x > predictionsChartRef.current.clientWidth ||
                param.point.y < 0 ||
                param.point.y > predictionsChartRef.current.clientHeight ||
                param.paneIndex !== 0
            ) {
                // predictionsBox.style.display = 'none'
            } else {
                predictionsBox.style.display = 'block'
                const date = new Date(param.time * 1000).toLocaleString('en-AU',
                    {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                    }
                );
                const act_data = param.seriesData.get(actualValueRef.current);
                const pred_data = param.seriesData.get(predictedValueRef.current);
                const diff = act_data.value - pred_data.value
                // console.log(act_data, pred_data)

                let toolTipText = `
                    <div class='value-box' style="flex-direction:column">
                        <div style="width:110px; text-align:start">${date}</div>
                        <Typography style="display:flex; align-items:center; gap:4px;" variant='custom'><div style="width:8px; height:8px; border-radius:10px; background-color:#12ff12"></div>Actual : ${act_data.value}</Typography>
                        <Typography style="display:flex; align-items:center; gap:4px;" variant='custom'><div style="width:8px; height:8px; border-radius:10px; background-color:red"></div>Predicted : ${pred_data.value}</Typography>
                        <Typography variant='custom'>${diff < 0 ? 'Over' : 'Under'} : <span style="color:${diff < 0 ? 'red' : '#12ff12'}">${diff}, ${(((act_data.value - pred_data.value) / act_data.value) * 100).toFixed(4)}%</span></Typography>
                    </div>
                `
                predictionsBox.innerHTML = toolTipText
            }
        }

        if (predictedValueRedux.length === 0 || !predictionsChartRef.current) {
            return
        } else {
            chart.current.subscribeCrosshairMove(predictionsCrossHairHandler);
        }

        return () => {
            if (predictedValueRedux.length === 0) {
                chart.current.unsubscribeCrosshairMove(predictionsCrossHairHandler)
                predictionsBox.style.display = 'none'
            }
        }
    }, [predictedValueRedux])

    // sets the background color of the chart based on theme
    useEffect(() => {
        if (predictedValueRedux.length === 0 || !predictionsChartRef.current) {
            return
        } else {
            chart.current.applyOptions({
                layout: {
                    background: {
                        type: 'solid',
                        color: chartBackgroundColor,
                    },
                    textColor: 'rgba(255, 255, 255, 0.9)',
                }
            })
        }
    }, [chartBackgroundColor, predictedValueRedux])

    return (
        <Box width="100%">
            <Box className='predictionChart-box' display='flex' flexDirection='column' gap='20px' pt={1} width="100%" height='100%' >
                {trainingStartedFlag && (
                    <Box width='100%' height={chart.current ? '100%' : '310px'}>
                        <Box position='relative' top='42%' left='50%' sx={{ transform: 'translate(-50%, -50%)' }} width='fit-content' display='flex' flexDirection='row'>
                            <Typography variant='custom' style={{ textAlign: 'center', letterSpacing: '1px' }}>Training started</Typography>
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
                        <Skeleton variant="rectangular" width="100%" height='80%' />
                    </Box>
                )}

                {predictedValueRedux.length !== 0 &&
                    <Box className=' predictions-legend '>
                        <Box className='predictions-value-box' p={'5px'}></Box>
                    </Box>
                }
            </Box >
            <Box className='prediction-chart-ref-box' ref={predictionsChartRef}></Box>
        </Box>
    )
}

export default PredictionsChart