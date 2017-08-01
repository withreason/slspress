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
    isError ? console.error.apply(console, args) : console.log.apply(console, args);
  }
}

module.exports = (caller) => ({
  error: function() {
    if (isEnabled(caller, 'error')) {
      console.error.apply(console, arguments);
    }
  },
  warn: function() {
    if (isEnabled(caller, 'warn')) {
      console.warn.apply(console, arguments);
    }
  },
  info: function() {
    if (isEnabled(caller, 'info')) {
      console.log.apply(console, arguments);
    }
  },
  trace: function() {
    if (isEnabled(caller, 'trace')) {
      console.log.apply(console, arguments);
    }
  },
  metric: function() {
    console.log.apply(console, arguments);
  },
  timing: logTiming.bind(null, caller, false),
  timingError: logTiming.bind(null, caller, true)
});