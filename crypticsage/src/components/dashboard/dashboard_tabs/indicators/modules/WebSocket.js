import { useRef } from 'react';
import { Success } from '../../../global/CustomToasts'
import {
    setProgressMessage,
    setEpochNo,
    setEpochResults,
    setPredictedValues,
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


const useWebSocket = (webSocketURL, notifyMessageBoxRef, batchResult, setBatchResult, setTrainingStartedFlag, dispatch) => {
    const webSocket = useRef(null);
    const ACTIONS = {
        NOTIFY: 'notify',
        EPOCH_BEGIN: 'epochBegin',
        EPOCH_END: 'epochEnd',
        BATCH_END: 'batchEnd',
        TRAINING_END: 'trainingEnd',
        PREDICTION_COMPLETED: 'prediction_completed',
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
                let batchEndBox

                switch (data.action) {
                    case ACTIONS.NOTIFY:
                        addMessage(notifyMessageBoxRef, data.message.message);
                        // dispatch(setProgressMessage(data.message))
                        break;
                    case ACTIONS.EPOCH_BEGIN:
                        setBatchResult(true)
                        // console.log(batchEndBox)
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
                            batchEndBox.querySelector('#batch-no').textContent = `Batch : ${data.log.batch}`;
                            batchEndBox.querySelector('#loss').textContent = `Loss : ${data.log.loss}`;
                            batchEndBox.querySelector('#mse').textContent = `MSE : ${data.log.mse}`;
                            batchEndBox.querySelector('#mae').textContent = `MAE : ${data.log.mae}`;
                        }
                        // setBatchResult((prev) => { return { ...prev, ...data.log } })
                        break;
                    case ACTIONS.TRAINING_END:
                        // console.log('Training completed')
                        setTrainingStartedFlag(false)
                        break;
                    case ACTIONS.PREDICTION_COMPLETED:
                        dispatch(setPredictedValues(data.predictions))
                        dispatch(setStartWebSocket(false))
                        Success('Training completed successfully')
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