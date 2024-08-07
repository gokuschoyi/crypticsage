import React, { useEffect, useState, useRef } from 'react'
import Header from '../../../global/Header'
import { useParams } from 'react-router-dom';
import { Box, Typography, Grid, useTheme, Accordion, AccordionSummary, AccordionDetails, Tooltip, Tab, Tabs, Paper } from '@mui/material'
import { getStockSummaryDetails } from '../../../../../api/crypto'
import { setStockSummary } from './StockModuleSlice'
import { useSelector, useDispatch } from 'react-redux'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import gsap from "gsap";

import { CustomBarChart } from '../components';
import { convert } from '../../../../../utils/Utils'

const isObjectEmpty = (obj) => {
    return Object.keys(obj).length === 0;
}

const generateRiskColor = (risk) => {
    let color = ''
    if (risk <= 3) {
        color = 'green'
    } else if (risk > 3 && risk <= 6) {
        color = 'orange'
    } else {
        color = 'red'
    }
    return color
}

const RiskPaper = (props) => {
    const { risk_type, risk_value } = props
    return (
        <Paper elevation={4} sx={{ height: '35px', padding: '8px' }} className='company-risk-box-item'>
            <Typography variant='body1' className='company-risk-box-item-text'>{risk_type} : <span style={{ color: generateRiskColor(risk_value) }}>{risk_value}</span></Typography>
            <Tooltip title={generateRiskColor(risk_value) === 'green' ? 'Low Risk' : generateRiskColor(risk_value) === 'orange' ? 'Medium risk' : 'High risk'} placement='top' arrow>
                <Box height='8px' width='8px'
                    style={{
                        cursor: 'pointer',
                        borderRadius: '8px',
                        backgroundColor: generateRiskColor(risk_value)
                    }}
                >
                </Box>
            </Tooltip>
        </Paper>
    )
}

const DataTable = (props) => {
    const { data } = props
    const headers = Object.keys(data);
    const values = Object.values(data);

    return (
        <table className="table-main">
            <thead className='table-group'>
                <tr className='table-row'>
                    {headers.map((header, index) => (
                        <th className={`table-head ${index !== headers.length - 1 ? 'border-right' : ''}`} key={index}>{header}</th>
                    ))}
                </tr>
            </thead>
            <tbody className='table-body'>
                <tr className='table-row'>
                    {values.map((value, index) => (
                        <td className='table-data' key={index}>{value === null ? 'N/A' : value}</td>
                    ))}
                </tr>
            </tbody>
        </table>
    );
}

const renameKeys = (obj) => {
    const result = {};
    for (const key in obj) {
        if (key === 'sharesShortPreviousMonthDate') {
            result['SS Prev Month'] = obj[key];
        } else if (key === 'numberOfAnalystOpinions') {
            result['No Of Analyst Opinions'] = obj[key];
        } else if (key === 'netIncomeApplicableToCommonShares') {
            result['NI Applicable To Common Shares'] = obj[key];
        } else if (obj.hasOwnProperty(key)) {
            let newKey = key.replace(/([a-z])([A-Z])|(\d)(\D)|(\D)(\d)/g, (match, p1, p2, p3, p4, p5, p6) => {
                if (p1 && p2) {
                    return `${p1} ${p2}`;
                } else if (p3 && p4) {
                    return `${p3} ${p4.toUpperCase()}`;
                } else if (p5 && p6) {
                    return `${p5} ${p6}`;
                } else {
                    return match;
                }
            });
            newKey = newKey.charAt(0).toUpperCase() + newKey.slice(1); // Capitalize the first letter
            result[newKey] = obj[key];
        }
    }
    return result;
}

const CustomTable = ({ obj }) => {
    const tableRows = Object.entries(obj).map(([header, value]) => (
        <tr className='table-row' key={header}>
            <th className='table-data' style={{ textAlign: 'left' }}>{header}</th>
            <td className='table-data' style={{ textAlign: 'left' }}>{value}</td>
        </tr>
    ));

    return (
        <Box className='table-container'>
            <table className="table-main" style={{ height: 'fit-content' }}>
                <thead className='table-group'>
                    <tr className='table-row'>
                        <th className='table-head' style={{ textAlign: 'left' }}>Category</th>
                        <th className='table-head' style={{ textAlign: 'left' }}>Value</th>
                    </tr>
                </thead>
                <tbody className='table-body'>
                    {tableRows}
                </tbody>
            </table>
        </Box>
    );
}

const RedDot = () => {
    return (
        <Box height='8px' width='8px'
            style={{
                cursor: 'pointer',
                borderRadius: '8px',
                backgroundColor: 'red'
            }
            }
        />
    )
}

