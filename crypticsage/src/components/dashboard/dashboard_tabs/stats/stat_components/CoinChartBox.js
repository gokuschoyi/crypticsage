import React, { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Box, Typography, FormControlLabel, Checkbox, Autocomplete, useTheme, Switch, TextField, Skeleton } from '@mui/material'
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
    const CDAutoComplete = useSelector(state => state.stats.cryptoDataAutoComplete)

    const [chartData, setChartData] = useState([])
    const [options, setOptions] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [selectedTokenName, setSelectedTokenName] = useState('');

    //set height ofchart container and skeleton
    useEffect(() => {
        handleResize()
    }, [])

    //resize event for chart container and skeleton
    const handleResize = () => {
        let coinChartGridBox = document.getElementsByClassName('coin-chart-grid-box')[0];
        let tokenSelector = document.getElementsByClassName('token-selector-box')[0];
        let height = (coinChartGridBox.clientHeight - tokenSelector.clientHeight) - 40;
        let coinChartBox = document.getElementsByClassName('coin-chart-box')[0];
        coinChartBox.style.setProperty('--height', `${height}px`)
        // console.log("set height of coin chart box resize", height)
    }
    useEffect(() => {
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        }
    })

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
        <Box className='token-chart-container'>
            <Box className='token-selector-box'>
                <Box className='token-selector'>
                    <Typography sx={{ fontSize: 26, fontWeight: '600', textAlign: 'left', color: `${theme.palette.secondary.main}`, marginBottom: '0px' }} gutterBottom>Coin</Typography>
                    {options && options.length > 0 &&
                        <Box>
                            <Autocomplete
                                size='small'
                                disableClearable={true}
                                className='tokenSelector-autocomplete'
                                value={inputValue}
                                onChange={(event, newInputValue) => handleInputChange(event, newInputValue)}
                                id="controllable-states-demo"
                                options={options}
                                sx={{ width: 300 }}
                                renderInput={(params) => <TextField
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': {
                                                borderColor: 'white',
                                            }
                                        }
                                    }}
                                    {...params}
                                    label="Select a Token"
                                    color="secondary"
                                />}
                            />
                        </Box>
                    }
                </Box>
                <Box className='time-period-toggleGrid-box'>
                    <Box className='time-period-checkbox'>
                        <FormControlLabel
                            value="30m"
                            control={<Checkbox name='minute' onChange={handleTimePeriodChange} checked={timePeriod.minute.checked} color='secondary' />}
                            label="Mins"
                            labelPlacement="start"
                        />
                        <FormControlLabel
                            value="2h"
                            control={<Checkbox name='hour' onChange={handleTimePeriodChange} checked={timePeriod.hour.checked} color='secondary' />}
                            label="Hrs"
                            labelPlacement="start"
                        />
                        <FormControlLabel
                            value="1D"
                            control={<Checkbox name='day' onChange={handleTimePeriodChange} checked={timePeriod.day.checked} color='secondary' />}
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
                                            backgroundColor: '#e3d1d1'
                                        }
                                    }}
                                    checked={checked}
                                    color="warning"
                                    onChange={handleChange}
                                    inputProps={{ 'aria-label': 'controlled' }}
                                />
                            }
                            label="GridLine"
                            labelPlacement="top"
                        />
                    </Box>
                </Box>
            </Box>
            {chartData.length === 0 ?
                <Box className='coin-chart-box' alignItems='center' justifyContent='center' display='flex'>
                    <Skeleton variant="rounded" sx={{ bgcolor: '#3f3f40' }} width="80%" height="80%" />
                </Box>
                :
                <Box className='coin-chart-box' height="100%">
                    <DashboardChart chartData={chartData} gridLineToggle={checked} selectedTokenName={selectedTokenName} />
                </Box>
            }
        </Box>
    )
}

export default CoinChartBox