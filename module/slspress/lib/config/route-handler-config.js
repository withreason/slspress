'use strict';

const RouteConfig = require('./route-config');

/**
 * Represents config that is specific to a particular route on a handler function.
 * e.g. only to get requests that have path /stuff.
 */
class RouteHandlerConfig {
  constructor(type, handlerFunction) {
    this._type = type;
    this._handlerFunction = handlerFunction;
    this._config = new RouteConfig();
  }

  /**
   * Add some headers to the response for this particular route.
   * @param headers an object containing string, string key, value pairs representing the headers to be added. e.g.
   * {'Content-Type': 'application/json'}
   * @returns {*} this object to allow call chaining
   */
  headers(headers) {
    this._config.headers.apply(this._config, [null].concat(Array.from(arguments)));
    return this;
  }

  /**
   * Replace the global error handler for this route only.
   * @param errorHandler an error handling function. e.g. (req, res) => { res.notFound(); } The error thrown can be found on res.error.
   * @returns {*} this object to allow call chaining
   */
  onError(errorHandler) {
    this._config.onError.apply(this._config, [null].concat(Array.from(arguments)));
    return this;
  }

  /**
   * Add some middleware to this route only. By default this will assume it is request middleware. In order to add
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
  middleware(var_args) {
    this._config.middleware.apply(this._config, [null].concat(Array.from(arguments)));
    return this;
  }

  /**
   * Register a component for use with the IoC container available to this route only.
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
  component(componentName, componentClassOrObject, additionalConstructorVarArgs) {
    this._config.component.apply(this._config, [null].concat(Array.from(arguments)));
    return this;
  }

  /**
   * Register a directory full of component classes available to this route only.
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
  componentDir(componentNamespace, directory, recursive, additionalConstructorVarArgs) {
    this._config.componentDir.apply(this._config, [null].concat(Array.from(arguments)));
    return this;
  }
}

module.exports = RouteHandlerConfig;