
const buildPolicy = (event, userId, effect, allowFullApiAccess) => {
  const authResponse          = {};
  authResponse.principalId    = 'user';
  const policyDocument        = {};
  policyDocument.Version      = '2012-10-17'; // default version
  policyDocument.Statement    = [];
  const statementOne          = {};
  statementOne.Action         = 'execute-api:Invoke'; // default action
  statementOne.Effect         = effect;
  statementOne.Resource       = allowFullApiAccess ? (event.methodArn.split('/').slice(0, 2).join('/') + '/*/*') : event.methodArn;
  policyDocument.Statement[0] = statementOne;
  authResponse.policyDocument = policyDocument;
  authResponse.context        = { id: userId };
  return authResponse;
};

/**
 * Create a simple authorization response for an authorizr
 * @param authorized a boolean indicating whether the response should indicate the user is authenticated for forbibbed (403).
 * @param userId the id of the authorized user if missing the result will be  unauthorized 401
 * @param event The serverless event object
 * @param callback the serverless callback object.
 * @param options Optional -
 * {
 *  allowFullApiAccess: boolean - if true this will allow access to all endpoints on the current api and stage. (Avoids multiple authorizer calls)
 * }
 * @returns {*} the result of the serverless callback.
 */
module.exports = (authorized, userId, event, callback, options) => {
  if (!userId) {
    return callback('Unauthorized');
  }
  return callback(null, buildPolicy(event, userId, authorized ? 'Allow' : 'Deny', options && options.allowFullApiAccess));
};