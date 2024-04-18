export const generateElapsedDate = (day, hr, m) => {
    const parts = []
    if (day > 0) {
        parts.push(`${day}d`)
    }
    if (hr > 0) {
        parts.push(`${hr}h`)
    }
    if (m > 0) {
        parts.push(`${m}m`)
    }
    if (m === 0) {
        parts.push(`0m`)
    }
    return parts.join(':')
}

export const returnGreaterThan4hColor = (days) => {
    if (days > 7) {
        return 'red';
    } else if (days > 3 && days <= 7) {
        return 'brown';
    } else if (days >= 1 && days <= 3) {
        return '#ff9c4a';
    } else {
        return '#04ff04';
    }
}

export const return1MColor = (days, hrs) => {
    if (days > 1) {
        return 'red';
    } else if (days >= 1) {
        return 'brown';
    } else if (hrs > 4 && hrs <= 24) {
        return '#ff9c4a';
    } else {
        return '#04ff04';
    }
}

export const getRandomHexColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

export const formatDateDifferenceToNow = (targetDate) => {
    const now = new Date().getTime();
    const difference = Math.abs(now - targetDate);

    const oneMinuteInMilliseconds = 60 * 1000;
    const oneHourInMilliseconds = 60 * oneMinuteInMilliseconds;
    const oneDayInMilliseconds = 24 * oneHourInMilliseconds;

    const elapsedDays = Math.floor(difference / oneDayInMilliseconds);
    const remainingMilliseconds = difference % oneDayInMilliseconds;
    const elapsedHours = Math.floor(remainingMilliseconds / oneHourInMilliseconds);
    const remainingMillisecondsAfterHours = remainingMilliseconds % oneHourInMilliseconds;
    const elapsedMinutes = Math.floor(remainingMillisecondsAfterHours / oneMinuteInMilliseconds);

    return [elapsedDays, elapsedHours, elapsedMinutes]
}
