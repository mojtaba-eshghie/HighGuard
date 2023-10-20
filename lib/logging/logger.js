const winston = require('winston');

const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const logger = winston.createLogger({
    levels: logLevels,
    format: winston.format.printf(({ message }) => message), 
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ message }) => message) 
            )
        })
    ]
});

module.exports = logger;
