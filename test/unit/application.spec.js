'use strict';

const expect = require('chai').expect;

const Application = require('../../index').Application;

describe('Application', function() {
  describe('handlers', function () {
    it('stores handlers for later retrieval', function () {
      const handler = (event, context, callback) => callback({ mock: 'handler'});
      const handlers = new Application()
        .withHandler('test-handler', handler)
        .getHandlers();

      expect(handlers).to.have.property('test-handler');
      let capturedResponse = null;
      handlers['test-handler'](null, null, val => capturedResponse = val);

      expect(capturedResponse).to.eql({ mock: 'handler'});
    });

    it('throws an error if the same handler name is reused', function () {
      const handler = () => ({ mock: 'handler'});
      const app = new Application()
        .withHandler('test-handler', handler);

      expect(() => app.withSimpleHandler('test-handler', handler)).to.throw();
    });
  });
});