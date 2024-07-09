import React from 'react'
import {
    Box
    , Typography
    , Accordion
    , AccordionSummary
    , AccordionDetails
    , IconButton
    , Tooltip
    , Button
} from '@mui/material'
import { convert } from '../../../utils/Utils'
import PieChartComp from './PieChart'
import {
    returnGreaterThan4hColor
    , formatDateDifferenceToNow
    , generateElapsedDate
    , getRandomHexColor
    , return1MColor
} from '../utils/Admin_util'

import DownloadIcon from '@mui/icons-material/Download';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const TickerWithHistoricalData = ({ ticker, handleUpdateBianceTicker }) => {
    const { ticker_name, meta, data } = ticker;
    const { image_url, market_cap_rank, name, asset_launch_date, id, max_supply, symbol } = meta;
    const keys = Object.keys(data);
    const periodsInData = keys.sort((a, b) => {
        // Extract numeric value from each string
        const aValue = parseInt(a);
        const bValue = parseInt(b);

        // Extract units (e.g., 'm', 'h', 'd', 'w')
        const aUnit = a[a.length - 1];
        const bUnit = b[b.length - 1];

        // Sort based on numeric value
        if (aValue !== bValue) {
            return aValue - bValue;
        }

        // If numeric values are equal, sort based on units
        const unitOrder = { 'm': 1, 'h': 2, 'd': 3, 'w': 4 }; // Define unit order
        return unitOrder[aUnit] - unitOrder[bUnit];
    });

    const precedence = ["1m", "4h", "6h", "8h", "12h", "1d", "3d", "1w"]; // Define the precedence of keys

    // Filter available keys based on precedence
    const availableKeys = periodsInData.filter(key => precedence.includes(key));

    // Calculate latest dates based on available keys
    const latestDates = periodsInData.map(key => {
        const lastHistorical = data[key].lastHistorical;
        const [elapsedDays, elapsedHours, elapsedMinutes] = formatDateDifferenceToNow(lastHistorical);
        return {
            period: key,
            strDate: generateElapsedDate(elapsedDays, elapsedHours, elapsedMinutes),
            times: {
                d: elapsedDays,
                h: elapsedHours,
                m: elapsedMinutes
            }
        }
    });

    let pieChartData = periodsInData.map(key => {
        return {
            period: key,
            count: data[key].historical,
            fill: getRandomHexColor()
        }
    })
    let filtered = pieChartData.filter((item) => item.period !== '1m')
    // console.log("PC data", filtered)

    // console.log(ticker_name)
    // console.log(latestDates)

    let oneMColor = return1MColor(latestDates[0].times.d, latestDates[0].times.h, latestDates[0].times.m)
    let color = returnGreaterThan4hColor(latestDates[1].times.d, latestDates[1].times.h, latestDates[1].times.m);

    return (
        <Box className='ticker-in-db-box' display='flex' flexDirection='column' alignItems='start' p={1} sx={{ backgroundColor: "#171818", borderRadius: '5px' }}>
            <Box className='ticker-with-data-hist-title' display='flex' flexBasis='row' justifyContent='space-between' width='100%'>
                <Box display='flex' flexDirection='row' alignItems='center' gap='5px'>
                    <img className='token-image-hist-box' loading='lazy' src={`${image_url}`} alt='crypto' />
                    <Typography className='hist-title' variant='h5' fontWeight='500'>{name}</Typography>
                </Box>
                <Box display='flex' justifyContent='flex-start' alignItems='center' gap='5px'>
                    <Typography sx={{ fontSize: 16, fontWeight: '300' }} >
                        R : {market_cap_rank}
                    </Typography>
                    {latestDates[0].times.d < 100 &&
                        <Tooltip
                            arrow
                            placement='left'
                            title={
                                (
                                    <Box
                                        display='flex' flexDirection='row' gap='5px'
                                    >
                                        <Button color='primary' variant='contained' size='small' onClick={handleUpdateBianceTicker.bind(null, { ticker_name, type: "update" })}>Yes</Button>
                                        <Button color='primary' variant='contained' size='small' onClick={() => console.log('No')}>No</Button>
                                    </Box>
                                )
                            }
                        >
                            <IconButton size='small' aria-label="update" color="secondary">
                                <DownloadIcon className='small-icon' />
                            </IconButton>
                        </Tooltip>
                    }
                </Box>
            </Box>
            <Box className='hist-meta' ml={1} pr={1} mt={1} width='100%'>
                <Box display='flex' flexDirection='column' justifyContent='flex-start' alignItems='start' gap='5px' >
                    <Box display='flex' flexDirection='row' width='100%' justifyContent='space-between'>
                        <Box display='flex' flexDirection='column' justifyContent='flex-start' alignItems='start' gap='5px'>
                            <Typography variant='admin_stats'>ID : {id}</Typography>
                            <Typography variant='admin_stats'>Symbol : {symbol}</Typography>
                            <Typography variant='admin_stats'>Ticker : {ticker_name}</Typography>
                            <Typography variant='admin_stats'>Max Supply : {max_supply < 0 ? 'N/A' : convert(max_supply)}</Typography>
                            <Typography variant='admin_stats'>Launch Date : {asset_launch_date}</Typography>
                        </Box>
                        <Box height='120px' width='120px' justifyContent='center' display='flex'>
                            <PieChartComp data={filtered} />
                        </Box>
                    </Box>

                    <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' width='100%'>
                        <Typography variant='custom' fontWeight='400'>Latest ticker ({latestDates[0].period}) : {latestDates[0].strDate} ago</Typography>
                        {latestDates[0].times.d > 100 ?
                            (
                                <Box display='flex' alignItems='center'>
                                    <Tooltip title="Majority Data Missing" placement='top'>
                                        <ErrorOutlineIcon className='small-icon' />
                                    </Tooltip>
                                </Box>
                            )
                            :
                            (
                                <Box
                                    sx={{
                                        width: "8px",
                                        height: "8px",
                                        borderRadius: "50%",
                                        backgroundColor: `${oneMColor}`,
                                    }}
                                ></Box>
                            )
                        }
                    </Box>

                    <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' width='100%'>
                        <Typography variant='custom' fontWeight='400'>Latest ticker ({latestDates[1].period}) : {latestDates[1].strDate} ago</Typography>
                        {latestDates[1].times.d > 100 ?
                            (
                                <Box display='flex' alignItems='center'>
                                    <Tooltip title="Majority Data Missing" placement='bottom'>
                                        <ErrorOutlineIcon className='small-icon' />
                                    </Tooltip>
                                </Box>
                            )
                            :
                            (
                                <Box
                                    sx={{
                                        width: "8px",
                                        height: "8px",
                                        borderRadius: "50%",
                                        backgroundColor: `${color}`,
                                    }}
                                ></Box>
                            )
                        }

                    </Box>
                </Box>


            </Box>
            <Box width='100%' pt={1}>
                <Accordion className='accordian-period' TransitionProps={{ unmountOnExit: true }} >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel1a-content"/*  */
                        id="panel1a-header"
                    >
                        <Typography>Period Data for {ticker_name} </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {periodsInData.map((period, index) => {
                            const periodData = data[period];
                            const { historical, firstHistorical, lastHistorical } = periodData;
                            return (
                                <React.Fragment key={index}>
                                    <Box className='period-info' pl={1} pr={1} mt='5px' mb='5px' display='flex' flexDirection='column' sx={{ backgroundColor: '#262727', borderRadius: '5px' }}>
                                        <Box display='flex' flexDirection='row' justifyContent='space-between' >
                                            <Typography variant='h5' fontWeight='400'>Period : {period}</Typography>
                                        </Box>
                                        <Box display='flex' flexDirection='column' alignItems='flex-start'>
                                            <Typography variant='admin_stats'>Ticker Count : {historical}</Typography>
                                            <Typography variant='admin_stats'>Latest : {new Date(lastHistorical).toLocaleString()}</Typography>
                                            <Typography variant='admin_stats'>Oldest : {new Date(firstHistorical).toLocaleString()}</Typography>
                                        </Box>
                                    </Box>
                                </React.Fragment>
                            )
                        })}
                    </AccordionDetails>
                </Accordion>
            </Box>
        </Box>
    )
}

export default TickerWithHistoricalData