import React, { useEffect, useRef, useMemo } from 'react'
import { Box, useTheme, Skeleton, Typography, Paper } from '@mui/material'
import { createChart } from 'lightweight-charts';
import { useSelector, useDispatch } from 'react-redux';
import { setBarsFromToPredictions, setStandardizedAndScaledPredictions } from '../../modules/CryptoModuleSlice'
import { calculateTolerance } from '../../modules/CryptoModuleUtils'

function calculateMSE(dates, allPredictions, mean, variance, predictionChartType, predictionLookAhead) {
    let actual = []
    let predictions = []
    dates.forEach((date) => {
        let actualScaled = predictionChartType === 'standardized' ? date.actual : calculateOriginalPrice(date.actual, variance, mean)
        actual.push(actualScaled)
    })
    allPredictions.forEach((prediction) => {
        let predicted = predictionChartType === 'standardized' ? prediction[predictionLookAhead - 1][0] : calculateOriginalPrice(prediction[predictionLookAhead - 1][0], variance, mean)
        predictions.push(predicted)
    })

    let sum = 0;
    for (let i = 0; i < actual.length; i++) {
        let diff = predictions[i] - actual[i];
        sum += diff * diff;
    }

    const mse = sum / actual.length;
    const rmse = Math.sqrt(mse);
    return { mse, rmse };
}

const calculateOriginalPrice = (value, variance, mean) => {
    if (value === null) return null;
    return (value * Math.sqrt(variance)) + mean;
};

