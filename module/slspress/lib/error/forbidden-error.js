'use strict';

const ApplicationError = require('./application-error');

class ForbiddenError extends ApplicationError {
  constructor(message) {
    super(message || 'Access is forbidden');
  }
}
module.exports = ForbiddenError;