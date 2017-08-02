'use strict';

const Middleware = require('./middleware');

class RequestMiddleware extends Middleware {

  process(event, context, callback) {
    throw new Error('The process method must be overridden.');
  }
}

module.exports = RequestMiddleware;