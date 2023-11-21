import React, { useEffect, useRef } from 'react'
import { Box, useTheme, Skeleton, Typography, Paper } from '@mui/material'
import { createChart } from 'lightweight-charts';
import { useSelector, useDispatch } from 'react-redux';
import { setBarsFromToPredictions, setStandardizedAndScaledPredictions } from '../modules/CryptoModuleSlice'

const calculateMetrics = (data, thresholdLower = 0.01, thresholdUpper = 0.02) => {
    let TP = 0;
    let FP = 0;
    let TN = 0;
    let FN = 0;
    data = data.filter((value) => value.actual !== null && value.predicted !== null)
    for (let i = 0; i < data.length; i++) {
        const actualChange = data[i].actual;
        const predictedChange = data[i].predicted;
        const percentChange = (predictedChange - actualChange) / actualChange;
        // console.log(percentChange * 100)
        if (percentChange >= -thresholdLower && percentChange <= thresholdLower) {
            TP++;
        } else if (percentChange >= thresholdLower && percentChange <= thresholdUpper) {
            FN++;
        } else if (percentChange > thresholdUpper) {
            TN++;
        } else if (percentChange < -thresholdLower) {
            FP++;
        }
    }

    const accuracy = (TP + TN) / (TP + FP + TN + FN); // how close the predicted values are to the actual values based on the threshold. Higher the value better the model
    const precision = TP / (TP + FP); // how many of the predicted values are actually correct. Higher the value better the model
    const recall = TP / (TP + FN); // how many of the actual values are predicted correctly. Higher the value better the model
    const f1 = (2 * precision * recall) / (precision + recall); // harmonic mean of precision and recall. Higher the value better the model

    return {
        TP,
        FP,
        TN,
        FN,
        accuracy: accuracy.toFixed(4),
        precision: precision.toFixed(4),
        recall: recall.toFixed(4),
        f1: f1.toFixed(4)
    };
}

function calculateMSE(actual, predicted) {
    if (actual.length !== predicted.length) {
        throw new Error("Arrays should be of equal length");
    }

    let sum = 0;
    for (let i = 0; i < actual.length; i++) {
        sum += Math.pow(predicted[i] - actual[i], 2);
    }

    let mse = sum / actual.length;
    let rmse = Math.sqrt(mse);
    return { mse, rmse };
}

