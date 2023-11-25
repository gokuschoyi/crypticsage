import { useRef } from 'react';
import { Success, Error } from '../../../global/CustomToasts'
import {
    setProgressMessage,
    setEpochNo,
    setEpochResults,
    setPredictedValues,
    setPredictionScores,
    setStartWebSocket
} from '../modules/CryptoModuleSlice'

// Function to add a new message
function addMessage(notifyMessageBoxRef, messageText) {
    /* const messageContainer = document.getElementById('messageDiv');
    // Create a new message element
    if (!notifyMessageBoxRef.current) return
    const messageElement = document.createElement('p');
    messageElement.classList.add('socket-message');
    messageElement.textContent = messageText;

    // Insert the new message at the beginning of the container
    notifyMessageBoxRef.current.insertBefore(messageElement, notifyMessageBoxRef.current.firstChild); */


    if (!notifyMessageBoxRef.current) return
    notifyMessageBoxRef.current.classList.add('socket-message')
    notifyMessageBoxRef.current.textContent = messageText
}


const useWebSocket = (webSocketURL, notifyMessageBoxRef, batchResult, evaluating, setBatchResult, setEvaluating, setTrainingStartedFlag, dispatch) => {
    const webSocket = useRef(null);
    const ACTIONS = {
        NOTIFY: 'notify',
        EPOCH_BEGIN: 'epochBegin',
        EPOCH_END: 'epochEnd',
        BATCH_END: 'batchEnd',
        TRAINING_END: 'trainingEnd',
        EVALUATING: 'evaluating',
        EVAL_COMPLETE: 'eval_complete',
        PREDICTION_COMPLETED: 'prediction_completed',
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

            webSocket.current.onmessage = (e) => {
                // console.log('WS: MESSAGE RECEIVED');
                const data = JSON.parse(e.data);
                let batchEndBox, evalBox

                switch (data.action) {
                    case ACTIONS.NOTIFY:
                        addMessage(notifyMessageBoxRef, data.message);
                        break;
                    case ACTIONS.EPOCH_BEGIN:
                        setBatchResult(true)
                        let epoch = data.epoch
                        dispatch(setEpochNo(epoch))
                        break;
                    case ACTIONS.EPOCH_END:
                        dispatch(setEpochResults({ ...data.log, epoch: data.epoch }))
                        setBatchResult(false)
                        break;
                    case ACTIONS.BATCH_END:
                        if (!batchResult) { setBatchResult(true) }
                        batchEndBox = document.querySelector('.batch-end')
                        if (batchEndBox) {
                            batchEndBox.querySelector('#batch-no').textContent = `Batch : ${data.log.batch}/${data.log.totalNoOfBatch}`;
                            batchEndBox.querySelector('#loss').textContent = `Loss : ${data.log.loss}`;
                            batchEndBox.querySelector('#mse').textContent = `MSE : ${data.log.mse}`;
                            batchEndBox.querySelector('#mae').textContent = `MAE : ${data.log.mae}`;
                        }
                        break;
                    case ACTIONS.TRAINING_END:
                        // setTrainingStartedFlag(false)
                        break;
                    case ACTIONS.EVALUATING:
                        setEvaluating(true)
                        evalBox = document.querySelector('.eval-end')
                        if (evalBox) {
                            evalBox.querySelector('#eval-no').textContent = `Evaluating : ${data.log.batch}/${data.log.totalNoOfBatch}`
                        }
                        // console.log('Evaluating', data.log.batch, data.log.totalNoOfBatch)
                        break;
                    case ACTIONS.EVAL_COMPLETE:
                        // setEvaluating((prev) => !prev)
                        dispatch(setPredictionScores(data.scores))
                        break;
                    case ACTIONS.PREDICTION_COMPLETED:
                        setEvaluating(false)
                        setTrainingStartedFlag(false)
                        dispatch(setPredictedValues(data.predictions))
                        dispatch(setStartWebSocket(false))
                        Success('Training completed successfully')
                        break;
                    case ACTIONS.ERROR:
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