const PredictionsChart = (props) => {
    const { predictionChartType, trainingStartedFlag, model_type, lookAhead, predictionLookAhead, setModelMetrics, predictionsPalette } = props
    const { actual: actualColor, predicted: predictedColor, forecast: forecastColor, TP_up: tp_upColor, TP_down: tp_downColor } = predictionsPalette

    const theme = useTheme()
    const dispatch = useDispatch()
    const chartBackgroundColor = theme.palette.background.default
    const textColor = theme.palette.primary.newWhite

    const chartData = useSelector(state => state.cryptoModule.modelData.predictedValues)
    // console.log(chartData)

    // const [predictedValueRedux, setPredictedValue] = React.useState([])
    const predictedValueRedux = useMemo(() => chartData[predictionChartType] || [], [chartData, predictionChartType]);

    const predictionsChartRef = useRef(null)
    const chart = useRef(null)
    const actualValueRef = useRef(null)
    const predictedValueRef = useRef(null)
    const allPredictions = useSelector(state => state.cryptoModule.modelData.predictedValues.predictions_array)
    const dates = useSelector(state => state.cryptoModule.modelData.predictedValues.dates)
    const mean = useSelector(state => state.cryptoModule.modelData.predictedValues.label_mean)
    const variance = useSelector(state => state.cryptoModule.modelData.predictedValues.label_variance)

    // This useEffect is used to shift the predicted values to the right based on the prediction look ahead
    useEffect(() => {
        // console.log('UE : Predctions Chart adjustment')
        if (dates.length === 0) {
            // console.log("No Prediction data yet")
            return
        } else {
            let shiftedPredictedValues = []
            let predIndex = predictionLookAhead - 1
            let forecastResult = []
            // console.log('Forecast RAW : ', chartData?.forecast.length)

            for (let i = 0; i < dates.length; i++) {
                const info = dates[i]
                let predicted = null

                if (i >= predIndex) {
                    predicted = allPredictions[i - predIndex][predIndex][0]
                }

                shiftedPredictedValues.push({
                    ...info,
                    predicted: predicted
                })
            }

            const lastDate = dates[dates.length - 1].open * 1000
            const tickerPeriodInMilliSecond = (dates[1].open - dates[0].open) * 1000
            // console.log('Last Date : ', new Date(lastDate).toLocaleString())

            if (predIndex === 0) {
                for (let i = 1; i <= chartData.forecast.length; i++) {
                    forecastResult.push({
                        openTime: new Date(lastDate + (tickerPeriodInMilliSecond * (i))).toLocaleString(),
                        open: (lastDate + (tickerPeriodInMilliSecond * (i))) / 1000,
                        actual: null,
                        predicted: chartData.forecast[i - 1][0]
                    })
                }
            } else {
                let predict = allPredictions.slice(-predIndex)
                // console.log('Predict length', predict.length)
                predict.forEach((value, index) => {
                    forecastResult.push({
                        openTime: new Date(lastDate + (tickerPeriodInMilliSecond * (index + 1))).toLocaleString(),
                        open: (lastDate + (tickerPeriodInMilliSecond * (index + 1))) / 1000,
                        actual: null,
                        predicted: value[predIndex][0]
                    })
                })
                // console.log('first', forecastResult)

                const newLastDate = forecastResult[forecastResult.length - 1].open * 1000
                // console.log('first last date', new Date(newLastDate).toLocaleString(), predIndex, chartData.forecast.length)
                for (let i = predIndex; i < chartData.forecast.length; i++) {
                    forecastResult.push({
                        openTime: new Date(newLastDate + (tickerPeriodInMilliSecond * (i - predIndex + 1))).toLocaleString(),
                        open: (newLastDate + (tickerPeriodInMilliSecond * (i - predIndex + 1))) / 1000,
                        actual: null,
                        predicted: chartData.forecast[i][0]
                    })
                }
                // console.log('second', forecastResult)
            }


            shiftedPredictedValues = [...shiftedPredictedValues, ...forecastResult]
            // console.log('third', forecastResult)
            // console.log(shiftedPredictedValues.slice(-10))

            const scaledDataAfterShifting = shiftedPredictedValues.map((value) => ({
                ...value,
                actual: calculateOriginalPrice(value.actual, chartData.label_variance, chartData.label_mean),
                predicted: calculateOriginalPrice(value.predicted, chartData.label_variance, chartData.label_mean),
            }))

            const lastData = scaledDataAfterShifting.slice(-lookAhead)
            // console.log('last scaled data',lastData)

            dispatch(setStandardizedAndScaledPredictions({ standardized: shiftedPredictedValues, scaled: scaledDataAfterShifting, lastData: lastData }))
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [predictionLookAhead, predictionChartType, dates, allPredictions, chartData.forecast, chartData.label_variance, chartData.label_mean, dispatch])

    // creates the chart
    useEffect(() => {
        // console.log('UE : Predctions Chart Rendering')
        if (predictedValueRedux.length === 0 || !predictionsChartRef.current) {
            return
        } else {
            chart.current = createChart(predictionsChartRef.current, {
                autoSize: true,
                layout: {
                    background: {
                        type: 'solid',
                        color: '#000000',
                    },
                    textColor: 'rgba(255, 255, 255, 0.9)',
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

            const actual_values = predictedValueRedux
                .filter((prediction) => prediction.actual !== null)
                .map((prediction) => ({
                    time: prediction.open,
                    value: prediction.actual,
                }));

            const predicted_values = predictedValueRedux
                .map((prediction, index) => {
                    if (prediction.predicted === null) {
                        return {
                            time: prediction.open,
                            value: prediction.predicted,
                            color: 'transparent'
                        }
                    } else {
                        if (index < predictedValueRedux.length - (lookAhead + 1)) {
                            return {
                                time: prediction.open,
                                value: prediction.predicted,
                            }

                        } else {
                            return {
                                time: prediction.open,
                                value: prediction.predicted,
                                color: forecastColor,
                            }
                        }
                    }
                })

            // console.log('act-length', actual_values.length)
            // console.log('pred-length', predicted_values.length)

            actualValueRef.current = chart.current.addLineSeries({
                lineWidth: 2,
            });
            actualValueRef.current.setData(actual_values);

            predictedValueRef.current = chart.current.addLineSeries({
                lineWidth: 2,
            });

            predictedValueRef.current.setData(predicted_values);
        }

        return () => {
            // console.log('UE Return : Predctions Chart')
            chart.current.timeScale().unsubscribeVisibleTimeRangeChange(barsInChartHandler)
            chart.current.remove()
            chart.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [predictedValueRedux])

    const resizeObserver = useRef();
    // Resize chart on container resizes.
    useEffect(() => {
        resizeObserver.current = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            // console.log(width, height);
            chart.current && chart.current.applyOptions({ width, height });
        });

        resizeObserver.current.observe(predictionsChartRef.current);

        return () => resizeObserver.current.disconnect();
    }, []);

    const tolerance = 1
    // This useEffect is used to calculate the metrics of the model
    useEffect(() => {
        // console.log('UE : Predctions Chart metrics')
        if (predictedValueRedux.length === 0 || !predictionsChartRef.current) {
            return
        } else {
            // const metrics = calculateMetrics(predictedValueRedux);
            const metrics = calculateTolerance(predictedValueRedux, tolerance)

            // console.log(metrics)

            let mse = calculateMSE(dates, allPredictions, mean, variance, predictionChartType, predictionLookAhead)
            // console.log('New MSE : ', mse)

            setModelMetrics((prev) => prev = {
                metrics,
                mse: mse
            })
            // console.log(predictionChartType, predictionLookAhead, metrics, mscSt, mse)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [predictedValueRedux, predictionChartType, predictionLookAhead])

    // setting markers and applying theme
    useEffect(() => {
        // console.log('UE : Predctions Chart markers')
        if (predictedValueRedux.length === 0 || !predictionsChartRef.current) {
            return
        } else {
            let markers = []
            let values = chartData[predictionChartType]
            markers.push({
                time: values[values.length - lookAhead].open,
                position: 'aboveBar',
                color: 'red',
                shape: 'circle',
                text: 'prediction',
                size: 0.4
            })
            // console.log(lookAhead, markers)

            predictedValueRef.current.applyOptions({
                color: predictedColor,
            });

            actualValueRef.current.applyOptions({
                color: actualColor,
            });

            const newTPMarkers = chartData[predictionChartType]
                .filter(data => {
                    const { actual, predicted } = data
                    const tol = tolerance / 100 * actual
                    return Math.abs(actual - predicted) <= tol
                })
                .map(data => {
                    const { actual, predicted } = data
                    const isActualPositive = actual > predicted;

                    let shape = isActualPositive ? 'arrowDown' : 'arrowUp';
                    let tpColor = isActualPositive ? tp_downColor : tp_upColor;

                    return {
                        time: data.open,
                        position: 'aboveBar',
                        color: tpColor,
                        shape: shape,
                        size: 0.1
                    };
                })
            // console.log(newTPMarkers)

            // let thresholdLower = 0.01
            /* const tpMarkers = chartData[predictionChartType]
                .filter(data => {
                    const actualChange = data.actual;
                    const predictedChange = data.predicted;
                    const percentChange = (predictedChange - actualChange) / actualChange;
                    return percentChange >= -thresholdLower && percentChange <= thresholdLower;
                })
                .map(data => {
                    const actualChange = data.actual;
                    const predictedChange = data.predicted;
                    const percentChange = (predictedChange - actualChange) / actualChange;

                    let shape = percentChange < 0 ? 'arrowDown' : 'arrowUp';
                    let tpColor = percentChange < 0 ? tp_downColor : tp_upColor;
                    return {
                        time: data.open,
                        position: 'aboveBar',
                        color: tpColor,
                        shape: shape,
                        size: 0.1
                    };
                }); */
            // console.log(tpMarkers)

            predictedValueRef.current.setMarkers([...newTPMarkers, ...markers])

        }
    }, [chartData, predictedValueRedux, predictionChartType, lookAhead, tp_upColor, tp_downColor, actualColor, predictedColor, forecastColor])

    // Define the debounce function
    function debounce(func, delay) {
        let timeoutId;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(context, args);
            }, delay);
        };
    }

    const debouncedFromToSave = debounce((from, to) => {
        // console.log(from, to)
        dispatch(setBarsFromToPredictions({ from: from, to: to }))
    }, 500)

    const barsInChartHandler = (param) => {
        const { from, to } = param
        const fromRounded = Math.floor(from)
        const toRounded = Math.floor(to)
        debouncedFromToSave(fromRounded, toRounded)
        // console.log(fromRounded, toRounded)
    }

    // handling the zoom in and zoom out of the chart
    const barsFromToRedux = useSelector(state => state.cryptoModule.barsFromToPredictions)
    useEffect(() => {
        // console.log('UE : Predctions Chart zoom')
        const { from, to } = barsFromToRedux
        // console.log(from, to)
        if (!chart.current) {
            return
        } else {
            if (barsFromToRedux.from !== 0 && barsFromToRedux.to !== 0) {
                // console.log(from, to)
                chart.current.timeScale().setVisibleLogicalRange({ from: from, to: to })
            } else {
                // console.log('UE : Initial chartset visible logical range')
            }
            chart.current.timeScale().subscribeVisibleLogicalRangeChange(barsInChartHandler)
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [predictedValueRedux])

    // tooltip to show the actual and predicted values
    useEffect(() => {
        // console.log('UE : Predctions Chart tooltip')
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
                switch (model_type) {
                    case 'multi_input_single_output_no_step':
                    case 'multi_input_single_output_step':
                        const act_data = param.seriesData.get(actualValueRef.current)?.value || 0;
                        const pred_data = param.seriesData.get(predictedValueRef.current)?.value || 0;

                        let act_val = predictionChartType === 'scaled' ? parseFloat(act_data.toFixed(2)) : act_data || 0
                        let pred_val = predictionChartType === 'scaled' ? parseFloat(pred_data.toFixed(2)) : pred_data || 0

                        let diff = 0
                        let percentageChange = 0
                        // console.log(act_val, pred_val)
                        if (act_val !== 0) {
                            // console.log(true)
                            if (predictionChartType === 'scaled') {
                                diff = (pred_val - act_val).toFixed(2);
                                percentageChange = Math.abs((diff / act_val) * 100).toFixed(4);
                            } else {
                                let denominator = act_val;
                                if ((act_val > 0 && pred_val < 0) || (act_val < 0 && pred_val > 0)) {
                                    denominator = Math.abs(act_val);
                                }

                                diff = pred_val - act_val;
                                percentageChange = ((diff / denominator) * 100).toFixed(4);
                            }
                        } else {
                            // console.log(false)
                            percentageChange = 0
                            diff = 0
                        }
                        // console.log(diff)

                        let toolTipText = `
                            <div class='value-box' style="flex-direction:column">
                                <div style="width:110px; text-align:flex-start">${date}</div>
                                <Typography style="display:flex; align-items:center; gap:4px;" variant='custom'><div style="width:8px; height:8px; border-radius:10px; background-color:${actualColor}"></div>Actual : ${act_val}</Typography>
                                <Typography style="display:flex; align-items:center; gap:4px;" variant='custom'><div style="width:8px; height:8px; border-radius:10px; background-color:${predictedColor}"></div>Predicted : ${pred_val}</Typography>
                                <Typography variant='custom'>${diff > 0 ? 'Over : ' : 'Under '}<span style="color:${diff > 0 ? predictedColor : actualColor}">${`${diff},`} ${`${percentageChange}%`}</span></Typography>
                            </div>
                        `
                        predictionsBox.innerHTML = toolTipText
                        break;
                    case 'multi_input_multi_output_no_step':
                        const data = param.seriesData.get(actualValueRef.current);
                        const open = data.value !== undefined ? data.value : data.open;

                        const close = data.close;
                        const high = data.high;
                        const low = data.low;
                        let newString = `
                        <div class="value-box">
                            <div style="width:110px; text-align:flex-start">${date}</div>
                            <div style="width:73px; text-align:flex-start">O : <span id="openValue">${Math.round(100 * open) / 100}</span></div>
                            <div style="width:73px; text-align:flex-start">H : <span id="highValue">${Math.round(100 * high) / 100}</span></div>
                            <div style="width:73px; text-align:flex-start">L : <span id="lowValue">${Math.round(100 * low) / 100}</span></div>
                            <div style="width:73px; text-align:flex-start">C : <span id="closeValue">${Math.round(100 * close) / 100}</span></div>
                        </div>
                        `

                        predictionsBox.innerHTML = newString
                        break;
                    default:
                        break;
                }
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [predictedValueRedux, actualColor, predictedColor])

    // sets the background color of the chart based on theme
    useEffect(() => {
        // console.log('UE : Predctions Chart background')
        if (predictedValueRedux.length === 0 || !predictionsChartRef.current) {
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
    }, [chartBackgroundColor, predictedValueRedux, textColor])

    return (
        <Box width="100%" className='prediction-chart-component-box'>
            <Box className='predictionChart-box' position='relative' display='flex' flexDirection='column' gap='20px' width="100%" height='280px' >
                {predictedValueRedux.length !== 0 &&
                    <Box className='predictions-legend'>
                        <Box className='predictions-value-box' p={'5px'}></Box>
                    </Box>
                }
                <Box className='prediction-chart-ref-box' ref={predictionsChartRef} width="100%" height="100%"></Box>

                <Box position={'absolute'} sx={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    {trainingStartedFlag ?
                        <Box className='prediction-loader' position='relative' width='100%' height='100%'>
                            <Skeleton variant="rectangular" width="100%" height='100%' />
                            <Box position='absolute' top='42%' left='50%' sx={{ transform: 'translate(-50%, -50%)' }} width='fit-content' display='flex' flexDirection='row' justifyContent='center'>
                                <Typography variant='custom' id='loader-message-text' style={{ textAlign: 'center', whiteSpace: 'nowrap', textOverflow: 'ellipssis', overflow: 'hidden', maxWidth: '400px' }}>Training started</Typography>
                                <div className="center">
                                    {[...Array(11)].map((_, index) => (
                                        <div key={index} className="wave"></div>
                                    ))}
                                </div>
                            </Box>
                        </Box>
                        : Object.keys(chartData).length === 3 &&
                        <Box display='flex' alignItems='center' justifyContent='center' p={1} >
                            <Paper elevation={4} style={{ padding: '5px' }}>Start training to view predictions</Paper>
                        </Box>
                    }
                </Box>


            </Box >
        </Box >
    )
}

export default PredictionsChart