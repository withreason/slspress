'use strict';

const SimpleErrorHandler = require('../../..').SimpleErrorHandler;

class ExampleCustomErrorHandler extends SimpleErrorHandler {

  _createErrorBody(error, event, context) {
    return JSON.stringify({ customErrorResponse: {
      message: error && error.message
    }});
  }
}

module.exports = ExampleCustomErrorHandler;