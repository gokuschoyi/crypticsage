import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Box, useTheme, IconButton } from '@mui/material'
import { createChart } from 'lightweight-charts';
import { updateTickerWithOneDataPoint, getHistoricalTickerDataFroDb } from '../../../../../api/adminController'
import { useSelector, useDispatch } from 'react-redux'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
    setStreamedTickerDataRedux
    , setCryptoDataInDbRedux
    , setIsDataNewFlag
    , toggleShowHideChartFlag
    , removeFromSelectedFunction
    , resetStreamedTickerDataRedux
} from '../modules/CryptoStockModuleSlice'
const checkForUniqueAndTransform = (data) => {
    const uniqueData = [];
    const seenTimes = new Set();

    data.forEach((item) => {
        if (!seenTimes.has(item.openTime)) {
            uniqueData.push({
                time: (item.openTime / 1000),
                open: parseFloat(item.open),
                high: parseFloat(item.high),
                low: parseFloat(item.low),
                close: parseFloat(item.close),
                volume: parseFloat(item.volume),
            })
            seenTimes.add(item.openTime);
        } else {
            console.log('Duplicate found', item.openTime)
        }
    })
    return uniqueData
}

const calculateRsiData = (data) => {
    const rsi_data = data
        .filter((d) => d.high)
        .map((d) => ({ time: d.time, value: d.low }));
    return rsi_data
}

const calculateVolumeData = (data) => {
    const volDat = data.filter((d) => d.volume)
    // Calculate volume movement and set color based on it
    const volDataWithColor = volDat.map((d, index) => {
        const currentVolume = d.volume;
        const previousVolume = index > 0 ? volDat[index - 1].volume : null;

        // Determine color based on volume movement
        let color = 'neutral'; // Default to neutral color
        if (previousVolume !== null) {
            if (currentVolume > previousVolume) {
                color = 'green'; // Increased volume
            } else if (currentVolume < previousVolume) {
                color = 'red'; // Decreased volume
            }
        }

        return {
            time: d.time,
            value: currentVolume,
            color: color, // Add the "color" key
        };
    });

    return volDataWithColor;

}

