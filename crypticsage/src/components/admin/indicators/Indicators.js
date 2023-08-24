import React, { useEffect, useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import AdminHeader from '../global/AdminHeader';
import {
    Box,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Typography,
    TextField,
    Grid
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getIndicatorDesc, getHistoricalTickerDataFroDb } from '../../../api/adminController'

const FunctionContainer = (props) => {
    const { func } = props

    return (
        <Box width='100%' p={'5px'} >
            <Accordion TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                >
                    <Box className='function-name' display='flex' flexDirection='row' justifyContent='space-between'>
                        <Typography variant='h5' sx={{ textAlign: 'start' }}>{func.name}</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionDetails>
                    <Box pl={1} sx={{ backgroundColor: '#272727' }}>

                        <Box className='indicator-inputs' pt={'10px'} sx={{ textAlign: 'start' }}>
                            <Typography variant='h5'>INPUTS</Typography>
                            {func.inputs && func.inputs.map((input, index) => {
                                return (
                                    <Box key={index} display='flex' flexDirection='column' pb={'5px'}>
                                        <Typography>Name : {input.name}</Typography>
                                        <Typography>Type : {input.type}</Typography>
                                    </Box>
                                )
                            })}
                        </Box>

                        <Box className='indicator-outputs' pt={'10px'} sx={{ textAlign: 'start' }}>
                            <Typography variant='h5'>OUTPUTS</Typography>
                            {func.outputs && func.outputs.map((output, index) => {
                                return (
                                    <Box key={index} display='flex' flexDirection='column' gap='5px'>
                                        <Typography>0 : {output['0'] || 'N/A'}</Typography>
                                        <Typography>Flags : {JSON.stringify(output.flags) || 'N/A'}</Typography>
                                        <Typography>Name : {output.name || 'N/A'}</Typography>
                                        <Typography>Type : {output.type || 'N/A'}</Typography>
                                    </Box>
                                )
                            })}
                        </Box>

                        <Box className='indicator-optional-inputs' pt={'10px'} sx={{ textAlign: 'start' }}>
                            <Typography variant='h5'>OPTIONAL INPUTS</Typography>
                            {func.optInputs.length === 0 ?
                                (
                                    <Typography>None</Typography>
                                )
                                :
                                (
                                    func.optInputs && func.optInputs.map((optionalInputs, index) => {
                                        return (
                                            <Box key={index} display='flex' flexDirection='column' gap='5px'>
                                                <Typography>Hint : {optionalInputs.hint || 'N/A'}</Typography>
                                                <Typography>Name : {optionalInputs.name || 'N/A'}</Typography>
                                                <Typography>Display Name : {optionalInputs.displayName || 'N/A'}</Typography>
                                                <Typography>Default Value : {optionalInputs.defaultValue || 'N/A'}</Typography>
                                                <Typography>Type : {optionalInputs.type || 'N/A'}</Typography>
                                            </Box>
                                        )
                                    })
                                )
                            }

                        </Box>
                    </Box>
                </AccordionDetails>
            </Accordion>
        </Box>
    )
}

const Indicators = (props) => {
    const { title, subtitle } = props;
    const token = useSelector(state => state.auth.accessToken);
    const [rawTalibDesc, setRawTalibDesc] = useState([])
    const [copyRawTalibDesc, setCopyRawTalibDesc] = useState([])
    const [talibDesc, setTalibDesc] = useState([])

    // initial fetch talib descriptions
    const loadedRef = useRef(false)
    useEffect(() => {
        if (!loadedRef.current) {
            console.log('UE : Fetching talib descriptions')
            loadedRef.current = true
            getIndicatorDesc({ token })
                .then((res) => {
                    setRawTalibDesc(res.data.desc)
                    setCopyRawTalibDesc(res.data.desc)
                })
                .catch(err => {
                    console.log(err)
                })
        }
    })

    // grouping the raw data
    useEffect(() => {
        if (copyRawTalibDesc.length > 0) {
            console.log('UE : Grouping the raw data')
            const grouped = copyRawTalibDesc.reduce((result, func) => {
                if (!result[func.group]) {
                    result[func.group] = { group_name: func.group, functions: [func] };
                } else {
                    result[func.group].functions.push(func);
                }

                return result;
            }, {});

            const groupedArray = Object.values(grouped);
            // console.log(groupedArray)
            setTalibDesc(groupedArray)
        }
    }, [copyRawTalibDesc])

    const [searchTicker, setSearchTicker] = useState('');
    const handleSearchTicker = (e) => {
        console.log(e.target.value)
        setSearchTicker(e.target.value.toLowerCase())
    }

    // filtering the raw data
    useEffect(() => {
        console.log('UE : Filtering the raw data')
        let updatedDataCopy = [...rawTalibDesc]
        const filtered = updatedDataCopy.filter((func) => {
            return func.name.toLowerCase().includes(searchTicker)
        })
        setCopyRawTalibDesc(filtered)
    }, [searchTicker, rawTalibDesc])



    // to fetch ticker data
    const [ticker_name, setTickerName] = useState('BTCUSDT')
    let defaultFetchValues = {
        asset_type: 'crypto',
        ticker_name: ticker_name,
        period: '1d',
        page_no: 1,
        items_per_page: 100
    }

    // default fetch data
    const [fetchValues, setFetchValues] = useState(defaultFetchValues)

    // to fetch ticker data
    const tickerDataRef = useRef(false)
    useEffect(() => {
        if (!tickerDataRef.current) {
            tickerDataRef.current = true
            getHistoricalTickerDataFroDb({
                token,
                payload: {
                    asset_type: fetchValues.asset_type,
                    ticker_name: fetchValues.ticker_name,
                    period: fetchValues.period,
                    page_no: fetchValues.page_no,
                    items_per_page: fetchValues.items_per_page
                }
            })
                .then((res) => {
                    // console.log(res.data.fetchedResults)
                })
                .catch(err => {
                    console.log(err)
                })
        }
    })



    return (
        <Box className='admin-indicator-container' >
            <Box height='100%' width='-webkit-fill-available'>
                <AdminHeader title={title} subtitle={subtitle} />
            </Box>
            <Box p={2}>
                <Box className='search-indicator-box' display='flex' flexDirection='row' alignItems='center' ml={2} pt={2} pb={2} gap={2}>
                    <TextField
                        color='secondary'
                        label="Search indicator"
                        variant="outlined"
                        value={searchTicker}
                        onChange={(e) => handleSearchTicker(e)}
                        id="outlined-size-small"
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: '#E0E3E2',
                                }
                            }
                        }}
                    />
                </Box>

                <Box pl={2} pr={2} className='all-talib-functions'>
                    {talibDesc && talibDesc.map((group, index) => {
                        const { group_name, functions } = group
                        return (
                            <Box width='100%' pt={1} pb={1} key={index} >
                                <Accordion TransitionProps={{ unmountOnExit: true }} sx={{ backgroundColor: '#2b2b2b' }}>
                                    <AccordionSummary
                                        expandIcon={<ExpandMoreIcon />}
                                        aria-controls="panel1a-content"
                                        id="panel1a-header"
                                    >
                                        <Typography variant='h5'>({index + 1}) : {group_name} <span style={{ color: 'red' }}>({functions.length})</span></Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Grid container spacing={2} className='indicator-data-container'>
                                            {functions && functions.map((func, index) => {
                                                return (
                                                    <Grid key={index} item xs={12} sm={8} md={4} lg={4} xl={4}>
                                                        <FunctionContainer key={index} func={func} />
                                                    </Grid>
                                                )
                                            })}
                                        </Grid>
                                    </AccordionDetails>
                                </Accordion>
                            </Box>
                        )
                    })}
                </Box>
            </Box>
        </Box >
    )
}

export default Indicators