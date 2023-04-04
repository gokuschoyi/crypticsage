import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    accessToken: '',
    displayName: '',
    email: '',
    emailVerified: '',
    uid: '',
    preferences: {},
    mobile_number: '',
    admin_status: false,
    photoUrl: '',
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setAuthState: (state, action) => {
            state.accessToken = action.payload.accessToken;
            state.displayName = action.payload.displayName;
            state.email = action.payload.email;
            state.emailVerified = action.payload.emailVerified;
            state.uid = action.payload.uid;
            state.preferences = action.payload.preferences;
            state.mobile_number = action.payload.mobile_number;
            state.admin_status = action.payload.admin_status;
            state.photoUrl = action.payload.photoUrl;
        },
        setNewProfileImage: (state, action) => {
            state.photoUrl = action.payload.photoUrl;
        },
        setNewUserData: (state, action) => {
            state.displayName = action.payload.displayName;
            state.mobile_number = action.payload.mobile_number;
        },
        setUserPreferences: (state, action) => {
            state.preferences.dashboardHover = action.payload.dashboardHover;
            state.preferences.collapsedSidebar = action.payload.collapsedSidebar;
        },
        resetAuthState: (state) => {
            state.accessToken = '';
            state.displayName = '';
            state.email = '';
            state.emailVerified = '';
            state.photoUrl = '';
            state.uid = '';
            state.preferences = {};
            state.mobile_number = '';
            state.admin_status = false;
            state.preferences = {};
        }
    }
})

const { reducer, actions } = authSlice;
export const {
    setAuthState,
    setNewProfileImage,
    setNewUserData,
    setUserPreferences,
    resetAuthState
} = actions;
export default reducer;