const AssetProfile = ({ summary }) => {
    const { assetProfile } = summary
    const theme = useTheme()
    const {
        address1
        , website
        , industry
        , sector
        , longBusinessSummary
        , fullTimeEmployees
        , companyOfficers
        , auditRisk
        , boardRisk
        , compensationRisk
        , shareHolderRightsRisk
        , overallRisk
        , governanceEpochDate
        , compensationAsOfEpochDate
    } = assetProfile
    const govDate = new Date(governanceEpochDate).toDateString() === 'Invalid Date' ? 'N/A' : new Date(governanceEpochDate).toDateString()
    const compDate = new Date(compensationAsOfEpochDate).toDateString() === 'Invalid Date' ? 'N/A' : new Date(compensationAsOfEpochDate).toDateString()
    return (
        <Box className='asset-profile-box stock-section'>
            <Box className='asset-profile-box-header stock-header' pb={1} width='100%' alignItems='center' display='flex' flexDirection='row' gap='10px'>
                <RedDot />
                <Typography variant='h3' id="wordToUnderline">Asset Profile<span id="underline"></span></Typography>
            </Box>

            <Box className='asset-profile-box-body'>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={12} md={7} lg={8} xl={8}>
                        <Box className='asset-profile-summary'>
                            <Typography variant='body1' textAlign='justify' className='asset-profile-summary-text'>{longBusinessSummary}</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={12} md={5} lg={4} xl={4}>
                        <Box className='address-info' display='flex' flexDirection='column' alignItems='flex-start'>
                            <Typography variant='body1' className='address-info-text'>INDUSTRY : {industry}</Typography>
                            <Typography variant='body1' className='address-info-text'>SECTOR : {sector}</Typography>
                            <Typography variant='body1' className='address-info-text'>ADDRESS : {address1}</Typography>
                            <Typography variant='body1' className='address-info-text'>WEBSITE : <a className='stock-link' style={{ color: `${theme.palette.error.dark}` }} href={website}>{website}</a></Typography>
                            <Typography variant='body1' className='address-info-text'>EMPLOYEES : {fullTimeEmployees}</Typography>
                            <Typography variant='body1' className='address-info-text'>GOVERNANCE EPOCH DATE : {govDate}</Typography>
                            <Typography variant='body1' className='address-info-text'>COMPENSATION EPOCH DATE : {compDate}</Typography>
                        </Box>
                    </Grid>
                </Grid>

                <Box className='company-officers-box' pt={2}>
                    <Accordion>
                        <AccordionSummary
                            expandIcon={<ExpandMoreIcon />}
                            aria-controls="panel1a-content"
                            id="panel1a-header"
                        >
                            <Typography variant='h5' className='company-risk-box-header' textAlign='start'>Company Officers</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Grid container spacing={2}>
                                {companyOfficers.map((officer, index) => {
                                    const { age, exercisedValue, fiscalYear, name, title, totalPay, yearBorn } = officer
                                    return (
                                        <Grid key={index} item xs={12} sm={6} md={4} lg={4} xl={3}>
                                            <Paper className='company-officers-box-item' elevation={8} style={{ padding: '5px', display: 'flex', flexDirection: 'column' }}>
                                                <Typography variant='custom' className='company-officers-box-item-text'>Name : {name}</Typography>
                                                <Typography variant='custom' className='company-officers-box-item-text'>Title : {title}</Typography>
                                                <Typography variant='custom' className='company-officers-box-item-text'>Age : {age === undefined ? 'N/A' : age}</Typography>
                                                <Typography variant='custom' className='company-officers-box-item-text'>Year Born : {yearBorn === undefined ? 'N/A' : yearBorn}</Typography>
                                                <Typography variant='custom' className='company-officers-box-item-text'>Fiscal Year : {fiscalYear}</Typography>
                                                <Typography variant='custom' className='company-officers-box-item-text'>Total Pay : {totalPay}</Typography>
                                                <Typography variant='custom' className='company-officers-box-item-text'>Exercised Value : {exercisedValue === 0 ? 'N/A' : exercisedValue}</Typography>
                                            </Paper>
                                        </Grid>
                                    )
                                })}
                            </Grid>
                        </AccordionDetails>
                    </Accordion>
                </Box>

                {(auditRisk || boardRisk || compensationRisk || shareHolderRightsRisk || overallRisk) &&
                    <Box className='company-risk-box' pt={2}>
                        <Typography variant='h5' className='company-risk-box-header' textAlign='start'>Company Risk</Typography>
                        <Grid container spacing={2} columns={15} pt={1}>
                            <Grid item xs={15} sm={15} md={7} lg={3} xl={3}>
                                {auditRisk && <RiskPaper risk_type={'Autid Risk'} risk_value={auditRisk} />}
                            </Grid>
                            <Grid item xs={15} sm={15} md={7} lg={3} xl={3}>
                                {boardRisk && <RiskPaper risk_type={'Board Risk'} risk_value={boardRisk} />}
                            </Grid>
                            <Grid item xs={15} sm={15} md={7} lg={3} xl={3}>
                                {compensationRisk && <RiskPaper risk_type={'Compensation Risk'} risk_value={compensationRisk} />}
                            </Grid>
                            <Grid item xs={15} sm={15} md={7} lg={3} xl={3}>
                                {shareHolderRightsRisk && <RiskPaper risk_type={'Share Holders Risk'} risk_value={shareHolderRightsRisk} />}
                            </Grid>
                            <Grid item xs={15} sm={15} md={7} lg={3} xl={3}>
                                {overallRisk && <RiskPaper risk_type={'Overall Risk'} risk_value={overallRisk} />}
                            </Grid>
                        </Grid>
                    </Box>
                }
            </Box>
        </Box >
    )
}

