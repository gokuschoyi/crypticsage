import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { Box, TextField } from '@mui/material'
import { SaveCurrentModal, DeleteCurrentModal, RetrainWGANModal } from './modals'
const WgangpOptions = ({
    colorCombinations,
    paletteIdRedux,
    handlePredictionChartPalette,
    savedToDb,
    modelProcessDurationRef
}) => {
    const model_name = useSelector(state => state.cryptoModule.modelData.model_name)
    const [modelName, setModelName] = useState(model_name)
    return (
        <Box display='flex' justifyContent={'space-between'} flexDirection='row' gap={'4px'} alignItems='center' className='model-chart-action-container wgan'>
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
            <Box display='flex' flexDirection='row' alignItems={'center'}>
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
                <RetrainWGANModal />
                <SaveCurrentModal modelName={modelName} />
                {!savedToDb &&
                    <DeleteCurrentModal modelProcessDurationRef={modelProcessDurationRef} />
                }
            </Box>

        </Box>
    )
}

export default WgangpOptions