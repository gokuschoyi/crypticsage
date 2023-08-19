import { toast } from 'react-toastify';

export const Success = (message) => {
    toast.success(message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        toastId: `addedit${String.fromCharCode(Math.floor(Math.random() * 26) + 65)}`,
    });
}

export const Error = (message) => {
    toast.error(message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        toastId: `addedit${String.fromCharCode(Math.floor(Math.random() * 26) + 65)}`,
    });
}

export const Info = (message) => {
    toast.info(message, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        toastId: `addedit${String.fromCharCode(Math.floor(Math.random() * 26) + 65)}`,
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
                toastId: `addedit${String.fromCharCode(Math.floor(Math.random() * 26) + 65)}`,
            })
    )
}