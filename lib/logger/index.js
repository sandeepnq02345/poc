'use strict';

const winston = require('winston');
const _ = require('lodash');
const config = require('../../config')();

const logFormat = winston.format.printf((info) => {
  const defaultLogProperties = ['level', 'timestamp', 'message', 'label'];
  const logDetails = {};
  let logTemplate = `${info.timestamp} | [${info.level}] | ` +
  `${(info.label === 'unlabelled') ? info.message : `Tag: [${info.label}] | ${info.message}`}`;
  logTemplate += '\n';
  const logProperties = Object.keys(info).filter((property) => {
    return !defaultLogProperties.includes(property);
  });
  logProperties.map((property) => {
    if (property === 'stack') {
      logTemplate += `${info.stack}\n`;
    } else {
      if (info[property]) {
        logDetails[property] = info[property];
      }
    }
  });
  if (logDetails && !_.isEmpty(logDetails)) {
    logTemplate += `${JSON.stringify(logDetails, null, 2)}\n`;
  }
  return logTemplate;
});

let logger = null;
if (['local'].includes(process.env.NODE_ENV)) {
  logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
      winston.format.label({ label: 'unlabelled' }),
      winston.format.colorize({
        all: true,
        colors: {
          info: 'cyan',
          error: 'red',
          debug: 'bold yellow',
          http: 'magenta',
          warn: 'orange'
        }
      }),
      winston.format.timestamp({ format: 'DD-MM-YYYY hh:mm:ss a' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      logFormat
    ),
    transports: [new winston.transports.Console()],
    exitOnError: false
  });
} else {
  logger = winston.createLogger({
    level: config.logger.maxLogLevel || 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    transports: [new winston.transports.Console()],
    exitOnError: false
  });
}

/**
 * @param {String} level conform the severity of log[error, warn, info, http, verbose, debug, silly]
 * @param {String} message message for logging
 * @param {*} data log details if any
 * @param {String} label Custom label associated with each message. Default: unlabelled
 */
const log = (level, message, label, data) => {
  if (data && data.stack) {
    logger.log(level, message, data, { label: label || 'unlabelled' });
  } else {
    logger.log(level, message, { logDetails: data }, { label: label || 'unlabelled' });
  }
};

// Transport for http request logger like morgan
const stream = {
  write: (message) => logger.http(message)
};

module.exports = { log, stream };
