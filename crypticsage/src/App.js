import { CssBaseline } from "@mui/material";
import { Experimental_CssVarsProvider as CssVarsProvider } from '@mui/material/styles'
import { ColorModeContext, useMode } from "./themes/theme";
import { Provider } from 'react-redux';
import store, { persistor } from './store';
import { PersistGate } from 'redux-persist/integration/react';
import './App.css';
import LandingPage from './pages/landing_page/LandingPage';
import Auth from "./pages/auth/Auth";
import Dashboard from "./pages/dashboard/Dashboard";
import Admin from "./pages/admin/Admin";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import { ProSidebarProvider } from 'react-pro-sidebar';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import TabRoutes from "./components/dashboard/Routes";
import AdminRoutes from "./components/admin/Routes";
import ProtectedRoute from "./components/authorization/ProtectedRoute";
import { GoogleOAuthProvider } from '@react-oauth/google';
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
                  <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_OAUTH_CLIENT_ID}>
                    <div className="App">
                      <Routes>
                        <Route index element={<LandingPage />} />
                        <Route path="auth" element={<Auth />} />
                        <Route path="dashboard" element={
                          <ProtectedRoute >
                            <Dashboard />
                          </ProtectedRoute>
                        } >
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
                  </GoogleOAuthProvider>
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
