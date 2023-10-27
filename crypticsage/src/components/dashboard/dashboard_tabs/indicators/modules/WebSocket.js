import { useRef } from 'react';
import {
    setProgressMessage,
    setEpochNo,
    setEpochResults,
    setPredictedValues,
    setStartWebSocket
} from '../modules/CryptoModuleSlice'
import { useSelector } from 'react-redux';

const useWebSocket = (webSocketURL, batchResult, setBatchResult, setTrainingStartedFlag, dispatch) => {
    const webSocket = useRef(null);
    const ACTIONS = {
        NOTIFY: 'notify',
        EPOCH_BEGIN: 'epochBegin',
        EPOCH_END: 'epochEnd',
        BATCH_END: 'batchEnd',
        TRAINING_END: 'trainingEnd',
        PREDICTION_COMPLETED: 'prediction_completed',
    };

    const epochNo = useSelector(state => state.cryptoModule.modelData.epoch_no)


    const createModelProgressWebSocket = () => {
        if (webSocket.current && webSocket.current.readyState === WebSocket.OPEN) {
            console.log('UE: WebSocket connection is already open', webSocket.current);
        } else {
            webSocket.current = new WebSocket(webSocketURL);

            webSocket.current.onopen = () => {
                console.log('WS: CONNECTION ESTABLISHED');
                webSocket.current.send(JSON.stringify({ action: 'Socket connection established' })); // Now that the connection is open, you can send data.
            }

            webSocket.current.onmessage = (e) => {
                // console.log('WS: MESSAGE RECEIVED');
                const data = JSON.parse(e.data);
                let batchEndBox

                switch (data.action) {
                    case ACTIONS.NOTIFY:
                        dispatch(setProgressMessage(data.message))
                        break;
                    case ACTIONS.EPOCH_BEGIN:
                        setBatchResult(true)
                        // console.log(batchEndBox)
                        let epoch = data.epoch
                        dispatch(setEpochNo(epoch))
                        break;
                    case ACTIONS.EPOCH_END:
                        dispatch(setEpochResults({ ...data.log, epoch: epochNo }))
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