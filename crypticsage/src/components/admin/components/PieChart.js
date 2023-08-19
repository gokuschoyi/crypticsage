import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const PieChartComp = (props) => {
    const { data } = props
    const color = ['#FF5733', '#5E35B1', '#0288D1', '#7B1FA2', '#388E3C', '#FBC02D', '#F44336', '#009688']
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart width={150} height={150}>
                <Pie
                    data={data}
                    dataKey='count'
                    nameKey='period'
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={color[index]} />
                    ))}
                </Pie>
                <Tooltip />
            </PieChart>
        </ResponsiveContainer>
    )
}

export default PieChartComp;


