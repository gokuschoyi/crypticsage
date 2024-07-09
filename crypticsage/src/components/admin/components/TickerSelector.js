import React, { useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import { useSelector, useDispatch } from 'react-redux'
import { addNewBinanceTickerMeta } from '../../../api/adminController'
import { Success } from '../../dashboard/global/CustomToasts'
import { updateOnTickerAdd } from '../AdminSlice'
import {
    Box
    , OutlinedInput
    , InputLabel
    , MenuItem
    , FormControl
    , Select
    , Chip
    , Button
} from '@mui/material';



function getStyles(name, tickerName, theme) {
    return {
        fontWeight:
            tickerName.indexOf(name) === -1
                ? theme.typography.fontWeightRegular
                : theme.typography.fontWeightMedium,
    };
}

const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: 300,
        },
    },
};

export default function TickerSelector() {
    const theme = useTheme();
    const dispatch = useDispatch()
    const token = useSelector(state => state.auth.accessToken);
    const [tickerName, setTickerName] = React.useState([]);

    const newTickers = useSelector(state => state.admin.new_tickers)
    const names = useMemo(() => newTickers.map(ticker => `${ticker.market_cap_rank}:${ticker.symbol}`), [newTickers])

    const handleChange = (event) => {
        const {
            target: { value },
        } = event;
        setTickerName(
            // On autofill we get a stringified value.
            typeof value === 'string' ? value.split(',') : value,
        );
    };

    const handleAddNewTickers = () => {
        const cleaned_tickers = tickerName.map(ticker => ticker.split(':')[1])
        if (cleaned_tickers.length === 0) return
        console.log(cleaned_tickers)
        const data_to_update = newTickers.filter(ticker => cleaned_tickers.includes(ticker.symbol))
        console.log(data_to_update)
        addNewBinanceTickerMeta({ token, ticker_to_add: data_to_update })
            .then(res => {
                const { result, tickersWithNoDataInBinance, tickersWithNoHistData } = res.data
                console.log(result, tickersWithNoDataInBinance, tickersWithNoHistData)
                Success(`Added ${result.length} tickers to database`)
                dispatch(updateOnTickerAdd({ tickersWithNoDataInBinance, tickersWithNoHistData }))
                setTickerName([])
            })
            .catch(err => {
                console.log(err)
            })
    }

    return (
        <Box>
            {names.length > 0 &&
                <Box display={'flex'} alignItems={'flex-start'} gap={1}>
                    <FormControl sx={{
                        width: 300,
                        '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                                borderColor: '#E0E3E2',
                            }
                        }
                    }}>
                        <InputLabel sx={{
                            top: '-10px',
                            '& label.Mui-focused': {
                                top: '0px'
                            }
                        }}
                            id="demo-multiple-chip-label">Select tickers</InputLabel>
                        <Select
                            labelId="demo-multiple-chip-label"
                            id="demo-multiple-chip"
                            multiple
                            value={tickerName}
                            onChange={handleChange}
                            input={<OutlinedInput id="select-multiple-chip" label="Select Tickers" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {selected.map((value) => (
                                        <Chip size='small' key={value} label={value} />
                                    ))}
                                </Box>
                            )}
                            sx={{
                                '& .MuiSelect-select': {
                                    padding: '6px 6px'
                                },

                            }}
                            MenuProps={MenuProps}
                        >
                            {names.map((name) => (
                                <MenuItem
                                    key={name}
                                    value={name}
                                    style={getStyles(name, tickerName, theme)}
                                >
                                    {name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Button size='small' color='primary' variant="contained" onClick={handleAddNewTickers} >Add</Button>
                </Box>
            }
        </Box>
    );
}