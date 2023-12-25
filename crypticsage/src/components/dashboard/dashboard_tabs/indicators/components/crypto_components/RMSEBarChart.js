import React from 'react';
import { useTheme } from '@mui/material';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p className="label">{`${label} : ${payload[0].value}`}</p>
            </div>
        );
    }

    return null;
};

const RMSEBarChart = ({ data, barChartOnClickHandler }) => {
    const theme = useTheme();
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                width={250}
                height={300}
                data={data}
                margin={{
                    bottom: -10,
                }}
            >
                <XAxis dataKey="name" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rmse" fill={`${theme.palette.primary.dark}`} onClick={barChartOnClickHandler} style={{cursor:'pointer'}}/>
            </BarChart>
        </ResponsiveContainer>
    )
}

export default RMSEBarChart