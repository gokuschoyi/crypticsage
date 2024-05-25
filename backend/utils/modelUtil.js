const logger = require('../middleware/logger/Logger');
const log = logger.create(__filename.slice(__dirname.length + 1))

const HDUtil = require('../utils/historicalDataUtil')

const fs = require('fs')

const checkOrder = (old, new_) => {
    if (old.length !== new_.length) return false;
    for (let i = 0; i < old.length; i++) {
        if (old[i].id !== new_[i].id) {
            // console.log(old[i].id, new_[i].id)
            return false;
        }
    }
    return true;
}

const checkIfValidationIsPossible = (
    ticker_hist_length
    , time_step
    , look_ahead
    , training_size
    , batchSize
    , do_validation
) => {
    const messages = {
        train_possible: {
            status: true,
            message: '',
            train_fraction: 0,
            samples: 0,
            total_train_batches: 0,
        },
        test_possible: {
            status: true,
            message: '',
            test_fraction: 0,
            samples: 0,
        },
        recommendation: [],
    };

    // @ts-ignore
    const training_fraction = Math.floor((ticker_hist_length * training_size) / 100); // eg. 80% of the data
    const test_fraction = ticker_hist_length - training_fraction; // eg. 20% of the data

    messages.train_possible.train_fraction = training_fraction;
    messages.test_possible.test_fraction = test_fraction;

    const train_features = training_fraction - time_step - look_ahead + 1 // Train features calculated based on timestep and lookahead
    if (train_features > 0) {
        messages.train_possible.samples = train_features;
        const train_batches = Math.ceil(train_features / batchSize);
        if (train_batches < 1) {
            const required_slice_index = Math.ceil((batchSize + time_step + look_ahead - 1) / (training_size / 100));
            messages.train_possible.status = false;
            messages.train_possible.message = `Reduce the batch size to ${train_features} or less, or increase the slice index to ${required_slice_index}`
        } else {
            messages.train_possible.total_train_batches = train_batches
        }
    } else {
        messages.train_possible.status = false;
        messages.train_possible.message = `Increase the training size to ${training_fraction + time_step + look_ahead - 1} or more`
    }

    const test_features = test_fraction - time_step - look_ahead + 1
    if (test_features > 0) {
        messages.test_possible.samples = test_features;

        if (time_step + look_ahead > test_fraction && do_validation) {
            const required_train_percentage = (training_fraction - time_step - look_ahead) / ticker_hist_length;
            const required_slice_index = Math.ceil((time_step + look_ahead) / ((100 - training_size) / 100));
            messages.test_possible.status = false;
            messages.test_possible.message = `Decrease the train size to below ${parseFloat((required_train_percentage * 100).toFixed(2))}% or increase the slice index to ${required_slice_index}`;
        }
    } else {
        const required = -test_features + test_fraction + 1
        const required_sliceIndex = Math.ceil(required / ((100 - training_size) / 100));
        const required_percentage = required / ticker_hist_length
        console.log(required, required_sliceIndex, required_percentage)
        messages.test_possible.status = false;
        messages.test_possible.message = `Increase the slice index to ${required_sliceIndex} or more or decrease the training size below ${((1 - required_percentage) * 100).toFixed(2)}%`;
    }

    return messages
}

const getDifferentKeys = (obj1, obj2) => {
    const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    const differentKeys = [];

    keys.forEach(key => {
        if (obj1[key] !== obj2[key]) {
            differentKeys.push(key);
        }
    });

    return differentKeys;
}

