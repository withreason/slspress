'use strict';

const ApplicationError = require('./application-error');

class UnprocessableEntityError extends ApplicationError {
  constructor() {
    super('Unprocessable Entity');
  }
}
module.exports = UnprocessableEntityError;