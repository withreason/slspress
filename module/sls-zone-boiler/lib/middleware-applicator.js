'use strict';

const FinallyMiddleware = require('./middleware/finally-middleware');
const PromiseHandlerWrapper = require('./promise-handler-wrapper');
const logger = require('./logger')(__filename);

function checkMiddlewareResult(middlewareResult) {
  if (typeof middlewareResult === 'boolean') {
    return Promise.resolve(middlewareResult);
  }
  if (!middlewareResult || !middlewareResult.then) {
    throw new Error('Middleware must return a boolean or promise or a boolean that indicates whether to proceed')
  }
  return middlewareResult;
}

class WrappedFinallyMiddleware extends FinallyMiddleware {
  constructor(middleware) {
    super();
    this._middleware = middleware;

  }
  process(error, response, event, context, callback) {
    try {
      return checkMiddlewareResult(this._middleware.process(error, response, event, context, callback))
        .catch(err => logger.error('Finally middleware threw an error. Ignoring and proceeding with other finallys.', err))
        .then(proceed => {
          if (!proceed) {
            logger.error('Finally middleware indicated the chain should not proceed. This behavior is not allowed. Ignoring and proceeding with other finallys.')
          }
          return Promise.resolve(true);
        });
    } catch(err) {
      logger.error('Finally middleware threw an error. Ignoring and proceeding with other finallys.', err);
      return Promise.resolve(true);
    }
  }
}

class MiddlewareApplicator {
  constructor(errorHandler, responseFactory, containerHolder) {
    this._errorHandler = errorHandler;
    this._promiseHandlerWrapper = new PromiseHandlerWrapper(responseFactory);
    this._containerHolder = containerHolder;
  }

  apply(handler, requestMiddleware, responseMiddleware, finallyMiddleware) {
    const wrappedToHandlePromiseResult = this._promiseHandlerWrapper.wrapToHandlePromiseResult(handler);

    return this._catchHandlerErrors(finallyMiddleware, (event, context, callback) => {
      const responseMiddlewareWrappedCallback = (error, response) => {
        if (error) {
          callback(error, response);
          return;
        }
        try {
          this._processMiddleware(responseMiddleware, response, event, context, callback)
            .then(proceed => proceed ? callback(error, response) : Promise.resolve(false))
            .catch(err => this._errorHandler.handle(err, event, context, callback));
        } catch (err) {
          this._errorHandler.handle(err, event, context, callback);
        }
      };

      return this._processMiddleware(requestMiddleware, event, context, responseMiddlewareWrappedCallback)
        .then(proceed => {
          return proceed ? wrappedToHandlePromiseResult(event, context, responseMiddlewareWrappedCallback) : Promise.resolve(false)
        });
    });
  }

  _catchHandlerErrors(finallyMiddleware, promiseHandler) {
    return (event, context, callback) => {

      // We always want to call all finally middleware so always proceed and catch any errors.
      const wrappedFinallyMiddleware = finallyMiddleware.map(middleware => new WrappedFinallyMiddleware(middleware));

      const finallyMiddlewareWrappedCallback = (error, response) => {
        this._processMiddleware(wrappedFinallyMiddleware, error, response, event, context, callback)
          .then(() => callback(error, response));
      };

      try {
        promiseHandler(event, context, finallyMiddlewareWrappedCallback)
          .catch(err => this._errorHandler.handle(err, event, context, finallyMiddlewareWrappedCallback));
      } catch(err) {
        this._errorHandler.handle(err, event, context, finallyMiddlewareWrappedCallback);
      }
    }
  }

  /**
   * @param {...*} var_args [0] - middleware array. [1..x] - middleware params. [length-1] - next callback
   * @returns {Promise} result of middleware call.
   * @private
   */
  _processMiddleware(var_args) {
    const middleware = arguments[0];
    const middlewareArgs = Array.prototype.slice.call(arguments, 1, arguments.length);

    const nextMiddleware = middleware && middleware.length && middleware[0];
    if (!nextMiddleware) {
      return Promise.resolve(true);
    }

    return checkMiddlewareResult(this._executeSingleMiddleware(nextMiddleware, middlewareArgs))
      .then(proceed => proceed ? this._processMiddleware.apply(this, [middleware.slice(1)].concat(middlewareArgs)) : Promise.resolve(false));
  }

  _executeSingleMiddleware(middleware, args) {
    if (middleware.middlewareType !== 'container') {
      return middleware.process.apply(middleware, args);
    }
    args = args.slice(0, args.length - 3); // strip off event, context, callback args
    args = [this._containerHolder.container].concat(args); // add container as first arg.
    return middleware.process.apply(middleware, args);
  }
}

module.exports = MiddlewareApplicator;