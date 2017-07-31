'use strict';

const expect = require('chai').expect;
const OfflineManager = require('./utils/serverless-offline-manager');
const request = require('request-promise-native');

describe('Application Integration', function() {

  const offlineManager = new OfflineManager({ serverless: { servicePath: `${__dirname}/example-app` }});

  let testUrl = null;
  before(() => offlineManager.start().then(url => testUrl = url));
  after(() => offlineManager.stop());

  describe('simple handler', function () {
    it('returns a body', function () {
      return request(`${testUrl}/simple`)
        .then(body => expect(body).to.equal('Simple handler response'));
    });
  });

  describe('json response handler', function () {
    it('returns a body', function () {
      const options = {
        method: 'POST',
        uri: `${testUrl}/json-promise`,
        body: {
          testParam: 'test-1'
        },
        json: true
      };

      return request(options)
        .then(body => expect(body).to.eql({ result: 'test-result-1' }));
    });

    it('returns a 404', function () {
      const options = {
        method: 'POST',
        uri: `${testUrl}/json-promise`,
        body: {
          testParam: 'missing'
        },
        json: true,
        resolveWithFullResponse: true,
        simple: false
      };

      return request(options)
        .then(res => expect(res.statusCode).to.equal(404));
    });
  });
});