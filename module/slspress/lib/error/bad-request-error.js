'use strict';

const ApplicationError = require('./application-error');

class BadRequestError extends ApplicationError {
  constructor(message) {
    super(message || 'Bad request');
  }
}
module.exports = BadRequestError;