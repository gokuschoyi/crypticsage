import axios from "axios";

const baseUrl = process.env.NODE_ENV === 'development' ? process.env.REACT_APP_BASEURL : process.env.REACT_APP_NGROK_URL;

export const getHistoricalStatFromDb = async ({ token }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/get_tickers`, { withCredentials: true }, config)
    return response;
}

export const refreshTickerMeta = async ({ token, length }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/crypto/update_ticker_meta`, { length }, config, {
        withCredentials: true
    })
    return response;
}

export const deleteOneTickerMeta = async ({ token, symbol }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/crypto/delete_ticker_meta`, { symbol }, config, {
        withCredentials: true
    })
    return response;
}