import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";
import Typography from "./typography";
import { initialColors, BlackAndWhite } from "./colors";
export const tokens = (mode) => ({
    ...(mode === 'dark'
        ?
        { ...BlackAndWhite }
        :
        { ...initialColors }
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
                        main: colors.colorOne[500],
                        light: colors.colorOne[300],
                        dark: colors.colorOne[700],
                        extraDark: colors.colorOne[900],
                        contrastText: colors.colorTwo[500],
                    },
                    secondary: {
                        main: colors.colorTwo[500],
                        light: colors.colorTwo[300],
                        dark: colors.colorTwo[700],
                        contrastText: colors.colorTwo[500],
                    },
                    text: {
                        primary: colors.colorThree[600],
                        secondary: colors.colorThree[300],
                        disabled: colors.colorThree[100],
                        hint: colors.colorThree[100],
                        dark: colors.colorThree[900],
                    },
                    background: {
                        default: colors.colorOne[800],
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
                    divider: {
                        main: colors.colorTwo[500],
                    },
                }
                : {
                    primary: {
                        main: colors.colorTwo[500],
                        light: colors.colorTwo[300],
                        dark: colors.colorTwo[700],
                        contrastText: colors.colorOne[500],
                    },
                    secondary: {
                        main: colors.colorThree[500],
                        light: colors.colorThree[300],
                        dark: colors.colorThree[700],
                        contrastText: colors.colorThree[500],
                    },
                    text: {
                        primary: colors.colorOne[500],
                        secondary: colors.colorOne[300],
                        disabled: colors.colorOne[100],
                        hint: colors.colorOne[100],
                        dark: colors.colorOne[900],
                    },
                    background: {
                        default: colors.colorTwo[500],
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
                    divider: {
                        main: colors.colorTwo[500],
                    },
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
    const [mode, setMode] = useState('dark');

    const colorMode = useMemo(
        () => ({
            toggleColorMode: () => {
                setMode((prev) => (prev === 'dark' ? 'light' : 'dark'))
            }
        }), []
    )

    const theme = useMemo(() => createTheme(themeSettings(mode)), [mode]);
    return [theme, colorMode]
}