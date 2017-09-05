'use strict';

const ApplicationError = require('./application-error');

class ForbiddenError extends ApplicationError {
  constructor() {
    super('Access is forbidden');
  }
}
module.exports = ForbiddenError;