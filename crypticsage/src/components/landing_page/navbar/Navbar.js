import { Box, useTheme, Button } from "@mui/material";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";
import useMediaQuery from '@mui/material/useMediaQuery';
import Logo from "../../../assets/logoNew.png";
import HomeIcon from '@mui/icons-material/Home';
import HelpCenterIcon from '@mui/icons-material/HelpCenter';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import RateReviewIcon from '@mui/icons-material/RateReview';
import SellIcon from '@mui/icons-material/Sell';
import MenuIcon from '@mui/icons-material/Menu';

const Navbar = (props) => {
    const { toggle, setToggle } = props;
    const theme = useTheme();
    const navigate = useNavigate();

    const getToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        })
    }

    const lg = useMediaQuery(theme.breakpoints.down('lg'));
    const md = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        if (lg) {
            document.getElementsByClassName('cta')[0].classList.remove('nav-show');
            document.getElementsByClassName('cta')[0].classList.add('nav-hide');
        }
        else {
            document.getElementsByClassName('cta')[0].classList.remove('nav-hide');
            document.getElementsByClassName('cta')[0].classList.add('nav-show');
        }
    })

    useEffect(() => {
        if (md) {
            document.getElementsByClassName('menu')[0].classList.remove('nav-show');
            document.getElementsByClassName('menu')[0].classList.add('nav-hide');
        }
        else {
            document.getElementsByClassName('menu')[0].classList.remove('nav-hide');
            document.getElementsByClassName('menu')[0].classList.add('nav-show');
        }
    })

    const hamburgerContent = () => {
        const mountedStyle = { animation: "inAnimation 250ms ease-in" };
        const unmountedStyle = {
            animation: "outAnimation 270ms ease-out",
            animationFillMode: "forwards"
        };
        return (
            <Box className="ham-nav" style={toggle ? mountedStyle : unmountedStyle}>
                <Box mr={2} className="cta-small">
                    <Button onClick={handleClick} variant="text" style={{ color: `#000000`, backgroundColor: 'red', margin: '5px' }} sx={{
                        ':hover': {
                            color: `black !important`,
                            backgroundColor: 'white !important',
                        },
                    }} >LOGIN</Button>
                    <Button onClick={handleClick} variant="text" style={{ color: `#000000`, backgroundColor: 'red', margin: '5px' }} sx={{
                        ':hover': {
                            color: `black !important`,
                            backgroundColor: 'white !important',
                        },
                    }}>SIGNUP</Button>
                </Box>
                {md &&
                    <Box display="flex" flexDirection="column" className="menu-small">
                        <ul className="navbar-nav-small justify-content-center flex-grow-1" >
                            <li className="nav-item-small" onClick={getToTop}>
                                <a className="nav-link-small" href="#home"><HomeIcon className="nav-icon-small" /><span>HOME</span></a>
                            </li>
                            <li className="nav-item-small">
                                <a className="nav-link-small" href="#whatis"><HelpCenterIcon className="nav-icon-small" /><span>WHAT IS</span></a>
                            </li>
                            <li className="nav-item-small">
                                <a className="nav-link-small" href="#course"><AutoStoriesIcon className="nav-icon-small" /><span>COURSE</span></a>
                            </li>
                            <li className="nav-item-small">
                                <a className="nav-link-small" href="#testimonials"><RateReviewIcon className="nav-icon-small" /><span>TESTIMONIALS</span></a>
                            </li>
                            <li className="nav-item-small">
                                <a className="nav-link-small" href="#pricing"><SellIcon className="nav-icon-small" /><span>PRICING</span></a>
                            </li>
                        </ul>
                    </Box>
                }
            </Box>
        )
    }

    const handleClick = () => {
        navigate('auth');
    }

    return (
        <Box
            display="flex"
            mt={2}
            justifyContent="space-between"
            alignItems="center"
            className="navbar-main"
            sx={{ backgroundColor: `black` }}
        >

            {/* logo */}
            <Box className="logo-container" ml={2}>
                <img src={Logo} alt="logo" className="logo" />
            </Box>

            {/* menu */}
            <Box display="flex" flexDirection="row" className="menu">
                <ul className="navbar-nav justify-content-center flex-grow-1" >
                    <li className="nav-item" onClick={getToTop}>
                        <a className="nav-link" href="#home"><span>HOME</span></a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#whatis"><span>WHAT IS</span></a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#course"><span>COURSE</span></a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#testimonials"><span>TESTIMONIALS</span></a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="#pricing"><span>PRICING</span></a>
                    </li>
                </ul>
            </Box>

            {/* CTA */}
            <Box mr={2} className="cta">
                <Button onClick={handleClick} variant="text" style={{ fontSize:'18px', color: `white`, marginRight: '20px' }} sx={{
                    ':hover': {
                        color: 'black !important',
                        backgroundColor: 'red !important',
                    },
                }} >LOGIN</Button>
                <Button onClick={handleClick} variant="text" style={{ fontSize:'18px', color: `white` }} sx={{
                    ':hover': {
                        color: 'black !important',
                        backgroundColor: 'red !important',
                    },
                }}>SIGNUP</Button>
            </Box>

            {/* hamburger */}
            {lg &&
                <Box className="hamburger-icon" mr={2}>
                    <MenuIcon onClick={setToggle} className="hamburger" />
                </Box>
            }
            {hamburgerContent()}
        </Box>
    );
};

export default Navbar;