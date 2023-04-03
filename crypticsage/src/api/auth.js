import axios from "axios";

export const SignupUser = async (data) => {
    const baseUrl = process.env.REACT_APP_BASEURL;
    // console.log(baseUrl)
    const response = await axios.post(`${baseUrl}/auth/signup`, data, {
        withCredentials: false,
        timeout: 10000
    });
    return response;
}

export const LoginUser = async (data) => {
    const baseUrl = process.env.REACT_APP_BASEURL;
    const response = await axios.post(`${baseUrl}/auth/login`, data, {
        withCredentials: false,
        timeout: 10000
    });
    return response;
}