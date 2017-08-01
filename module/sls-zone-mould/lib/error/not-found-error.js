'use strict';

const ApplicationError = require('./application-error');

class NotFoundError extends ApplicationError {
  constructor(resource) {
    super(`Could not find ${resource}`);
  }
}
module.exports = NotFoundError;