import React from 'react'
import { Box, Autocomplete, Button, Typography, TextField, Chip, useTheme } from '@mui/material'
import { Dot } from '../../modules/CryptoModuleUtils'
const IndicatorSearch = ({
    searchedFunctions,
    selectedFunctions,
    transformedFunctionsList,
    handleSearchedFunctions,
    handleAddSelectedFunction,
}) => {
    const theme = useTheme()
    return (
        <Box>
            <Box className='search-indicator-box' display='flex' flexDirection='row' alignItems='center' >
                <Box className='function-selector' width='350px'>
                    {transformedFunctionsList.length > 0 &&
                        <Autocomplete
                            sx={{ backgroundColor: `${theme.palette.background.paperOne}` }}
                            disableCloseOnSelect={true}
                            value={searchedFunctions}
                            size='small'
                            multiple
                            limitTags={2}
                            id="tags-filled"
                            options={transformedFunctionsList.sort((a, b) => -b.group.localeCompare(a.group))}
                            getOptionDisabled={(option) => transformedFunctionsList.filter((item) => item.label === option.label)[0].func_selected || searchedFunctions.includes(option.label)}
                            groupBy={(option) => option.group}
                            freeSolo
                            onChange={(event, newValue) => {
                                handleSearchedFunctions(newValue)
                            }}
                            renderTags={(value, getTagProps) =>
                                value.map((option, index) => (
                                    <Chip variant="outlined" label={option.label} {...getTagProps({ index })} />
                                ))
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="filled"
                                    label="Search for a function"
                                    placeholder="Search..."
                                />
                            )}
                        />
                    }
                    {searchedFunctions.length > 0 &&
                        <Box display='flex' alignItems='start' pt={1}>
                            <Button size='small' color='secondary' variant='outlined' onClick={handleAddSelectedFunction.bind(null)}>Add Functions</Button>
                        </Box>
                    }
                </Box>
            </Box>
            {selectedFunctions.length !== 0 &&
                <Box display='flex' flexDirection='column' alignItems='start' pt={1} pb={2}>
                    {selectedFunctions.map((funcRedux, index) => {
                        const { hint, functions } = funcRedux;
                        return (
                            <Box key={index}>
                                {functions.map((func, funcIndex) => {
                                    const { outputAvailable } = func;
                                    return (
                                        <Box key={funcIndex} display='flex' flexDirection='row' gap='4px' alignItems='center'>
                                            <Dot color={outputAvailable ? 'green' : 'red'} />
                                            <Typography className='selected-function-hint' variant='custom' sx={{ textAlign: 'start' }}>{hint}</Typography>
                                        </Box>
                                    );
                                })}
                            </Box>
                        );
                    })}
                </Box>
            }
        </Box>
    )
}

export default IndicatorSearch