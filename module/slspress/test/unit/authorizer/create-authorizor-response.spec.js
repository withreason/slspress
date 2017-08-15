'use strict';

const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
chai.use(require('sinon-chai'));

const subject = require('../../../lib/authorizer/create-authorizer-response');

describe('create-authorizer-response', () => {
  let event;
  let callback;

  beforeEach(() => {
    event = {
      methodArn: 'arn:aws:execute-api:<regionId>:<accountId>:<apiId>/<stage>/<method>/<resourcePath>'
    };
    callback = sinon.spy();
  });

  it('should indicate 401 unauthorized if the userid is not present', () => {
    subject(undefined, undefined, event, callback);

    expect(callback).to.have.been.calledWith('Unauthorized');
  });

  it('should indicate 403 forbidden if not authorized', () => {
    subject(undefined, 'a-user', event, callback);

    expect(callback).to.have.been.calledWith(null, {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [{
          Action: 'execute-api:Invoke',
          Effect: 'Deny',
          Resource: 'arn:aws:execute-api:<regionId>:<accountId>:<apiId>/<stage>/<method>/<resourcePath>'
        }]
      },
      context: {
        id: 'a-user'
      }
    });
  });

  it('should indicate authorized if authorized', () => {
    subject(true, 'a-user', event, callback);

    expect(callback).to.have.been.calledWith(null, {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [{
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: 'arn:aws:execute-api:<regionId>:<accountId>:<apiId>/<stage>/<method>/<resourcePath>'
        }]
      },
      context: {
        id: 'a-user'
      }
    });
  });

  describe('with allowFullApiAccess option', () => {

    it('should indicate 401 unauthorized if the userid is not present', () => {
      subject(undefined, undefined, event, callback, { allowFullApiAccess: true });

      expect(callback).to.have.been.calledWith('Unauthorized');
    });

    it('should indicate 403 forbidden for full api if not authorized', () => {
      subject(undefined, 'a-user', event, callback, { allowFullApiAccess: true });

      expect(callback).to.have.been.calledWith(null, {
        principalId: 'user',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: 'arn:aws:execute-api:<regionId>:<accountId>:<apiId>/<stage>/*/*'
          }]
        },
        context: {
          id: 'a-user'
        }
      });
    });

    it('should indicate authorized for full api if authorized', () => {
      subject(true, 'a-user', event, callback, { allowFullApiAccess: true });

      expect(callback).to.have.been.calledWith(null, {
        principalId: 'user',
        policyDocument: {
          Version: '2012-10-17',
          Statement: [{
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: 'arn:aws:execute-api:<regionId>:<accountId>:<apiId>/<stage>/*/*'
          }]
        },
        context: {
          id: 'a-user'
        }
      });
    });
  });
});