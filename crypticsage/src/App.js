import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./themes/theme";
import './App.css';
import LandingPage from './pages/landing_page/LandingPage';
import Auth from "./pages/auth/Auth";
import { Route, Routes, BrowserRouter } from "react-router-dom";

function App() {
  const [theme, colorMode] = useMode();
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <div className="App">
            <Routes>
              <Route index element={<LandingPage />} />
              <Route path="auth" element={<Auth />} />
                
            </Routes>
          </div>
        </BrowserRouter>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
