'use strict';

const createResponse = require('./response-factory');
const createRequest = require('./request-factory');
const loggerFactory = require('./logger-factory');

module.exports = function(errorHandler, thisContext, headers, customLogger) {

  const logger = loggerFactory(__filename, customLogger);

  const catchFinallyMiddleware = (middleware) => function(req, res, next) {
    try {
      return middleware.call(this, req, res, next);
    } catch (error) {
      logger.error('Finally middleware threw an error. Ignoring and proceeding with other finallys.', error);
      return next();
    }
  };

  const catchMiddleware = (middleware, finallyCallback) => function(req, res, next) {
    try {
      return middleware.call(this, req, res, next);
    } catch (error) {
      return forwardToErrorHandler(error, req, res, finallyCallback);
    }
  };

  const catchHandler = (handler, finallyCallback, req, res) => function(var_args) {
    try {
      return handler.apply(this, arguments);
    } catch (error) {
      return forwardToErrorHandler(error, req, res, finallyCallback);
    }
  };

  const forwardToErrorHandler = (error, req, res, finallyCallback) => {
    return errorHandler.call(thisContext, req, res._createErrorResponse(error, finallyCallback));
  };

  const processMiddlewareChain = (chain, req, res, next) => {
    const middleware = chain[0];
    if (!middleware) {
      return next();
    }
    return middleware.call(thisContext, req, res, () => processMiddlewareChain(chain.slice(1), req, res, next));
  };

  this.apply = (extendedHandler, requestMiddleware, responseMiddleware, finallyMiddleware) => {
    return (event, context, callback) => {
      try {
        const req = createRequest(event, context, thisContext);

        const wrappedFinallyMiddleware = finallyMiddleware
          .map(m => catchFinallyMiddleware(m))
          .reverse();
        const callbackWrappedInFinallyMiddleware = (err, res) =>
          processMiddlewareChain(wrappedFinallyMiddleware, req, res, () => callback(err, res && res._toPlain ? res._toPlain() : res));

        const wrappedResponseMiddleware = responseMiddleware
          .map(m => catchMiddleware(m, callbackWrappedInFinallyMiddleware))
          .reverse();
        const callbackWrappedInResponseMiddleware = (err, res) =>
          processMiddlewareChain(wrappedResponseMiddleware, req, res, () => callbackWrappedInFinallyMiddleware(err, res));

        const handleErrorFn = (error, req, res) => forwardToErrorHandler(error, req, res, callbackWrappedInFinallyMiddleware);
        const res = createResponse(req, callbackWrappedInResponseMiddleware, handleErrorFn , headers);

        const wrappedRequestMiddleware = requestMiddleware.map(m => catchMiddleware(m, callbackWrappedInFinallyMiddleware));
        const wrappedExtendedHandler = catchHandler(extendedHandler, callbackWrappedInFinallyMiddleware, req, res);

        return processMiddlewareChain(wrappedRequestMiddleware, req, res, () =>
          wrappedExtendedHandler.call(thisContext, req.event, req.context, callbackWrappedInResponseMiddleware, req, res));
      } catch (err) {
        logger.error('Unexpected error while applying middleware.', err);
        callback(err);
      }
    };
  };
};