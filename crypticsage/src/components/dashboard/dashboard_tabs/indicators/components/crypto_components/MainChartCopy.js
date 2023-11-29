import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Box, useTheme, IconButton, Button, Card, CardContent, CardActions, Typography, Autocomplete, TextField, Tooltip, } from '@mui/material'
import { createChart } from 'lightweight-charts';
import { updateTickerWithOneDataPoint, getHistoricalTickerDataFroDb } from '../../../../../../api/adminController'
import { useSelector, useDispatch } from 'react-redux'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
    setStreamedTickerDataRedux
    , setCryptoDataInDbRedux
    , setIsDataNewFlag
    , setBarsFromTo
    , toggleShowHideChartFlag
    , removeFromSelectedFunction
    , toggleShowSettingsFlag
    , setSelectedFunctionInputValues
    , setSelectedFunctionOptionalInputValues
    , toggleProcessSelectedFunctionsOnMoreData
    , resetStreamedTickerDataRedux
} from '../../modules/CryptoModuleSlice'

import { executeAllSelectedFunctions } from '../../modules/CryptoModuleSlice'

const EXTRA_DATA_FETCH_POINT_FRACTION = 0.3;

const checkForUniqueAndTransform = (data) => {
    const uniqueData = [];
    const seenTimes = new Set();

    data.forEach((item) => {
        if (!seenTimes.has(item.openTime)) {
            uniqueData.push({
                time: (item.openTime / 1000),
                open: parseFloat(item.open),
                high: parseFloat(item.high),
                low: parseFloat(item.low),
                close: parseFloat(item.close),
                volume: parseFloat(item.volume),
            })
            seenTimes.add(item.openTime);
        } else {
            console.log('Duplicate found', item.openTime)
        }
    })
    return uniqueData
}

const calculateVolumeData = (data) => {
    const volDat = data.filter((d) => d.volume)
    // Calculate volume movement and set color based on it
    const volDataWithColor = volDat.map((d, index) => {
        const currentVolume = d.volume;
        const previousVolume = index > 0 ? volDat[index - 1].volume : null;

        // Determine color based on volume movement
        let color = 'neutral'; // Default to neutral color
        if (previousVolume !== null) {
            if (currentVolume > previousVolume) {
                color = 'green'; // Increased volume
            } else if (currentVolume < previousVolume) {
                color = 'red'; // Decreased volume
            }
        }

        return {
            time: d.time,
            value: currentVolume,
            color: color, // Add the "color" key
        };
    });

    return volDataWithColor;

}

const MultiSelect = (props) => {
    const theme = useTheme()
    const { inputLabel, selectedInputOptions, handleInputOptions, fieldName, errorFlag, helperText, id } = props
    const inputOptions = [
        "",
        "high",
        "low",
        "open",
        "close",
    ]
    return (
        <Box className='test-input' display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' gap={'40px'}>
            <Box sx={{ width: '100%' }}>
                <Autocomplete
                    size='small'
                    disableClearable
                    disablePortal={false}
                    id={`select-input-${fieldName}`}
                    options={inputOptions}
                    value={selectedInputOptions} // Set the selected value
                    onChange={(event, newValue) => handleInputOptions(fieldName, newValue, id)} // Handle value change
                    sx={{ width: 'auto' }}
                    renderInput={(params) => <TextField {...params}
                        variant="outlined"
                        error={errorFlag}
                        helperText={helperText}
                        sx={{
                            '& .MuiInputBase-input': {
                                height: '10px'
                            },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: `${theme.palette.text.secondary}`,
                                }
                            }
                        }}
                        label={`Select a ${inputLabel}`}
                        color="secondary"
                    />}
                />
            </Box>
            <Tooltip title={'Select one of the flags to be used for calculation'} placement='top' sx={{ cursor: 'pointer' }}>
                <InfoOutlinedIcon className='small-icon' />
            </Tooltip>
        </Box>
    )
}

