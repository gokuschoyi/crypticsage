import axios from "axios";

const baseUrl = process.env.REACT_APP_BASEURL;

export const getCryptoData = async (data) => {
    let token = data.token;
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/crypto/getCryptoData`, { withCredentials: true }, config)
    return response;
}

export const getHistoricalData = async (data) => {
    let token = data.token;
    let tokenName = data.tokenName;
    let timePeriod = data.timePeriod;
    let timeFrame = data.timeFrame;
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/crypto/getHistoricalData`, { token, tokenName, timePeriod, timeFrame }, config)
    return response;
}