'use strict';

const Component = require('../container/component');

const flattenArrays = require('../flatten-arrays');
const validateHeadersObject = require('../validate-headers-object');
const configWrappers = require('./route-config-wrappers');

const fs = require('fs');
const createLogger = require('../logger-factory');

class RouteConfig {
  constructor(customLogger) {
    this.globalConfig = []; // config { type: 'configType', overwrite: true, value: {...} }
    this.handlerConfig = {}; // handler name -> config list.
    this._logger = createLogger(__filename, customLogger);
  }

  find(handlerName, type, extraConfig) {
    let configList = handlerName ? (this.globalConfig.concat(this.handlerConfig[handlerName] || [])): this.globalConfig;
    if (extraConfig) {
      let extraConfigList = handlerName ? (extraConfig.globalConfig.concat(extraConfig.handlerConfig[handlerName] || [])): extraConfig.globalConfig;
      configList = configList.concat(extraConfigList);
    }
    let matching = [];
    configList.forEach(config => {
      if (config.type === type) {
        if (config.overwrite) {
          matching = [];
        }
        matching.push(config.value);
      }
    });
    return matching;
  }

  headers(var_args) {
    const { handlerName, override, args } = this._processArgsForOverride(arguments);
    const headers = args[0];
    if (args.length > 1 || typeof headers !== 'object') {
      throw new Error('headers can only take one argument a map of header keys to values.');
    }
    this._add(handlerName, 'headers', override, validateHeadersObject(headers));
  }

  onError(var_args) {
    const { handlerName, args } = this._processArgsForNoOverride('onError', arguments);
    if (args.length !== 1 || typeof args[0] !== 'function') {
      throw new Error('onError must be given one argument that is a function that takes three parameters, (error, req, res)');
    }
    this._add(handlerName, 'onError', true, args[0]);
  }

  middleware(var_args) {
    const { handlerName, override, args } = this._processArgsForOverride(arguments);
    if (!override && args.length === 0) {
      throw new Error('middleware must be given at least one argument');
    }
    const middlewares = flattenArrays(args)
    // if the middleware type is not given assume request.
      .map(middleware => middleware.middlewareType ? middleware : configWrappers.request(middleware));

    this._add(handlerName, 'middlewares', override, middlewares);
  }

  component(var_args) {
    const { handlerName, args } = this._processArgsForNoOverride('component', arguments);
    if (args.length < 2 ) {
      throw new Error('component must be given at least two arguments, the name of the component and the component class');
    }
    if (typeof args[0] !== 'string') {
      throw new Error('The first argument to component must be a string, the name of the component.');
    }
    this._add(handlerName, 'component', false, { name: args[0], componentClass: args[1], additionalArguments: args.slice(2)});
  }

  componentDir(var_args) {
    const { handlerName, args } = this._processArgsForNoOverride('componentDir', arguments);
    if (args.length < 3 ) {
      throw new Error('componentDir must be given at least three arguments, the namespace for the components, ' +
        'the directory to load components from and a boolean to indicate if it should be recursive');
    }
    if (typeof args[0] !== 'string') {
      throw new Error('The first argument to componentDir must be a string, the namespace of the components.');
    }
    if (typeof args[1] !== 'string') {
      throw new Error('The second argument to componentDir must be a string, the directory to load components from.');
    }
    if (typeof args[2] !== 'boolean') {
      throw new Error('The third argument to componentDir must be a boolean, true to recurse through subfolders');
    }

    this._registerComponentsInDir(handlerName, args[0], args[1], args[2], args.slice(3));
  }

  _add(handlerName, type, overwrite, value) {
    let toAddTo = this.globalConfig;
    if (handlerName) {
      if (!this.handlerConfig[handlerName]) {
        this.handlerConfig[handlerName] = [];
      }
      toAddTo = this.handlerConfig[handlerName];
    }
    const config = { type, overwrite, value };
    toAddTo.push(config);
    return config;
  }

  _registerComponentFile(handlerName, namespace, directory, filename, additionalArgs) {
    const moduleName = filename.replace(/\.([^.]+)$/, '');
    const module = require(`${directory}/${moduleName}`);
    if (!Component.isPrototypeOf(module)) {
      this._logger.trace(`Skipping module that is not a Component ${filename}`);
      return;
    }
    this._logger.trace(`Registering component from ${filename} with name ${moduleName}`);
    this.component.apply(this, [handlerName, `${namespace}/${moduleName}`, module].concat(additionalArgs));
  }

  _registerComponentsInDir(handlerName, namespace, directory, recursive, additionalArgs) {
    this._logger.trace(`Loading components from ${directory} into namespace ${namespace}`);
    const ls = fs.readdirSync(directory);
    ls.filter(file => file.endsWith('.js')).forEach((file) => {
      this._registerComponentFile(handlerName, namespace, directory, file, additionalArgs);
    });

    if (recursive) {
      ls.forEach(file => {
        const dir = `${directory}/${file}`;
        if (fs.statSync(dir).isDirectory()) {
          this._registerComponentsInDir(handlerName, `${namespace}/${file}`, dir, recursive, additionalArgs)
        }
      });
    }
  }

  _processArgsForOverride(argumentsFromCaller) {
    const handlerName = argumentsFromCaller[0];
    const override = argumentsFromCaller[1] && argumentsFromCaller[1].override;
    let args;
    if (override) {
      if (argumentsFromCaller.length > 2) {
        throw new Error('When override is used the method may only take one parameter. Any additional parameters should be given to the override method.');
      }
      args = argumentsFromCaller[1].value;
    } else {
      args = Array.prototype.slice.call(argumentsFromCaller, 1);
    }
    return { handlerName, override, args };
  }

  _processArgsForNoOverride(methodName, argumentsFromCaller) {
    const handlerName = argumentsFromCaller[0];
    const override = argumentsFromCaller[1] && argumentsFromCaller[1].override;
    if (override) {
      throw new Error(`override may not be used with ${methodName}.`);
    }
    const args = Array.prototype.slice.call(argumentsFromCaller, 1);
    return { handlerName, args };
  }
}

module.exports = RouteConfig;