import { Typography, Box } from "@mui/material";

const Header = ({ title, subtitle }) => {
    return (
        <Box p={3}>
            <Typography
                variant="h2"
                fontWeight="bold"
                sx={{ m: "0 0 5px 10px", textAlign: "left" }}
            >
                {title}
            </Typography>
            <Typography
                variant="h5"
                sx={{ textAlign: "left", m: "0 0 5px 10px" }}
            >
                {subtitle}
            </Typography>
        </Box>
    );
};

export default Header;