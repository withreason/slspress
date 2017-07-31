
const FinallyMiddleware = require('../finally-middleware');

const logger = require('../../logger')(__filename);
const buildRequestLog = require('../utils/build-request-log');

/**
 * Middleware to log response details.
 */
class StringifyResponse extends FinallyMiddleware {

  process(error, response, event, context, callback, next) {
    if (error) {
      logger.error(`ERROR processing request. error=${JSON.stringify(error)} status=${response.statusCode} ${buildRequestLog(event, response)}`);
    } else {
      logger.info(`COMPLETED request. status=${response.statusCode} ${buildRequestLog(event, response)}`);
    }
    return next();
  }
}
module.exports = StringifyResponse;