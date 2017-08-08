'use strict';

const RouteConfig = require('./route-config');

class RouteHandlerConfig {
  constructor(type, handlerFunction) {
    this._type = type;
    this._handlerFunction = handlerFunction;
    this._config = new RouteConfig();
  }

  headers(var_args) { this._config.headers.apply(this._config, [null].concat(Array.from(arguments))); return this; };
  onError(var_args) { this._config.onError.apply(this._config, [null].concat(Array.from(arguments))); return this; };
  middleware(var_args) { this._config.middleware.apply(this._config, [null].concat(Array.from(arguments))); return this; };
  component(var_args) { this._config.component.apply(this._config, [null].concat(Array.from(arguments))); return this; };
  componentDir(var_args) { this._config.componentDir.apply(this._config, [null].concat(Array.from(arguments))); return this; };
}

module.exports = RouteHandlerConfig;