import React from 'react'
import { Box, Typography, useTheme, Grid } from '@mui/material'
import { convertKeysForDisplay } from '../../modules/CryptoModuleUtils'
import '../../modules/module.css'

const getColorForValue = (value) => {
    // Interpolate between red (0) for -1, white (120) for 0, and light blue (240) for 1
    let hue = ((value + 1) / 2) * 240;
    return `hsl(${hue}, 70%, 53%)`;
};

const capitalizeFirstCharOfEachWord = (name, key) => {
    if (name === key) {
        return name.charAt(0).toUpperCase()
    } else {
        return name.charAt(0).toUpperCase() + convertKeysForDisplay(key)
    }
}

const cell_size = 20

const style = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        margin: '8px',
    },
    row: {
        display: 'flex',
    },
    cell: {
        width: cell_size, // Set cell width here
        height: cell_size, // Set cell height here
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '2px',
        borderRadius: '5px',
    },
    scale: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '12px', // Set the scale width here
        // height: '20px', // Set the scale height here
        borderRadius: '5px',
        background: `linear-gradient(to bottom, hsl(0, 90%, 53%),hsl(127,90%,53%), hsl(240, 90%, 53%))`,
        margin: `${cell_size + 6}px 0px 2px 10px`,
    },
    scaleLabel: {
        fontSize: '12px',
    },
    legend: {
        borderRadius: '50%',
        minWidth: cell_size,
        height: cell_size,
        cursor: 'pointer',
        padding: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
    }
};

const CorelationMatrix = ({ transformation_order, correlation_data_redux }) => {
    const theme = useTheme()

    return (
        <Box style={{ width: '400px', display: '-webkit-box', paddingBottom:'8px' }}>
            <Box className='corelation-matrix-box'>
                {/* Row for top labels */}
                <Grid container>
                    <Grid item>
                        <Box style={{ width: cell_size, flex: 1, margin: '2px', height: cell_size }} /> {/* Empty box for corner */}
                    </Grid>
                    {transformation_order.slice(0, correlation_data_redux.length).map(order => (
                        <Grid item key={order.id}>
                            <Box style={{ ...style.cell, flex: 1, margin: '2px' }} title={`${order.name}`}>
                                <Typography
                                    variant='custom'
                                    style={{ ...style.legend, backgroundColor: `${theme.palette.background.default}` }}>
                                    {capitalizeFirstCharOfEachWord(order.name, order.key)}
                                </Typography>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                {/* Rows for matrix and side labels */}
                {correlation_data_redux.map((row, rowIndex) => (
                    <Grid container key={rowIndex}>
                        {/* Side label */}
                        <Grid item>
                            <Box style={{ ...style.cell, flex: 1, margin: '2px' }} title={`${transformation_order[rowIndex].name}`}>
                                <Typography variant='custom' style={{ ...style.legend, backgroundColor: `${theme.palette.background.default}` }}>{capitalizeFirstCharOfEachWord(transformation_order[rowIndex].name, transformation_order[rowIndex].key)}</Typography>
                            </Box>
                        </Grid>

                        {/* Data cells */}
                        {row.map((value, colIndex) => (
                            <Grid item key={colIndex}>
                                <Box
                                    className='tooltip'
                                    key={colIndex}
                                    data-index={colIndex}
                                    style={{
                                        ...style.cell,
                                        backgroundColor: getColorForValue(value.r),
                                        flex: 1
                                    }}
                                >
                                    <span className="tooltiptext"
                                        style={{
                                            transform: colIndex > (row.length / 2) - 1 ? 'translateX(-55%)' : 'translateX(55%)',
                                            top: rowIndex > (correlation_data_redux.length / 2) - 1 ? '-65px' : '55%',
                                        }}
                                    >
                                        {`R    : ${value.r.toFixed(3)} `}
                                        <br />
                                        {`P    : ${value.p}`}
                                        <br />
                                        {`COV  : ${value.cov}`}
                                        <br />
                                        {`STAT : ${value.stat}`}
                                    </span>
                                    {/* <Typography variant='custom' style={{ color: `${theme.palette.primary.newWhite}` }}>{value.r.toFixed(3)}</Typography> */}
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                ))}
            </Box>

            {/* Color scale */}
            <Box display="flex" flexDirection={'row'}>
                <Box style={{ ...style.scale }}>
                    <span style={{ ...style.scaleLabel, color: `${theme.palette.primary.newWhite}` }}>-1</span>
                    <span style={{ ...style.scaleLabel, color: `${theme.palette.primary.newWhite}` }}>0</span>
                    <span style={{ ...style.scaleLabel, color: `${theme.palette.primary.newWhite}` }}>1</span>
                </Box>
            </Box>
        </Box>
    )
}

export default CorelationMatrix