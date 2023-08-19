import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const YfChart = (props) => {
    const { data } = props
    // console.log("YF Chart", data)
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart
                width={500}
                height={300}
                data={data}
                margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <XAxis dataKey="tickerName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="day" stackId="a" fill="#8884d8" />
                <Bar dataKey="week" stackId="a" fill="#b93232" />
                <Bar dataKey="month" stackId="a" fill="#82ca9d" />
            </BarChart>
        </ResponsiveContainer>
    )
}

export default YfChart;