const SettingsCard = (props) => {
    const { selectedFunctionNameAndId } = props
    const { slId, slName } = selectedFunctionNameAndId
    const selectedFunctionData = useSelector(state => state.cryptoModule.selectedFunctions)
    const functionData = selectedFunctionData.find((func) => func.name === slName)
    const selectedFunc = functionData.functions.find((func) => func.id === slId)
    const dispatch = useDispatch()
    const theme = useTheme()
    const { name, id, inputs, optInputs } = selectedFunc

    // handle input options
    const handleInputOptions = (fieldName, newValue, id) => {
        dispatch(setSelectedFunctionInputValues({ fieldName, value: newValue, id, name }))
    }

    // handle optional input change
    const handleOptionalInputChange = (e) => {
        const { name: nm, value, id } = e.target
        // console.log(nm, value, id)
        dispatch(setSelectedFunctionOptionalInputValues({ fieldName: nm, value, id, name: name }))
    }

    const handleCloseSettings = (param) => {
        const { name, id } = param
        dispatch(toggleShowSettingsFlag({ id: id, name: name }))
    }

    return (
        <Card sx={{ width: 265 }}>
            <CardContent sx={{ padding: '4px' }}>
                <Typography textAlign='start' gutterBottom variant="body1">
                    SETTINGS  : {name}
                </Typography>
                <Box>
                    <Box className='settings-inputs'>
                        <Typography variant='h6' textAlign='start' fontWeight='500'>INPUTS</Typography>
                        {inputs.length > 0 && inputs.map((input, index) => {
                            const { value, errorFlag, helperText } = input
                            return (
                                <Box key={index} display='flex' flexDirection='column' pb={'5px'} alignItems='flex-start'>
                                    {input.flags ?
                                        (
                                            <Box sx={{ width: '100%' }} display='flex' flexDirection='column'>
                                                <Typography variant='custom' style={{ paddingLeft: '16px', textAlign: 'start' }}><span style={{ fontWeight: '600' }}>Name : </span>{input.name}</Typography>
                                                {/* <Typography><span style={{ fontWeight: '600' }}>Type : </span>{input.type}</Typography> */}
                                                <Typography pl={2} variant='custom' textAlign='start'><span style={{ fontWeight: '600' }}>Flags : </span></Typography>
                                                <Box pl={3} display='flex' flexDirection='column'>
                                                    {Object.keys(input.flags).map((key, index) => {
                                                        return (
                                                            <Typography variant='custom' key={index} style={{ textAlign: 'start' }}>{key} : {input.flags[key]}</Typography>
                                                        )
                                                    })}
                                                </Box>
                                            </Box>
                                        ) :
                                        (
                                            <Box pt={1} width='100%'>
                                                <MultiSelect
                                                    inputLabel={input.name === 'inReal' ? 'flag' : input.name}
                                                    selectedInputOptions={value}
                                                    handleInputOptions={handleInputOptions}
                                                    fieldName={input.name}
                                                    errorFlag={errorFlag}
                                                    helperText={helperText}
                                                    id={id}
                                                />
                                            </Box>
                                        )
                                    }
                                </Box>
                            )
                        })}
                    </Box>
                    <Box className='settings-optional-inputs' pt={1}>
                        <Typography variant='h6' textAlign='start' fontWeight='500'>OPTIONAL INPUTS</Typography>
                        {optInputs.length === 0 ?
                            (
                                <Box pt={1}>
                                    <Typography textAlign='start'>None</Typography>
                                </Box>
                            )
                            :
                            (
                                optInputs && optInputs.map((optionalInput, index) => {
                                    const { displayName, hint, name, defaultValue, errorFlag, helperText } = optionalInput
                                    return (
                                        <Box pt={'15px'} key={index} display='flex' flexDirection='row' alignItems='center' justifyContent='space-between'>
                                            <TextField
                                                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', style: { height: '10px' } }}
                                                error={errorFlag}
                                                helperText={helperText}
                                                size='small'
                                                id={id}
                                                label={displayName}
                                                name={name}
                                                value={defaultValue}
                                                onChange={(handleOptionalInputChange)}
                                                sx={{
                                                    '& .MuiOutlinedInput-root': {
                                                        '& fieldset': {
                                                            borderColor: `${theme.palette.text.secondary}`,
                                                        }
                                                    }
                                                }}
                                            />
                                            {name === 'optInMAType' ?
                                                (
                                                    <Tooltip
                                                        title={`SMA = 0, EMA = 1, WMA = 2, DEMA = 3, TEMA = 4, TRIMA = 5, KAMA = 6, MAMA = 7, T3 = 8`}
                                                        placement='top' sx={{ cursor: 'pointer' }}>
                                                        <InfoOutlinedIcon className='small-icon' />
                                                    </Tooltip>
                                                )
                                                :
                                                (
                                                    <Tooltip title={hint} placement='top' sx={{ cursor: 'pointer' }}>
                                                        <InfoOutlinedIcon className='small-icon' />
                                                    </Tooltip>
                                                )
                                            }
                                        </Box>
                                    )
                                })
                            )
                        }
                    </Box>
                </Box>
            </CardContent>
            <CardActions>
                <Button color='secondary' size="small">Run</Button>
                <Button color='secondary' size="small" onClick={handleCloseSettings.bind(null, { id: id, name: name })}>Close</Button>
            </CardActions>
        </Card>
    )
}

