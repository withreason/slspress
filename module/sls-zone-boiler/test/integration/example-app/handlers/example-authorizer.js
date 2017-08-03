'use strict';

const { createAuthorizerResponse } = require('../../../..');

module.exports = function (event, context, callback) {
  // very insecure if the authorization header is present we are authorized and our user id is the
  // value of the auth token.
  return createAuthorizerResponse(event.authorizationToken, event.authorizationToken, event, callback);
};