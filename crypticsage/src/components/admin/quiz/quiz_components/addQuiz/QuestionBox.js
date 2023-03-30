import React from 'react'
import { Box, Typography, TextField, IconButton, Grid } from '@mui/material'
import './AddQuiz.css'
import { DeleteOutlineOutlinedIcon, AddIcon } from '../../../../dashboard/global/Icons'
const QuestionBox = (props) => {
    const {
        count,
        removeQuestionBox,
        handleQuestionBoxData,
        questionData,
        optionBoxList,
        addNewOption,
        removeOptions,
        handleOptionsBoxData,
        optionData,
    } = props;
    const slideStyle = {
        padding: '10px',
        '& .MuiOutlinedInput-root': {
            border: '1px solid #fff',
        }
    }
    const handleChange = (e) => {
        handleQuestionBoxData(e)
    }
    return (
        <Box className='question-box'>
            <Box className='remove-question'>
                <IconButton data-id={count} onClick={(e) => removeQuestionBox(e)}>
                    <DeleteOutlineOutlinedIcon sx={{ pointerEvents: 'none' }} />
                </IconButton>
            </Box>
            <Box className='question-title-box'>
                <Typography className='enter-question-box-title' sx={{ width: '200px', paddingRight: '10px' }} variant='h5' color='white' textAlign='start' >Question : {count + 1} </Typography>
                <TextField onChange={(e) => handleChange(e)} id={`${count}`} name='question' value={questionData[count].question} label='Enter Question' size='small' fullWidth sx={slideStyle} />
            </Box>
            <Box className='question-title-box' >
                <Box display='flex' flexDirection='row' alignItems='center'>
                    <Typography sx={{ width: '150px' }} variant='h5' color='white' textAlign='start' >Options : </Typography>
                    <IconButton sx={{ marginRight: '10px' }} data-id={count} onClick={(e) => addNewOption(e)}>
                        <AddIcon sx={{ pointerEvents: 'none' }} />
                    </IconButton>
                </Box>
                <Box className='quiz-options'>
                    <Grid container spacing={1}>
                        {optionBoxList[count].map((optionBox, index) => {
                            return (
                                React.cloneElement(optionBox, {
                                    parentId: count,
                                    removeOptions: removeOptions,
                                    handleOptionsBoxData: handleOptionsBoxData,
                                    optionValue: optionData[count][index].option
                                })
                            )
                        })}
                    </Grid>
                </Box>
            </Box>
            <Box className='question-title-box'>
                <Typography className='enter-question-box-title' sx={{ width: '200px' }} variant='h5' color='white' textAlign='start' >Correct Answer : </Typography>
                <TextField onChange={(e) => handleChange(e)} id={`${count}`} name='correctAnswer' label='Correct answer' size='small' fullWidth sx={slideStyle} />
            </Box>
        </Box>
    )
}

export default QuestionBox