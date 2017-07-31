'use strict';

const Middleware = require('./middleware');

class FinallyMiddleware extends Middleware {

  process(error, response, event, context, callback) {
    throw new Error('The process method must be overridden.');
  }
}

module.exports = FinallyMiddleware;