import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import thunk from 'redux-thunk';
import autoMergeLevel2 from 'redux-persist/es/stateReconciler/autoMergeLevel2';
import sectionSlice from './components/dashboard/dashboard_tabs/sections/SectionSlice';
import settingsSlice from './components/dashboard/dashboard_tabs/settings/SettingsSlice';
import sideBarSlice from './components/dashboard/global/SideBarSlice';

const reducer = combineReducers({
    settings: settingsSlice,
    sidebar: sideBarSlice,
    section: sectionSlice,
})

const persistConfig = {
    key: 'root',
    storage,
    stateReconciler: autoMergeLevel2,
}

const persistedReducer = persistReducer(persistConfig, reducer);

const store = configureStore({
    reducer: persistedReducer,
    middleware: [thunk],
});

const persistor = persistStore(store);

export { persistor }
export default store;