const RecommendationTrend = ({ summary }) => {
    const { recommendationTrend } = summary
    const { trend } = recommendationTrend
    // console.log('Recommendation Trend', recommendationTrend)

    return (
        <Box className='recommendation-trend-box stock-section'>
            <Box className='recommendation-trend-box-header stock-header' pb={1} width='100%' alignItems='center' display='flex' flexDirection='row' gap='10px'>
                <RedDot />
                <Typography variant='h3' id="wordToUnderline">Recommendation Trend<span id="underline"></span></Typography>
            </Box>

            <Box className='recommendation-trend-box-body'>
                <Accordion>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="recommedation-trend"
                        id="recommedation-trend"
                    >
                        <Typography variant='h5' className='recommedation-trend-box-header' textAlign='start'>Recommendation Trend</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={4}>
                            {trend.map((trendItem, index) => {
                                const { period, buy, hold, sell, strongBuy, strongSell } = trendItem
                                return (
                                    <Grid key={index} item xs={6} sm={6} md={3} lg={3} xl={3}>
                                        <Paper className='recommendation-trend-box-item' elevation={8} square={false} sx={{ padding: '8px', display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant='custom' textAlign='start' className='recommendation-trend-box-item-text'>Period : {period}</Typography>
                                            <Typography variant='custom' textAlign='start' className='recommendation-trend-box-item-text'>Buy : {buy}</Typography>
                                            <Typography variant='custom' textAlign='start' className='recommendation-trend-box-item-text'>Hold : {hold}</Typography>
                                            <Typography variant='custom' textAlign='start' className='recommendation-trend-box-item-text'>Sell : {sell}</Typography>
                                            <Typography variant='custom' textAlign='start' className='recommendation-trend-box-item-text'>Strong Buy : {strongBuy}</Typography>
                                            <Typography variant='custom' textAlign='start' className='recommendation-trend-box-item-text'>Strong Sell : {strongSell}</Typography>
                                        </Paper>
                                    </Grid>
                                )
                            })}
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            </Box>
        </Box>
    )
}

const IndexTrend = ({ summary }) => {
    const { indexTrend } = summary
    const { symbol, peRatio, pegRatio, estimates } = indexTrend
    // console.log('Index Trend', indexTrend)

    return (
        <Box className='index-trend-box stock-section'>
            <Box className='index-trend-box-header stock-header' pb={1} width='100%' alignItems='center' display='flex' flexDirection='row' gap='10px'>
                <RedDot />
                <Typography variant='h3' id="wordToUnderline">Index Trend<span id="underline"></span></Typography>
            </Box>

            <Box className='index-trend-box-body'>

                <Box className='accor-index-trend' display='flex' flexDirection='row' gap='10px' alignItems='center'>
                    <Box display='flex' flexDirection='row' gap='10px'>
                        <Paper elevation={4} style={{ padding: '4px' }}>
                            <Typography variant='custom' className='index-trend-box-item-text'>Symbol : {symbol}</Typography>
                        </Paper>
                        <Paper elevation={4} style={{ padding: '4px' }}>
                            <Typography variant='custom' className='index-trend-box-item-text'>PE Ratio : {peRatio}</Typography>
                        </Paper>
                        <Paper elevation={4} style={{ padding: '4px' }}>
                            <Typography variant='custom' className='index-trend-box-item-text'>PEG Ratio : {pegRatio}</Typography>
                        </Paper>
                    </Box>
                </Box>


                <Box className='estimates-box'>
                    <table className='esti-table' style={{ tableLayout: 'fixed', width: '100%' }}>
                        <thead>
                            <tr>
                                <th className='esti-table-head'>Period</th>
                                <th className='esti-table-head'>Growth</th>
                            </tr>
                        </thead>
                        <tbody>
                            {estimates.map((item, index) => {
                                const { period, growth } = item
                                return (
                                    <tr key={index} className='indi-estimate-box'>
                                        <td className='esti-table-td'>{period}</td>
                                        <td className='esti-table-td'>{growth === undefined ? 'N/A' : growth}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </Box>

            </Box>
        </Box >
    )
}

const CombinedPriceSummary = ({ summary }) => {
    const { combinedPriceSummary } = summary
    const { stockMarketData, marketExchangeInfo } = combinedPriceSummary
    const { basicMarketData, regularMarketData, financialData, volumeData, bidAskData, marketCapAndRange, movingAverages, dividendInformation } = stockMarketData
    const { currencyAndMarketSource, marketExchange, stockInformation, priceData, marketInformation, stockTradeability } = marketExchangeInfo
    const tradable = stockTradeability.isTradable ? 'Yes' : 'No'

    return (
        <Box className='combined-price-summary-box stock-section'>
            <Box className='combined-price-summary-header stock-header' pb={1} width='100%' alignItems='center' display='flex' flexDirection='row' gap='10px'>
                <RedDot />
                <Typography variant='h3' id="wordToUnderline">Stock & Market Info<span id="underline"></span></Typography>
            </Box>

            <Box className='stock-market-data'>
                <Accordion>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                    >
                        <Typography variant='h5' className='company-risk-box-header' textAlign='start'>Stock Info</Typography>
                    </AccordionSummary>
                    <AccordionDetails>

                        <Box className='basic-market-data' width='100%' >
                            <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>Basic Market Data</Typography>
                            <Box className='table-container'>
                                <DataTable
                                    data={{
                                        "Price Hint": basicMarketData.priceHint,
                                        "Prev Close": basicMarketData.previousClose,
                                        "Open": basicMarketData.open,
                                        "Day Low": basicMarketData.dayLow,
                                        "Day High": basicMarketData.dayHigh
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box className='financial-data' width='100%' pt={2}>
                            <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>Financial Data</Typography>
                            <Box className='table-container'>
                                <DataTable
                                    data={{
                                        "Dividend Yield": financialData.dividendYield,
                                        "Payout Ratio": financialData.payoutRatio,
                                        "Beta": financialData.beta,
                                        "Trailing PE": financialData.trailingPE,
                                        "Forward PE": financialData.forwardPE
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box className='volume-data' width='100%' pt={2}>
                            <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>Volume Data</Typography>
                            <Box className='table-container'>
                                <DataTable
                                    data={{
                                        "Volume": convert(volumeData.volume),
                                        "Reg Mkt Volume": convert(volumeData.regularMarketVolume),
                                        "Avg Volume": convert(volumeData.averageVolume),
                                        "Avg Vol 10 days": convert(volumeData.averageVolume10days),
                                        "Avg daily Vol 10 days": convert(volumeData.averageDailyVolume10Day),
                                        "Avg daily Vol 3M": convert(volumeData.averageDailyVolume3Month)
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box className='regular-market-data' width='100%' pt={2}>
                            <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>Regular Market Data</Typography>
                            <Box className='table-container'>
                                <DataTable
                                    data={{
                                        "Reg Mkt Prv Close": regularMarketData.regularMarketPreviousClose,
                                        "Reg Mkt Open": regularMarketData.regularMarketOpen,
                                        "Reg Mkt Day Low": regularMarketData.regularMarketDayLow,
                                        "Reg Mkt Day High": regularMarketData.regularMarketDayHigh
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box className='bid-data' width='100%' pt={2}>
                            <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>Bid Data</Typography>

                            <Box className='table-container'>
                                <DataTable
                                    data={{
                                        "Bid": bidAskData.bid,
                                        "Ask": bidAskData.ask,
                                        "Bid Size": bidAskData.bidSize,
                                        "Ask Size": bidAskData.askSize
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box className='market-cap-data' width='100%' pt={2}>
                            <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>Market Cap Data</Typography>
                            <Box className='table-container'>
                                <DataTable
                                    data={{
                                        "Market Cap": convert(marketCapAndRange.marketCap),
                                        "52 Week Low": marketCapAndRange.fiftyTwoWeekLow,
                                        "52 Week High": marketCapAndRange.fiftyTwoWeekHigh,
                                        "Price To Sale Trailing 12M": marketCapAndRange.priceToSalesTrailing12Months
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box className='moving-average-data' width='100%' pt={2}>
                            <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>Moving Average Data</Typography>
                            <Box className='table-container'>
                                <DataTable
                                    data={{
                                        "50 Day AVG": movingAverages.fiftyDayAverage,
                                        "200 Day AVG": movingAverages.twoHundredDayAverage
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box className='dividend-info' width='100%' pt={2}>
                            <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>Dividend Information</Typography>
                            <Box className='table-container'>
                                <DataTable
                                    data={{
                                        "Trailing Ann Div Rate": dividendInformation.trailingAnnualDividendRate,
                                        "Trailing Ann Div Yield": dividendInformation.trailingAnnualDividendYield
                                    }}
                                />
                            </Box>
                        </Box>
                    </AccordionDetails>
                </Accordion>
            </Box>

            <Box className='market-exchange-info' pt={2}>
                <Accordion>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                    >
                        <Typography variant='h5' className='company-risk-box-header' textAlign='start'>Exchange Info</Typography>
                    </AccordionSummary>
                    <AccordionDetails>

                        <Box className='currency-market-source-data' width='100%' pt={2}>
                            <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>Currency & Market Source</Typography>
                            <Box className='table-container'>
                                <DataTable
                                    data={{
                                        "Currency": currencyAndMarketSource.currency,
                                        "From Currency": currencyAndMarketSource.fromCurrency === null ? 'N/A' : currencyAndMarketSource.fromCurrency,
                                        "To Currency": currencyAndMarketSource.toCurrency === null ? 'N/A' : currencyAndMarketSource.toCurrency,
                                        "Currency Symbol": currencyAndMarketSource.currencySymbol
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box className='market-information' width='100%' pt={2}>
                            <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>Market Information</Typography>
                            <Box className='table-container'>
                                <DataTable
                                    data={{
                                        "Market Cap Link": marketInformation.coinMarketCapLink === null ? 'N/A' : marketInformation.coinMarketCapLink,
                                        "Algorithm": marketInformation.algorithm === null ? 'N/A' : marketInformation.algorithm,
                                        "Pre Market Source": marketInformation.preMarketSource === null ? 'N/A' : marketInformation.preMarketSource,
                                        "Regular Mkt Source": marketInformation.regularMarketSource
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box className='stock-information' width='100%' pt={2}>
                            <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>Stock Information</Typography>
                            <Box className='table-container'>
                                <DataTable
                                    data={{
                                        "Quote Type": stockInformation.quoteType,
                                        "Symbol": stockInformation.symbol,
                                        "Short Name": stockInformation.shortName,
                                        "Quote Source Name": stockInformation.quoteSourceName
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box className='market-exchange' width='100%' pt={2}>
                            <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>Market Exchange</Typography>
                            <Box className='table-container'>
                                <DataTable
                                    data={{
                                        "Exchange": marketExchange.exchange,
                                        "Exchange Name": marketExchange.exchangeName,
                                        "Exchange Delay": marketExchange.exchangeDataDelayedBy
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box className='price-data' width='100%' pt={2}>
                            <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>Price Data</Typography>
                            <Box className='table-container'>
                                <DataTable
                                    data={{
                                        "PM Change %": priceData.postMarketChangePercent,
                                        "PM Change": priceData.postMarketChange,
                                        "PM Time": priceData.postMarketTime,
                                        "PM Price": priceData.postMarketPrice,
                                        "PM Source": priceData.postMarketSource,
                                        "RM Change %": priceData.regularMarketChangePercent,
                                        "RM Change": priceData.regularMarketChange,
                                        "RM Time": priceData.regularMarketTime,
                                        "RM Price": priceData.regularMarketPrice
                                    }}
                                />
                            </Box>
                        </Box>

                        <Box className='stock-tradeability' width='100%' pt={2} display='flex' flexDirection='row' gap='5px'>
                            <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>Stock Tradeability</Typography><Typography variant='h5'> : {tradable}</Typography>
                        </Box>

                    </AccordionDetails>
                </Accordion>
            </Box>
        </Box>
    )
}

const CalendarEvents = ({ summary }) => {
    const { calendarEvents } = summary
    const { earnings } = calendarEvents

    return (
        <Box className='calendar-events-box stock-section'>
            <Box className='calendar-events-header stock-header' pb={1} width='100%' alignItems='center' display='flex' flexDirection='row' gap='10px'>
                <RedDot />
                <Typography variant='h3' id="wordToUnderline">Calendar Events<span id="underline"></span></Typography>
            </Box>

            <Box className='calendar-events-box-body'>
                <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>Earnings Date</Typography>
                <Box className='earnings-date' display='flex' flexDirection='column' alignItems='start'>
                    {earnings.earningsDate.map((date, index) => {
                        const newDate = new Date(date).toLocaleString();
                        return (
                            <Typography key={index} variant='h6'>{newDate}</Typography>
                        )
                    })}
                </Box>

                <Box className='table-container'>
                    <DataTable
                        data={{
                            "Earnings Avg": earnings.earningsAverage,
                            "Earnings High": earnings.earningsHigh,
                            "Earnings Low": earnings.earningsLow,
                            "Revenue Avg": convert(earnings.revenueAverage),
                            "Revenue High": convert(earnings.revenueHigh),
                            "Revenue Low": convert(earnings.revenueLow),
                        }}
                    />
                </Box>
            </Box>
        </Box>
    )
}

const CombinedEarnings = ({ summary }) => {
    const { combinedEarnings } = summary
    const { financialCurrency: currency, trend, history, earningsChart, financialsChart } = combinedEarnings
    // console.log(currency)

    const addedEarningsChart = [...earningsChart.quarterly,
    {
        date: `${earningsChart.currentQuarterEstimateDate}${earningsChart.currentQuarterEstimateYear}`,
        estimate: earningsChart.currentQuarterEstimate,
        actual: 'N/A'
    }]

    function a11yProps(index, period) {
        return {
            id: `trend-tab-${index}`,
            'aria-controls': `trend-tabpanel-${index}`,
            'data-id': `${period}`
        };
    }

    const formatData = (dat) => {
        let tempRE = {}
        for (const key in dat) {
            if (dat.hasOwnProperty(key)) {
                const val = dat[key];
                tempRE[key] = convert(val)
            }
        }
        return tempRE
    }

    const [tabValue, setTabValue] = useState(0)
    const [selectedPeriod, setSelectedPeriod] = useState(trend[0].period)
    const [selectedPeriodData, setSelectedPeriodData] = useState(
        {
            ...trend[0],
            revenueEstimate: formatData(trend[0].revenueEstimate)
        }
    )

    const handleTabChange = (event, newValue) => {
        const period = event.target.getAttribute('data-id')
        setTabValue(newValue);
        // console.log(newValue, period)
        setSelectedPeriod(period)
        let selectedData = trend.filter(item => item.period === period)
        setSelectedPeriodData({
            ...selectedData[0],
            revenueEstimate: formatData(selectedData[0].revenueEstimate)
        })
    }

    // console.log(selectedPeriod, selectedPeriodData)

    return (
        <Box className='combined-earnings-box stock-section'>

            <Box className='combined-earnings-header stock-header' pb={1} width='100%' alignItems='center' display='flex' flexDirection='row' gap='10px'>
                <RedDot />
                <Typography variant='h3' id="wordToUnderline">Earnings Report<span id="underline"></span></Typography>
            </Box>

            <Box className='combined-earnings-box-body'>
                <Accordion>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="combined-earnings"
                        id="combined-earnings"
                    >
                        <Typography variant='h5' className='combined-earnings-box-header' textAlign='start'>Earnings</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={12} md={12} lg={8} xl={8} className='first-grid-earnings'>
                                <Box className='earnings-data-box'>
                                    <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>Earnings Date</Typography>
                                    <Box className='earnings-date' display='flex' flexDirection='column' alignItems='start'>
                                        {earningsChart.earningsDate.map((date, index) => {
                                            const newDate = new Date(date).toLocaleString();
                                            return (
                                                <Typography key={index} variant='h6'>{newDate}</Typography>
                                            )
                                        })}
                                    </Box>
                                    <Box className='earnings-act-est-box'>
                                        <table className='esti-table' style={{ tableLayout: 'fixed', width: '100%' }}>
                                            <thead>
                                                <tr>
                                                    <th className='esti-table-head'>Date</th>
                                                    <th className='esti-table-head'>Actual</th>
                                                    <th className='esti-table-head'>Estimate</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {addedEarningsChart.map((item, index) => (
                                                    <tr key={index} className='indi-estimate-box'>
                                                        <td className='esti-table-td'>{item.date}</td>
                                                        <td className='esti-table-td'>{item.actual}</td>
                                                        <td className='esti-table-td'>{item.estimate}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </Box>
                                </Box>

                                <Box className='history-box' pt={1}>
                                    <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>History</Typography>
                                    <Box className='table-container'>
                                        <table className="table-main">
                                            <thead className='table-group'>
                                                <tr className='table-row'>
                                                    <th className='table-head'>Date</th>
                                                    <th className='table-head'>Period</th>
                                                    <th className='table-head'>Surprise Percent</th>
                                                    <th className='table-head'>EPS Difference</th>
                                                    <th className='table-head'>EPS Estimate</th>
                                                    <th className='table-head'>EPS Actual</th>
                                                </tr>
                                            </thead>
                                            <tbody className='table-body'>
                                                {history.map((item, index) => (
                                                    <tr key={index} className='table-row'>
                                                        <td className='table-data'>{new Date(item.quarter).toLocaleDateString()}</td>
                                                        <td className='table-data'>{item.period}</td>
                                                        <td className='table-data'>{item.surprisePercent}</td>
                                                        <td className='table-data'>{item.epsDifference}</td>
                                                        <td className='table-data'>{item.epsEstimate}</td>
                                                        <td className='table-data'>{item.epsActual}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </Box>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={12} md={12} lg={4} xl={4}>
                                <Box className='financal-chart-data-box'>
                                    <CustomBarChart data={financialsChart} currency={currency} />
                                </Box>
                            </Grid>
                        </Grid>

                        <Box className='trend-box' pt={1}>
                            <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>Trend</Typography>
                            <Box className='trend-period-selector' sx={{ borderBottom: 1, borderColor: 'divider', height: '45px', width: 'fit-content' }} mt={1}>
                                <Tabs value={tabValue} onChange={handleTabChange} aria-label="trend tabs" textColor="secondary" indicatorColor="primary">
                                    {trend.map((trend, index) => {
                                        const period = trend.period
                                        return (
                                            <Tab sx={{ minWidth: '40px', padding: '5px 10px' }} key={index} className='tab' label={period} {...a11yProps(index, period)} />
                                        )
                                    })}
                                </Tabs>
                            </Box>

                            <Box className='basid-details' pt={1}>
                                <Typography variant='h5' textAlign='start'>End Date : {new Date(selectedPeriodData.endDate).toLocaleDateString()}</Typography>
                                <Typography variant='h5' textAlign='start'>Growth : {selectedPeriodData.growth}</Typography>
                            </Box>

                            <Box className='selceted-trend-box' pt={1}>
                                <Box className='earning-estimate-data' width='100%' pt={1}>
                                    <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>Earnings Estimate</Typography>
                                    <Box className='table-container'>
                                        <DataTable
                                            data={renameKeys(selectedPeriodData.earningsEstimate)}
                                        />
                                    </Box>
                                </Box>

                                <Box className='revenue-estimate-data' width='100%' pt={1}>
                                    <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>Revenue Estimate</Typography>
                                    <Box className='table-container'>
                                        <DataTable
                                            data={renameKeys(selectedPeriodData.revenueEstimate)}
                                        />
                                    </Box>
                                </Box>

                                <Box className='eps-trend-data' width='100%' pt={1}>
                                    <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>EPS Trend</Typography>
                                    <Box className='table-container'>
                                        <DataTable
                                            data={renameKeys(selectedPeriodData.epsTrend)}
                                        />
                                    </Box>
                                </Box>

                                <Box className='eps-revision-data' width='100%' pt={1}>
                                    <Typography variant='h5' textAlign='start' sx={{ textDecoration: 'underline' }}>EPS Revision</Typography>
                                    <Box className='table-container'>
                                        <DataTable
                                            data={renameKeys(selectedPeriodData.epsRevisions)}
                                        />
                                    </Box>
                                </Box>

                            </Box>
                        </Box>
                    </AccordionDetails>
                </Accordion>
            </Box>
        </Box >
    )
}

const CombinedReports = ({ report_title, data_key, report_key, summary }) => {
    const data = summary[`${data_key}`]
    const { annual, quarterly } = data

    const excludedKeys = ["End Date", "Max Age"]; // Define keys to exclude
    const [tabValue, setTabValue] = useState(0)
    const [selectedData, setSelectedData] = useState(annual)

    function a11yProps(index) {
        return {
            id: `cashflow-tab-${index}`,
            'aria-controls': `cashflow-tabpanel-${index}`,
        };
    }

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        setSelectedData(newValue === 0 ? annual : quarterly)
    }

    const tableData = selectedData[report_key].map((item) => renameKeys(item))
    const columnNames = [...new Set(tableData.map((data) => data['End Date']))];

    return (
        <Box className='combined-report-box stock-section'>
            <Box className='combined-report-header stock-header' pb={1} width='100%' alignItems='center' display='flex' flexDirection='row' gap='10px'>
                <RedDot />
                <Typography variant='h3' id="wordToUnderline">{report_title}<span id="underline"></span></Typography>
            </Box>

            <Box className='combined-data-box'>
                <Accordion>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="combined-data"
                        id="combined-data"
                    >
                        <Typography variant='h5' className='combined-data-box-header' textAlign='start'>{report_title}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box className='cahsflow-period-selector' sx={{ borderBottom: 1, borderColor: 'divider', height: '45px', width: 'fit-content' }} mt={1}>
                            <Tabs value={tabValue} onChange={handleTabChange} aria-label="cashflow tabs example" textColor="secondary" indicatorColor="primary">
                                <Tab className='tab' label="Annual" {...a11yProps(0)} />
                                <Tab className='tab' label="Quarter" {...a11yProps(1)} />
                            </Tabs>
                        </Box>

                        <Box className='table-container'>
                            <table className="table-main">
                                <thead className='table-group'>
                                    <tr className='table-row'>
                                        <th className='new-table-head'>*</th>
                                        {columnNames.map((endDate, index) => (
                                            <th className='table-head' key={index}>{new Date(endDate).toLocaleDateString()}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className='table-body'>
                                    {Object.keys(renameKeys(selectedData[report_key][0]))
                                        .filter((key) => !excludedKeys.includes(key)) // Filter out excluded keys
                                        .map((key, index) => (
                                            <tr className='table-row' key={index}>
                                                <td className='table-data' style={{ textAlign: 'left' }}>{key}</td>
                                                {columnNames.map((endDate, colIndex) => (
                                                    <td className='table-data' key={colIndex}>
                                                        {convert(tableData.find((data) => data['End Date'] === endDate)[key])}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </Box>
                    </AccordionDetails>
                </Accordion>
            </Box>

        </Box>
    )
}

const DefaultKeyStats = ({ summary }) => {
    const { defaultKeyStatistics } = summary
    const { price_information, profitability, shares_information, financial_metrics, valuation_and_performance } = defaultKeyStatistics
    let financialMetricCopy = {
        ...financial_metrics,
        lastFiscalYearEnd: new Date(financial_metrics.lastFiscalYearEnd).toDateString(),
        nextFiscalYearEnd: new Date(financial_metrics.nextFiscalYearEnd).toDateString(),
        mostRecentQuarter: new Date(financial_metrics.mostRecentQuarter).toDateString(),
        lastSplitDate: new Date(financial_metrics.lastSplitDate * 1000).toDateString()
    }

    let sharesInfoCopy = {
        ...shares_information,
        sharesShortPriorMonth: new Date(shares_information.sharesShortPriorMonth).toDateString(),
        sharesShortPreviousMonthDate: new Date(shares_information.sharesShortPreviousMonthDate).toDateString(),
        dateShortInterest: new Date(shares_information.dateShortInterest).toDateString()
    }

    return (
        <Box className='default-stats-box stock-section'>
            <Box className='default-stats-header stock-header' pb={1} width='100%' alignItems='center' display='flex' flexDirection='row' gap='10px'>
                <RedDot />
                <Typography variant='h3' id="wordToUnderline">Key Statistics<span id="underline"></span></Typography>
            </Box>

            <Box className='key-stats-box'>
                <Accordion>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="key-stats"
                        id="key-stats"
                    >
                        <Typography variant='h5' className='key-stats-box-header' textAlign='start'>Key Statistics</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={12} md={6} lg={4} xl={4}>
                                <Box display='flex' flexDirection='column' alignItems='start'>
                                    <Typography variant='h5'>Valuation & Performance</Typography>
                                    <CustomTable obj={renameKeys(valuation_and_performance)} />
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={12} md={6} lg={4} xl={4}>
                                <Box display='flex' flexDirection='column' alignItems='start'>
                                    <Typography variant='h5'>Price Information</Typography>
                                    <CustomTable obj={renameKeys(price_information)} />
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={12} md={6} lg={4} xl={4}>
                                <Box display='flex' flexDirection='column' alignItems='start'>
                                    <Typography variant='h5'>Profitability</Typography>
                                    <CustomTable obj={renameKeys(profitability)} />
                                </Box>
                            </Grid>
                        </Grid>

                        <Box pt={2}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={12} md={12} lg={6} xl={6}>
                                    <Box display='flex' flexDirection='column' alignItems='start'>
                                        <Typography variant='h5'>Financial Metrics</Typography>
                                        <CustomTable obj={renameKeys(financialMetricCopy)} />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={12} md={12} lg={6} xl={6}>
                                    <Box display='flex' flexDirection='column' alignItems='start'>
                                        <Typography variant='h5'>Shares Information</Typography>
                                        <CustomTable obj={renameKeys(sharesInfoCopy)} />
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </AccordionDetails>
                </Accordion>
            </Box>
        </Box>
    )
}

const FinancialData = ({ summary }) => {
    const { financialData } = summary
    const { targetPricesAndRecommendations, cashAndDebt, financialRatios, revenueAndProfits, profitMargins, currency } = financialData
    return (
        <Box className='financial-data-box stock-section'>
            <Box className='financial-data-header stock-header' pb={1} width='100%' alignItems='center' display='flex' flexDirection='row' gap='10px'>
                <RedDot />
                <Typography variant='h3' id="wordToUnderline">Financial Data<span id="underline"></span></Typography>
            </Box>

            <Box className='financial-data-table-box'>
                <Accordion>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="financial-data"
                        id="financial-data"
                    >
                        <Typography variant='h5' className='financial-data-box-header' textAlign='start'>Financial Data</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={12} md={6} lg={4} xl={4}>
                                <Box display='flex' flexDirection='column' alignItems='start'>
                                    <Typography variant='h5'>Financial Ratios</Typography>
                                    <CustomTable obj={renameKeys(financialRatios)} />
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={12} md={6} lg={4} xl={4}>
                                <Box display='flex' flexDirection='column' alignItems='start'>
                                    <Typography variant='h5'>Profit Margins</Typography>
                                    <CustomTable obj={renameKeys(profitMargins)} />
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={12} md={6} lg={4} xl={4}>
                                <Box display='flex' flexDirection='column' alignItems='start'>
                                    <Typography variant='h5'>Cash & Debt</Typography>
                                    <CustomTable obj={renameKeys(cashAndDebt)} />
                                </Box>
                            </Grid>
                        </Grid>
                        <Box pt={2}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={12} md={6} lg={4} xl={4}>
                                    <Box display='flex' flexDirection='column' alignItems='start'>
                                        <Typography variant='h5'>Traget Prices & Recommendations</Typography>
                                        <CustomTable obj={renameKeys(targetPricesAndRecommendations)} />
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={12} md={6} lg={4} xl={4}>
                                    <Box display='flex' flexDirection='column' alignItems='start'>
                                        <Typography variant='h5'>Revenue And Profits</Typography>
                                        <CustomTable obj={renameKeys(revenueAndProfits)} />
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>
                    </AccordionDetails>
                </Accordion>
            </Box>
        </Box>
    )
}

const CustomOwnership = ({ ownership_type, data_key, summary }) => {
    const { ownershipList } = summary[data_key]

    return (
        <Box className='mainownership-box stock-section'>
            <Box className='ownership-header stock-header' pb={1} width='100%' alignItems='center' display='flex' flexDirection='row' gap='10px'>
                <RedDot />
                <Typography variant='h3' id="wordToUnderline">{ownership_type}<span id="underline"></span></Typography>
            </Box>

            <Box className='ownership-box'>
                <Accordion>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="ownership"
                        id="ownership"
                    >
                        <Typography variant='h5' className='ownership-box-header' textAlign='start'>{ownership_type}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={2}>
                            {ownershipList.map((owner, index) => {
                                const { organization, pctChange, pctHeld, position, reportDate, value } = owner
                                return (
                                    <Grid item xs={12} sm={12} md={6} lg={4} xl={4} key={index}>
                                        <Paper elevation={4} square={false} sx={{ padding: '8px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                            <Typography variant='custom' fontWeight={500} textAlign='start'>{index + 1} : {organization}</Typography>
                                            <Typography variant='custom' textAlign='start'>ReportDate : {new Date(reportDate).toLocaleDateString()}</Typography>
                                            <Typography variant='custom' textAlign='start'>Position : {position}</Typography>
                                            <Typography variant='custom' textAlign='start'>Value : {value}</Typography>
                                            <Typography variant='custom' textAlign='start'>% Change : {pctChange}</Typography>
                                            <Typography variant='custom' textAlign='start'>% Held : {pctHeld}</Typography>
                                        </Paper>
                                    </Grid>
                                )
                            })}
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            </Box>
        </Box>
    )
}

const InsideHolders = ({ summary }) => {
    const { insiderHolders } = summary
    const { holders } = insiderHolders

    return (
        <Box className='inside-holder-box stock-section'>
            <Box className='inside-holder-header stock-header' pb={1} width='100%' alignItems='center' display='flex' flexDirection='row' gap='10px'>
                <RedDot />
                <Typography variant='h3' id="wordToUnderline">Inside Holders<span id="underline"></span></Typography>
            </Box>

            <Box className='inside-holde-box'>
                <Accordion>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="inside-holder"
                        id="inside-holder"
                    >
                        <Typography variant='h5' className='inside-holde-box-header' textAlign='start'>Company Officers</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={2}>
                            {holders.map((holder, index) => {
                                const { name, relation, transactionDescription, latestTransDate, positionDirect, positionDirectDate, positionIndirect, positionIndirectDate } = holder
                                return (
                                    <Grid item xs={12} sm={12} md={6} lg={4} xl={4} key={index} >
                                        <Paper elevation={4} square={false} sx={{ padding: '8px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                            <Typography variant='custom' fontWeight={500} textAlign='start'>{index + 1} : {name}</Typography>
                                            <Typography variant='custom' textAlign='start'>Relation : {relation}</Typography>
                                            <Typography variant='custom' textAlign='start'>Position Direct : {positionDirect ? positionDirect : 'N/A'}{positionDirectDate ? `, ${new Date(positionDirectDate).toLocaleDateString()}` : ''}</Typography>
                                            <Typography variant='custom' textAlign='start'>Position Indirect : {positionIndirect ? positionIndirect : 'N/A'}{positionIndirectDate ? `, ${new Date(positionIndirectDate).toLocaleDateString()}` : ''}</Typography>
                                            <Typography variant='custom' textAlign='start'>Transaction Description : {transactionDescription}</Typography>
                                            <Typography variant='custom' textAlign='start'>Transaction Date : {new Date(latestTransDate).toLocaleDateString()}</Typography>
                                        </Paper>
                                    </Grid>
                                )
                            })}
                        </Grid>
                    </AccordionDetails>
                </Accordion>
            </Box>
        </Box>
    )
}

const UpgradeDowngradeHistory = ({ summary }) => {
    const { upgradeDowngradeHistory } = summary
    const { history } = upgradeDowngradeHistory

    return (
        <Box className='upgrade-downgrade-history-box stock-section'>
            <Box className='upgrade-downgrade-history-header stock-header' pb={1} width='100%' alignItems='center' display='flex' flexDirection='row' gap='10px'>
                <RedDot />
                <Typography variant='h3' id="wordToUnderline">Upgrade/Downgrade History<span id="underline"></span></Typography>
            </Box>

            <Box className='upgrade-downgrade-hist-box'>
                <Typography sx={{ textAlign: 'start' }}>MO : Market Outperform</Typography>
                <Box sx={{ overflow: 'auto', maxHeight: '600px' }}>
                    <table className="table-main">
                        <thead className='table-group' style={{ position: 'sticky', top: '-1px' }}>
                            <tr className='table-row'>
                                <th className='table-head' style={{ width: '180px' }}>Grade Date</th>
                                <th className='table-head' style={{ width: '70px' }}>Action</th>
                                <th className='table-head' style={{ width: '180px' }}>Firm</th>
                                <th className='table-head' style={{ width: '120px' }}>From Grade</th>
                                <th className='table-head' style={{ width: '120px' }}>To Grade</th>
                            </tr>
                        </thead>
                        <tbody className='table-body'>
                            {history.map((item, index) => {
                                const { epochGradeDate, action, firm, fromGrade, toGrade } = item
                                return (
                                    <tr key={index} className='table-row'>
                                        <td className='table-data' style={{ textAlign: 'left' }}>{new Date(epochGradeDate).toLocaleString()}</td>
                                        <td className='table-data'>{action}</td>
                                        <td className='table-data'>{firm}</td>
                                        <td className='table-data'>{fromGrade === 'Market Outperform' ? 'MO' : fromGrade}</td>
                                        <td className='table-data'>{toGrade === 'Market Outperform' ? 'MO' : toGrade}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </Box>

            </Box>
        </Box>
    )
}

const StocksModule = () => {
    const params = useParams()
    const { stockstoken } = params;
    const dispatch = useDispatch()
    const token = useSelector(state => state.auth.accessToken)
    const stockSummary = useSelector(state => state.stockModule.stockSummary)
    const [stockSummaryState, setStockSummaryState] = useState({})

    const dataLoaded = useRef(false)
    useEffect(() => {
        console.log('UE : StocksModule summary fetch')
        if (!dataLoaded.current) {
            dataLoaded.current = true
            if (isObjectEmpty(stockSummary)) {
                console.log('Data not in redux')
                getStockSummaryDetails({ token, symbol: stockstoken })
                    .then((response) => {
                        const { stockSummaryDetails } = response.data
                        setStockSummaryState(stockSummaryDetails)
                        dispatch(setStockSummary(stockSummaryDetails))
                    })
                    .catch((error) => {
                        console.log('error', error)
                    })
            } else {
                console.log('Data in redux')
                setStockSummaryState(stockSummary)
            }
        }
    }, [stockSummary, stockstoken, token, dispatch])

    useEffect(() => {
        // console.log('UE : gsap handler')
        const stockSections = document.querySelectorAll('.stock-header')
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                const h3 = entry.target.querySelector('#underline');
                if (entry.isIntersecting) {
                    // Animate the underline in
                    gsap.to(h3, {
                        width: "100%",
                    });
                } else {
                    // Animate the underline out
                    gsap.to(h3, {
                        width: "0",
                    });
                }
            });
        }, {
            threshold: 0.5
        });

        stockSections.forEach(section => {
            observer.observe(section);
        });
    })

    // console.log(stockSummaryState)
    const checkObjectLength = (obj) => {
        return Object.keys(obj).length === 0;
    }

    return (
        <Box className='stock-module-container'>
            <Box width='-webkit-fill-available'>
                <Header title={stockstoken} />
            </Box>
            {isObjectEmpty(stockSummaryState) ?
                (
                    <Box>Loading...</Box>
                ) :
                (
                    <Box className='stock-summary-profile-box' pl={4} pr={4} pb={4} display='flex' flexDirection='column' gap='40px'>
                        {stockSummaryState.assetProfile && <AssetProfile summary={stockSummaryState} />}
                        {stockSummaryState.recommendationTrend && <RecommendationTrend summary={stockSummaryState} />}
                        {stockSummaryState.indexTrend && <IndexTrend summary={stockSummaryState} />}
                        {stockSummaryState.combinedPriceSummary && <CombinedPriceSummary summary={stockSummaryState} />}
                        {stockSummaryState.calendarEvents && <CalendarEvents summary={stockSummaryState} />}
                        {stockSummaryState.combinedEarnings && <CombinedEarnings summary={stockSummaryState} />}
                        {!checkObjectLength(stockSummaryState.combinedCashflowStatement.annual) && <CombinedReports report_title='Cash Flow Report' data_key='combinedCashflowStatement' report_key='cashflowStatements' summary={stockSummaryState} />}
                        {!checkObjectLength(stockSummaryState.combinedBalanceSheet.annual) && <CombinedReports report_title='Balance Sheet Report' data_key='combinedBalanceSheet' report_key='balanceSheetStatements' summary={stockSummaryState} />}
                        {!checkObjectLength(stockSummaryState.cominedIncomeStatement.annual) && <CombinedReports report_title='Income Statement' data_key='cominedIncomeStatement' report_key='incomeStatementHistory' summary={stockSummaryState} />}
                        {stockSummaryState.defaultKeyStatistics && <DefaultKeyStats summary={stockSummaryState} />}
                        {stockSummaryState.financialData && <FinancialData summary={stockSummaryState} />}
                        {stockSummaryState.fundOwnership && <CustomOwnership ownership_type='Fund Ownership' data_key='fundOwnership' summary={stockSummaryState} />}
                        {stockSummaryState.institutionOwnership && <CustomOwnership ownership_type='Institution Ownership' data_key='institutionOwnership' summary={stockSummaryState} />}
                        {stockSummaryState.insiderHolders && <InsideHolders summary={stockSummaryState} />}
                        {stockSummaryState.upgradeDowngradeHistory && <UpgradeDowngradeHistory summary={stockSummaryState} />}
                    </Box>
                )
            }
        </Box>
    )
}

export default StocksModule