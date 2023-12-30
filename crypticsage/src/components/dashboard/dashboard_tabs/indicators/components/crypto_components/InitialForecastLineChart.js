import React from 'react'
import { useTheme } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip-line">
                <p className="label">{`${label}`}</p>
                {payload[1] && !isNaN(payload[1].value) && payload[1].value !== undefined && <p className="label">A: {`${payload[1].value}`}</p>}
                {payload[0] && !isNaN(payload[0].value) && payload[0].value !== undefined && <p className="label">P: {`${payload[0].value}`}</p>}
                {payload[1] && payload[0] && !isNaN(payload[1].value - payload[0].value) && (payload[1].value - payload[0].value) !== undefined && <p className="label">D: {`${(payload[1].value - payload[0].value).toFixed(2)}`}</p>}
            </div>
        );
    }

    return null;
};

const InitialForecastLineChart = ({ data }) => {
    // console.log(data)
    const theme = useTheme();
    return (
        <ResponsiveContainer width='100%' height={210}>
            <LineChart
                data={data}
                margin={{
                    bottom: -2,
                    top: 8,
                    left: 8,
                    right: 8,
                }}
            >
                <XAxis dataKey="openTime" hide='true' />
                <YAxis type="number" hide='true' domain={['dataMin', 'dataMax']} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="predicted" stroke={`${theme.palette.primary.main}`} activeDot={{ r: 2 }} />
                <Line type="monotone" dataKey="actual" stroke={`${theme.palette.info.main}`} activeDot={{ r: 2 }} />
            </LineChart>
        </ResponsiveContainer>
    )
}

export default InitialForecastLineChart