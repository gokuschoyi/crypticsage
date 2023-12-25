import React from 'react'
import { Box } from '@mui/system'
import LinearProgressWithLabel from './LinearProgressWithLabel'
const EvaluationProgress = ({ evalLinearProgressRef }) => {
    return (
        <Box className='evaluating-set-progress-box' pt={1}>
            <Box id='progress-line' sx={{ width: '100%' }}>
                <LinearProgressWithLabel value={0} type={'Evaluating'} cRef={evalLinearProgressRef} />
            </Box>
        </Box>
    )
}

export default EvaluationProgress