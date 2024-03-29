import { grey, yellow } from "@mui/material/colors";
const Colors = {
    colorOne: {
        100: "#fefff7",
        200: "#fdffef",
        300: "#fcffe8",
        400: "#fbffe0",
        500: "#faffd8",
        600: "#c8ccad",
        700: "#969982",
        800: "#646656",
        900: "#32332b"
    },
    colorThree: {
        100: "#ebeeeb",
        200: "#d7dcd6",
        300: "#c2cbc2",
        400: "#aeb9ad",
        500: "#9aa899",
        600: "#7b867a",
        700: "#5c655c",
        800: "#3e433d",
        900: "#1f221f"
    },
    colorTwo: {
        100: "#dddde5",
        200: "#bbbccb",
        300: "#989ab0",
        400: "#767996",
        500: "#54577c",
        600: "#434663",
        700: "#32344a",
        800: "#222332",
        900: "#111119"
    },
}

const initialColors = {
    colorOne: {
        100: "#d3f1ee",
        200: "#a6e4dd",
        300: "#7ad6cc",
        400: "#4dc9bb",
        500: "#2cf2dc",
        600: "#1a9688",
        700: "#147066",
        800: "#0d4b44",
        900: "#072522"
    },
    colorTwo: {
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
    colorThree: {
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

const themeOne = {
    colorTwo: {
        100: "#dddee0",
        200: "#bbbcc1",
        300: "#989ba1",
        400: "#767982",
        500: "#545863",
        600: "#43464f",
        700: "#32353b",
        800: "#222328",
        900: "#000000"
    },

    colorOne: {
        100: "#ffffff",
        200: "#ffffff",
        300: "#ffffff",
        400: "#ffffff",
        500: "#ffffff",
        600: "#cccccc",
        700: "#999999",
        800: "#666666",
        900: "#333333"
    },

    colorThree: {
        100: "#fef4da",
        200: "#fde9b5",
        300: "#fbde90",
        400: "#fad36b",
        500: "#f9c846",
        600: "#c7a038",
        700: "#95782a",
        800: "#64501c",
        900: "#32280e"
    },
}

const themeTwo = {
    colorOne: {
        100: "#fadbdb",
        200: "#f5b7b7",
        300: "#ef9393",
        400: "#ea6f6f",
        500: "#e54b4b",
        600: "#b73c3c",
        700: "#892d2d",
        800: "#5c1e1e",
        900: "#2e0f0f"
    },
    colorTwo: {
        100: "#d2d2d3",
        200: "#a5a5a7",
        300: "#78787c",
        400: "#4b4b50",
        500: "#1e1e24",
        600: "#18181d",
        700: "#121216",
        800: "#0c0c0e",
        900: "#060607"
    },
    colorThree: {
        100: "#ffeee7",
        200: "#ffddcf",
        300: "#ffcbb7",
        400: "#ffba9f",
        500: "#ffa987",
        600: "#cc876c",
        700: "#996551",
        800: "#664436",
        900: "#33221b"
    },
}

const themeThree = {
    colorOne: yellow,
    colorTwo: grey,
    colorThree: {
        100: "#fef4da",
        200: "#fde9b5",
        300: "#fbde90",
        400: "#fad36b",
        500: "#f9c846",
        600: "#c7a038",
        700: "#95782a",
        800: "#64501c",
        900: "#32280e"
    },
}

const BlackAndWhite = {
    colorOne: {
        100: "#d3d3d3",
        200: "#a6a6a6",
        300: "#7a7a7a",
        400: "#4d4d4d",
        500: "#212121",
        600: "#1a1a1a",
        700: "#141414",
        800: "#0d0d0d",
        900: "#070707",
    },
    colorTwo: {
        100: "#fefefe",
        200: "#fdfdfd",
        300: "#fcfcfc",
        400: "#fbfbfb",
        500: "#fafafa",
        600: "#c8c8c8",
        700: "#969696",
        800: "#646464",
        900: "#323232"
    },
    colorThree: {
        100: "#fef4da",
        200: "#fde9b5",
        300: "#fbde90",
        400: "#fad36b",
        500: "#f9c846",
        600: "#c7a038",
        700: "#95782a",
        800: "#64501c",
        900: "#32280e"
    },
}

const WhiteAndBlack = {
    colorOne: {
        100: "#070707",
        200: "#0d0d0d",
        300: "#141414",
        400: "#1a1a1a",
        500: "#212121",
        600: "#4d4d4d",
        700: "#7a7a7a",
        800: "#a6a6a6",
        900: "#ffffff",
    },
    colorTwo: {
        100: "#323232",
        200: "#646464",
        300: "#969696",
        400: "#c8c8c8",
        500: "#fafafa",
        600: "#fbfbfb",
        700: "#fcfcfc",
        800: "#fdfdfd",
        900: "#fefefe",
    },
    colorThree: {
        100: "#32280e",
        200: "#64501c",
        300: "#95782a",
        400: "#c7a038",
        500: "#f9c846",
        600: "#fad36b",
        700: "#fbde90",
        800: "#fde9b5",
        900: "#fef4da",
    }
}

/* {
    background: {
        default: '#fff',
        paper: '#000000',
        card: '#332C39'
    },
    text: {
        primary: '#000000db',
        secondary: '#00000099',
        disabled: '#0000005e',
        hint: '#22194D',
        dark: '#072522',
    },
    primary: {
        main: '#2a2c2f',
        light: '#545658',
        dark: '#1D1E20',
        contrastText: '#fff',
    },
    secondary: {
        main: '#21dec8',
        light: '#4DE4D3',
        dark: '#179B8C',
        contrastText: '#000000db',
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
        contrastText: '#000000DD',
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
        contrastText: '#000000DD',
    },
    divider: '#000000',
} */

export { Colors, initialColors, themeOne, themeTwo, themeThree, BlackAndWhite, WhiteAndBlack };