import React from 'react'
import { Box } from '@mui/system'
import LinearProgressWithLabel from './LinearProgressWithLabel'
const WGANGPProgress = ({wgangpProgressRef}) => {
    return (
        <Box className='batch-end-progress-box' pt={1}>
            <Box id='progress-line' sx={{ width: '100%' }}>
                <LinearProgressWithLabel value={0} type={'Batch'} cRef={wgangpProgressRef} />
            </Box>
            <Box className={`epoch_{} epoch`} sx={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                <Box className={`model-progress_{}`} width='100%' variant='h6'>
                    <div className='batch-end'>
                        <div style={{ display: 'flex', flexDirection: 'row' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '500', textAlign: 'start', width:"60px" }} id='epoch'>E : 1</div>
                            <div className='batch-end-text' id='model_type'>DISC</div>
                            <div className='batch-end-text' id='n_critic'>Critic Iter : 1</div>
                            <div className='batch-end-text' id='loss'>Loss : 0.04927649209355232</div>
                        </div>
                    </div>
                </Box>
            </Box>
        </Box>
    )
}

export default WGANGPProgress