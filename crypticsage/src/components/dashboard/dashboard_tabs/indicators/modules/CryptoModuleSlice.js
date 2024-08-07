import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from 'uuid';
import axios from "axios";
const baseUrl = process.env.NODE_ENV === 'development' ? process.env.REACT_APP_BASEURL : process.env.REACT_APP_NGROK_URL;

const lineColors = [
    '#D32F2F', // Red
    '#F57C00', // Orange
    '#1976D2', // Blue
    '#7B1FA2', // Purple
    '#00796B', // Teal
    '#689F38', // Light Green
    '#512DA8', // Deep Purple
    '#0097A7', // Cyan
    '#C2185B', // Pink
    '#388E3C', // Green
    '#303F9F', // Indigo
    '#AFB42B', // Lime
    '#FFA000', // Amber
    '#5D4037', // Brown
    '#616161', // Gray
    '#FBC02D', // Yellow
    '#E64A19', // Deep Orange
    '#0288D1', // Light Blue
    '#C0CA33', // Lime Green
    '#455A64', // Blue Gray
];

export const executeAllSelectedFunctions = createAsyncThunk(
    'cryptoModule/sendApiRequests',
    async (data, thunkAPI) => {
        const { fTalibExecuteQuery: finalTalibExecuteQuery, uid } = data
        const allResponses = []
        for (const queryObj of finalTalibExecuteQuery) {
            const { id, payload } = queryObj;
            try {
                const response = await axios.post(`${baseUrl}/indicators/execute_talib_function`, { payload, uid }, {})
                allResponses.push({ id, result: response.data.result })
            } catch (error) {
                console.log(error)
            }
        }
        // console.log("Execute response",allResponses)
        return allResponses;
    })

const initialState = {
    toolTipOn: false,
    showPredictions: true,
    barsFromTo: { from: 0, to: 0 },
    barsFromToPredictions: { from: 0, to: 0 },
    selectedTickerName: '',
    selectedTickerPeriod: '4h',
    total_count_db: 0,
    talibDescription: [],
    talibDescriptionCopy: [],
    cryptoDataInDb: [],
    ticker_expiration: 0,
    streamedTickerData: [],
    selectedFunctions: [],
    modifiedSelectedFunctionWithDataToRender: [],
    processSelectedFunctionsOnMoreData: false,
    userModels: [],
    partial_chart_reset_flag: false,
    modelData: {
        model_id: '',
        task_id: '',
        initial_training_completed: false,
        first_save: false,
        model_name: '',
        model_saved_to_db: false,
        retrain_history_saved: false,
        training_parameters: {
            to_train_count: 0,
            trainingDatasetSize: 80,
            timeStep: 14,
            lookAhead: 1,
            epoch: 1,
            hiddenLayer: 1,
            multiSelectValue: 'close',
            modelType: 'WGAN-GP',
            intermediateResultStep: "50",
            modelSaveStep: "50",
            batchSize: 32,
            transformation_order: [
                { id: '1', name: 'OPEN', value: 'open', key: 'open' },
                { id: '2', name: 'HIGH', value: 'high', key: 'high' },
                { id: '3', name: 'LOW', value: 'low', key: 'low' },
                { id: '4', name: 'CLOSE', value: 'close', key: 'close' },
                { id: '5', name: 'VOLUME', value: 'volume', key: 'volume' },
            ],
            doValidation: false,
            earlyStopping: false,
            learningRate: 50,
            scaledLearningRate: 0.001,
            d_learningRate: 40,
            g_learningRate: 10,
            scaled_d_learningRate: 0.0004,
            scaled_g_learningRate: 0.0001,
            discriminator_iteration: 5
        },
        talibExecuteQueries: [],
        modelStartTime: '',
        modelEndTime: '',
        startWebSocket: false,
        retraining_flag: false,
        loading_from_saved_model: false,
        progress_message: [],
        epoch_no: 0,
        correlation_data: null,
        epoch_results: [],
        predictedValues: {
            dates: [],
            standardized: [],
            scaled: []
        },
        wgan_intermediate_forecast: [],
        wgan_final_forecast: {
            predictions: [],
            rmse: {}
        },
        predictionPaletteId: 0,
        lastLookAheadPredictions: [],
        score: {
            over_all_score: 0,
            scores: []
        },
        loaded_checkpoints: {
            checkpoints: [],
            selectedCheckpoint: ''
        }
    },
    quick_forecasts: {}
}

