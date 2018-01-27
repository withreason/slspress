'use strict';

const assert = require('assert');
const request = require('request-promise-native');
const jwt = require('jsonwebtoken');

const assertParams = (args, { required, optional }) => {
    assert(args, 'Object needs to be provided');
    required.forEach(requiredArg => {
        assert(args[requiredArg] !== undefined, `Object{${requiredArg}} needs to be provided`);
    });
    Object.keys(args).forEach(arg => {
        assert((required && required.includes(arg)) || (optional && optional.includes(arg)), `Object{${arg}} should not be provided`);
    });
};

/**
 * This returns an object that you can call get, post, patch, put and del on.  The methods return a promise of the response body.
 * All of the methods take a identityObject property that is encrypted with the private key on each request.
 * Each method also takes a uri property that indicates the uri to request.
 * They can also take an optional expectedStatusCode property that the returned status code will be validated against.
 * If omitted then 2xx is assumed to be ok.
 * The patch, put and post methods also take an optional body property that is the request body.
 *
 * @param testUrl the base url that all susequent requests will be made under. e.g. http://localhost:3000
 * @param privateKey the private key to use.
 * @param algorithm the jwt encryption algorithm to use, defaults to RS256 if none provided.
 * @returns {{defaultHeaders: function(*=): {Authorization: string}, get: function(*=), post: function(*=), patch: function(*=), put: function(*=), del: function(*=)}}
 */
module.exports = (testUrl, privateKey, algorithm) => {
  const defaultHeaders = (identityObject) => ({
    Authorization: `Bearer ${jwt.sign(identityObject, privateKey, { algorithm: (algorithm || 'RS256')})}`
  });

  const makeRequest = (opts, identityObject, expectedStatusCode) => {
    const attribs = Object.assign({}, opts, {
      resolveWithFullResponse: true,
      simple: false,
      headers: defaultHeaders(identityObject)
    });
    attribs.uri = `${testUrl}${attribs.uri}`;
    return request(attribs)
      .then(res => {
        if (expectedStatusCode) {
          if (res.statusCode !== expectedStatusCode) {
            throw new Error(`Expected a response code of ${expectedStatusCode} but got ${res.statusCode} for request to ${attribs.uri}`)
          }
        } else {
          if (!(/^2/.test('' + res.statusCode))) {
            throw new Error(`Expected a response code of 2xx but got ${res.statusCode} for request to ${attribs.uri}`)
          }
        }
        return typeof res.body !== 'string' || !res.headers['content-type'].startsWith('application/json') ? res.body :
          res.body.length === 0 ? null : JSON.parse(res.body);
      });
  };

  return {
    defaultHeaders,
    get: (params) => {
      assertParams(params, { required: ['identityObject', 'uri'], optional: ['expectedStatusCode']});

      return makeRequest({ uri: params.uri }, params.identityObject, params.expectedStatusCode);
    },

    post: (params) => {
      assertParams(params, { required: ['identityObject', 'uri'], optional: ['body', 'expectedStatusCode']});

      return makeRequest({
        uri: params.uri,
        method: 'POST',
        body: params.body,
        json: true
      }, params.identityObject, params.expectedStatusCode);
    },

    patch: (params) => {
      assertParams(params, { required: ['identityObject', 'uri'], optional: ['body', 'expectedStatusCode']});

      return makeRequest({
        uri: params.uri,
        method: 'PATCH',
        body: params.body,
        json: true
      }, params.identityObject, params.expectedStatusCode);
    },

    put: (params) => {
      assertParams(params, { required: ['identityObject', 'uri'], optional: ['body', 'expectedStatusCode']});

      return makeRequest({
        uri: params.uri,
        method: 'PUT',
        body: params.body,
        json: true
      }, params.identityObject, params.expectedStatusCode);
    },

    del: (params) => {
      assertParams(params, { required: ['identityObject', 'uri'], optional: ['expectedStatusCode']});

      return makeRequest({ uri: params.uri, method: 'DELETE' }, params.identityObject, params.expectedStatusCode);
    },
  };
};