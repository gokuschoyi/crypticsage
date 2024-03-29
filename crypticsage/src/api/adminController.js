import axios from "axios";

const baseUrl = process.env.NODE_ENV === 'development' ? process.env.REACT_APP_BASEURL : process.env.REACT_APP_NGROK_URL;

export const getBinanceHistoricalStatFromDb = async ({ token }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/get_binance_tickers`, { withCredentials: true }, config)
    return response;
}

export const getYfinanceHistoricalStatFromDb = async ({ token }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/get_yfinance_tickers`, { withCredentials: true }, config)
    return response;
}

export const refreshTickerMeta = async ({ token, length }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/update_ticker_meta`, { length }, config, {
        withCredentials: true
    })
    return response;
}

export const deleteOneTickerMeta = async ({ token, symbol }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/delete_ticker_meta`, { symbol }, config, {
        withCredentials: true
    })
    return response;
}

export const checkForYFTicker = async ({ token, symbols }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/find_yf_ticker`, { symbols }, config, {
        withCredentials: true
    })
    return response;
}

export const fetchOneBinanceTicker = async ({ token, fetchQueries }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/fetch_one_binance_ticker`, { fetchQueries }, config, {
        withCredentials: true
    })
    return response;
}

export const updateOneBinanceTicker = async ({ token, updateQueries }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/update_one_binance_ticker`, { updateQueries }, config, {
        withCredentials: true
    })
    return response;
}

export const updateAllBinanceTickers = async ({ token }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/update_all_tickers`, { withCredentials: true }, config)
    return response;
}

export const fetchOneYfinanceTicker = async ({ token, symbol }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/fetch_one_yfinance_ticker`, { symbol }, config, {
        withCredentials: true
    })
    return response;
}

export const updateAllYFinanceTickers = async ({ token, symbol }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/historicalData/update_historical_yFinance_data`, { symbol }, config, {
        withCredentials: true
    })
    return response;
}

export const deleteOneYfinanceTicker = async ({ token, symbol }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/delete_one_yfinace_ticker`, { symbol }, config, {
        withCredentials: true
    })
    return response;
}

export const checkProcessStatus = async ({ token, payload }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const { jobIds, type } = payload;
    const response = await axios.post(`${baseUrl}/content/get_process_status`, { jobIds, type }, config, {
        withCredentials: true
    })
    return response;
}

export const checkFullUpdateStatus = async ({ token, payload }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const { jobIds, type } = payload;
    const response = await axios.post(`${baseUrl}/historicalData/get_completition_status`, { jobIds, type }, config, {
        withCredentials: true
    })
    return response;
}


export const getIndicatorDesc = async ({ token }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/indicators/get_talib_desc`, { withCredentials: true }, config)
    return response;
}

export const getHistoricalTickerDataFroDb = async ({ token, payload }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const { asset_type, ticker_name, period, page_no, items_per_page } = payload;
    const response = await axios.post(`${baseUrl}/crypto/fetch_token_data`, { asset_type, ticker_name, period, page_no, items_per_page }, config, {
        withCredentials: true
    })
    return response;
}