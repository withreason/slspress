'use strict';

const boiler = require('../../../../..');
const logger = boiler.logger(__filename);
const NotFoundError = boiler.NotFoundError;

class FakeDatabase extends boiler.Component {
  constructor(container) {
    super();

    this._environment = container.fetch('environment');
    this._data = {};
  }

  start() {
    this._data = JSON.parse(this._environment.fakedb.data);
    logger.info('[FakeDatabase] Started.');
  }

  stop() {
    this._data = null;
    logger.info('[FakeDatabase] Stopped.');
  }

  find(id) {
    const val = this._data[id];
    if (!val) {
      return Promise.reject(new NotFoundError(`stuff with id ${id}`))
    }
    return Promise.resolve(this._data[id]);
  }
}

module.exports = FakeDatabase;