const deleteWGANModelAndLogs = async (model_id) => {
    try {
        const log_path = `./worker_celery/logs/${model_id}`
        const model_path = `./worker_celery/saved_models/${model_id}`

        if (fs.existsSync(log_path)) {
            fs.rm(log_path, { recursive: true }, (err) => {
                if (err) {
                    throw err;
                }
                log.info(`Removed log files : ${model_id}`)
            });
            // return true
        } else {
            log.info(`Log file not found for : ${model_id}`)
        }

        if (fs.existsSync(model_path)) {
            fs.rm(model_path, { recursive: true }, (err) => {
                if (err) {
                    throw err
                }
                log.info(`Removed model files : ${model_id}`)
            });
            return true
        } else {
            log.info(`Model file not found for : ${model_id}`)
        }

    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const deleteIntermediateCheckpoints = async (model_id, last_checkpoint) => {
    const path = `./worker_celery/saved_models/${model_id}`
    try {
        if (fs.existsSync(path)) {
            const last_cp_number = parseInt(last_checkpoint.split('_')[1])
            console.log('Last cp nu', last_cp_number)

            const checkpoints_to_remove = fs.readdirSync(path, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .filter((folder) => {
                    const match = folder.name.match(/^checkpoint_(\d+)$/);
                    if (match) {
                        const checkpointNumber = parseInt(match[1], 10);
                        return checkpointNumber > last_cp_number;
                    }
                    return false
                })
                .map((folder) => folder.name)
            console.log('Checkpoints to remove', checkpoints_to_remove)

            checkpoints_to_remove.forEach((checkpoint) => {
                const checkpoint_path = `${path}/${checkpoint}`
                fs.rm(checkpoint_path, { recursive: true }, (err) => {
                    if (err) {
                        throw err;
                    }
                    log.info(`Removed checkpoint : ${checkpoint}`)
                });
            })

            return true
        } else {
            log.info(`Model file not found for : ${model_id}`)
            return false
        }

    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const deleteModelFromLocalDirectory = async (model_id) => {
    try {
        const path = `./models/${model_id}` // delete a directory in models with the foldername as model_id us fs
        if (fs.existsSync(path)) {
            fs.rm(path, { recursive: true }, (err) => {
                if (err) {
                    throw err;
                }
                log.info(`Removed model : ${model_id}`)
            });
            return true
        } else {
            log.info(`Model file not found for : ${model_id}`)
        }
    } catch (error) {
        log.error(error.stack)
        throw error
    }
}

const getSavedModelCheckPoint = (model_id) => {
    const model_path = `./worker_celery/saved_models/${model_id}`
    let checkpoints = []
    if (fs.existsSync(model_path)) {
        // console.log('Model data present')
        checkpoints = fs.readdirSync(model_path, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name)
            .filter(name => name.startsWith('checkpoint'));
    } else {
        console.log('Model data does not exist')
    }
    return checkpoints
}

// calculate the no of ticker data to fetch based on the model_first_prediction_date
const calcuteTotalTickerCountForForecast = (train_period, first_date) => {
    const periofInMs = HDUtil.periodToMilliseconds(train_period)
    const dateNow = Date.now()
    const diff = dateNow - first_date
    const totalTickerCount = Math.floor(diff / periofInMs)
    return totalTickerCount
}

function getCriticalValue(confidenceLevel) {
    // For a 95% confidence level, the critical value from the standard normal distribution is approximately 1.96
    // You can replace this function with a lookup table or use a library for more accurate critical values
    // For smaller sample sizes, consider using the t-distribution instead
    switch (confidenceLevel) {
        case 0.90:
            return 1.645; // 90% confidence level
        case 0.95:
            return 1.96; // 95% confidence level
        case 0.99:
            return 2.576; // 99% confidence level
        default:
            return 1.96; // Default to 95% confidence level
    }
}

function calculatACF(data, lag) {
    // Calculate the mean of the data
    const mean = data.reduce((acc, val) => acc + val, 0) / data.length;

    // Calculate the auto-correlation for each lag value
    const autoCorrelations = [];
    for (let i = 0; i <= lag; i++) {
        let sum = 0;
        for (let j = 0; j < data.length - i; j++) {
            sum += (data[j] - mean) * (data[j + i] - mean);
        }
        autoCorrelations.push(sum);
    }

    // Normalize the auto-correlation values
    const normalizedACF = autoCorrelations.map((value, index) => {
        return value / autoCorrelations[0]; // Divide by auto-correlation at lag 0
    });

    return normalizedACF;
}

function calculatePACF(acf, maxLag) {
    const partialAutocorrs = [];
    // Initialize arrays
    let phi = [];
    let newPhi = [];
    phi[0] = acf[0]
    newPhi[0] = acf[0]
    partialAutocorrs.push(phi[0]);

    // Calculate partial autocorrelations
    for (let m = 1; m <= maxLag; m++) {
        let sumTop = 0;
        let sumBottom = 0;

        for (let j = 1; j < m; j++) {
            sumTop += phi[j] * acf[m - j];
            sumBottom += phi[j] * acf[j];
        }

        const new_phi_val = (acf[m] - sumTop) / (1 - sumBottom);
        newPhi[m] = new_phi_val

        for (let k = 1; k < m; k++) {
            newPhi[k] = phi[k] - newPhi[m] * phi[m - k];
        }

        for (let k = 0; k <= m; k++) {
            phi[k] = newPhi[k];
        }
        partialAutocorrs.push(newPhi[m]);
    }
    return partialAutocorrs;
}

const calculate_confidence_interval = (pacfValues, confidence_level, n) => {
    const zAlphaOver2 = getCriticalValue(confidence_level);

    // Calculate standard error
    const stdErr = 1 / Math.sqrt(n);

    // Calculate margin of error
    const marginOfError = zAlphaOver2 * stdErr;
    // Calculate confidence intervals
    const confidenceIntervals = pacfValues.map(pacf =>
        pacf === 1 ? [pacf, pacf] : [pacf - marginOfError, pacf + marginOfError]
    )

    return confidenceIntervals;
}

module.exports = {
    checkOrder
    , checkIfValidationIsPossible
    , getDifferentKeys
    , deleteWGANModelAndLogs
    , deleteIntermediateCheckpoints
    , deleteModelFromLocalDirectory
    , getSavedModelCheckPoint
    , calcuteTotalTickerCountForForecast
    , calculatACF
    , calculatePACF
    , calculate_confidence_interval
}