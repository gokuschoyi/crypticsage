import React, { useState, useEffect, useRef } from 'react'
import { Box, Typography, Tabs, Tab } from '@mui/material'
import SavedModelsLSTM from './SavedModelsLSTM'
import SavedModelsWGANGP from './SavedModelsWGANGP'
import { useSelector, useDispatch } from 'react-redux'


import { getUserSavedModels } from '../../../../../../api/user'
import { setUserModels } from '../../modules/CryptoModuleSlice'

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const SavedModelForecasting = () => {
    const token = useSelector(state => state.auth.accessToken);
    const dispatch = useDispatch()

    const userModels = useSelector(state => state.cryptoModule.userModels)
    const selectedTickerPeriod = useSelector(state => state.cryptoModule.selectedTickerPeriod)
    const selectedTickerName = useSelector(state => state.cryptoModule.selectedTickerName)
    const defaultModelType = useSelector(state => state.cryptoModule.modelData.training_parameters.modelType)

    const [modelType, setModelType] = useState(defaultModelType)
    const [selectedTab, setSelectedTab] = useState(defaultModelType === 'WGAN-GP' ? 1 : 0)

    const handleTabChange = (event, newValue) => { // handles the change of the tab for saved models
        setSelectedTab(newValue);
        setModelType(newValue === 0 ? 'LSTM' : 'WGAN-GP');
    };

    const fetchedRef = useRef(false)
    useEffect(() => {
        if (userModels.length === 0 && !fetchedRef.current) {
            fetchedRef.current = true
            // console.log('fetching user models')
            getUserSavedModels({ token }).then(response => {
                dispatch(setUserModels(response.data.userModels))
            }).catch(error => {
                console.log('error', error)
            })
        } else {
            // console.log('user models already fetched')
        }
    }, [userModels, token, dispatch])

    return (
        <Box p={2} sx={{ minHeight: '300px' }}>
            <Box className='saved-models-title' display='flex' flexDirection='column' pb={2}>
                <Box height='32px' display='flex' gap='8px' alignItems='flex-start'>
                    <Typography variant='h4' textAlign='start'>Saved Models</Typography>

                    <Box className='crypto-stock-button'>
                        <Tabs sx={{ minHeight: '32px', '.MuiTabs-indicator': { backgroundColor: 'red', margin: '0px' } }} value={selectedTab} onChange={handleTabChange} aria-label="basic tabs example" textColor="secondary" indicatorColor="primary">
                            <Tab sx={{ height: '20px' }} className='tab-wgan' label="LSTM" {...a11yProps(0)} />
                            <Tab className='tab-wgan' label="WGAN-GP" {...a11yProps(1)} />
                        </Tabs>
                    </Box>

                </Box>
            </Box>
            {userModels && userModels.length === 0 ?
                (<Box display='flex' alignItems='start'>
                    <Typography>No Saved Models</Typography>
                </Box>)
                : modelType === 'LSTM' ?
                    <SavedModelsLSTM
                        selected_ticker_period={selectedTickerPeriod}
                        selected_ticker_name={selectedTickerName}
                    />
                    : <SavedModelsWGANGP
                        selected_ticker_period={selectedTickerPeriod}
                        selected_ticker_name={selectedTickerName}
                    />
            }
        </Box>
    )
}

export default SavedModelForecasting