'use strict';


const Response = require('./response/response');
const ResponseFactory = require('./response/response-factory');
const ErrorHandler = require('./error/error-handler');
const SimpleErrorHandler = require('./error/simple-error-handler');

const Middleware = require('./middleware/middleware');
const RequestMiddleware = require('./middleware/request-middleware');
const ResponseMiddleware = require('./middleware/response-middleware');
const FinallyMiddleware = require('./middleware/finally-middleware');

class Application {
  constructor() {
    this._handlers = {};
    this._responseFactory = new ResponseFactory();
    this._errorHandler = new SimpleErrorHandler(this._responseFactory);
    this._requestMiddleware = [];
    this._responseMiddleware = [];
    this._finallyMiddleware = [];
  }

  /**
   * Convenience method for all of the other withs. This will detect which type of object it has
   * been given and then forward to the appropriate with method.
   * @param var_args
   * @returns {Application}
   */
  with(var_args) {
    const argOne = arguments[0];
    if (argOne instanceof ResponseFactory) {
      if (arguments.length !== 1) {
        throw new Error('A response factory must be specified on ist own in its own with');
      }
      return this.withResponseFactory(argOne);
    }
    if (argOne instanceof ErrorHandler) {
      if (arguments.length !== 1) {
        throw new Error('An error handler must be specified on ist own in its own with');
      }
      return this.withErrorHandler(argOne);
    }
    if (typeof argOne === 'string') {
      return this.withHandler.apply(this, Array.from(arguments));
    }
    return this.withMiddleware.apply(this, Array.from(arguments));
  }

  /**
   * Use a response factory other than the default one for this application.
   * Usage:
   *
   * new Application().withResponseFactory(new ResponseFactory().withxxx().withyyy())
   *
   * @param {ResponseFactory} responseFactory the factory to use instead.
   * @returns {Application}
   */
  withResponseFactory(responseFactory) {
    if (!(responseFactory instanceof ResponseFactory)) {
      throw new Error('A custom response factory must extend from or be a ResponseFactory');
    }
    this._responseFactory = responseFactory;
    return this;
  }

  /**
   * Use an error handler other than the default one for this application.
   * Usage:
   *
   * new Application().withErrorHandler(new ResponseFactory().withxxx().withyyy())
   *
   * @param {ResponseFactory} errorHandler the errorHandler to use instead.
   * @returns {Application}
   */
  withErrorHandler(errorHandler) {
    if (!(errorHandler instanceof ErrorHandler)) {
      throw new Error('A custom response factory must extend from ErrorHandler');
    }
    this._errorHandler = errorHandler;
    return this;
  }

  /**
   * Add middleware to any handlers added after this call.
   * The middleware must be an object or class that extends from RequestMiddleware, ResponseMiddleware or FinallyMiddleware.
   * You may pass multiple params to this method to register multiple middlewares.
   *
   * Note REQUEST middleware will be added to the chain after any that has been supplied by previous calls to withMiddleware.
   * Any RESPONSE or FINALLY middleware will be added before that supplied by previous calls to withMiddleware.
   *
   * Usage:
   *
   * new Application()
   *    .withMiddleware(requestMiddleware1, responseMiddleware1)
   *    .withMiddleware(requestMiddleware2, requestMiddleware3, responseMiddleware2, responseMiddleware3)
   *
   * The request chain in the above example will be:
   *    requestMiddleware1
   *    requestMiddleware2
   *    requestMiddleware3
   *    handler
   *    responseMiddleware3
   *    responseMiddleware2
   *    responseMiddleware1
   *
   *
   * @param {RequestMiddleware|ResponseMiddleware|FinallyMiddleware} var_args
   * @returns {Application}
   */
  withMiddleware(var_args) {

    Array.prototype.forEach.call(arguments, m => {
      if (this._isMiddlewareClass(m)) {
        m = new m();
      }

      if (m instanceof RequestMiddleware) {
        this._requestMiddleware.push(m);
      } else if (m instanceof ResponseMiddleware) {
        this._responseMiddleware.unshift(m);
      } else if (m instanceof FinallyMiddleware) {
        this._finallyMiddleware.unshift(m);
      } else {
        throw new Error(`Unknown middleware type ${m.name ? m.name : m}.`);
      }
    });
    return this;
  }

