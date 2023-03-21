import axios from "axios";

export const fetchSections = async (data) => {
    let token = data.token;
    const baseUrl = process.env.REACT_APP_BASEURL;
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/get_sections`, { withCredentials: true }, config)
    return response;
}

export const addSection = async (data) => {
    const baseUrl = process.env.REACT_APP_BASEURL;
    const response = await axios.post(`${baseUrl}/content/add_section`, data, {
        withCredentials: true
    });
    return response;
}

export const fetchLessons = async (data) => {
    let token = data.token;
    let searchParams = {
        sectionId: data.sectionId
    } 
    const baseUrl = process.env.REACT_APP_BASEURL;
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/get_lessons`, searchParams, config, {
        withCredentials: true
    })
    return response;
}