import React, { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Box, Button } from '@mui/material';
const CustomBarChart = (props) => {
    const { data, currency } = props
    const { quarterly, yearly } = data

    const [chartData, setChartData] = React.useState(quarterly)
    const [selectedName, setSelectedName] = React.useState('quarterly')
    const handleChartSwitch = (e) => {
        if (e.target.innerText === 'Quarterly') {
            setChartData(quarterly)
            setSelectedName('quarterly')
        }
        else {
            setChartData(yearly)
            setSelectedName('yearly')
        }
    }

    useEffect(() => {
        const gridHeight = document.getElementsByClassName('first-grid-earnings')[0].clientHeight
        // console.log(gridHeight)
        document.getElementsByClassName('chart-box-inner')[0].style.height = gridHeight - 40 + 'px'
    }, [])

    return (
        <Box className='bar-chart-box'>
            <Box className='chart-selector' display='flex' flexDirection='row' gap='10px' alignItems='center'>
                <Box className='chart-selector-item'>
                    <Button onClick={(e) => handleChartSwitch(e)} variant="contained" color='error' sx={{ backgroundColor: selectedName === 'quarterly' ? '#83251e' : '' }} size='small' className='chart-selector-item-text'>Quarterly</Button>
                </Box>
                <Box className='chart-selector-item'>
                    <Button onClick={(e) => handleChartSwitch(e)} variant="contained" color='error' sx={{ backgroundColor: selectedName === 'yearly' ? '#83251e' : '' }} size='small' className='chart-selector-item-text'>Yearly</Button>
                </Box>
                <Box className='stock-currency'>Currency : {currency}</Box>
            </Box>
            <Box className='chart-box-inner'>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        // width={500}
                        // height={300}
                        data={chartData}

                    >
                        <XAxis dataKey="date" />
                        <YAxis hide={true} />
                        <Tooltip />


                        <Bar dataKey="earnings" stackId="a" fill="#b93232" />
                        <Bar dataKey="revenue" stackId="b" fill="#82ca2d" />

                    </BarChart>
                </ResponsiveContainer>
            </Box>
        </Box>
    )
}

export default CustomBarChart;