import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Box, useTheme, IconButton, Dialog, } from '@mui/material'
import { createChart } from 'lightweight-charts';
import { updateTickerWithOneDataPoint, getHistoricalTickerDataFroDb } from '../../../../../../api/adminController'
import { useSelector, useDispatch } from 'react-redux'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {
    setStreamedTickerDataRedux
    , setCryptoDataInDbRedux
    , setIsDataNewFlag
    , setBarsFromTo
    , toggleShowHideChartFlag
    , removeFromSelectedFunction
    , toggleProcessSelectedFunctionsOnMoreData
    , executeAllSelectedFunctions
} from '../../modules/CryptoModuleSlice'


import SettingsCard from './SettingsCard';

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

// Generates the talib execute queries
const generateTalibExecQuery = (selectedFunctions, end_length, selectedTickerPeriod, selectedTickerName) => {
    return selectedFunctions.flatMap(u_func =>
        u_func.functions.map(({ inputs, optInputs, name, id }) => {
            let tOITypes = {}
            const transformedOptionalInputs = optInputs.reduce((result, item) => {
                result[item.name] = item.defaultValue
                tOITypes[item.name] = item.type;
                return result;
            }, {})

            const outputkeys = u_func.outputs.reduce((result, output) => {
                result[output.name] = output.name;
                return result;
            }, {});

            const converted = inputs.reduce((result, input) => {
                if (input.flags) {
                    Object.keys(input.flags).forEach(key => {
                        result[input.flags[key]] = input.flags[key];
                    });
                } else if (input.value === '') {
                    result[input.name] = '';
                    result.errorFlag = true;
                    result.helperText = 'Please select a valid input';
                } else {
                    result[input.name] = input.value;
                }
                return result;
            }, {});

            const talibExecuteQuery = {
                name,
                startIdx: 0,
                endIdx: end_length - 1,
                ...converted,
                ...transformedOptionalInputs
            };

            const payload = {
                func_query: talibExecuteQuery,
                func_param_input_keys: converted,
                func_param_optional_input_keys: Object.fromEntries(optInputs.map(item => [item.name, item.type])),
                func_param_output_keys: outputkeys,
                db_query: {
                    asset_type: 'crypto',
                    fetch_count: end_length,
                    period: selectedTickerPeriod,
                    ticker_name: selectedTickerName
                }
            };

            // console.log(Object.keys(converted).some(key => {
            //     return converted[key] === ''
            // }))

            return { id, payload, inputEmpty: Object.keys(converted).some(key => converted[key] === '') }
        })
    )
}

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

// Generates the OHLCV tooltip HTML
const generateOHLCV_String = (param) => {
    const { open, high, low, close, vol } = param
    const getWidth = (open) => {
        const str = `${open.toFixed(2)}`
        const length = str.length
        if (length === 4) {
            return 45
        } else if (length === 5) {
            return 55
        } else if (length === 6) {
            return 65
        } else if (length === 7) {
            return 73
        } else {
            return 73
        }
    }
    const width = getWidth(open)
    return `
    <div class="value-box">
        <div style="width:${width}px; text-align:start">O : <span id="openValue">${Math.round(100 * open) / 100}</span></div>
        <div style="width:${width}px; text-align:start">H : <span id="highValue">${Math.round(100 * high) / 100}</span></div>
        <div style="width:${width}px; text-align:start">L : <span id="lowValue">${Math.round(100 * low) / 100}</span></div>
        <div style="width:${width}px; text-align:start">C : <span id="closeValue">${Math.round(100 * close) / 100}</span></div>
        <div style="display:inline-block text-align:start">V : <span id="volumeValue">${(vol || 0).toFixed(2)}</span></div>
    </div>
    `
}

