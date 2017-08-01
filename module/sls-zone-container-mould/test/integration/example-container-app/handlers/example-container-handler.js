'use strict';

const containerMould = require('../../../..');
const NotFoundError = containerMould.NotFoundError;

class ExampleContainerHandler extends containerMould.ContainerHandler {

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