const MainChart = (props) => {
    const { latestTime, new_fetch_offset, symbol, selectedTokenPeriod, module } = props;
    const token = useSelector(state => state.auth.accessToken);
    const theme = useTheme()
    const chartBackgroundColor = theme.palette.background.default

    const dispatch = useDispatch()
    // const streamedTickerData = useSelector(state => state.cryptoStockModule.streamedTickerData)
    const tDataRedux = useSelector(state => state.cryptoStockModule.cryptoDataInDb)

    const newFetchedDataCount = useRef(0)
    const latestDateRf = useRef(latestTime) // latest time in the fetched data. Data doe not inclusive of this time
    const candleStickSeriesRef = useRef(null)
    const candleStickVolumeSeriesRef = useRef(null)
    const rsiSeriesRef = useRef(null)

    const selectedFunctionData = useSelector(state => state.cryptoStockModule.selectedFunctions)
    const modifiedSelectedFunctionWithDataToRender = useSelector(state => state.cryptoStockModule.modifiedSelectedFunctionWithDataToRender)
    const wsRef = useRef(null)
    const pageNo = useRef(1)
    const newDataRef = useRef([...tDataRedux])
    const chart = useRef(null)
    const chartboxRef = useRef();

    // Main chart useEffect
    useEffect(() => {
        console.log("UE : Main chart")
        console.log(tDataRedux.length)
        let tData = checkForUniqueAndTransform(tDataRedux)

        let tokenChartBox = document.getElementsByClassName('token-chart-box')[0].getBoundingClientRect()
        let offsetLeft = Math.round(tokenChartBox.left);
        let offsetTop = Math.round(tokenChartBox.top)

        let tokenDom = document.getElementsByClassName('chart-cont-dom')[0]
        let cWidth = tokenDom.clientWidth;
        let cHeight = tokenDom.clientHeight;

        const tooltipPadding = 10;
        const tooltip = document.getElementsByClassName('tool-tip-indicators')[0]
        let toolTipXCoOrdinates = 0, toolTipYCoOrdinates = 0;

        const handleResize = () => {
            cWidth = tokenDom.clientWidth;
            cHeight = tokenDom.clientHeight;
            // console.log(cWidth, cHeight)
            chart.current.applyOptions({ width: cWidth, height: cHeight });

            tokenChartBox = document.getElementsByClassName('token-chart-box')[0].getBoundingClientRect()
            offsetLeft = Math.round(tokenChartBox.left);
            offsetTop = Math.round(tokenChartBox.top)

            scrollYAxis = window.scrollY
        };

        // gets the global mouse co-ordinates form the document- desktops
        const calculateMousePosition = (event) => {
            toolTipXCoOrdinates = event.pageX;
            toolTipYCoOrdinates = event.pageY;
        }

        // gets the global mouse co-ordinates form the document- touch devices
        const handleTouchMove = (event) => {
            toolTipXCoOrdinates = event.touches[0].pageX;
            toolTipYCoOrdinates = event.touches[0].pageY;
        }


        let scrollYAxis = window.scrollY

        // console.log(cWidth, cHeight)

        chart.current = createChart(chartboxRef.current, {
            width: cWidth,
            height: cHeight,
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
                mode: 'magnet',
            },
            rightPriceScale: {
                borderColor: 'rgba(197, 203, 206, 0.8)',
            },
            timeScale: {
                borderColor: 'rgba(197, 203, 206, 0.8)',
            }
        });

        chart.current.timeScale().fitContent();

        // Candlestick
        candleStickSeriesRef.current = chart.current.addCandlestickSeries({
            upColor: 'green',
            downColor: 'red',
            wickVisible: true,
        })

        candleStickSeriesRef.current.priceScale().applyOptions({
            scaleMargins: {
                // positioning the price scale for the area series
                top: 0.1,
                bottom: 0.4,
            },
        });

        candleStickSeriesRef.current.setData(tData);

        // Volume
        candleStickVolumeSeriesRef.current = chart.current.addHistogramSeries({
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '',
            scaleMargins: {
                top: 0.7, // highest point of the series will be 70% away from the top
                bottom: 0,
            },
        })

        candleStickVolumeSeriesRef.current.priceScale().applyOptions({
            scaleMargins: {
                top: 0.7, // highest point of the series will be 70% away from the top
                bottom: 0,
            },
        });
        const volDat = calculateVolumeData(tData)
        candleStickVolumeSeriesRef.current.setData(volDat);

        // RSI
        rsiSeriesRef.current = chart.current.addLineSeries({
            color: 'purple',
            lineWidth: 1,
            pane: 1,
        });
        const rsi_data = calculateRsiData(tData)
        rsiSeriesRef.current.setData(rsi_data);


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

        let uniqueBarNumbers = [];
        let lastBarNo = 0
        let fetchPoint = Math.floor(newDataRef.current.length * 0.2) / -1

        // Create a debounced version of your data fetching logic
        const debouncedFetchData = debounce((barNo, candleSticksInVisibleRange) => {
            // Your data fetching logic here
            if (barNo < fetchPoint) {
                pageNo.current = pageNo.current + 1;
                console.log('Fetching more data', barNo, pageNo.current);

                // Fetch new data query
                const fetchQuery = {
                    asset_type: module,
                    ticker_name: symbol,
                    period: selectedTokenPeriod,
                    page_no: pageNo.current,
                    items_per_page: 500,
                    new_fetch_offset: new_fetch_offset + newFetchedDataCount.current
                }
                // console.log(fetchQuery)

                getHistoricalTickerDataFroDb({ token, payload: fetchQuery })
                    .then((res) => {
                        const newData = res.data.fetchedResults.ticker_data
                        newDataRef.current = [...newData, ...newDataRef.current]
                        fetchPoint = Math.floor(candleSticksInVisibleRange * 0.2) / -1
                        dispatch(setCryptoDataInDbRedux(newDataRef.current))
                        const uniqueData = checkForUniqueAndTransform(newDataRef.current)

                        candleStickSeriesRef.current.setData(uniqueData)
                        candleStickVolumeSeriesRef.current.setData(calculateVolumeData(uniqueData))
                        rsiSeriesRef.current.setData(calculateRsiData(uniqueData))

                        uniqueBarNumbers = []
                    })
            } else {
                // console.log('No fetch', barNo, pageNo.current, lastBarNo, fetchPoint);
            }
        }, 500); // Adjust the delay as needed (e.g., 1000ms = 1 second)

        chart.current.timeScale().subscribeVisibleLogicalRangeChange((param) => {
            // console.log(param)
            const { from, to } = param
            const candleSticksInVisibleRange = Math.floor(to - from)
            fetchPoint = Math.floor(candleSticksInVisibleRange * 0.2) / -1

            const barsInfo = candleStickSeriesRef.current.barsInLogicalRange(param);
            const { barsBefore } = barsInfo
            const barNo = Math.floor(barsBefore)

            // Check if the generated barNo is unique
            if (!uniqueBarNumbers.includes(barNo)) {
                uniqueBarNumbers.push(barNo);
                if (barNo < lastBarNo) { // chcking if the chart is moving backwards, left to right
                    debouncedFetchData(barNo, candleSticksInVisibleRange);
                }
            }
            lastBarNo = barNo
        })

        // update tooltip
        chart.current.subscribeCrosshairMove((param) => {
            if (
                param.point === undefined ||
                !param.time ||
                param.point.x < 0 ||
                param.point.x > chartboxRef.current.clientWidth ||
                param.point.y < 0 ||
                param.point.y > chartboxRef.current.clientHeight ||
                param.paneIndex !== 0
            ) {
                tooltip.style.display = 'none';
            } else {
                const dateStr = new Date(param.time * 1000).toLocaleString('en-AU',
                    {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                    }
                );
                tooltip.style.display = 'block';
                const data = param.seriesData.get(candleStickSeriesRef.current);
                const volData = param.seriesData.get(candleStickVolumeSeriesRef.current);
                // console.log(volData)
                const open = data.value !== undefined ? data.value : data.open;

                const close = data.close;
                const high = data.high;
                const low = data.low;
                tooltip.innerHTML = `
                    <div style="color: ${'rgba(255, 82, 82, 1)'}">${symbol}</div>
                    <div class-name='tooltip-text' style="margin: 4px 0px; color: ${'black'}">O :${Math.round(100 * open) / 100}</div>
                    <div class-name='tooltip-text' style="margin: 4px 0px; color: ${'black'}">H :${Math.round(100 * high) / 100}</div>
                    <div class-name='tooltip-text' style="margin: 4px 0px; color: ${'black'}">L :${Math.round(100 * low) / 100}</div>
                    <div class-name='tooltip-text' style="margin: 4px 0px; color: ${'black'}">C :${Math.round(100 * close) / 100}</div>
                    <div class-name='tooltip-text' style="margin: 4px 0px; color: ${'black'}">V :${Math.round(volData.value).toFixed(2)}</div>
                    <div class-name='tooltip-text' style="color: ${'black'},font-size: 12px;">${dateStr}</div>
                    `;

                let diffX = toolTipXCoOrdinates - offsetLeft
                if (diffX > cWidth - 150) {
                    toolTipXCoOrdinates = toolTipXCoOrdinates - (100 + (tooltipPadding * 2))
                }

                let diffY = toolTipYCoOrdinates - offsetTop - scrollYAxis
                if (diffY > cHeight - 150) {
                    toolTipYCoOrdinates = toolTipYCoOrdinates - (100 + (tooltipPadding * 2))
                }
                // console.log(diffX, diffY)
                tooltip.style.left = `${toolTipXCoOrdinates + tooltipPadding}px`;
                tooltip.style.top = `${toolTipYCoOrdinates + tooltipPadding}px`;
            }
        })

        window.addEventListener('resize', handleResize);
        tokenDom.addEventListener('mousemove', (event) => calculateMousePosition(event))
        tokenDom.addEventListener('touchmove', (event) => handleTouchMove(event))

        return () => {
            console.log('UE : Main chart return')
            window.removeEventListener('resize', handleResize);
            tokenDom.removeEventListener('mousemove', calculateMousePosition)
            tokenDom.removeEventListener('touchmove', handleTouchMove)
            chart.current.remove();
            setChartSeriesState([])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol, selectedTokenPeriod])

    // sets the background color of the chart based on theme
    useEffect(() => {
        if (chart.current !== undefined || chart.current !== null) {
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
    }, [chartBackgroundColor])

    const [chartSeriesState, setChartSeriesState] = useState([])

    // renders the chart based on the selected functions
    const renderChart = useCallback(() => {
        if (modifiedSelectedFunctionWithDataToRender.length === 0 && chartSeriesState.length === 0) {
            console.log('No chart to render : Callback');
            return;
        }

        const lineColors = [
            "#FFAA00",
            "#DDBB77",
            "#EECC99",
            "#CCAACC",
            "#DDDD88",
            "#FF9966",
            "#FFBB88",
        ]

        console.time('Chart Load Time');

        const reduxDataCopy = JSON.parse(JSON.stringify(modifiedSelectedFunctionWithDataToRender));

        // filter and remove charts with old data based on isDataNew flag
        const chartsWithNewData = reduxDataCopy.filter((f) => f.isDataNew === true);
        if (chartsWithNewData.length > 0) {
            console.log('Charts with new data', chartsWithNewData.length);
            chartsWithNewData.forEach((f) => {
                const seriesToRemove = chartSeriesState.find((series) => series.id === f.id && series.key === f.key);
                if (seriesToRemove) {
                    chart.current.removeSeries(seriesToRemove.series);
                    setChartSeriesState((prevSeries) => prevSeries.filter((series) => series.id !== f.id))
                }
            })
            dispatch(setIsDataNewFlag())
        } else { console.log("No new data for chart") }

        // checking and rendering chart
        selectedFunctionData.forEach((func) => {
            const funcIds = func.functions.map((f) => f.id) // if count = 1 then it is a single function else if 2 a copy of same function is present
            // console.log("Func id from redux", funcIds)
            funcIds.forEach((id) => {
                const filtered = reduxDataCopy.filter((chartData) => chartData.id === id);
                // console.log("Filtered", filtered)
                filtered.forEach((f) => {
                    const existingInState = chartSeriesState.find((series) => series.id === f.id && series.key === f.key);
                    // console.log("Existing in state", existingInState)
                    if (existingInState) {
                        // console.log('Existing in state', f.key)
                        existingInState.series.applyOptions({ visible: f.visible });
                    } else {
                        // console.log("Does not exist in state", f.key)
                        const newSeries = chart.current.addLineSeries({
                            color: lineColors[Math.floor(Math.random() * lineColors.length)],
                            lineWidth: 1,
                            visible: f.visible,
                            priceLineVisible: false,
                            lastValueVisible: false,
                        });
                        newSeries.setData(f.result);
                        setChartSeriesState((prevSeries) => [...prevSeries, { name: f.name, series: newSeries, id: f.id, key: f.key }]);
                    }
                });
            });
        });

        // checking and removing chart
        const existingSeriesId = chartSeriesState.map((series) => ({ id: series.id, key: series.key }));
        const functionsInState = reduxDataCopy.map((func) => ({ id: func.id, key: func.key }));
        const difference = existingSeriesId.filter((series) => !functionsInState.some((func) => func.id === series.id && func.key === series.key));

        // console.log(existingSeriesId)
        // console.log(functionsInState)
        // console.log(difference)

        difference.forEach((func) => {
            const seriesToRemove = chartSeriesState.find((series) => series.id === func.id && series.key === func.key);
            if (seriesToRemove) {
                chart.current.removeSeries(seriesToRemove.series);
                // Update chartSeriesState to remove the deleted series
                setChartSeriesState((prevSeries) => prevSeries.filter((series) => series.id !== func.id))
            }
        });

        console.timeEnd('Chart Load Time');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chartSeriesState, modifiedSelectedFunctionWithDataToRender]);

    useEffect(() => {
        console.log('<---------------------START-------------------------->');
        renderChart();

        // Subscribe to crosshair move event
        const crosshairMoveHandler = (param) => {
            if (
                param.point === undefined ||
                !param.time ||
                param.point.x < 0 ||
                param.point.x > chartboxRef.current.clientWidth ||
                param.point.y < 0 ||
                param.point.y > chartboxRef.current.clientHeight ||
                param.paneIndex !== 0
            ) {
                return;
            }

            const seriesDataMap = new Map(param.seriesData);

            chartSeriesState.forEach((series) => {
                const seriesValue = seriesDataMap.get(series.series);
                if (seriesValue !== undefined) {
                    const divToInsertDataTo = document.querySelector(`.${series.name}_${series.id}_${series.key}`);
                    if (divToInsertDataTo) {
                        let displayKey = convertKeysForDisplay(series.key)
                        divToInsertDataTo.innerHTML = `${displayKey} : ${seriesValue.value.toFixed(2)}`
                    }
                }
            });
        };

        chart.current.subscribeCrosshairMove(crosshairMoveHandler);

        console.log('<------------------END----------------------------->');

        return () => {
            console.log('Add : UE RETURN');
            chart.current.unsubscribeCrosshairMove(crosshairMoveHandler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [renderChart]);

    // web socket warning becaue of react strict mode
    useEffect(() => {
        const lowerCaseSymbol = symbol.toLowerCase()
        const webSocketConnectionURI = `wss://stream.binance.com:9443/ws/${lowerCaseSymbol}@kline_${selectedTokenPeriod}`

        const createWebSocket = () => {
            const ws = new WebSocket(webSocketConnectionURI);
            wsRef.current = ws;

            ws.onmessage = (e) => {
                const message = JSON.parse(e.data);
                const tickerPayload = {
                    openTime: message.k.t,
                    open: message.k.o,
                    high: message.k.h,
                    low: message.k.l,
                    close: message.k.c,
                    volume: message.k.v,
                    closeTime: message.k.T,
                    quoteAssetVolume: message.k.q,
                    trades: message.k.n,
                    takerBaseAssetVolume: message.k.V,
                    takerQuoteAssetVolume: message.k.Q,
                };

                // Update your chart series
                candleStickSeriesRef.current.update({
                    time: tickerPayload.openTime / 1000,
                    open: parseFloat(tickerPayload.open),
                    high: parseFloat(tickerPayload.high),
                    low: parseFloat(tickerPayload.low),
                    close: parseFloat(tickerPayload.close),
                });

                candleStickVolumeSeriesRef.current.update({
                    time: tickerPayload.openTime / 1000,
                    value: parseFloat(tickerPayload.volume),
                })

                rsiSeriesRef.current.update({ time: tickerPayload.openTime / 1000, value: tickerPayload.low });

                if (latestDateRf.current < tickerPayload.openTime && selectedTokenPeriod === '1m') {
                    const fetchQuery = {
                        ticker_name: symbol,
                        period: selectedTokenPeriod,
                        start: latestDateRf.current,
                        end: latestDateRf.current + 59000,
                    }
                    console.log('New ticker data available. Fetch one ticker', new Date(latestDateRf.current).toLocaleString(), new Date(latestDateRf.current + 59000).toLocaleString())
                    latestDateRf.current = tickerPayload.openTime

                    dispatch(setStreamedTickerDataRedux({
                        time: tickerPayload.openTime / 1000,
                        open: parseFloat(tickerPayload.open),
                        high: parseFloat(tickerPayload.high),
                        low: parseFloat(tickerPayload.low),
                        close: parseFloat(tickerPayload.close),
                        volume: parseFloat(tickerPayload.volume),
                    }))

                    updateTickerWithOneDataPoint({ token, fetchQuery })
                        .catch((err) => {
                            console.log(err)
                        })
                    newFetchedDataCount.current = newFetchedDataCount.current + 1
                } else {
                    // console.log('Streaming data');
                }
            };

            ws.onerror = (e) => {
                // console.log(e);
            };
        };

        if (candleStickSeriesRef.current && rsiSeriesRef.current) {
            // console.log('Connecting to binance WS for ticker data');
            // if (wsRef.current !== null) {
            //     // console.log('Closing old WS connection from UE');
            //     wsRef.current.close(); // Close the existing WebSocket connection
            // }
            createWebSocket();
        }

        return () => {
            if (wsRef.current) {
                // console.log('UE : RETURN , Closing WS connection')
                wsRef.current.close(); // Close the WebSocket connection on unmount
            }
        }
    }, [selectedTokenPeriod, symbol, token, dispatch])

    // handles the show/hide chart button
    const handleToggleShowHideChart = (param) => {
        const { id, name } = param
        // console.log(name, id)
        dispatch(toggleShowHideChartFlag({ id: id, name: name }))
    }

    // handles the settings button - to be implemented
    const handleOpenSettingsModal = (param) => {
        const { id, name } = param
        console.log(name, id)
    }

    // handles the delete button
    const handleDeleteQuery = (param) => {
        const { id, name, group_name } = param
        console.log(id, name, group_name)
        dispatch(removeFromSelectedFunction({ id: id, name: name, group_name: group_name }))
    }

    const convertKeysForDisplay = (key) => {
        let final = ''
        switch (key) {
            case 'outRealUpperBand':
                final = 'U'
                break;
            case 'outRealLowerBand':
                final = 'L'
                break;
            case 'outRealMiddleBand':
                final = 'M'
                break;
            case 'outInPhase':
                final = 'Phase'
                break;
            case 'outQuadrature':
                final = 'Quad'
                break;
            case 'outSine':
                final = 'Sine'
                break;
            case 'outLeadSine':
                final = 'LeadSine'
                break;
            case 'outMACD':
                final = 'Out'
                break;
            case 'outMACDSignal':
                final = 'Signal'
                break;
            case 'outMACDHist':
                final = 'Hist'
                break;
            case 'outSlowK':
                final = 'SlowK'
                break;
            case 'outSlowD':
                final = 'SlowD'
                break;
            case 'outFastK':
                final = 'FastK'
                break;
            case 'outFastD':
                final = 'FastD'
                break;
            default:
                break;
        }
        return final
    }

    return (
        <Box sx={{ width: '100%', height: '100%' }}>
            <Box className='chart-cont-dom' width="100%" height="100%" >
                <Box className='selected-function-legend' pt={'5px'}>
                    {selectedFunctionData.map((selectedFunction, index) => {
                        const selectedFunc = selectedFunction.functions
                        const outputs = selectedFunction.outputs
                        return (
                            <Box key={index} className='selected-function-unique' justifyContent='space-between' alignItems='center'>
                                {selectedFunc.map((func, i) => (
                                    <Box key={i} display='flex' flexDirection='row' alignItems='center'>
                                        <Box className='function-title' display='flex' flexDirection='row' gap='5px'>
                                            {func.name}
                                            {outputs.map((output, j) => (
                                                <Box key={j} className={`${func.name}_${func.id}_${output.name}`}></Box>
                                            ))}
                                        </Box>
                                        {func.outputAvailable &&
                                            <IconButton size='small' aria-label="Hide chart" color="secondary" onClick={handleToggleShowHideChart.bind(null, { id: func.id, name: func.name })}>
                                                {func.show_chart_flag ?
                                                    <VisibilityOffIcon className='smaller-icon' />
                                                    :
                                                    <VisibilityIcon className='smaller-icon' />
                                                }
                                            </IconButton>
                                        }
                                        <IconButton size='small' aria-label="modify query" color="secondary" onClick={handleOpenSettingsModal.bind(null, { id: func.id, name: func.name })} >
                                            <SettingsIcon className='smaller-icon' />
                                        </IconButton>
                                        <IconButton size='small' aria-label="delete query" color="secondary" onClick={handleDeleteQuery.bind(null, { id: func.id, name: func.name, group_name: selectedFunction.group_name })}>
                                            <DeleteOutlineIcon className='smaller-icon' />
                                        </IconButton>
                                    </Box>
                                ))}
                            </Box>
                        )
                    })}
                </Box>
                <Box ref={chartboxRef}></Box>
                <Box className='tool-tip-indicators'></Box>
            </Box>
        </Box >
    )
}

export default MainChart