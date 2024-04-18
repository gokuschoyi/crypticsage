import React, { useRef, useEffect } from 'react'
import { Box, Typography } from '@mui/material'
import { ArrowDropUpIcon } from '../../../../global/Icons'

const updatePriceChange = (oldPrice, newPrice, toAttach) => {
    let priceChangeDiv = document.getElementById(`${toAttach}`);
    priceChangeDiv.innerHTML = '';

    let oldPriceStr = oldPrice.toFixed(2);
    let newPriceStr = newPrice.toFixed(2);

    // console.log('Old Price:', oldPriceStr, 'New Price:', newPriceStr);

    for (let i = 0; i < oldPriceStr.length; i++) {
        let digitSpan = document.createElement('span');
        digitSpan.classList.add('digit-span');
        digitSpan.textContent = newPriceStr[i];

        if (oldPriceStr[i] !== newPriceStr[i]) {
            digitSpan.style.color = 'red';
            priceChangeDiv.appendChild(digitSpan);
            for (let j = i + 1; j < newPriceStr.length; j++) {
                // console.log(j)
                let digitSpan = document.createElement('span');
                digitSpan.classList.add('digit-span');
                digitSpan.textContent = newPriceStr[j];
                digitSpan.style.color = 'red';
                priceChangeDiv.appendChild(digitSpan);
            }
            break;

        } else {
            digitSpan.style.color = 'green';
            priceChangeDiv.appendChild(digitSpan);
        }
    }
}

// Creating the binance websocket connection
const useBinanceWebSocket = (binanceWS_URL) => {
    const websocketRef = useRef(null);
    const isInitializedRef = useRef(false);

    useEffect(() => {
        if (!isInitializedRef.current) {
            // console.log('UE 9 INSIDE: Opening Binance WebSocket connection...');
            websocketRef.current = new WebSocket(binanceWS_URL);
            isInitializedRef.current = true;
        }

        return () => {
            if (websocketRef.current && websocketRef.current.readyState === 1) {
                console.log('Closing Binance WebSocket connection (24h change)...');
                websocketRef.current.close();
            }
        };
    }, [binanceWS_URL]);

    return websocketRef;
};

const SingleTicker = () => {
    const ticker = window.location.href.split("/dashboard/indicators/")[1].split("/")[1].toLocaleLowerCase();
    // console.log(ticker)
    const webSocketConnectionURI = `wss://stream.binance.com:9443/ws/${ticker}@ticker`
    const b_ws = useBinanceWebSocket(webSocketConnectionURI);

    const valuesRef = useRef({
        price_change: { value: 0, direction: 'up' },
        price_change_percent: { value: 0, direction: 'up' }
    });

    useEffect(() => {
        if (b_ws.current) {
            b_ws.current.onopen = () => {
                console.log('WebSocket connection opened');
            };
            // const ticker_p = document.getElementById('price_change')
            b_ws.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                updatePriceChange(valuesRef.current.price_change.value, parseFloat(data.p), 'st-price-box')
                updatePriceChange(valuesRef.current.price_change_percent.value, parseFloat(data.P), 'st-price-change')

                const price_direction = parseFloat(data.p) > valuesRef.current.price_change.value ? 'up' : 'down'
                const price_percent_direction = parseFloat(data.P) > valuesRef.current.price_change_percent.value ? 'up' : 'down'

                const arrow_price_change = document.getElementById('arrow-price-change')
                arrow_price_change.style.transform = `rotate(${price_direction === 'up' ? '0deg' : '180deg'})`
                arrow_price_change.style.color = price_direction === 'up' ? 'green' : 'red'

                const arrow_price_change_percent = document.getElementById('arrow-price-change-percent')
                arrow_price_change_percent.style.transform = `rotate(${price_percent_direction === 'up' ? '0deg' : '180deg'})`
                arrow_price_change_percent.style.color = price_percent_direction === 'up' ? 'green' : 'red'

                // console.log(price_direction, price_percent_direction)
                let obj = {
                    price_change: { value: parseFloat(data.p), direction: price_direction },
                    price_change_percent: { value: parseFloat(data.P), direction: price_percent_direction }
                }

                valuesRef.current = obj
            };

            b_ws.current.onclose = () => {
                console.log('WebSocket connection closed');
            };

            b_ws.current.onerror = (error) => {
                console.error('WebSocket error:', error);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [b_ws]);

    // console.log(valuesRef.current)
    return (
        <Box className='single_ticker_box'>
            <Box display={'flex'} flexDirection={'row'} alignItems={'center'}>
                <Box id='st-price-box' className='token-price-container'></Box>
                <ArrowDropUpIcon className='small-icon' id='arrow-price-change' />
            </Box>
            <Box display={'flex'} flexDirection={'row'} alignItems={'center'} gap={'2px'}>
                <Box id='st-price-change' className='token-price-change-container'></Box>
                <Typography variant='body2' sx={{ fontSize: '0.65rem' }}>%</Typography>
                <ArrowDropUpIcon className='small-icon' id='arrow-price-change-percent' />
            </Box>
        </Box>
    )
}

export default SingleTicker