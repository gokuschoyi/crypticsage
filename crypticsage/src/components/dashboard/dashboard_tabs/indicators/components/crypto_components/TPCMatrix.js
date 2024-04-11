import React, { useState, useRef } from 'react'
import CorelationMatrix from './CorelationMatrix'
import { useSelector } from 'react-redux'
import {
    Box
    , Typography
    , Button
    , IconButton
    , Skeleton
} from '@mui/material'

import {
    DeleteForeverIcon
    , CloseIcon
} from '../../../../global/Icons'

import {
    generateTalibFunctionsForExecution
} from '../../modules/CryptoModuleUtils'

import {
    getCorelationMatrix
} from '../../../../../../api/adminController'

const TPCMatrix = ({ transformationOrder, trainingStartedFlag }) => {
    const [corelation_matrix_error, setCorelation_matrix_error] = useState('')
    const token = useSelector(state => state.auth.accessToken);
    const tDataRedux = 500

    const model_id = useSelector(state => state.cryptoModule.modelData.model_id)
    const selectedTickerPeriod = useSelector(state => state.cryptoModule.selectedTickerPeriod)
    const selectedTickerName = useSelector(state => state.cryptoModule.selectedTickerName)
    const loadingFromSaved = useSelector(state => state.cryptoModule.modelData.loading_from_saved_model)
    const userModels = useSelector(state => state.cryptoModule.userModels)
    const selectedFunctions = useSelector(state => state.cryptoModule.selectedFunctions)

    const [corelation_matrix, setCorelation_matrix] = useState([])
    const transformation_order_ref = useRef(transformationOrder)
    const [loading, setLoading] = useState(false)

    const handleCalculateCorrelationMatrix = () => {
        // console.log('Calculate Correlation clicked...', transformationOrder)
        // console.log('Old state..', transformation_order_ref.current)
        if (transformationOrder.length === 5) {
            setCorelation_matrix_error('Select a function from below...')
            return
        }
        const checkOrder = (old, new_) => {
            if (old.length !== new_.length) return false;
            for (let i = 0; i < old.length; i++) {
                if (old[i].id !== new_[i].id) {
                    // console.log(old[i].id, new_[i].id)
                    return false;
                }
            }
            return true;
        }

        let payload
        if (loadingFromSaved) {
            payload = {
                transformation_order: transformationOrder,
                talibExecuteQueries: userModels.find((model) => model.model_id === model_id).model_data.talibExecuteQueries
            }
        } else {
            payload = {
                transformation_order: transformationOrder,
                talibExecuteQueries: generateTalibFunctionsForExecution({ selectedFunctions, tDataReduxL: tDataRedux.length, selectedTickerPeriod, selectedTickerName })
            }
        }

        setLoading(true)
        const order = checkOrder(transformation_order_ref.current, transformationOrder)
        if (!order) {
            // console.log('Order changed or new func added.')
            setCorelation_matrix_error('')
            // console.log(order)
            getCorelationMatrix({ token, payload })
                .then((res) => {
                    // console.log(res.data)
                    setCorelation_matrix(res.data.corelation_matrix)
                    setLoading(false)
                })
                .catch((err) => {
                    setLoading(false)
                    console.log(err)
                })
        } else if (order && corelation_matrix.length === 0) {
            // console.log('Order is same but no data.')
            setCorelation_matrix_error('')
            getCorelationMatrix({ token, payload })
                .then((res) => {
                    // console.log(res.data)
                    setCorelation_matrix(res.data.corelation_matrix)
                    setLoading(false)
                })
                .catch((err) => {
                    setLoading(false)
                    console.log(err)
                })
        } else {
            // console.log('Order is not changed.')
            setLoading(false)
            setCorelation_matrix_error('Order has not changed or same data.')
        }

        transformation_order_ref.current = transformationOrder
    }

    return (
        <React.Fragment>
            <Box display='flex' flexDirection='column' justifyContent='space-between'>
                <Box display='flex' gap='8px' alignItems='center' justifyContent='space-between'>
                    <Typography variant='h5' textAlign='start'>Corelation Matrix</Typography>
                    <Box display='flex' gap='8px' alignItems='center'>
                        <Button
                            sx={{
                                height: '26px',
                            }}
                            variant='outlined'
                            size='small'
                            color='secondary'
                            disabled={trainingStartedFlag}
                            onClick={(e) => handleCalculateCorrelationMatrix()}
                        >
                            MATRIX
                        </Button>
                        <IconButton disabled={trainingStartedFlag} onClick={(e) => setCorelation_matrix([])}>
                            <DeleteForeverIcon className='small-icon' />
                        </IconButton>
                    </Box>
                </Box>
                <Box display='flex' gap='8px' alignItems='center'>
                    {corelation_matrix_error !== '' &&
                        <Box display={'flex'} alignItems={'center'} gap={1}>
                            <Typography variant='custom' textAlign='start' sx={{ color: 'red' }}>{corelation_matrix_error}</Typography>
                            <IconButton style={{padding:'0px'}} disabled={trainingStartedFlag} onClick={(e) => setCorelation_matrix_error('')}>
                                <CloseIcon className='small-icon' />
                            </IconButton>
                        </Box>
                    }
                </Box>
            </Box>
            <Box pt={2} style={{ minHeight: '300px' }}>
                {loading && <Skeleton variant="rectangular" height={280} />}
                {(corelation_matrix && corelation_matrix.length > 0) &&
                    <CorelationMatrix
                        transformation_order={transformation_order_ref.current}
                        correlation_data_redux={corelation_matrix}
                    />
                }
            </Box>
        </React.Fragment>
    )
}

export default TPCMatrix