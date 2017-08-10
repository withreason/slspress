'use strict';


/**
 * Represents a component in the container. If component construction is left to the framework then a container
 * object will be passed to the constructor as the first argument followed by any custom additional arguments.
 *
 * Components may have a start and or stop method to have their lifecycle managed.
 * The start method will be called the first time that the component is fetched from the container and the stop method
 * will be called when the container is stopped.
 *
 * When implementing a start method you may optionally return a result. In this case the
 * object returned will be the object that is returned from the containers fetch method.
 *
 * When implementing a stop method you may return a promise that resolves when the component has stopped.
 *
 * An example usage could be something like:
 *
 *  class MyDatabase extends Component {
 *    constructor(container) {
 *      this._dbUrl = container.fetch('environment').dbUrl;
 *      this._dbPromise = null;
 *    }
 *
 *    start() {
 *      const dbClient = new SomeDbImpl();
 *      this._dbPromise = new Promise((resolve, reject) => {
 *        try {
 *          dbClient.connect(this._dbUrl, resolve);
 *        } catch (e) {
 *          reject(e);
 *        }
 *      });
 *      return this;
 *    }
 *
 *    stop() {
 *      return this._dbPromise.then(db => db.disconnect());
 *    }
 *
 *    doSomething() {
 *      return this._dbPromise.then(db => db.doSomthing());
 *    }
 *  }
 *
 */
class Component {}

module.exports = Component;