'use strict';
const { ApplicationError, BadRequestError, NotFoundError, UnprocessableEntityError } = require('../../..')

function printError (logger, error) {
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

function createErrorBody(error) {
  return JSON.stringify({ customErrorResponse: {
    message: error && error.message
  }});
}

module.exports = function(req, res) {
  printError(this.logger, res.error);

  if (res.error instanceof BadRequestError) {
    return res.badRequest(createErrorBody(res.error));
  }

  if (res.error instanceof NotFoundError) {
    return res.notFound(createErrorBody(res.error));
  }

  if (res.error instanceof UnprocessableEntityError) {
    return res.unprocessableEntity(createErrorBody(res.error));
  }

  return res.internalServerError(createErrorBody(res.error));
};