import { toast } from 'react-toastify';
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