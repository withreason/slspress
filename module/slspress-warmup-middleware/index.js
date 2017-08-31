'use strict';

/**
 * Add this middleware as the first one to abort requests that come from the warm up serverless-plugin-warmup.
 * @param req
 * @param res
 * @param next
 * @returns {*}
 */
module.exports = (req, res, next) => {
  if (req.event.source === 'serverless-plugin-warmup') {
    return res.ok('Lambda is warm!');
  }
  return next();
};