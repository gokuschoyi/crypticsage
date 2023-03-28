import { Typography, Box, useTheme } from "@mui/material";
import { tokens } from "../../../themes/theme";

const AdminHeader = ({ title, subtitle }) => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
    return (
        <Box p={3}>
            <Typography
                variant="h2"
                color={`${theme.palette.secondary.light}`}
                fontWeight="bold"
                sx={{ m: "0 0 5px 10px", textAlign: "left" }}

            >
                {title}
            </Typography>
            <Typography
                variant="h5"
                color={colors.colorOne[400]}
                sx={{ textAlign: "left", m: "0 0 5px 10px" }}
            >
                {subtitle}
            </Typography>
        </Box>
    );
};

export default AdminHeader;