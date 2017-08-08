'use strict';

/**
 * Middleware to decode any url encoding in path parameters.
 */
module.exports = (req, res, next) => {
  Object.keys(req.event.pathParameters || {}).forEach(key => {
    req.event.pathParameters[key] = decodeURIComponent(req.event.pathParameters[key]);
  });
  return next();
};