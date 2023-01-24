import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./themes/theme";
import './App.css';
import LandingPage from './pages/landing_page/LandingPage';
import Auth from "./pages/auth/Auth";
import Dashboard from "./pages/dashboard/Dashboard";
import { Route, Routes, BrowserRouter } from "react-router-dom";
import { ProSidebarProvider } from 'react-pro-sidebar';
import Stats from "./components/dashboard/dashboard_tabs/stats/Stats";

function App() {
  const [theme, colorMode] = useMode();
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <ProSidebarProvider>
            <div className="App">
              <Routes>
                <Route index element={<LandingPage />} />
                <Route path="auth" element={<Auth />} />
                <Route path="dashboard" element={<Dashboard />} >
                  <Route path="dashboardTab" element={<Stats title="Dashboard" subtitle="Explore your activities"/>} />
                </Route>
              </Routes>
            </div>
          </ProSidebarProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
