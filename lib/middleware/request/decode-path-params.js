'use strict';

const RequestMiddleware = require('../request-middleware');


/**
 * Middleware to decode any url encoding in path parameters.
 */
class DecodePathParams extends RequestMiddleware {

  process(event, context, callback, next) {
    if (!event.pathParameters) {
      return next();
    }

    Object.keys(event.pathParameters).forEach(key => {
      event.pathParameters[key] = decodeURIComponent(event.pathParameters[key]);
    });
    return next();
  }
}
module.exports = DecodePathParams;