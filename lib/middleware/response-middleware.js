'use strict';

const Middleware = require('./middleware');

class ResponseMiddleware extends Middleware {

  process(response, event, context, callback) {
    throw new Error('The process method must be overridden.');
  }
}

module.exports = ResponseMiddleware;