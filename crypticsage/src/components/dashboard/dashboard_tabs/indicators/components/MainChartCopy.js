import React, { useEffect, useRef, useState } from 'react'
import { Box } from '@mui/material'
import { createChart } from 'lightweight-charts';
import { updateTickerWithOneDataPoint, getHistoricalTickerDataFroDb } from '../../../../../api/adminController'
import { useSelector, useDispatch } from 'react-redux'
import { setStreamedTickerDataRedux, setCryptoDataInDbRedux, resetStreamedTickerDataRedux } from '../modules/CryptoStockModuleSlice'
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

const calculateNewRsiData = (data) => {
    const rsi_data_new = data
        .filter((d) => d.low)
        .map((d) => ({ time: d.time, value: d.close }));
    return rsi_data_new
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
    const chartboxRef = useRef();

    const dispatch = useDispatch()
    // const streamedTickerData = useSelector(state => state.cryptoStockModule.streamedTickerData)
    const tDataRedux = useSelector(state => state.cryptoStockModule.cryptoDataInDb)

    const newFetchedDataCount = useRef(0)
    const latestDateRf = useRef(latestTime) // latest time in the fetched data. Data doe not inclusive of this time
    const candleStickSeriesRef = useRef(null)
    const candleStickVolumeSeriesRef = useRef(null)
    const rsiSeriesRef = useRef(null)
    const rsiSeriesNewRef = useRef(null)

    const selectedFunctionData = useSelector(state => state.cryptoStockModule.selectedFunctions)

    const wsRef = useRef(null)
    const pageNo = useRef(1)
    const newDataRef = useRef([...tDataRedux])
    const chart = useRef(null)
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

        // RSI new
        rsiSeriesNewRef.current = chart.current.addLineSeries({
            color: 'red',
            lineWidth: 1,
            pane: 2,
        });
        const rsi_data_new = calculateNewRsiData(tData)
        rsiSeriesNewRef.current.setData(rsi_data_new);

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
                        rsiSeriesNewRef.current.setData(calculateNewRsiData(uniqueData))

                        uniqueBarNumbers = []
                    })
            } else {
                // console.log('No fetch', barNo, pageNo.current, lastBarNo, fetchPoint);
            }
        }, 500); // Adjust the delay as needed (e.g., 1000ms = 1 second)

        chart.current.timeScale().subscribeVisibleLogicalRangeChange((param) => {
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
            window.removeEventListener('resize', handleResize);
            tokenDom.removeEventListener('mousemove', calculateMousePosition)
            tokenDom.removeEventListener('touchmove', handleTouchMove)
            chart.current.remove();
            setChartSeriesState([])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol, selectedTokenPeriod])

    const lineColors = [
        "#FFAA00",
        "#DDBB77",
        "#EECC99",
        "#CCAACC",
        "#DDDD88",
        "#FF9966",
        "#FFBB88",
    ]

    const [chartSeriesState, setChartSeriesState] = useState([])
    useEffect(() => {
        if (chart.current !== null) {
            let reduxDataCopy = JSON.parse(JSON.stringify(selectedFunctionData))
            console.log("loading selectd function chart data")
            const contentBox = document.getElementsByClassName('selected-function-value-displaybox')[0]

            let functionTitles = ''
            const chartDataToRender = reduxDataCopy.flatMap((d) => {
                const name = d.name;
                const functions = d.functions;

                // Create an array to hold the results
                const finalResult = functions.map((f) => {
                    functionTitles = functionTitles + `<div id=${name}${f.differentiatorValue} style="display:flex; flex-direction:row; gap:10px" class='function-title'>${name}_${f.differentiatorValue}<div class=${name}_${f.id}></div></div>`
                    const convertedData = f.result
                        .filter((d) => d.outReal !== null)
                        .map((d) => ({
                            time: d.time,
                            value: d.outReal
                        }))
                    return {
                        name: `${name}_${f.id}`,
                        result: convertedData,
                        visible: f.show_chart_flag
                    }
                });
                // Return the result for this item in reduxDataCopy
                return finalResult;
            });

            contentBox.innerHTML = functionTitles

            chartDataToRender.forEach((func) => {
                const existingSeries = chartSeriesState.find((series) => series.name === func.name);
                if (!existingSeries) {
                    console.log('Not exisiting')
                    const newSeries = chart.current.addLineSeries({
                        color: lineColors[Math.floor(Math.random() * lineColors.length)],
                        lineWidth: 1,
                        visible: func.visible,
                        priceLineVisible: false
                    });
                    newSeries.setData(func.result);
                    setChartSeriesState((prevSeries) => [...prevSeries, { name: func.name, series: newSeries }]);
                } else {
                    console.log('existing')
                    existingSeries.series.applyOptions({ visible: func.visible });
                }
            });

            const existingSeriesNames = chartSeriesState.map((series) => series.name);
            const functionsInState = chartDataToRender.map((func) => func.name);

            const deletedFunctions = existingSeriesNames.filter((name) => !functionsInState.includes(name));

            deletedFunctions.forEach((deletedFunctionName) => {
                const seriesToRemove = chartSeriesState.find((series) => series.name === deletedFunctionName);
                if (seriesToRemove) {
                    chart.current.removeSeries(seriesToRemove.series);
                    // Update chartSeriesState to remove the deleted series
                    setChartSeriesState((prevSeries) => prevSeries.filter((series) => series.name !== deletedFunctionName))
                }
            });


            chart.current.subscribeCrosshairMove((param) => {
                // console.log(param)
                if (
                    param.point === undefined ||
                    !param.time ||
                    param.point.x < 0 ||
                    param.point.x > chartboxRef.current.clientWidth ||
                    param.point.y < 0 ||
                    param.point.y > chartboxRef.current.clientHeight ||
                    param.paneIndex !== 0
                ) {
                    // console.log('No crosshair data')
                } else {
                    chartSeriesState.forEach((series) => {
                        const seriesValue = param.seriesData.get(series.series)
                        // console.log(seriesValue)
                        if (seriesValue !== undefined) {
                            const divToInsertDataTo = document.getElementsByClassName(`${series.name}`)[0]
                            divToInsertDataTo.innerHTML = seriesValue.value.toFixed(2)
                        }
                    })
                }
            })

            // console.log("existing", existingSeriesNames, "in redux", functionsInState, "deleted function", deletedFunctions)
        }
    })

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
                rsiSeriesNewRef.current.update({ time: tickerPayload.openTime / 1000, value: tickerPayload.close });

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

        if (candleStickSeriesRef.current && rsiSeriesRef.current && rsiSeriesNewRef.current) {
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

    return (
        <Box sx={{ width: '100%', height: '100%' }}>
            <Box className='chart-cont-dom' width="100%" height="100%" >
                <Box ref={chartboxRef}></Box>
                <Box className='tool-tip-indicators'></Box>
            </Box>

        </Box>
    )
}

export default MainChart