const cryptoModuleSlice = createSlice({
    name: 'cryptoModule',
    initialState,
    reducers: {
        setPartialChartResetFlag: (state, action) => {
            state.partial_chart_reset_flag = action.payload;
        },
        setLastSessionData: (state, action) => {
            const { session, data, saved } = action.payload
            let epoch_results, train_duration, training_parameters, wgan_intermediate_forecast, wgan_final_forecast, model_created_date
            if (session === 1) {
                ({
                    epoch_results,
                    train_duration,
                    training_parameters,
                    wgan_intermediate_forecast,
                    wgan_final_forecast,
                } = data.model_data);
                model_created_date = data.model_created_date
            } else {
                ({
                    epoch_results,
                    train_duration,
                    training_parameters,
                    wgan_intermediate_forecast,
                    wgan_final_forecast,
                    model_created_date
                } = data);
            }
            const last_epoch = epoch_results[epoch_results.length - 1].epoch

            state.modelData.epoch_results = state.modelData.epoch_results.filter(e_res => e_res.epoch <= last_epoch)
            state.modelData.modelEndTime = model_created_date
            state.modelData.modelStartTime = model_created_date - train_duration
            state.modelData.training_parameters = training_parameters
            state.modelData.wgan_intermediate_forecast = wgan_intermediate_forecast
            state.modelData.wgan_final_forecast = wgan_final_forecast
            state.modelData.epoch_no = last_epoch

            if (session === 1) {
                state.modelData.model_saved_to_db = saved === undefined ? false : saved
            } else {
                state.modelData.retrain_history_saved = saved === undefined ? false : saved
            }

            state.modelData.loaded_checkpoints.checkpoints = []
            state.modelData.loaded_checkpoints.selectedCheckpoint = ""

        },
        setUserModels: (state, action) => {
            // Create a map from the payload for quick lookup
            const payloadModelMap = action.payload.reduce((map, payloadModel) => {
                map[payloadModel.model_id] = payloadModel;
                return map;
            }, {});

            // Filter out models that are not present in the payload
            state.userModels = state.userModels.filter(model => payloadModelMap[model.model_id]);

            action.payload.forEach(payloadModel => {
                const existingModelIndex = state.userModels.findIndex(model => model.model_id === payloadModel.model_id)
                if (existingModelIndex !== -1) {
                    const existingData = state.userModels[existingModelIndex]

                    if (existingData.model_type === 'WGAN-GP' && payloadModel.additional_training_run_results.length > existingData.additional_training_run_results.length) {
                        state.userModels[existingModelIndex] = payloadModel
                    }
                } else {
                    state.userModels.push(payloadModel)
                }
            })
        },
        setModelSavedToDb: (state, action) => {
            state.modelData.model_saved_to_db = action.payload.status
            state.modelData.model_name = action.payload.model_name
            state.modelData.first_save = action.payload.status
        },
        setRetrainHistorySavedToDb: (state, action) => {
            state.modelData.retrain_history_saved = action.payload
        },
        setModelId: (state, action) => {
            state.modelData.model_id = action.payload.model_id;
        },
        setTaskId: (state, action) => {
            state.modelData.task_id = action.payload.task_id
        },
        setModelType: (state, action) => {
            state.modelData.training_parameters.modelType = action.payload;
        },
        setTrainingParameters: (state, action) => {
            const { model_params, transformationOrder, selected_functions, model_name, task_id } = action.payload
            state.modelData.training_parameters = { ...model_params, transformation_order: transformationOrder };
            state.modelData.talibExecuteQueries = selected_functions;
            state.modelData.model_name = model_name;
            state.modelData.task_id = task_id || ''
        },
        setRetrainParameters: (state, action) => {
            const { model_id, model_name, model_saved_to_db, retrainParams } = action.payload;
            if (model_id !== undefined || model_name !== undefined) {
                state.modelData.model_id = model_id;
                state.modelData.model_name = model_name;
                state.modelData.training_parameters = { ...retrainParams }
            } else {
                state.modelData.model_saved_to_db = model_saved_to_db
                state.modelData.training_parameters = { ...retrainParams }
            }
        },
        setStartWebSocket: (state, action) => {
            state.modelData.startWebSocket = action.payload;
        },
        setRetrainingFlag: (state, action) => {
            state.modelData.retraining_flag = action.payload;
            if (action.payload === true) {
                state.modelData.wgan_final_forecast = {
                    predictions: [],
                    rmse: {}
                };
            }
        },
        setLoadingFromSavedModel: (state, action) => {
            state.modelData.loading_from_saved_model = action.payload;
            state.modelData.first_save = action.payload;
        },
        sliceEpochResults: (state, action) => {
            const { selected_cp_no, from_ } = action.payload
            if (from_ === 'retrain_wgan') {
                state.modelData.epoch_results = state.modelData.epoch_results.slice(0, selected_cp_no);
            } else if (from_ === 'training_params') {
                if (state.modelData.epoch_results.length > 0) {
                    state.modelData.epoch_results = state.modelData.epoch_results.filter((er) => er.epoch <= selected_cp_no);
                }
            }
        },
        setLoadedCheckpoints: (state, action) => {
            state.modelData.loaded_checkpoints.checkpoints = action.payload.checkpoints;
            state.modelData.loaded_checkpoints.selectedCheckpoint = action.payload.selectedCheckpoint;
        },
        setModelStartTime: (state, action) => {
            state.modelData.modelStartTime = action.payload;
        },
        setModelEndTime: (state, action) => {
            state.modelData.modelEndTime = action.payload;
        },
        setFeatureCorrelationData: (state, action) => {
            state.modelData.correlation_data = action.payload;
        },
        setPredictedValues: (state, action) => {
            state.modelData.predictedValues = { ...state.modelData.predictedValues, ...action.payload };
        },
        setIntermediateForecastResults: (state, action) => {
            const takenColors = state.modelData.wgan_intermediate_forecast.map((forecast) => forecast.color);
            const availableColors = lineColors.filter((color) => !takenColors.includes(color));
            state.modelData.wgan_intermediate_forecast.push({ ...action.payload, color: availableColors[0], show: true });
        },
        setWganFinalForecast: (state, action) => {
            state.modelData.wgan_final_forecast = action.payload;
            state.modelData.initial_training_completed = true;
        },
        setQuickForecasts: (state, action) => {
            const { symbol, ...rest } = action.payload
            if (state.quick_forecasts[symbol] === undefined) {
                state.quick_forecasts[symbol] = [{
                    id: uuidv4(),
                    ...rest
                }]
            } else {
                state.quick_forecasts[symbol].push({
                    id: uuidv4(),
                    ...rest
                })
            }
            // state.quick_forecasts = state.quick_forecasts.concat(action.payload);
        },
        updatePredictedValues: (state, action) => { // Not being used anymore in Saved LSTM and WGAN-GP
            const { model_id, rmse, forecast, predictions_array, initial_forecast } = action.payload
            const currentState = state.userModels
            const foundIndex = currentState.findIndex((model) => model.model_id === model_id);

            if (foundIndex !== -1) {
                currentState[foundIndex].model_data.predicted_result = {
                    ...currentState[foundIndex].model_data.predicted_result,
                    rmse: rmse,
                    forecast: forecast,
                    predictions_array: predictions_array,
                    initial_forecast: initial_forecast
                }
            }
        },
        setModelDataAvailableFlag: (state, action) => { // Not being used anymore in Saved LSTM
            const { model_id, status } = action.payload
            const currentState = state.userModels
            const foundIndex = currentState.findIndex((model) => model.model_id === model_id);

            if (foundIndex !== -1) {
                currentState[foundIndex]['model_data_available'] = status
            }
            state.userModels = currentState;
        },
        setNewForecastData: (state, action) => {
            const { model_id, final_forecast } = action.payload
            const currentState = state.userModels

            const foundIndex = currentState.findIndex((model) => model.model_id === model_id);

            if (foundIndex !== -1) {
                currentState[foundIndex].model_data.latest_forecast_result = final_forecast
            }
            state.userModels = currentState;
        },
        renameModel: (state, action) => {
            const { model_id, newModelName } = action.payload
            const currentState = state.userModels
            const foundIndex = currentState.findIndex((model) => model.model_id === model_id);

            if (foundIndex !== -1) {
                currentState[foundIndex].model_name = newModelName
            }
            state.userModels = currentState;
        },
        setPredictionPaletteId: (state, action) => {
            state.modelData.predictionPaletteId = action.payload;
        },
        setPredictionScores: (state, action) => {
            state.modelData.score.over_all_score = action.payload.rmse;
            state.modelData.score.scores = action.payload.scores;
        },
        setStandardizedAndScaledPredictions: (state, action) => {
            state.modelData.predictedValues.standardized = action.payload.standardized;
            state.modelData.predictedValues.scaled = action.payload.scaled;
            state.modelData.lastLookAheadPredictions = action.payload.lastData
        },
        setBarsFromToPredictions: (state, action) => {
            state.barsFromToPredictions = action.payload;
        },
        setProgressMessage: (state, action) => {
            state.modelData.progress_message = [action.payload, ...state.modelData.progress_message];
        },
        setEpochNo: (state, action) => {
            state.modelData.epoch_no = action.payload;
        },
        setEpochResults: (state, action) => {
            state.modelData.epoch_results.push(action.payload);
        },
        resetPredictionsValue: (state) => {
            state.modelData.predictedValues = {};
        },
        resetCurrentModelData: (state) => {
            state.modelData.training_parameters.transformation_order = [
                { id: '1', name: 'OPEN', value: 'open', key: 'open' },
                { id: '2', name: 'HIGH', value: 'high', key: 'high' },
                { id: '3', name: 'LOW', value: 'low', key: 'low' },
                { id: '4', name: 'CLOSE', value: 'close', key: 'close' },
                { id: '5', name: 'VOLUME', value: 'volume', key: 'volume' }
            ];
            state.modelData.epoch_results = [];
            state.modelData.correlation_data = null;
            state.modelData.epoch_no = initialState.modelData.epoch_no;
            state.modelData.predictedValues = {
                dates: [],
                standardized: [],
                scaled: []
            };
            state.modelData.progress_message = [];
            state.modelData.model_name = '';
            state.modelData.score = {
                over_all_score: 0,
                scores: []
            };
            state.barsFromToPredictions = { from: 0, to: 0 };
            state.modelData.lastLookAheadPredictions = [];
            state.modelData.model_id = '';
            state.modelData.modelStartTime = '';
            state.modelData.modelEndTime = '';
            state.modelData.task_id = '';
            state.modelData.initial_training_completed = false;
            state.modelData.first_save = false;
            state.modelData.loaded_checkpoints = {
                checkpoints: [],
                selectedCheckpoint: ''
            }

            state.modelData.wgan_final_forecast = {
                predictions: [],
                rmse: {}
            };
            state.modelData.wgan_intermediate_forecast = [];
        },
        resetModelData: (state) => {
            state.modelData.epoch_results = [];
            state.modelData.correlation_data = null;
            state.modelData.epoch_no = initialState.modelData.epoch_no;
            state.modelData.predictedValues = {
                dates: [],
                standardized: [],
                scaled: []
            };
            state.modelData.progress_message = [];
            state.modelData.model_name = '';
            state.modelData.score = {
                over_all_score: 0,
                scores: []
            };
            state.barsFromToPredictions = { from: 0, to: 0 }
            state.modelData.lastLookAheadPredictions = [];
            state.modelData.model_id = '';
            state.modelData.modelEndTime = '';
            state.modelData.task_id = '';
            state.modelData.initial_training_completed = false;
            state.modelData.first_save = false;
            state.modelData.model_saved_to_db = false;
            state.modelData.retrain_history_saved = false;
            state.modelData.loading_from_saved_model = false;
            state.modelData.loaded_checkpoints = {
                checkpoints: [],
                selectedCheckpoint: ''
            }
            // const co_relationData = state.modelData.correlation_data
            state.modelData.training_parameters = {
                ...initialState.modelData.training_parameters,
                modelType: state.modelData.training_parameters.modelType,
                to_train_count: state.total_count_db * 0.5 > 1000 ? 1000 : state.total_count_db * 0.5
            }
            // state.modelData = { ...state.modelData }
            state.modelData.talibExecuteQueries = [];
            state.modelData.wgan_final_forecast = {
                predictions: [],
                rmse: {}
            };
            state.modelData.wgan_intermediate_forecast = [];
        },
        toggleToolTipSwitch: (state) => {
            state.toolTipOn = !state.toolTipOn;
        },
        toggleShowPredictionSwitch: (state) => {
            state.showPredictions = !state.showPredictions;
        },
        setBarsFromTo: (state, action) => {
            state.barsFromTo = action.payload;
        },
        toggleProcessSelectedFunctionsOnMoreData: (state, action) => {
            state.processSelectedFunctionsOnMoreData = action.payload;
        },
        setTalibDescription: (state, action) => {
            state.talibDescription = action.payload;
            state.talibDescriptionCopy = action.payload;
        },
        setSelectedFlagInTalibDescription: (state, action) => {
            const { group, name, inputs, optInputs } = action.payload;
            const currentState = state.talibDescription;

            // Find the group in currentState
            const foundGroupIndex = currentState.findIndex((grp) => grp.group_name === group);

            if (foundGroupIndex !== -1) {
                const foundGroup = currentState[foundGroupIndex];

                // Find the function within the group
                const foundFunctionIndex = foundGroup.functions.findIndex((func) => func.name === name);

                if (foundFunctionIndex !== -1) {
                    // Update the inputs and optInputs of the function
                    foundGroup.functions[foundFunctionIndex].inputs = inputs;
                    foundGroup.functions[foundFunctionIndex].optInputs = optInputs;
                    foundGroup.functions[foundFunctionIndex].function_selected_flag = true;

                    // Update the state.talibDescription with the updated group
                    currentState[foundGroupIndex] = foundGroup;
                }
            }

            state.talibDescription = currentState;
        },
        setSelectedTickerName: (state, action) => {
            state.selectedTickerName = action.payload;
        },
        setSelectedTickerPeriod: (state, action) => {
            state.selectedTickerPeriod = action.payload;
            state.cryptoDataInDb = [];
            state.talibDescription = state.talibDescriptionCopy;
            state.selectedFunctions = [];
            state.modifiedSelectedFunctionWithDataToRender = [];
            state.barsFromTo = { from: 0, to: 0 };
        },
        setCryptoDataInDbRedux: (state, action) => {
            const { dataInDb, total_count_db, expires_at } = action.payload;
            state.ticker_expiration = expires_at !== undefined ? expires_at : state.ticker_expiration;
            state.cryptoDataInDb = dataInDb;
            state.total_count_db = total_count_db === 0 ? 0 : total_count_db;
            state.modelData.training_parameters.to_train_count = total_count_db * 0.5 > 1000 ? 1000 : total_count_db * 0.5
        },
        setStreamedTickerDataRedux: (state, action) => {
            state.streamedTickerData.push(action.payload);
        },
        resetStreamedTickerDataRedux: (state) => {
            state.streamedTickerData = [];
        },
        setSelectedFunctions: (state, action) => {
            const { name, hint, group_name, outputs, function_selected_flag, inputs, optInputs, result, splitPane } = action.payload;
            const currentState = state.selectedFunctions;
            const diffVal = optInputs.length > 0 ? optInputs[0].defaultValue : ''
            const foundFunction = currentState.find((func) => func.name === name);
            if (!foundFunction) {
                let newId = uuidv4();
                const objectToPush = {
                    name: name,
                    hint: hint,
                    outputs: outputs,
                    group_name: group_name,
                    function_selected_flag: function_selected_flag,
                    splitPane: splitPane,
                    functions: [
                        {
                            id: newId,
                            name: name,
                            display_name: `${name}_${diffVal}`,
                            inputs: inputs,
                            optInputs: optInputs,
                            outputAvailable: result.length > 0 ? true : false,
                            show_chart_flag: result.length > 0 ? true : false,
                            differentiatorValue: diffVal,
                            show_settings: false,
                        }
                    ]
                }
                state.selectedFunctions.push(objectToPush)
                let colorsTaken = state.modifiedSelectedFunctionWithDataToRender.map((func) => func.color);
                let colorsAvailableForCharts = lineColors.filter((color) => !colorsTaken.includes(color));
                // console.log(result)
                result.forEach((differentOutputs, i) => {
                    const objectForChart = {
                        id: newId,
                        name: name,
                        display_name: `${name}_${diffVal}`,
                        result: differentOutputs.data,
                        visible: true,
                        key: differentOutputs.key,
                        differentiatorValue: diffVal,
                        isDataNew: false,
                        splitPane: splitPane,
                        color: colorsAvailableForCharts[i]
                    }
                    state.modifiedSelectedFunctionWithDataToRender.push(objectForChart)
                })

            } else {
                // console.log('Existing in redux')
                const foundIndex = currentState.findIndex((func) => func.name === name);
                currentState[foundIndex].functions.push(
                    {
                        id: uuidv4(),
                        name: name,
                        display_name: `${name}_${diffVal}`,
                        inputs: inputs,
                        optInputs: optInputs,
                        outputAvailable: result.length > 0 ? true : false,
                        show_chart_flag: false,
                        differentiatorValue: diffVal,
                        show_settings: false,
                    }
                );
                state.selectedFunctions = currentState;
            }
        },
        setSelectedFunctionInputValues: (state, action) => {
            const { fieldName, value, id, name } = action.payload;
            const currentState = state.selectedFunctions;
            // Find the index of the function by name
            const foundFunctionIndex = currentState.findIndex((func) => func.name === name);

            if (foundFunctionIndex !== -1) {
                const foundFunction = currentState[foundFunctionIndex];

                // Find the index of the function to update within the found function's functions array
                const foundFunctionToUpdateIndex = foundFunction.functions.findIndex((func) => func.id === id);

                if (foundFunctionToUpdateIndex !== -1) {
                    // Create a copy of the function to update
                    const updatedFunction = { ...foundFunction.functions[foundFunctionToUpdateIndex] };

                    // Update the inputs array within the function
                    updatedFunction.inputs = updatedFunction.inputs.map((input) => {
                        if (input.name === fieldName) {
                            return {
                                ...input,
                                value: value,
                                errorFlag: false,
                                helperText: '',
                            };
                        }
                        return input;
                    });

                    // Update the function within the found function's functions array
                    foundFunction.functions[foundFunctionToUpdateIndex] = updatedFunction;

                    // Update the currentState with the modified function
                    currentState[foundFunctionIndex] = foundFunction;
                }
            }

            // Finally, update the state with the modified currentState
            state.selectedFunctions = currentState;
        },
        setFunctionInputErrorFlagAndMessage: (state, action) => {
            const { name, id, inputs } = action.payload;
            const currentState = state.selectedFunctions;
            // Find the index of the function by name
            const foundFunctionIndex = currentState.findIndex((func) => func.name === name);

            if (foundFunctionIndex !== -1) {
                const foundFunction = currentState[foundFunctionIndex];

                // Find the index of the function to update within the found function's functions array
                const foundFunctionToUpdateIndex = foundFunction.functions.findIndex((func) => func.id === id);

                if (foundFunctionToUpdateIndex !== -1) {
                    // Create a copy of the function to update
                    const updatedFunction = { ...foundFunction.functions[foundFunctionToUpdateIndex] };

                    // Update the inputs array within the function
                    updatedFunction.inputs = inputs;

                    // Update the function within the found function's functions array
                    foundFunction.functions[foundFunctionToUpdateIndex] = updatedFunction;

                    // Update the currentState with the modified function
                    currentState[foundFunctionIndex] = foundFunction;
                }
            }

            // Finally, update the state with the modified currentState
            state.selectedFunctions = currentState;

        },
        setSelectedFunctionOptionalInputValues: (state, action) => {
            const { fieldName, value, id, name } = action.payload;
            const currentState = state.selectedFunctions;
            // Find the index of the function by name
            const foundFunctionIndex = currentState.findIndex((func) => func.name === name);

            if (foundFunctionIndex !== -1) {
                const foundFunction = currentState[foundFunctionIndex];

                // Find the index of the function to update within the found function's functions array
                const foundFunctionToUpdateIndex = foundFunction.functions.findIndex((func) => func.id === id);

                if (foundFunctionToUpdateIndex !== -1) {
                    // Create a copy of the function to update
                    const updatedFunction = { ...foundFunction.functions[foundFunctionToUpdateIndex] };

                    // Update the inputs array within the function
                    updatedFunction.optInputs = updatedFunction.optInputs.map((input) => {
                        if (input.name === fieldName) {
                            const defaultValue = value; // Convert value to integer if needed
                            const errorFlag = defaultValue === '' ? true : false;
                            const helperText = errorFlag ? 'Default value cannot be null' : '';
                            return {
                                ...input,
                                defaultValue,
                                errorFlag,
                                helperText,
                            };
                        }
                        return input;
                    });
                    updatedFunction.differentiatorValue = updatedFunction.optInputs[0].defaultValue;
                    // let diffValue = updatedFunction.optInputs[0].defaultValue;
                    // console.log(diffValue);

                    // Update the function within the found function's functions array
                    foundFunction.functions[foundFunctionToUpdateIndex] = updatedFunction;

                    // Update the currentState with the modified function
                    currentState[foundFunctionIndex] = foundFunction;
                }
            }

            // Finally, update the state with the modified currentState
            state.selectedFunctions = currentState;
        },
        setTalibResult: (state, action) => {
            const { name, id, optInputs, result } = action.payload;
            const currentState = state.selectedFunctions;
            // Find the index of the function by name
            const foundFunctionIndex = currentState.findIndex((func) => func.name === name);
            let splitPane
            // setting outputAvailable to true
            if (foundFunctionIndex !== -1) {
                const foundFunction = currentState[foundFunctionIndex];
                splitPane = foundFunction.splitPane
                // Find the index of the function to update within the found function's functions array
                const foundFunctionToUpdateIndex = foundFunction.functions.findIndex((func) => func.id === id);

                if (foundFunctionToUpdateIndex !== -1) {
                    // Create a copy of the function to update
                    const updatedFunction = { ...foundFunction.functions[foundFunctionToUpdateIndex] };

                    // Update the inputs array within the function
                    updatedFunction.outputAvailable = true;
                    updatedFunction.show_chart_flag = true;
                    const df_value = optInputs[0]?.defaultValue || ''
                    // console.log(df_value)
                    updatedFunction.display_name = `${name}_${df_value}`;

                    // Update the function within the found function's functions array
                    foundFunction.functions[foundFunctionToUpdateIndex] = updatedFunction;

                    // Update the currentState with the modified function
                    currentState[foundFunctionIndex] = foundFunction;

                }
            }
            // Finally, update the state with the modified currentState
            state.selectedFunctions = currentState;

            const diffVal = optInputs.length > 0 ? optInputs[0].defaultValue : ''
            let colorsTaken = state.modifiedSelectedFunctionWithDataToRender.map((func) => func.color);
            let colorsAvailableForCharts = lineColors.filter((color) => !colorsTaken.includes(color));
            result.forEach((differentOutputs, i) => {
                const objectForChart = {
                    id: id,
                    name: name,
                    display_name: `${name}_${diffVal}`,
                    result: differentOutputs.data,
                    visible: true,
                    key: differentOutputs.key,
                    differentiatorValue: diffVal,
                    isDataNew: false,
                    color: colorsAvailableForCharts[i],
                    splitPane: splitPane
                }

                // Check if an object with the same 'key' exists in the array
                const existingObjectIndex = state.modifiedSelectedFunctionWithDataToRender.findIndex((item) => item.id === id && item.key === objectForChart.key);
                if (existingObjectIndex !== -1) {
                    // If an object with the same 'key' exists, update it
                    objectForChart.visible = true;
                    objectForChart.isDataNew = true;
                    objectForChart.color = state.modifiedSelectedFunctionWithDataToRender[existingObjectIndex].color;
                    state.modifiedSelectedFunctionWithDataToRender[existingObjectIndex] = { ...state.modifiedSelectedFunctionWithDataToRender[existingObjectIndex], ...objectForChart };
                } else {
                    // If no object with the same 'key' exists, push the new object
                    state.modifiedSelectedFunctionWithDataToRender.push(objectForChart);
                }
            })
        },
        toggleShowHideIntermediatePredictions: (state, action) => {
            const { key } = action.payload
            const current_state = state.modelData.wgan_intermediate_forecast

            const foundIndex = current_state.findIndex((forecast) => forecast.epoch === key)

            if (foundIndex !== -1) {
                current_state[foundIndex].show = !current_state[foundIndex].show
            }

            state.modelData.wgan_intermediate_forecast = current_state
        },
        toggleShowHideChartFlag: (state, action) => {
            const { id, name } = action.payload;
            const currentState = state.selectedFunctions;
            // Find the index of the function by name
            const foundFunctionIndex = currentState.findIndex((func) => func.name === name);

            if (foundFunctionIndex !== -1) {
                const foundFunction = currentState[foundFunctionIndex];

                // Find the index of the function to update within the found function's functions array
                const foundFunctionToUpdateIndex = foundFunction.functions.findIndex((func) => func.id === id);

                if (foundFunctionToUpdateIndex !== -1) {
                    // Create a copy of the function to update
                    const updatedFunction = { ...foundFunction.functions[foundFunctionToUpdateIndex] };

                    // Update the show_chart_flag
                    updatedFunction.show_chart_flag = !updatedFunction.show_chart_flag;

                    // Update the function within the found function's functions array
                    foundFunction.functions[foundFunctionToUpdateIndex] = updatedFunction;

                    // Update the currentState with the modified function
                    currentState[foundFunctionIndex] = foundFunction;
                }
            }

            // Finally, update the state with the modified currentState
            state.selectedFunctions = currentState;

            const currentStateModified = state.modifiedSelectedFunctionWithDataToRender;

            const filteredFunctionsById = currentStateModified.filter((func) => func.id === id);

            if (filteredFunctionsById.length > 0) {
                filteredFunctionsById.forEach((filteredFunc) => {
                    filteredFunc.visible = !filteredFunc.visible;
                    const foundFunctionIndexModified = currentStateModified.findIndex((func) => func.id === id && filteredFunc.key === func.key);
                    currentStateModified[foundFunctionIndexModified] = filteredFunc;
                })
            }

            state.modifiedSelectedFunctionWithDataToRender = currentStateModified;
        },
        toggleShowSettingsFlag: (state, action) => {
            const { name, id } = action.payload;
            const currentState = state.selectedFunctions;

            /* currentState.forEach((func) => {
                func.functions.forEach((func) => {
                    func.show_settings = false;
                })
            })
 */
            // Find the index of the function by name
            const foundFunctionIndex = currentState.findIndex((func) => func.name === name);

            if (foundFunctionIndex !== -1) {

                const foundFunction = currentState[foundFunctionIndex];

                // Find the index of the function to update within the found function's functions array
                const foundFunctionToUpdateIndex = foundFunction.functions.findIndex((func) => func.id === id);

                if (foundFunctionToUpdateIndex !== -1) {

                    // Create a copy of the function to update
                    const updatedFunction = { ...foundFunction.functions[foundFunctionToUpdateIndex] };

                    // Update the show_settings flag
                    updatedFunction.show_settings = !updatedFunction.show_settings; // maybe true here

                    // Update the function within the found function's functions array

                    foundFunction.functions[foundFunctionToUpdateIndex] = updatedFunction;

                    // Update the currentState with the modified function
                    currentState[foundFunctionIndex] = foundFunction;
                }
            }
            state.selectedFunctions = currentState;
        },
        resetShowSettingsFlag: (state) => {
            const currentState = state.selectedFunctions;
            currentState.forEach((func) => {
                func.functions.forEach((func) => {
                    func.show_settings = false;
                })
            })
            state.selectedFunctions = currentState;
        },
        removeFromSelectedFunction: (state, action) => {
            const { id, name, group_name } = action.payload;
            const currentState = state.selectedFunctions;
            const talibDesc = state.talibDescription;
            const foundFunction = currentState[currentState.findIndex((func) => func.name === name)];
            const foundFunctionIndex = foundFunction.functions.findIndex((func) => func.id === id);
            foundFunction.functions.splice(foundFunctionIndex, 1);

            if (foundFunction.functions.length === 0) {
                const foundIndex = currentState.findIndex((func) => func.name === name);
                currentState.splice(foundIndex, 1);

                const foundGroupIndex = talibDesc.findIndex((grp) => grp.group_name === group_name);
                const foundGroup = talibDesc[foundGroupIndex];
                const foundFunctionIndex = foundGroup.functions.findIndex((func) => func.name === name);
                foundGroup.functions[foundFunctionIndex].function_selected_flag = false;
                talibDesc[foundGroupIndex] = foundGroup;
            }

            const modifiedSFWithDataTR = state.modifiedSelectedFunctionWithDataToRender;

            const filteredFunctiosnById = modifiedSFWithDataTR.filter((func) => func.id === id);

            if (filteredFunctiosnById.length > 0) {
                filteredFunctiosnById.forEach((filteredFunc) => {
                    const foundFunctionIndexInModified = modifiedSFWithDataTR.findIndex((func) => func.id === id && filteredFunc.key === func.key);
                    modifiedSFWithDataTR.splice(foundFunctionIndexInModified, 1);
                })
            }

            state.modifiedSelectedFunctionWithDataToRender = modifiedSFWithDataTR;

            state.selectedFunctions = currentState;
            state.talibDescription = talibDesc;
        },
        resetDataLoadedState: (state) => {
            state.selectedTickerPeriod = '4h';
            state.talibDescription = state.talibDescriptionCopy;
            state.selectedFunctions = [];
            state.modifiedSelectedFunctionWithDataToRender = [];
            state.barsFromTo = { from: 0, to: 0 };
        },
        resetCryptoStockModule: (state) => {
            state.selectedTickerName = '';
            state.barsFromTo = { from: 0, to: 0 };
            state.barsFromToPredictions = { from: 0, to: 0 };
            state.toolTipOn = false;
            state.selectedTickerPeriod = '4h';
            state.talibDescription = [];
            state.talibDescriptionCopy = [];
            state.cryptoDataInDb = [];
            state.streamedTickerData = [];
            state.selectedFunctions = [];
            state.modifiedSelectedFunctionWithDataToRender = [];
            state.modelData = initialState.modelData;
            state.userModels = [];
            state.quick_forecasts = {};
        },
        setIsDataNewFlag: (state, action) => {
            const currentState = state.modifiedSelectedFunctionWithDataToRender;
            currentState.filter((func) => func.isDataNew === true).forEach((func) => {
                func.isDataNew = false;
            })
            state.modifiedSelectedFunctionWithDataToRender = currentState;
        }
    }, extraReducers: (builder) => {
        builder.addCase(executeAllSelectedFunctions.fulfilled, (state, action) => {
            const currentMSFWDTR = state.modifiedSelectedFunctionWithDataToRender;
            const newData = action.payload

            const updatedMSFWDTR = currentMSFWDTR.map((item) => {
                const matchingData = newData.find((data) => data.id === item.id && data.result.some((res) => res.key === item.key));
                if (matchingData) {
                    const newResult = matchingData.result.find((res) => res.key === item.key).data;
                    return {
                        ...item,
                        result: newResult,
                        isDataNew: true,
                    };
                }
                return item;
            });
            state.modifiedSelectedFunctionWithDataToRender = updatedMSFWDTR;
            // console.log("State modified",updatedMSFWDTR)
        })
    }
})

