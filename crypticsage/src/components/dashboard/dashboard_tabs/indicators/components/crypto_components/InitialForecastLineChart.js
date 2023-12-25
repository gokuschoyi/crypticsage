import React from 'react'
import { useTheme } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip-line">
                <p className="label">{`${label}`}</p>
                {!isNaN(payload[1].value) && <p className="label">A: {`${payload[1].value}`}</p>}
                <p className="label">P: {`${payload[0].value}`}</p>
                {!isNaN(payload[1].value) && <p className="label">D: {`${(payload[1].value - payload[0].value).toFixed(2)}`}</p>}
            </div>
        );
    }

    return null;
};

const InitialForecastLineChart = ({ data }) => {
    // console.log(data)
    const theme = useTheme();
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                width={250}
                height={300}
                data={data}

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