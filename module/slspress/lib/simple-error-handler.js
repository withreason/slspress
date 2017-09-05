'use strict';

const ApplicationError = require('./error/application-error');
const NotFoundError = require('./error/not-found-error');
const BadRequestError = require('./error/bad-request-error');
const ForbiddenError = require('./error/forbidden-error');
const UnprocessableEntityError = require('./error/unprocessable-entity-error');

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

module.exports = function(req, res) {
  printError(this.logger, res.error);

  if (res.error instanceof BadRequestError) {
    return res.badRequest();
  }

  if (res.error instanceof ForbiddenError) {
    return res.forbidden();
  }

  if (res.error instanceof NotFoundError) {
    return res.notFound();
  }

  if (res.error instanceof UnprocessableEntityError) {
    return res.unprocessableEntity();
  }

  return res.internalServerError();
};