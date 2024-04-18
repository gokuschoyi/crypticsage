import React from 'react'
import { Box, Autocomplete, Button, TextField, Chip, useTheme, useMediaQuery } from '@mui/material'
const IndicatorSearch = ({
    searchedFunctions,
    transformedFunctionsList,
    handleSearchedFunctions,
    handleAddSelectedFunction,
}) => {
    const theme = useTheme()
    const lg = useMediaQuery(theme.breakpoints.down('lg'));
    const sm = useMediaQuery(theme.breakpoints.down('sm'));
    return (
        <Box>
            <Box className='search-indicator-box' display='flex' flexDirection='row' alignItems='center' >
                <Box className='function-selector' width='100%' display={'flex'} flexDirection={'row'} gap={1}>
                    {transformedFunctionsList.length > 0 &&
                        <Autocomplete
                            sx={{ backgroundColor: `${theme.palette.background.paperOne}`, width: lg ? sm ? '100%' : '400px' : '100%' }}
                            disableCloseOnSelect={false}
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
                                    <Chip variant="outlined" size='small' label={option.label} {...getTagProps({ index })} />
                                ))
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    variant="filled"
                                    label="Search for a function"
                                    placeholder="Search..."
                                    size='small'
                                />
                            )}
                        />
                    }
                    {searchedFunctions.length > 0 &&
                        <Box display='flex' alignItems='start'>
                            <Button size='small' color='secondary' variant='outlined' onClick={handleAddSelectedFunction.bind(null)}>Add Functions</Button>
                        </Box>
                    }
                </Box>
            </Box>
        </Box>
    )
}

export default IndicatorSearch