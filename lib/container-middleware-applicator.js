'use strict';

const MiddlewareApplicator = require('./middleware-applicator');

class ContainerMiddlewareApplicator extends MiddlewareApplicator {
  constructor(errorHandler, responseFactory, containerHolder) {
    super(errorHandler, responseFactory);
    this._containerHolder = containerHolder;
  }

  _executeSingleMiddleware(middleware, args) {
    if (middleware.middlewareType !== 'container') {
      return super._executeSingleMiddleware(middleware, args);
    }
    args = args.slice(0, args.length - 3); // strip off event, context, callback args
    args = [this._containerHolder.container].concat(args); // add container as first arg.
    return middleware.process.apply(middleware, args);
  }
}

module.exports = ContainerMiddlewareApplicator;