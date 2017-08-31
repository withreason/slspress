'use strict';

const { createAuthorizerResponse, createLogger } = require('slspress');
const jwt = require('jsonwebtoken');

const logger = createLogger(__filename);

/**
 * Creates an authorizer that provides access based on a valid JWT bearer token. Only the RS256 algorithm is supported.
 * (When using Auth0 this is the option that should be used as the private key is protected by auth0)
 * @param publicKey the public key
 */
module.exports = (publicKey) => (event, context, callback) => {
  try {
    const encryptedToken = event.authorizationToken && event.authorizationToken.replace(/Bearer /, '');
    const token = jwt.verify(encryptedToken, publicKey, { algorithms: ['RS256']});
    if (token) {
      logger && logger.trace(`Allowing access for ${token.sub} to ${event.path}`);
    } else {
      logger && logger.warn(`Unauthorized user. event=${JSON.stringify(event)}`);
    }
    return createAuthorizerResponse(token, token && token.sub, event, callback);
  } catch (e) {
    logger && logger.warn(e, e.stack, {
      message: 'Error while validating jwt token',
      error: {
        message: e.message,
        stack: e.stack
      }
    });
    return callback('Unauthorized');
  }
};