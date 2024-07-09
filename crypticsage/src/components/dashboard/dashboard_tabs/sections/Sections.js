import React, { useEffect } from 'react'
import { Box } from '@mui/material';
import './Sections.css'
import { useSelector } from 'react-redux';
import { useNavigate, Outlet } from 'react-router-dom';

const FirstRoute = ({ sectionId, lessonId }) => {
    const navigate = useNavigate();

    const sectionReff = React.useRef(false);
    useEffect(() => {
        if (!sectionReff.current) {
            // console.log("section id and lesson id useEffect")
            sectionReff.current = true;
            if (sectionId !== '' && lessonId === '') {
                // console.log("section id")
                navigate(`/dashboard/sections/${sectionId}`);
            } else if (sectionId !== '' && lessonId !== '') {
                // console.log("section id and lesson id")
                navigate(`/dashboard/sections/${sectionId}/${lessonId}`);
            }
        } else { return }
    });

    return null;
};

const Sections = (props) => {
    const { sectionId, lessonId } = useSelector(state => state.section)
    const [redirected, setRedirected] = React.useState(false);

    useEffect(() => {
        if (sectionId !== '' || lessonId !== '') {
            setRedirected(true);
        } else {
            setRedirected(false);
        }
    }, [sectionId, lessonId]);
    // console.log(redirected)

    return (
        <Box className='learning-container'>
            {redirected ? (
                <FirstRoute sectionId={sectionId} lessonId={lessonId} />
            ) : null}
            <Outlet />
        </Box>
    )
}

export default Sections