const winston = require('winston');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');

const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const colorize = (level, message) => {
    const colorMap = {
        error: chalk.red,
        warn: chalk.yellow,
        info: chalk.green,
        debug: chalk.white
    };
    // Safely return the message with the corresponding color or default to white if the level is unknown
    return (colorMap[level] || chalk.white)(message);
};

const logFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${colorize(level, message)}`;
});

const stripAnsi = winston.format(info => {
    // Strip ANSI color codes for file output
    info.message = info.message.replace(/\x1B[[(?);]{0,2}(;?\d)*./g, '');
    return info;
});

// Create a session directory based on the current date and time
const sessionDir = (() => {
    const dir = path.join(__dirname, '../../logs', new Date().toISOString().replace(/:/g, '-'));
    fs.mkdirSync(dir, { recursive: true });
    return dir;
})();

exports.getLogger = (moduleName) => {
    return winston.createLogger({
        levels: logLevels,
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            stripAnsi(),
            logFormat
        ),
        transports: [
            new winston.transports.Console({
                level: 'debug', // Ensure all levels are logged to the console
                format: winston.format.combine(
                    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                    winston.format.printf(info => `${info.timestamp} [${info.level}]: ${colorize(info.level, info.message)}`)
                )
            }),
            new winston.transports.File({
                filename: path.join(sessionDir, `${moduleName}.log`),
                level: 'debug', // Ensure all levels are logged to file
                format: winston.format.combine(
                    stripAnsi(),
                    logFormat
                ),
                maxsize: 50 * 1024 * 1024, // 50MB
                maxFiles: 5,
                tailable: true
            })
        ]
    });
};
