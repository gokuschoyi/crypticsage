import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistReducer, persistStore } from 'redux-persist';
import localforage from 'localforage';
import thunk from 'redux-thunk';
import autoMergeLevel2 from 'redux-persist/es/stateReconciler/autoMergeLevel2';
import sectionSlice from './components/dashboard/dashboard_tabs/sections/SectionSlice';
import settingsSlice from './components/dashboard/dashboard_tabs/settings/SettingsSlice';
import sideBarSlice from './components/dashboard/global/SideBarSlice';
import authSlice from './components/authorization/authSlice';
import adminSidebarSlice from './components/admin/global/AdminSidebarSiice.js';
import statsSlice from './components/dashboard/dashboard_tabs/stats/StatsSlice.js';
import quizSlice from './components/dashboard/dashboard_tabs/quiz/QuizSlice.js';

import IndicatorsSlice from './components/dashboard/dashboard_tabs/indicators/IndicatorsSlice.js';
import cryptoModuleSlice from './components/dashboard/dashboard_tabs/indicators/modules/CryptoModuleSlice.js';
import stockModuleSlice from './components/dashboard/dashboard_tabs/indicators/modules/StockModuleSlice.js';

import adminSlice from '../src/components/admin/AdminSlice.js'

const reducer = combineReducers({
    admin: adminSlice,
    settings: settingsSlice,
    sidebar: sideBarSlice,
    section: sectionSlice,
    auth: authSlice,
    adminSidebar: adminSidebarSlice,
    stats: statsSlice,
    quiz: quizSlice,
    indicators: IndicatorsSlice,
    cryptoModule: cryptoModuleSlice,
    stockModule: stockModuleSlice,
})

const persistConfig = {
    key: 'root',
    storage: localforage,
    stateReconciler: autoMergeLevel2,
    serialize: true,
    version: 8, // Update this number anytime changes are made to any of the redux slices. This will trigger the migration function below
    migrate: (state, currentVersion) => {
        if (state && state._persist.version !== currentVersion) {
            console.log(`New state version ${currentVersion}. Clearing state`); // If the versions don't match, clear the state
            return Promise.resolve(undefined); // This clears the old state
        } else {
            console.log(`State version ${currentVersion}. No migration needed`)
            return Promise.resolve(state); // Otherwise, return the state as is
        }
    }
}

const persistedReducer = persistReducer(persistConfig, reducer);

const store = configureStore({
    reducer: persistedReducer,
    middleware: [thunk],
});

const persistor = persistStore(store);

export { persistor }
export default store;