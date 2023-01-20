import { CssBaseline, ThemeProvider } from "@mui/material";
import { ColorModeContext, useMode } from "./themes/theme";
import './App.css';
import LandingPage from './landing_page/LandingPage';
import ParallaxStar from './components/landing_page/animation/ParallaxStar';

function App() {
  const [theme, colorMode] = useMode();
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="App">
          <LandingPage />
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;
