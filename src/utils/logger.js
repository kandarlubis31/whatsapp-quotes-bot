import winston from 'winston';
import 'winston-daily-rotate-file';
import config from '../config/config.js';

const { combine, timestamp, printf, colorize, json } = winston.format;

const consoleFormat = printf(({ level, message, timestamp, service }) => {
  return `${timestamp} [${service}] ${level}: ${message}`;
});

const fileTransport = new winston.transports.DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: config.logging.maxSize,
  maxFiles: config.logging.maxFiles,
  format: combine(timestamp(), json()),
});

const logger = winston.createLogger({
  level: config.logging.level,
  defaultMeta: { service: 'quotes-bot' },
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    }),
    fileTransport,
  ],
});

export default logger;