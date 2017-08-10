'use strict';

const RouteHandlerConfig = require('./route-handler-config');

const routeWrappers = require('./route-config-wrappers');

function wrapHandler(type, callerArguments) {
  if (callerArguments.length !== 1) {
    throw new Error(`hander must have one argument`);
  }
  return new RouteHandlerConfig(type, callerArguments[0]);
}

/**
 * Indicates the given handler function is a regular type of handler that takes two args (req, res).
 * @param var_args the handler.
 * @returns {*} config for the outer function.
 */
module.exports.handler = function(var_args) {
  return wrapHandler('reqres', arguments);
};

/**
 * Indicates the given handler function is a raw type of handler that takes three args (event, context, callback).
 * @param var_args the handler.
 * @returns {*} config for the outer function.
 */
module.exports.rawHandler = function(var_args) {
  return wrapHandler('raw', arguments);
};

/**
 * Indicates the given handler function is a authorizer. No middleware will applied to the handler by default.
 * @param var_args the authorizer.
 * @returns {*} config for the outer function.
 */
module.exports.authorizerHandler = function(var_args) {
  return wrapHandler('auth', arguments).middleware(routeWrappers.override());
};

/**
 * Indicates the given handler function is a cron function. No middleware will applied to the handler by default.
 * @param var_args the cron handler.
 * @returns {*} config for the outer function.
 */
module.exports.cronHandler = function(var_args) {
  return wrapHandler('cron', arguments).middleware(routeWrappers.override());
};