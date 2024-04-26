import { Tooltip, Box } from "@mui/material";
import { styled } from '@mui/material/styles';
import { tooltipClasses } from '@mui/material/Tooltip';

export const convertKeysForDisplay = (key) => {
    let final = ''
    switch (key) {
        case 'outRealUpperBand':
            final = 'U'
            break;
        case 'outRealLowerBand':
            final = 'L'
            break;
        case 'outRealMiddleBand':
            final = 'M'
            break;
        case 'outInPhase':
            final = 'Phase'
            break;
        case 'outQuadrature':
            final = 'Quad'
            break;
        case 'outSine':
            final = 'Sine'
            break;
        case 'outLeadSine':
            final = 'LeadSine'
            break;
        case 'outMACD':
            final = 'Out'
            break;
        case 'outMACDSignal':
            final = 'Signal'
            break;
        case 'outMACDHist':
            final = 'Hist'
            break;
        case 'outSlowK':
            final = 'SlowK'
            break;
        case 'outSlowD':
            final = 'SlowD'
            break;
        case 'outFastK':
            final = 'FastK'
            break;
        case 'outFastD':
            final = 'FastD'
            break;
        default:
            break;
    }
    return final
}

export const Dot = ({ color }) => {
    return (
        <Box sx={{ width: '8px', height: '8px', borderRadius: '10px', backgroundColor: color }}></Box>
    )
}

export const NoMaxWidthTooltip = styled(({ className, ...props }) => (
    <Tooltip {...props} classes={{ popper: className }} />
))({
    [`& .${tooltipClasses.tooltip}`]: {
        maxWidth: 'none',
    },
});

