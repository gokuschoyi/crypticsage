import React, { useEffect, useState } from 'react'
import Header from '../../global/Header';
import { Box, Typography, Button, useTheme, Grid, Divider, Input } from '@mui/material';
import './Glossary.css'
import { ClearIcon } from '../../global/Icons';

import GLOSSARY_DATA from './GlossaryData';
// console.log(GLOSSARY_DATA.A_C)

const Glossary = (props) => {
    const theme = useTheme();
    const { title, subtitle } = props



    const [filterValue, setFilterValue] = useState('A-C')
    const [glossaryData, setGlossaryData] = useState(GLOSSARY_DATA.A_C)

    const [search, setSearch] = useState('');
    const [filteredGlossaryData, setFilteredGlossaryData] = useState(glossaryData);
    const [filterCount, setFilterCount] = useState(0);

    const onSearchChange = (event) => {
        setSearch(event.target.value);
    }

    const handleFilterChange = (event) => {
        setFilterValue(event.target.value);
    }

    const clearSearch = () => {
        setSearch('');
    }

    useEffect(() => {
        switch (filterValue) {
            case 'A_C':
                setGlossaryData(GLOSSARY_DATA.A_C)
                setFilteredGlossaryData(GLOSSARY_DATA.A_C)
                break;
            case 'D_F':
                setGlossaryData(GLOSSARY_DATA.D_F)
                setFilteredGlossaryData(GLOSSARY_DATA.D_F)
                break;
            case 'G_I':
                setGlossaryData(GLOSSARY_DATA.G_I)
                setFilteredGlossaryData(GLOSSARY_DATA.G_I)
                break;
            case 'J_L':
                setGlossaryData(GLOSSARY_DATA.J_L)
                setFilteredGlossaryData(GLOSSARY_DATA.J_L)
                break;
            case 'M_O':
                setGlossaryData(GLOSSARY_DATA.M_O)
                setFilteredGlossaryData(GLOSSARY_DATA.M_O)
                break;
            case 'P_S':
                setGlossaryData(GLOSSARY_DATA.P_S)
                setFilteredGlossaryData(GLOSSARY_DATA.P_S)
                break;
            case 'T_V':
                setGlossaryData(GLOSSARY_DATA.T_V)
                setFilteredGlossaryData(GLOSSARY_DATA.T_V)
                break;
            case 'W_Z':
                setGlossaryData(GLOSSARY_DATA.W_Z)
                setFilteredGlossaryData(GLOSSARY_DATA.W_Z)
                break;
            default:
                setGlossaryData(GLOSSARY_DATA.A_C)
                setFilteredGlossaryData(GLOSSARY_DATA.A_C)
                break;
        }
    }, [filterValue])

    useEffect(() => {
        const results = glossaryData.filter(glossaryData =>
            glossaryData.word.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredGlossaryData(results);
        setFilterCount(results.length);
    }, [search, glossaryData]);

    const CustomButton = (props) => {
        const { name, filterValue, handleFilterChange } = props
        return (
            <Button
                onClick={(e) => handleFilterChange(e)}
                value={filterValue}
                variant="outlined"
                size='small'
                style={{
                    margin: '5px',
                    fontWeight: '600'
                }}
                >{name}</Button>
        )
    }

    const GlossaryCard = (props) => {
        const { word, definition } = props
        return (
            <React.Fragment>
                <Grid className='glossary-card' container spacing={2} justifyContent='center'>
                    <Grid item xs={11} sm={11} md={4} lg={4}>
                        <Typography className='glossary-card-word' textAlign='start' variant='h4'>{word}</Typography>
                    </Grid>
                    <Grid item xs={11} sm={11} md={8} lg={8}>
                        <Typography textAlign='start' variant='body1'>{definition}</Typography>
                    </Grid>
                </Grid>
                <Divider sx={{ marginTop: '10px', marginBottom: '10px' }} />
            </React.Fragment>
        )
    }

    // console.log(search)

    return (
        <Box className='glossary-container'>
            <Box width='-webkit-fill-available'>
                <Header title={title} subtitle={subtitle} />
            </Box>
            <Grid className='glossary-grid-container' container spacing={2} justifyContent='center'>
                <Grid className='glossary-grid-button' item xs={11} sm={11} md={10} lg={10}>
                    <Box className='glossary-container-inner'>
                        <Box className='alphabet-box'>
                            <CustomButton name='A-C' filterValue='A_C' handleFilterChange={handleFilterChange} />
                            <CustomButton name='D-F' filterValue='D_F' handleFilterChange={handleFilterChange} />
                            <CustomButton name='G-I' filterValue='G_I' handleFilterChange={handleFilterChange} />
                            <CustomButton name='J-L' filterValue='J_L' handleFilterChange={handleFilterChange} />
                            <CustomButton name='M-O' filterValue='M_O' handleFilterChange={handleFilterChange} />
                            <CustomButton name='P-S' filterValue='P_S' handleFilterChange={handleFilterChange} />
                            <CustomButton name='T-V' filterValue='T_V' handleFilterChange={handleFilterChange} />
                            <CustomButton name='W-Z' filterValue='W_Z' handleFilterChange={handleFilterChange} />
                        </Box>
                        <Box className='search-box'>
                            <Box className='search-result'>
                                <Input
                                    className='search-field'
                                    onChange={onSearchChange}
                                    value={search}
                                    sx={{
                                        ml: 2,
                                        flex: 1,
                                        variant: 'outlined',
                                        borderRadius: '5px',
                                        borderBottom: '0px !important',
                                        ' .MuiInputBase-input': {
                                            textIndent: '20px',
                                        },
                                    }}
                                    placeholder="Search" />
                                <ClearIcon
                                    className='clear-icon'
                                    onClick={clearSearch}
                                    sx={{
                                        ':hover': {
                                            color: `${theme.palette.primary.dark} !important`,
                                            transition: '0.3s ease-in-out'
                                        }
                                    }}
                                />
                                <Typography className='search-result-count' variant='body1' sx={{ color: `${theme.palette.secondary.main}` }} >{filterCount} results</Typography>
                            </Box>
                        </Box>
                    </Box>
                    <Divider sx={{ marginTop: '20px', marginBottom: '20px' }} />
                </Grid>
            </Grid>
            <Grid container spacing={2} justifyContent='center'>
                <Grid className='glossary' item xs={11} sm={11} md={10} lg={10}>
                    {filteredGlossaryData.map((item, index) => {
                        return (
                            <GlossaryCard key={index} word={item.word} definition={item.definition} />
                        )
                    })}
                </Grid>
            </Grid>
        </Box>
    )
}

export default Glossary