  /**
   * Add a handler that can process requests. This can support two types of handler.
   *
   * Simple:
   * A simple (event, context, callback) handler that works like a normal serverless handler except that errors thrown by
   * the function will be caught and forwarded to the error handler.
   * It is expected that if the function completes successfully that the handler has called the serverless callback function.
   *
   * Promise:
   * A handler (event, context) that returns a promise instead of using the callback.
   * The callback will be automatically called if you resolve the promise and the error handler will be called if you reject it.
   * Additionally if the function throws the error handler will be invoked with the thrown error.
   *
   * If the object returned from the resolved promise extends from the {Response} object that will be used to invoke the callback.
   * If not the following rules apply to determine how the response is returned:
   *   - if the object returned is null or undefined a 204(no content) response will be sent back.
   *   - if the object returned is present and the http method was a POST a 201(created) response will be sent back.
   *   - if the object returned is present and the http method was anything EXCEPT a POST a 200(ok) response will be sent back.
   *
   *
   * The first arg of this method must be the name of the handler to be referenced in your serverless.yml
   * The following args can be a mix of middleware and handlers as long as there is only one handler.
   * Middleware objects must extend from RequestMiddleware, ResponseMiddleware or FinallyMiddleware.
   * Note any REQUEST middleware supplied here will be added to the chain after any that has been supplied by withMiddleware.
   * Any RESPONSE or FINALLY middleware will be added before that supplied by withMiddleware.
   *
   * Usage:
   *
   * new Application().withHandler('getAll', requestMiddleware1, (event, context, callback) => { ... }, responseMiddleware)
   *
   * @param {[*]} var_args
   * @returns {Application}
   */
  withHandler(var_args) {
    const name = arguments[0];
    const objects = Array.prototype.slice.call(arguments, 1);

    if (this._handlers[name]) {
      throw new Error(`Duplicate handler with the name ${name}`);
    }

    // merge middleware given to this method with the middleware on the whole app.
    let {requestMiddleware, responseMiddleware, finallyMiddleware, handler} = this._parseHandlerParams(objects);
    requestMiddleware = this._requestMiddleware.concat(requestMiddleware);
    responseMiddleware = responseMiddleware.concat(this._responseMiddleware);
    finallyMiddleware = finallyMiddleware.concat(this._finallyMiddleware);

    const _wrapToHandlePromiseResult = this._wrapToHandlePromiseResult(handler);

    this._handlers[name] = this._catchHandlerErrors(finallyMiddleware, (event, context, callback) => {
      const responseMiddlewareWrappedCallback = (error, response) => {
        if (error) {
          return callback(error, response)
        }
        return this._processMiddleware(responseMiddleware, response, event, context, callback, () => callback(error, response));
      };

      return this._processMiddleware(requestMiddleware, event, context, responseMiddlewareWrappedCallback,
        () => _wrapToHandlePromiseResult(event, context, responseMiddlewareWrappedCallback));
    });

    return this;
  }

  /**
   * The handlers object to be exported.
   * @returns {{}|*}
   */
  getHandlers() {
    return this._handlers;
  }

  _parseHandlerParams(argArray) {
    const requestMiddleware = [];
    const responseMiddleware = [];
    const finallyMiddleware = [];
    let handler = null;

    argArray.forEach(arg => {
      if (this._isMiddlewareClass(arg)) {
        arg = new arg();
      }

      if (arg instanceof RequestMiddleware) {
        requestMiddleware.push(arg);
      } else if (arg instanceof ResponseMiddleware) {
        responseMiddleware.push(arg);
      } else if (arg instanceof FinallyMiddleware) {
        finallyMiddleware.push(arg);
      } else if (typeof arg === 'function') {
        if (handler) {
          throw new Error('Multiple handlers given in method params or unrecognised middleware.');
        }
        handler = arg;
      }
    });
    if (!handler) {
      throw new Error('No handler given in method params');
    }

    return { requestMiddleware, responseMiddleware, finallyMiddleware, handler }
  }

  _isMiddlewareClass(obj) {
    return typeof obj === 'function' && Middleware.isPrototypeOf(obj);
  }

  _wrapToHandlePromiseResult(handler) {
    return (event, context, callback) => {
      const result = handler(event, context, callback);
      if (!result || !result.then) {
        return result;
      }
      return result.then(response => {
        if (!(response instanceof Response)) {
          response = this._convertBodyToResponse(event, response)
        }
        return response.send(callback);
      }).catch(e => {
        return this._errorHandler.handle(e, event, context, callback);
      });
    };
  }

  _convertBodyToResponse(event, response) {
    return !response ? this._responseFactory.noContent() :
      event.httpMethod.toUpperCase() === 'POST' ? this._responseFactory.created(response) : this._responseFactory.ok(response);
  }

  _catchHandlerErrors(finallyMiddleware, handler) {
    return (event, context, callback) => {
      const finallyMiddlewareWrappedCallback = (error, response) => {
        return this._processMiddleware(finallyMiddleware, error, response, event, context, callback, () => callback(error, response));
      };

      try {
        handler(event, context, finallyMiddlewareWrappedCallback);
      } catch(err) {
        this._errorHandler.handle(err, event, context, finallyMiddlewareWrappedCallback);
      }
    }
  }

  /**
   * @param {...*} var_args [0] - middleware array. [1..x] - middleware params. [length-1] - next callback
   * @returns {*} result of middleware call.
   * @private
   */
  _processMiddleware(var_args) {
    const middleware = arguments[0];
    const middlewareArgs = Array.prototype.slice.call(arguments, 1, arguments.length - 1);
    const next = arguments[arguments.length - 1];

    const nextMiddleware = middleware && middleware.length && middleware[0];
    if (!nextMiddleware) {
      return next();
    }

    const processNext = () => this._processMiddleware.apply(this, [middleware.slice(1)].concat(middlewareArgs, next));
    return this._executeSingleMiddleware(nextMiddleware, middlewareArgs, processNext);
  }

  _executeSingleMiddleware(middleware, args, next) {
    return middleware.process.apply(middleware, [].concat(args, next));
  }
}

module.exports = Application;