export const ClassificationTable = ({ data, title }) => {
    return (
        <div>
            <h2>{title}</h2>
            <table>
                <thead>
                    <tr>
                        <th>Con</th>
                        <th>Criteria</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => (
                        <tr key={index}>
                            <td>{item.Condition}</td>
                            <td>{item.Criteria}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export const PredictionMSETable = ({ data }) => {
    // console.log(data)

    return (
        <table className="mse-table-main" style={{ fontWeight: '600', fontSize: '11px' }}>
            <thead className='table-group'>
                <tr className='table-row'>
                    <th className='mse-table-head'>Date</th>
                    <th className='mse-table-head'>MSE</th>
                    <th className='mse-table-head'>RMSE</th>
                </tr>
            </thead>
            <tbody className='table-body'>
                {data.map((item, index) => {
                    return (
                        <tr className='table-row' key={index}>
                            <td className='prediction-mse'>{item.date}</td>
                            <td className='prediction-mse'>{item.rmse * item.rmse}</td>
                            <td className='prediction-mse'>{item.rmse}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    )
}

export const ModelHistoryTable = ({ data }) => {
    const tableHeadKeys = Object.keys(data[0])
    const order = ['epoch', 'mse', 'val_mse', 'mae', 'val_mae']
    const exclude = ['loss', 'val_loss']
    const tableHead = tableHeadKeys
        .filter((item) => !exclude.includes(item))
        .sort((a, b) => order.indexOf(a) - order.indexOf(b))
    return (
        <table className="mse-table-main" style={{ fontWeight: '600', fontSize: '11px' }}>
            <thead className='table-group'>
                <tr className='table-row'>
                    {
                        tableHead.map((item, index) => (
                            <th className='mse-table-head' key={index}>{item.toUpperCase()}</th>
                        ))
                    }
                </tr>
            </thead>
            <tbody className='table-body'>
                {data.map((item, index) => {
                    return (
                        <tr className='table-row' key={index}>
                            {
                                tableHead.map((key, index) => {
                                    return (
                                        <td className="model-history-td" key={index}>{key === 'epoch' ? item[key] + 1 : item[key]}</td>
                                    )
                                })
                            }
                        </tr>
                    );
                })}
            </tbody>
        </table>
    )
}

export const formatMillisecond = (milliseconds) => {
    if (milliseconds < 1000) {
        return milliseconds.toFixed(3) + ' ms';
    } else if (milliseconds < 60000) {
        return (milliseconds / 1000).toFixed(3) + ' s';
    } else {
        const hours = Math.floor(milliseconds / 3600000);
        const minutes = Math.floor((milliseconds % 3600000) / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        const remainingMilliseconds = milliseconds % 1000;

        const formattedTime = [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0'),
            remainingMilliseconds.toString().padStart(3, '0')
        ].join(':');

        return formattedTime;
    }
}

export const periodToMilliseconds = (period) => {
    switch (period) {
        case '1m':
            return 1000 * 60;
        case '1h':
            return 1000 * 60 * 60;
        case '4h':
            return 1000 * 60 * 60 * 4;
        case '6h':
            return 1000 * 60 * 60 * 6;
        case '8h':
            return 1000 * 60 * 60 * 8;
        case '12h':
            return 1000 * 60 * 60 * 12;
        case '1d':
            return 1000 * 60 * 60 * 24;
        case '3d':
            return 1000 * 60 * 60 * 24 * 3;
        case '1w':
            return 1000 * 60 * 60 * 24 * 7;
        default:
            return 1000 * 60 * 60 * 24;
    }
}

export const generateMSESteps = (period) => {
    switch (period) {
        case '1m':
            return { value: 1, unit: 'm' };
        case '1h':
            return { value: 1, unit: 'h' };
        case '4h':
            return { value: 4, unit: 'h' };
        case '6h':
            return { value: 6, unit: 'h' };
        case '8h':
            return { value: 8, unit: 'h' };
        case '12h':
            return { value: 12, unit: 'h' };
        case '1d':
            return { value: 1, unit: 'd' };
        case '3d':
            return { value: 3, unit: 'd' };
        case '1w':
            return { value: 1, unit: 'w' };
        default:
            return { value: 24, unit: 'h' };
    }
};

export const generateRandomModelName = (tokenPeriod, selectedTokenPeriod) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const length = 10;
    let modelName = `model_${tokenPeriod}_${selectedTokenPeriod}_`;

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        modelName += characters.charAt(randomIndex);
    }

    return modelName;
}

export const checkForUniqueAndTransform = (data) => {
    const uniqueData = [];
    const seenTimes = new Set();

    data.forEach((item) => {
        if (!seenTimes.has(item.openTime)) {
            uniqueData.push({
                time: (item.openTime / 1000),
                open: parseFloat(item.open),
                high: parseFloat(item.high),
                low: parseFloat(item.low),
                close: parseFloat(item.close),
                volume: parseFloat(item.volume),
            })
            seenTimes.add(item.openTime);
        } else {
            console.log('Duplicate found', item.openTime)
        }
    })
    return uniqueData
}

export const checkIfNewTickerFetchIsRequired = ({ openTime, selectedTokenPeriod }) => {
    const periodInMilli = periodToMilliseconds(selectedTokenPeriod)
    const currentTime = new Date().getTime()

    let fetchLength = Math.floor((currentTime - openTime) / periodInMilli)

    let end
    switch (selectedTokenPeriod) {
        case '1m':
            end = new Date()
            end.setMinutes(end.getMinutes() - 1)
            end.setSeconds(59)
            break;
        default:
            let endAdded = new Date(openTime).getTime() + (fetchLength * periodInMilli) - 1000
            end = new Date(endAdded)
            break;
    }

    // console.log(new Date(openTime).toLocaleString(), new Date(end).toLocaleString())
    let finalDate = end.getTime()
    fetchLength = fetchLength - 1 // to avoid fetching the last ticker
    return [fetchLength, finalDate]
}

export const calculateTolerance = (data, tolerance) => {
    let TP = 0;
    let FP = 0;
    let TN = 0;
    let FN = 0;

    // Filter out data points with null actual or predicted values
    const filteredData = data.filter((value) => value.actual !== null && value.predicted !== null);

    filteredData.forEach((prediction) => {
        const { actual, predicted } = prediction;
        const tol = tolerance / 100 * actual;
        const isWithinTolerance = Math.abs(actual - predicted) <= tol;

        // Assuming 'positive' means 'actual > some_threshold'
        const isActualPositive = actual > predicted;

        if (isWithinTolerance) {
            if (isActualPositive) {
                TP++; // True Positive
            } else {
                FP++; // False Positive
            }
        } else {
            if (isActualPositive) {
                FN++; // False Negative
            } else {
                TN++; // True Negative
            }
        }
    });

    // console.log('TP:', TP, 'FN:', FN, 'TN:', TN, 'FP:', FP);
    const accuracy = (TP + TN) / (TP + FP + TN + FN);
    const prec = TP / (TP + FP);
    const recall = TP / (TP + FN);
    const f1 = (2 * prec * recall) / (prec + recall);

    // console.log({ 'Accuracy': accuracy, 'Precision': prec, 'Recall': recall, 'F1': f1 });
    return {
        TP,
        FP,
        TN,
        FN,
        accuracy: parseFloat(accuracy.toFixed(4)),
        precision: parseFloat(prec.toFixed(4)),
        recall: parseFloat(recall.toFixed(4)),
        f1: parseFloat(f1.toFixed(4))
    };
}

export const generateTalibFunctionsForExecution = ({ selectedFunctions, tDataReduxL, selectedTickerPeriod, selectedTickerName }) => {
    let fTalibExecuteQuery = [];
    selectedFunctions.forEach((unique_func) => {
        const { outputs } = unique_func;
        const func = unique_func.functions;
        func.forEach((f) => {
            const { inputs, optInputs, name, id } = f;
            let inputEmpty = false;
            let talibExecuteQuery = {}
            let tOITypes = {}
            const transformedOptionalInputs = optInputs.reduce((result, item) => {
                result[item.name] = item.defaultValue
                tOITypes[item.name] = item.type;
                return result;
            }, {})

            let outputkeys = {}
            let outputsCopy = [...outputs]
            outputkeys = outputsCopy.reduce((result, output) => {
                result[output.name] = output.name;
                return result;
            }, {});

            let converted = {}
            inputs.map((input) => {
                if (input.flags) {
                    Object.keys(input.flags).forEach((key) => {
                        converted[input.flags[key]] = input.flags[key];
                    })
                    return input
                } else {
                    if (input.value === '') {
                        inputEmpty = true;
                        converted[input.name] = "";
                        return {
                            ...input,
                            errorFlag: true,
                            helperText: 'Please select a valid input',
                        };
                    } else {
                        converted[input.name] = input.value;
                        return {
                            ...input,
                            errorFlag: false,
                            helperText: '',
                        };
                    }
                }
            })

            talibExecuteQuery['name'] = name;
            talibExecuteQuery['startIdx'] = 0;
            talibExecuteQuery['endIdx'] = tDataReduxL - 1;
            talibExecuteQuery = { ...talibExecuteQuery, ...converted, ...transformedOptionalInputs }


            let payload = {
                func_query: talibExecuteQuery,
                func_param_input_keys: converted,
                func_param_optional_input_keys: tOITypes,
                func_param_output_keys: outputkeys,
                db_query: {
                    asset_type: 'crypto',
                    fetch_count: tDataReduxL,
                    period: selectedTickerPeriod,
                    ticker_name: selectedTickerName
                }
            }
            fTalibExecuteQuery.push({ id, payload, inputEmpty })
        })
    })
    fTalibExecuteQuery = fTalibExecuteQuery.filter((item) => !item.inputEmpty)
    return fTalibExecuteQuery
}

export const getColorForValue = (value) => {
    // Interpolate between red (0) for -1, white (120) for 0, and light blue (240) for 1
    let hue = ((value + 1) / 2) * 240;
    return `hsl(${hue}, 70%, 53%)`;
};

export const capitalizeFirstCharOfEachWord = (name, key) => {
    if (name === key) {
        return name.charAt(0).toUpperCase()
    } else {
        return name.charAt(0).toUpperCase() + convertKeysForDisplay(key)
    }
}

export const cell_size = 20

export const get_co_relation_styles = (cell_size) => {
    return {
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
    }
}

export const calculateMSE = (dates, allPredictions, mean, variance, predictionChartType, predictionLookAhead) => {
    let actual = []
    let predictions = []
    dates.forEach((date) => {
        let actualScaled = predictionChartType === 'standardized' ? date.actual : calculateOriginalPrice(date.actual, variance, mean)
        actual.push(actualScaled)
    })
    allPredictions.forEach((prediction) => {
        let predicted = predictionChartType === 'standardized' ? prediction[predictionLookAhead - 1][0] : calculateOriginalPrice(prediction[predictionLookAhead - 1][0], variance, mean)
        predictions.push(predicted)
    })

    let sum = 0;
    for (let i = 0; i < actual.length; i++) {
        let diff = predictions[i] - actual[i];
        sum += diff * diff;
    }

    const mse = sum / actual.length;
    const rmse = Math.sqrt(mse);
    return { mse, rmse };
}

export const calculateOriginalPrice = (value, variance, mean) => {
    if (value === null) return null;
    return (value * Math.sqrt(variance)) + mean;
};

export const returnColorCombinations = () => {
    return {
        "LSTM": [
            {
                actual: '#0047AB', // Deep Blue
                predicted: '#FFA500', // Vibrant Orange
                forecast: '#FFD700', // Bright Yellow
                TP_up: '#FF69B4', // Hot Pink (for TP_up)
                TP_down: '#00FA9A' // Medium Spring Green (for TP_down)
            },
            {
                actual: '#B22222', // Classic Red
                predicted: '#008080', // Soft Teal
                forecast: '#BC8F8F', // Gentle Lavender
                TP_up: '#FFFF00', // Yellow (for TP_up)
                TP_down: '#FF6347' // Tomato (for TP_down)
            },
            {
                actual: '#228B22', // Forest Green
                predicted: '#800080', // Rich Purple
                forecast: '#87CEEB', // Sky Blue
                TP_up: '#FF4500', // Orange Red (for TP_up)
                TP_down: '#20B2AA' // Light Sea Green (for TP_down)
            },
            {
                actual: '#2F4F4F', // Dark Slate Gray
                predicted: '#FF7F50', // Bright Coral
                forecast: '#98FB98', // Pale Green
                TP_up: '#00CED1', // Dark Turquoise (for TP_up)
                TP_down: '#FFB6C1' // Light Pink (for TP_down)
            },
            {
                actual: '#1E90FF', // Dark Slate Gray
                predicted: '#32CD32', // Bright Coral
                forecast: '#9370DB', // Pale Green
                TP_up: '#FFD700', // Dark Turquoise (for TP_up)
                TP_down: '#FF69B4' // Hot Pink (for TP_down)
            }
        ],
        "WGAN-GP": [
            {
                actual: '#C200FB',
                two: '#EC0868',
                three: '#FC2F00',
                four: '#EC7D10',
                five: '#FFBC0A',
            },
            {
                actual: '#DF2935',
                two: '#86BA90',
                three: '#F5F3BB',
                four: '#CE506E',
                five: '#DEA000',
            },
            {
                actual: '#F46036',
                two: '#2E294E',
                three: '#1B998B',
                four: '#E71D36',
                five: '#C5D86D',
            },
            {
                one: '#053225',
                actual: '#E34A6F',
                three: '#F7B2BD',
                four: '#B21198',
                five: '#60A561',
            },
            {
                actual: '#F72585',
                two: '#7209B7',
                three: '#3A0CA3',
                four: '#32CD75',
                five: '#4CC9F0',
            },
            {
                actual: '#713E5A',
                two: '#63A375',
                three: '#EDC79B',
                four: '#D57A66',
                five: '#CA6680',
            }
        ]
    }
}

export const getChronosAreaChartColors = (model_type) => {
    const colors = {
        "tiny": {
            highLineColor: '#049981',
            lowLineColor: '#F23645',
            closeLineColor: '#878993',
            areaBottomColor: 'rgba(242, 54, 69, 0.2)',
            areaTopColor: 'rgba(4, 153, 129, 0.2)',
        },
        "small": {
            highLineColor: '#228B22',
            lowLineColor: '#B22222',
            closeLineColor: '#878993',
            areaBottomColor: 'rgba(178, 34, 34, 0.2)',
            areaTopColor: 'rgba(34, 139, 34, 0.2)',
        },
    }

    return colors[model_type]
}