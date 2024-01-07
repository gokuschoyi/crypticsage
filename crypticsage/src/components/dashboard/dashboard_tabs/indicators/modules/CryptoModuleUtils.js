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

// const diff = actual - predicted;

/* if (diff > 0) { // actual > predicted predicted below actual
    if (diff > tol) { // outside tolerance
        TN++ // True Negative
    } else { // within tolerance
        FP++ // False Positive
    }
} else { // actual < predicted predicted above actual
    if (Math.abs(diff) > tol) { // outside tolerance
        FN++ // False Negative
    } else { // within tolerance
        TP++ // True Positive
    }
} */

/* if (diff > 0) { // actual > predicted predicted below actual
    if (diff > tol) {
        FN++ // False Negative
    } else {
        TN++ // True Negative
    }
} else { // actual < predicted predicted above actual
    if (Math.abs(diff) > tol) {
        FP++ // False Positive
    } else {
        TP++ // True Positive
    }
} */

/* // If the difference is within the tolerance, it's either TP or TN
if (Math.abs(diff) <= tol) {
    // Condition for TP and TN
    if ((actual > 0 && predicted > 0) || (actual <= 0 && predicted <= 0)) {
        TP++; // True Positive
    } else {
        TN++; // True Negative
    }
} else {
    // If the difference is outside the tolerance, it's either FP or FN
    if (predicted > actual) {
        FP++; // False Positive
    } else {
        FN++; // False Negative
    }
} */

/* export const calculateTolerance = (data, tolerance) => {
    let TP = 0;
    let FP = 0;
    let TN = 0;
    let FN = 0;
    data = data.filter((value) => value.actual !== null && value.predicted !== null)
        .forEach((prediction) => {
            const actual = prediction.actual
            const predicted = prediction.predicted
            const tol = tolerance / 100 * actual
            const diff = (actual - predicted)

            // console.log('tol : ', tol, 'diff : ', diff)

            if(diff > 0){
                if (diff > tol) {
                    FP += 1
                } else {
                    TN += 1
                }
            } else {
                if (Math.abs(diff) > tol) {
                    FN += 1
                } else {
                    TP += 1
                }
            }
            console.log('TP : ', TP, 'FP : ', FP, 'TN : ', TN, 'FN : ', FN)
        })
} */


/* const calculateMetrics = (data, thresholdLower = 0.01, thresholdUpper = 0.02) => {
    let TP = 0;
    let FP = 0;
    let TN = 0;
    let FN = 0;
    data = data.filter((value) => value.actual !== null && value.predicted !== null)
    for (let i = 0; i < data.length; i++) {
        const actualChange = data[i].actual;
        const predictedChange = data[i].predicted;
        const percentChange = (predictedChange - actualChange) / actualChange;
        // console.log(percentChange * 100)
        if (percentChange >= -thresholdLower && percentChange <= thresholdLower) {
            TP++;
        } else if (percentChange >= thresholdLower && percentChange <= thresholdUpper) {
            FN++;
        } else if (percentChange > thresholdUpper) {
            TN++;
        } else if (percentChange < -thresholdLower) {
            FP++;
        }
    }

    const accuracy = (TP + TN) / (TP + FP + TN + FN); // how close the predicted values are to the actual values based on the threshold. Higher the value better the model
    const precision = TP / (TP + FP); // how many of the predicted values are actually correct. Higher the value better the model
    const recall = TP / (TP + FN); // how many of the actual values are predicted correctly. Higher the value better the model
    const f1 = (2 * precision * recall) / (precision + recall); // harmonic mean of precision and recall. Higher the value better the model

    return {
        TP,
        FP,
        TN,
        FN,
        accuracy: accuracy.toFixed(4),
        precision: precision.toFixed(4),
        recall: recall.toFixed(4),
        f1: f1.toFixed(4)
    };
} */