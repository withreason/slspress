'use strict';

const ResponseMiddleware = require('sls-zone-mould').ResponseMiddleware;

class ContainerResponseMiddleware extends ResponseMiddleware {
  constructor() {
    super();
    this.middlewareType = 'container';
  }

  process(container, response) {
    throw new Error('The process method must be overridden.');
  }
}

module.exports = ContainerResponseMiddleware;