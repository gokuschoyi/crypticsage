import React, { useState, useEffect } from 'react'
import { ErrorBoundary } from "react-error-boundary";
import { Box, Grid, Typography } from '@mui/material'
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
            console.log(foundFunction)

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
        <Grid container pt={2} pb={2} mb={2} mt={2}>
            <Grid item xs={12} sm={12} md={12} lg={3} xl={3} pl={2} pr={2}>
                <ErrorBoundary onError={logError} fallback={<div>Something went wrong</div>}>
                    <IndicatorSearch
                        searchedFunctions={searchedFunctions}
                        selectedFunctions={selectedFunctions}
                        transformedFunctionsList={transformedFunctionsList}
                        handleSearchedFunctions={handleSearchedFunctions}
                        handleAddSelectedFunction={handleAddSelectedFunction}
                    />
                </ErrorBoundary>
            </Grid>
            <Grid item xs={12} sm={12} md={12} lg={9} xl={9} pl={2} pr={2}>
                {selectedFunctions.length === 0 ?
                    (
                        <Box display='flex' flexDirection='row' justifyContent='flex-start'>
                            <Typography variant='h5' pl={1} pt={1} pb={1} sx={{ textAlign: 'start' }}>Select an indicator to plot</Typography>
                        </Box>
                    )
                    :
                    (
                        <React.Fragment>
                            <Box pl={1}>
                                <Typography variant='h5' sx={{ textAlign: 'start' }}>Selected Indicators</Typography>
                            </Box>
                        </React.Fragment>
                    )
                }
                {selectedFunctions.length !== 0 &&
                    <Grid container className='indicator-data-container'>
                        {selectedFunctions.map((funcRedux, index) => {
                            const { name } = funcRedux
                            return (
                                <Grid key={`${name}${index}`} item xs={12} sm={6} md={4} lg={4} xl={3}>
                                    <SelectedFunctionContainer key={index} funcRedux={funcRedux} fetchValues={fetchValues} />
                                </Grid>
                            )
                        })}
                    </Grid>
                }
            </Grid>
        </Grid>
    )
}

export default IndicatorSearchExecute