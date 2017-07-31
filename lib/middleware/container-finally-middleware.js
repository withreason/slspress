'use strict';

const FinallyMiddleware = require('./finally-middleware');

class ContainerFinallyMiddleware extends FinallyMiddleware {
  constructor() {
    super();
    this.middlewareType = 'container';
  }

  process(container, error, response, next) {
    throw new Error('The process method must be overridden.');
  }
}

module.exports = ContainerFinallyMiddleware;