'use strict';

const RequestMiddleware = require('sls-zone-mould').RequestMiddleware;

class ContainerRequestMiddleware extends RequestMiddleware {
  constructor() {
    super();
    this.middlewareType = 'container';
  }

  process(container) {
    throw new Error('The process method must be overridden.');
  }
}

module.exports = ContainerRequestMiddleware;