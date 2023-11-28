import React from 'react'
import { Box, LinearProgress, Typography } from '@mui/material'
const LinearProgressWithLabel = (props) => {
    const { batch, totalNoOfBatch } = props.value
    const percentageCompleted = Math.round((batch / totalNoOfBatch) * 100) || 0

    function interpolateColor(color1, color2, factor) {
        let result = "#";
        for (let i = 1; i <= 5; i += 2) {
            let hex1 = parseInt(color1.substr(i, 2), 16);
            let hex2 = parseInt(color2.substr(i, 2), 16);
            let blended = Math.round(hex1 + (hex2 - hex1) * factor).toString(16);
            while (blended.length < 2) blended = '0' + blended; // pad with zero
            result += blended;
        }
        return result;
    }

    function getColorForValue(value, min, max, startColor, endColor) {
        let factor = (value - min) / (max - min);
        factor = Math.max(0, Math.min(1, factor)); // Clamp factor between 0 and 1
        return interpolateColor(startColor, endColor, factor);
    }

    // Usage example
    const color = getColorForValue(percentageCompleted, 0, 100, '#FF0000', '#00FF00');

    // console.log(batch, totalNoOfBatch, percentageCompleted) F
    return (
        <Box ref={props.cRef} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} id='custom-linear-progress'>
            <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress id='linear-progress' color='secondary' sx={{ backgroundColor: `${color}` }} variant="determinate" value={percentageCompleted} />
            </Box>
            <Box sx={{ minWidth: 140, textAlign: 'end' }}>
                <Typography variant="custom" sx={{ fontWeight: '600', fontSize: '0.7rem' }} color="text.secondary" id='batch-count'>{props.type} : {batch}/{totalNoOfBatch}</Typography>
            </Box>
        </Box>
    );
}

export default LinearProgressWithLabel