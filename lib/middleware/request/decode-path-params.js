'use strict';

const RequestMiddleware = require('../request-middleware');


/**
 * Middleware to decode any url encoding in path parameters.
 */
class DecodePathParams extends RequestMiddleware {

  process(event, context, callback) {
    if (!event.pathParameters) {
      return true;
    }

    Object.keys(event.pathParameters).forEach(key => {
      event.pathParameters[key] = decodeURIComponent(event.pathParameters[key]);
    });
    return true;
  }
}
module.exports = DecodePathParams;