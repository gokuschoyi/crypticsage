import { useRef } from 'react';
import { Success, Error, Warning } from '../../../global/CustomToasts'
import {
    setModelEndTime,
    setEpochNo,
    setEpochResults,
    setPredictedValues,
    setPredictionScores,
    setStartWebSocket,
    setFeatureCorrelationData,
    setIntermediateForecastResults,
    setWganFinalForecast
} from '../modules/CryptoModuleSlice'

// Function to add a new message
function addMessage(notifyMessageBoxRef, messageText) {
    if (!notifyMessageBoxRef.current) return
    notifyMessageBoxRef.current.classList.add('socket-message')
    notifyMessageBoxRef.current.textContent = messageText
}

function interpolateColor(color1, color2, factor) {
    let result = "#";
    for (let i = 1; i <= 5; i += 2) {
        let hex1 = parseInt(color1.substr(i, 2), 16);
        let hex2 = parseInt(color2.substr(i, 2), 16);
        let blended = Math.round(hex1 + (hex2 - hex1) * factor).toString(16);
        while (blended.length < 2) blended = '0' + blended; // pad with zero
        result += blended;
    }
    return result;
}

function getColorForValue(value, min, max, startColor, endColor) {
    let factor = (value - min) / (max - min);
    factor = Math.max(0, Math.min(1, factor)); // Clamp factor between 0 and 1
    return interpolateColor(startColor, endColor, factor);
}


