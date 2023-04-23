import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    adminSidebarTab: 'adminDashboard',
    toggleSmallScreenAdminSidebarState: true
}

const adminSidebarSlice = createSlice({
    name: 'adminSidebar',
    initialState,
    reducers: {
        setAdminSidebarState: (state, action) => {
            state.adminSidebarTab = action.payload;
        },
        handleReduxSmallScreenAdminSidebar: (state, action) => {
            state.toggleSmallScreenAdminSidebarState = action.payload.value;
        },
        resetAdminSidebarState: (state) => {
            state.adminSidebarTab = 'adminDashboard';
        }
    }
})

const { reducer, actions } = adminSidebarSlice;
export const { setAdminSidebarState, resetAdminSidebarState, handleReduxSmallScreenAdminSidebar } = actions;
export default reducer;