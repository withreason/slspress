'use strict';

const logger = require('../logger')(__filename);
const ErrorHandler = require('./error-handler');
const ApplicationError = require('./application-error');
const NotFoundError = require('./not-found-error');
const BadRequestError = require('./bad-request-error');

class SimpleErrorHandler extends ErrorHandler {
  constructor(responseFactory) {
    super();
    this._responseFactory = responseFactory;
  }

  handle(error, event, context, callback) {
    this._printError(error);

    if (error instanceof BadRequestError) {
      return this._responseFactory.badRequest(this._createErrorBody(error, event, context)).send(callback);
    }

    if (error instanceof NotFoundError) {
      return this._responseFactory.notFound(this._createErrorBody(error, event, context)).send(callback);
    }

    return this._responseFactory.internalServerError(this._createErrorBody(error, event, context)).send(callback);
  }

  _createErrorBody(error, event, context) {
    return null;
  }

  _printError (error) {
    if (error instanceof ApplicationError) {
      logger.error('[ERROR]', error.message);
    } else if (error instanceof Error) {
      logger.error('[ERROR] Unexpected error', {
        error: error,
        message: error.message,
        stack: error.stack.split('\n')
      });
    } else {
      logger.error('[ERROR] Unknown error object', error);
    }
  }
}

module.exports = SimpleErrorHandler;