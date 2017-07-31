'use strict';

const expect = require('chai').expect;

const Application = require('../../index').Application;

describe('Application', function() {
  describe('handlers', function () {
    it('stores handlers for later retrieval', done => {
      const handler = (event, context, callback) => callback(null, { mock: 'handler'});
      const handlers = new Application()
        .withHandler('test-handler', handler)
        .getHandlers();

      expect(handlers).to.have.property('test-handler');
      let capturedResponse = null;
      handlers['test-handler']({ httpMethod: 'GET' }, null, (err, val) => {
        capturedResponse = val;
      });

      setTimeout(() => {
        expect(capturedResponse).to.eql({ mock: 'handler'});
        done();
      });
    });

    it('throws an error if the same handler name is reused', function () {
      const handler = () => ({ mock: 'handler'});
      const app = new Application()
        .withHandler('test-handler', handler);

      expect(() => app.withSimpleHandler('test-handler', handler)).to.throw();
    });
  });
});