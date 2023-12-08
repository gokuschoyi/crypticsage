import React, { Suspense, lazy } from "react";
import { CssBaseline } from "@mui/material";
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles'
import { ColorModeContext, useMode } from "./themes/theme";
import { Provider } from 'react-redux';
import store, { persistor } from './store';
import { PersistGate } from 'redux-persist/integration/react';
import { Route, Routes, BrowserRouter } from "react-router-dom";
import { ProSidebarProvider } from 'react-pro-sidebar';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ProtectedRoute from "./components/authorization/ProtectedRoute";
import './App.css';

import LoginSkeleton from "./components/authorization/LoginSkeleton";

import LandingPage from './pages/landing_page/LandingPage';
import Dashboard from "./pages/dashboard/Dashboard";
import TabRoutes from "./components/dashboard/Routes";
import Admin from './pages/admin/Admin';
import AdminRoutes from "./components/admin/Routes";
const Auth = lazy(() => import('./pages/auth/Auth'));

function App() {
  const [theme, colorMode] = useMode();
  return (
    <ColorModeContext.Provider value={colorMode}>
      <CssVarsProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <ProSidebarProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                  <div className="App">
                    <Routes>
                      <Route index element={
                        <LandingPage />
                      } />
                      <Route path="auth" element={
                        <Suspense fallback={<LoginSkeleton />}>
                          <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_OAUTH_CLIENT_ID}>
                            <Auth />
                          </GoogleOAuthProvider>
                        </Suspense>
                      } />
                      <Route path="dashboard" element={
                        <ProtectedRoute >
                          <Dashboard />
                        </ProtectedRoute>
                      }>
                        {TabRoutes}
                      </Route>
                      <Route path="admin-dashboard" element={
                        <ProtectedRoute >
                          <Admin />
                        </ProtectedRoute>
                      } >
                        {AdminRoutes}
                      </Route>
                    </Routes>
                  </div>
                </PersistGate>
              </Provider>
            </LocalizationProvider>
          </ProSidebarProvider>
        </BrowserRouter>
      </CssVarsProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
