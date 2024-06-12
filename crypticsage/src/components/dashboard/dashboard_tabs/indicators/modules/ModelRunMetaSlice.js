import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    initial_run_data_present: false,
    run_count: 0,
    last_run_checkpoint: '',
    training_sessions: []
}

const modelRunMetaSlice = createSlice({
    name: 'modelRunMeta',
    initialState,
    reducers: {
        setInitialTrainingDone(state, action) {
            state.initial_run_data_present = true;
            state.run_count = action.payload
        },
        setTrainingSessionMeta(state, action) {
            const { type, meta } = action.payload
            state.training_sessions.push(meta)
            state.run_count = state.run_count + 1
            if (type === 'initial') {
                state.initial_run_data_present = true
            }
        },
        removeLastRunData(state, action) {
            if (!action.payload.saved) {
                state.training_sessions.pop()
                state.run_count = state.run_count - 1
            }
            state.last_run_checkpoint = action.payload.cp
        },
        setSessionsSaved(state, action) {
            state.training_sessions = state.training_sessions.map((session) => {
                return {
                    ...session,
                    saved: true
                }
            })
        },
        setLastRunCheckpoint(state, action) {
            state.last_run_checkpoint = action.payload
        },
        resetModelRunMeta(state) {
            state.initial_run_data_present = false
            state.run_count = 0
            state.training_sessions = []
            state.last_run_checkpoint = ''
        }
    }
})

const { actions, reducer } = modelRunMetaSlice;
export const {
    setInitialTrainingDone
    , setTrainingSessionMeta
    , removeLastRunData
    , setLastRunCheckpoint
    , setSessionsSaved
    , resetModelRunMeta
} = actions;

export default reducer;