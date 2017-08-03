'use strict';

const createLogger = require('../logger-factory');

/**
 * Container that manages the lifcycle of the components within it.
 *
 * usage:
 * ===
 *
 * class DbComponent extends Component {
 *  constructor(container) {
 *    //store any references to components from the container.
 *  }
 *
 *  start() { // optional start method
 *   // do init stuff
 *
 *   // return the value to be returned when getting this component from the container
 *  }
 *
 *  stop() { // optional stop method
 *    // do tear down stuff
 *  }
 * }
 *
 * const container = new Container();
 * const dbComponent = new DbComponent(container);
 * container.register('component/database', dbComponent);
 *
 * const startedInstance = container.fetch('component/database');
 *
 * // do stuff with startedInstance
 *
 * container.stop(); // tear down all components in the container
 *
 */
class Container {

  constructor(customLogger) {
    this._store  = {};
    this._registry = {};
    this._logger = createLogger(__filename, customLogger);
  }

  /**
   * Registers a new component object with this container.
   * @param {String} key - the key to store the component under.
   * @param {Object} component - the component to store.
   * @return {Object} the component param
   */
  register(key, component) {
    this._logger.trace(`[Container] Registering new component ${key}=${typeof component}`);

    if (this._store[key] !== undefined) {
      throw new Error(`Duplicate declaration of ${key} found`);
    } else {
      this._store[key] = { component };
      return component;
    }
  }

  /**
   * Fetch a started component. If a component has not yet been started it will be started and then returned.
   * @param {String} key - the key to store the component under.
   * @return {Object} the value returned from the component's start function or the component if it has no start method or returns nothing.
   */
  fetch(key) {
    const value = this._store[key];

    this._logger.trace(`[Container] fetching ${key}`);

    if (value) {
      this._logger.trace(`[Container] found component for ${key}`);

      if (!this._registry[key]) {
        //start component
        this._registry[key] = value.component;
        if (typeof value.component.start === 'function') {
          const result = value.component.start();
          if (result) {
            this._registry[key] = result;
          }
        }
      }
      return this._registry[key];
    }
    this._logger.error(`[Container] could not find component for ${key}`);
    throw new Error(`Could not find ${key}`);
  }

  /**
   * Stop all components in this container.
   * @return {Promise} when this has stopped.
   */
  stop() {
    const activeComponents = Object.keys(this._registry).map((key) => this.fetch(key));

    return Promise.all(activeComponents).then((activatedComponents) => {
      const teardown = activatedComponents.map((component) => {
        if (typeof component.stop === 'function') {
          const stopResult = component.stop();
          if (stopResult && typeof stopResult.then === 'function') {
            return stopResult;
          }
        }
        return Promise.resolve();
      });
      return Promise.all(teardown).then(() => {
        this._logger.trace('[Container] Flushing container - stopping the app was a success');
        this._store   = {};
        this._registry = [];
      });
    });
  }
}

module.exports = Container;