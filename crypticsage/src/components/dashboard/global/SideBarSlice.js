import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    sidebarTab: 'dashboardTab',
}

const sideBarSlice = createSlice({
    name: 'sidebar',
    initialState,
    reducers: {
        setSidebarState: (state, action) => {
            state.sidebarTab = action.payload;
        },
        resetSidebarState: (state) => {
            state.sidebarTab = 'dashboardTab';
        }
    }
})

const { reducer, actions } = sideBarSlice;
export const { setSidebarState, resetSidebarState } = actions;
export default reducer;