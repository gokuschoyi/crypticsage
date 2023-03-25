import axios from "axios";

const baseUrl = process.env.REACT_APP_BASEURL;

export const addSection = async (data) => {
    const response = await axios.post(`${baseUrl}/content/add_section`, data, {
        withCredentials: true
    });
    return response;
}

export const fetchSections = async (data) => {
    let token = data.token;
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/get_sections`, { withCredentials: true }, config)
    return response;
}

export const updateSection = async (data) => {
    let token = data.token;
    let payload = data.payload
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/update_section`, payload, config, {
        withCredentials: true
    })
    return response;
}

export const addLesson = async (data) => {
    let token = data.token;
    let payload = data.data
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/add_lesson`, payload, config, {
        withCredentials: true
    })
    return response;
}

export const fetchLessons = async (data) => {
    let token = data.token;
    let searchParams = {
        sectionId: data.sectionId
    }
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/get_lessons`, searchParams, config, {
        withCredentials: true
    })
    return response;
}

export const updateLesson = async (data) => {
    let token = data.token;
    let payload = data.data
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/update_lesson`, payload, config, {
        withCredentials: true
    })
    return response;
}