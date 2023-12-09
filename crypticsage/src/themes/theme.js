import { createContext, useState, useMemo } from "react";
// import { createTheme } from "@mui/material/styles";
import { experimental_extendTheme as extendTheme } from '@mui/material/styles';
import Typography from "./typography";
import { WhiteAndBlack, BlackAndWhite } from "./colors";
export const tokens = (mode) => ({
    ...(mode === 'dark'
        ?
        { ...BlackAndWhite }
        :
        { ...WhiteAndBlack }
    )
})

/* primary = grey
secondary = yellow
text = light grey */

const themeTypography = Typography(`'Montserrat', sans-serif`);

export const themeSettings = (mode) => {
    const colors = tokens(mode);
    return {
        palette: {
            mode: mode,
            ...(mode === 'dark'
                ? {
                    primary: {
                        main: '#ef0938',
                        light: '#f53b61',
                        dark: '#a60627',
                        contrastText: colors.colorTwo[500],
                        extraDark: colors.colorOne[900],
                        new: colors.colorOne[500],
                        newWhite: '#ffffff',
                        newBlack: '#000000',
                    },
                    secondary: {
                        main: '#e02f2f',
                        light: '#e65858',
                        dark: '#9c2020',
                        contrastText: colors.colorTwo[500],
                    },
                    text: {
                        primary: '#969696',
                        secondary: '#fcfcfc',
                        disabled: '#fef4da',
                        hint: '#f9c846',
                        dark: colors.colorThree[900],
                    },
                    background: {
                        default: '#070707',
                        paper: '#212121',
                        paperOne: '#2d2c2c'
                    },
                    error: {
                        main: '#F44336',
                        light: '#E57373',
                        dark: '#D32F2F',
                        contrastText: '#fff',
                    },
                    warning: {
                        main: '#FF9800',
                        light: '#FFB74D',
                        dark: '#F57C00',
                        contrastText: 'rgba(0, 0, 0, 0.87)',
                    },
                    info: {
                        main: '#2196F3',
                        light: '#64B5F6',
                        dark: '#1976D2',
                        contrastText: '#fff',
                    },
                    success: {
                        main: '#4CAF50',
                        light: '#81C784',
                        dark: '#388E3C',
                        contrastText: 'rgba(0, 0, 0, 0.87)',
                    },
                    divider: colors.colorTwo[500],
                }
                : {
                    primary: {
                        main: colors.colorOne[500],
                        light: colors.colorOne[600],
                        dark: colors.colorOne[500],
                        extraDark: colors.colorOne[500],
                        contrastText: colors.colorTwo[500],
                        new: colors.colorOne[900],
                        newWhite: '#000000',
                        newBlack: '#ffffff',
                    },
                    secondary: {
                        main: colors.colorOne[500],
                        light: colors.colorOne[300],
                        dark: colors.colorTwo[700],
                        contrastText: colors.colorTwo[500],
                    },
                    text: {
                        primary: colors.colorTwo[100],
                        secondary: colors.colorTwo[300],
                        disabled: colors.colorThree[100],
                        hint: colors.colorThree[100],
                        dark: colors.colorThree[900],
                    },
                    background: {
                        default: '#fff',
                        paper: '#f5f5f5',
                        paperOne: '#e7e7e7'
                    },
                    error: {
                        main: '#F44336',
                        light: '#E57373',
                        dark: '#D32F2F',
                        contrastText: '#fff',
                    },
                    warning: {
                        main: '#FF9800',
                        light: '#FFB74D',
                        dark: '#F57C00',
                        contrastText: 'rgba(0, 0, 0, 0.87)',
                    },
                    info: {
                        main: '#2196F3',
                        light: '#64B5F6',
                        dark: '#1976D2',
                        contrastText: '#fff',
                    },
                    success: {
                        main: '#4CAF50',
                        light: '#81C784',
                        dark: '#388E3C',
                        contrastText: 'rgba(0, 0, 0, 0.87)',
                    },
                    divider: colors.colorTwo[100],
                }
            )
        },
        breakpoints: {
            values: {
                xs: 0,
                sm: 600,
                md: 900,
                lg: 1200,
                xl: 1536
            }
        },
        typography: themeTypography,
    }
}

export const ColorModeContext = createContext({
    toggleColorMode: () => { }
})

export const useMode = () => {
    const modeInLocalStorage = localStorage.getItem('userTheme') === 'false' ? 'light' : 'dark';
    const [mode, setMode] = useState(modeInLocalStorage);
    // console.log('mode from theme.js', mode, modeInLocalStorage)

    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prev) => (prev === 'dark' ? 'light' : 'dark'))
            }
        }), []
    )

    const theme = useMemo(() => extendTheme(themeSettings(mode)), [mode]);
    return [theme, colorMode]
}