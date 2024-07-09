import { createSlice } from "@reduxjs/toolkit";

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

const initialState = {
    models_in_progress: [],
    selected_model_id: '',
}

const intermediateModelSlice = createSlice({
    name: "interModelResults",
    initialState,
    reducers: {
        setModelsInProgress: (state, action) => {
            const inProgressModels = action.payload.map((model) => {
                const batchResult = false;
                return {
                    ...model,
                    batchResult
                }
            });
            state.models_in_progress = inProgressModels;
        },
        setTrainingCompleted: (state, action) => {
            const { model_id, model_train_end_time } = action.payload;
            const currentState = state.models_in_progress;
            const foundModelIndex = currentState.findIndex(model => model.model_id === model_id);
            if (foundModelIndex !== -1) {
                currentState[foundModelIndex].training_completed = true;
                currentState[foundModelIndex].model_train_end_time = model_train_end_time;
            }
        },
        setSelectedModelId: (state, action) => {
            state.selected_model_id = action.payload;
        },
        setCachedTrainingResults: (state, action) => {
            const { model_id, data } = action.payload;
            const { cached_data: { intermediate_forecast } } = data

            const takenColors = state.models_in_progress.reduce((acc, model) => {
                if (model.cachedModelResults) {
                    return [...acc, model.cachedModelResults.cached_data.intermediate_forecast]
                }
                return acc;
            }, []).map(({ color }) => color)

            const availableColors = lineColors.filter((color) => !takenColors.includes(color));
            let inter_forecast = [];
            if (intermediate_forecast !== undefined) {
                inter_forecast = intermediate_forecast.map((forecast, index) => {
                    return {
                        ...forecast,
                        color: availableColors[index],
                        show: true,
                    }
                });
            }

            const currentState = state.models_in_progress;

            const foundModelIndex = currentState.findIndex(model => model.model_id === model_id);
            if (foundModelIndex !== -1) {
                currentState[foundModelIndex].cachedModelResults = { ...data, cached_data: { ...data.cached_data, intermediate_forecast: inter_forecast } };
            }
        },
        setCachedDataSavedToDb: (state, action) => {
            const { model_id } = action.payload;
            const currentState = state.models_in_progress;
            const foundModelIndex = currentState.findIndex(model => model.model_id === model_id);
            if (foundModelIndex !== -1) {
                currentState[foundModelIndex].saved_to_db = true;
            }
        },
        removeIntermediateModel: (state, action) => {
            const model_id = action.payload;
            const currentState = state.models_in_progress;
            const filterd = currentState.filter(model => model.model_id !== model_id);
            state.models_in_progress = filterd;
        },

        setModelWSConnection: (state, action) => {
            const { model_id, connect } = action.payload;

            const foundModelIndex = state.models_in_progress.findIndex(model => model.model_id === model_id);
            if (foundModelIndex !== -1) {
                state.models_in_progress[foundModelIndex].batchResult = connect;
            }
        },
        resetModelsInProgress: (state) => {
            state.models_in_progress = [];
            state.selected_model_id = '';
        },
    },
});

const { reducer, actions } = intermediateModelSlice;

export const {
    setModelsInProgress
    , setTrainingCompleted
    , setSelectedModelId
    , setCachedTrainingResults
    , setCachedDataSavedToDb
    , removeIntermediateModel
    , setModelWSConnection
    , resetModelsInProgress
} = actions;

export default reducer;