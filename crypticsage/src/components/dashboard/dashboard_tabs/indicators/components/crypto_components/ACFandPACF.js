import { LollipopSeries } from "../../../../../../../node_modules/lightweight-charts/chart_plugin/lollipop-series/lollipop-series";
import { HLCAreaSeries } from "../../../../../../../node_modules/lightweight-charts/chart_plugin/hlc-area-series/hlc-area-series";

import { ErrorBoundary } from "react-error-boundary";
import React, { useState, useRef, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { createChart } from 'lightweight-charts';
import {
    Box
    , Button
    , IconButton
    , Typography
    , Autocomplete
    , TextField
    , useTheme
    , Skeleton
} from '@mui/material'
import DeleteForeverIcon from '@mui/icons-material/DeleteForever'

import { getPartialAutoCorrelation } from '../../../../../../api/adminController'



const logError = (error, info) => {
    // Do something with the error, e.g. log to an external API
    console.log('error', error)
};

const ACFandPACF = ({ trainingStartedFlag }) => {
    const token = useSelector(state => state.auth.accessToken);
    const [asset_type, ticker_name, period] = window.location.href.split("/dashboard/indicators/")[1].split("/")
    const theme = useTheme()
    const chartBackgroundColor = theme.palette.background.default
    const textColor = theme.palette.primary.newWhite
    const chart_options = {
        autoSize: true,
        leftPriceScale: {
            visible: true,
        },
        rightPriceScale: {
            visible: false,
        },
        layout: {
            background: {
                type: "solid",
                color: chartBackgroundColor,
            },
            textColor: textColor,
        },
        grid: {
            vertLines: {
                visible: false,
                color: textColor,
                style: 4,
            },
            horzLines: {
                visible: false,
                color: textColor,
                style: 4,
            },
        },
        timeScale: {
            visible: false,
        },
        crosshair: {
            vertLine: {
                width: 4,
                color: textColor,
                style: 0,
            },
            horzLine: {
                visible: false,
                labelVisible: false,
            },
        },
        handleScroll: {
            mouseWheel: false,
            pressedMouseMove: true,
            horzTouchDrag: true,
            vertTouchDrag: false,
        },
        handleScale: {
            axisPressedMouseMove: false,
            mouseWheel: true,
            pinch: true,
        },
    }

    const [acf_pacf_data, setAcf_pacf_data] = useState([])
    const [acf_pacf_error, setAcf_pacf_error] = useState('')
    const chartContainerRef = useRef()
    const chart = useRef(null)

    const lollipopSeries = new LollipopSeries();
    const areaSeries = new HLCAreaSeries();

    const lollipopref = useRef();
    const areaRef = useRef();
    const lineRef = useRef();

    const transformation_order = useSelector(state => state.cryptoModule.modelData.training_parameters.transformation_order)

    const options = transformation_order.map(d => d.name)
    const c_level_options = ["90 %", "95 %", "99 %"]
    // console.log(options)

    const [selectedOption, setSelectedOption] = useState({ seriesName: options[0], lag: 2, c_level: "95 %" })
    const [loading, setLoading] = useState(false)
    // console.log(selectedOption)

    // Handle calculation of acf and pacf
    const handleACFandPACF = () => {
        console.log('ACF and PACF clicked...', asset_type, ticker_name, period)
        if (selectedOption.lag < 1 || selectedOption.seriesName === '') {
            setAcf_pacf_error('Please select a series and a lag greater than 0.')
            return
        } else {
            setAcf_pacf_error('')
            if (acf_pacf_data.length > 0) {
                setAcf_pacf_data([])
            }
        }
        setLoading(true)
        const payload = {
            asset_type,
            ticker_name,
            period,
            maxLag: selectedOption.lag,
            seriesName: selectedOption.seriesName.toLowerCase(),
            confidenceLevel: parseFloat(selectedOption.c_level.split(" ")[0]) / 100
        }
        console.log(payload)
        getPartialAutoCorrelation({ token, payload })
            .then(response => {
                setAcf_pacf_data(response.data.pacf_final)
                setLoading(false)
            })
            .catch(error => {
                console.log(error)
                setLoading(false)
                setAcf_pacf_error('Something went wrong, please try again later.')
            })
    }

    // Renders the chart based on the data received
    useEffect(() => {
        if (acf_pacf_data.length > 0) {
            // console.log('pacf data received...')
            if (chart.current === null) {
                // console.log('creating chart...')
                chart.current = createChart(chartContainerRef.current, chart_options);
                chart.current.timeScale().fitContent()

                const pacfData = acf_pacf_data.map((d) => ({
                    time: d.lag + 1,
                    value: d.pacf,
                }));

                const acfData = acf_pacf_data.map((d) => ({
                    time: d.lag + 1,
                    value: d.acf,
                }));

                const areaData = acf_pacf_data.map((d) => ({
                    time: d.lag + 1,
                    high: d.upper_bound,
                    low: d.lower_bound,
                    close: 0,
                }));

                lollipopref.current = chart.current.addCustomSeries(lollipopSeries, {
                    priceLineVisible: false,
                    crosshairMarkerVisible: false,
                    lastValueVisible: false,
                    ticksVisible: false,
                    priceFormat: {
                        precision: 2,
                    },
                    color: "red",
                });
                lollipopref.current.priceScale().applyOptions({ minimumWidth: 1 })
                lollipopref.current.setData(pacfData);

                lineRef.current = chart.current.addLineSeries({
                    priceLineVisible: false,
                    crosshairMarkerVisible: false,
                    lastValueVisible: false,
                    lineWidth: 1,
                    color: "red",
                });
                lineRef.current.setData(acfData);
                lineRef.current.createPriceLine({ price: 0, lineStyle: 0 });

                areaRef.current = chart.current.addCustomSeries(areaSeries, {
                    priceLineVisible: false,
                    crosshairMarkerVisible: false,
                    lastValueVisible: false,
                    ticksVisible: false,
                    areaTopColor: "rgba(242, 54, 69, 0.2)",
                    closeLineColor: "rgba(242, 54, 69, 0.2)",
                    highLineColor: "#F23645",
                    highLineWidth: 0.5,
                    lowLineWidth: 0.5,
                    closeLineWidth: 0.5,
                });
                areaRef.current.setData(areaData);

                // chart.current.createPriceLine({ price: 0 })

                // chart.current.timeScale().setVisibleLogicalRange({ from: -1, to: pacfData.length });
            }
        } else {
            if (chart.current !== null) {
                // console.log('destroying chart...')
                chart.current.remove()
                chart.current = null
                lollipopref.current = null
                areaRef.current = null
                lineRef.current = null
                document.getElementsByClassName("tool-tip-pacf")[0].style.display = "none";
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [acf_pacf_data])

    // sets the background color of the chart based on theme
    useEffect(() => {
        // console.log('UE : Predctions Chart background')
        if (acf_pacf_data.length === 0 || !chart.current) {
            return
        } else {
            chart.current.applyOptions({
                layout: {
                    background: {
                        type: 'solid',
                        color: chartBackgroundColor,
                    },
                    textColor: textColor,

                },
                grid: {
                    vertLines: {
                        color: textColor
                    },
                    horzLines: {
                        color: textColor
                    },
                },
                crosshair: {
                    vertLine: {
                        color: '#83838394',
                    },
                }
            })
        }
    }, [chartBackgroundColor, acf_pacf_data, textColor])

    // Tooltip handler
    useEffect(() => {
        const tooltip = document.getElementsByClassName("tool-tip-pacf")[0];
        const toolTipHandler = (param) => {
            if (
                param.point === undefined ||
                !param.time ||
                param.point.x < 0 ||
                param.point.x > chartContainerRef.current.clientWidth ||
                param.point.y < 0 ||
                param.point.y > chartContainerRef.current.clientHeight
            ) {
                // tooltip.style.display = "none";
            } else {
                const lolli_data = param.seriesData.get(lollipopref.current);
                const area_data = param.seriesData.get(areaRef.current);
                const line_data = param.seriesData.get(lineRef.current);
                const tt_data = {
                    acf: line_data.value,
                    pacf: lolli_data.value,
                    lower_bound: area_data.low,
                    upper_bound: area_data.high,
                };

                // console.log(line_data);
                tooltip.style.display = "flex";

                tooltip.innerHTML = `
                    <div style="width:55px">
                        LAG: ${line_data.time - 1}
                    </div>
                    <div style="width:80px">
                        PACF: ${tt_data.pacf.toFixed(4)}
                    </div>
                    <div style="width:80px">
                        ACF : ${tt_data.acf.toFixed(4)}
                    </div>
                    <div style="width:80px">
                        CI: &#177 ${tt_data.upper_bound.toFixed(4)}
                    </div>
                    `
            }
        };

        chart.current && chart.current.subscribeCrosshairMove(toolTipHandler);

        return () => {
            chart.current && chart.current.unsubscribeCrosshairMove(toolTipHandler);
        };
    });
    // console.log(selectedOption)
    return (
        <ErrorBoundary onError={logError} fallback={<div>Something went wrong</div>}>
            <Box width="100%" height="100%">
                <Box display='flex' flexDirection='column' gap={'4px'} pb={1}>
                    <Box display='flex' flexDirection='row' gap={'4px'} alignItems={'center'} justifyContent={'space-between'}>
                        <Typography variant='h5' textAlign='start'>ACF/PACF</Typography>
                        <Box display={'flex'} gap={'4px'} alignItems={'center'}>
                            <Button
                                sx={{
                                    height: '26px',
                                }}
                                variant='outlined'
                                size='small'
                                color='secondary'
                                disabled={trainingStartedFlag}
                                onClick={(e) => handleACFandPACF()}
                            >
                                GO
                            </Button>
                            <IconButton disabled={trainingStartedFlag} onClick={(e) => setAcf_pacf_data([])}>
                                <DeleteForeverIcon className='small-icon' />
                            </IconButton>
                        </Box>
                    </Box>
                    <Box display='flex' gap='8px' alignItems='end' justifyContent='space-between'>
                        <Box width='110px'>
                            <Autocomplete
                                size='small'
                                disableClearable
                                disablePortal={false}
                                id="select-acf-pacf-series"
                                options={options}
                                value={selectedOption.seriesName} // Set the selected value
                                onChange={(event, newValue) => setSelectedOption((prev) => ({ ...prev, seriesName: newValue }))} // Handle value change
                                sx={{ width: 'auto' }}
                                renderInput={(params) => <TextField size='small' {...params}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': {
                                                borderColor: `${theme.palette.primary.main} !important`,
                                            }
                                        },
                                        '& .MuiInputBase-input': {
                                            height: '10px'
                                        },
                                    }}
                                    label="Select a series"
                                    color="secondary"
                                />}
                            />
                        </Box>

                        <Box width='110px'>
                            <Autocomplete
                                size='small'
                                disableClearable
                                disablePortal={false}
                                id="select-confidence-level"
                                options={c_level_options}
                                value={selectedOption.c_level} // Set the selected value
                                onChange={(event, newValue) => setSelectedOption((prev) => ({ ...prev, c_level: newValue }))} // Handle value change
                                sx={{ width: 'auto' }}
                                renderInput={(params) => <TextField size='small' {...params}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            '& fieldset': {
                                                borderColor: `${theme.palette.primary.main} !important`,
                                            }
                                        },
                                        '& .MuiInputBase-input': {
                                            height: '10px'
                                        },
                                    }}
                                    label="C-Value"
                                    color="secondary"
                                />}
                            />
                        </Box>

                        <Box width='70px'>
                            <TextField
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        '& fieldset': {
                                            borderColor: `${theme.palette.primary.main} !important`,
                                        }
                                    },
                                    '& .MuiInputBase-input': {
                                        height: '9px'
                                    },
                                }}
                                id="standard-basic"
                                label="Lag"
                                variant="standard"
                                value={selectedOption.lag}
                                onChange={(event) => {
                                    setSelectedOption((prev) => ({ ...prev, lag: parseInt(event.target.value) || 0 }))
                                }}
                            />
                        </Box>
                    </Box>
                    <Box display='flex' gap='8px' alignItems='center'>
                        {acf_pacf_error !== '' && <Typography variant='custom' textAlign='start' sx={{ color: 'red' }}>{acf_pacf_error}</Typography>}
                    </Box>
                </Box>

                <Box sx={{ height: '250px', width: '100%', position: 'relative' }}>
                    {loading && <Skeleton variant="rectangular" height={250} />}
                    <Box ref={chartContainerRef} height='100%' width='100%'></Box>
                    <Box className='tool-tip-pacf'></Box>
                </Box>

            </Box>
        </ErrorBoundary>
    )
}

export default ACFandPACF