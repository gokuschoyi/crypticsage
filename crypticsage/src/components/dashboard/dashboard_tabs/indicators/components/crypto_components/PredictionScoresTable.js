import React from 'react'
import { Box, Paper } from '@mui/material'
import { NoMaxWidthTooltip, PredictionMSETable, generateMSESteps } from '../../modules/CryptoModuleUtils'
import { AspectRatioIcon } from '../../../../global/Icons'
const PredictionScoresTable = ({ sm, score, selectedTickerPeriod }) => {
    return (
        <Paper elevation={4} sx={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 4px' }}>
            <Box width='100%' className='test-set-prediction-result' display='flex' flexDirection='column' gap='5px'>
                <table width='100%' className="table-main" style={{ fontWeight: '600', fontSize: '11px' }}>
                    <thead className='table-group'>
                        <tr className='table-row'>
                            <th className='table-head'>Type</th>
                            <th className='table-head'>MSE</th>
                            <th className='table-head'>RMSE</th>
                        </tr>
                    </thead>
                    <tbody className='table-body'>
                        <tr className='table-row'>
                            <td className='table-data' style={{ textAlign: 'start' }}>
                                <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center'>
                                    Test Set
                                    {!sm &&
                                        <NoMaxWidthTooltip
                                            title={(
                                                <PredictionMSETable data={score.scores.map((item, index) => {
                                                    const { value, unit } = generateMSESteps(selectedTickerPeriod);
                                                    return (
                                                        {
                                                            date: `+${value * (index + 1)}${unit}`,
                                                            rmse: item
                                                        }
                                                    )
                                                })} />
                                            )}
                                            placement='right'
                                            arrow
                                        >
                                            <AspectRatioIcon sx={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                                        </NoMaxWidthTooltip>
                                    }
                                </Box>
                            </td>
                            <td className='table-data'>{score.over_all_score * score.over_all_score}</td>
                            <td className='table-data'>{score.over_all_score}</td>
                        </tr>
                    </tbody>
                </table>
                {sm &&
                    <PredictionMSETable data={score.scores.map((item, index) => {
                        const { value, unit } = generateMSESteps(selectedTickerPeriod);
                        return (
                            {
                                date: `+${value * (index + 1)}${unit}`,
                                rmse: item
                            }
                        )
                    })} />
                }
            </Box>
        </Paper>
    )
}

export default PredictionScoresTable