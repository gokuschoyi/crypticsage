import React from 'react'
import { Button } from '@mui/material';


const CustomButton = (props) => {
    const { buttonName } = props
    return (
        <Button variant="text" style={{ color: `#000000`, backgroundColor: 'red', margin: '5px' }} sx={{
            ':hover': {
                color: `black !important`,
                backgroundColor: 'white !important',
            },
        }}>{buttonName}</Button>
    )
}

export default CustomButton