import { toast } from 'react-toastify';
import { Box, Typography } from '@mui/material';
import { InfoOutlinedIcon, ThumbUpOutlinedIcon, ReportProblemIcon, ReportOutlinedIcon } from './Icons'
const theme = localStorage.getItem('userTheme') === 'false' ? 'light' : 'dark';

function generateRandomString() {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < 16; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const ErrorComp = ({ error_message, test_possible, train_possible }) => {
    return (
        <Box>
            <Typography style={{ textAlign: 'start', fontSize: '0.75rem', lineHeight: 1.66, fontWeight: 500 }}>{error_message}</Typography>
            <ul className='wgan_ul' style={{ paddingLeft: '20px' }}>
                {!test_possible.status && <li style={{ textAlign: 'start', fontWeight: '700', listStyleType: 'circle', fontSize: '12px' }}>{test_possible.message}</li>}
                {!train_possible.status && <li style={{ textAlign: 'start', fontWeight: '700', listStyleType: 'circle', fontSize: '12px' }}>{train_possible.message}</li>}
            </ul>
        </Box>

    )
}

export const Success = (message) => {
    toast.success(message, {
        theme: theme,
        icon: <ThumbUpOutlinedIcon size='small' />,
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        toastId: generateRandomString(),
    });
}

export const Warning = (message) => {
    toast.warn(message, {
        theme: theme,
        icon: <ReportProblemIcon size='small' />,
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        toastId: generateRandomString(),
    });
}

export const Warning_train = (props) => {
    console.log('error_message', props.error_message, 'test_posible', props.test_possible, 'train_possible', props.train_possible)
    toast.warn(<ErrorComp {...props} />, {
        theme: theme,
        icon: <ReportProblemIcon size='small' />,
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        toastId: generateRandomString(),
    });
}

export const Error = (message) => {
    toast.error(message, {
        theme: theme,
        icon: <ReportOutlinedIcon size='small' />,
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        toastId: generateRandomString(),
    });
}

export const Info = (message) => {
    toast.info(message, {
        theme: theme,
        icon: <InfoOutlinedIcon size='small' />,
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        toastId: generateRandomString(),
    });
}

export const Progress = (message) => {
    return (
        toast.info(message,
            {
                theme: 'dark',
                width: 350,
                position: "top-right",
                autoClose: false,
                progress: 0,
                toastId: generateRandomString(),
            })
    )
}