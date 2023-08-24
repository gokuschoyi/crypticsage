const logger = require('../middleware/logger/Logger')
const log = logger.create(__filename.slice(__dirname.length + 1))

const formatMillisecond = (milliseconds) => {
    if (milliseconds < 1000) {
        return milliseconds.toFixed(3) + ' ms';
    } else if (milliseconds < 60000) {
        return (milliseconds / 1000).toFixed(3) + ' s';
    } else {
        const hours = Math.floor(milliseconds / 3600000);
        const minutes = Math.floor((milliseconds % 3600000) / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        const remainingMilliseconds = milliseconds % 1000;

        const formattedTime = [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            seconds.toString().padStart(2, '0'),
            remainingMilliseconds.toString().padStart(3, '0')
        ].join(':');

        return formattedTime;
    }
}

class Timer {
    constructor(name) {
        this.name = name
        this.startTime = 0
        this.endTime = 0
    }

    startTimer() {
        this.startTime = performance.now();
    }

    stopTimer(filename) {
        this.endTime = performance.now();
        const elapsed = this.endTime - this.startTime
        const formatted = formatMillisecond(elapsed)
        log.info(`Process [${this.name}] from [${filename}] took ${formatted}`)
    }

    calculateTime() {
        this.endTime = performance.now();
        return formatMillisecond(this.endTime - this.startTime)
    }
}

module.exports = {
    createTimer: (name) => {
        return new Timer(name)
    }
}