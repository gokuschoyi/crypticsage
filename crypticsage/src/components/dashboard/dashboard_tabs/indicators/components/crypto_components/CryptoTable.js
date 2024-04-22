import { ErrorBoundary } from "react-error-boundary";
import React, { useRef, useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux';
import { setCryptoDataRedux, setTickerInfo, setCryptoPreferencesRedux } from '../../IndicatorsSlice'
import {  CloseIcon } from '../../../../global/Icons';
import { getLatestCryptoData, fetchSingleTickerInfo } from '../../../../../../api/crypto'
import {
    Box
    , useTheme
    , Skeleton
    , IconButton
    , Divider
    , Paper
    , useMediaQuery
} from '@mui/material'

import {
    CurrencySelectorAndRefresh
    , StatsLegend
    , CustomTable
    , BasicBox
    , SupplyBox
    , LayerTwoSolutionsBox
    , PrivacySolutionsBox
    , TradingSignalsBox
    , LeadersBox
    , HashAlgorithmBox
    , AssetIndustriesBox
    , AlgorithmTypesBox
    , AssetSecurityMetrics
} from './CryptoTableInfoComponents'

const logError = (error, info) => {
    // Do something with the error, e.g. log to an external API
    console.log('error', error)
};

const tableHeight = 700;

const RenderTickerInfo = ({ info }) => {
    const keys = Object.keys(info)
    const component_mapping = {
        basic: BasicBox,
        supply: SupplyBox,
        asset_security_metrics: AssetSecurityMetrics,
        leaders: LeadersBox,
        hash_algorithm: HashAlgorithmBox,
        asset_industries: AssetIndustriesBox,
        trading_signals: TradingSignalsBox,
        layer_two_solutions: LayerTwoSolutionsBox,
        privacy_solutions: PrivacySolutionsBox,
        algorithm_types: AlgorithmTypesBox
    }
    const not_empty = keys.map(key => {
        if (Array.isArray(info[key]) && info[key].length >= 1) {
            return key
        } else if (typeof info[key] === 'object' && Object.keys(info[key]).length > 2) {
            return key
        } else if (key === 'trading_signals' && info[key].data.length >= 1) {
            return key
        } else return undefined
    }).filter(key => key !== undefined)

    const empty = keys.filter(key => !not_empty.includes(key))
    return (
        <Box className='dynamic-render' display={'flex'} flexDirection={'column'} gap={1}>
            {
                not_empty.map(key => {
                    const ComponentToRender = component_mapping[key]
                    return (
                        <React.Fragment key={key}>
                            <ComponentToRender data={info[key]} />
                            <Divider />
                        </React.Fragment>
                    )
                })
            }
            {
                empty.map(key => {
                    const ComponentToRender = component_mapping[key]
                    return (
                        <React.Fragment key={key}>
                            <ComponentToRender data={info[key]} />
                            <Divider />
                        </React.Fragment>
                    )
                })
            }
        </Box>
    )
}

const CryptoTable = () => {
    const dispatch = useDispatch();
    const theme = useTheme()
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    const token = useSelector(state => state.auth.accessToken);
    const cryptoPreferences = useSelector(state => state.indicators.cryptoPreferences);

    const cryptoDataInRedux = useSelector(state => state.indicators.cryptoData); // ticker meta data
    const [cryptoData, setCryptoData] = useState([]);

    const [latestUpdatedDate, setLatestUpdatedDate] = useState('')

    const [currency, setCurrency] = useState(cryptoPreferences.currency)
    const [availableCurrencyList, setAvailableCurrencyList] = useState([])

    // get latest crypto data, sets states for available currencyList and latest updated date to latestUpdatedDate
    const loadedRef = useRef(false);
    useEffect(() => {
        if (!loadedRef.current && cryptoDataInRedux.length === 0) {
            // console.log('UE : ticker info fetch')
            loadedRef.current = true
            let data = {
                token: token,
            }
            getLatestCryptoData(data)
                .then((res) => {
                    setCryptoData(res.data.cryptoData)
                    const cList = res.data.cryptoData[0].prices
                    setAvailableCurrencyList(Object.keys(cList))
                    setLatestUpdatedDate(cList.USD.last_updated)

                    dispatch(setCryptoDataRedux({ cryptoData: res.data.cryptoData }))
                })
        } else if (cryptoDataInRedux.length > 0) {
            setCryptoData(cryptoDataInRedux)
            const cList = cryptoDataInRedux[0].prices
            setAvailableCurrencyList(Object.keys(cList))
            setLatestUpdatedDate(cList.USD.last_updated)
        } else {
            return
        }
    }, [cryptoDataInRedux, dispatch, token])

    // handles the user selection of currency and sets to currency
    const handleCurrencyChange = (event) => {
        if (event.target.value !== '') {
            setCurrency(event.target.value);
            dispatch(setCryptoPreferencesRedux({ cryptoPreferences: { ...cryptoPreferences, currency: event.target.value } }))
        }
    };

    // refresh crypto data on click
    const refreshCryptoData = () => {
        console.log('refresh crypto data')
        const refreshIcon = document.getElementById('refresh-icon');
        refreshIcon.classList.add('rotate-icon');
        let data = {
            token: token,
        }
        getLatestCryptoData(data)
            .then((res) => {
                dispatch(setCryptoDataRedux({ cryptoData: res.data.cryptoData }))
                const cList = res.data.cryptoData[0].prices
                setLatestUpdatedDate(cList.USD.last_updated)
                refreshIcon.classList.remove('rotate-icon');
            })
    }

    const [tickerToLoadInfo, setTickerToLoadInfo] = useState({}) // ticker info to load
    const [selectedTickerToLoad, setSelectedTickerToLoad] = useState('') // selected ticker
    const [loadingInfo, setLoadingInfo] = useState(false) // loading info
    const lg = useMediaQuery(theme.breakpoints.up('lg'));

    const handleTickerInfoLoad = (dataId) => {
        const table = document.getElementsByClassName('table-main-meta')[0]
        const div = document.getElementsByClassName('crypto-details-table')[0]
        const lastUpdated = document.getElementsByClassName('ticker-currency-last-updated')[0]
        let symbol = ''
        if (dataId === 'USDT') {
            symbol = dataId
        } else {
            symbol = dataId.split('USDT')[0]
        }

        if (table === undefined || div === undefined) {
            setSelectedTickerToLoad(symbol)
        } else {
            setSelectedTickerToLoad(symbol)
            if (lg) {
                div.classList.toggle('crypto-details-table')
                div.classList.toggle('collapse-to-left')
                lastUpdated && lastUpdated.classList.toggle('ticker-currency-last-updated')
                lastUpdated && lastUpdated.classList.toggle('ticker-currency-last-updated-collapsed')
            } else {
                table.classList.toggle('table-main-meta')
                table.classList.toggle('half-collapsed')
            }
        }
        const tickerInfo = cryptoData.find(ticker => ticker.symbol === symbol)

        const { info } = tickerInfo
        if (info) {
            console.log('In redux')
            setTickerToLoadInfo(tickerInfo.info)
        } else {
            console.log('Not in redux, fetching')
            setLoadingInfo(true)
            setTickerToLoadInfo({})
            fetchSingleTickerInfo({ token, symbol })
                .then((res) => {
                    setTickerToLoadInfo(res.data.data)
                    dispatch(setTickerInfo({ symbol, data: res.data.data }))
                    setLoadingInfo(false)
                })
                .catch((error) => {
                    console.log(error)
                    setLoadingInfo(false)
                })
        }
    }

    const handleCloseTickerInfo = () => {
        if (lg) {
            const div = document.getElementsByClassName('collapse-to-left')[0]
            const lastUpdated = document.getElementsByClassName('ticker-currency-last-updated-collapsed')[0]
            div.classList.toggle('crypto-details-table')
            div.classList.toggle('collapse-to-left')
            lastUpdated.classList.toggle('ticker-currency-last-updated-collapsed')
            lastUpdated.classList.toggle('ticker-currency-last-updated')
            setTickerToLoadInfo({})
            setSelectedTickerToLoad('')
        } else {
            const table = document.getElementsByClassName('half-collapsed')[0]
            table.classList.toggle('table-main-meta')
            table.classList.toggle('half-collapsed')
            setTickerToLoadInfo({})
            setSelectedTickerToLoad('')
        }
    }

    return (
        <Box className='crypto-container'>
            <Box mr={sm ? 2 : 4} ml={sm ? 2 : 4}>
                {cryptoData.length === 0 ?
                    (
                        <Box className='skeleton-box' sx={{ height: `${tableHeight}px`, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <Skeleton animation="wave" variant="rounded" sx={{ position: 'absolute', bgcolor: '#3f3f40', width: '95%', height: '95%' }} />
                        </Box>
                    )
                    :
                    (
                        <Box className='crypto-table-info-main-container'>
                            <Box className='crypto-details-table' display={'flex'} flexDirection={'column'}>
                                <Box className='ticker-currency-last-updated'>
                                    <CurrencySelectorAndRefresh
                                        currency={currency}
                                        handleCurrencyChange={handleCurrencyChange}
                                        availableCurrencyList={availableCurrencyList}
                                        refreshCryptoData={refreshCryptoData}
                                    />
                                    <StatsLegend latestUpdatedDate={latestUpdatedDate} />
                                </Box>
                                <CustomTable
                                    selectedTickerToLoad={selectedTickerToLoad}
                                    currency={currency}
                                    cryptoPreferences={cryptoPreferences}
                                    cryptoData={cryptoData}
                                    setCryptoData={setCryptoData}
                                    handleTickerInfoLoad={handleTickerInfoLoad}
                                />
                            </Box>

                            <Box className='main-info-box' sx={{ width: selectedTickerToLoad !== '' ? '100%' : '' }}>
                                {Object.keys(tickerToLoadInfo).length > 0 ?
                                    <Paper elevation={8} sx={{ margin: !lg ? '16px 0px 0px 0px' : '0px 0px 0px 16px' }}>
                                        <Box display={'flex'} flexDirection={'column'} p={1}>
                                            <Box display={'flex'} justifyContent={'end'}>
                                                <IconButton onClick={handleCloseTickerInfo}>
                                                    <CloseIcon className='small-icon' />
                                                </IconButton>
                                            </Box>
                                            <ErrorBoundary onError={logError} fallback={<div>Something went wrong</div>}>
                                                <RenderTickerInfo info={tickerToLoadInfo} />
                                            </ErrorBoundary>
                                        </Box>
                                    </Paper>
                                    :
                                    <Box>
                                        {loadingInfo &&
                                            <Box sx={{ margin: !lg ? '16px 0px 0px 0px' : '0px 0px 0px 16px', height: `${tableHeight}px`, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                                <Skeleton animation="wave" variant="rounded" sx={{ position: 'absolute', bgcolor: '#3f3f40', width: '100%', height: '100%' }} />
                                            </Box>
                                        }
                                    </Box>
                                }
                            </Box>
                        </Box>
                    )
                }
            </Box>
        </Box>
    )
}

export default CryptoTable