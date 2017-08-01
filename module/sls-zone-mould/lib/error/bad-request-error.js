'use strict';

const ApplicationError = require('./application-error');

class BadRequestError extends ApplicationError {
  constructor() {
    super('Bad request');
  }
}
module.exports = BadRequestError;