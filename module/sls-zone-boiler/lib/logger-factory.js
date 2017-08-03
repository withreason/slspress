'use strict';

const fs = require('fs');
const LEVELS = ['trace', 'info', 'warn', 'error'];
const DEFAULT_CONFIG = {
  "slow-threshold": 100,
  "default": "info"
};

let configFile = process.env.LOG_CONFIG ||  process.cwd() + '/config/logging.json';
if (!fs.existsSync(configFile)) {
  configFile = null;
}

const config = configFile ? require(configFile) : DEFAULT_CONFIG;

/**
 * Creates a logger object with the log statements filtered based on the given caller.
 *
 * Usage:
 *
 * const { createLogger } = require('slspress');
 * const logger = createLogger(__filename)
 *
 * @param caller the filename of the calling function
 * @param logger optional - specify to override where logging is sent. This is expected to be a console compatible object.
 * @returns {Logger}
 */
module.exports = (caller, logger) => {
  if (!logger) {
    logger = console;
  }
  if (!logger.error || !logger.warn || !logger.log) {
    throw new Error('The given logger must have a console type interface with the following three methods, error, warn and log.');
  }

  function isEnabled(caller, level) {
    let allowedLevel = process.env.LOG_LEVEL_DEFAULT || config['default'];
    Object.keys(config).forEach(cfg => {
      if (caller.endsWith(cfg)) {
        allowedLevel = config[cfg];
      }
    });

    return LEVELS.indexOf(level) >= LEVELS.indexOf(allowedLevel);
  }

  function logTiming(caller, isError, message, startTime) {
    const timingThreshold = process.env.LOG_TIME_THREASHOLD_DEFAULT || config['slow-threshold'];
    const timeTaken = new Date().getTime() - startTime;
    if (isEnabled(caller, isError ? 'error' : 'trace') || timeTaken >= timingThreshold) {
      message = `${message} ms=${timeTaken}`;
      const args = [message].concat(Array.prototype.slice.call(arguments, 2));
      isError ? logger.error.apply(logger, args) : logger.log.apply(logger, args);
    }
  }

  return {
    error: function() {
      if (isEnabled(caller, 'error')) {
        logger.error.apply(logger, arguments);
      }
    },
    warn: function() {
      if (isEnabled(caller, 'warn')) {
        logger.warn.apply(logger, arguments);
      }
    },
    info: function() {
      if (isEnabled(caller, 'info')) {
        logger.log.apply(logger, arguments);
      }
    },
    log: function() {
      if (isEnabled(caller, 'info')) {
        logger.log.apply(logger, arguments);
      }
    },
    trace: function() {
      if (isEnabled(caller, 'trace')) {
        logger.log.apply(logger, arguments);
      }
    },
    metric: function() {
      logger.log.apply(logger, arguments);
    },
    timing: logTiming.bind(null, caller, false),
    timingError: logTiming.bind(null, caller, true)
  }
};