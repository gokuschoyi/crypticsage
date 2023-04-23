import React, { useRef } from 'react'
import './UpdateSection.css'
import useMediaQuery from '@mui/material/useMediaQuery';
import {
    Box,
    Typography,
    TextField,
    Button,
    Divider,
    useTheme,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material'
import { ArrowDropDownIcon } from '../../../../dashboard/global/Icons'
const UpdateSection = (props) => {
    const { selectedSectionData, handleUpdateSectionData, handleUpdateSectionSubmit } = props
    const theme = useTheme()
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    let multiLineHeight = sm ? '480px' : '240px'
    const inputStyleSection = {
        width: 'fill-available',
        padding: '10px',
        '& label.Mui-focused': {
            color: 'white !important',
        },
        '& label': {
            color: 'red',
        },
        '& .MuiOutlinedInput-root': {
            '& fieldset': {
                borderColor: 'white',
            },
        },
        '& .MuiInputBase-inputMultiline': {
            minHeight: multiLineHeight
        }
    }

    const openRef = useRef(true)

    const handleCollapseSection = (e) => {
        console.log(e)
        openRef.current = !openRef.current
    }

    return (
        <Box className='update-section-box'>
            <Divider sx={{ marginTop: '20px', marginBottom: '20px' }} />
            <Accordion className='update-section-accordion'
                expanded={openRef.current}
                onChange={(e) => handleCollapseSection(e)}
            >
                <AccordionSummary
                    expandIcon={<ArrowDropDownIcon />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                >
                    <Typography variant='h4' color='white' textAlign='start' className='add-content-subtitle'>Edit Section for {selectedSectionData.title}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box className='add-section-data'>
                        <TextField
                            name='title'
                            value={selectedSectionData.title}
                            onChange={(e) => handleUpdateSectionData(e)}
                            sx={inputStyleSection}
                            id="section-title"
                            label="Section Title"
                            variant="outlined"
                            className='add-section-data-title'
                        />
                        <TextField
                            name='content'
                            value={selectedSectionData.content}
                            onChange={(e) => handleUpdateSectionData(e)}
                            className='add-section-data-content'
                            size="small"
                            multiline={true}
                            fullWidth
                            // minRows='12'
                            sx={inputStyleSection}
                            id="section-content"
                            label="Section Content"
                            variant="outlined"
                            type='text'
                        />
                        <TextField
                            name='url'
                            value={selectedSectionData.url}
                            onChange={(e) => handleUpdateSectionData(e)}
                            sx={inputStyleSection}
                            id="section-url"
                            label="Section Image URL"
                            variant="outlined"
                            className='add-section-data-image'
                        />
                        <Button
                            size='small'
                            sx={{
                                width: '150px',
                                ':hover': {
                                    color: 'black !important',
                                    backgroundColor: '#d11d1d !important',
                                    transition: '0.5s'
                                },
                                backgroundColor: `${theme.palette.secondary.main}`
                            }}
                            onClick={handleUpdateSectionSubmit}>Save Section</Button>
                    </Box>
                </AccordionDetails>
            </Accordion>
        </Box>
    )
}

export default UpdateSection