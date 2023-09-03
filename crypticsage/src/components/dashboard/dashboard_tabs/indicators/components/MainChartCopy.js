import React, { useEffect, useRef } from 'react'
import { Box } from '@mui/material'
import { createChart } from 'lightweight-charts';
import { updateTickerWithOneDataPoint } from '../../../../../api/adminController'
import { useSelector, useDispatch } from 'react-redux'
import { setStreamedTickerDataRedux, resetStreamedTickerDataRedux } from '../modules/CryptoStockModuleSlice'
const MainChart = (props) => {
    const { token, tData, symbol, selectedTokenPeriod } = props;
    const chartboxRef = useRef();

    const dispatch = useDispatch()
    const streamedTickerData = useSelector(state => state.cryptoStockModule.streamedTickerData)
    const tDataRedux = useSelector(state => state.cryptoStockModule.cryptoDataInDb)
    // console.log('MainChart', tDataRedux, streamedTickerData)


    const latestDateRf = useRef(tData[tData.length - 1].time * 1000 + 60000) // latest time in the fetched data. Data doe not inclusive of this time
    const candleStickSeriesRef = useRef(null)
    const rsiSeriesRef = useRef(null)
    const rsiSeriesNewRef = useRef(null)

    const wsRef = useRef(null)
    useEffect(() => {
        console.log("UE : Main chart")

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
            console.log(cWidth, cHeight)
            chart.applyOptions({ width: cWidth, height: cHeight });

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

        let chart
        let scrollYAxis = window.scrollY

        // console.log(cWidth, cHeight)

        chart = createChart(chartboxRef.current, {
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

        chart.timeScale().fitContent();

        candleStickSeriesRef.current = chart.addCandlestickSeries({
            upColor: 'green',
            downColor: 'red',
            wickVisible: true,
        })

        candleStickSeriesRef.current.setData(tData);

        //RSI
        rsiSeriesRef.current = chart.addLineSeries({
            color: 'purple',
            lineWidth: 1,
            pane: 1,
        });
        const rsi_data = tData
            .filter((d) => d.high)
            .map((d) => ({ time: d.time, value: d.low }));
        rsiSeriesRef.current.setData(rsi_data);

        rsiSeriesNewRef.current = chart.addLineSeries({
            color: 'red',
            lineWidth: 1,
            pane: 2,
        });
        const rsi_data_new = tData
            .filter((d) => d.low)
            .map((d) => ({ time: d.time, value: d.close }));
        rsiSeriesNewRef.current.setData(rsi_data_new);

        chart.timeScale().subscribeVisibleLogicalRangeChange((param) => {
            // console.log(param)
        })

        // update tooltip
        chart.subscribeCrosshairMove((param) => {
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

                // console.log(param)
                // console.log({ toolTipXCoOrdinates, offsetLeft, toolTipYCoOrdinates, offsetTop, scrollYAxis })

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
                const open = data.value !== undefined ? data.value : data.open;

                const close = data.close;
                const high = data.high;
                const low = data.low;
                tooltip.innerHTML = `
                    <div style="color: ${'rgba(255, 82, 82, 1)'}">${symbol}</div>
                    <div style="font-size: 14px; margin: 4px 0px; color: ${'black'}">O :${Math.round(100 * open) / 100}</div>
                    <div style="font-size: 14px; margin: 4px 0px; color: ${'black'}">C :${Math.round(100 * close) / 100}</div>
                    <div style="font-size: 14px; margin: 4px 0px; color: ${'black'}">H :${Math.round(100 * high) / 100}</div>
                    <div style="font-size: 14px; margin: 4px 0px; color: ${'black'}">L :${Math.round(100 * low) / 100}</div>
                    <div style="color: ${'black'},font-size: 12px;">${dateStr}</div>
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
            chart.remove();
        }
    }, [tData, symbol, selectedTokenPeriod, token])

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
                    }))

                    updateTickerWithOneDataPoint({ token, fetchQuery })
                        .catch((err) => {
                            console.log(err)
                        })
                } else {
                    console.log('Streaming data');
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
        <Box className='chart-cont-dom' width="100%" height="100%" >
            <Box ref={chartboxRef}></Box>
            <Box className='tool-tip-indicators'></Box>
        </Box>
    )
}

export default MainChart