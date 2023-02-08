import React from 'react'
import './SlideCard.css'
import Header from '../../../../global/Header'
import { useSelector } from 'react-redux';
import SlideComponent from './Slide'

import { Box, useTheme, Button, CircularProgress } from '@mui/material'
const SlideCard = (props) => {
    const { slides, slideName, goBackToLessons } = props
    const { lessons } = useSelector(state => state.section)
    return (
        <React.Fragment>
            <Box className='introduction-top'>
                <Header title={slideName} />
                <Box>
                    <Button
                        onClick={goBackToLessons}
                        variant="text"
                        style={{ color: `#000000`, backgroundColor: 'red', margin: '5px', marginRight: '20px', height: '30px' }}
                        sx={{
                            ':hover': {
                                color: `black !important`,
                                backgroundColor: 'white !important',
                            },
                        }}>Go Back</Button>
                </Box>
            </Box>
            <Box className='slides' pl={4} pr={4}>
                {slides === '' ?
                    (
                        <CircularProgress />
                    )
                    :
                    (
                        <SlideComponent lessons={lessons} />
                    )
                }
            </Box>
        </React.Fragment>
    )
}

export default SlideCard