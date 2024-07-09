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

export const getNewTickersToAdd = async ({ token }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/fetch_new_tickers_to_add`, { withCredentials: true }, config)
    return response;
}

export const addNewBinanceTickerMeta = async ({ token, ticker_to_add }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/add_new_ticker_meta`, { ticker_to_add }, config, {
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

export const fetchLatestTickerForUser = async ({ token, updateQueries }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/get_latest_ticker_data_for_user`, { updateQueries }, config, {
        withCredentials: true
    })
    return response;
}

export const updateTickerWithOneDataPoint = async ({ token, fetchQuery }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/content/save_one_ticker_data_for_user`, { fetchQuery }, config, {
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
    const response = await axios.post(`${baseUrl}/content/update_historical_yFinance_data`, { symbol }, config, {
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
    const { asset_type, ticker_name, period, page_no, items_per_page, new_fetch_offset } = payload;
    const response = await axios.post(`${baseUrl}/crypto/fetch_token_data`, { asset_type, ticker_name, period, page_no, items_per_page, new_fetch_offset }, config, {
        withCredentials: true
    })
    return response;
}

export const executeTalibFunction = async ({ token, payload }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/indicators/execute_talib_function`, { payload }, config, {
        withCredentials: true
    })
    return response;
}

// <---------------------- Model related APIs ---------------------->

export const startModelTraining = async ({ token, payload }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/model/start_model_training`, { ...payload }, config, {
        withCredentials: true
    })
    return response;
}

export const retrain_wgan_Model = async ({ token, payload }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/model/retrain_model`, { ...payload }, config, {
        withCredentials: true
    })
    return response;
}

export const getCorelationMatrix = async ({ token, payload }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/model/get_corelation_matrix`, { ...payload }, config, {
        withCredentials: true
    })
    return response;
}

export const getPartialAutoCorrelation = async ({ token, payload }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/model/get_partial_auto_correlation`, { ...payload }, config, {
        withCredentials: true
    })
    return response;
}

export const getUserModels = async ({ token }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/model/get_model`, { withCredentials: true }, config)
    return response;
}

export const saveModelSessions = async ({ token, payload }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/model/save_model_runs`, { ...payload }, config, {
        withCredentials: true
    })
    return response;
}

export const deleteModel = async ({ token, payload }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const { model_id, model_type, asset_type, ticker_name, period, delete_type, last_checkpoint } = payload;
    const response = await axios.post(`${baseUrl}/model/delete_model`, { model_id, model_type, asset_type, ticker_name, period, delete_type, last_checkpoint }, config, {
        withCredentials: true
    })
    return response;
}

export const deleteModelForUser = async ({ token, model_id, model_type }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/model/delete_user_model`, { model_id, model_type }, config, {
        withCredentials: true
    })
    return response;
}

export const addNewTrainingResults = async ({ token, payload }) => {
    const config = {
        headers: { "Authorization": `Bearer ${token}` },
    };
    const response = await axios.post(`${baseUrl}/model/update_new_predictions`, { ...payload }, config)
    return response;
}

export const renameModel = async ({ token, payload }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const { model_id, model_name } = payload;
    const response = await axios.post(`${baseUrl}/model/rename_model`, { model_id, model_name }, config, {
        withCredentials: true
    })
    return response;
}

export const getModelCheckPoints = async ({ token, model_id }) => {
    const config = {
        headers: { "Authorization": `Bearer ${token}` },
        withCredentials: true
    };
    const response = await axios.get(`${baseUrl}/model/get_model_checkpoints?model_id=${model_id}`, config)
    return response;
}

export const quick_forecast = async ({ token, payload }) => {
    const config = {
        headers: { "Authorization": `Bearer ${token}` },
        withCredentials: true
    };
    const response = await axios.post(`${baseUrl}/model/quick_forecasting`, { ...payload }, config)
    return response;

}

export const makeNewPrediction = async ({ token, payload }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/model/make_new_prediction`, { payload }, config, {
        withCredentials: true
    })
    return response;
}

export const makeWganPrediction = async ({ token, payload }) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/model/make_wgan_prediction`, { payload }, config, {
        withCredentials: true
    })
    return response;
}

export const getModelTrainingStatus = async (token, model_id) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/model/model_training_status`, { model_id }, config, {
        withCredentials: true
    })
    return response;
}

export const getWganCachedTrainingData = async (token, payload) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` }
    };
    const response = await axios.post(`${baseUrl}/model/get_cached_training_result`, { ...payload }, config, {
        withCredentials: true
    })
    return response;
}