const { reducer, actions } = cryptoModuleSlice;
export const {
    setPartialChartResetFlag
    , setLastSessionData
    , setModelSavedToDb
    , setRetrainHistorySavedToDb
    , setUserModels
    , setModelId
    , setTaskId
    , setModelType
    , setTrainingParameters
    , setRetrainParameters
    , setStartWebSocket
    , setRetrainingFlag
    , setLoadingFromSavedModel
    , sliceEpochResults
    , setLoadedCheckpoints
    , setModelStartTime
    , setModelEndTime
    , setFeatureCorrelationData
    , setPredictedValues
    , setIntermediateForecastResults
    , setWganFinalForecast
    , setQuickForecasts
    , updatePredictedValues
    , setModelDataAvailableFlag
    , setNewForecastData
    , renameModel
    , setPredictionPaletteId
    , setPredictionScores
    , setStandardizedAndScaledPredictions
    , setBarsFromToPredictions
    , setProgressMessage
    , setEpochNo
    , setEpochResults
    , resetCurrentModelData
    , resetPredictionsValue
    , resetModelData
    , toggleToolTipSwitch
    , toggleShowPredictionSwitch
    , setBarsFromTo
    , toggleProcessSelectedFunctionsOnMoreData
    , setTalibDescription
    , setSelectedFlagInTalibDescription
    , setSelectedTickerName
    , setSelectedTickerPeriod
    , setCryptoDataInDbRedux
    , setStocksDataInDbRedux
    , setStreamedTickerDataRedux
    , resetStreamedTickerDataRedux
    , setSelectedFunctions
    , setSelectedFunctionInputValues
    , setFunctionInputErrorFlagAndMessage
    , setSelectedFunctionOptionalInputValues
    , setTalibResult
    , toggleShowHideChartFlag
    , toggleShowHideIntermediatePredictions
    , toggleShowSettingsFlag
    , resetShowSettingsFlag
    , removeFromSelectedFunction
    , resetDataLoadedState
    , resetCryptoStockModule
    , setIsDataNewFlag
} = actions;
export default reducer;