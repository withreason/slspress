
const RequestMiddleware = require('../request-middleware');

/**
 * Middleware to parse a string body as json.
 */
class ParseJsonBody extends RequestMiddleware {

  process(event, context, callback, next) {
    if (event.body && typeof event.body === 'string') {
      event.body = JSON.parse(event.body)
    }
    return next();
  }
}
module.exports = ParseJsonBody;