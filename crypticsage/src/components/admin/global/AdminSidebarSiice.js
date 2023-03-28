import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    adminSidebarTab: 'adminDashboard',
}

const adminSidebarSlice = createSlice({
    name: 'adminSidebar',
    initialState,
    reducers: {
        setAdminSidebarState: (state, action) => {
            state.adminSidebarTab = action.payload;
        },
        resetAdminSidebarState: (state) => {
            state.adminSidebarTab = 'adminDashboard';
        }
    }
})

const { reducer, actions } = adminSidebarSlice;
export const { setAdminSidebarState, resetAdminSidebarState } = actions;
export default reducer;