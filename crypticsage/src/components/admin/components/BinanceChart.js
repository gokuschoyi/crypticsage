import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, LabelList, ResponsiveContainer } from 'recharts';

const BinanceChart = (props) => {
    const { data } = props
    // console.log("B Chart", data)
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
                <XAxis dataKey="tickerName" hide={false} />
                <YAxis hide={true} />
                <Tooltip />


                <Bar dataKey="fourH" stackId="a" fill="#b93232" ><LabelList dataKey="name" position="top" /></Bar>
                <Bar dataKey="sixH" stackId="a" fill="#82ca2d" />
                <Bar dataKey="eigthH" stackId="a" fill="#812a9d" />
                <Bar dataKey="twelveH" stackId="a" fill="#826a1d" />
                <Bar dataKey="oneD" stackId="a" fill="#12ca9d" />
                <Bar dataKey="threeD" stackId="a" fill="#12da9d" />
                <Bar dataKey="oneW" stackId="a" fill="#82ee9d" />
            </BarChart>
        </ResponsiveContainer>
    )
}

export default BinanceChart;