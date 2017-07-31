'use strict';

class ErrorHandler {

  handle(error, event, context, callback) {
    throw new Error('handle must be overridden for subclasses of ErrorHandler')
  }
}

module.exports = ErrorHandler;