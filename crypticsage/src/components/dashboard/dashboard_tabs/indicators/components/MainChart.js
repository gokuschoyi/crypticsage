import React, { useEffect, useRef } from 'react'
import { Box } from '@mui/material'
import { createChart } from 'lightweight-charts';
const MainChart = (props) => {
    const { tData, symbol } = props;

    const chartboxRef = useRef();
    const chartLoadedRef = useRef(false);

    useEffect(() => {
        console.log("from Main chart")
        let chart;
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

        let scrollYAxis = window.scrollY
        if (tData.length > 0) {
            console.log("data available")
            console.log(cWidth, cHeight)

            // console.log(tData)
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

            const candleStickSeries = chart.addCandlestickSeries({
                upColor: 'green',
                downColor: 'red',
            })

            candleStickSeries.setData(tData);

            //SMA
            const sma_series = chart.addLineSeries({ color: 'red', lineWidth: 1, title: 'price' });
            const sma_data = tData
                .filter((d) => d.open)
                .map((d) => ({ time: d.time, value: d.open }));
            sma_series.setData(sma_data);
            //EMA
            const ema_series = chart.addLineSeries({ color: 'green', lineWidth: 1 });
            const ema_data = tData
                .filter((d) => d.high)
                .map((d) => ({ time: d.time, value: d.high }));
            ema_series.setData(ema_data);
            //RSI
            const rsi_series = chart.addLineSeries({
                color: 'purple',
                lineWidth: 1,
                pane: 1,
            });
            const rsi_data = tData
                .filter((d) => d.low)
                .map((d) => ({ time: d.time, value: d.low }));
            rsi_series.setData(rsi_data);

            const rsi_series_new = chart.addLineSeries({
                color: 'red',
                lineWidth: 1,
                pane: 2,
            });
            const rsi_data_new = tData
                .filter((d) => d.close)
                .map((d) => ({ time: d.time, value: d.close }));
            rsi_series_new.setData(rsi_data_new);

            chart.timeScale().subscribeVisibleLogicalRangeChange((param) => {
                console.log(param)
            })

            // update tooltip
            chart.subscribeCrosshairMove((param) => {
                if (
                    param.point === undefined ||
                    !param.time ||
                    param.point.x < 0 ||
                    param.point.x > chartboxRef.current.clientWidth ||
                    param.point.y < 0 ||
                    param.point.y > chartboxRef.current.clientHeight
                ) {
                    tooltip.style.display = 'none';
                } else {

                    // console.log(param.point)
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
                    const data = param.seriesData.get(candleStickSeries);
                    const open = data.value !== undefined ? data.value : data.open;

                    const close = data.close;
                    tooltip.innerHTML = `
                    <div style="color: ${'rgba(255, 82, 82, 1)'}">${symbol}</div>
                    <div style="font-size: 14px; margin: 4px 0px; color: ${'black'}">O :${Math.round(100 * open) / 100}</div>
                    <div style="font-size: 14px; margin: 4px 0px; color: ${'black'}">C :${Math.round(100 * close) / 100}</div>
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
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            tokenDom.removeEventListener('mousemove', calculateMousePosition)
            tokenDom.removeEventListener('touchmove', handleTouchMove)
            chart.remove();
        }
    }, [tData, symbol])

    return (
        <Box className='chart-cont-dom' width="100%" height="100%" >
            <Box ref={chartboxRef}></Box>
            <Box className='tool-tip-indicators'></Box>
        </Box>
    )
}

export default MainChart