import React, { useEffect, useRef } from 'react'
import { Box, useTheme, FormControl, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { createChart } from 'lightweight-charts';
const ModelHistoryChart = ({ epochResults, predictionsPalette, isValidatingOnTestSet, totalEpochs }) => {
    const theme = useTheme()
    const chartBackgroundColor = theme.palette.background.default
    const textColor = theme.palette.primary.newWhite
    const chartContainerRef = useRef()
    const chart = useRef(null)
    const metricLineSeriesRef = useRef({})
    const metricColors = Object.keys(predictionsPalette).map(key => predictionsPalette[key])

    const [lossChartType, setLossChartType] = React.useState('both');
    const handleLoosChartType = (event) => {
        setLossChartType(event.target.value);
    };

    // create the chart when epoch = 1 or epoch = totalEpochs
    useEffect(() => {
        // console.log('UE: Initial loading of history chart when epoch = 1')
        if (chart.current === null && (epochResults.length === 1 || epochResults.length === totalEpochs)) {
            // console.log('Chart not present and epoch = 1 or epoch = totalEpochs')
            chart.current = createChart(chartContainerRef.current, {
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
                rightPriceScale: {
                    borderColor: 'rgba(197, 203, 206, 0.8)',
                    axisLabelVisible: false,
                },
                timeScale: {
                    visible: false,
                },
                crosshair: {
                    mode: 1
                },
            });
            chart.current.timeScale().fitContent();

            const keysInEpochResult = Object.keys(epochResults[0] || {});
            const filtered = keysInEpochResult.filter(key => !['loss', 'val_loss', 'epoch'].includes(key));
            // console.log(filtered)

            filtered.forEach((key, index) => {
                const lineData = epochResults.map((item, index) => ({ time: index + 1, value: item[key] }));
                // console.log(lineData)
                const lineSeries = chart.current.addLineSeries({
                    color: metricColors[index],
                    lineWidth: 2,
                    lineType: 2,
                    title: key,
                });
                lineSeries.applyOptions({
                    priceFormat: {
                        type: 'price',
                        precision: 6,
                        minMove: 0.000001,
                    },
                });
                lineSeries.setData(lineData);
                metricLineSeriesRef.current[key] = lineSeries;
            })
        } else {
            // console.log('Chart present or epoch > 1 or epoch = totalEpochs')
            return
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [epochResults])

    // updates the chart when epoch > 1
    useEffect(() => {
        const keysInEpochResult = Object.keys(epochResults[0] || {});
        const filtered = keysInEpochResult.filter(key => !['loss', 'val_loss', 'epoch'].includes(key));
        // console.log(filtered)

        // console.log('UE : History chart Updating : epoch > 1')
        if (chart.current !== null && epochResults.length > 1 && epochResults.length <= totalEpochs) {
            // console.log('Updating chart')

            filtered.forEach((key, index) => {
                if (metricLineSeriesRef.current[key]) {
                    // console.log('Line present', key)
                    const newData = epochResults.slice(-1)
                    const data = newData.map((item, index) => ({ time: epochResults.length, value: item[key] }));
                    const seriesToUpdate = metricLineSeriesRef.current[key]
                    // console.log(data)
                    seriesToUpdate.update({ ...data[0] })
                }
            })
        } else if (chart.current === null && epochResults.length > 1) {
            // console.log('Chart not present or epoch = 1')
            chart.current = createChart(chartContainerRef.current, {
                width: chartContainerRef.current.clientWidth,
                height: chartContainerRef.current.clientHeight,
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
                rightPriceScale: {
                    borderColor: 'rgba(197, 203, 206, 0.8)',
                    axisLabelVisible: false,
                },
                timeScale: {
                    visible: false,
                },
                crosshair: {
                    mode: 1
                },
            });
            chart.current.timeScale().fitContent();

            filtered.forEach((key, index) => {
                const lineData = epochResults.map((item, index) => ({ time: index + 1, value: item[key] }));
                // console.log(lineData)
                const lineSeries = chart.current.addLineSeries({
                    color: metricColors[index],
                    lineWidth: 2,
                    lineType: 2,
                    title: key,
                });
                lineSeries.applyOptions({
                    priceFormat: {
                        type: 'price',
                        precision: 6,
                        minMove: 0.000001,
                    },
                });
                lineSeries.setData(lineData);
                metricLineSeriesRef.current[key] = lineSeries;
            })
            return
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [epochResults])

    // clean up the chart when epochResult length = 0 and chart is present
    useEffect(() => {
        if (chart.current && epochResults.length === 0) {
            console.log('UE : History chart clean up')
            const tooltip = document.querySelector('.model-hist-tooltip')
            tooltip.innerHTML = ''
            metricLineSeriesRef.current = {}
            chart.current.remove();
            chart.current = null;
        } else { return }
    })

    // show/hide the lines based on the type of chart - lossChartType
    useEffect(() => {
        if (chart.current) {
            // console.log(lossChartType)
            const metricKeys = Object.keys(epochResults[0] || {});
            const toRemove = ['loss', 'val_loss', 'epoch'];
            let filteredKeys = metricKeys.filter(key => !toRemove.includes(key));

            // Determine keys to show based on lossChartType
            let keysToShow = [];
            if (lossChartType === 'train') {
                keysToShow = filteredKeys.filter(key => !key.startsWith('val_'));
            } else if (lossChartType === 'val') {
                keysToShow = filteredKeys.filter(key => key.startsWith('val_'));
            } else if (['mse', 'mae'].includes(lossChartType)) {
                keysToShow = filteredKeys.filter(key => key.includes(lossChartType));
            } else {
                keysToShow = filteredKeys;
            }

            // console.log(keysToShow)

            // Set visibility of each series
            Object.keys(metricLineSeriesRef.current).forEach(key => {
                const isVisible = keysToShow.includes(key);
                const lineSeries = metricLineSeriesRef.current[key];
                if (lineSeries) {
                    lineSeries.applyOptions({ visible: isVisible });
                }
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lossChartType]);

    // sets the tooltip for the chart
    useEffect(() => {
        // console.log(metricLineSeriesRef.current)
        let tooltip = null
        const metricColors = Object.keys(predictionsPalette).map(key => predictionsPalette[key])
        const lossTooltipHandler = (param) => {
            if (
                param.point === undefined ||
                param.time === undefined ||
                param.point.x < 0 ||
                param.point.x > chartContainerRef.current.clientWidth ||
                param.point.y < 0 ||
                param.point.y > chartContainerRef.current.clientHeight ||
                param.paneIndex !== 0
            ) {
                tooltip = document.querySelector('.model-hist-tooltip')
                // tooltip.innerHTML = ''
                return;
            } else {
                let finalStr = ''
                tooltip = document.querySelector('.model-hist-tooltip')
                let ttStringTrain = ''
                let ttStringVal = ''
                let epoch = param.time
                Object.keys(metricLineSeriesRef.current).forEach(key => {
                    const data = param.seriesData.get(metricLineSeriesRef.current[key]);
                    // console.log(data)
                    if (key.startsWith('val_')) {
                        ttStringVal += `
                            <div class='model-hist-tooltip-item'>
                                <div style="width:8px; height:8px; border-radius:10px; background-color:${key === 'val_mse' ? metricColors[0] : metricColors[1]}"></div>
                                <span>&nbsp;</span>
                                <Typography class='model-hist-tooltip-item-key' style="display:flex; align-items:center; gap:4px;" variant='custom'>${key}</Typography>
                                <span>&nbsp;&nbsp</span>
                                <Typography class='model-hist-tooltip-item-value style="display:flex; align-items:center; gap:4px;" variant='custom'>${data.value.toFixed(6)}</Typography>
                            </div>
                        `
                    } else {
                        ttStringTrain += `
                            <div class='model-hist-tooltip-item'>
                            <div style="width:8px; height:8px; border-radius:10px; background-color:${key === 'mse' ? metricColors[2] : metricColors[3]}"></div>
                            <span>&nbsp;</span>
                            <Typography class='model-hist-tooltip-item-key' style="display:flex; align-items:center; gap:4px;" variant='custom'>${key}</Typography>
                                <span>&nbsp;&nbsp;</span>
                                <Typography class='model-hist-tooltip-item-value style="display:flex; align-items:center; gap:4px;" variant='custom'>${data.value.toFixed(6)}</Typography>
                            </div>
                        `
                    }
                    finalStr = `
                        <div class='model-hist-main-box'>
                            <div>
                                <Typography class='model-hist-tooltip-epoch' variant='custom'>Epoch ${epoch}</Typography>
                            </div>
                            <div class='model-hist-values'>
                                <div>
                                    ${ttStringTrain === '' ? '' : ttStringTrain}
                                </div>
                                <div>
                                    ${ttStringVal === '' ? '' : ttStringVal}
                                </div>
                            </div>
                        </div>
                    `
                    // console.log(finalStr)
                })
                tooltip.innerHTML = finalStr
            }
        }
        if (chart.current) {
            chart.current.subscribeCrosshairMove(lossTooltipHandler)
        } else {
            return
        }

        return () => {
            if (chart.current) {
                // tooltip.innerHTML = ''
                chart.current.unsubscribeCrosshairMove(lossTooltipHandler)
            }
        }
    }, [epochResults, predictionsPalette, lossChartType])

    // sets the color of the lines based on the theme
    useEffect(() => {
        if (chart.current) {
            const metricColors = Object.keys(predictionsPalette).map(key => predictionsPalette[key])
            // console.log(metricColors)
            Object.keys(metricLineSeriesRef.current).forEach((key, index) => {
                const lineSeries = metricLineSeriesRef.current[key]
                lineSeries.applyOptions({
                    color: metricColors[index]
                })
            })
        }
    }, [predictionsPalette])

    // const resizeObserver = useRef();
    // // Resize chart on container resizes.
    // useEffect(() => {
    //     resizeObserver.current = new ResizeObserver((entries) => {
    //         const { width, height } = entries[0].contentRect;
    //         // console.log(width, height);
    //         chart.current && chart.current.applyOptions({ width, height });
    //     });

    //     resizeObserver.current.observe(chartContainerRef.current);

    //     return () => resizeObserver.current.disconnect();
    // }, []);

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
                }
            })
        }
    }, [chartBackgroundColor, epochResults, textColor])

    /* useEffect(() => {
        let positive = 0
        let negative = 0
        if (epochResults.length === totalEpochs) {
            epochResults.forEach((item, index) => {
                if (item.val_mse > item.mse) {
                    positive++
                } else {
                    negative++
                }
            })
        }
        console.log(positive, negative)
    }) */

    return (
        <Box display={'flex'} flexDirection={'column'} gap={'4px'}>
            <Box className='model-history-chart-box' sx={{ height: epochResults.length > 0 ? '280px' : '0px' }}>
                <Box className='model-hist-legend'>
                    <Box className='model-hist-tooltip'></Box>
                </Box>
                <Box ref={chartContainerRef} height='100%' width='100%'></Box>
            </Box>
            {isValidatingOnTestSet && epochResults.length > 0 &&
                <Box display={'flex'} flexDirection={'row'} alignItems={'start'} pl={1} pt={2}>
                    <FormControl>
                        <RadioGroup
                            row
                            aria-labelledby="demo-controlled-radio-buttons-group"
                            name="controlled-radio-buttons-group"
                            value={lossChartType}
                            onChange={handleLoosChartType}
                        >
                            <FormControlLabel
                                value="both"
                                control={
                                    <Radio color='secondary'
                                        size='small'
                                        sx={{ padding: '4px' }}
                                    />
                                }
                                label="Both" />
                            <FormControlLabel
                                value="train"
                                control={
                                    <Radio color='secondary'
                                        size='small'
                                        sx={{ padding: '4px' }}
                                    />
                                }
                                label="Training" />
                            <FormControlLabel
                                value="val"
                                control={
                                    <Radio color='secondary'
                                        size='small'
                                        sx={{ padding: '4px' }}
                                    />
                                }
                                label="Validation" />
                            <FormControlLabel
                                value="mse"
                                control={
                                    <Radio color='secondary'
                                        size='small'
                                        sx={{ padding: '4px' }}
                                    />
                                }
                                label="MSE" />
                            <FormControlLabel
                                value="mae"
                                control={
                                    <Radio color='secondary'
                                        size='small'
                                        sx={{ padding: '4px' }}
                                    />
                                }
                                label="MAE" />
                        </RadioGroup>
                    </FormControl>
                    <Box></Box>
                </Box>
            }
        </Box>
    )
}

export default ModelHistoryChart