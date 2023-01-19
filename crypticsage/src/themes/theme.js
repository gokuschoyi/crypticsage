import { createContext, useState, useMemo } from "react";
import { createTheme } from "@mui/material/styles";
import Typography from "./typography";

export const tokens = (mode) => ({
    ...(mode === 'dark'
        ? {
            teal: {
                100: "#d3f1ee",
                200: "#a6e4dd",
                300: "#7ad6cc",
                400: "#4dc9bb",
                500: "#21bbaa",
                600: "#1a9688",
                700: "#147066",
                800: "#0d4b44",
                900: "#072522"
            },
            black: {
                100: "#cccccc",
                200: "#999999",
                300: "#666666",
                400: "#333333",
                500: "#000000",
                600: "#000000",
                700: "#000000",
                800: "#000000",
                900: "#000000"
            },
            red: {
                100: "#f1d3d6",
                200: "#e4a6ad",
                300: "#d67a84",
                400: "#c94d5b",
                500: "#e31717",
                600: "#961a28",
                700: "#70141e",
                800: "#4b0d14",
                900: "#25070a"
            },
        }
        : {
            teal: {
                100: "#072522",
                200: "#0d4b44",
                300: "#147066",
                400: "#1a9688",
                500: "#21bbaa",
                600: "#4dc9bb",
                700: "#7ad6cc",
                800: "#a6e4dd",
                900: "#d3f1ee",
            },
            black: {
                100: "#000000",
                200: "#000000",
                300: "#000000",
                400: "#000000",
                500: "#000000",
                600: "#333333",
                700: "#666666",
                800: "#999999",
                900: "#cccccc",
            },
            red: {
                100: "#25070a",
                200: "#4b0d14",
                300: "#70141e",
                400: "#961a28",
                500: "#bb2132",
                600: "#c94d5b",
                700: "#d67a84",
                800: "#e4a6ad",
                900: "#f1d3d6",
            },
        })
})

const themeTypography = Typography(`'Roboto', sans-serif`);

export const themeSettings = (mode) => {
    const colors = tokens(mode);
    return {
        breakpoints: {
            values: {
                xs: 0,
                sm: 600,
                md: 900,
                lg: 1200,
                xl: 1536
            }
        },
        palette: {
            mode: mode,
            ...(mode === 'dark'
                ? {
                    primary: {
                        main: colors.black[500],
                        light: colors.black[300],
                        dark: colors.black[700],
                        contrastText: colors.teal[500],
                    },
                    secondary: {
                        main: colors.red[500],
                        light: colors.red[300],
                        dark: colors.red[700],
                        contrastText: colors.red[500],
                    },
                    text: {
                        primary: colors.teal[500],
                        secondary: colors.teal[300],
                        disabled: colors.teal[100],
                        hint: colors.teal[100],
                        dark: colors.teal[900],
                    },
                    background: {
                        default: colors.black[500],
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
                        main: colors.black[500],
                    },
                }
                : {
                    primary: {
                        main: colors.black[500],
                        light: colors.black[300],
                        dark: colors.black[700],
                        contrastText: colors.teal[500],
                    },
                    secondary: {
                        main: colors.red[500],
                        light: colors.red[300],
                        dark: colors.red[700],
                        contrastText: colors.red[500],
                    },
                    text: {
                        primary: colors.teal[500],
                        secondary: colors.teal[300],
                        disabled: colors.teal[100],
                        hint: colors.teal[100],
                        dark: colors.teal[900],
                    },
                    background: {
                        default: colors.black[100],
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
                        main: colors.black[500],
                    },
                }
            )
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