'use strict';

const fs = require('fs');
const logger = require('./logger')(__filename);

const Application = require('./application');
const Container = require('./container/container');
const ContainerHandler = require('./handlers/container-handler');
const Component = require('./container/component');

const ContainerRequestMiddleware = require('./middleware/container-request-middleware');
const ContainerResponseMiddleware = require('./middleware/container-response-middleware');
const ContainerFinallyMiddleware = require('./middleware/container-finally-middleware');
const RequestMiddleware = require('./middleware/request-middleware');
const FinallyMiddleware = require('./middleware/finally-middleware');

class CreateContainer extends RequestMiddleware {
  constructor(environment, componentList) {
    super();
    this._environment = environment;
    this._componentList = componentList;
    this.container = null;
  }

  process(event, context, callback, next) {
    const container = new Container();
    this._injectImplicitComponents(container, event, context);
    this._componentList.forEach(({name, component}) => {
      if (Component.isPrototypeOf(component)) {
        component = new component(container);
      }
      container.register(name, component);
    });
    this.container = container;
    return next();
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

  process(error, response, event, context, callback, next) {
    const container = this._containerHolder.container;
    if (container) {
      container.stop().then(next).catch(err => logger.error('Failed to stop container.', err))
    }
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
class ContainerApplication extends Application {

  /**
   * Create a new container application.
   *
   * @param environment the global environment object tha will be available in the container at 'environment'
   */
  constructor(environment) {
    super();
    this._componentList = [];

    const createContainer = new CreateContainer(environment, this._componentList);
    this._containerHolder = createContainer;

    this._requestMiddleware = [ createContainer ];
    this._responseMiddleware = [];
    this._finallyMiddleware = [ new StopContainer(this._containerHolder) ];
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
      if (this._isMiddlewareClass(m)) {
        m = new m();
      }

      if (m instanceof ContainerRequestMiddleware) {
        this._requestMiddleware.push(m);
      } else if (m instanceof ContainerResponseMiddleware) {
        this._responseMiddleware.unshift(m);
      } else if (m instanceof ContainerFinallyMiddleware) {
        this._finallyMiddleware.unshift(m);
      } else {
        super.withMiddleware(m);
      }
    });

    return this;
  }

  /**
   * Add a container handler that can process requests (a container handler is a class that extends from {ContainerHandler}).
   * See the documentation on {ContainerHandler} for more details.
   *
   * The first arg of this method must be the name of the handler to be referenced in your serverless.yml
   * The following args can be a mix of middleware and handlers as long as there is only one handler.
   * Middleware objects must extend from ContainerRequestMiddleware, ContainerResponseMiddleware,
   * ContainerFinallyMiddleware, RequestMiddleware, ResponseMiddleware or FinallyMiddleware.
   * Note any REQUEST middleware supplied here will be added to the chain after any that has been supplied by withMiddleware.
   * Any RESPONSE or FINALLY middleware will be added before that supplied by withMiddleware.
   *
   * Usage:
   *
   * new Application().withContainerHandler('getAll', requestMiddleware1, require('./handlers/get-all'), responseMiddleware)
   *
   * @param {[*]} var_args
   * @returns {Application}
   */
  withHandler(var_args) {
    const name = arguments[0];
    const objects = Array.prototype.slice.call(arguments, 1);
    let {requestMiddleware, responseMiddleware, finallyMiddleware, handler} = this._parseHandlerParams(objects);

    if (!ContainerHandler.isPrototypeOf(handler)) {
      return super.withHandler.apply(this, Array.from(arguments));
    }

    const promiseHandler = () => {
      const handlerInstance = new handler(this._containerHolder.container);
      return handlerInstance.validate().then(() => handlerInstance.process());
    };
    return super.withHandler.apply(this, [].concat(name, requestMiddleware, responseMiddleware, finallyMiddleware, promiseHandler));
  }

  _executeSingleMiddleware(middleware, args, next) {
    if (middleware.middlewareType !== 'container') {
      return super._executeSingleMiddleware(middleware, args, next);
    }
    args = args.slice(0, args.length - 3); // strip off event, context, callback args
    args = [this._containerHolder.container].concat(args); // add container as first arg.
    return middleware.process.apply(middleware, [].concat(args, next));
  }
}

module.exports = ContainerApplication;