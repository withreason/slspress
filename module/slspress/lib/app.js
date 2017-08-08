'use strict';

const ApplicationConfig = require('./config/application-config');
const routingHandlerFactory = require('./routing-handler-factory');

module.exports = function() {
  const config = new ApplicationConfig();

  let customLogger = null;

  this.on = handlerName => {
    return new function() {
      this.headers = function(var_args) { config.headers.apply(config, [handlerName].concat(Array.from(arguments))); return this; };
      this.onError  = function(var_args) { config.onError.apply(config, [handlerName].concat(Array.from(arguments))); return this; };
      this.middleware = function(var_args) { config.middleware.apply(config, [handlerName].concat(Array.from(arguments))); return this; };
      this.component = function(var_args) { config.component.apply(config, [handlerName].concat(Array.from(arguments))); return this; };
      this.componentDir = function(var_args) { config.componentDir.apply(config, [handlerName].concat(Array.from(arguments))); return this; };
      this.use = function(var_args) { config.use.apply(config, [handlerName].concat(Array.from(arguments))); return this; };
      this.cron = function(var_args) { config.use.apply(config, [handlerName, routingHandlerFactory.source.cron].concat(Array.from(arguments))); return this; };
      this.authorizer = function(var_args) { config.use.apply(config, [handlerName, routingHandlerFactory.source.authorizer].concat(Array.from(arguments))); return this; };
      this.get = function(var_args) { config.httpRoute.apply(config, [handlerName, 'GET'].concat(Array.from(arguments))); return this; };
      this.post = function(var_args) { config.httpRoute.apply(config, [handlerName, 'POST'].concat(Array.from(arguments))); return this; };
      this.put = function(var_args) { config.httpRoute.apply(config, [handlerName, 'PUT'].concat(Array.from(arguments))); return this; };
      this.patch = function(var_args) { config.httpRoute.apply(config, [handlerName, 'PATCH'].concat(Array.from(arguments))); return this; };
      this.delete = function(var_args) { config.httpRoute.apply(config, [handlerName, 'DELETE'].concat(Array.from(arguments))); return this; };
    };
  };

  this.headers = function(var_args) { config.headers.apply(config, [null].concat(Array.from(arguments))); return this; };
  this.onError = function(var_args) { config.onError.apply(config, [null].concat(Array.from(arguments))); return this; };
  this.middleware = function(var_args) { config.middleware.apply(config, [null].concat(Array.from(arguments))); return this; };
  this.component = function(var_args) { config.component.apply(config, [null].concat(Array.from(arguments))); return this; };
  this.componentDir = function(var_args) { config.componentDir.apply(config, [null].concat(Array.from(arguments))); return this; };

  this.logger = function(var_args) {
    if (arguments.length !== 1) {
      throw new Error(`logger must be given one argument - a console compatible logger.`);
    }
    customLogger = arguments[0];
  };

  this.export = function() {
    const handlers = {};
    config.handlerNames.forEach(handlerName => {
      handlers[handlerName] = routingHandlerFactory.create(config, handlerName, customLogger);
    });
    return handlers;
  };
};