import axios from "axios";

const baseUrl = process.env.NODE_ENV === 'development' ? process.env.REACT_APP_BASEURL : process.env.REACT_APP_NGROK_URL;

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
    const response = await axios.post(`${baseUrl}/crypto/getHistoricalData`, { tokenName, timePeriod, timeFrame }, config)
    return response;
}

// Not used in the frontend
export const getWordOfTheDay = async (data) => {
    let token = data.token;
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/user/wordOfTheDay`, { withCredentials: true }, config)
    return response;
}

export const getLatestCryptoData = async (data) => {
    let token = data.token;
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/crypto/get-latest-crypto-data`, { withCredentials: true }, config)
    return response;
}

export const getLatestStocksData = async (data) => {
    let token = data.token;
    let tokenName = data.tokenName;
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/crypto/get-latest-stocks-data`, { tokenName }, config)
    return response;
}

export const getStockSummaryDetails = async (data) => {
    let token = data.token;
    let symbol = data.symbol;
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/crypto/get-stock-summary-details`, { symbol }, config)
    return response;
}

export const fetchSingleTickerInfo = async (data) => {
    let token = data.token;
    let symbol = data.symbol;
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/crypto/fetch_single_ticker_info`, { symbol }, config)
    return response;
}