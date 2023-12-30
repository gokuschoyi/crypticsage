import React, { useCallback, useState } from 'react';
import { useTheme } from '@mui/material';
import { BarChart, Bar, Cell, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

const RMSEBarChart = ({ data, selectedRMSEIndex, setSelectedRMSEIndex }) => {
    const theme = useTheme();
    const localBarChartHandler = useCallback((entry, index) => {
        setSelectedRMSEIndex(index)
    }, [setSelectedRMSEIndex])
    return (
        <ResponsiveContainer width='100%' height={220}>
            <BarChart
                data={data}
                margin={{
                    bottom: -2,
                    top: 8,
                }}
            >
                <XAxis dataKey="name" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="rmse" onClick={localBarChartHandler} style={{ cursor: 'pointer' }}>
                    {
                        data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === selectedRMSEIndex ? `${theme.palette.primary.dark}` : `${theme.palette.secondary.main}`} />
                        ))
                    }
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}

export default RMSEBarChart