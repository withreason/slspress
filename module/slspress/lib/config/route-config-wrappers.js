'use strict';

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

/**
 * Override previously configured values of this type. e.g.
 * .headers(override(bla)) would replace all previously defined global and/or handler headers with bla
 * at the level that you called headers on.
 *
 * NOTE when using this with middleware this will override all middleware including middleware of other types.
 * @param var_args the arguments you waould normally pass to the outer function.
 * @returns {*} config for the outer function.
 */
module.exports.override = function(var_args) {
  return { override: true, value: Array.from(arguments) };
};

/**
 * Indicate the given middleware function(s) are request middleware.
 * @param var_args the request middleware.
 * @returns {*} config for the outer function.
 */
module.exports.request = function(var_args) {
  return wrapMiddleware('request', arguments);
};

/**
 * Indicate the given middleware function(s) are response middleware.
 * @param var_args the response middleware.
 * @returns {*} config for the outer function.
 */
module.exports.response = function(var_args) {
  return wrapMiddleware('response', arguments);
};

/**
 * Indicate the given middleware function(s) are finally middleware.
 * @param var_args the finally middleware.
 * @returns {*} config for the outer function.
 */
module.exports.final = function(var_args) {
  return wrapMiddleware('finally', arguments);
};