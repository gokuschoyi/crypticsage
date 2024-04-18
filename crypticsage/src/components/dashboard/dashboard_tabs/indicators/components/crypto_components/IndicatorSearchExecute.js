import React, { useState, useEffect } from 'react'
import { ErrorBoundary } from "react-error-boundary";
import { Box, Grid, Typography, useTheme, useMediaQuery } from '@mui/material'
import { useSelector, useDispatch } from 'react-redux'
import { setSelectedFlagInTalibDescription, setSelectedFunctions } from '../../modules/CryptoModuleSlice'
import IndicatorSearch from './IndicatorSearch'
import SelectedFunctionContainer from './SelectedFunctionContainer'


const logError = (error, info) => {
    // Do something with the error, e.g. log to an external API
    console.log('error', error)
};

const IndicatorSearchExecute = ({
    selectedFunctions
    , fetchValues
}) => {
    const dispatch = useDispatch()
    // search and add function feature
    const theme = useTheme()
    const md = useMediaQuery(theme.breakpoints.down('lg'));
    const talibFunctions = useSelector(state => state.cryptoModule.talibDescription)
    const [searchedFunctions, setSearchedFunction] = useState([]);
    const [transformedFunctionsList, setTransformedFunctionList] = useState([]);

    useEffect(() => {
        if (talibFunctions.length > 0) {
            const modified = talibFunctions.reduce((result, item) => {
                return [
                    ...result,
                    ...item.functions.map((func) => ({
                        func_selected: func.function_selected_flag,
                        group: func.group,
                        label: `${func.name} : ${func.hint}`,
                    }))
                ];
            }, [])
            setTransformedFunctionList(modified)
        }
    }, [talibFunctions])

    const handleSearchedFunctions = (newValue) => {
        setSearchedFunction(newValue)
    }

    const handleAddSelectedFunction = () => {
        console.log('Add functions to calculate')
        const functionNamesToAdd = searchedFunctions.map((func) => {
            // eslint-disable-next-line no-unused-vars
            const [func_name, func_hint] = func.label.split(':')
            return func_name.trim()
        })
        // console.log(functionNamesToAdd)

        functionNamesToAdd.forEach((func_name) => {
            const foundFunction = talibFunctions
                .map(group => group.functions)
                .flat()
                .find(func => func.name === func_name);
            // console.log(foundFunction)

            if (foundFunction) {
                dispatch(setSelectedFlagInTalibDescription(
                    {
                        group: foundFunction.group,
                        name: foundFunction.name,
                        inputs: foundFunction.inputs,
                        optInputs: foundFunction.optInputs,
                    }
                ))

                dispatch(setSelectedFunctions(
                    {
                        hint: foundFunction.hint,
                        name: foundFunction.name,
                        group_name: foundFunction.group,
                        inputs: foundFunction.inputs,
                        optInputs: foundFunction.optInputs,
                        outputs: foundFunction.outputs,
                        function_selected_flag: true,
                        result: [],
                        splitPane: foundFunction.splitPane
                    }
                ))
            }
        })
        setSearchedFunction((prev) => { return [] })

    }
    return (
        <Box pt={2} mb={!md && 2} mt={!md && '32px'} className='indicator-search-execute'>
            <Box pr={2} pl={md && 2}>
                <ErrorBoundary onError={logError} fallback={<div>Something went wrong</div>}>
                    <IndicatorSearch
                        searchedFunctions={searchedFunctions}
                        transformedFunctionsList={transformedFunctionsList}
                        handleSearchedFunctions={handleSearchedFunctions}
                        handleAddSelectedFunction={handleAddSelectedFunction}
                    />
                </ErrorBoundary>
            </Box>
            <Box pr={2} pl={md && 2}>
                {selectedFunctions.length > 0 &&
                    <Box pl={1} pt={1}>
                        <Typography variant='h5' sx={{ textAlign: 'start' }}>Selected Indicators</Typography>
                    </Box>
                }
                {selectedFunctions.length !== 0 &&
                    <Box className='fixed-height-box' sx={{ maxHeight: !md ? '480px' : '', overflowY: !md ? 'auto' : '', width: '100%' }}>
                        <Grid container className='indicator-data-container'>
                            {selectedFunctions.map((funcRedux, index) => {
                                const { name } = funcRedux
                                return (
                                    <Grid key={`${name}${index}`} item xs={12} sm={6} md={4} lg={12} xl={12}>
                                        <SelectedFunctionContainer key={index} funcRedux={funcRedux} fetchValues={fetchValues} />
                                    </Grid>
                                )
                            })}
                        </Grid>
                    </Box>
                }
            </Box>
        </Box>
    )
}

export default IndicatorSearchExecute