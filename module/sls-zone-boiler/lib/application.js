'use strict';

const fs = require('fs');

const ResponseFactory = require('./response/response-factory');
const ErrorHandler = require('./error/error-handler');
const SimpleErrorHandler = require('./error/simple-error-handler');

const Middleware = require('./middleware/middleware');
const RequestMiddleware = require('./middleware/request-middleware');
const ResponseMiddleware = require('./middleware/response-middleware');
const FinallyMiddleware = require('./middleware/finally-middleware');

const Container = require('./container/container');
const ContainerHandler = require('./handlers/container-handler');
const Component = require('./container/component');

const MiddlewareApplicator = require('./middleware-applicator');

class CreateContainer extends RequestMiddleware {
  constructor(environment, componentList) {
    super();
    this._environment = environment;
    this._componentList = componentList;
    this.container = null;
  }

  process(event, context, callback) {
    const container = new Container();
    this._injectImplicitComponents(container, event, context);
    this._componentList.forEach(({name, component}) => {
      if (Component.isPrototypeOf(component)) {
        component = new component(container);
      }
      container.register(name, component);
    });
    this.container = container;
    return true;
  }

  _injectImplicitComponents(container, event, context) {
    container.register('environment', this._environment);
    container.register('serverless/event', event);
    container.register('serverless/context', context);
  }
}

class StopContainer extends FinallyMiddleware {
  constructor(containerHolder) {
    super();
    this._containerHolder = containerHolder;
  }

  process(error, response, event, context, callback) {
    const container = this._containerHolder.container;
    if (container) {
      return container.stop().then(() => true);
    }
    return true;
  }
}

/**
 * An application built around an IOC container that can manage state for the requests and lifecycles of components.
 * The idea is that the container contains everything required that middleware and handlers need to execute.
 * It can manage components that have a lifecycle so that things like closing connections at the end of requests etc are handled automatically.
 *
 * Example Usage:
 *
 *
 * handlers.js:
 *
 * const environment = require('./environment');
 *
 * const customHeaders = {
 *    'Access-Control-Allow-Origin' : environment.cors.allowedOrigins
 * };
 *
 * module.exports = new ContainerApplication(environment)
 *    .withResponseFactory(new ResponseFactory().withHeaders(customHeaders))
 *    .withComponent('resources/database', require('./components/database'))
 *    .withComponentDir('dao', 'components/dao', true)
 *    .withMiddleware(require('./middleware/request/log'), require('./middleware/response/log'))
 *    .withMiddleware(require('./middleware/request/parse-json-body'))
 *    .withMiddleware(require('./middleware/request/decode-path-params'))
 *    .withContainerHandler('usersGet', require('./handlers/users/get'), require('./middleware/response/stringify'))
 *    .getHandlers();
 *
 * handlers/users/get.js:
 *
 * class UsersGet {
 *    constructor(container) {
 *      super(container);
 *      this._database = container.fetch('resources/database');
 *    }
 *
 *    validate() {
 *      if (!this._event.pathParameters.id) {
 *        throw new Error('need to provide id parameter')
 *      }
 *      return Promise.resolve();
 *    }
 *
 *    process() {
 *      return this._database.find('users', this._event.pathParameters.id)
 *        .then(user => {
 *          // strip some private fields
 *          delete user.admin;
 *          return user;
 *        })
 *    }
 * }
 * module.exports = UsersGet;
 */
