'use strict';

/**
 * Simple error type to differentiate known errors from unknown ones.
 */
class ApplicationError extends Error {
  constructor(message, fileName, lineNumber) {
    super(message, fileName, lineNumber);
  }
}

module.exports = ApplicationError;