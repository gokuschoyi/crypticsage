import axios from "axios";
const baseUrl = process.env.NODE_ENV === 'development' ? process.env.REACT_APP_BASEURL : process.env.REACT_APP_NGROK_URL;
export const SignupUser = async (data) => {
    const response = await axios.post(`${baseUrl}/auth/signup`, data, {
        withCredentials: false,
        timeout: 10000
    });
    return response;
}

export const LoginUser = async (data) => {
    const response = await axios.post(`${baseUrl}/auth/login`, data, {
        withCredentials: false,
        timeout: 10000
    });
    return response;
}