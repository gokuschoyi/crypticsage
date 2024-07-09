var fs = require('fs')
var morgan = require('morgan')
const winston = require('winston')
const { createLogger, format, transports } = winston
const { combine, label, timestamp, colorize, align, printf, errors } = format;

const APP_LOG_LOG_PATH = `${__dirname}/logs/app_p2.log`
const ACCESS_LOG_PATH = `${__dirname}/logs/access_p2.log`
let LOG_LEVEL = 'info'

const syslogColors = {
    debug: "rainbow",
    info: "cyan",
    notice: "italic white",
    warn: "yellow",
    error: "bold red",
    crit: "inverse yellow",
    alert: "bold red",
    emerg: "bold magenta",
};

const LOG_LEVELS = {
    debug: 7,
    info: 6,
    notice: 5,
    warn: 4,
    error: 3,
    crit: 2,
    alert: 1,
    emerg: 0,
}

function formatDateWithMilliseconds(unixMilliseconds) {
    const date = new Date(unixMilliseconds);

    const milliseconds = date.getMilliseconds();
    const millisecondsString = milliseconds.toString().padStart(3, '0'); // Ensure 3 digits

    const dateString = date.toLocaleString('en-AU');
    const [date_, time] = dateString.split(', ')
    const [hms, ampm] = time.split(' ')
    const newTime = `${hms}:${millisecondsString}`

    return `${date_}, ${newTime} ${ampm}`;
}

class Logger {
    constructor(loggerLabel) {
        // setting up custom loggers
        const APP_LOG_FORMAT = printf(
            ({ level, message, label, timestamp }) => {
                const localTime = formatDateWithMilliseconds(timestamp)
                const capLevel = level.toUpperCase()
                const returnMessage = `${localTime} [${label}] ${capLevel}: ${message}`
                return returnMessage
            }
        )

        // writing to console only with colors
        const APP_FORMAT = combine(
            errors({ stack: true }),
            label({ label: loggerLabel }),
            timestamp(),
            APP_LOG_FORMAT,
            colorize({ all: true, colors: syslogColors }),
        )

        this.APP_LOG = createLogger({
            level: LOG_LEVEL,
            format: APP_FORMAT,
            transports: [
                // new transports.File({ filename: APP_LOG_LOG_PATH }),
                // @ts-ignore
                new transports.Console({ APP_FORMAT }),
            ],
            levels: LOG_LEVELS
        })

        // writing to file only
        const LOG_ACCESS_FORMAT = combine(
            label({ label: loggerLabel }),
            timestamp(),
            APP_LOG_FORMAT
        )

        this.APP_LOG_ = createLogger({
            level: LOG_LEVEL,
            format: LOG_ACCESS_FORMAT,
            transports: [
                new transports.File({ filename: APP_LOG_LOG_PATH }),
            ],
            levels: LOG_LEVELS
        })


    }

    debug(m) {
        m = (typeof m === "object") ? JSON.stringify(m) : m
        this.APP_LOG.debug(m)
        this.APP_LOG_.debug(m)
    }

    info(m) {
        m = (typeof m === "object") ? JSON.stringify(m) : m
        this.APP_LOG.info(m)
        this.APP_LOG_.info(m)
    }

    notice(m) {
        m = (typeof m === "object") ? JSON.stringify(m) : m
        this.APP_LOG.notice(m)
        this.APP_LOG_.notice(m)
    }

    warn(m) {
        m = (typeof m === "object") ? JSON.stringify(m) : m
        this.APP_LOG.warn(m)
        this.APP_LOG_.warn(m)
    }

    error(m) {
        m = (typeof m === "object") ? JSON.stringify(m) : m
        this.APP_LOG.error(m)
        this.APP_LOG_.error(m)
    }

    crit(m) {
        m = (typeof m === "object") ? JSON.stringify(m) : m
        this.APP_LOG.crit(m)
        this.APP_LOG_.crit(m)
    }

    alert(m) {
        m = (typeof m === "object") ? JSON.stringify(m) : m
        this.APP_LOG.alert(m)
        this.APP_LOG_.alert(m)
    }

    emerg(m) {
        m = (typeof m === "object") ? JSON.stringify(m) : m
        this.APP_LOG.emerg(m)
        this.APP_LOG_.emerg(m)
    }

    static setupAccessLogging(app) {
        var accessLogStream = fs.createWriteStream(ACCESS_LOG_PATH, { flags: 'a' })
        morgan.token('local-time', (req, res) => {
            return new Date().toLocaleString('au');
        });
        const ACCESS_LOG = morgan(':remote-addr - :remote-user [:local-time] :total-time :method ":url HTTP/:http-version" :status :res[content-length] :referrer :user-agent', { stream: accessLogStream });
        app.use(ACCESS_LOG)
    }

    static formatError(err) {
        return {
            message: err.message,
            stack: err.stack,
        }
    }
}

module.exports = {
    create: (loggerLabel) => {
        return new Logger(loggerLabel)
    },
    setupAccessLog: (app) => {
        Logger.setupAccessLogging(app)
    },
    formatError: (err) => {
        return Logger.formatError(err)
    }
}