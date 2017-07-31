'use strict';

const logger = require('../logger')(__filename);
process.on('unhandledRejection', function(err, promise) {
  logger.error('Unhandled rejection (promise: ', promise, ', reason: ', err, ').');
});

class ErrorHandler {

  handle(error, event, context, callback) {
    throw new Error('handle must be overridden for subclasses of ErrorHandler')
  }
}

module.exports = ErrorHandler;