const MainChart = (props) => {
    const { latestTime, new_fetch_offset, symbol, selectedTokenPeriod, module } = props;
    const token = useSelector(state => state.auth.accessToken);
    const toolTipSwitchFlag = useSelector(state => state.cryptoModule.toolTipOn)
    const theme = useTheme()
    const chartBackgroundColor = theme.palette.background.default
    const textColor = theme.palette.primary.newWhite

    const dispatch = useDispatch()
    const processMore = useSelector(state => state.cryptoModule.processSelectedFunctionsOnMoreData)
    // const streamedTickerData = useSelector(state => state.cryptoModule.streamedTickerData)
    const tDataRedux = useSelector(state => state.cryptoModule.cryptoDataInDb)
    const pageNoBasedOnDataInRedux = Math.floor(tDataRedux.length / 500)

    const selectedTickerPeriod = useSelector(state => state.cryptoModule.selectedTickerPeriod)
    const selectedTickerName = useSelector(state => state.cryptoModule.selectedTickerName)

    const newFetchedDataCount = useRef(0)
    const latestDateRf = useRef(latestTime) // latest time in the fetched data. Data doe not inclusive of this time
    const candleStickSeriesRef = useRef(null)
    const candleStickVolumeSeriesRef = useRef(null)
    const showPredictionSwitchFlag = useSelector(state => state.cryptoModule.showPredictions)

    const selectedFunctionData = useSelector(state => state.cryptoModule.selectedFunctions)
    const modifiedSelectedFunctionWithDataToRender = useSelector(state => state.cryptoModule.modifiedSelectedFunctionWithDataToRender)
    const pageNo = useRef(pageNoBasedOnDataInRedux)
    const newDataRef = useRef([...tDataRedux])
    const chart = useRef(null)
    const chartboxRef = useRef();

    const lastLookAheadPredictions = useSelector(state => state.cryptoModule.modelData.lastLookAheadPredictions)

    // const [finalTalibExecuteQuery, setFinalTalibExcuteQuery] = useState([])
    useEffect(() => {
        // console.log("UE 1 : Execute all selected functions")
        if (processMore && selectedFunctionData.length > 0) {
            let fTalibExecuteQuery = []

            selectedFunctionData.forEach((unique_func) => {
                const { outputs } = unique_func;
                const func = unique_func.functions;
                func.forEach((f) => {
                    const { inputs, optInputs, name, id } = f;
                    let inputEmpty = false;
                    let talibExecuteQuery = {}
                    let tOITypes = {}
                    const transformedOptionalInputs = optInputs.reduce((result, item) => {
                        result[item.name] = item.defaultValue
                        tOITypes[item.name] = item.type;
                        return result;
                    }, {})

                    let outputkeys = {}
                    let outputsCopy = [...outputs]
                    outputkeys = outputsCopy.reduce((result, output) => {
                        result[output.name] = output.name;
                        return result;
                    }, {});

                    let converted = {}
                    inputs.map((input) => {
                        if (input.flags) {
                            Object.keys(input.flags).forEach((key) => {
                                converted[input.flags[key]] = input.flags[key];
                            })
                            return input
                        } else {
                            if (input.value === '') {
                                inputEmpty = true;
                                converted[input.name] = "";
                                return {
                                    ...input,
                                    errorFlag: true,
                                    helperText: 'Please select a valid input',
                                };
                            } else {
                                converted[input.name] = input.value;
                                return {
                                    ...input,
                                    errorFlag: false,
                                    helperText: '',
                                };
                            }
                        }
                    })

                    talibExecuteQuery['name'] = name;
                    talibExecuteQuery['startIdx'] = 0;
                    talibExecuteQuery['endIdx'] = tDataRedux.length - 1;
                    talibExecuteQuery = { ...talibExecuteQuery, ...converted, ...transformedOptionalInputs }


                    let payload = {
                        func_query: talibExecuteQuery,
                        func_param_input_keys: converted,
                        func_param_optional_input_keys: tOITypes,
                        func_param_output_keys: outputkeys,
                        db_query: {
                            asset_type: 'crypto',
                            fetch_count: tDataRedux.length,
                            period: selectedTickerPeriod,
                            ticker_name: selectedTickerName
                        }
                    }
                    fTalibExecuteQuery.push({ id, payload, inputEmpty })
                })
            })
            fTalibExecuteQuery = fTalibExecuteQuery.filter((item) => !item.inputEmpty)
            dispatch(executeAllSelectedFunctions(fTalibExecuteQuery))

            // console.log("Execute query", fTalibExecuteQuery)
            // setFinalTalibExcuteQuery(fTalibExecuteQuery)
            dispatch(toggleProcessSelectedFunctionsOnMoreData(false))
        }
        return () => {
            // console.log('UE RETURN 1 : Execute all selected functions')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [processMore, selectedFunctionData, tDataRedux])

    // Main chart useEffect
    useEffect(() => {
        // console.log("UE 2 : Main chart")
        let tData = checkForUniqueAndTransform(tDataRedux)

        let tokenDom = document.getElementsByClassName('chart-cont-dom')[0]
        let cWidth = tokenDom.clientWidth;
        let cHeight = tokenDom.clientHeight;

        // console.log(cWidth, cHeight)

        // paddiing causing some resize fit issue. Check later -- fixed by changing margin with padding
        const handleResize = () => {
            cWidth = tokenDom.clientWidth;
            cHeight = tokenDom.clientHeight;
            // console.log(cWidth, cHeight)
            chart.current.applyOptions({ width: cWidth, height: cHeight });
        };

        chart.current = createChart(chartboxRef.current, {
            width: cWidth,
            height: cHeight,
            layout: {
                background: {
                    type: 'solid',
                    color: '#000000',
                },
                textColor: 'rgba(255, 255, 255, 0.9)',
            },
            grid: {
                vertLines: {
                    visible: false,
                    color: 'rgba(197, 203, 206, 0.5)',
                },
                horzLines: {
                    visible: false,
                    color: 'rgba(197, 203, 206, 0.5)',
                },
            },
            crosshair: {
                mode: 'magnet',
            },
            rightPriceScale: {
                borderColor: 'rgba(197, 203, 206, 0.8)',
            },
            timeScale: {
                borderColor: 'rgba(197, 203, 206, 0.8)',
            }
        });

        chart.current.timeScale().fitContent();

        // Candlestick
        candleStickSeriesRef.current = chart.current.addCandlestickSeries({
            upColor: 'green',
            downColor: 'red',
            wickVisible: true,
        })

        candleStickSeriesRef.current.priceScale().applyOptions({
            scaleMargins: {
                // positioning the price scale for the area series
                top: 0.1,
                bottom: 0.4,
            },
        });

        candleStickSeriesRef.current.setData(tData);

        // Volume
        candleStickVolumeSeriesRef.current = chart.current.addHistogramSeries({
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '',
            scaleMargins: {
                top: 0.7, // highest point of the series will be 70% away from the top
                bottom: 0,
            },
        })

        candleStickVolumeSeriesRef.current.priceScale().applyOptions({
            scaleMargins: {
                top: 0.7, // highest point of the series will be 70% away from the top
                bottom: 0,
            },
        });
        const volDat = calculateVolumeData(tData)
        candleStickVolumeSeriesRef.current.setData(volDat);

        window.addEventListener('resize', handleResize);

        return () => {
            // console.log('UE RETURN 2 : Main chart')
            window.removeEventListener('resize', handleResize);
            chart.current.remove();
            setChartSeriesState([])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol, selectedTokenPeriod])

    const [predictionLineChart, setPredictionLineChart] = useState(null)

    // Adding the predictions on the main chart
    useEffect(() => {
        // console.log('UE : prediction on main chart');
        // console.log(predictionLineChart)
        if (lastLookAheadPredictions.length === 0 || !chart.current) {
            if (predictionLineChart) {
                // console.log('model deleted')
                chart.current.removeSeries(predictionLineChart);
                setPredictionLineChart(null);
            }
            return;
        }

        // Remove existing prediction line chart if the flag is off or if there's a new prediction data
        if ((!showPredictionSwitchFlag || lastLookAheadPredictions.length > 0) && predictionLineChart) {
            chart.current.removeSeries(predictionLineChart);
            setPredictionLineChart(null);
        }

        // Add or update the prediction line chart if the flag is on
        if (showPredictionSwitchFlag) {
            const chartData = lastLookAheadPredictions.map(item => ({
                time: item.open,
                value: item.predicted
            }));

            // console.log(predictionLineChart, chart.current);

            let newLineChart = chart.current.addLineSeries({
                color: 'orange',
                lineWidth: 1
            });
            let markers = []
            if (chartData.length === 1) {
                markers.push({
                    time: chartData[0].time,
                    position: 'aboveBar',
                    color: 'orange',
                    shape: 'circle',
                    text: 'prediction',
                    size: 0.4
                })
            }

            newLineChart.setData(chartData);
            newLineChart.setMarkers(markers)
            // console.log(chartData, newLineChart);
            setPredictionLineChart(newLineChart);
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showPredictionSwitchFlag, lastLookAheadPredictions]);


    // Define the debounce function
    function debounce(func, delay) {
        let timeoutId;
        return function () {
            const context = this;
            const args = arguments;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(context, args);
            }, delay);
        };
    }

    const fetchPointRef = useRef(Math.floor(newDataRef.current.length * EXTRA_DATA_FETCH_POINT_FRACTION) / -1)
    const uniqueBarNumbersRef = useRef([]);
    const lastBarNoRef = useRef(0)
    const SFDlengthRef = useRef(selectedFunctionData.length)

    // Create a debounced version of your data fetching logic
    const debouncedFetchData = debounce((barNo, candleSticksInVisibleRange, SFDLength) => {
        // Your data fetching logic here
        if (barNo < fetchPointRef.current) {
            pageNo.current = pageNo.current + 1;
            console.log('Fetching more data', barNo, pageNo.current);

            // Fetch new data query
            const fetchQuery = {
                asset_type: module,
                ticker_name: symbol,
                period: selectedTokenPeriod,
                page_no: pageNo.current,
                items_per_page: 500,
                new_fetch_offset: new_fetch_offset + newFetchedDataCount.current
            }
            // console.log(fetchQuery)

            getHistoricalTickerDataFroDb({ token, payload: fetchQuery })
                .then((res) => {
                    const newData = res.data.fetchedResults.ticker_data
                    newDataRef.current = [...newData, ...newDataRef.current]
                    fetchPointRef.current = Math.floor(candleSticksInVisibleRange * 0.2) / -1
                    dispatch(setCryptoDataInDbRedux(newDataRef.current))

                    const uniqueData = checkForUniqueAndTransform(newDataRef.current)

                    candleStickSeriesRef.current.setData(uniqueData)
                    candleStickVolumeSeriesRef.current.setData(calculateVolumeData(uniqueData))

                    uniqueBarNumbersRef.current = []
                    // console.log("Inside Debounce", SFDLength)
                    if (SFDLength > 0) {
                        dispatch(toggleProcessSelectedFunctionsOnMoreData(true))
                    }
                })
        } else {
            // console.log('No fetch', barNo, pageNo.current, lastBarNo, fetchPoint);
        }
    }, 500); // Adjust the delay as needed (e.g., 1000ms = 1 second)

    useEffect(() => {
        // console.log("UE 3 : Debounce fetch")
        SFDlengthRef.current = selectedFunctionData.length
        const VLRCHandler = (param) => {
            const { from, to } = param
            // console.log(from, to)
            const candleSticksInVisibleRange = Math.floor(to - from)
            fetchPointRef.current = Math.floor(candleSticksInVisibleRange * EXTRA_DATA_FETCH_POINT_FRACTION) / -1

            const barsInfo = candleStickSeriesRef.current.barsInLogicalRange(param);
            const { barsBefore } = barsInfo
            const barNo = Math.floor(barsBefore)

            // Check if the generated barNo is unique
            if (!uniqueBarNumbersRef.current.includes(barNo)) {
                uniqueBarNumbersRef.current.push(barNo);
                if (barNo < lastBarNoRef.current) { // chcking if the chart is moving backwards, left to right
                    debouncedFetchData(barNo, candleSticksInVisibleRange, SFDlengthRef.current);
                }
            }
            lastBarNoRef.current = barNo
        }

        chart.current.timeScale().subscribeVisibleLogicalRangeChange(VLRCHandler)

        return () => {
            // console.log("UE RETURN 3 : Debounce fetch")
            chart.current.timeScale().unsubscribeVisibleTimeRangeChange(VLRCHandler)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFunctionData])


    const debouncedFromToSave = debounce((from, to) => {
        // console.log(from, to)
        dispatch(setBarsFromTo({ from: from, to: to }))
    }, 500)


    const barsFromToRedux = useSelector(state => state.cryptoModule.barsFromTo)
    useEffect(() => {
        const barsInChartHandler = (param) => {
            const { from, to } = param
            const fromRounded = Math.floor(from)
            const toRounded = Math.floor(to)
            debouncedFromToSave(fromRounded, toRounded)
            // console.log(fromRounded, toRounded)
        }
        // console.log('UE : from to')
        const { from, to } = barsFromToRedux
        // console.log(from, to)
        if (barsFromToRedux.from !== 0 && barsFromToRedux.to !== 0) {
            // console.log(from, to)
            chart.current.timeScale().setVisibleLogicalRange({ from: from, to: to })
        } else {
            // console.log('UE : Initial chartset visible logical range')
        }
        chart.current.timeScale().subscribeVisibleLogicalRangeChange(barsInChartHandler)

        return () => {
            chart.current.timeScale().unsubscribeVisibleTimeRangeChange(barsInChartHandler)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const generateOHLCV_String = (param) => {
        const { open, high, low, close, vol } = param
        return `
        <div class="value-box">
            <div style="width:73px; text-align:start">O : <span id="openValue">${Math.round(100 * open) / 100}</span></div>
            <div style="width:73px; text-align:start">H : <span id="highValue">${Math.round(100 * high) / 100}</span></div>
            <div style="width:73px; text-align:start">L : <span id="lowValue">${Math.round(100 * low) / 100}</span></div>
            <div style="width:73px; text-align:start">C : <span id="closeValue">${Math.round(100 * close) / 100}</span></div>
            <div style="width:73px; text-align:start">V : <span id="volumeValue">${(vol || 0).toFixed(2)}</span></div>
        </div>
        `
    }

    const subscribedRef = useRef(false)
    // ohlcv crosshair subscriber
    useEffect(() => {
        let ohlcvLegend = document.getElementsByClassName('ohlcv-box')[0]
        const ohlcvHandler = (param) => {
            if (
                param.point === undefined ||
                !param.time ||
                param.point.x < 0 ||
                param.point.x > chartboxRef.current.clientWidth ||
                param.point.y < 0 ||
                param.point.y > chartboxRef.current.clientHeight ||
                param.paneIndex !== 0
            ) {
                subscribedRef.current = false;
                // tooltip.style.display = 'none';
            } else {
                subscribedRef.current = true;
                const date = new Date(param.time * 1000).toLocaleString('en-AU',
                    {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                    }
                );

                const data = param.seriesData.get(candleStickSeriesRef.current) || param.seriesData.get(predictionLineChart);
                const volData = param.seriesData.get(candleStickVolumeSeriesRef.current);
                const open = data?.open || 0;

                const close = data.value !== undefined ? data.value : data.close;
                const high = data?.high || 0;
                const low = data?.low || 0;
                let newString = generateOHLCV_String({ open, high, low, close, vol: volData?.value })
                let dateStr = `<div style="width:110px; text-align:start">${date}</div>`
                let finalStr = toolTipSwitchFlag ? `${newString}` : `${dateStr}${newString}`
                ohlcvLegend.innerHTML = finalStr
            }
        }

        chart.current.subscribeCrosshairMove(ohlcvHandler)

        return () => {
            chart.current.unsubscribeCrosshairMove(ohlcvHandler)
        }
    })

    // Tooltip useEffect to show/hide
    useEffect(() => {
        // console.log("UE : tooltip subscribe")
        let tokenChartBox = document.getElementsByClassName('token-chart-box')[0].getBoundingClientRect()
        let offsetLeft = Math.round(tokenChartBox.left);
        let offsetTop = Math.round(tokenChartBox.top)

        let tokenDom = document.getElementsByClassName('chart-cont-dom')[0]
        let cWidth = tokenDom.clientWidth;
        let cHeight = tokenDom.clientHeight;

        const tooltip = document.getElementsByClassName('tool-tip-indicators')[0]
        const ohlcvTooltip = document.getElementsByClassName('ohlcv-box')[0]

        const toolTipMargin = 15;

        const toolTipHandler = (param) => {
            if (
                param.point === undefined ||
                !param.time ||
                param.point.x < 0 ||
                param.point.x > chartboxRef.current.clientWidth ||
                param.point.y < 0 ||
                param.point.y > chartboxRef.current.clientHeight ||
                param.paneIndex !== 0
            ) {
                tooltip.style.display = 'none';
            } else {
                const dateStr = new Date(param.time * 1000).toLocaleString('en-AU',
                    {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                    }
                );
                tooltip.style.display = 'block';
                const data = param.seriesData.get(candleStickSeriesRef.current) || param.seriesData.get(predictionLineChart);
                const volData = param.seriesData.get(candleStickVolumeSeriesRef.current)?.value || 0;
                // console.log(volData)
                const open = data?.open || 0;

                const close = data.value !== undefined ? data.value : data.close;
                const high = data?.high || 0;
                const low = data?.low || 0;

                tooltip.innerHTML = `
                    <div style="color: ${'rgba(255, 82, 82, 1)'}">${symbol}</div>
                    <div class-name='tooltip-text' style="margin: 4px 0px; font-size: 11px; font-weight:400; color: ${'black'}">O : ${Math.round(100 * open) / 100}</div>
                    <div class-name='tooltip-text' style="margin: 4px 0px; font-size: 11px; font-weight:400; color: ${'black'}">H : ${Math.round(100 * high) / 100}</div>
                    <div class-name='tooltip-text' style="margin: 4px 0px; font-size: 11px; font-weight:400; color: ${'black'}">L : ${Math.round(100 * low) / 100}</div>
                    <div class-name='tooltip-text' style="margin: 4px 0px; font-size: 11px; font-weight:400; color: ${'black'}">C : ${Math.round(100 * close) / 100}</div>
                    <div class-name='tooltip-text' style="margin: 4px 0px; font-size: 11px; font-weight:400; color: ${'black'}">V : ${Math.round(volData).toFixed(2)}</div>
                    <div class-name='tooltip-text' style="color: ${'black'},font-size: 11px;">${dateStr}</div>
                    `;

                const coordinate = candleStickSeriesRef.current.priceToCoordinate(close);
                // console.log(coordinate)

                let shiftedCoordinate = param.point.x;
                if (coordinate === null) {
                    return;
                }

                shiftedCoordinate = Math.max(
                    0,
                    Math.min(chartboxRef.current.clientWidth, shiftedCoordinate)
                );

                const coordinateY =
                    coordinate - toolTipMargin > 0
                        ? coordinate - toolTipMargin
                        : Math.max(
                            0,
                            Math.min(
                                chartboxRef.current.clientHeight - toolTipMargin,
                                coordinate + toolTipMargin
                            )
                        );

                let finalX = shiftedCoordinate + offsetLeft + toolTipMargin
                let finalY = coordinateY + offsetTop + 20 + toolTipMargin
                if (finalX > cWidth + offsetLeft - 180) {
                    finalX = finalX - 150
                }
                if (finalY > offsetTop + cHeight - 180) {
                    finalY = finalY - 190
                }

                tooltip.style.left = finalX + 'px';;
                tooltip.style.top = finalY + 'px';
            }
        }

        if (toolTipSwitchFlag) {
            chart.current.subscribeCrosshairMove(toolTipHandler);
            ohlcvTooltip.style.display = 'none'
        } else {
            tooltip.style.display = 'none';
            ohlcvTooltip.style.display = 'flex'
            chart.current.unsubscribeCrosshairMove(toolTipHandler)
        }

        return () => {
            // console.log("Tooltip Subscribe UE  : Return")
            chart.current.unsubscribeCrosshairMove(toolTipHandler)
        }
    })

    // sets the background color of the chart based on theme
    useEffect(() => {
        if (chart.current !== undefined || chart.current !== null) {
            chart.current.applyOptions({
                layout: {
                    background: {
                        type: 'solid',
                        color: chartBackgroundColor,
                    },
                    textColor: textColor,
                }
            })
        }
    }, [chartBackgroundColor, textColor])

    const [chartSeriesState, setChartSeriesState] = useState([])
    const removePaneFlag = useRef(false)
    const paneOneChartLength = useRef(0)

    // renders the chart based on the selected functions
    const renderChart = useCallback(() => {
        if (modifiedSelectedFunctionWithDataToRender.length === 0 && chartSeriesState.length === 0) {
            // console.log('No chart to render : Callback');
            return;
        }

        const lineColors = [
            "#FFAA00",
            "#DDBB77",
            "#EECC99",
            "#CCAACC",
            "#DDDD88",
            "#FF9966",
            "#FFBB88",
        ]

        // console.time('Chart Load Time');

        const reduxDataCopy = JSON.parse(JSON.stringify(modifiedSelectedFunctionWithDataToRender));

        // filter and remove charts with old data based on isDataNew flag
        const chartsWithNewData = reduxDataCopy.filter((f) => f.isDataNew === true);
        if (chartsWithNewData.length > 0) {
            // console.log('Charts with new data', chartsWithNewData.length);
            let updated = []
            chartsWithNewData.forEach((f) => {
                const seriesToRemove = chartSeriesState.find((series) => series.id === f.id && series.key === f.key);
                if (seriesToRemove) {
                    chart.current.removeSeries(seriesToRemove.series);
                    seriesToRemove.series = null
                    updated.push(seriesToRemove)
                } else {
                    updated.push(seriesToRemove)
                }
            })
            dispatch(setIsDataNewFlag())
        } else { // console.log("No new data for chart") 
        }

        // checking and rendering chart
        selectedFunctionData.forEach((func) => {
            const funcIds = func.functions.map((f) => f.id) // if count = 1 then it is a single function else if 2 a copy of same function is present
            // console.log("Func id from redux", funcIds)
            funcIds.forEach((id) => {
                const filtered = reduxDataCopy.filter((chartData) => chartData.id === id);
                // console.log("Filtered", filtered)
                filtered.forEach((f) => {
                    // console.log(f.splitPane)
                    const existingInStateIndex = chartSeriesState.findIndex((series) => series.id === f.id && series.key === f.key);
                    // console.log("Existing in state index", existingInStateIndex)
                    // console.log("Existing in state", existingInState)
                    if (existingInStateIndex !== -1) {
                        // console.log('Existing in state', f.key)
                        let existingInState = chartSeriesState[existingInStateIndex];
                        if (existingInState.series !== null) {
                            existingInState.visible = f.visible
                            existingInState.series.applyOptions({ visible: f.visible });
                        } else {
                            const newSeries = chart.current.addLineSeries({
                                color: existingInState.color,
                                lineWidth: 1,
                                visible: f.visible,
                                priceLineVisible: false,
                                lastValueVisible: false,
                                pane: f.splitPane ? 1 : 0,
                            });
                            newSeries.setData(f.result);
                            existingInState.series = newSeries
                        }
                    } else {
                        // console.log("Does not exist in state", f.key)
                        const color = lineColors[Math.floor(Math.random() * lineColors.length)];
                        const newSeries = chart.current.addLineSeries({
                            color: color,
                            lineWidth: 1,
                            visible: f.visible,
                            priceLineVisible: false,
                            lastValueVisible: false,
                            pane: f.splitPane ? 1 : 0,
                        });
                        newSeries.setData(f.result);
                        setChartSeriesState((prevSeries) => [...prevSeries,
                        {
                            name: f.name,
                            series: newSeries,
                            id: f.id,
                            key: f.key,
                            pane: f.splitPane ? 1 : 0,
                            visible: f.visible,
                            color: color
                        }
                        ]);
                    }
                });
            });
        });

        // checking and removing chart
        const existingSeriesId = chartSeriesState.map((series) => ({ id: series.id, key: series.key }));
        const functionsInState = reduxDataCopy.map((func) => ({ id: func.id, key: func.key }));
        const difference = existingSeriesId.filter((series) => !functionsInState.some((func) => func.id === series.id && func.key === series.key));

        // console.log(existingSeriesId)
        // console.log(functionsInState)
        // console.log(difference)

        difference.forEach((func) => {
            const seriesToRemove = chartSeriesState.find((series) => series.id === func.id && series.key === func.key);
            if (seriesToRemove) {
                chart.current.removeSeries(seriesToRemove.series);
                // Update chartSeriesState to remove the deleted series
                setChartSeriesState((prevSeries) => prevSeries.filter((series) => series.id !== func.id))
            }
        });

        // Removing pane 1 if no chart is present
        paneOneChartLength.current = chartSeriesState.filter((series) => series.pane === 1).length
        if (paneOneChartLength.current > 0) {
            removePaneFlag.current = true
        }
        // console.log(paneOneChartLength.current, removePaneFlag.current)
        if (paneOneChartLength.current === 0 && removePaneFlag.current) {
            // console.log("Remove pane")
            chart.current.removePane(1)
            removePaneFlag.current = false
        } else {
            // console.log("pane needed")
        }

        // console.timeEnd('Chart Load Time');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [chartSeriesState, modifiedSelectedFunctionWithDataToRender]);

    useEffect(() => {
        // console.log("UE 4 : Render chart")
        // console.log('<---------------------START-------------------------->');
        renderChart();

        // Subscribe to crosshair move event of the selected talib functions
        const crosshairMoveHandler = (param) => {
            // console.log(param)
            if (
                param.point === undefined ||
                !param.time ||
                param.point.x < 0 ||
                param.point.x > chartboxRef.current.clientWidth ||
                param.point.y < 0 ||
                param.point.y > chartboxRef.current.clientHeight
            ) {
                return;
            }

            const seriesDataMap = new Map(param.seriesData);

            let local = [...chartSeriesState]
            let paneZero = local.filter((series) => series.pane === 0)
            let paneOne = local.filter((series) => series.pane === 1)
            let toShow = param.paneIndex === 0 ? paneZero : paneOne

            toShow.forEach((series) => {
                const seriesValue = seriesDataMap.get(series.series);
                if (seriesValue !== undefined && series.visible) {
                    const divToInsertDataTo = document.querySelector(`.${series.name}_${series.id}_${series.key}`);
                    if (divToInsertDataTo) {
                        let displayKey = convertKeysForDisplay(series.key)
                        divToInsertDataTo.innerHTML = `${displayKey} : ${seriesValue.value.toFixed(2)}`
                    }
                }
            });
        };

        chart.current.subscribeCrosshairMove(crosshairMoveHandler);

        // console.log('<------------------END----------------------------->');

        return () => {
            // console.log('UE RETURN 4 : Render chart');
            chart.current.unsubscribeCrosshairMove(crosshairMoveHandler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [renderChart]);


    const useBinanceWebSocket = (binanceWS_URL) => {
        const websocketRef = useRef(null);
        const isInitializedRef = useRef(false);

        useEffect(() => {
            if (!isInitializedRef.current) {
                console.log('Opening Binance WebSocket connection...');
                websocketRef.current = new WebSocket(binanceWS_URL);
                isInitializedRef.current = true;
            }

            return () => {
                if (websocketRef.current && websocketRef.current.readyState === 1) {
                    console.log('Closing Binance WebSocket connection...');
                    websocketRef.current.close();
                }
            };
        }, [binanceWS_URL]);

        return websocketRef;
    };

    // web socket for live updates
    const previousValue = useRef({ open: '', high: '', low: '', close: '', vol: '' })
    const lowerCaseSymbol = symbol.toLowerCase()
    const webSocketConnectionURI = `wss://stream.binance.com:9443/ws/${lowerCaseSymbol}@kline_${selectedTokenPeriod}`
    const binance_websocket = useBinanceWebSocket(webSocketConnectionURI)

    useEffect(() => {
        let ohlcvLegend = document.getElementsByClassName('ohlcv-box')[0]

        // Function to check and apply the pulsing class for new data
        function checkAndApplyPulse(id, value, prevValue) {
            const element = document.getElementById(id);
            if (value !== prevValue) {
                element.classList.add('pulsing');

                // Remove the pulsing class after the animation completes
                element.addEventListener('animationiteration', () => {
                    element.classList.remove('pulsing');
                });
            }
        }

        const createWebSocket = () => {
            binance_websocket.current.onmessage = (e) => {
                const message = JSON.parse(e.data);
                const tickerPayload = {
                    openTime: message.k.t,
                    open: message.k.o,
                    high: message.k.h,
                    low: message.k.l,
                    close: message.k.c,
                    volume: message.k.v,
                    closeTime: message.k.T,
                    quoteAssetVolume: message.k.q,
                    trades: message.k.n,
                    takerBaseAssetVolume: message.k.V,
                    takerQuoteAssetVolume: message.k.Q,
                };

                // Update your chart series
                candleStickSeriesRef.current.update({
                    time: tickerPayload.openTime / 1000,
                    open: parseFloat(tickerPayload.open),
                    high: parseFloat(tickerPayload.high),
                    low: parseFloat(tickerPayload.low),
                    close: parseFloat(tickerPayload.close),
                });

                candleStickVolumeSeriesRef.current.update({
                    time: tickerPayload.openTime / 1000,
                    value: parseFloat(tickerPayload.volume),
                })

                if (!subscribedRef.current) {
                    // console.log(subscribedRef.current)
                    const currentValue = {
                        openTime: tickerPayload.openTime,
                        open: tickerPayload.open,
                        high: tickerPayload.high,
                        low: tickerPayload.low,
                        close: tickerPayload.close,
                        vol: tickerPayload.volume
                    }


                    const date = new Date(currentValue.openTime).toLocaleString('en-AU',
                        {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: 'numeric',
                            minute: 'numeric',
                            hour12: true
                        }
                    );

                    let newString = generateOHLCV_String({
                        open: parseFloat(tickerPayload.open),
                        high: parseFloat(tickerPayload.high),
                        low: parseFloat(tickerPayload.low),
                        close: parseFloat(tickerPayload.close),
                        vol: parseFloat(tickerPayload.volume)
                    })
                    let dateStr = `<div class="" style="width:110px; text-align:start">${date}</div>`
                    let finalStr = `${dateStr}${newString}`
                    ohlcvLegend.innerHTML = finalStr

                    // Check and apply pulse class for each value
                    checkAndApplyPulse('openValue', currentValue.open, previousValue.current.open);
                    checkAndApplyPulse('highValue', currentValue.high, previousValue.current.high);
                    checkAndApplyPulse('lowValue', currentValue.low, previousValue.current.low);
                    checkAndApplyPulse('closeValue', currentValue.close, previousValue.current.close);
                    checkAndApplyPulse('volumeValue', currentValue.vol, previousValue.current.vol);

                    previousValue.current = currentValue
                } else {
                    // console.log(subscribedRef.current)
                }

                if (latestDateRf.current < tickerPayload.openTime && selectedTokenPeriod === '1m') {
                    const fetchQuery = {
                        ticker_name: symbol,
                        period: selectedTokenPeriod,
                        start: latestDateRf.current,
                        end: latestDateRf.current + 59000,
                    }
                    // console.log('New ticker data available. Fetch one ticker', new Date(latestDateRf.current).toLocaleString(), new Date(latestDateRf.current + 59000).toLocaleString())
                    latestDateRf.current = tickerPayload.openTime

                    dispatch(setStreamedTickerDataRedux({
                        time: tickerPayload.openTime / 1000,
                        open: parseFloat(tickerPayload.open),
                        high: parseFloat(tickerPayload.high),
                        low: parseFloat(tickerPayload.low),
                        close: parseFloat(tickerPayload.close),
                        volume: parseFloat(tickerPayload.volume),
                    }))

                    updateTickerWithOneDataPoint({ token, fetchQuery })
                        .catch((err) => {
                            console.log(err)
                        })
                    newFetchedDataCount.current = newFetchedDataCount.current + 1
                } else {
                    // console.log('Streaming data');
                }
            };

            binance_websocket.current.onerror = (e) => {
                // console.log(e);
            };
        };

        if (candleStickSeriesRef.current) {
            createWebSocket();
        }

    }, [selectedTokenPeriod, symbol, token, dispatch, previousValue, binance_websocket])

    // handles the show/hide chart button
    const handleToggleShowHideChart = (param) => {
        const { id, name } = param
        // console.log(name, id)
        dispatch(toggleShowHideChartFlag({ id: id, name: name }))
    }

    const handleOpenSettings = (param) => {
        const { id, name } = param
        dispatch(toggleShowSettingsFlag({ id: id, name: name }))
        // console.log(name, id)
    }

    // handles the delete button
    const handleDeleteQuery = (param) => {
        const { id, name, group_name } = param
        // console.log(id, name, group_name)
        dispatch(removeFromSelectedFunction({ id: id, name: name, group_name: group_name }))
    }

    const convertKeysForDisplay = (key) => {
        let final = ''
        switch (key) {
            case 'outRealUpperBand':
                final = 'U'
                break;
            case 'outRealLowerBand':
                final = 'L'
                break;
            case 'outRealMiddleBand':
                final = 'M'
                break;
            case 'outInPhase':
                final = 'Phase'
                break;
            case 'outQuadrature':
                final = 'Quad'
                break;
            case 'outSine':
                final = 'Sine'
                break;
            case 'outLeadSine':
                final = 'LeadSine'
                break;
            case 'outMACD':
                final = 'Out'
                break;
            case 'outMACDSignal':
                final = 'Signal'
                break;
            case 'outMACDHist':
                final = 'Hist'
                break;
            case 'outSlowK':
                final = 'SlowK'
                break;
            case 'outSlowD':
                final = 'SlowD'
                break;
            case 'outFastK':
                final = 'FastK'
                break;
            case 'outFastD':
                final = 'FastD'
                break;
            default:
                break;
        }
        return final
    }
    return (
        <Box className='chart-cont-dom' width="100%" height="100%" >
            <Box className='selected-function-legend'>
                <Box className='selected-function-unique ohlcv-box'></Box>
                {selectedFunctionData.map((selectedFunction, index) => {
                    const selectedFunc = selectedFunction.functions
                    const outputs = selectedFunction.outputs
                    return (
                        <Box key={index} className='selected-function-unique sel-func' justifyContent='space-between' alignItems='center'>
                            {selectedFunc.map((func, i) => {
                                const { id, name, outputAvailable, show_chart_flag, show_settings } = func
                                return (
                                    <Box key={i} display='flex' flexDirection='row' alignItems='flex-start' className='data-plus-settins-box'>
                                        <Box className='single-data-box' display='flex' flexDirection='row' alignItems='center' gap={'5px'}>
                                            <Box className='function-title' display='flex' flexDirection='row' gap='5px'>
                                                <Box>{name}</Box>
                                                {outputs.map((output, j) => (
                                                    <Box key={j} className={`${name}_${id}_${output.name}`}></Box>
                                                ))}
                                            </Box>
                                            {outputAvailable &&
                                                <IconButton
                                                    size='small'
                                                    sx={{ padding: '2px' }}
                                                    aria-label="Hide chart"
                                                    color="secondary"
                                                    onClick={handleToggleShowHideChart.bind(null, { id: id, name: name })}
                                                >
                                                    {show_chart_flag ?
                                                        <VisibilityIcon className='smaller-icon' />
                                                        :
                                                        <VisibilityOffIcon className='smaller-icon' />
                                                    }
                                                </IconButton>
                                            }
                                            <IconButton
                                                size='small'
                                                sx={{ padding: '2px' }}
                                                aria-label="modify query"
                                                color="secondary"
                                                onClick={handleOpenSettings.bind(null, { id: id, name: name })}
                                            >
                                                <SettingsIcon className='smaller-icon' />
                                            </IconButton>
                                            <IconButton
                                                size='small'
                                                sx={{ padding: '2px' }}
                                                aria-label="delete query"
                                                color="secondary"
                                                onClick={handleDeleteQuery.bind(null, { id: id, name: name, group_name: selectedFunction.group_name })}
                                            >
                                                <DeleteOutlineIcon className='smaller-icon' />
                                            </IconButton>
                                        </Box>
                                        <Box id={id} className={`settings-box ${show_settings ? 'show' : 'hide'}`}>
                                            <SettingsCard
                                                selectedFunctionNameAndId={{ slId: id, slName: name }}
                                            />
                                        </Box>
                                    </Box>
                                )
                            })}
                        </Box>
                    )
                })}
            </Box>
            <Box ref={chartboxRef}></Box>
            <Box className='tool-tip-indicators'></Box>
        </Box>
    )
}

export default MainChart