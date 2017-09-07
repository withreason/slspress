'use strict';

const ApplicationError = require('./application-error');

class UnprocessableEntityError extends ApplicationError {
  constructor(message) {
    super(message || 'Unprocessable Entity');
  }
}
module.exports = UnprocessableEntityError;