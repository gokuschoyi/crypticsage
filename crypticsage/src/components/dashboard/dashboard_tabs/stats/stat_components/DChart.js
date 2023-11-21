import React, { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts';
import { Box, useTheme } from '@mui/material'

const DashboardChart = (props) => {
    const { chartData, selectedTokenName, tokenUrl, gridLineToggle } = props;
    const theme = useTheme();
    const chartBackgroundColor = theme.palette.background.default
    // console.log(chartBackgroundColor)

    const chartContainerRef = useRef();
    const chart = useRef();
    useEffect(() => {
        // console.log("from DC chart")

        // let chart;
        let coinChartBox = document.getElementsByClassName('coin-chart-box')[0].getBoundingClientRect()
        let offsetLeft = Math.round(coinChartBox.left);
        let offsetTop = Math.round(coinChartBox.top)

        const chartDom = document.getElementsByClassName('chart-holder-box')[0]
        let cWidth = chartDom.clientWidth;
        let cHeight = chartDom.clientHeight;

        const tooltipPadding = 10;
        const tooltip = document.getElementsByClassName('tool-tip')[0]
        let toolTipXCoOrdinates = 0, toolTipYCoOrdinates = 0;

        let scrollYAxis = window.scrollY
        let fData = chartData.map((chart) => {
            return {
                time: chart.time,
                open: chart.open,
                high: chart.high,
                low: chart.low,
                close: chart.close,
            }
        })
        // console.log(chartData)

        // handles dynamic chart resizing and setting values for cHeight and cWidth for tooltip position calculations.
        // Also gets the charts boundingClientRect to get the offsetLeft and offsetTop values for tooltip
        const handleResize = () => {
            cWidth = chartDom.clientWidth;
            cHeight = chartDom.clientHeight;
            chart.current.applyOptions({ width: cWidth, height: cHeight });

            coinChartBox = document.getElementsByClassName('coin-chart-box')[0].getBoundingClientRect()
            offsetLeft = Math.round(coinChartBox.left);
            offsetTop = Math.round(coinChartBox.top)

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

        if (fData.length > 0) {
            // console.log(cWidth, cHeight)
            chart.current = createChart(chartContainerRef.current, {
                width: cWidth,
                height: cHeight,
                layout: {
                    background: {
                        type: 'solid',
                        color: theme.palette.background.default,
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
                },
            });

            chart.current.timeScale().fitContent();

            const candleStickSeries = chart.current.addCandlestickSeries({
                upColor: 'green',
                downColor: 'red',
            });

            candleStickSeries.setData(fData);

            const sma_series = chart.current.addLineSeries({ color: 'red', lineWidth: 1, title: 'price', pane: 1 });
            const sma_data = chartData
                .filter((d) => d.open)
                .map((d) => ({ time: d.time, value: d.open }));
            sma_series.setData(sma_data);

            chart.current.subscribeCrosshairMove((param) => {
                if (
                    param.point === undefined ||
                    !param.time ||
                    param.point.x < 0 ||
                    param.point.x > chartContainerRef.current.clientWidth ||
                    param.point.y < 0 ||
                    param.point.y > chartContainerRef.current.clientHeight
                ) {
                    tooltip.style.display = 'none';
                } else {
                    // console.log(param.point)
                    // console.log({ toolTipXCoOrdinates, offsetLeft, toolTipYCoOrdinates, offsetTop, scrollYAxis })

                    const [dateStr, time] = (new Date(param.time * 1000).toLocaleString('en-AU').split(','));
                    tooltip.style.display = 'block';
                    const data = param.seriesData.get(candleStickSeries);
                    const price = data.value !== undefined ? data.value : data.close;
                    tooltip.innerHTML = `
                    <div style="color: ${'rgba(255, 82, 82, 1)'}">${selectedTokenName}</div>
                    <div style="font-size: 14px; margin: 4px 0px; color: ${'black'}">C : ${Math.round(100 * price) / 100}</div>
                    <div style="color: ${'black'}">${dateStr}</div>
                    <div style="color: ${'black'}">${time}</div>
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
            chartDom.addEventListener('mousemove', (event) => calculateMousePosition(event))
            chartDom.addEventListener('touchmove', (event) => handleTouchMove(event))
        }
        return () => {
            window.removeEventListener('resize', handleResize);
            chartDom.removeEventListener('mousemove', calculateMousePosition)
            chartDom.removeEventListener('touchmove', handleTouchMove)
            chart.current.remove();
        };
    }, [chartData])

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

    return (
        <Box className='chart-holder-box' width="100%" height="100%">
            <Box ref={chartContainerRef}></Box>
            <Box className='tool-tip'></Box>
        </Box>
    )
}

export default DashboardChart