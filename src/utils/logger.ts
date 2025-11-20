import winston from 'winston';
import config from '../config';

const defaultLevel = config.logging?.level || (config.server.env === 'development' ? 'debug' : 'info');

const logger = winston.createLogger({
  level: defaultLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

export default logger;