'use strict';

const ResponseMiddleware = require('../response-middleware');

/**
 * Middleware to stringify an object response to json.
 */
class StringifyResponse extends ResponseMiddleware {

  process(response, event, context, callback) {
    if (response && response.body) {
      response.body = JSON.stringify(response.body);
    }
    return true;
  }
}
module.exports = StringifyResponse;