import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Box, FormControlLabel, Checkbox, Autocomplete, useTheme, Switch, TextField, Skeleton } from '@mui/material'
import { setTimePeriod, setSelectedCoinData, setSelectedCoinName } from '../StatsSlice'
import { getHistoricalData } from '../../../../../api/crypto'
import DashboardChart from './DChart.js';
const CoinChartBox = () => {
    const theme = useTheme();
    const dispatch = useDispatch()
    const token = useSelector(state => state.auth.accessToken);
    const SCName = useSelector(state => state.stats.selectedCoinName)
    const SCToken = useSelector(state => state.stats.selectedTokenName)
    const SCData = useSelector(state => state.stats.selectedCoinData)
    const timePeriod = useSelector(state => state.stats.timePeriod)
    // console.log("timePeriod", timePeriod.minute.checked)
    // console.log("timePeriod", timePeriod.hour.checked)
    // console.log("timePeriod", timePeriod.day.checked)
    const CDAutoComplete = useSelector(state => state.stats.cryptoDataAutoComplete)

    const [chartData, setChartData] = useState([])
    const [options, setOptions] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [selectedTokenName, setSelectedTokenName] = useState('');

    // comparing values in redus store for initial fetech of chart data
    //setting initial values for MUI autocomplete and value and options states
    useEffect(() => {
        if (CDAutoComplete.length > 0) {
            let newOptions = CDAutoComplete.map((option) => option.name)
            if (SCName !== '' && SCToken !== '') {
                let inputValue = SCName
                let tokenName = SCToken
                setOptions(newOptions)
                setInputValue(inputValue)
                setSelectedTokenName(tokenName)
            } else {
                let inputValue = CDAutoComplete[0].name
                let tokenName = CDAutoComplete[0].symbol
                setOptions(newOptions)
                setInputValue(inputValue)
                setSelectedTokenName(tokenName)
            }
        }
    }, [CDAutoComplete, SCName, SCToken])

    //handling MUI autocomplete onChange for initial load and subsequent changes
    useEffect(() => {
        if (selectedTokenName !== '') {
            if (SCToken !== selectedTokenName) {
                setChartData([])
                let checked;
                for (let key in timePeriod) {
                    if (timePeriod[key].checked) {
                        checked = key
                    }
                }
                let data = {
                    token: token,
                    tokenName: selectedTokenName,
                    timePeriod: timePeriod[checked].timePeriod,
                    timeFrame: timePeriod[checked].timeFrame
                }
                try {
                    getHistoricalData(data).then((res) => {
                        dispatch(setSelectedCoinName({ coinName: inputValue, tokenName: selectedTokenName }))
                        setChartData(res.data.historicalData.Data.Data)
                        dispatch(setSelectedCoinData({ historicalData: res.data.historicalData.Data.Data, tokenUrl: res.data.url }))
                    })
                } catch (e) {
                    console.log(e)
                }
            } else {
                setChartData(SCData)
            }
        } else return;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTokenName, SCData, SCToken, SCName, dispatch])

    //handling input change for MUI autocomplete
    const handleInputChange = (event, newInputValue) => {
        setInputValue(newInputValue);
        let tokenSymbol = CDAutoComplete.filter((token) => token.name === newInputValue)
        setSelectedTokenName(tokenSymbol[0].symbol)
    }

    //handling time period checkbox and fetch data for chart
    const handleTimePeriodChange = async (event) => {
        if (selectedTokenName === '') { return }
        else {
            setChartData((prev) => prev = [])
            const { name } = event.target
            console.log("name", name)
            //check if any timePeriodState is checked and uncheck it and set checked for event.name to true
            const newTimePeriodState = {};
            let foundChecked = false;
            for (const [k, v] of Object.entries(timePeriod)) {
                if (k === name) {
                    newTimePeriodState[k] = {
                        ...v,
                        checked: true
                    };
                    foundChecked = true;
                } else if (v.checked) {
                    newTimePeriodState[k] = {
                        ...v,
                        checked: false
                    };
                } else {
                    newTimePeriodState[k] = v;
                }
            }
            if (!foundChecked) {
                newTimePeriodState[name] = {
                    ...newTimePeriodState[name],
                    checked: true
                };
            }
            console.log("newTimePeriodState", newTimePeriodState)

            dispatch(setTimePeriod(newTimePeriodState))

            let data = {
                token: token,
                tokenName: selectedTokenName,
                timePeriod: newTimePeriodState[name].timePeriod,
                timeFrame: newTimePeriodState[name].timeFrame
            }
            try {
                let res = await getHistoricalData(data)
                setChartData(res.data.historicalData.Data.Data)
                dispatch(setSelectedCoinData({ historicalData: res.data.historicalData.Data.Data, tokenUrl: res.data.url }))
            } catch (e) {
                console.log(e)
            }
        }
    }

    // toggle-grid-toggler
    const [checked, setChecked] = React.useState(false);
    const handleChange = (event) => {
        setChecked(event.target.checked);
    };

    return (
        <Box className='token-chart-container' display='flex' flexDirection='column' height='100%'>
            <Box className='token-selector-box'>
                <Box className='token-selector'>
                    {options && options.length > 0 &&
                        <Autocomplete
                            size='small'
                            disableClearable={true}
                            className='tokenSelector-autocomplete'
                            value={inputValue}
                            onChange={(event, newInputValue) => handleInputChange(event, newInputValue)}
                            id="controllable-states-demo"
                            options={options}
                            sx={{ width: 150 }}
                            renderInput={(params) => <TextField
                                sx={{
                                    '& .MuiInputBase-input': {
                                        height: '10px'
                                    },
                                    '& .MuiInputLabel-root': {
                                        top: '-5px'
                                    },
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: `${theme.palette.secondary.main}`,
                                        },
                                        '&:hover fieldset': {
                                            borderColor: `${theme.palette.primary.main}`,
                                        },
                                    }
                                }}
                                {...params}
                                label="Select a Token"
                                color="secondary"
                            />}
                        />
                    }

                    <Box className='time-period-toggleGrid-box'>
                        <Box className='time-period-checkbox'>
                            <FormControlLabel
                            sx={{marginLeft:'0px'}}
                                value="30m"
                                control={<Checkbox size='small' name='minute' onChange={handleTimePeriodChange} checked={timePeriod.minute.checked} />}
                                label="Mins"
                                labelPlacement="start"
                            />
                            <FormControlLabel
                            sx={{marginLeft:'0px'}}
                                value="2h"
                                control={<Checkbox size='small' name='hour' onChange={handleTimePeriodChange} checked={timePeriod.hour.checked} />}
                                label="Hrs"
                                labelPlacement="start"
                            />
                            <FormControlLabel
                            sx={{marginLeft:'0px'}}
                                value="1D"
                                control={<Checkbox size='small' name='day' onChange={handleTimePeriodChange} checked={timePeriod.day.checked} />}
                                label="Days"
                                labelPlacement="start"
                            />
                        </Box>
                        <Box className='toggle-grid-toggler'>
                            <FormControlLabel
                                value="top"
                                control={
                                    <Switch
                                        sx={{
                                            '& .MuiSwitch-track': {
                                                backgroundColor: `${theme.palette.secondary.main}`,
                                            }
                                        }}
                                        size="small"
                                        checked={checked}
                                        color="primary"
                                        onChange={handleChange}
                                        inputProps={{ 'aria-label': 'controlled' }}
                                    />
                                }
                                label="GridLine"
                                labelPlacement="start"
                            />
                        </Box>
                    </Box>
                </Box>
            </Box>
            {chartData.length === 0 ?
                <Box className='coin-chart-box' height="400px" alignItems='center' justifyContent='center' display='flex'>
                    <Skeleton variant="rounded" sx={{ bgcolor: '#3f3f40' }} width="95%" height="95%" />
                </Box>
                :
                <Box className='coin-chart-box' height="400px">
                    <DashboardChart chartData={chartData} gridLineToggle={checked} selectedTokenName={selectedTokenName} />
                </Box>
            }
        </Box>
    )
}

export default CoinChartBox