var fs = require('fs')
var morgan = require('morgan')
const winston = require('winston')
var path = require('path')

const APP_LOG_LOG_PATH = `${__dirname}/logs/app.log`
const ACCESS_LOG_PATH = `${__dirname}/logs/access.log`
let LOG_LEVEL = 'info'

class Logger {
    constructor(loggerLabel) {
        // setting up loggers
        const APP_LOG_FORMAT = winston.format.printf(
            ({ level, message, label, timestamp }) => {
                const localTime = new Date(timestamp).toLocaleString()
                return `${localTime} [${label}] ${level}: ${message}`
            }
        )
        this.APP_LOG = winston.createLogger({
            level: LOG_LEVEL,
            format: winston.format.combine(
                winston.format.label({ label: loggerLabel }),
                winston.format.timestamp(),
                APP_LOG_FORMAT
            ),
            transports: [
                new winston.transports.File({ filename: APP_LOG_LOG_PATH }),
                new winston.transports.Console(),
            ],
        })
    }

    info(m) {
        m = (typeof m === "object") ? JSON.stringify(m) : m
        this.APP_LOG.info(m)
    }

    error(m) {
        m = (typeof m === "object") ? JSON.stringify(m) : m
        this.APP_LOG.error(m)
    }

    warn(m) {
        m = (typeof m === "object") ? JSON.stringify(m) : m
        this.APP_LOG.warn(m)
    }

    debug(m) {
        m = (typeof m === "object") ? JSON.stringify(m) : m
        this.APP_LOG.debug(m)
    }

    static setupAccessLogging(app) {
        var accessLogStream = fs.createWriteStream(ACCESS_LOG_PATH, { flags: 'a' })
        morgan.token('local-time', (req, res) => {
            return new Date().toLocaleString('au');
        });
        const ACCESS_LOG = morgan(':remote-addr - :remote-user [:local-time] :total-time :method ":url HTTP/:http-version" :status :res[content-length] :referrer :user-agent', { stream: accessLogStream });
        app.use(ACCESS_LOG)
    }
}

module.exports = {
    create: (loggerLabel) => {
        return new Logger(loggerLabel)
    },
    setupAccessLog: (app) => {
        Logger.setupAccessLogging(app)
    },
}


/* var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access_one.log'), { flags: 'a' })
morgan.token('local-time', (req, res) => {
    return new Date().toLocaleString('au');
});

module.exports = morgan(':remote-addr - :remote-user [:local-time] :total-time :method ":url HTTP/:http-version" :status :res[content-length] :referrer :user-agent', { stream: accessLogStream }); */