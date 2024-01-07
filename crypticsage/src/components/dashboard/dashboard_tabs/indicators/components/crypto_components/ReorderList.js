import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux';
import { Box, Typography, Paper, Tooltip, IconButton } from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import Sortable from 'sortablejs';
const ReorderList = ({ orderList, setOrderList, disabled }) => { // orderList is the initial state of the list that changes on re-order
    const transformationOrder = useSelector(state => state.cryptoModule.modelData.training_parameters.transformation_order) // initial state 5
    // console.log('original state : ', orderList)

    const [indicators, setIndicators] = useState(orderList);
    const listRef = useRef(null);
    const talibQueries = useSelector(state => state.cryptoModule.modifiedSelectedFunctionWithDataToRender)
    // const epochResult = useSelector(state => state.cryptoModule.modelData.epoch_results)
    // console.log(epochResult)
    useEffect(() => {
        // console.log('UE : adding talib indicators to list');
        let updatedIndicators = indicators.slice(); // Create a shallow copy of the current indicators
        // console.log('indicators : ', indicators)
        let order = updatedIndicators.length + 1;

        // console.log('Next count : ', order)

        if (talibQueries.length > 0) {
            // console.log('talib length > 0')

            let talibList = []

            talibQueries.forEach((query) => {
                const funcName = query.name;
                const key = query.key;
                const indicatorId = `${order++}`;
                const indicatorName = `${funcName}_${key}`;
                talibList.push({
                    id: indicatorId,
                    name: indicatorName,
                    value: indicatorName,
                    key: key
                })
            })

            // console.log('talib list', talibList)

            let newOrderState = [...transformationOrder, ...talibList]
            /* if (newOrderState.length === indicators.length) {
                return;
            } */

            let newUpdatedOrder = [];
            if (newOrderState.length < indicators.length) {
                newUpdatedOrder = indicators.filter(indicator =>
                    newOrderState.some(query => query.name === indicator.name)
                );
                let nOrder = transformationOrder.length + 1;
                let reordered = newUpdatedOrder.map((indicator, index) => {
                    let id = indicator.id;
                    if (talibList.some(query => query.name === indicator.name)) {
                        id = `${nOrder++}`;
                        // console.log('found talib', indicator.name, id)
                    }
                    return {
                        id: id,
                        name: indicator.name,
                        value: indicator.value,
                        key: indicator.key
                    };
                });

                newUpdatedOrder = reordered;

                // console.log('Re-orderd', reordered)
            } else {
                let funcFiltered = updatedIndicators.filter(indicator =>
                    talibList.some(query => query.name === indicator.name)
                );
                let removedFromTalibResult = talibList.filter(indicator =>
                    !funcFiltered.some(query => query.name === indicator.name)
                );
                let finalTalibWithModifiedId = removedFromTalibResult.map((indicator, index) => {
                    return {
                        id: `${indicators.length + index + 1}`,
                        name: indicator.name,
                        value: indicator.value,
                        key: indicator.key
                    }
                })
                // console.log('func filtered', funcFiltered, removedFromTalibResult, finalTalibWithModifiedId)
                newUpdatedOrder = [...updatedIndicators, ...finalTalibWithModifiedId]
            }

            // console.log('new updated', newUpdatedOrder)

            setIndicators([...newUpdatedOrder]);
            setOrderList([...newUpdatedOrder]);
        } else {
            // console.log('talib length = 0')
            // console.log(indicators.length)
            if (indicators.length === 5) {
                // console.log('indicators length = 5 , initializing indicators')
                return;
            } else {
                // console.log('indicator length = 6, and cleaning up')
                updatedIndicators = indicators.filter(indicator =>
                    transformationOrder.some(query => query.name === indicator.name)
                );
                setIndicators(updatedIndicators);
                setOrderList(updatedIndicators);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [talibQueries]);

    const handleOrderChange = (newOrder) => {
        // Update the order of indicators based on newOrder
        const reorderedIndicators = newOrder.map(id =>
            indicators.find(indicator => indicator.id === id)
        );
        setIndicators(reorderedIndicators);
        setOrderList(reorderedIndicators)
    };

    const sortableRef = useRef(null);
    useEffect(() => {
        // console.log('UE : Sortable init')
        // Initialize SortableJS when the component mounts
        sortableRef.current = new Sortable(listRef.current, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            onEnd: () => {
                // When the order changes, call onOrderChange with the new order
                const newOrder = sortableRef.current.toArray();
                handleOrderChange(newOrder);
            }
        }, []);

        // Clean up when the component unmounts
        return () => {
            if (sortableRef.current) {
                sortableRef.current.destroy();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [indicators]);

    useEffect(() => {
        if (sortableRef.current) {
            var currentState = sortableRef.current.option('disabled');
            // console.log('UE : sortable disabled state', currentState, disabled)
            if (currentState !== disabled) {
                sortableRef.current.option('disabled', disabled);
            } else {
                // console.log('UE : sortable disabled state is same')
            }
        }
    }, [disabled])

    const handleOrderReset = () => {
        console.log('Reset order clicked')
        let originalOrder = []

        let talibList = []

        talibQueries.forEach((query, index) => {
            const funcName = query.name;
            const key = query.key;
            const indicatorId = `${index + 5 + 1}`;
            const indicatorName = `${funcName}_${key}`;
            talibList.push({
                id: indicatorId,
                name: indicatorName,
                value: indicatorName
            })
        })

        originalOrder = [...transformationOrder, ...talibList]
        // console.log('original order', originalOrder)
        setIndicators(originalOrder);
        setOrderList(originalOrder);
    }

    return (
        <Paper elevation={4} sx={{ padding: '8px', display: 'flex', flexDirection: 'column', width: '100%' }}>
            <Box display={'flex'} flexDirection={'row'} justifyContent={'space-between'} alignItems={'center'}>
                <Typography variant='h6' textAlign={'start'}>Order of Input</Typography>
                <Tooltip title={'Reset order.'} placement='top' sx={{ cursor: 'pointer', padding: '6px' }}>
                    <span>
                        <IconButton disabled={disabled} onClick={handleOrderReset}>
                            <RestartAltIcon className='small-icon' />
                        </IconButton>
                    </span>
                </Tooltip>
            </Box>
            {indicators.length === 5 &&
                <Typography variant='custom' sx={{ textAlign: 'start' }}>
                    Please add indicators to reorder them
                </Typography>
            }
            <ul ref={listRef}>
                {indicators.map((indicator, index) => (
                    <li className='ordering-li' key={indicator.id} data-id={indicator.id}>
                        <Typography variant='custom' >
                            {indicator.id} - {indicator.name}
                        </Typography>
                    </li>
                ))}
            </ul>
        </Paper>
    );
}

export default ReorderList