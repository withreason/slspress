'use strict';

const RequestMiddleware = require('./request-middleware');

class ContainerRequestMiddleware extends RequestMiddleware {
  constructor() {
    super();
    this.middlewareType = 'container';
  }

  process(container, next) {
    throw new Error('The process method must be overridden.');
  }
}

module.exports = ContainerRequestMiddleware;