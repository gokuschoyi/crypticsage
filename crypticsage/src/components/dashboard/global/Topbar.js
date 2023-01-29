import { Box, IconButton, useTheme } from "@mui/material";
import { useContext } from "react";
import { ColorModeContext } from "../../../themes/theme";
import InputBase from "@mui/material/InputBase";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import SearchIcon from "@mui/icons-material/Search";

const Topbar = () => {
    const theme = useTheme();
    const colorMode = useContext(ColorModeContext);
    /* console.log(theme.palette.primary); */
    console.log(theme.palette.mode);

    return (
        <Box display="flex" justifyContent="space-between" p={2} backgroundColor={theme.palette.primary.dark}>
            {/* SEARCH BAR */}
            <Box
                display="flex"
                borderRadius="3px"

            >
                <InputBase
                    sx={{
                        ml: 2,
                        flex: 1,
                        backgroundColor: theme.palette.secondary.main,
                        color: theme.palette.primary.dark,
                        borderRadius: '20px',
                        ' .MuiInputBase-input': {
                            textIndent: '20px',
                        },
                    }}
                    placeholder="Search" />
                <IconButton type="button" sx={{ p: 1 }}>
                    <SearchIcon />
                </IconButton>
            </Box>

            {/* ICONS */}
            <Box display="flex">
                {theme.palette.mode === "dark" ?
                    (
                        <Box display='flex'>
                            <IconButton onClick={colorMode.toggleColorMode}>
                                <LightModeOutlinedIcon />
                            </IconButton>
                            <IconButton>
                                <NotificationsOutlinedIcon />
                            </IconButton>
                            <IconButton>
                                <SettingsOutlinedIcon />
                            </IconButton>
                            <IconButton>
                                <PersonOutlinedIcon />
                            </IconButton>
                        </Box>
                    )
                    :
                    (
                        <Box display='flex'>
                            <IconButton onClick={colorMode.toggleColorMode}>
                                <DarkModeOutlinedIcon sx={{ color: 'white' }} />
                            </IconButton>
                            <IconButton>
                                <NotificationsOutlinedIcon sx={{ color: 'white' }} />
                            </IconButton>
                            <IconButton>
                                <SettingsOutlinedIcon sx={{ color: 'white' }} />
                            </IconButton>
                            <IconButton>
                                <PersonOutlinedIcon sx={{ color: 'white' }} />
                            </IconButton>
                        </Box>
                    )
                }
            </Box>
        </Box>
    );
};

export default Topbar;