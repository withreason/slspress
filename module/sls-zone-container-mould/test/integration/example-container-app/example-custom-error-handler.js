'use strict';

const SimpleErrorHandler = require('../../../container-index').SimpleErrorHandler;

class ExampleCustomErrorHandler extends SimpleErrorHandler {

  _createErrorBody(error, event, context) {
    return JSON.stringify({ customErrorResponse: {
      message: error && error.message
    }});
  }
}

module.exports = ExampleCustomErrorHandler;