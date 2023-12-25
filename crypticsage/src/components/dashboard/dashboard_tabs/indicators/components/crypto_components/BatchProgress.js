import React from 'react'
import { Box } from '@mui/system'
import LinearProgressWithLabel from './LinearProgressWithLabel'
const BatchProgress = ({ batchLinearProgressRef }) => {
    return (
        <Box className='batch-end-progress-box' pt={1}>
            <Box id='progress-line' sx={{ width: '100%' }}>
                <LinearProgressWithLabel value={0} type={'Batch'} cRef={batchLinearProgressRef} />
            </Box>
            <Box className={`epoch_{} epoch`} sx={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                <Box className={`model-progress_{}`} width='100%' variant='h6'>
                    <div className='batch-end'>
                        <div style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '500', textAlign: 'start' }} id='epoch'></div>
                            <div className='batch-end-text' id='loss'>Loss : 0.04927649209355232</div>
                            <div className='batch-end-text' id='mse'>MSE : 0.04927649209355232</div>
                            <div className='batch-end-text' id='mae'>RMSE : 0.04927649209355232</div>
                        </div>
                    </div>
                </Box>
            </Box>
        </Box>
    )
}

export default BatchProgress