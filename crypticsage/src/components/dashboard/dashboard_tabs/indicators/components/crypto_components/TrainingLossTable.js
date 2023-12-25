import React from 'react'
import { ModelHistoryTable } from '../../modules/CryptoModuleUtils'
import { Accordion, AccordionDetails, AccordionSummary, Typography, useTheme } from '@mui/material'
import { ExpandMoreIcon } from '../../../../global/Icons'
const TrainingLossTable = ({ epochResults }) => {
    const theme = useTheme()
    return (
        <Accordion defaultExpanded={false} sx={{ overflowX: 'auto', backgroundColor: `${theme.palette.background.paperOne}`, borderRadius: '5px' }}>
            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1bh-content"
                id="panel1bh-header"
            >
                <Typography sx={{ color: 'text.secondary', width: '33%', flexShrink: 0, textAlign: 'start' }}>
                    Training Loss
                </Typography>
            </AccordionSummary>
            <AccordionDetails>
                <ModelHistoryTable data={epochResults} />
            </AccordionDetails>
        </Accordion>
    )
}

export default TrainingLossTable