class Application {
  constructor(environment) {
    const componentList = [];
    const createContainer = new CreateContainer(environment, componentList);

    this._componentList = componentList;
    this._containerHolder = createContainer;

    this._handlers = {};
    this._requestMiddleware = [ createContainer ];
    this._responseMiddleware = [];
    this._finallyMiddleware = [ new StopContainer(this._containerHolder) ];
    this._responseFactory = null;
    this._errorHandler = null;
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
   * Adds a component to the container that this application uses.
   * @param {string} name the name of the component inside the container
   * @param {Object} component either the class of the component to be added or the object itself for
   * non container constructed components. e.g, if you want to just use it as a store for config  etc.
   * @returns {ContainerApplication}
   */
  withComponent(name, component) {
    this._componentList.push({name, component});
    return this;
  }

  /**
   * Adds a component to the container that this application uses from a file.
   * @param {string} filename the name of the file containing the exported component class
   * @param {string} namespace the 'folder' in the container namespace in which to add this component.
   *    e.g. 'dao' namespace with a file of 'users' would add the component at 'dao/users'
   * @param {string} directory the directory to which the file to be loaded belongs.
   * @returns {ContainerApplication}
   */
  withComponentFile(filename, namespace, directory) {
    const moduleName = filename.replace(/\.([^.]+)$/, '');
    const module = require(`${directory}/${moduleName}`);
    if (!Component.isPrototypeOf(module)) {
      logger.trace(`[ContainerApplication] Skipping module that is not an Component ${filename}`);
      return this;
    }
    return this.withComponent(`${namespace}/${moduleName}`, module);
  }

  /**
   * Adds a directory full of components to the container that this application uses. Note this will only add
   * .js files and where the export extends from Component.
   * @param {string} namespace the 'folder' in the container namespace in which to add this component.
   *    e.g. 'dao' namespace with a file of 'users' would add the component at 'dao/users'
   * @param {string} directory the directory containing components to add.
   * @param {boolean} recursive wheather to add components in subfolders.
   * @returns {ContainerApplication}
   */
  withComponentDir(namespace, directory, recursive) {
    const ls = fs.readdirSync(directory);

    ls.filter(file => file.endsWith('.js')).forEach((file) => {
      this.withComponentFile(file, namespace, directory);
    });

    if (recursive) {
      ls.forEach(file => {
        const dir = `${directory}/${file}`;
        if (fs.statSync(dir).isDirectory()) {
          this.withComponentDir(`${namespace}/${file}`, dir, recursive)
        }
      });
    }
    return this;
  }

  /**
   * Add middleware to any handlers added after this call.
   * The middleware must be an object or class that extends from ContainerRequestMiddleware, ContainerResponseMiddleware,
   * ContainerFinallyMiddleware, RequestMiddleware, ResponseMiddleware or FinallyMiddleware.
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
   * @param {ContainerRequestMiddleware|ContainerResponseMiddleware|ContainerFinallyMiddleware|RequestMiddleware|ResponseMiddleware|FinallyMiddleware} var_args
   * @returns {Application}
   */
  withMiddleware(var_args) {

    Array.prototype.forEach.call(arguments, m => {
      if (Middleware.isPrototypeOf(m)) {
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
   * Add a handler that can process requests. This can support three types of handler.
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
   * Container:
   * A handler that extends from the {ContainerHandler} class. This type of handler has access to a container
   * and lifecycle managed components in that container registered using the withComponent methods. The handler should
   * implement two methods, validate and process. These both return a promise and the result is handled in the same way as the
   * promise handler style. The validate and process methods take no value but the event and context objects can be
   * extracted from the container that is passed into the constructor. See {ContainerHandler} for more information.
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
    let {handler, requestMiddleware, responseMiddleware, finallyMiddleware} = this._parseHandlerParams(objects);
    requestMiddleware = this._requestMiddleware.concat(requestMiddleware);
    responseMiddleware = responseMiddleware.concat(this._responseMiddleware);
    finallyMiddleware = finallyMiddleware.concat(this._finallyMiddleware);

    let wrappedHandler;
    if (ContainerHandler.isPrototypeOf(handler)) {
      wrappedHandler = () => {
        const handlerInstance = new handler(this._containerHolder.container);
        return handlerInstance.validate().then(() => handlerInstance.process());
      };
    } else {
      wrappedHandler = handler;
    }

    // create defaults if not explicitly set.
    const responseFactory = this._responseFactory || new ResponseFactory();
    const errorHandler = this._errorHandler || new SimpleErrorHandler(responseFactory);

    const middlewareApplicator = new MiddlewareApplicator(errorHandler, responseFactory, this._containerHolder);
    this._handlers[name] = middlewareApplicator.apply(wrappedHandler, requestMiddleware, responseMiddleware, finallyMiddleware);

    return this;
  }

  /**
   * The handlers objects to be exported.
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
      if (Middleware.isPrototypeOf(arg)) {
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
}

module.exports = Application;