// Creating the binance websocket connection
const useBinanceWebSocket = (binanceWS_URL) => {
    const websocketRef = useRef(null);
    const isInitializedRef = useRef(false);

    useEffect(() => {
        if (!isInitializedRef.current) {
            // console.log('UE 9 INSIDE: Opening Binance WebSocket connection...');
            websocketRef.current = new WebSocket(binanceWS_URL);
            isInitializedRef.current = true;
        }

        return () => {
            if (websocketRef.current && websocketRef.current.readyState === 1) {
                // console.log('UE 9 INSIDE RETURN : Closing Binance WebSocket connection...');
                websocketRef.current.close();
            }
        };
    }, [binanceWS_URL]);

    return websocketRef;
};

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

const MainChart = (props) => {
    const { latestTime, fetchValues } = props;
    const [module, symbol, selectedTokenPeriod] = window.location.href.split("/dashboard/indicators/")[1].split("/")
    const new_fetch_offset = 0
    const token = useSelector(state => state.auth.accessToken);
    const toolTipSwitchFlag = useSelector(state => state.cryptoModule.toolTipOn)
    const prediction_flag = useSelector(state => state.cryptoModule.modelData.training_parameters.multiSelectValue)
    const theme = useTheme()
    const chartBackgroundColor = theme.palette.background.default
    const textColor = theme.palette.primary.newWhite
    // const resizeObserver = useRef();

    const chart_options = {
        autoSize: true,
        layout: {
            background: {
                type: 'solid',
                color: chartBackgroundColor,
            },
            textColor: textColor
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
    }

    const dispatch = useDispatch()
    const processMore = useSelector(state => state.cryptoModule.processSelectedFunctionsOnMoreData)
    const tDataRedux = useSelector(state => state.cryptoModule.cryptoDataInDb)
    const tData = useMemo(() => checkForUniqueAndTransform(tDataRedux), [tDataRedux])
    const volData = useMemo(() => calculateVolumeData(tData), [tData])
    const pageNoBasedOnDataInRedux = Math.floor(tData.length / 500)

    const selectedTickerPeriod = useSelector(state => state.cryptoModule.selectedTickerPeriod)
    const selectedTickerName = useSelector(state => state.cryptoModule.selectedTickerName)

    const [predictionLineChart, setPredictionLineChart] = useState(null) // Initial model forecast

    const newFetchedDataCount = useRef(0)
    const latestDateRf = useRef(latestTime) // latest time in the fetched data. Data doe not inclusive of this time
    const candleStickSeriesRef = useRef(null)
    const candleStickVolumeSeriesRef = useRef(null)
    const showPredictionSwitchFlag = useSelector(state => state.cryptoModule.showPredictions)

    const selectedFunctionData_ = useSelector(state => state.cryptoModule.selectedFunctions)
    const selectedFunctionData = useMemo(() => selectedFunctionData_, [selectedFunctionData_])
    const modifiedSelectedFunctionWithDataToRender = useSelector(state => state.cryptoModule.modifiedSelectedFunctionWithDataToRender)
    const pageNo = useRef(pageNoBasedOnDataInRedux)
    const newDataRef = useRef([...tDataRedux])
    const chart = useRef(null)
    const chartboxRef = useRef();

    const lastLookAheadPredictions = useSelector(state => state.cryptoModule.modelData.lastLookAheadPredictions)
    const total_count_for_ticker_in_db = useSelector(state => state.cryptoModule.total_count_db)

    const subscribedRef = useRef(false) // Used to stop the websocket form over-writing data when tooltip present
    const uid = useSelector(state => state.auth.uid)
    /**
     * Generates the talib executeQueries for the selected function when the chart is scrolled to the rigth.
     * Makes a call to BE with new wxwc queries to process the selected functions.
     */
    useEffect(() => {
        // console.log("UE 1 : Execute all selected functions");
        if (!processMore || selectedFunctionData.length === 0) {
            return; // Exit early if there's no data to process
        }
        const fTalibExecuteQuery = generateTalibExecQuery(selectedFunctionData, tData.length, selectedTickerPeriod, selectedTickerName)
            .filter((item) => !item.inputEmpty)

        const data = {
            fTalibExecuteQuery,
            uid
        }
        dispatch(executeAllSelectedFunctions(data))
        dispatch(toggleProcessSelectedFunctionsOnMoreData(false))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [processMore])

    /**
     * Creating the main chart and adding the CandleStick and Volume series
     */
    useEffect(() => {
        // console.log("UE 2 : Main chart")
        chart.current = createChart(chartboxRef.current, chart_options);
        chart.current.timeScale().fitContent();

        // Candlestick chart
        candleStickSeriesRef.current = chart.current.addCandlestickSeries({
            upColor: 'green',
            downColor: 'red',
            wickVisible: true,
        })
        candleStickSeriesRef.current.priceScale().applyOptions({ // positioning the candleStick chart
            scaleMargins: {
                top: 0.1,
                bottom: 0.4,
            },
        });
        candleStickSeriesRef.current.setData(tData);

        // Volume histogram
        candleStickVolumeSeriesRef.current = chart.current.addHistogramSeries({
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '',
        })
        candleStickVolumeSeriesRef.current.priceScale().applyOptions({
            scaleMargins: {
                top: 0.7, // highest point of the series will be 70% away from the top
                bottom: 0,
            },
        });
        candleStickVolumeSeriesRef.current.setData(volData);

        return () => {
            // console.log('UE 2 RETURN : Main chart')
            chart.current.remove();
            candleStickSeriesRef.current = null;
            candleStickVolumeSeriesRef.current = null;
            setChartSeriesState([])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [symbol, selectedTokenPeriod])

    /**
     * sets the background color of the chart based on theme
     */
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

    /**
     * Resize chart based on parent container resizes (chartboxRef.current).
     */
    // useEffect(() => {
    //     // console.log('UE 3 : ResizeObserver')
    //     resizeObserver.current = new ResizeObserver((entries) => {
    //         const { width, height } = entries[0].contentRect;
    //         // console.log(width, height);
    //         chart.current.applyOptions({ width, height });
    //     });

    //     resizeObserver.current.observe(chartboxRef.current);

    //     return () => {
    //         // console.log('UE 3 RETURN : resizeObserver')
    //         resizeObserver.current.disconnect();
    //     }
    // }, []);

    /**
     * Adds the initial forecast after model trainign to the main chart
     * No return needed as the main chart has its cleanup function
     */
    useEffect(() => {
        // console.log('UE 4 : Prediction on main chart');
        // console.log(predictionLineChart)
        if (lastLookAheadPredictions.length === 0 || !chart.current) {
            if (predictionLineChart) {
                // console.log('UE 4 RETURN : Prediction on main chart, model deleted')
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




    const fetchPointRef = useRef(Math.floor(tDataRedux.length * EXTRA_DATA_FETCH_POINT_FRACTION) / -1)
    const uniqueBarNumbersRef = useRef([]);
    const lastBarNoRef = useRef(0)
    const SFDlengthRef = useRef(selectedFunctionData.length)
    const barsFromToRedux = useSelector(state => state.cryptoModule.barsFromTo)

    // Create a debounced version of fetching additional ticker data
    const debouncedFetchData = debounce((barNo, candleSticksInVisibleRange, SFDLength) => {
        // Your data fetching logic here
        if (barNo < fetchPointRef.current) {
            pageNo.current = pageNo.current + 1;
            // console.log('Fetching more data', barNo, pageNo.current);

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
                    dispatch(setCryptoDataInDbRedux({ dataInDb: newDataRef.current, total_count_db: total_count_for_ticker_in_db }))

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

    /**
     * Chart slide/pan handler to load additional historical data and tirgger processing
     * of selected functions if any.
     */
    useEffect(() => {
        // console.log("UE 5 : Debounce fetch")
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

        if (total_count_for_ticker_in_db > 500) { // Only subscribing if there is enough data
            chart.current.timeScale().subscribeVisibleLogicalRangeChange(VLRCHandler)
        }

        return () => {
            // console.log("UE 5 RETURN : Debounce fetch")
            chart.current.timeScale().unsubscribeVisibleTimeRangeChange(VLRCHandler)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFunctionData])

    // Debounced handler for saving the Form-To of chart position
    const debouncedFromToSave = debounce((from, to) => {
        dispatch(setBarsFromTo({ from: from, to: to }))
    }, 500)

    /**
     * Chart Form-To handler subscription to chart
    */
    useEffect(() => {
        // console.log('UE 6 : From to')
        const barsInChartHandler = (param) => {
            const { from, to } = param
            const fromRounded = Math.floor(from)
            const toRounded = Math.floor(to)
            debouncedFromToSave(fromRounded, toRounded)
        }
        const { from, to } = barsFromToRedux
        if (barsFromToRedux.from !== 0 && barsFromToRedux.to !== 0) {
            chart.current.timeScale().setVisibleLogicalRange({ from: from, to: to })
        }
        chart.current.timeScale().subscribeVisibleLogicalRangeChange(barsInChartHandler)

        return () => {
            // console.log("UE 6 RETURN : Debounce From-to")
            chart.current.timeScale().unsubscribeVisibleTimeRangeChange(barsInChartHandler)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /**
     * Fixed/Floating tooltip (ohlcv top) - crosshair subscriber
     */
    useEffect(() => {
        // console.log("UE 7 : Fixed/Floating OHLCV TT Handler")
        let ohlcvLegend = document.getElementsByClassName('ohlcv-box')[0]
        const tooltip = document.getElementsByClassName('tool-tip-indicators')[0]
        let tokenDom = document.getElementsByClassName('chart-cont-dom')[0]
        const toolTipMargin = 15;

        let tokenChartBox = tokenDom.getBoundingClientRect()
        let offsetLeft = Math.round(tokenChartBox.left);
        let offsetTop = Math.round(tokenChartBox.top)
        let cWidth = tokenDom.clientWidth;
        let cHeight = tokenDom.clientHeight;

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
                subscribedRef.current = false;
                tooltip.style.display = 'none';
            } else {
                subscribedRef.current = true;
                const dateS = new Date(param.time * 1000).toLocaleString('en-AU',
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
                const volumeData = param.seriesData.get(candleStickVolumeSeriesRef.current)?.value || 0;
                let open = 0, high = 0, low = 0, close = 0;

                open = data?.open || 0;
                high = data?.high || 0;
                low = data?.low || 0;
                close = data?.close || 0;

                switch (prediction_flag) {
                    case 'open':
                        open = data.value || open;
                        break;
                    case 'high':
                        high = data.value || high;
                        break;
                    case 'low':
                        low = data.value || low;
                        break;
                    case 'close':
                        close = data.value || close;
                        break;
                    default:
                        break;
                }

                if (toolTipSwitchFlag) {
                    ohlcvLegend.style.display = 'none'
                    tooltip.style.display = 'block';

                    tooltip.innerHTML = `
                    <div style="color: ${'rgba(255, 82, 82, 1)'}">${symbol} - ${selectedTokenPeriod}</div>
                    <div class-name='tooltip-text' style="color: ${'black'},font-size: 11px;">${dateS}</div>
                    <div class-name='tooltip-text' style="margin: 4px 0px; font-size: 11px; font-weight:400; color: ${'black'}">O : ${Math.round(100 * open) / 100}</div>
                    <div class-name='tooltip-text' style="margin: 4px 0px; font-size: 11px; font-weight:400; color: ${'black'}">H : ${Math.round(100 * high) / 100}</div>
                    <div class-name='tooltip-text' style="margin: 4px 0px; font-size: 11px; font-weight:400; color: ${'black'}">L : ${Math.round(100 * low) / 100}</div>
                    <div class-name='tooltip-text' style="margin: 4px 0px; font-size: 11px; font-weight:400; color: ${'black'}">C : ${Math.round(100 * close) / 100}</div>
                    <div class-name='tooltip-text' style="margin: 4px 0px; font-size: 11px; font-weight:400; color: ${'black'}">V : ${Math.round(volumeData).toFixed(2)}</div>
                    `;

                    // use coordinates = candleStickSeriesRef.current.priceToCoordinate(p_to_coord_val); for sticky ToolTip
                    // also set p_to_coord_val values in the switch above for TT to work
                    const coordinate = param.point.y
                    // console.log(coordinate, prediction_flag)

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
                } else {
                    ohlcvLegend.style.display = 'flex'
                    tooltip.style.display = 'none';
                    let newString = generateOHLCV_String({ open, high, low, close, vol: volumeData })
                    let dateStr = `<div style="width:110px; text-align:start">${dateS}</div>`
                    let finalStr = toolTipSwitchFlag ? `${newString}` : `${dateStr}${newString}`
                    ohlcvLegend.innerHTML = finalStr
                }
            }
        }

        chart.current.subscribeCrosshairMove(toolTipHandler);

        return () => {
            // console.log("UE 7 RETURN : Fixed/Floating OHLCV TT Handler")
            chart.current.unsubscribeCrosshairMove(toolTipHandler)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [predictionLineChart, toolTipSwitchFlag])




    const [chartSeriesState, setChartSeriesState] = useState([])
    const removePaneFlag = useRef(false)
    const paneOneChartLength = useRef(0)

    // renders the chart based on the selected functions
    const renderChart = useCallback(() => {
        if (modifiedSelectedFunctionWithDataToRender.length === 0 && chartSeriesState.length === 0) {
            // console.log('No chart to render : Callback');
            return;
        }

        // console.log('Processing Main chart');

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
                filtered.forEach((f, i) => {
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
                        const newSeries = chart.current.addLineSeries({
                            color: f.color,
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
                            color: f.color
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

    /**
     * Chart rendering logic based on selected functions and show/hide, remove/add
     * Crosshair subscription if modifiedSelectedFunctionWithDataToRender length > 0
     */
    useEffect(() => {
        // console.log("UE 8 : Render chart")
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
                // console.log(series.color)
                if (seriesValue !== undefined && series.visible) {
                    const divToInsertDataTo = document.querySelector(`.${series.name}_${series.id}_${series.key}`);
                    if (divToInsertDataTo) {
                        let displayKey = convertKeysForDisplay(series.key)
                        divToInsertDataTo.style.color = series.color
                        divToInsertDataTo.innerHTML = `${displayKey} : ${seriesValue.value.toFixed(2)}`
                    }
                }
            });
        };

        if (modifiedSelectedFunctionWithDataToRender.length > 0) {
            chart.current.subscribeCrosshairMove(crosshairMoveHandler);
        }

        return () => {
            // console.log('UE RETURN 8 : Render chart');
            chart.current.unsubscribeCrosshairMove(crosshairMoveHandler);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [renderChart]);




    // web socket for live updates
    const previousValue = useRef({ open: '', high: '', low: '', close: '', vol: '' })
    const lowerCaseSymbol = symbol.toLowerCase()
    const webSocketConnectionURI = `wss://stream.binance.com:9443/ws/${lowerCaseSymbol}@kline_${selectedTokenPeriod}`
    const binance_websocket = useBinanceWebSocket(webSocketConnectionURI)


    /**
     * Websocket connection for live updates, connection established above in binance_websocket 
     */
    useEffect(() => {
        // console.log('UE 9 : Opening Binance WebSocket connection...');
        let ohlcvLegend = document.getElementsByClassName('ohlcv-box')[0]

        const createWebSocket = () => {
            binance_websocket.current.onmessage = (e) => {
                const message = JSON.parse(e.data);
                const { k: { t: openTime, o: open, h: high, l: low, c: close, v: volume } } = message;

                // Update your candlestick chart series
                candleStickSeriesRef.current.update({
                    time: openTime / 1000,
                    open: parseFloat(open),
                    high: parseFloat(high),
                    low: parseFloat(low),
                    close: parseFloat(close),
                });

                // Update your volume chart series
                candleStickVolumeSeriesRef.current.update({
                    time: openTime / 1000,
                    value: parseFloat(volume),
                })

                if (!subscribedRef.current) { // crosshair not present on chart
                    // console.log(subscribedRef.current)
                    const currentValue = {
                        openTime: openTime,
                        open: open,
                        high: high,
                        low: low,
                        close: close,
                        vol: volume
                    }

                    const date = new Date(currentValue.openTime).toLocaleString('en-AU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: 'numeric', minute: 'numeric', hour12: true });

                    let newString = generateOHLCV_String({
                        open: parseFloat(open),
                        high: parseFloat(high),
                        low: parseFloat(low),
                        close: parseFloat(close),
                        vol: parseFloat(volume)
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
                }

                // updating 1 m data to redux and save to db, figure some other way to do this.
                // Does not need to update every minute, maybe collect and send req in interval or in return of UE/Cleanup.
                if (latestDateRf.current < openTime && selectedTokenPeriod === '1m') {
                    const fetchQuery = {
                        ticker_name: symbol,
                        period: selectedTokenPeriod,
                        start: latestDateRf.current,
                        end: latestDateRf.current + 59000,
                    }
                    // console.log('New ticker data available. Fetch one ticker', new Date(latestDateRf.current).toLocaleString(), new Date(latestDateRf.current + 59000).toLocaleString())
                    latestDateRf.current = openTime

                    dispatch(setStreamedTickerDataRedux({
                        time: openTime / 1000,
                        open: parseFloat(open),
                        high: parseFloat(high),
                        low: parseFloat(low),
                        close: parseFloat(close),
                        volume: parseFloat(volume),
                    }))

                    updateTickerWithOneDataPoint({ token, fetchQuery })
                        .catch((err) => {
                            console.log(err)
                        })
                    newFetchedDataCount.current = newFetchedDataCount.current + 1
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



    const [openSettings, setOpenSettings] = useState(false)
    const [talibProps, setTalibProps] = useState({ id: '', name: '' })

    // Handles the show/hide chart button
    const handleToggleShowHideChart = (param) => {
        const { id, name } = param
        dispatch(toggleShowHideChartFlag({ id: id, name: name }))
    }

    // Handles the opening of settings from the chart
    const handleOpenSettings = (param) => {
        const { id, name } = param
        setTalibProps({ id: id, name: name })
        setOpenSettings(true)
    }

    // Handles the delete button
    const handleDeleteQuery = (param) => {
        const { id, name, group_name } = param
        dispatch(removeFromSelectedFunction({ id: id, name: name, group_name: group_name }))
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
                                const { id, name, display_name, outputAvailable, show_chart_flag } = func
                                return (
                                    <Box key={i} display='flex' flexDirection='row' alignItems='flex-start' className='data-plus-settins-box'>
                                        <Box className='single-data-box' display='flex' flexDirection='row' alignItems='center' gap={'5px'}>
                                            <Box className='function-title' display='flex' flexDirection='row' gap='5px'>
                                                <Box>{display_name}</Box>
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
                                    </Box>
                                )
                            })}
                        </Box>
                    )
                })}
                <Dialog open={openSettings}
                    onClose={
                        (e, reason) => {
                            if (reason === 'backdropClick') {
                                console.log('backdrop clicked')
                                setOpenSettings(false)
                            }
                        }
                    }
                >
                    <SettingsCard
                        selectedFunctionNameAndId={{ slId: talibProps.id, slName: talibProps.name }}
                        fetchValues={fetchValues}
                        setOpenSettings={setOpenSettings}
                    />
                </Dialog>
            </Box>
            <Box ref={chartboxRef} width="100%" height="100%"></Box>
            <Box className='tool-tip-indicators'></Box>
        </Box>
    )
}

export default MainChart