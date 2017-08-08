'use strict';

const RouteHandlerConfig = require('./route-handler-config');

const flattenArrays = require('../flatten-arrays');

function wrapMiddleware(type, callerArguments) {
  if (callerArguments.length === 0) {
    throw new Error(`${type}Middleware must have at least one argument`);
  }
  const middlewares = flattenArrays(callerArguments);
  middlewares.forEach(middleware => {
    if (middleware.override) {
      if (Array.isArray(middleware.value)) {
        return middleware.value.forEach(middleware => {
          if (typeof middleware !== 'function') {
            throw new Error('middleware must be a function or override wrapped function');
          }
        })
      }
      if (typeof middleware.value !== 'function') {
        throw new Error('middleware must be a function or override wrapped function');
      }
      return;
    }
    if (typeof middleware !== 'function') {
      throw new Error('middleware must be a function or override wrapped function');
    }
  });
  return { middlewareType: type, value: middlewares };
}

function wrapHandler(type, callerArguments) {
  if (callerArguments.length !== 1) {
    throw new Error(`hander must have one argument`);
  }
  return new RouteHandlerConfig(type, callerArguments[0]);
}

module.exports.override = function(var_args) {
  if (arguments.length === 0) {
    throw new Error('override must have at least one argument');
  }
  return { override: true, value: Array.from(arguments) };
};

module.exports.request = function(var_args) {
  return wrapMiddleware('request', arguments);
};

module.exports.response = function(var_args) {
  return wrapMiddleware('response', arguments);
};

module.exports.final = function(var_args) {
  return wrapMiddleware('finally', arguments);
};

const cancelAllMiddleware = [
  module.exports.request((req, res, next) => next()),
  module.exports.response((req, res, next) => next()),
  module.exports.final((req, res, next) => next())
];

module.exports.handler = function(var_args) {
  return wrapHandler('reqres', arguments);
};

module.exports.rawHandler = function(var_args) {
  return wrapHandler('raw', arguments);
};

module.exports.authorizerHandler = function(var_args) {
  return wrapHandler('auth', arguments).middleware(module.exports.override(cancelAllMiddleware));
};

module.exports.cronHandler = function(var_args) {
  return wrapHandler('reqres', arguments).middleware(module.exports.override(cancelAllMiddleware));
};