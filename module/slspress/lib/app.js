'use strict';

const ApplicationConfig = require('./config/application-config');
const routingHandlerFactory = require('./routing-handler-factory');

/**
 * The application object that is used to configure the applications routes and handlers.
 * See the README for more information and sample usage.
 */
module.exports = function() {
  const config = new ApplicationConfig();

  let customLogger = null;

  /**
   * Define some things that will happen on a particular function.
   * e.g. on('hello').use((req,res) => res.ok('hello')); will define a handler function 'hello' that returns the string
   * 'hello' when called.
   * @param handlerName the name of the handler that chained method calls will apply to.
   */
  this.on = handlerName => {
    return new function() {

      /**
       * Add some headers to the response for this particular function.
       * @param headers an object containing string, string key, value pairs representing the headers to be added. e.g.
       * {'Content-Type': 'application/json'}
       * @returns {*} this object to allow call chaining
       */
      this.headers = function(headers) {
        config.headers.apply(config, [handlerName].concat(Array.from(arguments)));
        return this;
      };

      /**
       * Replace the global error handler for this function.
       * @param errorHandler an error handling function. e.g. (req, res) => { res.notFound(); } The error thrown can be found on res.error.
       * @returns {*} this object to allow call chaining
       */
      this.onError  = function(errorHandler) {
        config.onError.apply(config, [handlerName].concat(Array.from(arguments)));
        return this;
      };

      /**
       * Add some middleware to this function. By default this will assume it is request middleware. In order to add
       * response or finally middleware use the 'response' and 'final' helper functions exported by slspress as in
       * the below examples.
       *
       * Request middleware usage:
       * on('hello').middleware((req, res, next) => {
       *    // do something
       *    return next();
       * });
       *
       * Response middleware usage:
       * on('hello').middleware(response((req, res, next) => {
       *    // do something
       *    return next();
       * }));
       *
       * Finally middleware usage:
       * on('hello').middleware(final((req, res, next) => {
       *    // do something
       *    return next();
       * }));
       *
       * @param var_args this can be one or more middleware functions or arrays of middleware functions.
       * @returns {*} this object to allow call chaining.
       */
      this.middleware = function(var_args) {
        config.middleware.apply(config, [handlerName].concat(Array.from(arguments)));
        return this;
      };

      /**
       * Register a component for use with the IoC container for this function only.
       *
       * If the component has a start and stop method they will be
       * called when the component is fetched from the container for the first time and when the application is
       * torn down. See {Component} for more information.
       * Components can be fetched for use in handlers or middleware using this.component(name) or req.app.component(name).
       *
       * @param componentName the name under which to register the component. e.g. "components/resources/database"
       * @param componentClassOrObject a class that extends from {Component} or a plain object.
       * @param additionalConstructorVarArgs optional additional arguments that will be passed to the component class
       * constructor in addition to the container object. e.g. constructor signature could be (container, config)
       * where config is an additional argument.
       * @returns {*} this object to allow call chaining.
       */
      this.component = function(componentName, componentClassOrObject, additionalConstructorVarArgs) {
        config.component.apply(config, [handlerName].concat(Array.from(arguments)));
        return this;
      };

      /**
       * Register a directory full of component classes for this function only.
       * This will scan a directory for all .js files that export a class that extends from Component.
       *
       * If the component has a start and stop method they will be
       * called when the component is fetched from the container for the first time and when the application is
       * torn down. See {Component} for more information.
       * Components can be fetched for use in handlers or middleware using this.component(name) or req.app.component(name).
       *
       *
       * @param componentNamespace the namespace under which to register the components. e.g. 'components'.
       * components found in the immediate directory will be named by filename under this namespace.
       * e.g. witch a namespace of 'components' a file called database.js would be given the name 'components/database'.
       * If recursive the folder name would also be included in the name e.g. components/resources/database.js
       * would be named 'components/resources/database'
       * @param directory the directory to scan.
       * @param recursive boolean to indicate whether to scan subdirectories for components as well.
       * @param additionalConstructorVarArgs optional additional arguments that will be passed to the component class
       * constructors in addition to the container object. e.g. constructor signatures could be (container, config)
       * where config is an additional argument.
       * @returns {*} this object to allow call chaining.
       */
      this.componentDir = function(componentNamespace, directory, recursive, additionalConstructorVarArgs) {
        config.componentDir.apply(config, [handlerName].concat(Array.from(arguments)));
        return this;
      };

      /**
       * Assign a default handler to this function.
       * This will be used if no other http handler registered on this function matches the incoming request.
       *
       * Handlers should be functions that take two arguments (req, res). If you wish to use raw handlers use the
       * rawHandler wrapper function. e.g. .use(rawHandler(event, context, callback))
       *
       * @param var_args either a single handler argument or an event source filter followed buy a handler.
       * e.g. ('cron', handler)
       * In this case the event will only be forwarded to the handler if the event type matches.
       *
       * @returns {*} this object to allow call chaining.
       */
      this.use = function(var_args) {
        config.use.apply(config, [handlerName].concat(Array.from(arguments)));
        return this;
      };

      /**
       * Assign a cron handler to this function.
       * This will be used for cron events only. This is a convenience for .use('cron', handler)
       *
       * Handlers should be functions that take two arguments (req, res). If you wish to use raw handlers use the
       * rawHandler wrapper function. e.g. .use(rawHandler(event, context, callback))
       *
       * @param handler the handler.
       * @returns {*} this object to allow call chaining.
       */
      this.cron = function(handler) {
        config.use.apply(config, [handlerName, routingHandlerFactory.source.cron].concat(Array.from(arguments)));
        return this;
      };

      /**
       * Indicate that this handler should be able to process authentication requests.
       * This will be used for authentication events only. This is a convenience for .use('auth', handler)
       *
       * @param authorizerFunction the authorizer function (event, context, callback)
       * @returns {*} this object to allow call chaining.
       */
      this.authorizer = function(authorizerFunction) {
        config.use.apply(config, [handlerName, routingHandlerFactory.source.authorizer].concat(Array.from(arguments)));
        return this;
      };

      /**
       * Assign a get http handler to this function.
       * The given handler will be used if the incoming event is a http event,
       * has a method of GET and the events path matches the given one.
       *
       * Handlers should be functions that take two arguments (req, res). If you wish to use raw handlers use the
       * rawHandler wrapper function. e.g. .use(rawHandler(event, context, callback))
       *
       * @param path the http path this handler should apply to.
       * @param handler the handler to invoke when the path and method matches.
       *
       * @returns {*} this object to allow call chaining.
       */
      this.get = function(path, handler) {
        config.httpRoute.apply(config, [handlerName, 'GET'].concat(Array.from(arguments)));
        return this;
      };

      /**
       * Assign a post http handler to this function.
       * The given handler will be used if the incoming event is a http event,
       * has a method of POST and the events path matches the given one.
       *
       * Handlers should be functions that take two arguments (req, res). If you wish to use raw handlers use the
       * rawHandler wrapper function. e.g. .use(rawHandler(event, context, callback))
       *
       * @param path the http path this handler should apply to.
       * @param handler the handler to invoke when the path and method matches.
       *
       * @returns {*} this object to allow call chaining.
       */
      this.post = function(path, handler) {
        config.httpRoute.apply(config, [handlerName, 'POST'].concat(Array.from(arguments)));
        return this;
      };

      /**
       * Assign a put http handler to this function.
       * The given handler will be used if the incoming event is a http event,
       * has a method of PUT and the events path matches the given one.
       *
       * Handlers should be functions that take two arguments (req, res). If you wish to use raw handlers use the
       * rawHandler wrapper function. e.g. .use(rawHandler(event, context, callback))
       *
       * @param path the http path this handler should apply to.
       * @param handler the handler to invoke when the path and method matches.
       *
       * @returns {*} this object to allow call chaining.
       */
      this.put = function(path, handler) {
        config.httpRoute.apply(config, [handlerName, 'PUT'].concat(Array.from(arguments)));
        return this;
      };

      /**
       * Assign a patch http handler to this function.
       * The given handler will be used if the incoming event is a http event,
       * has a method of PATCH and the events path matches the given one.
       *
       * Handlers should be functions that take two arguments (req, res). If you wish to use raw handlers use the
       * rawHandler wrapper function. e.g. .use(rawHandler(event, context, callback))
       *
       * @param path the http path this handler should apply to.
       * @param handler the handler to invoke when the path and method matches.
       *
       * @returns {*} this object to allow call chaining.
       */
      this.patch = function(path, handler) {
        config.httpRoute.apply(config, [handlerName, 'PATCH'].concat(Array.from(arguments)));
        return this;
      };

      /**
       * Assign a delete http handler to this function.
       * The given handler will be used if the incoming event is a http event,
       * has a method of DELETE and the events path matches the given one.
       *
       * Handlers should be functions that take two arguments (req, res). If you wish to use raw handlers use the
       * rawHandler wrapper function. e.g. .use(rawHandler(event, context, callback))
       *
       * @param path the http path this handler should apply to.
       * @param handler the handler to invoke when the path and method matches.
       *
       * @returns {*} this object to allow call chaining.
       */
      this.delete = function(path, handler) {
        config.httpRoute.apply(config, [handlerName, 'DELETE'].concat(Array.from(arguments)));
        return this;
      };
    };
  };

  /**
   * Add some headers to the response for all functions.
   * @param headers an object containing string, string key, value pairs representing the headers to be added. e.g.
   * {'Content-Type': 'application/json'}
   * @returns {*} this object to allow call chaining
   */
  this.headers = function(headers) {
    config.headers.apply(config, [null].concat(Array.from(arguments)));
    return this;
  };

  /**
   * Replace the global error handler for all functions.
   * @param errorHandler an error handling function. e.g. (req, res) => { res.notFound(); } The error thrown can be found on res.error.
   * @returns {*} this object to allow call chaining
   */
  this.onError = function(errorHandler) {
    config.onError.apply(config, [null].concat(Array.from(arguments)));
    return this;
  };

  /**
   * Add some middleware to all functions. By default this will assume it is request middleware. In order to add
   * response or finally middleware use the 'response' and 'final' helper functions exported by slspress as in
   * the below examples.
   *
   * Request middleware usage:
   * on('hello').middleware((req, res, next) => {
       *    // do something
       *    return next();
       * });
   *
   * Response middleware usage:
   * on('hello').middleware(response((req, res, next) => {
       *    // do something
       *    return next();
       * }));
   *
   * Finally middleware usage:
   * on('hello').middleware(final((req, res, next) => {
       *    // do something
       *    return next();
       * }));
   *
   * @param var_args this can be one or more middleware functions or arrays of middleware functions.
   * @returns {*} this object to allow call chaining.
   */
  this.middleware = function(var_args) {
    config.middleware.apply(config, [null].concat(Array.from(arguments)));
    return this;
  };

  /**
   * Register a component for use with the IoC container available to all functions.
   *
   * If the component has a start and stop method they will be
   * called when the component is fetched from the container for the first time and when the application is
   * torn down. See {Component} for more information.
   * Components can be fetched for use in handlers or middleware using this.component(name) or req.app.component(name).
   *
   * @param componentName the name under which to register the component. e.g. "components/resources/database"
   * @param componentClassOrObject a class that extends from {Component} or a plain object.
   * @param additionalConstructorVarArgs optional additional arguments that will be passed to the component class
   * constructor in addition to the container object. e.g. constructor signature could be (container, config)
   * where config is an additional argument.
   * @returns {*} this object to allow call chaining.
   */
  this.component = function(componentName, componentClassOrObject, additionalConstructorVarArgs) {
    config.component.apply(config, [null].concat(Array.from(arguments)));
    return this;
  };

  /**
   * Register a directory full of component classes available to all functions.
   * This will scan a directory for all .js files that export a class that extends from Component.
   *
   * If the component has a start and stop method they will be
   * called when the component is fetched from the container for the first time and when the application is
   * torn down. See {Component} for more information.
   * Components can be fetched for use in handlers or middleware using this.component(name) or req.app.component(name).
   *
   * @param componentNamespace the namespace under which to register the components. e.g. 'components'.
   * components found in the immediate directory will be named by filename under this namespace.
   * e.g. witch a namespace of 'components' a file called database.js would be given the name 'components/database'.
   * If recursive the folder name would also be included in the name e.g. components/resources/database.js
   * would be named 'components/resources/database'
   * @param directory the directory to scan.
   * @param recursive boolean to indicate whether to scan subdirectories for components as well.
   * @param additionalConstructorVarArgs optional additional arguments that will be passed to the component class
   * constructors in addition to the container object. e.g. constructor signatures could be (container, config)
   * where config is an additional argument.
   * @returns {*} this object to allow call chaining.
   */
  this.componentDir = function(componentNamespace, directory, recursive, additionalConstructorVarArgs) {
    config.componentDir.apply(config, [null].concat(Array.from(arguments)));
    return this;
  };

  /**
   * Override the default logger and provide your own. By default the console object is used.
   * @param logger a console compatible logger.
   */
  this.logger = function(logger) {
    if (arguments.length !== 1) {
      throw new Error(`logger must be given one argument - a console compatible logger.`);
    }
    customLogger = arguments[0];
  };

  /**
   * Create an object mapping handler name to handler function that can be given directly to severless.
   * It is expected that the result of this will be the module exports.
   * @returns {handlername: handlerFunction}
   */
  this.export = function() {
    const handlers = {};
    config.handlerNames.forEach(handlerName => {
      handlers[handlerName] = routingHandlerFactory.create(config, handlerName, customLogger);
    });
    return handlers;
  };
};