import React from 'react'
import Header from '../../../global/Header';
import CryptoTable from '../components/CryptoTable';
import StocksTable from '../components/StocksTable';
import {
    Box
    , Tabs
    , Tab
} from '@mui/material'
const CryptoStocksTableModule = () => {

    // adds accessibility props and id to the tab panel
    function a11yProps(index) {
        return {
            id: `simple-tab-${index}`,
            'aria-controls': `simple-tabpanel-${index}`,
        };
    }

    // switch mode values for crypto and stocks
    const [tabValue, setTabValue] = React.useState(0);

    // handles the change of the tab
    const handleTabChange = (event, newValue) => {
        // console.log('newValue', newValue)
        setTabValue(newValue);
    };
    return (
        <Box className='crypto-stocks-table-module'>
            <Box width='-webkit-fill-available' display="flex" justifyContent="space-between" alignItems='center'>
                <Header title="Indicators" />
                <Box sx={{ borderBottom: 1, borderColor: 'divider', height: '45px' }} mr={4}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="basic tabs example" textColor="secondary" indicatorColor="primary">
                        <Tab className='tab' label="CRYPTO" {...a11yProps(0)} />
                        <Tab className='tab' label="STOCKS" {...a11yProps(1)} />
                    </Tabs>
                </Box>
            </Box>
            {tabValue === 0
                ?
                (<CryptoTable />)
                :
                (<StocksTable />)
            }
        </Box>
    )
}

export default CryptoStocksTableModule