'use strict';

const logger = require('sls-zone-mould').logger(__filename);

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

  constructor(params) {
    this._config = this._buildConfig(params);
    this._store  = {};
    this._registry = {};
  }

  /**
   * Registers a new component object with this container.
   * @param {String} key - the key to store the component under.
   * @param {Object} component - the component to store.
   * @return {Object} the component param
   */
  register(key, component) {
    this._log(`Registering new component ${key}`);
    this._log(JSON.stringify({ key: key, value: typeof component}, null, '\t'));

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

    this._log(`fetching ${key}`);

    if (value) {
      this._log(`found component for ${key}`);

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
    this._log(`could not find component for ${key}`);
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
        this._log('Flushing container - stopping the app was a success');
        this._store   = {};
        this._registry = [];
      });
    });
  }

  _buildConfig(params) {
    let opts      = (params || {});
    const object  = {};
    object.debug  = opts.debug || false;
    object.logger = opts.logger || console;
    return object;
  }

  _log(text) {
    if (this._config.debug) {
      return logger.trace("[Container] " + text);
    }
  }
}

module.exports = Container;