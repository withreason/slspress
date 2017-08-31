'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
chai.use(require('sinon-chai'));

const fs = require('fs');
const jwt = require('jsonwebtoken');
const pubKey = fs.readFileSync(`${__dirname}/auth0-bearer-authorizer.pub.key`);
const privKey = fs.readFileSync(`${__dirname}/auth0-bearer-authorizer.priv.key`);

const factory = require('../lib/auth0-bearer-authorizer');

const createSignedToken = (payload, extraOpts) => {
  const opts = Object.assign({algorithm: 'RS256'}, extraOpts);
  // backdate token by 30 seconds for test
  const extraPayload = Object.assign({iat: Math.floor(Date.now() / 1000) - 30 }, payload);
  return 'Bearer ' + jwt.sign(extraPayload, privKey, opts);
};

describe('factory', () => {

  let authFn;
  let logger;
  let event;
  let context;
  let callback;

  beforeEach(() => {
    logger = { trace: sinon.spy(), warn: sinon.spy()};
    authFn = factory(pubKey, logger);
    event = {
      methodArn: 'arn:aws:execute-api:<regionId>:<accountId>:<apiId>/<stage>/<method>/<resourcePath>'
    };
    context = {};
    callback = sinon.spy();
  });

  describe('bearer token missing', () => {
    it('should indicate unauthorized', done => {
      authFn(event, context, callback);
      setTimeout(() => {
        expect(callback).to.have.been.calledWith('Unauthorized');
        done();
      });
    });
  });

  describe('bearer token invalid format', () => {
    it('should indicate unauthorized', done => {
      event.authorizationToken = 'blah';
      authFn(event, context, callback);
      setTimeout(() => {
        expect(callback).to.have.been.calledWith('Unauthorized');
        done();
      });
    });
  });

  describe('bearer token expired', () => {
    it('should indicate unauthorized', done => {
      event.authorizationToken = createSignedToken({ sub: 'user-name'}, { expiresIn: '29s'});
      authFn(event, context, callback);
      setTimeout(() => {
        expect(callback).to.have.been.calledWith('Unauthorized');
        done();
      });
    });
  });

  describe('bearer token valid', () => {

    it('should indicate authorized', done => {
      event.authorizationToken = createSignedToken({ sub: 'user-name'}, { expiresIn: '1m'});
      authFn(event, context, callback);
      setTimeout(() => {
        expect(callback.callCount).to.equal(1);
        expect(callback.getCall(0).args[0]).to.be.null;
        expect(callback.getCall(0).args[1].context).to.eql({ id: 'user-name'});
        done();
      });
    });
  });
});
