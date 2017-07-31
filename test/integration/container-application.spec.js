'use strict';

const expect = require('chai').expect;
const OfflineManager = require('./utils/serverless-offline-manager');
const request = require('request-promise-native');

const config = require('./example-container-app/config/env/config-loader-dev').config();

describe('ContainerApplication Integration', function() {

  const offlineManager = new OfflineManager({ serverless: { servicePath: `${__dirname}/example-container-app` }});

  let testUrl = null;
  before(() => offlineManager.start(config.env).then(url => testUrl = url));
  after(() => offlineManager.stop());

  describe('authorizer', function () {
    it('returns a 401 for user with no token', function () {
      const options = {
        method: 'GET',
        uri: `${testUrl}/stuff/6`,
        json: true,
        resolveWithFullResponse: true,
        simple: false
      };

      return request(options)
        .then(res => expect(res.statusCode).to.equal(401));
    });

  });

  describe('stuff', function () {
    it('returns a body for a valid id', function () {
      const expectedResponseBody = {
        id: '6',
        info: 'data-item-6'
      };

      const options = {
        method: 'GET',
        uri: `${testUrl}/stuff/6`,
        json: true,
        headers: {
          Authorization: 'superman'
        }
      };

      return request(options)
        .then(body => expect(body).to.eql(expectedResponseBody));
    });

    it('returns a 404 with custom error response for an missing id', function () {
      const options = {
        method: 'GET',
        uri: `${testUrl}/stuff/1`,
        json: true,
        headers: {
          Authorization: 'superman'
        },
        resolveWithFullResponse: true,
        simple: false
      };

      return request(options)
        .then(res => {
          expect(res.statusCode).to.equal(404);
          expect(res.body).to.eql({ customErrorResponse: {
            message: 'Could not find stuff with id 1'
          }});
        });
    });

    it('returns a 400 with custom error response for an invalid id format', function () {
      const options = {
        method: 'GET',
        uri: `${testUrl}/stuff/missing`,
        json: true,
        headers: {
          Authorization: 'superman'
        },
        resolveWithFullResponse: true,
        simple: false
      };

      return request(options)
        .then(res => {
          expect(res.statusCode).to.equal(400);
          expect(res.body).to.eql({ customErrorResponse: {
            message: 'Bad request'
          }});
        });
    });
  });

  describe('routing', function () {
    it('when hitting handler returns a body for a valid id', function () {
      const expectedResponseBody = {
        id: '6',
        info: 'data-item-6'
      };

      const options = {
        method: 'GET',
        uri: `${testUrl}/routing/stuff/6`,
        json: true,
        headers: {
          Authorization: 'superman'
        }
      };

      return request(options)
        .then(body => expect(body).to.eql(expectedResponseBody));
    });

    it('when hitting handler returns a 404 with custom error response for an invalid id', function () {
      const options = {
        method: 'GET',
        uri: `${testUrl}/routing/stuff/missing`,
        json: true,
        headers: {
          Authorization: 'superman'
        },
        resolveWithFullResponse: true,
        simple: false
      };

      return request(options)
        .then(res => {
          expect(res.statusCode).to.equal(404);
          expect(res.body).to.eql({ customErrorResponse: {
            message: 'Could not find stuff with id missing'
          }});
        });
    });

    it('when missing handler returns a 404', function () {
      const options = {
        method: 'GET',
        uri: `${testUrl}/routing/missing-route`,
        json: true,
        headers: {
          Authorization: 'superman'
        },
        resolveWithFullResponse: true,
        simple: false
      };

      return request(options)
        .then(res => expect(res.statusCode).to.equal(404));
    });
  });
});