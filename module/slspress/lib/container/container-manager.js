'use strict';

const Container = require('./container');
const Component = require('./component');

/**
 * Object to hold the container object and expose middleware functions to stop and start it.
 * @param componentConfigs the application configurations that represent components to be added to the container.
 */
module.exports = function(componentConfigs, customLogger) {

  let _container = null;

  Object.defineProperty(this, 'container', { get: () => _container });

  function invokeConstructorWithArgs(clazz, thisContext, argumentArray) {
    return new (Function.prototype.bind.apply(clazz, [thisContext].concat(argumentArray)));
  }

  this.startContainer = (req, res, next) => {
    const container = new Container(customLogger);
    componentConfigs.forEach(({ name, componentClass, additionalArguments}) => {
      let component;
      if (Component.isPrototypeOf(componentClass)) {
        component = invokeConstructorWithArgs(componentClass, null, [container].concat(additionalArguments));
      } else {
        component = componentClass;
      }
      container.register(name, component);
    });
    _container = container;
    return next();
  };

  this.stopContainer = (req, res, next) => {
    if (_container) {
      return _container.stop().then(next);
    }
    return next();
  };
};