import React from 'react'
import { Box, IconButton, TextField, Tooltip } from '@mui/material'
import { CloseFullscreenIcon, OpenInFullIcon } from '../../../../global/Icons'
import { SaveCurrentModal, DeleteCurrentModal } from './modals'
const PredictionOptions = ({
    modelName,
    model_data,
    modelParams,
    predictedVlauesRedux,
    predictionChartType,
    colorCombinations,
    paletteIdRedux,
    setModelName,
    handleSaveModel,
    handleDeleteModel,
    deleteModelOpen,
    setDeleteModelOpen,
    handlePredictionsChartType,
    handlePredictionChartPalette
}) => {
    return (
        <Box display='flex' flexDirection='column'>
            <Box display='flex' flexDirection='column' justifyContent='space-between' alignItems='flex-start' className='prediction-chart-header'>
                {predictedVlauesRedux.length !== 0 &&
                    <Box className='chart-action-box' pt={1}>
                        <Box display='flex' flexDirection='row' gap={'4px'} alignItems='center' className='model-chart-action-container'>
                            <TextField
                                size='small'
                                inputProps={{ style: { height: '10px', width: '150px' } }}
                                id="outlined-controlled"
                                label="Model name"
                                value={modelName}
                                onChange={(event) => {
                                    setModelName(event.target.value);
                                }}
                            />
                            <Box className='model-chart-action-box'>
                                <SaveCurrentModal handleSaveModel={handleSaveModel} />

                                {!model_data.model_saved_to_db &&
                                    <DeleteCurrentModal
                                        handleDeleteModel={handleDeleteModel}
                                        deleteModelOpen={deleteModelOpen}
                                        setDeleteModelOpen={setDeleteModelOpen}
                                    />
                                }

                                {modelParams.modelType !== 'Single Step Multiple Output' &&
                                    <React.Fragment>
                                        <Tooltip title={'Standardized values'} placement='top' style={{ cursor: 'pointer', padding: '6px' }}>
                                            <span style={{ padding: '0px' }}>
                                                <IconButton sx={{ padding: '6px' }} disabled={predictionChartType === "standardized" ? true : false} onClick={handlePredictionsChartType.bind(null, { type: 'standardized' })}>
                                                    <CloseFullscreenIcon className='small-icon' />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                        <Tooltip title={'Original values'} placement='top' style={{ cursor: 'pointer', padding: '6px' }}>
                                            <span style={{ padding: '0px' }}>
                                                <IconButton sx={{ padding: '6px' }} disabled={predictionChartType === "scaled" ? true : false} onClick={handlePredictionsChartType.bind(null, { type: 'scaled' })}>
                                                    <OpenInFullIcon className='small-icon' />
                                                </IconButton>
                                            </span>
                                        </Tooltip>
                                    </React.Fragment>
                                }
                            </Box>
                        </Box>

                        <Box display='flex' flexDirection='row' gap='17px' paddingRight='6px' paddingLeft='6px'>
                            {colorCombinations.map((palette, index) => (
                                <Box key={index} sx={{
                                    width: "10px",
                                    height: "10px",
                                    borderRadius: "50%",
                                    backgroundColor: `${palette.actual}`,
                                    cursor: 'pointer',
                                    border: `${paletteIdRedux === index ? '1px solid #fff' : 'none'}`,
                                }}
                                    onClick={handlePredictionChartPalette.bind(null, { id: index })}
                                />
                            ))}
                        </Box>
                    </Box>
                }
            </Box>
        </Box>
    )
}

export default PredictionOptions