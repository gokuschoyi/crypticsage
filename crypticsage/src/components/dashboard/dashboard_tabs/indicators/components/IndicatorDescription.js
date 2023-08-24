import React, { useEffect, useState, useRef } from 'react'
import { getIndicatorDesc, getHistoricalTickerDataFroDb } from '../../../../../api/adminController'
import MainChart from './MainChart'
import { useSelector } from 'react-redux'
import {
    Box,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    AccordionActions,
    Typography,
    TextField,
    Grid,
    IconButton,
    Tooltip,
    Skeleton
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CreateIcon from '@mui/icons-material/Create';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';


const FunctionContainer = (props) => {
    const { index, func } = props
    const optionalInputCopy = func.optInputs

    const [defaultOptionalInputs, setDefaultOptionalInputs] = useState(optionalInputCopy)

    // console.log("Default options : ", func.name, defaultOptionalInputs)

    const handleGenerateQuery = (func_name) => {
        // console.log(func_name)
        const transformedInputObject = func.inputs.reduce((result, item) => {
            result[item.name] = item.type;
            return result;
        }, {});

        const transformedOptionalInputs = defaultOptionalInputs.reduce((result, item) => {
            result[item.name] = item.defaultValue
            return result;
        }, {})


        let query = {
            name: func.name,
            ...transformedInputObject,
            ...transformedOptionalInputs
        }

        console.log(query)
    }

    const handleOptionalInputChange = (e) => {
        const { name, value } = e.target
        const updatedOptionalInputs = defaultOptionalInputs.map((input) => {
            return input.name === name ? { ...input, defaultValue: parseInt(value) } : input
        })
        setDefaultOptionalInputs(updatedOptionalInputs)
        console.log(name, value, updatedOptionalInputs)
    }

    return (
        <Box width='100%' p={'5px'} >
            <Accordion TransitionProps={{ unmountOnExit: true }}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1a-content"
                    id="panel1a-header"
                >
                    <Box className='function-name' display='flex' flexDirection='row' alignItems='center'>
                        <Typography variant='h5' sx={{ textAlign: 'start' }}>{index + 1} : {func.name}</Typography>
                    </Box>
                </AccordionSummary>
                <AccordionActions>
                    <IconButton size='small' aria-label="update" color="secondary" onClick={handleGenerateQuery.bind(null, { func_name: func.name })}>
                        <Tooltip title="Generate query" placement='top'>
                            <CreateIcon className='small-icon' />
                        </Tooltip>
                    </IconButton>
                </AccordionActions>
                <AccordionDetails>
                    <Box pl={1} pr={1} pb={1} sx={{ backgroundColor: '#272727' }}>

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

                        <Box className='indicator-optional-inputs' pt={'10px'} sx={{ textAlign: 'start' }}>
                            <Typography variant='h5'>OPTIONAL INPUTS</Typography>
                            {defaultOptionalInputs.length === 0 ?
                                (
                                    <Typography>None</Typography>
                                )
                                :
                                (
                                    defaultOptionalInputs && defaultOptionalInputs.map((optionalInput, index) => {
                                        const { displayName, hint, name, defaultValue } = optionalInput
                                        return (
                                            <Box pt={'15px'} key={index} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
                                                <TextField
                                                    size='small'
                                                    id="outlined-controlled"
                                                    label={displayName}
                                                    name={name}
                                                    value={defaultValue}
                                                    onChange={(handleOptionalInputChange)}
                                                    sx={{
                                                        '& .MuiOutlinedInput-root': {
                                                            '& fieldset': {
                                                                borderColor: 'white',
                                                            }
                                                        }
                                                    }}
                                                />
                                                <Tooltip title={hint} placement='top' sx={{ cursor: 'pointer' }}>
                                                    <InfoOutlinedIcon className='small-icon' />
                                                </Tooltip>
                                            </Box>
                                        )
                                    })
                                )
                            }
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

                    </Box>
                </AccordionDetails>
            </Accordion>
        </Box>
    )
}

const Indicators = (props) => {
    const { symbol } = props
    const token = useSelector(state => state.auth.accessToken);
    // const [copyRawTalibDesc, setCopyRawTalibDesc] = useState([])
    const [rawTalibDesc, setRawTalibDesc] = useState([]) // copy of grouped talib desc data
    const [talibDesc, setTalibDesc] = useState([]) // grouped talib desc data

    // initial fetch talib descriptions
    const loadedRef = useRef(false)
    useEffect(() => {
        if (!loadedRef.current) {
            console.log('UE : Fetching talib descriptions')
            loadedRef.current = true
            getIndicatorDesc({ token })
                .then((res) => {
                    setRawTalibDesc(res.data.desc)
                    setTalibDesc(res.data.desc)
                })
                .catch(err => {
                    console.log(err)
                })
        }
    })

    const [searchTicker, setSearchTicker] = useState('');
    const handleSearchTicker = (e) => {
        console.log(e.target.value)
        setSearchTicker(e.target.value.toLowerCase())
    }

    // filtering/search logic
    useEffect(() => {
        console.log('UE : New Filtering Logic')
        let updatedDataCopy = [...rawTalibDesc]
        const filteredGroups = [];

        for (const group of updatedDataCopy) {
            const filteredFunctions = group.functions.filter(func =>
                func.name.toLowerCase().includes(searchTicker)
            );

            if (filteredFunctions.length > 0) {
                const filteredGroup = {
                    group_name: group.group_name,
                    functions: filteredFunctions
                };
                filteredGroups.push(filteredGroup);
            }
        }
        setTalibDesc(filteredGroups)
        // console.log(filteredGroups)
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
    const [fetchedResult, setFetchedResult] = useState()
    const [chartData, setChartData] = useState([]) // data to be passed to chart
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
                    setFetchedResult(res.data.fetchedResults)
                    const uniqueData = [];
                    const seenTimes = new Set();

                    res.data.fetchedResults.ticker_data.forEach((item) => {
                        if (!seenTimes.has(item.openTime)) {
                            uniqueData.push({
                                time: (item.openTime / 1000),
                                open: parseFloat(item.open),
                                high: parseFloat(item.high),
                                low: parseFloat(item.low),
                                close: parseFloat(item.close)
                            })
                            seenTimes.add(item.openTime);
                        }
                    })
                    setChartData(uniqueData)
                })
                .catch(err => {
                    console.log(err)
                })
        }
    })



    return (
        <Box className='admin-indicator-container' >

            <Grid container spacing={2} pt={4}>
                <Grid item xs={12} sm={12} md={12} lg={12} xl={12} className='indicator-chart-grid-box'>
                    <Box className='chart-container' display='flex' flexDirection='column' height='100%' m={4}>
                        {chartData.length === 0 ?
                            (
                                <Box className='token-chart-box' height="100%" alignItems='center' justifyContent='center' display='flex'>
                                    <Skeleton variant="rounded" sx={{ bgcolor: '#3f3f40' }} width="80%" height="80%" />
                                </Box>
                            )
                            :
                            (
                                <Box className='token-chart-box' height="100%">
                                    <MainChart tData={chartData} symbol={symbol} />
                                </Box>
                            )
                        }
                    </Box>
                </Grid>
            </Grid>

            <Box className='talib-indicators-box' p={2} >
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
                                        <Grid container spacing={1} className='indicator-data-container'>
                                            {functions && functions.map((func, index) => {
                                                return (
                                                    <Grid key={index} item xs={12} sm={12} md={4} lg={4} xl={4}>
                                                        <FunctionContainer index={index} key={index} func={func} />
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