const PredictionsChart = (props) => {
    const { predictionChartType, trainingStartedFlag, model_type, lookAhead, predictionLookAhead, setModelMetrics } = props
    const theme = useTheme()
    const dispatch = useDispatch()
    const chartBackgroundColor = theme.palette.background.default

    const chartData = useSelector(state => state.cryptoModule.modelData.predictedValues)
    // console.log(chartData)

    const [predictedValueRedux, setPredictedValue] = React.useState([]) // chart not removed on reset

    const predictionsChartRef = useRef(null)
    const chart = useRef(null)
    const actualValueRef = useRef(null)
    const predictedValueRef = useRef(null)
    const allPredictions = useSelector(state => state.cryptoModule.modelData.predictedValues.predictions_array)
    const dates = useSelector(state => state.cryptoModule.modelData.predictedValues.dates)

    // updates the predicted value based on the chart type
    useEffect(() => {
        // console.log('UE : Predctions Chart')
        if (chartData.standardized.length === 0 || chartData.scaled.length === 0) {
            setPredictedValue([])
            return
        }
        else {
            setPredictedValue(chartData[predictionChartType])
        }
    }, [chartData, predictionChartType, dates])

    // console.log(predictionLookAhead)

    const calculateOriginalPrice = (value, variance, mean) => {
        if (value === null) return null;
        return (value * Math.sqrt(variance)) + mean;
    };


    // console.log(predictionLookAhead)
    useEffect(() => {
        // const lastTickers = predictedValueRedux.slice(-(lookAhead * 2 - 2))
        // console.log(lastTickers)
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
                // console.log(predict)
                predict.forEach((value, index) => {
                    forecastResult.push({
                        openTime: new Date(lastDate + (tickerPeriodInMilliSecond * (index + 1))).toLocaleString(),
                        open: (lastDate + (tickerPeriodInMilliSecond * (index + 1))) / 1000,
                        actual: null,
                        predicted: value[predIndex][0]
                    })
                })

                const newLastDate = forecastResult[forecastResult.length - 1].open * 1000
                for (let i = predictionLookAhead; i <= chartData.forecast.length; i++) {
                    forecastResult.push({
                        openTime: new Date(newLastDate + (tickerPeriodInMilliSecond * (i - 1))).toLocaleString(),
                        open: (newLastDate + (tickerPeriodInMilliSecond * (i - 1))) / 1000,
                        actual: null,
                        predicted: chartData.forecast[i - 1][0]
                    })
                }
            }

            // console.log(forecastResult)

            shiftedPredictedValues = [...shiftedPredictedValues, ...forecastResult]

            const originalDataAfterShifting = shiftedPredictedValues.map((value) => ({
                ...value,
                actual: calculateOriginalPrice(value.actual, chartData.label_variance, chartData.label_mean),
                predicted: calculateOriginalPrice(value.predicted, chartData.label_variance, chartData.label_mean),
            }))

            dispatch(setStandardizedAndScaledPredictions({ standardized: shiftedPredictedValues, scaled: originalDataAfterShifting }))


            const metrics = calculateMetrics(originalDataAfterShifting);
            // console.log(metrics)

            let mscSt = calculateMSE(shiftedPredictedValues.map((value) => value.actual), shiftedPredictedValues.map((value) => value.predicted))
            // console.log('Standardized : ',mscSt)

            let mse = calculateMSE(originalDataAfterShifting.map((value) => value.actual), originalDataAfterShifting.map((value) => value.predicted))
            // console.log('Scaled : ',mse)

            setModelMetrics({
                metrics,
                mseStandardized: mscSt,
                mseScaled: mse
            })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [predictionLookAhead, chartData.dates])

    // creates the chart
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
            let markers = []
            switch (model_type) {
                case 'multi_input_single_output_no_step':
                case 'multi_input_single_output_step':
                    const actual_values = predictedValueRedux
                        .filter((prediction) => prediction.actual !== null)
                        .map((prediction) => ({
                            time: prediction.open,
                            value: prediction.actual,
                            color: '#00ff00',
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
                                        color: '#ff0000',
                                    }

                                } else {
                                    return {
                                        time: prediction.open,
                                        value: prediction.predicted,
                                        color: '#F57C00',
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

                    markers.push({
                        time: predicted_values[predicted_values.length - lookAhead].time,
                        position: 'aboveBar',
                        color: 'red',
                        shape: 'circle',
                        text: 'prediction',
                        size: 0.4
                    })

                    predictedValueRef.current.setData(predicted_values);
                    predictedValueRef.current.setMarkers(markers)
                    break;
                case 'multi_input_multi_output_no_step':
                    console.log('Multi paraller chart')

                    const nullRemoved = predictedValueRedux.filter((value) => value.open !== null)
                        .map((item) => ({
                            time: item.time,
                            open: item.open,
                            high: item.high,
                            low: item.low,
                            close: item.close,

                        }))

                    markers.push({
                        time: nullRemoved[nullRemoved.length - 1].time,
                        position: 'aboveBar',
                        color: 'red',
                        shape: 'circle',
                        text: 'prediction',
                        size: 0.4
                    })
                    actualValueRef.current = chart.current.addCandlestickSeries({
                        upColor: '#00ff00',
                        downColor: '#ff0000',
                        wickVisible: true,
                    })
                    actualValueRef.current.setData(nullRemoved)
                    actualValueRef.current.setMarkers(markers)
                    break;
                default:
                    console.log('No model')
                    break;
            }

            window.addEventListener('resize', handleResize);
        }

        return () => {
            // console.log('UE Return : Predctions Chart')
            window.removeEventListener('resize', handleResize);
            chart.current.timeScale().unsubscribeVisibleTimeRangeChange(barsInChartHandler)
            chart.current.remove()
            chart.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [predictedValueRedux])

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
                                <div style="width:110px; text-align:start">${date}</div>
                                <Typography style="display:flex; align-items:center; gap:4px;" variant='custom'><div style="width:8px; height:8px; border-radius:10px; background-color:#12ff12"></div>Actual : ${act_val}</Typography>
                                <Typography style="display:flex; align-items:center; gap:4px;" variant='custom'><div style="width:8px; height:8px; border-radius:10px; background-color:red"></div>Predicted : ${pred_val}</Typography>
                                <Typography variant='custom'>${diff > 0 ? 'Over : ' : 'Under '}<span style="color:${diff > 0 ? 'red' : '#12ff12'}">${`${diff},`} ${`${percentageChange}%`}</span></Typography>
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
                            <div style="width:110px; text-align:start">${date}</div>
                            <div style="width:73px; text-align:start">O : <span id="openValue">${Math.round(100 * open) / 100}</span></div>
                            <div style="width:73px; text-align:start">H : <span id="highValue">${Math.round(100 * high) / 100}</span></div>
                            <div style="width:73px; text-align:start">L : <span id="lowValue">${Math.round(100 * low) / 100}</span></div>
                            <div style="width:73px; text-align:start">C : <span id="closeValue">${Math.round(100 * close) / 100}</span></div>
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
        <Box width="100%" className='prediction-chart-component-box'>
            <Box className='predictionChart-box' display='flex' flexDirection='column' gap='20px' width="100%" height='310px' >
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
                ) : Object.keys(chartData).length === 0 && (
                    <Box display='flex' height='100%' alignItems='center' justifyContent='center' p={1} >
                        <Paper elevation={4} style={{ padding: '5px' }}>Start training to view predictions</Paper>
                    </Box>
                )
                }

                {predictedValueRedux.length !== 0 &&
                    <Box className=' predictions-legend '>
                        <Box className='predictions-value-box' p={'5px'}></Box>
                    </Box>
                }
                <Box className='prediction-chart-ref-box' ref={predictionsChartRef}></Box>
            </Box >
        </Box >
    )
}

export default PredictionsChart