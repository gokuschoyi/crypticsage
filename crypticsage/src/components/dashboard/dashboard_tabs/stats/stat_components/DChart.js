import React, { useEffect, useRef } from 'react'
import { createChart } from 'lightweight-charts';
import { Box } from '@mui/material'

const DashboardChart = (props) => {
    const { chartData, selectedTokenName, tokenUrl, gridLineToggle } = props;

    const chartContainerRef = useRef();

    useEffect(() => {
        // console.log(chartData.length)
        let fData = chartData.map((chart) => {
            return {
                time: chart.time,
                open: chart.open,
                high: chart.high,
                low: chart.low,
                close: chart.close,
            }
        })

        const handleResize = () => {
            const chartBoxWidth = document.getElementsByClassName('chart-holder-box')[0].clientWidth;
            const chartBoxHeight = document.getElementsByClassName('chart-holder-box')[0].clientHeight;
            // console.log(chartBoxWidth, chartBoxHeight)
            chart.applyOptions({ width: chartBoxWidth, height: chartBoxHeight });
        };

        let chart;
        if (fData.length > 0) {
            const cWidth = document.getElementsByClassName('chart-holder-box')[0].clientWidth;
            const cHeight = document.getElementsByClassName('chart-holder-box')[0].clientHeight;
            // console.log(cWidth, cHeight)
            chart = createChart(chartContainerRef.current, {
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
                },
            });

            chart.timeScale().fitContent();

            const candleStickSeries = chart.addCandlestickSeries({
                upColor: 'green',
                downColor: 'red',
            });

            candleStickSeries.setData(fData);

            const tooltip = document.getElementsByClassName('tool-tip')[0]
            chart.subscribeCrosshairMove((param) => {
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
                    const dateStr = new Date(param.time * 1000).toLocaleDateString('en-AU');
                    tooltip.style.display = 'block';
                    const data = param.seriesData.get(candleStickSeries);
                    const price = data.value !== undefined ? data.value : data.close;
                    tooltip.innerHTML = `
                    <div style="color: ${'rgba(255, 82, 82, 1)'}">${selectedTokenName}</div>
                    <div style="font-size: 18px; margin: 4px 0px; color: ${'black'}">${Math.round(100 * price) / 100}</div>
                    <div style="color: ${'black'}">${dateStr}</div>
                    `;
                    tooltip.style.display = 'block';
                    let x = param.sourceEvent?.pageX + 10;
                    let y = param.sourceEvent?.pageY + 10;
                    if (param.point.x > cWidth - tooltip.clientWidth - 120) {
                        x = param.sourceEvent?.pageX - tooltip.clientWidth - 10;
                    }
                    if (param.point.y > cHeight - tooltip.clientHeight - 50) {
                        y = param.sourceEvent?.pageY - tooltip.clientHeight - 10;
                    }
                    tooltip.style.left = `${x}px`;
                    tooltip.style.top = `${y}px`;
                    // console.log("display block", canvasCo, mouseCo)
                }
            })

            window.addEventListener('resize', handleResize);
        }
        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [chartData, selectedTokenName])

    return (
        <Box className='chart-holder-box' width="100%" height="100%">
            <Box ref={chartContainerRef}></Box>
            <Box className='tool-tip'></Box>
        </Box>
    )
}

export default DashboardChart