import React, { useState, useEffect, useRef } from 'react'
import Chart from 'chart.js/auto'
import 'chartjs-adapter-moment';
import zoomPlugin from 'chartjs-plugin-zoom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material';

const NewCoinChart = (props) => {
    const { chartData, tokenUrl } = props;
    const theme = useTheme();
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    const [formattedData, setFormattedData] = useState([])
    const chartRef = useRef(null);

    useEffect(() => {
        const formattedData = chartData.map(item => {
            const date = new Date(item.time * 1000);
            return {
                open: item.open,
                time: date
            };
        });
        setFormattedData(formattedData)
    }, [chartData])

    useEffect(() => {
        const ctx = chartRef.current.getContext('2d');
        const labels = formattedData.map(item => item.time);
        const open = formattedData.map(item => item.open);
        const close = chartData.map(item => item.close);

        let fsym = ""
        if (tokenUrl === '') { fsym = "Token: " }
        else {
            const url = new URL(tokenUrl);
            fsym = url.searchParams.get("fsym");
        }
        Chart.register(zoomPlugin);
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Open',
                        data: open,
                        borderColor: '#00ff1e',
                        fill: false,
                    },
                    {
                        label: 'Close',
                        data: close,
                        borderColor: '#f30505',
                        fill: false,
                    },
                ],
            },
            options: {
                responsive: true,
                aspectRatio: sm && 1,
                resizeDelay: 100,
                elements:{
                    point:{
                        radius: 4,
                        pointStyle:'triangle',
                        hoverRadius: 8,
                    },
                    line:{
                        tension: 0.2,
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index',
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            tooltipFormat: 'HH:mm',
                            displayFormats: {
                                day: 'MM/DD',
                            },
                        },
                        scaleLabel: {
                            display: true,
                            labelString: 'Time',
                        },
                    },
                    y: {
                        beginAtZero: false,
                        display: sm ? false : true,
                        scaleLabel: {
                            display: true,
                            labelString: 'Open Value',
                        },
                    },
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const dataPoint = context.dataset.data[context.dataIndex];
                                return `${fsym}: ${dataPoint}`;
                            },
                        },
                    },
                    zoom: {
                        pan: {
                            enabled: true,
                            mode: 'x',
                        },
                        zoom: {
                            wheel: {
                                enabled: true,
                            },
                            pinch: {
                                enabled: true,
                            },
                            mode: 'x',
                        },
                    },
                },
            },
        })
        return () => {
            // Cleanup the chart on unmount
            console.log('unmounting')
            chart.destroy();
        };
    }, [formattedData, sm, tokenUrl, chartData])
    return (
        <canvas ref={chartRef} className='chart-canvas' />
    )
}

export default NewCoinChart