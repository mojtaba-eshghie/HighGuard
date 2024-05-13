const winston = require('winston');
const path = require('path');
const chalk = require('chalk'); // Import chalk

const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

// Define colors for different levels using chalk
const colorize = (level, message) => {
    switch (level) {
        case 'error':
            return chalk.red(message);
        case 'warn':
            return chalk.yellow(message);
        case 'info':
            return chalk.green(message);
        case 'debug':
            return chalk.white(message);
        default:
            return message; // Default no coloring
    }
};

const logFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${colorize(level, message)}`;
});

// Strip ANSI color codes for file output
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
            level: 'debug', // Ensure all levels are logged to the console
            format: winston.format.combine(
                logFormat
            )
        }),
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs', new Date().toISOString().split('T')[0], 'session-logs.log'),
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