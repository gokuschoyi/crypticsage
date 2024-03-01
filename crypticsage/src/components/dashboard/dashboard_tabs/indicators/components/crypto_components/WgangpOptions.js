import React from 'react'
import { Box, TextField } from '@mui/material'
import { SaveCurrentModal, DeleteCurrentModal } from './modals'
const WgangpOptions = ({
    paletteIdRedux,
    colorCombinations,
    handlePredictionChartPalette,
    modelName,
    setModelName,
    handleSaveModel,
    handleDeleteModel,
    deleteModelOpen,
    setDeleteModelOpen,
    savedToDb
}) => {
    return (
        <Box display='flex' flexDirection='row' gap={'4px'} alignItems='center' className='model-chart-action-container'>
            <TextField
                size='small'
                inputProps={{ style: { height: '10px', width: '200px' } }}
                id="outlined-controlled"
                label="Model name"
                value={modelName}
                onChange={(event) => {
                    setModelName(event.target.value);
                }}
            />

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

            <SaveCurrentModal handleSaveModel={handleSaveModel} />
            {!savedToDb &&
                <DeleteCurrentModal
                    handleDeleteModel={handleDeleteModel}
                    deleteModelOpen={deleteModelOpen}
                    setDeleteModelOpen={setDeleteModelOpen}
                />
            }

        </Box>
    )
}

export default WgangpOptions