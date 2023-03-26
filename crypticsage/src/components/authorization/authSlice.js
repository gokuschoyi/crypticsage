import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    accessToken:'',
    displayName:'',
    email:'',
    emailVerified:'',
    photoUrl:'',
    uid:'',
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
            state.photoUrl = action.payload.photoUrl;
            state.uid = action.payload.uid;
        },
        resetAuthState: (state) => {
            state.accessToken = '';
            state.displayName = '';
            state.email = '';
            state.emailVerified = '';
            state.photoUrl = '';
            state.uid = '';
        }
    }
})

const { reducer, actions } = authSlice;
export const { setAuthState, resetAuthState } = actions;
export default reducer;