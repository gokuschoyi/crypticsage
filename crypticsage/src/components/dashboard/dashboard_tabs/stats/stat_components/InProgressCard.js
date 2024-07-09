import React from 'react'
import { Paper, Box, Typography, IconButton, Tooltip } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom';
import PreviewIcon from '@mui/icons-material/Preview';
import { setSelectedModelId } from '../../indicators/modules/IntermediateModelSlice'
import { setSelectedTickerName } from '../../indicators/modules/CryptoModuleSlice'

const InProgressCard = () => {
    const inProgress = useSelector(state => state.intermediateModel.models_in_progress)
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const handleLoadTrainingReults = ({ asset_type, symbol, period, model_id }) => {
        console.log('Load training results')
        const redirectURL = `/dashboard/indicators/${asset_type}/${symbol}/${period}`
        console.log(redirectURL)
        dispatch(setSelectedTickerName(symbol))
        dispatch(setSelectedModelId(model_id))
        navigate(redirectURL)
    }

    const handleViewTrainingReults = ({ asset_type, symbol, period, model_id }) => {
        console.log('View training results')
        const redirectURL = `/dashboard/indicators/${asset_type}/${symbol}/${period}`
        console.log(redirectURL)
        dispatch(setSelectedTickerName(symbol))
        navigate(redirectURL)
    }
    return (
        <Paper elevation={4} className='card-holder hover'>
            <Box className='info-box' display={'flex'} gap={1} flexDirection={'column'}>
                <Typography variant='h4' textAlign='start'>
                    In Progress
                </Typography>
                <Box className='in-progress-models-box' display={'flex'} flexDirection={'column'} gap={'4px'}>
                    {inProgress.length > 0 ?
                        (
                            inProgress.map((model, index) => {
                                const {
                                    model_type
                                    , model_id
                                    , asset_type
                                    , ticker_name
                                    , period
                                    , model_train_start_time
                                    , training_completed
                                    , model_train_end_time
                                } = model
                                return (
                                    <Box key={index} display={'flex'} flexDirection={'row'} gap={'4px'}>
                                        <Box sx={{ width: '8.82px', height: '8px', borderRadius: '8px', backgroundColor: `red`, marginTop: '10px' }}></Box>
                                        <Box className='stats-progress'>
                                            <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                                                <Typography variant='custom' fontWeight='600'>Type :</Typography>
                                                <Typography variant='custom' textAlign='start'>
                                                    {model_type}
                                                </Typography>
                                            </Box>
                                            <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                                                <Typography variant='custom' fontWeight='600'>Ticker :</Typography>
                                                <Typography variant='custom' textAlign='start'>
                                                    {ticker_name}
                                                </Typography>
                                            </Box>
                                            <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                                                <Typography variant='custom' fontWeight='600'>Period :</Typography>
                                                <Typography variant='custom' textAlign='start'>
                                                    {period}
                                                </Typography>
                                            </Box>
                                            <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                                                <Typography variant='custom' fontWeight='600'>Start time :</Typography>
                                                <Typography variant='custom' textAlign='start'>
                                                    {new Date(model_train_start_time).toLocaleString()}
                                                </Typography>
                                            </Box>
                                            {model_train_end_time &&
                                                <Box display={'flex'} flexDirection={'row'} gap={'4px'}>
                                                    <Typography variant='custom' fontWeight='600'>End time :</Typography>
                                                    <Typography variant='custom' textAlign='start'>
                                                        {new Date(model_train_end_time).toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            }
                                            <Box display={'flex'} flexDirection={'row'} alignItems={'center'} gap={'4px'}>
                                                <Typography variant='custom' fontWeight='600'>Training Completed :</Typography>
                                                <Typography variant='custom' textAlign='start'>
                                                    {training_completed ? 'Yes' : 'No'}
                                                </Typography>
                                                {training_completed ?
                                                    <Box>
                                                        <IconButton size='small' aria-label="update" color="secondary"
                                                            onClick={
                                                                handleLoadTrainingReults.bind(null,
                                                                    { asset_type, symbol: ticker_name, period, model_id }
                                                                )}>
                                                            <Tooltip title="View Results" placement='top'>
                                                                <PreviewIcon className='smaller-icon' />
                                                            </Tooltip>
                                                        </IconButton>
                                                    </Box>
                                                    :
                                                    <Box>
                                                        <IconButton size='small' aria-label="update" color="secondary"
                                                            onClick={
                                                                handleViewTrainingReults.bind(null,
                                                                    { asset_type, symbol: ticker_name, period, model_id }
                                                                )}>
                                                            <Tooltip title="View Training progress" placement='top'>
                                                                <PreviewIcon className='smaller-icon' />
                                                            </Tooltip>
                                                        </IconButton>
                                                    </Box>
                                                }
                                            </Box>

                                        </Box>
                                    </Box>
                                )
                            })
                        )
                        :
                        (
                            <Box display={'flex'} justifyContent={'flex-start'}>
                                <Typography variant='h6' textAlign='start'>
                                    No models in progress
                                </Typography>
                            </Box>
                        )
                    }
                </Box>
            </Box>
        </Paper>
    )
}

export default InProgressCard