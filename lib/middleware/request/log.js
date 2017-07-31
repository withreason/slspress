
const RequestMiddleware = require('../request-middleware');

const logger = require('../../logger')(__filename);
const buildRequestLog = require('../utils/build-request-log');

/**
 * Middleware to log request details.
 */
class LogRequest extends RequestMiddleware {

  process(event, context, callback, next) {
    logger.info(`START request. ${buildRequestLog(event, event)}`);
    return next();
  }
}
module.exports = LogRequest;