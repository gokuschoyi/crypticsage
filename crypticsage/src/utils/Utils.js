import { useState, useEffect } from "react";

export const useElementSize = (className, delay = 0) => {
    const [size, setSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        const element = document.getElementsByClassName(className)[0];

        if (!element) {
            console.warn(`Element with class ${className} not found.`);
            return;
        }

        // Debounce function
        let timeoutId = null;
        const debounce = (func, delay) => {
            return (...args) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func(...args);
                }, delay);
            };
        };

        // Create a Resize Observer
        const resizeObserver = new ResizeObserver(entries => {
            if (entries[0]) {
                const { width, height } = entries[0].contentRect;
                debounceUpdateSize(width, height);
            }
        });

        const debounceUpdateSize = debounce((newWidth, newHeight) => {
            // Only update if the size is different
            if ((newWidth !== size.width || newHeight !== size.height) && (newWidth !== 0 && newHeight !== 0)) {
                setSize({ width: Math.round(newWidth), height: Math.round(newHeight) });
            }
        }, delay);

        // Observe the element
        resizeObserver.observe(element);

        // Cleanup function
        return () => {
            resizeObserver.disconnect();
            clearTimeout(timeoutId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [className, delay]);
    return size;
}

export const shortenDate = (dateString) => {
    if (dateString === '') { return '' } else {
        const [date, time] = dateString.split(", ");
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        // eslint-disable-next-line no-unused-vars
        const [amPm, timeZone] = time.split(" ");
        const [month, day] = date.split("/");
        let MM = months[(parseInt(month) - 1)]
        const [hour, minute] = time.split(/:| /);
        const formattedDate = `${day} ${MM} : ${hour}:${minute} ${timeZone.toUpperCase()}`;
        return formattedDate;
    }
}

export const capitalizeFirstLetter = (string) => {
    return string[0].toUpperCase() + string.slice(1);
}

// convert large number to K, M, B, T
export const convert = (n) => {
    if (n === null) return 'N/A';
    if (n < 0) {
        return `-${convert(-n)}`;
    }
    if (n < 1e3) return n;
    if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(1) + "K";
    if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(1) + "M";
    if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(1) + "B";
    if (n >= 1e12) return +(n / 1e12).toFixed(1) + "T";
};

// get the time string for the user
export const getLastUpdatedTimeString = (lastUpdated) => {
    const currentTimestamp = Math.floor(Date.now() / 1000); // Get current timestamp in seconds
    const differenceInSeconds = currentTimestamp - lastUpdated;
    const differenceInMinutes = Math.floor(differenceInSeconds / 60);
    const differenceInHours = Math.floor(differenceInMinutes / 60);
    let timeAgo;

    if (differenceInMinutes < 1) {
        timeAgo = 'just now';
    } else if (differenceInMinutes < 60) {
        timeAgo = `${differenceInMinutes} minute${differenceInMinutes > 1 ? 's' : ''} ago`;
    } else if (differenceInHours < 24) {
        timeAgo = `${differenceInHours} hour${differenceInHours > 1 ? 's' : ''} ago`;
    }
    return timeAgo;
}

// get the date time for the user
export const getDateTime = (timestamp) => {
    const nDate = new Date(timestamp * 1000).toLocaleString();
    const [date, timeAndTimeZone] = nDate.split(", ");
    const [m, d, y] = date.split("/");
    const newDate = `${d}/${m}/${y}`;
    const finalDate = `${newDate}, ${timeAndTimeZone}`;
    return finalDate
}

export const getCurrencySymbol = (currency) => {
    switch (currency.toUpperCase()) {
        case 'USD':
            return '$';
        case 'AUD':
            return '$';
        case 'NZD':
            return '$';
        case 'CAD':
            return '$';
        case 'EUR':
            return '€';
        case 'JPY':
            return '¥';
        default:
            return '';
    }
}