const useWebSocket = (
    webSocketURL,
    userSelectedEpoch,
    notifyMessageBoxRef,
    batchResult,
    evaluating,
    batchLinearProgressRef,
    evalLinearProgressRef,
    wgangpProgressRef,
    setBatchResult,
    setEvaluating,
    setTrainingStartedFlag,
    dispatch
) => {
    const webSocket = useRef(null);
    const ACTIONS = {
        FEATURE_RELATIONS: 'feature_relations',
        NOTIFY: 'notify',
        EPOCH_BEGIN: 'epochBegin',
        EPOCH_END: 'epochEnd',
        BATCH_END: 'batchEnd',
        TRAINING_END: 'trainingEnd',
        EVALUATING: 'evaluating',
        EVAL_COMPLETE: 'eval_complete',
        PREDICTION_COMPLETED: 'prediction_completed',
        INTERMEDIATE_FORECAST: 'intermediate_forecast',
        ERROR: 'error'
    };

    const createModelProgressWebSocket = () => {
        if (webSocket.current && webSocket.current.readyState === WebSocket.OPEN) {
            notifyMessageBoxRef.current = document.getElementById('loader-message-text');
            console.log('UE: WebSocket connection is already open', webSocket.current);
        } else {
            webSocket.current = new WebSocket(webSocketURL);

            webSocket.current.onopen = () => {
                console.log('WS: CONNECTION ESTABLISHED');
                notifyMessageBoxRef.current = document.getElementById('loader-message-text');
                webSocket.current.send(JSON.stringify({ action: 'Socket connection established' })); // Now that the connection is open, you can send data.
            }

            let currentEpoch = 0;
            webSocket.current.onmessage = (e) => {
                // console.log('WS: MESSAGE RECEIVED');
                const data = JSON.parse(e.data);
                let batchEndBox

                switch (data.action) {
                    case ACTIONS.FEATURE_RELATIONS:
                        dispatch(setFeatureCorrelationData(data.relations))
                        break;
                    case ACTIONS.NOTIFY:
                        addMessage(notifyMessageBoxRef, data.message);
                        break;
                    case ACTIONS.EPOCH_BEGIN:
                        setBatchResult(true)
                        let epoch = data.epoch
                        batchEndBox = document.querySelector('.batch-end')
                        if (batchEndBox) {
                            batchEndBox.querySelector('#epoch').textContent = `E : ${epoch}`
                        }
                        dispatch(setEpochNo(epoch + 1))
                        break;
                    case ACTIONS.EPOCH_END:
                        dispatch(setEpochResults({ ...data.log, epoch: data.epoch }))
                        currentEpoch++
                        break;
                    case ACTIONS.BATCH_END:
                        if (!batchResult) { setBatchResult(true) }
                        if (data.log?.model === 'discriminator' || data.log?.model === 'generator') {
                            let totalNoOfBatch = data.log.totalNoOfBatch
                            const percentageCompleted = parseFloat(((data.log.batch / totalNoOfBatch) * 100).toFixed(2)) || 0
                            const bgColor = getColorForValue(percentageCompleted, 0, 100, '#C2185B', '#388E3C');
                            if (wgangpProgressRef.current) {
                                const linearProgress = wgangpProgressRef.current.querySelector('#linear-progress')
                                let progressBar = linearProgress.querySelector('span')

                                linearProgress.style.backgroundColor = bgColor;
                                const batchCount = wgangpProgressRef.current.querySelector('#batch-count')

                                batchCount.innerHTML = `(${percentageCompleted}%) ${data.log.batch}/${totalNoOfBatch}`
                                progressBar.style.transform = `translateX(-${100 - percentageCompleted}%)`
                                batchEndBox = document.querySelector('.batch-end')
                                if (batchEndBox) {
                                    if (data.log.model === 'discriminator') {
                                        batchEndBox.querySelector('#model_type').textContent = `${data.log.model}`;
                                        batchEndBox.querySelector('#n_critic').textContent = `Critic Iter : ${data.log.critic_iteration}`;
                                        batchEndBox.querySelector('#loss').textContent = `Loss : ${data.log.loss}`;
                                    } else {
                                        batchEndBox.querySelector('#model_type').textContent = `${data.log.model}`;
                                        batchEndBox.querySelector('#n_critic').textContent = ``;
                                        batchEndBox.querySelector('#loss').textContent = `Loss : ${data.log.loss}`;
                                    }
                                }
                            }
                        } else {
                            let totalNoOfBatch = data.log.totalNoOfBatch
                            const percentageCompleted = parseFloat(((data.log.batch / totalNoOfBatch) * 100).toFixed(2)) || 0
                            const bgColor = getColorForValue(percentageCompleted, 0, 100, '#C2185B', '#388E3C');
                            if (batchLinearProgressRef.current) {
                                const linearProgress = batchLinearProgressRef.current.querySelector('#linear-progress')
                                let progressBar = linearProgress.querySelector('span')

                                linearProgress.style.backgroundColor = bgColor;
                                progressBar.style.transform = `translateX(-${100 - percentageCompleted}%)`

                                const batchCount = batchLinearProgressRef.current.querySelector('#batch-count')
                                batchCount.innerHTML = `(${percentageCompleted}%) ${data.log.batch}/${totalNoOfBatch}`
                            }
                            batchEndBox = document.querySelector('.batch-end')
                            if (batchEndBox) {
                                batchEndBox.querySelector('#loss').textContent = `Loss : ${data.log.loss}`;
                                batchEndBox.querySelector('#mse').textContent = `MSE : ${data.log.mse}`;
                                batchEndBox.querySelector('#mae').textContent = `MAE : ${data.log.mae}`;
                            }
                        }
                        break;
                    case ACTIONS.TRAINING_END:
                        setBatchResult(false)
                        if (currentEpoch < userSelectedEpoch) {
                            console.log('Early stopping', currentEpoch, userSelectedEpoch)
                            Warning(`Early stopping, Epochs completed : ${currentEpoch}, Epochs selected : ${userSelectedEpoch}`)
                        } else {
                            console.log('Model trained for all epochs')
                        }
                        // setTrainingStartedFlag(false)
                        break;
                    case ACTIONS.EVALUATING:
                        if (!evaluating) { setEvaluating(true) }
                        if (evalLinearProgressRef.current) {
                            const evalPercentageCompleted = parseFloat(((data.log.batch / data.log.totalNoOfBatch) * 100).toFixed(2)) || 0
                            const evalBgColor = getColorForValue(evalPercentageCompleted, 0, 100, '#C2185B', '#388E3C');

                            const evalLinearProgress = evalLinearProgressRef.current.querySelector('#linear-progress')
                            let evalProgressBar = evalLinearProgress.querySelector('span')

                            evalLinearProgress.style.backgroundColor = evalBgColor;
                            evalProgressBar.style.transform = `translateX(-${100 - evalPercentageCompleted}%)`

                            const evalCount = evalLinearProgressRef.current.querySelector('#batch-count')
                            evalCount.innerHTML = `(${evalPercentageCompleted}%) ${data.log.batch}/${data.log.totalNoOfBatch}`
                        }
                        break;
                    case ACTIONS.EVAL_COMPLETE:
                        setEvaluating(false)
                        dispatch(setPredictionScores(data.scores))
                        break;
                    case ACTIONS.INTERMEDIATE_FORECAST:
                        const { action: a, ...rest } = data
                        dispatch(setIntermediateForecastResults(rest))
                        break;
                    case ACTIONS.PREDICTION_COMPLETED:
                        setTrainingStartedFlag(false)
                        dispatch(setModelEndTime(new Date().getTime()))
                        if (data.model_type === 'WGAN-GP') {
                            dispatch(setWganFinalForecast({ predictions: data.predictions, rmse: data.rmse }))
                        } else {
                            dispatch(setPredictedValues(data.predictions))
                        }
                        currentEpoch = 0
                        Success('Training completed successfully')
                        dispatch(setStartWebSocket(false))
                        break;
                    case ACTIONS.ERROR:
                        setBatchResult(false)
                        dispatch(setStartWebSocket(false))
                        setTrainingStartedFlag(false)
                        Error(data.message)
                        break;
                    default:
                        break;
                }
            }

            webSocket.current.onclose = () => {
                console.log('WS: CONNECTION CLOSED');
                webSocket.current = null
            }

            webSocket.current.onerror = (err) => {
                console.log('WS: CONNECTION ERROR', err);
                dispatch(setStartWebSocket(true))
            }
        }
    }

    // console.log('Socket state', webSocket.current)

    return { createModelProgressWebSocket, webSocket }
}

export default useWebSocket;