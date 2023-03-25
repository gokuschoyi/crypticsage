import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    tabName: 'Your Profile',
}

const settingsSlice = createSlice({
    name: 'settings',
    initialState,
    reducers: {
        setSettingsState: (state, action) => {
            state.tabName = action.payload;
        },
        resetSettingsState: (state) => {
            state.tabName = 'Your Profile';
        }
    }
})

const { reducer, actions } = settingsSlice;
export const { setSettingsState, resetSettingsState } = actions;
export default reducer;