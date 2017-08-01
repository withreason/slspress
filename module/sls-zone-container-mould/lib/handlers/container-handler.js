'use strict';

/**
 * Base class for container handlers. Subclasses are expected to have a single arg constructor that takes one argument the container.
 * The three objects that are auto injected into the container are available for use on the private params
 * this._environment, this._event and this._context.
 *
 * Subclasses should override and implement the validate and process methods. Validate will be called first and
 * then if that succeeds process will be called. Both methods must return a promise.
 * If the promise is rejected the rejection will be passed to the error handler.
 * If the process promise resolves the http response content will depend on the value in the resolve.
 *
 * If the object returned from the resolved promise extends from the {Response} object that will be used to invoke the serverless callback.
 * If not the following rules apply to determine how the response is returned:
 *   - if the object returned is null or undefined a 204(no content) response will be sent back.
 *   - if the object returned is present and the http method was a POST a 201(created) response will be sent back.
 *   - if the object returned is present and the http method was anything EXCEPT a POST a 200(ok) response will be sent back.
 *
 */
class ContainerHandler {
  constructor(container) {
    this._environment = container.fetch('environment');
    this._event = container.fetch('serverless/event');
    this._context = container.fetch('serverless/context');
  }

  validate() {
    return Promise.resolve();
  }

  process() {
    return Promise.resolve();
  }
}

module.exports = ContainerHandler;