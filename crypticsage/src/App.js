import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./themes/theme";
import { Provider } from 'react-redux';
import store, { persistor } from './store';
import { PersistGate } from 'redux-persist/integration/react';
import './App.css';
import LandingPage from './pages/landing_page/LandingPage';
import Auth from "./pages/auth/Auth";
import Dashboard from "./pages/dashboard/Dashboard";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import { ProSidebarProvider } from 'react-pro-sidebar';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import TabRoutes from "./components/dashboard/Routes";
function App() {
  const [theme, colorMode] = useMode();
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <ProSidebarProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                  <div className="App">
                    <Routes>
                      <Route index element={<LandingPage />} />
                      <Route path="auth" element={<Auth />} />
                      <Route path="dashboard" element={<Dashboard />} >
                        {TabRoutes}
                      </Route>
                    </Routes>
                  </div>
                </PersistGate>
              </Provider>
            </LocalizationProvider>
          </ProSidebarProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
