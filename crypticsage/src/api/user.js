import axios from "axios";

const baseUrl = process.env.NODE_ENV === 'development' ? process.env.REACT_APP_BASEURL : process.env.REACT_APP_NGROK_URL;

export const verifyPassword = async (data) => {
    let token = data.token;
    let payload = data.payload
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/user/verify_password`, payload, config, {
        withCredentials: true
    })
    return response;
}

export const updatePassword = async (data) => {
    let token = data.token;
    let payload = data.payload
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/user/update_password`, payload, config, {
        withCredentials: true
    })
    return response;
}

export const updateProfileImage = async (data) => {
    let token = data.token;
    let payload = data.payload
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/user/update_profileimage`, payload, config, {
        withCredentials: true
    })
    return response;
}

export const updateUserData = async (data) => {
    let token = data.token;
    let payload = data.payload
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/user/update_userdata`, payload, config, {
        withCredentials: true
    })
    return response;
}

export const updatePreferences = async (data) => {
    let token = data.token;
    let payload = data.payload
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/user/update_preferences`, payload, config, {
        withCredentials: true
    })
    return response;
}

export const updatUserLessonStatus = async (data) => {
    let token = data.token;
    let payload = data.payload
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/user/update_userLessonStatus`, payload, config, {
        withCredentials: true
    })
    return response;
}

export const getInitialQuizDataForUser = async (data) => {
    let token = data.token;
    let payload = data.payload
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/user/get_initial_quiz_data_for_user`, payload, config, {
        withCredentials: true
    })
    return response;
}

export const getQuizQuestions = async (data) => {
    let token = data.token;
    let payload = data.payload
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/user/getQuiz`, payload, config, {
        withCredentials: true
    })
    return response;
}

export const submitQuizResults = async (data) => {
    let token = data.token;
    let payload = data.payload
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/user/submitQuiz`, payload, config, {
        withCredentials: true
    })
    return response;
}

export const getLatestLessonAndQuizResults = async (data) => {
    let token = data.token;
    let payload = data.payload
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/user/get_recent_lesson_and_quiz`, payload, config, {
        withCredentials: true
    })
    return response;
}