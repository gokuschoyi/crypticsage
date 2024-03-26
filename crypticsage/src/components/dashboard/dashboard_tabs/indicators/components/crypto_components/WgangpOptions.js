import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Box, TextField } from '@mui/material'
import { SaveCurrentModal, DeleteCurrentModal, RetrainWGANModal } from './modals'
const WgangpOptions = ({
    colorCombinations,
    paletteIdRedux,
    handlePredictionChartPalette,
    savedToDb,
    modelProcessDurationRef,
    setMetricsChartReload,
    retrainHistSavePrompt,
    setRetrainHistSavePrompt
}) => {
    const model_name = useSelector(state => state.cryptoModule.modelData.model_name)
    const loadingFromSaved = useSelector(state => state.cryptoModule.modelData.loading_from_saved_model)
    const [modelName, setModelName] = useState(model_name)
    return (
        <Box className='model-chart-action-container wgan'>
            <TextField
                size='small'
                inputProps={{ style: { height: '10px', width: '100%' } }}
                id="outlined-controlled"
                label="Model name"
                value={modelName}
                onChange={(event) => {
                    setModelName(event.target.value);
                }}
            />
            <Box className='wgan-options'>
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

                {!loadingFromSaved &&
                    <RetrainWGANModal type={'from_current'} setMetricsChartReload={setMetricsChartReload} />
                }
                <SaveCurrentModal
                    modelName={modelName}
                    retrainHistSavePrompt={retrainHistSavePrompt}
                    setRetrainHistSavePrompt={setRetrainHistSavePrompt}
                    setMetricsChartReload={setMetricsChartReload} 
                />
                {!savedToDb &&
                    <DeleteCurrentModal modelProcessDurationRef={modelProcessDurationRef} />
                }
            </Box>

        </Box>
    )
}

export default WgangpOptions