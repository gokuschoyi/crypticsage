import React, { useEffect, useRef } from 'react'
import { Box, Typography } from '@mui/material'
import { createChart } from 'lightweight-charts';
import { useSelector } from 'react-redux';
const PredictionsChart = () => {

    const predictedVlauesRedux = useSelector(state => state.cryptoModule.modelData.predictedValues)
    const predictionsChartRef = useRef(null)
    const chart = useRef(null)
    useEffect(() => {
        // console.log('UE : Predctions Chart')
        if (predictedVlauesRedux.length === 0 || !predictionsChartRef.current) {
            return
        } else {
            chart.current = createChart(predictionsChartRef.current, {
                width: 600,
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

            function timeToLocal(originalTime) {
                const d = new Date(originalTime * 1000);
                return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()) / 1000;
            }

            const actual_values = predictedVlauesRedux.map((prediction) => {
                return {
                    time: timeToLocal(prediction.open),
                    value: prediction.actual
                }
            })
            const predicted_values = predictedVlauesRedux.map((prediction) => {
                return {
                    time: timeToLocal(prediction.open),
                    value: prediction.predicted
                }
            })

            // console.log(actual_values)

            const actualSeries = chart.current.addLineSeries({
                color: '#00ff00',
                lineWidth: 2,
            });
            actualSeries.setData(actual_values);

            const predictedSeries = chart.current.addLineSeries({
                color: '#ff0000',
                lineWidth: 2,
            });
            predictedSeries.setData(predicted_values);
        }

        return () => {
            // console.log('UE Return : Predctions Chart')
            chart.current.remove()
        }
    }, [predictedVlauesRedux])
    return (
        <>
            <Box display='flex' flexDirection='column' gap='20px' pt={4} pl={2} pr={2}>
                {predictedVlauesRedux.length !== 0 &&
                    <Box>
                        <Typography variant='h5' textAlign='start'>Predictions Chart</Typography>
                    </Box>
                }
                <Box ref={predictionsChartRef}></Box>
            </Box >
        </>
    )
}

export default PredictionsChart