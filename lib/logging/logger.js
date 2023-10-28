const winston = require('winston');
const path = require('path');

const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const logFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
});

// Strip ANSI color codes
const stripAnsi = winston.format(info => {
    info.message = info.message.replace(/\x1B[[(?);]{0,2}(;?\d)*./g, '');
    return info;
});

const logger = winston.createLogger({
    levels: logLevels,
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            )
        }),
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs', new Date().toISOString().split('T')[0], 'session-logs.log'), // Adjust the path as needed
            format: winston.format.combine(
                stripAnsi(),
                logFormat
            ),
            maxsize: 50 * 1024 * 1024, // 50MB
            maxFiles: 5,
            tailable: true,
        })
    ]
});

module.exports = logger;
