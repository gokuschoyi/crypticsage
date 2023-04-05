import React, { useEffect } from 'react'
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CoinChart = (props) => {
    const { chartData } = props;
    const theme = useTheme();
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    const [formattedData, setFormattedData] = React.useState([])

    useEffect(() => {
        const formattedData = chartData.map(item => {
            const date = new Date(item.time * 1000);
            const options = { day: "2-digit", month: "2-digit" };
            const formattedDate = date.toLocaleDateString("en-US", options);
            return {
                ...item,
                time: formattedDate
            };
        });
        setFormattedData(formattedData)
    }, [chartData])


    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                width={500}
                height={300}
                data={formattedData}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <XAxis dataKey="time" />
                
                <YAxis type='number' domain={['auto', 'auto']} hide={sm}/>
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="open" stroke="#f30505" dot={false} />
            </LineChart>
        </ResponsiveContainer>
    )
}

export default CoinChart