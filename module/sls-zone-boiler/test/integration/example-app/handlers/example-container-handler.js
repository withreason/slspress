'use strict';

const boiler = require('../../../..');
const NotFoundError = boiler.NotFoundError;

class ExampleContainerHandler extends boiler.ContainerHandler {

  constructor(container) {
    super(container);
    this._fakeDatabase = container.fetch('components/resources/fake-database');
  }

  validate() {
    if (!this._event.pathParameters.id) {
      return Promise.reject(new NotFoundError('id'));
    }
    return Promise.resolve();
  }

  process() {
    return this._fakeDatabase.find(this._event.pathParameters.id);
  }
}

module.exports = ExampleContainerHandler;