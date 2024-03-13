import { ErrorBoundary } from "react-error-boundary";
import React, { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom';
import { Box, Skeleton, Grid } from '@mui/material'
import { useDispatch, useSelector } from 'react-redux'
import MainChartOptions from './MainChartOptions'
import MainChartCopy from './MainChartCopy'

import { setSelectedTickerPeriod, resetStreamedTickerDataRedux, setCryptoDataInDbRedux } from '../../modules/CryptoModuleSlice'

import { getHistoricalTickerDataFroDb, fetchLatestTickerForUser } from '../../../../../../api/adminController'

import { checkIfNewTickerFetchIsRequired, checkForUniqueAndTransform, } from "../../modules/CryptoModuleUtils";


const logError = (error, info) => {
    // Do something with the error, e.g. log to an external API
    console.log('error', error)
};



const MainChart = ({
    predictedVlauesRedux
    , lookAhead
    , predictionLookAhead
    , setPredictionLookAhead
}) => {
    const dispatch = useDispatch()
    const params = useParams();
    const { cryptotoken } = params;
    const module = window.location.href.split("/dashboard/indicators/")[1].split("/")[0]

    const token = useSelector(state => state.auth.accessToken);
    const tokenPeriod = useSelector(state => state.cryptoModule.selectedTickerPeriod)
    const toolTipSwitchFlag = useSelector(state => state.cryptoModule.toolTipOn)
    const ohlcData = useSelector(state => state.cryptoModule.cryptoDataInDb)

    const [selectedTokenPeriod, setSelectedTokenPeriod] = useState(tokenPeriod);

    const handlePeriodChange = (newValue) => {
        dispatch(setSelectedTickerPeriod(newValue))
        setChartData([])
        setSelectedTokenPeriod(newValue);
        setFetchValues({
            asset_type: module,
            ticker_name: cryptotoken,
            period: newValue,
            page_no: 1,
            items_per_page: 500
        })
        tickerDataRef.current = false
    }

    let defaultFetchValues = {
        asset_type: module,
        ticker_name: cryptotoken,
        period: selectedTokenPeriod,
        page_no: 1,
        items_per_page: 500
    }

    // default fetch data
    const [chartData, setChartData] = useState([]) // data to be passed to chart
    const [fetchValues, setFetchValues] = useState(defaultFetchValues)
    const [actualFetchLength, setActualFetchLength] = useState(0)
    const [newTickerLength, setNewTickerLength] = useState(0)

    // console.log(fetchValues)

    // to fetch ticker data
    const tickerDataRef = useRef(false)
    useEffect(() => {

        if (!tickerDataRef.current && ohlcData.length === 0) {
            // console.log('UE : Fetching ticker data from DB')
            tickerDataRef.current = true
            let converted = []
            // dispatch(setCryptoDataInDbRedux([]))
            dispatch(resetStreamedTickerDataRedux())
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
                    const dataInDb = res.data.fetchedResults.ticker_data
                    let tC_inDb = res.data.fetchedResults.total_count_db
                    console.log(tC_inDb)
                    setActualFetchLength(dataInDb.length)
                    const latestOpenTime = dataInDb[dataInDb.length - 1].openTime
                    let [fetchLength, end] = checkIfNewTickerFetchIsRequired({ openTime: latestOpenTime, selectedTokenPeriod })
                    setNewTickerLength(fetchLength)
                    if (fetchLength > 0) {
                        // console.log('UE : Fetching new tickers from binance')


                        const updateQueries = {
                            ticker_name: cryptotoken,
                            period: selectedTokenPeriod,
                            start: latestOpenTime,
                            end: end,
                        }

                        fetchLatestTickerForUser({
                            token,
                            updateQueries
                        })
                            .then((res) => {
                                const newData = res.data.newTickers
                                dataInDb.push(...newData)
                                converted = checkForUniqueAndTransform(dataInDb)
                                console.log('Total fetched data length : ', converted.length, 'New tickers to fetch', fetchLength, 'Fetched : ', newData.length)
                                setChartData(converted)
                                dispatch(setCryptoDataInDbRedux({ dataInDb: dataInDb, total_count_db: tC_inDb }))
                            })
                            .catch(err => {
                                console.log(err)
                            })
                    } else {
                        converted = checkForUniqueAndTransform(dataInDb)
                        console.log('Up to date : Fetched data length : ', converted.length)
                        setChartData(converted)
                        dispatch(setCryptoDataInDbRedux({ dataInDb: dataInDb, total_count_db: tC_inDb }))
                    }
                })
                .catch(err => {
                    console.log(err)
                })
        } else {
            // console.log('UE : Fetching ticker data from redux')
            const dataInDb = ohlcData
            const converted = checkForUniqueAndTransform(dataInDb)
            setChartData(converted)
        }
    }, [ohlcData, fetchValues, token, cryptotoken, selectedTokenPeriod, dispatch])


    return (
        <Grid container  pt={2} pb={2}>
            <Grid item xs={12} sm={12} md={12} lg={9} xl={9}>
                <Box className='options-main-chart-container'>
                    <ErrorBoundary onError={logError} fallback={<div>Something went wrong</div>}>
                        <MainChartOptions
                            handlePeriodChange={handlePeriodChange}
                            toolTipSwitchFlag={toolTipSwitchFlag}
                            predictedVlauesRedux={predictedVlauesRedux}
                            lookAhead={lookAhead}
                            predictionLookAhead={predictionLookAhead}
                            setPredictionLookAhead={setPredictionLookAhead}
                            actualFetchLength={actualFetchLength}
                            ohlcDataLength={ohlcData.length}
                        />
                    </ErrorBoundary>

                    <ErrorBoundary onError={logError} fallback={<div>Something went wrong</div>}>
                        <Box className='chart-container' display='flex' flexDirection='column' width='100%' pl={2} pr={2} pt={2}>
                            {chartData.length === 0 ?
                                (
                                    <Box className='token-chart-box' alignItems='center' justifyContent='center' display='flex'>
                                        <Skeleton variant="rounded" animation={false} sx={{ bgcolor: '#3f3f40' }} width="95%" height="95%" />
                                    </Box>
                                )
                                :
                                (
                                    <MainChartCopy
                                        latestTime={chartData[chartData.length - 1].time * 1000 + 60000}
                                        new_fetch_offset={newTickerLength}
                                        symbol={cryptotoken}
                                        selectedTokenPeriod={selectedTokenPeriod}
                                        module={module}
                                        fetchValues={fetchValues}
                                    />
                                )
                            }
                        </Box>
                    </ErrorBoundary>
                </Box>
            </Grid>

            <Grid item xs={12} sm={12} md={12} lg={3} xl={3}>
                {/* PlaceHolder */}
            </Grid>
        </Grid>
    )
}

export default MainChart