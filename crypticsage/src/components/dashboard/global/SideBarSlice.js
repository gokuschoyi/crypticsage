import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    sidebarTab: 'dashboardTab',
    toggleSmallScreenSidebarState: true
}

const sideBarSlice = createSlice({
    name: 'sidebar',
    initialState,
    reducers: {
        setSidebarState: (state, action) => {
            state.sidebarTab = action.payload;
        },
        handleReduxToggleSmallScreenSidebar: (state, action) => {
            state.toggleSmallScreenSidebarState = action.payload.value;
        },
        resetSidebarState: (state) => {
            state.sidebarTab = 'dashboardTab';
            state.toggleSmallScreenSidebarState = true;
        },
    }
})

const { reducer, actions } = sideBarSlice;
export const { setSidebarState, resetSidebarState, handleReduxToggleSmallScreenSidebar } = actions;
export default reducer;