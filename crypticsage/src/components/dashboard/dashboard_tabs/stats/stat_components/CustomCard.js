import React from 'react'
import { Box, Paper, Typography, Button } from '@mui/material'
import { shortenDate } from '../../../../../utils/Utils.js';

const CustomCard = (props) => {
    const { cardType, title, next, mostRecent, buttonName, buttonHandler } = props
    return (
        cardType === 'lesson' ? (
            <Paper elevation={4} className='card-holder hover'>
                <Box className='info-box' display={'flex'} gap={1} flexDirection={'column'}>
                    <Typography variant='h4' textAlign='start'>
                        {title}
                    </Typography>
                    {mostRecent !== 'initial_lesson' &&
                        <Box className='stats-last-lesson'>
                            <Typography variant='h6' fontWeight='600'>Last Lesson :</Typography>
                            <Box className='stats-last-lesson-status'>
                                <Typography variant='h6' fontWeight='400' textAlign='start'>
                                    {`${mostRecent.lesson_name},`}
                                </Typography>
                                <Typography variant='h6' fontWeight='400' textAlign='start'>
                                    {shortenDate(mostRecent.lesson_completed_date)}
                                </Typography>
                            </Box>
                        </Box>
                    }
                    <Box className='stats-next-lesson'>
                        <Typography variant='h6' fontWeight='600'>Next Lesson :</Typography>
                        <Typography variant='h6' textAlign='start'>
                            {next.lesson_name}
                        </Typography>
                    </Box>
                </Box>
                <Box className='action-box'>
                    <Button onClick={buttonHandler} variant='outlined' size="small">{buttonName}</Button>
                </Box>
            </Paper>
        ) : (
            <Paper elevation={4} className='card-holder hover'>
                <Box className='info-box' display={'flex'} gap={1} flexDirection={'column'}>
                    <Typography variant='h4' textAlign='start'>
                        {title}
                    </Typography>
                    {mostRecent !== 'initial_quiz' &&
                        <Box className='stats-last-quiz'>
                            <Typography variant='h6' fontWeight='600'>Last Quiz :</Typography>
                            <Box className='stats-last-quiz-status'>
                                <Typography variant='h6' fontWeight='400' textAlign='start'>
                                    {`${mostRecent.quiz_name},`}
                                </Typography>
                                <Typography variant='h6' fontWeight='400' textAlign='start'>
                                    {shortenDate(mostRecent.quiz_completed_date)}
                                </Typography>
                            </Box>
                        </Box>
                    }
                    <Box className='stats-next-quiz'>
                        <Typography variant='h6' fontWeight='600'>Next Quiz :</Typography>
                        <Typography variant='h6' textAlign='start'>
                            {next.quiz_name}
                        </Typography>
                    </Box>

                </Box>
                <Box className='action-box'>
                    <Button onClick={buttonHandler} variant='outlined' size="small">{buttonName}</Button>
                </Box>
            </Paper>
        )
    )
};

export default CustomCard

/* const CustomCard = (props) => {
    const { title, date, value, buttonName, buttonHandler, next } = props
    let formattedDate = shortenDate(date)
    console.log(next)
    return (
        <Box className='card-holder hover'>
            <Box className='info-box'>
                <Typography variant='h4' textAlign='start' gutterBottom>
                    {title}
                </Typography>
                <Typography variant='h6' textAlign='start' gutterBottom>
                    {next.lesson_name} :
                </Typography>
                <Typography variant='h6' fontWeight='400' textAlign='start' gutterBottom>
                    {value}
                </Typography>
                <Typography sx={{ fontSize: 16, fontWeight: '300', textAlign: 'left' }} gutterBottom>
                    {formattedDate}
                </Typography>
            </Box>
            <Box className='action-box'>
                <Button onClick={buttonHandler} variant='outlined' size="small">{buttonName}</Button>
            </Box>
        </Box>
    )
}; */